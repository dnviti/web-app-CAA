package middleware

import (
	"net/http"
	"strings"

	"github.com/daniele/web-app-caa/internal/services"
	"github.com/daniele/web-app-caa/internal/utils/token"
	"github.com/gin-gonic/gin"
)

// RBACMiddleware creates a middleware for role-based access control
func RBACMiddleware(rbacService *services.RBACService, resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		// Validate and extract user ID from token
		userID, err := token.ExtractUserIDFromToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Check permission
		allowed, err := rbacService.CheckPermission(userID, resource, action)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Permission check failed"})
			c.Abort()
			return
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		// Store user ID in context for use in handlers
		c.Set("userID", userID)
		c.Next()
	}
}

// RequireRole creates a middleware that requires specific roles
func RequireRole(rbacService *services.RBACService, requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		// Validate and extract user ID from token
		userID, err := token.ExtractUserIDFromToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user roles
		userRoles, err := rbacService.GetUserRoles(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user roles"})
			c.Abort()
			return
		}

		// Check if user has any of the required roles
		hasRequiredRole := false
		for _, userRole := range userRoles {
			for _, requiredRole := range requiredRoles {
				if userRole.Name == requiredRole {
					hasRequiredRole = true
					break
				}
			}
			if hasRequiredRole {
				break
			}
		}

		if !hasRequiredRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient role permissions"})
			c.Abort()
			return
		}

		// Store user ID and roles in context for use in handlers
		c.Set("userID", userID)
		c.Set("userRoles", userRoles)
		c.Next()
	}
}

// RequireOwnership creates a middleware that checks if user owns the resource
func RequireOwnership(rbacService *services.RBACService, resourceType string, getResourceOwnerFunc func(*gin.Context) (string, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		// Validate and extract user ID from token
		userID, err := token.ExtractUserIDFromToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get resource owner
		resourceOwnerID, err := getResourceOwnerFunc(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to determine resource owner"})
			c.Abort()
			return
		}

		// Check if user owns the resource or has admin permissions
		if userID != resourceOwnerID {
			// Check if user has admin permissions for this resource type
			allowed, err := rbacService.CheckPermission(userID, resourceType, "admin")
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Permission check failed"})
				c.Abort()
				return
			}

			if !allowed {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: insufficient permissions"})
				c.Abort()
				return
			}
		}

		// Store user ID in context for use in handlers
		c.Set("userID", userID)
		c.Next()
	}
}
