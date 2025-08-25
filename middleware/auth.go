package middleware

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"gin/services"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret string

func init() {
	jwtSecret = os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-default-secret-key"
	}
}

// Claims represents the JWT claims
type Claims struct {
	UserID   uint   `json:"userId"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateToken generates a new JWT token for a user
func GenerateToken(userID uint, username string) (string, error) {
	claims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// AuthenticateToken middleware to validate JWT tokens
func AuthenticateToken() gin.HandlerFunc {
	userService := services.NewUserService()

	return func(c *gin.Context) {
		path := c.Request.URL.Path
		method := c.Request.Method
		log.Printf("[AUTH] Authenticating token for %s %s", method, path)

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Printf("[AUTH] No authorization header provided, returning 401")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenString := ""
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			tokenString = parts[1]
		}

		if tokenString == "" {
			log.Printf("[AUTH] No token provided, returning 401")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
			c.Abort()
			return
		}

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			log.Printf("[AUTH] Token parsing failed: %v", err)
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok || !token.Valid || claims.UserID == 0 {
			log.Printf("[AUTH] Token validation failed: claims invalid or no userId")
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Verify user exists in database
		log.Printf("[AUTH] Verifying user exists in database: userId=%d", claims.UserID)
		dbUser, err := userService.FindUserByID(claims.UserID)
		if err != nil {
			log.Printf("[AUTH] Database error during token authentication: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			c.Abort()
			return
		}

		if dbUser == nil {
			log.Printf("[AUTH] User not found in database: userId=%d", claims.UserID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		log.Printf("[AUTH] Authentication successful for user: %s", claims.Username)

		// Store user information in context
		c.Set("user", map[string]interface{}{
			"userId":   claims.UserID,
			"username": claims.Username,
		})

		c.Next()
	}
}

// RequestLogging middleware for logging requests
func RequestLogging() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		clientIP := c.ClientIP()

		log.Printf("[%s] %s %s - IP: %s", start.Format(time.RFC3339), method, path, clientIP)

		c.Next()

		latency := time.Since(start)
		statusCode := c.Writer.Status()

		log.Printf("[%s] %s %s - %d - %v - IP: %s",
			start.Format(time.RFC3339), method, path, statusCode, latency, clientIP)
	}
}
