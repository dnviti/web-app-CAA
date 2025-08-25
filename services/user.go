package services

import (
	"errors"
	"fmt"
	"log"

	"gin/database"
	"gin/models"

	"golang.org/x/crypto/bcrypt"
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

// CreateUser creates a new user with hashed passwords
func (s *UserService) CreateUser(username, password, editorPassword string) (*models.User, error) {
	log.Printf("Creating user: %s", username)

	// Hash passwords
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return nil, fmt.Errorf("error hashing password: %w", err)
	}

	hashedEditorPassword, err := bcrypt.GenerateFromPassword([]byte(editorPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing editor password: %v", err)
		return nil, fmt.Errorf("error hashing editor password: %w", err)
	}

	user := &models.User{
		Username:       username,
		Password:       string(hashedPassword),
		EditorPassword: string(hashedEditorPassword),
		Status:         "pending_setup",
	}

	result := database.DB.Create(user)
	if result.Error != nil {
		log.Printf("Error creating user: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("User created with ID: %d", user.ID)
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

	err := bcrypt.CompareHashAndPassword([]byte(user.EditorPassword), []byte(password))
	isMatch := err == nil

	log.Printf("Editor password match: %t", isMatch)
	return isMatch, nil
}

// UpdateUserStatus updates the user status
func (s *UserService) UpdateUserStatus(userID uint, status string) error {
	log.Printf("Updating user status for ID %d to: %s", userID, status)

	result := database.DB.Model(&models.User{}).Where("id = ?", userID).Update("status", status)
	if result.Error != nil {
		log.Printf("Error updating user status: %v", result.Error)
		return result.Error
	}

	log.Printf("User status updated, changes: %d", result.RowsAffected)
	return nil
}

// VerifyPassword verifies a user's login password
func (s *UserService) VerifyPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
