package auth

import (
	"crypto/rsa"
	"errors"
	"fmt"
	"log"
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

// JWTTokenService implements TokenService using JWT with RSA signing
type JWTTokenService struct {
	signingKeyService SigningKeyService
}

// NewJWTTokenService creates a new JWT token service with RSA signing
func NewJWTTokenService(signingKeyService SigningKeyService) TokenService {
	return &JWTTokenService{
		signingKeyService: signingKeyService,
	}
}

// GenerateToken generates a new JWT token for a user using RSA signing
func (s *JWTTokenService) GenerateToken(userID interface{}) (string, error) {
	// Get the signing key
	privateKey, keyID, err := s.signingKeyService.GetSigningKey()
	if err != nil {
		return "", fmt.Errorf("failed to get signing key: %w", err)
	}

	// Ensure we have an RSA private key (explicit usage to avoid import warning)
	if privateKey == nil {
		return "", fmt.Errorf("invalid RSA private key")
	}
	_ = (*rsa.PrivateKey)(nil) // Explicit reference to avoid unused import warning

	now := time.Now()
	// Shorter expiration for access tokens (15 minutes)
	expiresAt := now.Add(15 * time.Minute)

	claims := jwt.MapClaims{
		"user_id": userID,
		"iat":     now.Unix(),
		"exp":     expiresAt.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)

	// Set key ID in header for key rotation support
	token.Header["kid"] = keyID

	return token.SignedString(privateKey)
}

// GenerateRefreshToken generates a new refresh token for a user
// Note: This is a placeholder - the actual refresh token generation
// and storage is handled by the AuthService
func (s *JWTTokenService) GenerateRefreshToken(userID interface{}) (string, error) {
	// This method exists to satisfy the TokenService interface
	// The actual refresh token generation is handled by AuthService
	// using models.GenerateRefreshToken() for secure random tokens
	return "", fmt.Errorf("refresh token generation should be handled by AuthService")
}

// ValidateToken validates a JWT token and returns the claims using RSA verification
func (s *JWTTokenService) ValidateToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method is RSA
		method, ok := token.Method.(*jwt.SigningMethodRSA)
		if !ok {
			return nil, fmt.Errorf("unexpected signing method: %v (expected RSA)", token.Header["alg"])
		}

		// Ensure it's RS256 specifically
		if method.Alg() != "RS256" {
			return nil, fmt.Errorf("unexpected RSA signing method: %v (expected RS256)", method.Alg())
		}

		// Get key ID from token header
		kidInterface, ok := token.Header["kid"]
		if !ok {
			return nil, fmt.Errorf("no key ID in token header")
		}
		keyID, ok := kidInterface.(string)
		if !ok {
			return nil, fmt.Errorf("invalid key ID in token header")
		}

		// Get verification key
		publicKey, err := s.signingKeyService.GetVerificationKey(keyID)
		if err != nil {
			log.Printf("[JWT-SERVICE] Failed to get verification key for key ID %s: %v", keyID, err)
			return nil, fmt.Errorf("failed to get verification key for key ID %s: %w", keyID, err)
		}

		log.Printf("[JWT-SERVICE] Retrieved verification key for key ID: %s", keyID)
		return publicKey, nil
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

	// Handle both string (UUID) and numeric user IDs
	var userID interface{}
	if uid, ok := claims["user_id"].(string); ok {
		userID = uid
	} else if uid, ok := claims["user_id"].(float64); ok {
		userID = uint(uid)
	} else {
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
		UserID:    userID,
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
func (s *JWTTokenService) ExtractUserIDFromToken(tokenString string) (string, error) {
	claims, err := s.ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	// Handle both string and numeric user IDs for backward compatibility
	switch v := claims.UserID.(type) {
	case string:
		return v, nil
	case float64:
		return fmt.Sprintf("%.0f", v), nil
	default:
		return fmt.Sprintf("%v", v), nil
	}
}
