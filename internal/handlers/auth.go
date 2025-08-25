package handlers

import (
	"log"
	"net/http"

	"github.com/daniele/web-app-caa/internal/middleware"
	"github.com/daniele/web-app-caa/internal/models"
	"github.com/daniele/web-app-caa/internal/services"

	"github.com/gin-gonic/gin"
)

// AuthHandlers handles authentication-related requests
type AuthHandlers struct {
	userService *services.UserService
	gridService *services.GridService
}

// NewAuthHandlers creates a new AuthHandlers instance
func NewAuthHandlers() *AuthHandlers {
	return &AuthHandlers{
		userService: services.NewUserService(),
		gridService: services.NewGridService(),
	}
}

// Register handles user registration
func (h *AuthHandlers) Register(c *gin.Context) {
	log.Printf("[REGISTER] Registration attempt started")

	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[REGISTER] Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Username, password, editor password, and gridType are required.",
		})
		return
	}

	log.Printf("[REGISTER] Registration data received: username=%s, gridType=%s",
		req.Username, req.GridType)

	// Check if username already exists
	log.Printf("[REGISTER] Checking if username already exists: %s", req.Username)
	existingUser, err := h.userService.FindUserByUsername(req.Username)
	if err != nil {
		log.Printf("[REGISTER] Database error checking existing user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Database error",
			"error":   err.Error(),
		})
		return
	}

	if existingUser != nil {
		log.Printf("[REGISTER] Username already exists: %s", req.Username)
		c.JSON(http.StatusConflict, gin.H{
			"message": "Username already exists.",
		})
		return
	}

	// Create the user
	log.Printf("[REGISTER] Creating new user: %s", req.Username)
	newUser, err := h.userService.CreateUser(req.Username, req.Password, req.EditorPassword)
	if err != nil {
		log.Printf("[REGISTER] User creation failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error registering user.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[REGISTER] User created successfully: userId=%d", newUser.ID)

	// Determine the grid structure
	var selectedGrid map[string][]models.GridItemResponse
	switch req.GridType {
	case "simplified":
		selectedGrid = services.SimplifiedGrid
		log.Printf("[REGISTER] Selected simplified grid")
	case "empty":
		selectedGrid = map[string][]models.GridItemResponse{
			"home":           {},
			"systemControls": services.DefaultGrid["systemControls"],
		}
		log.Printf("[REGISTER] Selected empty grid with system controls")
	default:
		selectedGrid = services.DefaultGrid
		log.Printf("[REGISTER] Selected default grid")
	}

	// Save the grid for the new user
	log.Printf("[REGISTER] Saving grid for user: userId=%d", newUser.ID)
	if err := h.gridService.SaveGrid(selectedGrid, newUser.ID); err != nil {
		log.Printf("[REGISTER] Error saving grid: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error saving initial grid.",
			"error":   err.Error(),
		})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(newUser.ID, newUser.Username)
	if err != nil {
		log.Printf("[REGISTER] Error generating token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error generating token.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[REGISTER] JWT token generated for user: %s", req.Username)
	log.Printf("[REGISTER] Registration completed successfully for user: %s", req.Username)

	c.JSON(http.StatusCreated, models.AuthResponse{
		Message: "User and grid created successfully.",
		Token:   token,
		Status:  "pending_setup",
	})
}

// Login handles user login
func (h *AuthHandlers) Login(c *gin.Context) {
	log.Printf("[LOGIN] Login attempt started")

	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[LOGIN] Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Username and password are required.",
		})
		return
	}

	log.Printf("[LOGIN] Login attempt for username: %s", req.Username)

	// Find user
	user, err := h.userService.FindUserByUsername(req.Username)
	if err != nil {
		log.Printf("[LOGIN] Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Database error.",
			"error":   err.Error(),
		})
		return
	}

	if user == nil {
		log.Printf("[LOGIN] User not found: %s", req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid credentials.",
		})
		return
	}

	// Verify password
	log.Printf("[LOGIN] User found, verifying password for: %s", req.Username)
	if !h.userService.VerifyPassword(user.Password, req.Password) {
		log.Printf("[LOGIN] Password mismatch for user: %s", req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid credentials.",
		})
		return
	}

	// Generate token
	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		log.Printf("[LOGIN] Error generating token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error generating token.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[LOGIN] Login successful for user: %s, status: %s", req.Username, user.Status)

	c.JSON(http.StatusOK, models.LoginResponse{
		Token:  token,
		Status: user.Status,
	})
}

// CheckEditorPassword handles editor password verification
func (h *AuthHandlers) CheckEditorPassword(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userMap := user.(map[string]interface{})
	userID := userMap["userId"].(uint)

	log.Printf("[EDITOR-PASSWORD] Checking editor password for userId: %d", userID)

	var req models.CheckEditorPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Password is required."})
		return
	}

	isMatch, err := h.userService.CheckEditorPassword(userID, req.Password)
	if err != nil {
		log.Printf("[EDITOR-PASSWORD] Error checking editor password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error checking editor password.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[EDITOR-PASSWORD] Editor password check result: %t for userId: %d",
		isMatch, userID)

	c.JSON(http.StatusOK, gin.H{"success": isMatch})
}
