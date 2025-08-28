package handlers

import (
	"net/http"

	"github.com/daniele/web-app-caa/internal/services"
	"github.com/gin-gonic/gin"
)

// RBACHandler handles RBAC-related operations
type RBACHandler struct {
	rbacService *services.RBACService
}

// NewRBACHandler creates a new RBAC handler
func NewRBACHandler(rbacService *services.RBACService) *RBACHandler {
	return &RBACHandler{
		rbacService: rbacService,
	}
}

// GetUserRoles gets all roles for a user
// @Summary Get user roles
// @Description Get all roles assigned to a user
// @Tags Auth
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {array} models.Role
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/users/{user_id}/roles [get]
func (h *RBACHandler) GetUserRoles(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	roles, err := h.rbacService.GetUserRoles(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"roles": roles})
}

// GetUserPermissions gets all permissions for a user through their roles
// @Summary Get user permissions
// @Description Get all permissions assigned to a user through their roles
// @Tags Auth
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {array} models.Permission
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/users/{user_id}/permissions [get]
func (h *RBACHandler) GetUserPermissions(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	permissions, err := h.rbacService.GetUserPermissions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permissions": permissions})
}

// AssignUserRole assigns a role to a user
// @Summary Assign role to user
// @Description Assign a role to a user
// @Tags Auth
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Param role_name path string true "Role Name"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/users/{user_id}/roles/{role_name} [post]
func (h *RBACHandler) AssignUserRole(c *gin.Context) {
	userID := c.Param("user_id")
	roleName := c.Param("role_name")

	if userID == "" || roleName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID and role name are required"})
		return
	}

	if err := h.rbacService.AssignUserRole(userID, roleName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role assigned successfully"})
}

// RemoveUserRole removes a role from a user
// @Summary Remove role from user
// @Description Remove a role from a user
// @Tags Auth
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Param role_name path string true "Role Name"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/users/{user_id}/roles/{role_name} [delete]
func (h *RBACHandler) RemoveUserRole(c *gin.Context) {
	userID := c.Param("user_id")
	roleName := c.Param("role_name")

	if userID == "" || roleName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID and role name are required"})
		return
	}

	if err := h.rbacService.RemoveUserRole(userID, roleName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role removed successfully"})
}

// GetAllRoles gets all available roles
// @Summary Get all roles
// @Description Get all available roles in the system
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {array} models.Role
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/roles [get]
func (h *RBACHandler) GetAllRoles(c *gin.Context) {
	roles, err := h.rbacService.GetAllRoles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"roles": roles})
}

// GetAllPermissions gets all available permissions
// @Summary Get all permissions
// @Description Get all available permissions in the system
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {array} models.Permission
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/permissions [get]
func (h *RBACHandler) GetAllPermissions(c *gin.Context) {
	permissions, err := h.rbacService.GetAllPermissions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permissions": permissions})
}

// CreateRoleRequest represents the request body for creating a role
type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	DisplayName string `json:"display_name" binding:"required"`
	Description string `json:"description"`
}

// CreateRole creates a new role
// @Summary Create role
// @Description Create a new role
// @Tags Auth
// @Accept json
// @Produce json
// @Param role body CreateRoleRequest true "Role data"
// @Success 201 {object} models.Role
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/roles [post]
func (h *RBACHandler) CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role, err := h.rbacService.CreateRole(req.Name, req.DisplayName, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"role": role})
}

// CreatePermissionRequest represents the request body for creating a permission
type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Resource    string `json:"resource" binding:"required"`
	Action      string `json:"action" binding:"required"`
	Description string `json:"description"`
}

// CreatePermission creates a new permission
// @Summary Create permission
// @Description Create a new permission
// @Tags Auth
// @Accept json
// @Produce json
// @Param permission body CreatePermissionRequest true "Permission data"
// @Success 201 {object} models.Permission
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/permissions [post]
func (h *RBACHandler) CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permission, err := h.rbacService.CreatePermission(req.Name, req.Resource, req.Action, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"permission": permission})
}

// AssignPermissionToRole assigns a permission to a role
// @Summary Assign permission to role
// @Description Assign a permission to a role
// @Tags Auth
// @Accept json
// @Produce json
// @Param role_name path string true "Role Name"
// @Param permission_name path string true "Permission Name"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/roles/{role_name}/permissions/{permission_name} [post]
func (h *RBACHandler) AssignPermissionToRole(c *gin.Context) {
	roleName := c.Param("role_name")
	permissionName := c.Param("permission_name")

	if roleName == "" || permissionName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role name and permission name are required"})
		return
	}

	if err := h.rbacService.AssignPermissionToRole(roleName, permissionName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission assigned to role successfully"})
}

// RemovePermissionFromRole removes a permission from a role
// @Summary Remove permission from role
// @Description Remove a permission from a role
// @Tags Auth
// @Accept json
// @Produce json
// @Param role_name path string true "Role Name"
// @Param permission_name path string true "Permission Name"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/roles/{role_name}/permissions/{permission_name} [delete]
func (h *RBACHandler) RemovePermissionFromRole(c *gin.Context) {
	roleName := c.Param("role_name")
	permissionName := c.Param("permission_name")

	if roleName == "" || permissionName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role name and permission name are required"})
		return
	}

	if err := h.rbacService.RemovePermissionFromRole(roleName, permissionName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission removed from role successfully"})
}

// CheckPermission checks if a user has a specific permission
// @Summary Check user permission
// @Description Check if a user has permission to perform an action on a resource
// @Tags Auth
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Param resource query string true "Resource"
// @Param action query string true "Action"
// @Success 200 {object} map[string]bool
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /auth/rbac/users/{user_id}/check-permission [get]
func (h *RBACHandler) CheckPermission(c *gin.Context) {
	userID := c.Param("user_id")
	resource := c.Query("resource")
	action := c.Query("action")

	if userID == "" || resource == "" || action == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID, resource, and action are required"})
		return
	}

	allowed, err := h.rbacService.CheckPermission(userID, resource, action)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"allowed": allowed})
}
