package migrations

import (
	"github.com/daniele/web-app-caa/internal/models"
	"gorm.io/gorm"
)

// RefreshTokenMigration creates the refresh_tokens table
func RefreshTokenMigration(db *gorm.DB) error {
	return db.AutoMigrate(&models.RefreshToken{})
}
