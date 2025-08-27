package auth

import (
	"log"
	"net/http"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/gin-gonic/gin"
)

// Handler handles authentication HTTP requests
type Handler struct {
	authService AuthService
}

// NewHandler creates a new authentication handler
func NewHandler(authService AuthService) *Handler {
	return &Handler{
		authService: authService,
	}
}

// Register handles user registration requests
// @Summary Register a new user
// @Description Register a new user with username, password, editor password, and grid type
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "Registration request"
// @Success 201 {object} models.AuthResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 409 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	log.Printf("[AUTH-HANDLER] Registration request started")

	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[AUTH-HANDLER] Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username, password, editor password, and gridType are required",
		})
		return
	}

	log.Printf("[AUTH-HANDLER] Registration data received: username=%s, gridType=%s",
		req.Username, req.GridType)

	user, token, err := h.authService.Register(&req)
	if err != nil {
		log.Printf("[AUTH-HANDLER] Registration failed: %v", err)

		switch err {
		case ErrUserExists:
			c.JSON(http.StatusConflict, gin.H{
				"error": "Username already exists",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Registration failed",
			})
		}
		return
	}

	log.Printf("[AUTH-HANDLER] Registration successful for user: %s", user.Username)

	c.JSON(http.StatusCreated, models.AuthResponse{
		Message: "User registered successfully",
		Token:   token,
		Status:  user.Status,
	})
}

// Login handles user login requests
// @Summary Login user
// @Description Authenticate user with username and password
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login request"
// @Success 200 {object} models.LoginResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	log.Printf("[AUTH-HANDLER] Login request started")

	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[AUTH-HANDLER] Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username and password are required",
		})
		return
	}

	log.Printf("[AUTH-HANDLER] Login attempt for username: %s", req.Username)

	user, token, err := h.authService.Login(&req)
	if err != nil {
		log.Printf("[AUTH-HANDLER] Login failed: %v", err)

		switch err {
		case ErrInvalidCredentials:
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid username or password",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Login failed",
			})
		}
		return
	}

	log.Printf("[AUTH-HANDLER] Login successful for user: %s", user.Username)

	c.JSON(http.StatusOK, models.LoginResponse{
		Token:  token,
		Status: user.Status,
	})
}

// CurrentUser returns the current authenticated user
// @Summary Get current user
// @Description Get the current authenticated user information
// @Tags Auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.User
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /auth/verify [get]
func (h *Handler) CurrentUser(c *gin.Context) {
	userID := GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	user, err := h.authService.GetCurrentUser(userID)
	if err != nil {
		log.Printf("[AUTH-HANDLER] Error getting current user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

// CheckEditorPassword validates editor password
// @Summary Check editor password
// @Description Validate the editor password for the current user
// @Tags Auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CheckEditorPasswordRequest true "Editor password check request"
// @Success 200 {object} models.SuccessResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Router /check-editor-password [post]
func (h *Handler) CheckEditorPassword(c *gin.Context) {
	userID := GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var req models.CheckEditorPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password is required",
		})
		return
	}

	log.Printf("[AUTH-HANDLER] Checking editor password for user ID: %d", userID)

	isValid, err := h.authService.ValidateEditorPassword(userID, req.Password)
	if err != nil {
		log.Printf("[AUTH-HANDLER] Error validating editor password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error validating password",
		})
		return
	}

	if !isValid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"valid": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid": true,
	})
}
