package services

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/daniele/web-app-caa/internal/models"
	"gorm.io/gorm"
)

// UserManagementService handles comprehensive user management operations
type UserManagementService struct {
	db          *gorm.DB
	rbacService *RBACService
}

// NewUserManagementService creates a new user management service
func NewUserManagementService(db *gorm.DB, rbacService *RBACService) *UserManagementService {
	return &UserManagementService{
		db:          db,
		rbacService: rbacService,
	}
}

// GetAllUsers retrieves all users with optional pagination and filtering
func (s *UserManagementService) GetAllUsers(page, limit int, search, status string, isActive *bool) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	query := s.db.Model(&models.User{}).Preload("Roles")

	// Apply filters
	if search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(username) LIKE ? OR LOWER(email) LIKE ?", searchPattern, searchPattern)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to retrieve users: %w", err)
	}

	// Prepare users for response (remove sensitive data)
	for i := range users {
		users[i].PrepareGive()
	}

	return users, total, nil
}

// GetUserByID retrieves a user by ID with roles
func (s *UserManagementService) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	if err := s.db.Preload("Roles").Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	user.PrepareGive()
	return &user, nil
}

// CreateUser creates a new user with comprehensive validation
func (s *UserManagementService) CreateUser(username, email, password, editorPassword string, isActive bool) (*models.User, error) {
	// Check if username already exists
	var existingUser models.User
	if err := s.db.Where("username = ?", username).First(&existingUser).Error; err == nil {
		return nil, fmt.Errorf("username already exists")
	}

	// Check if email already exists
	if err := s.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return nil, fmt.Errorf("email already exists")
	}

	user := &models.User{
		Username:       username,
		Email:          email,
		Password:       password,       // Will be hashed by GORM hook
		EditorPassword: editorPassword, // Will be hashed by GORM hook
		Status:         "pending_setup",
		IsActive:       isActive,
	}

	if err := s.db.Create(user).Error; err != nil {
		log.Printf("[USER-MANAGEMENT] Error creating user: %v", err)
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Log activity
	s.logUserActivity(user.ID, "user_created", "users", "User account created", "", "")

	// Assign default user role
	if err := s.rbacService.AssignUserRole(user.ID, "user"); err != nil {
		log.Printf("[USER-MANAGEMENT] Warning: Failed to assign default role to user %s: %v", user.ID, err)
	}

	user.PrepareGive()
	return user, nil
}

// UpdateUser updates an existing user's information
func (s *UserManagementService) UpdateUser(userID, username, email, password, editorPassword, status string, isActive *bool) (*models.User, error) {
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Build update map
	updates := make(map[string]interface{})

	// Check for username conflicts
	if username != "" && username != user.Username {
		var existingUser models.User
		if err := s.db.Where("username = ? AND id != ?", username, userID).First(&existingUser).Error; err == nil {
			return nil, fmt.Errorf("username already exists")
		}
		updates["username"] = username
	}

	// Check for email conflicts
	if email != "" && email != user.Email {
		var existingUser models.User
		if err := s.db.Where("email = ? AND id != ?", email, userID).First(&existingUser).Error; err == nil {
			return nil, fmt.Errorf("email already exists")
		}
		updates["email"] = email
	}

	if password != "" {
		updates["password"] = password // Will be hashed by GORM hook
	}

	if editorPassword != "" {
		updates["editor_password"] = editorPassword // Will be hashed by GORM hook
	}

	if status != "" {
		updates["status"] = status
	}

	if isActive != nil {
		updates["is_active"] = *isActive
	}

	if len(updates) > 0 {
		if err := s.db.Model(&user).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}

		// Log activity
		s.logUserActivity(user.ID, "user_updated", "users", "User account updated", "", "")
	}

	// Reload user with updated data
	if err := s.db.Preload("Roles").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to reload user: %w", err)
	}

	user.PrepareGive()
	return &user, nil
}

// DeactivateUser deactivates a user account (soft delete)
func (s *UserManagementService) DeactivateUser(userID string) error {
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	if err := s.db.Model(&user).Updates(map[string]interface{}{
		"is_active": false,
		"status":    "inactive",
	}).Error; err != nil {
		return fmt.Errorf("failed to deactivate user: %w", err)
	}

	// Log activity
	s.logUserActivity(user.ID, "user_deactivated", "users", "User account deactivated", "", "")

	log.Printf("[USER-MANAGEMENT] User %s (%s) deactivated", user.ID, user.Username)
	return nil
}

// GetUserActivity retrieves user activity logs
func (s *UserManagementService) GetUserActivity(userID string, page, limit int) ([]models.UserActivity, int64, error) {
	// First check if user exists
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, 0, fmt.Errorf("user not found")
		}
		return nil, 0, fmt.Errorf("failed to get user: %w", err)
	}

	var activities []models.UserActivity
	var total int64

	query := s.db.Model(&models.UserActivity{}).Where("user_id = ?", userID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count activities: %w", err)
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&activities).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to retrieve activities: %w", err)
	}

	return activities, total, nil
}

// BulkUserOperations performs bulk operations on users
func (s *UserManagementService) BulkUserOperations(userIDs []string, operation, roleName string) ([]models.BulkOperationResult, error) {
	results := make([]models.BulkOperationResult, len(userIDs))

	for i, userID := range userIDs {
		results[i] = models.BulkOperationResult{UserID: userID}

		switch operation {
		case "activate":
			err := s.updateUserStatus(userID, true, "active")
			results[i].Success = err == nil
			if err != nil {
				results[i].Message = err.Error()
			} else {
				results[i].Message = "User activated"
				s.logUserActivity(userID, "user_activated", "users", "User activated via bulk operation", "", "")
			}

		case "deactivate":
			err := s.updateUserStatus(userID, false, "inactive")
			results[i].Success = err == nil
			if err != nil {
				results[i].Message = err.Error()
			} else {
				results[i].Message = "User deactivated"
				s.logUserActivity(userID, "user_deactivated", "users", "User deactivated via bulk operation", "", "")
			}

		case "delete":
			err := s.DeactivateUser(userID)
			results[i].Success = err == nil
			if err != nil {
				results[i].Message = err.Error()
			} else {
				results[i].Message = "User deleted (deactivated)"
			}

		case "assign_role":
			err := s.rbacService.AssignUserRole(userID, roleName)
			results[i].Success = err == nil
			if err != nil {
				results[i].Message = err.Error()
			} else {
				results[i].Message = fmt.Sprintf("Role %s assigned", roleName)
				s.logUserActivity(userID, "role_assigned", "roles", fmt.Sprintf("Role %s assigned via bulk operation", roleName), "", "")
			}

		case "remove_role":
			err := s.rbacService.RemoveUserRole(userID, roleName)
			results[i].Success = err == nil
			if err != nil {
				results[i].Message = err.Error()
			} else {
				results[i].Message = fmt.Sprintf("Role %s removed", roleName)
				s.logUserActivity(userID, "role_removed", "roles", fmt.Sprintf("Role %s removed via bulk operation", roleName), "", "")
			}

		default:
			results[i].Success = false
			results[i].Message = "Unknown operation"
		}
	}

	return results, nil
}

// updateUserStatus is a helper function to update user activation status
func (s *UserManagementService) updateUserStatus(userID string, isActive bool, status string) error {
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	return s.db.Model(&user).Updates(map[string]interface{}{
		"is_active": isActive,
		"status":    status,
	}).Error
}

// logUserActivity logs user activities
func (s *UserManagementService) logUserActivity(userID, action, resource, description, ipAddress, userAgent string) {
	activity := models.UserActivity{
		UserID:      userID,
		Action:      action,
		Resource:    resource,
		Description: description,
		IPAddress:   ipAddress,
		UserAgent:   userAgent,
		CreatedAt:   time.Now(),
	}

	if err := s.db.Create(&activity).Error; err != nil {
		log.Printf("[USER-MANAGEMENT] Failed to log activity for user %s: %v", userID, err)
	}
}

// GetUserStats returns user statistics
func (s *UserManagementService) GetUserStats() (map[string]interface{}, error) {
	var totalUsers int64
	var activeUsers int64
	var pendingUsers int64
	var inactiveUsers int64

	if err := s.db.Model(&models.User{}).Count(&totalUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count total users: %w", err)
	}

	if err := s.db.Model(&models.User{}).Where("is_active = ?", true).Count(&activeUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count active users: %w", err)
	}

	if err := s.db.Model(&models.User{}).Where("status = ?", "pending_setup").Count(&pendingUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count pending users: %w", err)
	}

	if err := s.db.Model(&models.User{}).Where("is_active = ?", false).Count(&inactiveUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count inactive users: %w", err)
	}

	// Get recent registrations (last 7 days)
	weekAgo := time.Now().AddDate(0, 0, -7)
	var recentRegistrations int64
	if err := s.db.Model(&models.User{}).Where("created_at >= ?", weekAgo).Count(&recentRegistrations).Error; err != nil {
		log.Printf("[USER-MANAGEMENT] Warning: Failed to count recent registrations: %v", err)
	}

	return map[string]interface{}{
		"total_users":          totalUsers,
		"active_users":         activeUsers,
		"pending_users":        pendingUsers,
		"inactive_users":       inactiveUsers,
		"recent_registrations": recentRegistrations,
	}, nil
}
