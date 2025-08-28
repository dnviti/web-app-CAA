package auth

import (
	"github.com/daniele/web-app-caa/internal/models"
	"github.com/gin-gonic/gin"
)

// TokenService handles JWT token operations
type TokenService interface {
	GenerateToken(userID interface{}) (string, error)
	GenerateRefreshToken(userID interface{}) (string, error)
	ValidateToken(tokenString string) (*TokenClaims, error)
	ExtractTokenFromRequest(c *gin.Context) (string, error)
	ExtractUserIDFromToken(tokenString string) (string, error)
}

// AuthService handles authentication business logic
type AuthService interface {
	Register(req *models.RegisterRequest) (*models.User, string, string, error)
	Login(req *models.LoginRequest) (*models.User, string, string, error)
	RefreshToken(refreshToken string) (string, string, error)
	RevokeRefreshToken(refreshToken string) error
	RevokeAllRefreshTokens(userID string) error
	GetCurrentUser(userID string) (*models.User, error)
	ValidateEditorPassword(userID string, password string) (bool, error)
}

// UserRepository handles user data persistence
type UserRepository interface {
	Create(user *models.User) error
	FindByID(id string) (*models.User, error)
	FindByUsername(username string) (*models.User, error)
	Update(user *models.User) error
	CheckPassword(user *models.User, password string) error
}

// GridRepository handles grid data persistence
type GridRepository interface {
	CreateGridItems(items []models.GridItem) error
	FindByUserID(userID string) ([]models.GridItem, error)
}

// TokenClaims represents JWT token claims
type TokenClaims struct {
	UserID    interface{} `json:"user_id"`
	Username  string      `json:"username"`
	IssuedAt  int64       `json:"iat"`
	ExpiresAt int64       `json:"exp"`
}
