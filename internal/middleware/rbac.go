package middleware

import (
	"fmt"
	"log"
	"net/http"

	"github.com/daniele/web-app-caa/internal/services"
	"github.com/gin-gonic/gin"
)

// RBACMiddleware creates a middleware for role-based access control
func RBACMiddleware(rbacService *services.RBACService, resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("[RBAC-MIDDLEWARE] Checking permission for resource: %s, action: %s", resource, action)

		// Get user ID from context (already validated by RequireAuth middleware)
		userID, exists := c.Get("user_id")
		if !exists {
			log.Printf("[RBAC-MIDDLEWARE] User ID not found in context - RequireAuth middleware not executed?")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		userIDStr, ok := userID.(string)
		if !ok {
			log.Printf("[RBAC-MIDDLEWARE] User ID in context is not a string: %T", userID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
			c.Abort()
			return
		}

		// Check if user has permission for the specified resource and action
		hasPermission, err := rbacService.CheckPermission(userIDStr, resource, action)
		if err != nil {
			log.Printf("[RBAC-MIDDLEWARE] Error checking permission for user %s: %v", userIDStr, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Permission check failed"})
			c.Abort()
			return
		}

		if !hasPermission {
			log.Printf("[RBAC-MIDDLEWARE] User %s denied access to %s:%s", userIDStr, resource, action)
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		log.Printf("[RBAC-MIDDLEWARE] User %s granted access to %s:%s", userIDStr, resource, action)

		// Store user ID in context for use in handlers
		c.Set("userID", userIDStr)
		c.Next()
	}
}

// RequireRole creates a middleware that requires specific roles
func RequireRole(rbacService *services.RBACService, requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("[RBAC-MIDDLEWARE] Checking roles: %v", requiredRoles)

		// Get user ID from context (set by RequireAuth middleware)
		userID, exists := c.Get("user_id")
		if !exists {
			log.Printf("[RBAC-MIDDLEWARE] User ID not found in context - RequireAuth middleware not executed?")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		userIDStr, ok := userID.(string)
		if !ok {
			log.Printf("[RBAC-MIDDLEWARE] User ID in context is not a string: %T", userID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
			c.Abort()
			return
		}

		// Get user roles
		userRoles, err := rbacService.GetUserRoles(userIDStr)
		if err != nil {
			log.Printf("[RBAC-MIDDLEWARE] Failed to get user roles for user %s: %v", userIDStr, err)
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
					log.Printf("[RBAC-MIDDLEWARE] User %s has required role: %s", userIDStr, requiredRole)
					break
				}
			}
			if hasRequiredRole {
				break
			}
		}

		if !hasRequiredRole {
			log.Printf("[RBAC-MIDDLEWARE] User %s does not have any required role: %v", userIDStr, requiredRoles)
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions - required roles: " + fmt.Sprintf("%v", requiredRoles)})
			c.Abort()
			return
		}

		c.Next()
	}
}
