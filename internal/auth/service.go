package auth

import (
	"errors"
	"fmt"
	"log"

	"github.com/daniele/web-app-caa/internal/models"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserExists         = errors.New("username already exists")
	ErrInvalidPassword    = errors.New("invalid password")
)

// AuthServiceImpl implements AuthService
type AuthServiceImpl struct {
	userRepo     UserRepository
	gridRepo     GridRepository
	tokenService TokenService
	config       *AuthConfig
}

// NewAuthService creates a new authentication service
func NewAuthService(
	userRepo UserRepository,
	gridRepo GridRepository,
	tokenService TokenService,
	config *AuthConfig,
) AuthService {
	return &AuthServiceImpl{
		userRepo:     userRepo,
		gridRepo:     gridRepo,
		tokenService: tokenService,
		config:       config,
	}
}

// Register handles user registration
func (s *AuthServiceImpl) Register(req *models.RegisterRequest) (*models.User, string, error) {
	log.Printf("[AUTH-SERVICE] Starting registration for username: %s", req.Username)

	// Check if username already exists
	existingUser, err := s.userRepo.FindByUsername(req.Username)
	if err == nil && existingUser != nil {
		return nil, "", ErrUserExists
	}

	// Create new user
	user := &models.User{
		Username:       req.Username,
		Password:       req.Password,       // Will be hashed by BeforeSave hook
		EditorPassword: req.EditorPassword, // Will be hashed by BeforeSave hook
		Status:         "pending_setup",
	}

	if err := s.userRepo.Create(user); err != nil {
		log.Printf("[AUTH-SERVICE] Error creating user: %v", err)
		return nil, "", fmt.Errorf("failed to create user: %w", err)
	}

	// Generate token
	token, err := s.tokenService.GenerateToken(user.ID)
	if err != nil {
		log.Printf("[AUTH-SERVICE] Error generating token for user %d: %v", user.ID, err)
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	log.Printf("[AUTH-SERVICE] Registration completed successfully for user: %s", user.Username)
	return user, token, nil
}

// Login handles user authentication
func (s *AuthServiceImpl) Login(req *models.LoginRequest) (*models.User, string, error) {
	log.Printf("[AUTH-SERVICE] Login attempt for username: %s", req.Username)

	// Find user by username
	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		log.Printf("[AUTH-SERVICE] User not found: %s", req.Username)
		return nil, "", ErrInvalidCredentials
	}

	// Validate password
	if err := s.userRepo.CheckPassword(user, req.Password); err != nil {
		log.Printf("[AUTH-SERVICE] Invalid password for user: %s", req.Username)
		return nil, "", ErrInvalidCredentials
	}

	// Generate token
	token, err := s.tokenService.GenerateToken(user.ID)
	if err != nil {
		log.Printf("[AUTH-SERVICE] Error generating token for user %d: %v", user.ID, err)
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	log.Printf("[AUTH-SERVICE] Login successful for user: %s", user.Username)
	return user, token, nil
}

// GetCurrentUser retrieves user by ID
func (s *AuthServiceImpl) GetCurrentUser(userID uint) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// ValidateEditorPassword validates editor password for a user
func (s *AuthServiceImpl) ValidateEditorPassword(userID uint, password string) (bool, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return false, ErrUserNotFound
	}

	// Compare the provided password with the stored hashed editor password
	if err := bcrypt.CompareHashAndPassword([]byte(user.EditorPassword), []byte(password)); err != nil {
		return false, nil // Password doesn't match, but no error
	}

	return true, nil
}
