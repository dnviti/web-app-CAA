package auth

import (
	"time"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/gin-gonic/gin"
)

// TokenService handles JWT token operations
type TokenService interface {
	GenerateToken(userID uint) (string, error)
	ValidateToken(tokenString string) (*TokenClaims, error)
	ExtractTokenFromRequest(c *gin.Context) (string, error)
	ExtractUserIDFromToken(tokenString string) (uint, error)
}

// AuthService handles authentication business logic
type AuthService interface {
	Register(req *models.RegisterRequest) (*models.User, string, error)
	Login(req *models.LoginRequest) (*models.User, string, error)
	GetCurrentUser(userID uint) (*models.User, error)
	ValidateEditorPassword(userID uint, password string) (bool, error)
}

// UserRepository handles user data persistence
type UserRepository interface {
	Create(user *models.User) error
	FindByID(id uint) (*models.User, error)
	FindByUsername(username string) (*models.User, error)
	Update(user *models.User) error
	CheckPassword(user *models.User, password string) error
}

// GridRepository handles grid data persistence
type GridRepository interface {
	CreateGridItems(items []models.GridItem) error
	FindByUserID(userID uint) ([]models.GridItem, error)
}

// TokenClaims represents JWT token claims
type TokenClaims struct {
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
}

// Config holds authentication configuration
type Config struct {
	JWTSecret     string
	TokenLifespan time.Duration
	BcryptCost    int
}
