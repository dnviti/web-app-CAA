package database

import (
	"log"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SeedRBACData seeds the database with default RBAC data (roles, permissions, users)
// This function is idempotent - it can be run multiple times safely
func SeedRBACData(db *gorm.DB) error {
	log.Printf("[DATABASE SEEDING] Starting RBAC data seeding...")

	// Seed default roles
	if err := seedDefaultRoles(db); err != nil {
		return err
	}

	// Seed default permissions
	if err := seedDefaultPermissions(db); err != nil {
		return err
	}

	// Assign permissions to roles
	if err := assignPermissionsToRoles(db); err != nil {
		return err
	}

	// Seed default users
	if err := seedDefaultUsers(db); err != nil {
		return err
	}

	// Assign roles to users
	if err := assignRolesToUsers(db); err != nil {
		return err
	}

	log.Printf("[DATABASE SEEDING] RBAC data seeding completed successfully")
	return nil
}

// seedDefaultRoles creates the default roles: admin, editor, user
func seedDefaultRoles(db *gorm.DB) error {
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
				return err
			}
			log.Printf("[DATABASE SEEDING] Created default role: %s", role.Name)
		} else {
			log.Printf("[DATABASE SEEDING] Role %s already exists, skipping", role.Name)
		}
	}

	return nil
}

// seedDefaultPermissions creates all the default permissions
func seedDefaultPermissions(db *gorm.DB) error {
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

		// Permission management
		{Name: "permissions:read", Resource: "permissions", Action: "read", Description: "View permissions"},
		{Name: "permissions:create", Resource: "permissions", Action: "create", Description: "Create permissions"},
		{Name: "permissions:update", Resource: "permissions", Action: "update", Description: "Update permissions"},
		{Name: "permissions:delete", Resource: "permissions", Action: "delete", Description: "Delete permissions"},

		// Grid management
		{Name: "grids:read", Resource: "grids", Action: "read", Description: "View grid items"},
		{Name: "grids:create", Resource: "grids", Action: "create", Description: "Create grid items"},
		{Name: "grids:update", Resource: "grids", Action: "update", Description: "Update grid items"},
		{Name: "grids:delete", Resource: "grids", Action: "delete", Description: "Delete grid items"},

		// System management
		{Name: "system:admin", Resource: "system", Action: "admin", Description: "System administration"},
		{Name: "system:config", Resource: "system", Action: "config", Description: "System configuration"},

		// AI services
		{Name: "ai:read", Resource: "ai", Action: "read", Description: "Access AI services"},
		{Name: "ai:use", Resource: "ai", Action: "use", Description: "Use AI services"},

		// Authentication
		{Name: "auth:manage", Resource: "auth", Action: "manage", Description: "Manage authentication"},
	}

	for _, permission := range defaultPermissions {
		var existingPermission models.Permission
		if err := db.Where("name = ?", permission.Name).First(&existingPermission).Error; err == gorm.ErrRecordNotFound {
			permission.ID = uuid.New().String()
			permission.IsActive = true
			if err := db.Create(&permission).Error; err != nil {
				return err
			}
			log.Printf("[DATABASE SEEDING] Created permission: %s", permission.Name)
		}
	}

	return nil
}

// assignPermissionsToRoles assigns permissions to their respective roles
func assignPermissionsToRoles(db *gorm.DB) error {
	// Get roles
	var adminRole, editorRole, userRole models.Role
	if err := db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		return err
	}
	if err := db.Where("name = ?", "editor").First(&editorRole).Error; err != nil {
		return err
	}
	if err := db.Where("name = ?", "user").First(&userRole).Error; err != nil {
		return err
	}

	// Admin gets all permissions
	var allPermissions []models.Permission
	if err := db.Find(&allPermissions).Error; err != nil {
		return err
	}

	// Assign all permissions to admin (if not already assigned)
	for _, permission := range allPermissions {
		var existing models.RolePermission
		if err := db.Where("role_id = ? AND permission_id = ?", adminRole.ID, permission.ID).
			First(&existing).Error; err == gorm.ErrRecordNotFound {
			rolePermission := models.RolePermission{
				RoleID:       adminRole.ID,
				PermissionID: permission.ID,
			}
			if err := db.Create(&rolePermission).Error; err != nil {
				return err
			}
		}
	}

	// Editor permissions
	editorPermissions := []string{
		"users:read", "grids:read", "grids:create", "grids:update", "grids:delete", "ai:read", "ai:use",
	}
	for _, permName := range editorPermissions {
		var permission models.Permission
		if err := db.Where("name = ?", permName).First(&permission).Error; err != nil {
			continue // Skip if permission doesn't exist
		}

		var existing models.RolePermission
		if err := db.Where("role_id = ? AND permission_id = ?", editorRole.ID, permission.ID).
			First(&existing).Error; err == gorm.ErrRecordNotFound {
			rolePermission := models.RolePermission{
				RoleID:       editorRole.ID,
				PermissionID: permission.ID,
			}
			if err := db.Create(&rolePermission).Error; err != nil {
				return err
			}
		}
	}

	// User permissions (basic read access)
	userPermissions := []string{
		"grids:read", "ai:read", "ai:use",
	}
	for _, permName := range userPermissions {
		var permission models.Permission
		if err := db.Where("name = ?", permName).First(&permission).Error; err != nil {
			continue // Skip if permission doesn't exist
		}

		var existing models.RolePermission
		if err := db.Where("role_id = ? AND permission_id = ?", userRole.ID, permission.ID).
			First(&existing).Error; err == gorm.ErrRecordNotFound {
			rolePermission := models.RolePermission{
				RoleID:       userRole.ID,
				PermissionID: permission.ID,
			}
			if err := db.Create(&rolePermission).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

// seedDefaultUsers creates default users if they don't exist
func seedDefaultUsers(db *gorm.DB) error {
	defaultUsers := []models.User{
		{
			Username:       "admin",
			Email:          "admin@caa-app.local",
			Password:       "admin123",  // Will be hashed by BeforeSave hook
			EditorPassword: "editor123", // Will be hashed by BeforeSave hook
			Status:         "active",
			IsActive:       true,
		},
		{
			Username:       "editor",
			Email:          "editor@caa-app.local",
			Password:       "editor123",
			EditorPassword: "editor123",
			Status:         "active",
			IsActive:       true,
		},
		{
			Username: "user",
			Email:    "user@caa-app.local",
			Password: "user123",
			Status:   "pending_setup",
			IsActive: true,
		},
	}

	for _, user := range defaultUsers {
		var existingUser models.User
		if err := db.Where("username = ?", user.Username).First(&existingUser).Error; err == gorm.ErrRecordNotFound {
			user.ID = uuid.New().String()
			if err := db.Create(&user).Error; err != nil {
				return err
			}
			log.Printf("[DATABASE SEEDING] Created default user: %s", user.Username)
		} else {
			log.Printf("[DATABASE SEEDING] User %s already exists, skipping", user.Username)
		}
	}

	return nil
}

// assignRolesToUsers assigns default roles to default users
func assignRolesToUsers(db *gorm.DB) error {
	// Get users
	var adminUser, editorUser, regularUser models.User
	if err := db.Where("username = ?", "admin").First(&adminUser).Error; err != nil {
		return err
	}
	if err := db.Where("username = ?", "editor").First(&editorUser).Error; err != nil {
		return err
	}
	if err := db.Where("username = ?", "user").First(&regularUser).Error; err != nil {
		return err
	}

	// Get roles
	var adminRole, editorRole, userRole models.Role
	if err := db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		return err
	}
	if err := db.Where("name = ?", "editor").First(&editorRole).Error; err != nil {
		return err
	}
	if err := db.Where("name = ?", "user").First(&userRole).Error; err != nil {
		return err
	}

	// Assign roles to users (if not already assigned)
	userRoleAssignments := map[string]string{
		adminUser.ID:   adminRole.ID,
		editorUser.ID:  editorRole.ID,
		regularUser.ID: userRole.ID,
	}

	for userID, roleID := range userRoleAssignments {
		var existing models.UserRole
		if err := db.Where("user_id = ? AND role_id = ?", userID, roleID).
			First(&existing).Error; err == gorm.ErrRecordNotFound {
			userRole := models.UserRole{
				UserID: userID,
				RoleID: roleID,
			}
			if err := db.Create(&userRole).Error; err != nil {
				return err
			}
		}
	}

	return nil
}
