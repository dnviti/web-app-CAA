package migrations

import (
	"fmt"
	"log"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreateRBACMigration creates the RBAC migration that sets up roles, permissions, and default users
func CreateRBACMigration() Migration {
	return Migration{
		ID:          "001-rbac-setup",
		Name:        "001_create_rbac_system",
		Description: "Creates default roles (admin, editor, user), permissions, and initial user accounts",
		Version:     "1.0.0",
		Execute:     executeRBACMigration,
		Rollback:    rollbackRBACMigration,
	}
}

// executeRBACMigration executes the RBAC setup migration
func executeRBACMigration(db *gorm.DB) error {
	log.Printf("[RBAC MIGRATION] Executing RBAC setup migration...")

	// Create default roles
	if err := createDefaultRoles(db); err != nil {
		return fmt.Errorf("failed to create default roles: %w", err)
	}

	// Create default permissions
	if err := createDefaultPermissions(db); err != nil {
		return fmt.Errorf("failed to create default permissions: %w", err)
	}

	// Assign permissions to roles
	if err := assignPermissionsToRoles(db); err != nil {
		return fmt.Errorf("failed to assign permissions to roles: %w", err)
	}

	// Create default users
	if err := createDefaultUsers(db); err != nil {
		return fmt.Errorf("failed to create default users: %w", err)
	}

	// Assign roles to users
	if err := assignRolesToUsers(db); err != nil {
		return fmt.Errorf("failed to assign roles to users: %w", err)
	}

	log.Printf("[RBAC MIGRATION] RBAC system setup completed successfully")
	return nil
}

// createDefaultRoles creates the default roles: admin, editor, user
func createDefaultRoles(db *gorm.DB) error {
	defaultRoles := []models.Role{
		{
			Name:        "admin",
			DisplayName: "Administrator",
			Description: "Full system access with all administrative privileges",
			IsActive:    true,
		},
		{
			Name:        "editor",
			DisplayName: "Editor",
			Description: "Can manage grid items and content",
			IsActive:    true,
		},
		{
			Name:        "user",
			DisplayName: "User",
			Description: "Basic user with limited permissions",
			IsActive:    true,
		},
	}

	for _, role := range defaultRoles {
		var existingRole models.Role
		if err := db.Where("name = ?", role.Name).First(&existingRole).Error; err == gorm.ErrRecordNotFound {
			role.ID = uuid.New().String()
			if err := db.Create(&role).Error; err != nil {
				return fmt.Errorf("failed to create role %s: %w", role.Name, err)
			}
			log.Printf("[RBAC MIGRATION] Created default role: %s", role.Name)
		}
	}

	return nil
}

// createDefaultPermissions creates all the default permissions
func createDefaultPermissions(db *gorm.DB) error {
	defaultPermissions := []models.Permission{
		// User management
		{Name: "users:read", Resource: "users", Action: "read", Description: "View users"},
		{Name: "users:create", Resource: "users", Action: "create", Description: "Create users"},
		{Name: "users:update", Resource: "users", Action: "update", Description: "Update users"},
		{Name: "users:delete", Resource: "users", Action: "delete", Description: "Delete users"},

		// Role management
		{Name: "roles:read", Resource: "roles", Action: "read", Description: "View roles"},
		{Name: "roles:create", Resource: "roles", Action: "create", Description: "Create roles"},
		{Name: "roles:update", Resource: "roles", Action: "update", Description: "Update roles"},
		{Name: "roles:delete", Resource: "roles", Action: "delete", Description: "Delete roles"},

		// Grid management
		{Name: "grids:read", Resource: "grids", Action: "read", Description: "View grid items"},
		{Name: "grids:create", Resource: "grids", Action: "create", Description: "Create grid items"},
		{Name: "grids:update", Resource: "grids", Action: "update", Description: "Update grid items"},
		{Name: "grids:delete", Resource: "grids", Action: "delete", Description: "Delete grid items"},
		{Name: "grids:own", Resource: "grids", Action: "own", Description: "Manage own grid items"},

		// AI services
		{Name: "ai:use", Resource: "ai", Action: "use", Description: "Use AI services"},

		// System management
		{Name: "system:admin", Resource: "system", Action: "admin", Description: "System administration"},
	}

	for _, perm := range defaultPermissions {
		var existingPerm models.Permission
		if err := db.Where("name = ?", perm.Name).First(&existingPerm).Error; err == gorm.ErrRecordNotFound {
			perm.ID = uuid.New().String()
			if err := db.Create(&perm).Error; err != nil {
				return fmt.Errorf("failed to create permission %s: %w", perm.Name, err)
			}
		}
	}

	return nil
}

// assignPermissionsToRoles assigns permissions to the appropriate roles
func assignPermissionsToRoles(db *gorm.DB) error {
	rolePermissions := map[string][]string{
		"admin": {
			"users:read", "users:create", "users:update", "users:delete",
			"roles:read", "roles:create", "roles:update", "roles:delete",
			"grids:read", "grids:create", "grids:update", "grids:delete",
			"ai:use", "system:admin",
		},
		"editor": {
			"grids:read", "grids:create", "grids:update", "grids:delete", "grids:own",
			"ai:use",
		},
		"user": {
			"grids:own", "ai:use",
		},
	}

	for roleName, permNames := range rolePermissions {
		var role models.Role
		if err := db.Where("name = ?", roleName).First(&role).Error; err != nil {
			continue
		}

		for _, permName := range permNames {
			var perm models.Permission
			if err := db.Where("name = ?", permName).First(&perm).Error; err != nil {
				continue
			}

			// Check if role-permission relationship exists
			var rolePermission models.RolePermission
			if err := db.Where("role_id = ? AND permission_id = ?", role.ID, perm.ID).First(&rolePermission).Error; err == gorm.ErrRecordNotFound {
				// Create the relationship
				rolePermission = models.RolePermission{
					RoleID:       role.ID,
					PermissionID: perm.ID,
				}
				if err := db.Create(&rolePermission).Error; err != nil {
					return fmt.Errorf("failed to assign permission %s to role %s: %w", permName, roleName, err)
				}

				// Note: Casbin policies will be loaded by the RBAC service after migration
				log.Printf("[RBAC MIGRATION] Assigned permission '%s' to role '%s'", permName, roleName)
			}
		}
	}

	return nil
}

// createDefaultUsers creates the default admin, editor, and user accounts
func createDefaultUsers(db *gorm.DB) error {
	defaultUsers := []models.User{
		{
			Username: "admin",
			Email:    "admin@webapp-caa.local",
			Password: "admin123", // Will be hashed by BeforeSave hook
			Status:   "active",
			IsActive: true,
		},
		{
			Username: "editor",
			Email:    "editor@webapp-caa.local",
			Password: "editor123", // Will be hashed by BeforeSave hook
			Status:   "active",
			IsActive: true,
		},
		{
			Username: "user",
			Email:    "user@webapp-caa.local",
			Password: "user123", // Will be hashed by BeforeSave hook
			Status:   "active",
			IsActive: true,
		},
	}

	for _, user := range defaultUsers {
		var existingUser models.User
		if err := db.Where("username = ?", user.Username).First(&existingUser).Error; err == gorm.ErrRecordNotFound {
			user.ID = uuid.New().String()
			if err := db.Create(&user).Error; err != nil {
				return fmt.Errorf("failed to create default user %s: %w", user.Username, err)
			}
			log.Printf("[RBAC MIGRATION] Created default user: %s", user.Username)
		}
	}

	return nil
}

// assignRolesToUsers assigns the appropriate roles to default users
func assignRolesToUsers(db *gorm.DB) error {
	userRoles := map[string]string{
		"admin":  "admin",
		"editor": "editor",
		"user":   "user",
	}

	for username, roleName := range userRoles {
		var user models.User
		if err := db.Where("username = ?", username).First(&user).Error; err != nil {
			continue
		}

		var role models.Role
		if err := db.Where("name = ?", roleName).First(&role).Error; err != nil {
			continue
		}

		// Check if user-role relationship exists
		var userRole models.UserRole
		if err := db.Where("user_id = ? AND role_id = ?", user.ID, role.ID).First(&userRole).Error; err == gorm.ErrRecordNotFound {
			// Create the relationship
			userRole = models.UserRole{
				UserID: user.ID,
				RoleID: role.ID,
			}
			if err := db.Create(&userRole).Error; err != nil {
				return fmt.Errorf("failed to assign role %s to user %s: %w", roleName, username, err)
			}
			log.Printf("[RBAC MIGRATION] Assigned role '%s' to user '%s'", roleName, username)
		}
	}

	return nil
}

// rollbackRBACMigration rolls back the RBAC migration
func rollbackRBACMigration(db *gorm.DB) error {
	log.Printf("[RBAC MIGRATION] Rolling back RBAC migration...")

	// Remove user-role relationships
	if err := db.Where("1 = 1").Delete(&models.UserRole{}).Error; err != nil {
		return fmt.Errorf("failed to remove user roles: %w", err)
	}

	// Remove role-permission relationships
	if err := db.Where("1 = 1").Delete(&models.RolePermission{}).Error; err != nil {
		return fmt.Errorf("failed to remove role permissions: %w", err)
	}

	// Remove default users
	defaultUsernames := []string{"admin", "editor", "user"}
	for _, username := range defaultUsernames {
		if err := db.Where("username = ?", username).Delete(&models.User{}).Error; err != nil {
			return fmt.Errorf("failed to remove user %s: %w", username, err)
		}
	}

	// Remove permissions
	if err := db.Where("1 = 1").Delete(&models.Permission{}).Error; err != nil {
		return fmt.Errorf("failed to remove permissions: %w", err)
	}

	// Remove roles
	defaultRoles := []string{"admin", "editor", "user"}
	for _, roleName := range defaultRoles {
		if err := db.Where("name = ?", roleName).Delete(&models.Role{}).Error; err != nil {
			return fmt.Errorf("failed to remove role %s: %w", roleName, err)
		}
	}

	log.Printf("[RBAC MIGRATION] RBAC migration rollback completed")
	return nil
}
