package auth

import (
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

		// Verify user exists in database
		user, err := m.userRepo.FindByID(claims.UserID)
		if err != nil {
			log.Printf("[AUTH-MIDDLEWARE] User not found in database: %d", claims.UserID)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not found",
			})
			c.Abort()
			return
		}

		log.Printf("[AUTH-MIDDLEWARE] Authentication successful for user: %s", user.Username)

		// Store user info in context for use in handlers
		c.Set("user_id", claims.UserID)
		c.Set("user", user)
		c.Set("token_claims", claims)

		c.Next()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) uint {
	if userID, exists := c.Get("user_id"); exists {
		return userID.(uint)
	}
	return 0
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
