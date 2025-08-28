package auth

import (
	"fmt"
	"log"
	"net/http"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/gin-gonic/gin"
)

// Middleware creates authentication middleware
type Middleware struct {
	tokenService TokenService
	userRepo     UserRepository
}

// NewMiddleware creates a new authentication middleware
func NewMiddleware(tokenService TokenService, userRepo UserRepository) *Middleware {
	return &Middleware{
		tokenService: tokenService,
		userRepo:     userRepo,
	}
}

// RequireAuth is the middleware function that validates JWT tokens
func (m *Middleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		method := c.Request.Method
		log.Printf("[AUTH-MIDDLEWARE] Authenticating request: %s %s", method, path)

		// Extract token from request
		tokenString, err := m.tokenService.ExtractTokenFromRequest(c)
		if err != nil {
			log.Printf("[AUTH-MIDDLEWARE] Token not found: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization token required",
			})
			c.Abort()
			return
		}

		// Validate token
		claims, err := m.tokenService.ValidateToken(tokenString)
		if err != nil {
			log.Printf("[AUTH-MIDDLEWARE] Token validation failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Convert UserID interface{} to string
		var userIDStr string
		switch v := claims.UserID.(type) {
		case string:
			userIDStr = v
		case float64:
			userIDStr = fmt.Sprintf("%.0f", v)
		default:
			userIDStr = fmt.Sprintf("%v", v)
		}

		// Verify user exists in database
		user, err := m.userRepo.FindByID(userIDStr)
		if err != nil {
			log.Printf("[AUTH-MIDDLEWARE] User not found in database: %s", userIDStr)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not found",
			})
			c.Abort()
			return
		}

		log.Printf("[AUTH-MIDDLEWARE] Authentication successful for user: %s", user.Username)

		// Store user info in context for use in handlers
		c.Set("user_id", userIDStr)
		c.Set("user", user)
		c.Set("token_claims", claims)

		c.Next()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) string {
	if userID, exists := c.Get("user_id"); exists {
		// Handle both string and numeric user IDs
		switch v := userID.(type) {
		case string:
			return v
		case uint:
			return fmt.Sprintf("%d", v)
		case float64:
			return fmt.Sprintf("%.0f", v)
		default:
			return fmt.Sprintf("%v", v)
		}
	}
	return ""
}

// GetUser extracts user from context
func GetUser(c *gin.Context) (*models.User, bool) {
	if user, exists := c.Get("user"); exists {
		if u, ok := user.(*models.User); ok {
			return u, true
		}
	}
	return nil, false
}

// GetTokenClaims extracts token claims from context
func GetTokenClaims(c *gin.Context) (*TokenClaims, bool) {
	if claims, exists := c.Get("token_claims"); exists {
		if c, ok := claims.(*TokenClaims); ok {
			return c, true
		}
	}
	return nil, false
}
