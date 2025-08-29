package utils

import (
	"mime"

	"github.com/daniele/web-app-caa/internal/auth"
	"github.com/gin-gonic/gin"
)

// ExtractUserID is a helper function to extract user ID from JWT token using the new auth system
func ExtractUserID(c *gin.Context) string {
	return auth.GetUserID(c)
}

// GetFileExtensionFromMimeType returns the file extension for a given MIME type
// Returns a default extension if the MIME type is not recognized or has no extensions
func GetFileExtensionFromMimeType(mimeType, defaultExt string) string {
	// Get extension from mime type
	extensions, err := mime.ExtensionsByType(mimeType)
	ext := defaultExt // Default extension
	if err == nil && len(extensions) > 0 {
		ext = extensions[0] // Use the first extension
	}
	return ext
}
