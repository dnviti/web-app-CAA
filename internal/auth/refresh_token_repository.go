package auth

import (
	"time"

	"github.com/daniele/web-app-caa/internal/models"
	"gorm.io/gorm"
)

// RefreshTokenRepository interface for refresh token operations
type RefreshTokenRepository interface {
	Create(refreshToken *models.RefreshToken) error
	FindByToken(token string) (*models.RefreshToken, error)
	FindByUserID(userID string) ([]*models.RefreshToken, error)
	Delete(refreshToken *models.RefreshToken) error
	DeleteExpired() error
	DeleteByUserID(userID string) error
}

// RefreshTokenRepositoryImpl implements RefreshTokenRepository
type RefreshTokenRepositoryImpl struct {
	db *gorm.DB
}

// NewRefreshTokenRepository creates a new refresh token repository
func NewRefreshTokenRepository(db *gorm.DB) RefreshTokenRepository {
	return &RefreshTokenRepositoryImpl{
		db: db,
	}
}

// Create stores a new refresh token in the database
func (r *RefreshTokenRepositoryImpl) Create(refreshToken *models.RefreshToken) error {
	return r.db.Create(refreshToken).Error
}

// FindByToken finds a refresh token by its token value
func (r *RefreshTokenRepositoryImpl) FindByToken(token string) (*models.RefreshToken, error) {
	var refreshToken models.RefreshToken
	err := r.db.Preload("User").Where("token = ? AND expires_at > ?", token, time.Now()).First(&refreshToken).Error
	if err != nil {
		return nil, err
	}
	return &refreshToken, nil
}

// FindByUserID finds all refresh tokens for a user
func (r *RefreshTokenRepositoryImpl) FindByUserID(userID string) ([]*models.RefreshToken, error) {
	var refreshTokens []*models.RefreshToken
	err := r.db.Where("user_id = ? AND expires_at > ?", userID, time.Now()).Find(&refreshTokens).Error
	return refreshTokens, err
}

// Delete removes a refresh token from the database
func (r *RefreshTokenRepositoryImpl) Delete(refreshToken *models.RefreshToken) error {
	return r.db.Delete(refreshToken).Error
}

// DeleteExpired removes all expired refresh tokens
func (r *RefreshTokenRepositoryImpl) DeleteExpired() error {
	return r.db.Where("expires_at <= ?", time.Now()).Delete(&models.RefreshToken{}).Error
}

// DeleteByUserID removes all refresh tokens for a user
func (r *RefreshTokenRepositoryImpl) DeleteByUserID(userID string) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.RefreshToken{}).Error
}
