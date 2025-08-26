package auth

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrTokenExpired     = errors.New("token expired")
	ErrTokenNotFound    = errors.New("token not found")
	ErrInvalidSignature = errors.New("invalid token signature")
)

// JWTTokenService implements TokenService using JWT
type JWTTokenService struct {
	config *AuthConfig
}

// NewJWTTokenService creates a new JWT token service
func NewJWTTokenService(config *AuthConfig) TokenService {
	return &JWTTokenService{
		config: config,
	}
}

// GenerateToken generates a new JWT token for a user
func (s *JWTTokenService) GenerateToken(userID uint) (string, error) {
	now := time.Now()
	expiresAt := now.Add(s.config.TokenLifespan)

	claims := jwt.MapClaims{
		"user_id": userID,
		"iat":     now.Unix(),
		"exp":     expiresAt.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}

// ValidateToken validates a JWT token and returns the claims
func (s *JWTTokenService) ValidateToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.JWTSecret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidSignature
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	userID, ok := claims["user_id"].(float64)
	if !ok {
		return nil, ErrInvalidToken
	}

	iat, ok := claims["iat"].(float64)
	if !ok {
		return nil, ErrInvalidToken
	}

	exp, ok := claims["exp"].(float64)
	if !ok {
		return nil, ErrInvalidToken
	}

	return &TokenClaims{
		UserID:    uint(userID),
		IssuedAt:  int64(iat),
		ExpiresAt: int64(exp),
	}, nil
}

// ExtractTokenFromRequest extracts JWT token from HTTP request
func (s *JWTTokenService) ExtractTokenFromRequest(c *gin.Context) (string, error) {
	// Try Authorization header first
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			return parts[1], nil
		}
	}

	// Try query parameter
	if token := c.Query("token"); token != "" {
		return token, nil
	}

	return "", ErrTokenNotFound
}

// ExtractUserIDFromToken extracts user ID from a JWT token string
func (s *JWTTokenService) ExtractUserIDFromToken(tokenString string) (uint, error) {
	claims, err := s.ValidateToken(tokenString)
	if err != nil {
		return 0, err
	}
	return claims.UserID, nil
}
