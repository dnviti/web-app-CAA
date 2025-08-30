package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/daniele/web-app-caa/internal/services"
	"github.com/gin-gonic/gin"
)

// UserHandler handles user management operations
type UserHandler struct {
	userService *services.UserManagementService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService *services.UserManagementService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetAllUsers retrieves all users with optional pagination and filtering
// @Summary Get all users
// @Description Get all users in the system with optional pagination and filtering
// @Tags Users
// @Accept json
// @Produce json
// @Param page query int false "Page number (default 1)"
// @Param limit query int false "Items per page (default 10, max 100)"
// @Param search query string false "Search by username or email"
// @Param status query string false "Filter by status (pending_setup, active, inactive)"
// @Param is_active query boolean false "Filter by active status"
// @Success 200 {object} models.UserListResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/users [get]
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	// Parse pagination parameters
	page := 1
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 10
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	// Parse filter parameters
	search := strings.TrimSpace(c.Query("search"))
	status := c.Query("status")

	var isActive *bool
	if isActiveStr := c.Query("is_active"); isActiveStr != "" {
		if active, err := strconv.ParseBool(isActiveStr); err == nil {
			isActive = &active
		}
	}

	users, total, err := h.userService.GetAllUsers(page, limit, search, status, isActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format
	userResponses := make([]models.UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = models.UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Status:    user.Status,
			IsActive:  user.IsActive,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
			Roles:     user.Roles,
		}
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	response := models.UserListResponse{
		Users:      userResponses,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// GetUser retrieves a specific user by ID
// @Summary Get user by ID
// @Description Get a specific user by their ID
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} models.UserResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/users/{id} [get]
func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	response := models.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Status:    user.Status,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
		Roles:     user.Roles,
	}

	c.JSON(http.StatusOK, response)
}

// CreateUser creates a new user (admin only)
// @Summary Create user
// @Description Create a new user account (admin only)
// @Tags Users
// @Accept json
// @Produce json
// @Param user body models.CreateUserRequest true "User data"
// @Success 201 {object} models.UserResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default for is_active if not provided
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	user, err := h.userService.CreateUser(req.Username, req.Email, req.Password, req.EditorPassword, isActive)
	if err != nil {
		if strings.Contains(err.Error(), "username already exists") || strings.Contains(err.Error(), "email already exists") {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	response := models.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Status:    user.Status,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateUser updates an existing user
// @Summary Update user
// @Description Update an existing user's information
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param user body models.UpdateUserRequest true "Updated user data"
// @Success 200 {object} models.UserResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/users/{id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.UpdateUser(userID, req.Username, req.Email, req.Password, req.EditorPassword, req.Status, req.IsActive)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else if strings.Contains(err.Error(), "username already exists") || strings.Contains(err.Error(), "email already exists") {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	response := models.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Status:    user.Status,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, response)
}

// DeleteUser deactivates a user (soft delete)
// @Summary Delete user
// @Description Deactivate a user account (soft delete)
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	err := h.userService.DeactivateUser(userID)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deactivated successfully"})
}

// GetUserActivity retrieves user activity logs
// @Summary Get user activity
// @Description Get activity logs for a specific user
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param page query int false "Page number (default 1)"
// @Param limit query int false "Items per page (default 20)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/users/{id}/activity [get]
func (h *UserHandler) GetUserActivity(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// Parse pagination parameters
	page := 1
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	activities, total, err := h.userService.GetUserActivity(userID, page, limit)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"activities":  activities,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

// BulkUserOperations performs bulk operations on users
// @Summary Bulk user operations
// @Description Perform bulk operations on multiple users
// @Tags Users
// @Accept json
// @Produce json
// @Param operation body models.BulkUserOperationRequest true "Bulk operation request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/users/bulk [post]
func (h *UserHandler) BulkUserOperations(c *gin.Context) {
	var req models.BulkUserOperationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.UserIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one user ID is required"})
		return
	}

	// Validate role operations
	if (req.Operation == "assign_role" || req.Operation == "remove_role") && req.RoleName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role name is required for role operations"})
		return
	}

	results, err := h.userService.BulkUserOperations(req.UserIDs, req.Operation, req.RoleName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"operation": req.Operation,
		"results":   results,
	})
}
