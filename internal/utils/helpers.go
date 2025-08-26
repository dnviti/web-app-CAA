package utils

import (
	"github.com/daniele/web-app-caa/internal/utils/token"
	"github.com/gin-gonic/gin"
)

// ExtractUserID is a helper function to extract user ID from JWT token
func ExtractUserID(c *gin.Context) (uint, error) {
	return token.ExtractTokenID(c)
}
