package utils

import (
	"github.com/daniele/web-app-caa/internal/auth"
	"github.com/gin-gonic/gin"
)

// ExtractUserID is a helper function to extract user ID from JWT token using the new auth system
func ExtractUserID(c *gin.Context) string {
	return auth.GetUserID(c)
}
