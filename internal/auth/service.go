package auth

import (
	"errors"
	"fmt"
	"log"
	"time"

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
	userRepo         UserRepository
	gridRepo         GridRepository
	tokenService     TokenService
	refreshTokenRepo RefreshTokenRepository
	config           *AuthConfig
}

// NewAuthService creates a new authentication service
func NewAuthService(
	userRepo UserRepository,
	gridRepo GridRepository,
	tokenService TokenService,
	refreshTokenRepo RefreshTokenRepository,
	config *AuthConfig,
) AuthService {
	return &AuthServiceImpl{
		userRepo:         userRepo,
		gridRepo:         gridRepo,
		tokenService:     tokenService,
		refreshTokenRepo: refreshTokenRepo,
		config:           config,
	}
}

// Register handles user registration
func (s *AuthServiceImpl) Register(req *models.RegisterRequest) (*models.User, string, string, error) {
	log.Printf("[AUTH-SERVICE] Starting registration for username: %s", req.Username)

	// Check if username already exists
	existingUser, err := s.userRepo.FindByUsername(req.Username)
	if err == nil && existingUser != nil {
		return nil, "", "", ErrUserExists
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
		return nil, "", "", fmt.Errorf("failed to create user: %w", err)
	}

	// Generate access token
	token, err := s.tokenService.GenerateToken(user.ID)
	if err != nil {
		log.Printf("[AUTH-SERVICE] Error generating token for user %s: %v", user.ID, err)
		return nil, "", "", fmt.Errorf("failed to generate token: %w", err)
	}

	// Generate refresh token
	refreshTokenString, err := models.GenerateRefreshToken()
	if err != nil {
		log.Printf("[AUTH-SERVICE] Error generating refresh token for user %s: %v", user.ID, err)
		return nil, "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store refresh token in database (7 days expiration)
	refreshToken := &models.RefreshToken{
		Token:     refreshTokenString,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	if err := s.refreshTokenRepo.Create(refreshToken); err != nil {
		log.Printf("[AUTH-SERVICE] Error storing refresh token for user %s: %v", user.ID, err)
		return nil, "", "", fmt.Errorf("failed to store refresh token: %w", err)
	}

	log.Printf("[AUTH-SERVICE] Registration completed successfully for user: %s", user.Username)
	return user, token, refreshTokenString, nil
}

// Login handles user authentication
func (s *AuthServiceImpl) Login(req *models.LoginRequest) (*models.User, string, string, error) {
	log.Printf("[AUTH-SERVICE] Login attempt for username: %s", req.Username)

	// Find user by username
	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		log.Printf("[AUTH-SERVICE] User not found: %s", req.Username)
		return nil, "", "", ErrInvalidCredentials
	}

	// Validate password
	if err := s.userRepo.CheckPassword(user, req.Password); err != nil {
		log.Printf("[AUTH-SERVICE] Invalid password for user: %s", req.Username)
		return nil, "", "", ErrInvalidCredentials
	}

	// Generate access token
	token, err := s.tokenService.GenerateToken(user.ID)
	if err != nil {
		log.Printf("[AUTH-SERVICE] Error generating token for user %s: %v", user.ID, err)
		return nil, "", "", fmt.Errorf("failed to generate token: %w", err)
	}

	// Generate refresh token
	refreshTokenString, err := models.GenerateRefreshToken()
	if err != nil {
		log.Printf("[AUTH-SERVICE] Error generating refresh token for user %s: %v", user.ID, err)
		return nil, "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store refresh token in database (7 days expiration)
	refreshToken := &models.RefreshToken{
		Token:     refreshTokenString,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	if err := s.refreshTokenRepo.Create(refreshToken); err != nil {
		log.Printf("[AUTH-SERVICE] Error storing refresh token for user %s: %v", user.ID, err)
		return nil, "", "", fmt.Errorf("failed to store refresh token: %w", err)
	}

	log.Printf("[AUTH-SERVICE] Login successful for user: %s", user.Username)
	return user, token, refreshTokenString, nil
}

// RefreshToken generates new tokens using a refresh token
func (s *AuthServiceImpl) RefreshToken(refreshToken string) (string, string, error) {
	log.Printf("[AUTH-SERVICE] Refresh token request")

	// Find refresh token in database
	storedRefreshToken, err := s.refreshTokenRepo.FindByToken(refreshToken)
	if err != nil {
		log.Printf("[AUTH-SERVICE] Invalid refresh token: %v", err)
		return "", "", ErrInvalidToken
	}

	// Check if token is expired
	if storedRefreshToken.IsExpired() {
		log.Printf("[AUTH-SERVICE] Refresh token expired for user: %s", storedRefreshToken.UserID)
		// Clean up expired token
		s.refreshTokenRepo.Delete(storedRefreshToken)
		return "", "", ErrTokenExpired
	}

	// Generate new access token
	newAccessToken, err := s.tokenService.GenerateToken(storedRefreshToken.UserID)
	if err != nil {
		log.Printf("[AUTH-SERVICE] Error generating new access token: %v", err)
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate new refresh token
	newRefreshTokenString, err := models.GenerateRefreshToken()
	if err != nil {
		log.Printf("[AUTH-SERVICE] Error generating new refresh token: %v", err)
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Update refresh token in database
	storedRefreshToken.Token = newRefreshTokenString
	storedRefreshToken.ExpiresAt = time.Now().Add(7 * 24 * time.Hour)

	// Delete old refresh token and create new one
	if err := s.refreshTokenRepo.Delete(storedRefreshToken); err != nil {
		log.Printf("[AUTH-SERVICE] Error deleting old refresh token: %v", err)
	}

	// Create new refresh token record
	newRefreshToken := &models.RefreshToken{
		Token:     newRefreshTokenString,
		UserID:    storedRefreshToken.UserID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	if err := s.refreshTokenRepo.Create(newRefreshToken); err != nil {
		log.Printf("[AUTH-SERVICE] Error creating new refresh token: %v", err)
		return "", "", fmt.Errorf("failed to create refresh token: %w", err)
	}

	log.Printf("[AUTH-SERVICE] Token refresh successful for user: %s", storedRefreshToken.UserID)
	return newAccessToken, newRefreshTokenString, nil
}

// RevokeRefreshToken revokes a specific refresh token
func (s *AuthServiceImpl) RevokeRefreshToken(refreshToken string) error {
	log.Printf("[AUTH-SERVICE] Revoking refresh token")

	storedRefreshToken, err := s.refreshTokenRepo.FindByToken(refreshToken)
	if err != nil {
		return ErrInvalidToken
	}

	return s.refreshTokenRepo.Delete(storedRefreshToken)
}

// RevokeAllRefreshTokens revokes all refresh tokens for a user
func (s *AuthServiceImpl) RevokeAllRefreshTokens(userID string) error {
	log.Printf("[AUTH-SERVICE] Revoking all refresh tokens for user: %s", userID)
	return s.refreshTokenRepo.DeleteByUserID(userID)
}

// GetCurrentUser retrieves user by ID
func (s *AuthServiceImpl) GetCurrentUser(userID string) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// ValidateEditorPassword validates editor password for a user
func (s *AuthServiceImpl) ValidateEditorPassword(userID string, password string) (bool, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return false, ErrUserNotFound
	}

	// Compare the provided password with the provided hashed editor password
	if err := bcrypt.CompareHashAndPassword([]byte(user.EditorPassword), []byte(password)); err != nil {
		return false, nil // Password doesn't match, but no error
	}

	return true, nil
}
