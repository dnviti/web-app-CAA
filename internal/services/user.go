package services

import (
	"errors"
	"log"

	"github.com/daniele/web-app-caa/internal/database"
	"github.com/daniele/web-app-caa/internal/models"

	"gorm.io/gorm"
)

// UserService handles user-related operations
type UserService struct{}

// NewUserService creates a new UserService
func NewUserService() *UserService {
	return &UserService{}
}

// FindUserByUsername finds a user by username
func (s *UserService) FindUserByUsername(username string) (*models.User, error) {
	log.Printf("Finding user by username: %s", username)

	var user models.User
	result := database.DB.Where("username = ?", username).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			log.Printf("User not found: %s", username)
			return nil, nil
		}
		log.Printf("Error finding user by username: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("User found: %s", username)
	return &user, nil
}

// FindUserByID finds a user by ID
func (s *UserService) FindUserByID(id uint) (*models.User, error) {
	log.Printf("Finding user by ID: %d", id)

	var user models.User
	result := database.DB.Select("id, username, status").Where("id = ?", id).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			log.Printf("User not found: %d", id)
			return nil, nil
		}
		log.Printf("Error finding user by ID: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("User found: %s", user.Username)
	return &user, nil
}

// CreateUser creates a new user (GORM hooks will handle password hashing)
func (s *UserService) CreateUser(username, password, editorPassword string) (*models.User, error) {
	log.Printf("Creating user: %s", username)

	user := &models.User{
		Username:       username,
		Password:       password,       // Will be hashed by BeforeSave hook
		EditorPassword: editorPassword, // Will be hashed by BeforeSave hook
		Status:         "pending_setup",
	}

	result := database.DB.Create(user)
	if result.Error != nil {
		log.Printf("Error creating user: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("User created with ID: %s", user.ID)
	return user, nil
}

// LoginCheck verifies user credentials and returns user if valid
func (s *UserService) LoginCheck(username, password string) (*models.User, error) {
	log.Printf("Checking login credentials for user: %s", username)

	user, err := s.FindUserByUsername(username)
	if err != nil {
		return nil, err
	}

	if user == nil {
		log.Printf("User not found during login: %s", username)
		return nil, errors.New("user not found")
	}

	// Verify password using the model method
	err = user.VerifyPassword(password)
	if err != nil {
		log.Printf("Password mismatch for user: %s", username)
		return nil, errors.New("invalid credentials")
	}

	// Prepare user data for return (removes sensitive fields)
	user.PrepareGive()

	log.Printf("Login successful for user: %s", username)
	return user, nil
}

// CheckEditorPassword verifies the editor password for a user
func (s *UserService) CheckEditorPassword(userID uint, password string) (bool, error) {
	log.Printf("Checking editor password for user ID: %d", userID)

	var user models.User
	result := database.DB.Select("editor_password").Where("id = ?", userID).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			log.Printf("User not found for editor password check: %d", userID)
			return false, nil
		}
		log.Printf("Error checking editor password: %v", result.Error)
		return false, result.Error
	}

	err := user.VerifyEditorPassword(password)
	isMatch := err == nil

	log.Printf("Editor password match: %t", isMatch)
	return isMatch, nil
}

// GetUserByID retrieves a user by ID and prepares it for response
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	log.Printf("Getting user by ID: %d", id)

	user, err := s.FindUserByID(id)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, errors.New("user not found")
	}

	// Prepare user data for return (removes sensitive fields)
	user.PrepareGive()

	return user, nil
}

// UpdateUserStatus updates the user status
func (s *UserService) UpdateUserStatus(userID string, status string) error {
	log.Printf("Updating user status for ID %s to: %s", userID, status)

	result := database.DB.Model(&models.User{}).Where("id = ?", userID).Update("status", status)
	if result.Error != nil {
		log.Printf("Error updating user status: %v", result.Error)
		return result.Error
	}

	log.Printf("User status updated, changes: %d", result.RowsAffected)
	return nil
}
