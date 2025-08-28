package services

import (
	"fmt"
	"log"
	"strings"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"github.com/daniele/web-app-caa/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RBACService handles role-based access control operations
type RBACService struct {
	db       *gorm.DB
	enforcer *casbin.Enforcer
}

// NewRBACService creates a new RBAC service instance
func NewRBACService(db *gorm.DB, modelPath string) (*RBACService, error) {
	// Initialize the GORM adapter for Casbin
	adapter, err := gormadapter.NewAdapterByDB(db)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize gorm adapter: %w", err)
	}

	// Create the enforcer with the model file and adapter
	enforcer, err := casbin.NewEnforcer(modelPath, adapter)
	if err != nil {
		return nil, fmt.Errorf("failed to create casbin enforcer: %w", err)
	}

	// Load policy from database
	if err := enforcer.LoadPolicy(); err != nil {
		return nil, fmt.Errorf("failed to load policy: %w", err)
	}

	service := &RBACService{
		db:       db,
		enforcer: enforcer,
	}

	// Load policy to ensure all policies are in place (migrations should have run at startup)
	if err := enforcer.LoadPolicy(); err != nil {
		return nil, fmt.Errorf("failed to load policy: %w", err)
	}

	// Sync Casbin policies with the database
	if err := service.syncCasbinPolicies(); err != nil {
		log.Printf("[RBAC] Warning: Failed to sync Casbin policies: %v", err)
	}

	log.Printf("[RBAC] RBAC service initialized successfully")
	return service, nil
}

// syncCasbinPolicies synchronizes Casbin policies with the database role-permission relationships
func (s *RBACService) syncCasbinPolicies() error {
	// Clear existing policies
	s.enforcer.ClearPolicy()

	// Get all role-permission relationships from database
	var rolePermissions []models.RolePermission
	if err := s.db.Preload("Role").Preload("Permission").Find(&rolePermissions).Error; err != nil {
		return fmt.Errorf("failed to load role permissions: %w", err)
	}

	// Add policies to Casbin
	for _, rp := range rolePermissions {
		if rp.Role.IsActive && rp.Permission.IsActive {
			_, err := s.enforcer.AddPolicy(rp.Role.Name, rp.Permission.Resource, rp.Permission.Action)
			if err != nil {
				log.Printf("[RBAC] Warning: Failed to add policy for role %s: %v", rp.Role.Name, err)
			}
		}
	}

	// Save policies to database
	return s.enforcer.SavePolicy()
}

// CheckPermission checks if a user has permission to perform an action on a resource
func (s *RBACService) CheckPermission(userID, resource, action string) (bool, error) {
	// Get user's roles
	roles, err := s.GetUserRoles(userID)
	if err != nil {
		return false, err
	}

	// Check each role
	for _, role := range roles {
		if allowed, err := s.enforcer.Enforce(role.Name, resource, action); err != nil {
			return false, err
		} else if allowed {
			return true, nil
		}
	}

	return false, nil
}

// AssignUserRole assigns a role to a user
func (s *RBACService) AssignUserRole(userID, roleName string) error {
	// Get role by name
	var role models.Role
	if err := s.db.Where("name = ? AND is_active = ?", roleName, true).First(&role).Error; err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	// Check if user exists
	var user models.User
	if err := s.db.Where("id = ? AND is_active = ?", userID, true).First(&user).Error; err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Check if relationship already exists
	var userRole models.UserRole
	if err := s.db.Where("user_id = ? AND role_id = ?", userID, role.ID).First(&userRole).Error; err == gorm.ErrRecordNotFound {
		// Create the relationship
		userRole = models.UserRole{
			UserID: userID,
			RoleID: role.ID,
		}
		if err := s.db.Create(&userRole).Error; err != nil {
			return fmt.Errorf("failed to assign role: %w", err)
		}

		// Add grouping policy to Casbin (user belongs to role)
		if _, err := s.enforcer.AddGroupingPolicy(userID, roleName); err != nil {
			return fmt.Errorf("failed to add grouping policy: %w", err)
		}

		return s.enforcer.SavePolicy()
	}

	return nil
}

// RemoveUserRole removes a role from a user
func (s *RBACService) RemoveUserRole(userID, roleName string) error {
	// Get role by name
	var role models.Role
	if err := s.db.Where("name = ?", roleName).First(&role).Error; err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	// Remove the relationship
	if err := s.db.Where("user_id = ? AND role_id = ?", userID, role.ID).Delete(&models.UserRole{}).Error; err != nil {
		return fmt.Errorf("failed to remove role: %w", err)
	}

	// Remove grouping policy from Casbin
	if _, err := s.enforcer.RemoveGroupingPolicy(userID, roleName); err != nil {
		return fmt.Errorf("failed to remove grouping policy: %w", err)
	}

	return s.enforcer.SavePolicy()
}

// GetUserRoles gets all roles for a user
func (s *RBACService) GetUserRoles(userID string) ([]models.Role, error) {
	var user models.User
	if err := s.db.Preload("Roles").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	roles := make([]models.Role, len(user.Roles))
	for i, role := range user.Roles {
		roles[i] = *role
	}

	return roles, nil
}

// GetUserPermissions gets all permissions for a user through their roles
func (s *RBACService) GetUserPermissions(userID string) ([]models.Permission, error) {
	roles, err := s.GetUserRoles(userID)
	if err != nil {
		return nil, err
	}

	permissionMap := make(map[string]models.Permission)

	for _, role := range roles {
		var roleWithPermissions models.Role
		if err := s.db.Preload("Permissions").Where("id = ?", role.ID).First(&roleWithPermissions).Error; err != nil {
			continue
		}

		for _, perm := range roleWithPermissions.Permissions {
			permissionMap[perm.ID] = *perm
		}
	}

	permissions := make([]models.Permission, 0, len(permissionMap))
	for _, perm := range permissionMap {
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// CreateRole creates a new role
func (s *RBACService) CreateRole(name, displayName, description string) (*models.Role, error) {
	role := models.Role{
		ID:          uuid.New().String(),
		Name:        strings.ToLower(strings.TrimSpace(name)),
		DisplayName: strings.TrimSpace(displayName),
		Description: description,
		IsActive:    true,
	}

	if err := s.db.Create(&role).Error; err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	return &role, nil
}

// CreatePermission creates a new permission
func (s *RBACService) CreatePermission(name, resource, action, description string) (*models.Permission, error) {
	permission := models.Permission{
		ID:          uuid.New().String(),
		Name:        strings.ToLower(strings.TrimSpace(name)),
		Resource:    strings.ToLower(strings.TrimSpace(resource)),
		Action:      strings.ToLower(strings.TrimSpace(action)),
		Description: description,
		IsActive:    true,
	}

	if err := s.db.Create(&permission).Error; err != nil {
		return nil, fmt.Errorf("failed to create permission: %w", err)
	}

	return &permission, nil
}

// AssignPermissionToRole assigns a permission to a role
func (s *RBACService) AssignPermissionToRole(roleName, permissionName string) error {
	// Get role
	var role models.Role
	if err := s.db.Where("name = ?", roleName).First(&role).Error; err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	// Get permission
	var permission models.Permission
	if err := s.db.Where("name = ?", permissionName).First(&permission).Error; err != nil {
		return fmt.Errorf("permission not found: %w", err)
	}

	// Check if relationship already exists
	var rolePermission models.RolePermission
	if err := s.db.Where("role_id = ? AND permission_id = ?", role.ID, permission.ID).First(&rolePermission).Error; err == gorm.ErrRecordNotFound {
		// Create the relationship
		rolePermission = models.RolePermission{
			RoleID:       role.ID,
			PermissionID: permission.ID,
		}
		if err := s.db.Create(&rolePermission).Error; err != nil {
			return fmt.Errorf("failed to assign permission to role: %w", err)
		}

		// Add policy to Casbin
		if _, err := s.enforcer.AddPolicy(roleName, permission.Resource, permission.Action); err != nil {
			return fmt.Errorf("failed to add policy: %w", err)
		}

		return s.enforcer.SavePolicy()
	}

	return nil
}

// RemovePermissionFromRole removes a permission from a role
func (s *RBACService) RemovePermissionFromRole(roleName, permissionName string) error {
	// Get role
	var role models.Role
	if err := s.db.Where("name = ?", roleName).First(&role).Error; err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	// Get permission
	var permission models.Permission
	if err := s.db.Where("name = ?", permissionName).First(&permission).Error; err != nil {
		return fmt.Errorf("permission not found: %w", err)
	}

	// Remove the relationship
	if err := s.db.Where("role_id = ? AND permission_id = ?", role.ID, permission.ID).Delete(&models.RolePermission{}).Error; err != nil {
		return fmt.Errorf("failed to remove permission from role: %w", err)
	}

	// Remove policy from Casbin
	if _, err := s.enforcer.RemovePolicy(roleName, permission.Resource, permission.Action); err != nil {
		return fmt.Errorf("failed to remove policy: %w", err)
	}

	return s.enforcer.SavePolicy()
}

// GetAllRoles gets all active roles
func (s *RBACService) GetAllRoles() ([]models.Role, error) {
	var roles []models.Role
	if err := s.db.Where("is_active = ?", true).Find(&roles).Error; err != nil {
		return nil, fmt.Errorf("failed to get roles: %w", err)
	}
	return roles, nil
}

// GetAllPermissions gets all active permissions
func (s *RBACService) GetAllPermissions() ([]models.Permission, error) {
	var permissions []models.Permission
	if err := s.db.Where("is_active = ?", true).Find(&permissions).Error; err != nil {
		return nil, fmt.Errorf("failed to get permissions: %w", err)
	}
	return permissions, nil
}
