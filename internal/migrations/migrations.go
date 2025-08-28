package migrations

import (
	"gorm.io/gorm"
)

// GetAllMigrations returns all available migrations in order
func GetAllMigrations() []Migration {
	return []Migration{
		CreateRBACMigration(),
		{
			ID:          "002_refresh_tokens",
			Name:        "RefreshTokens",
			Description: "Create refresh tokens table",
			Version:     "1.0.0",
			Execute: func(db *gorm.DB) error {
				return RefreshTokenMigration(db)
			},
			Rollback: func(db *gorm.DB) error {
				return db.Migrator().DropTable("refresh_tokens")
			},
		},
		// Future migrations can be added here
	}
}

// RunDatabaseMigrations runs all database migrations
func RunDatabaseMigrations(db *gorm.DB) error {
	runner := NewMigrationRunner(db)

	// Add all migrations
	for _, migration := range GetAllMigrations() {
		runner.AddMigration(migration)
	}

	// Execute migrations
	return runner.RunMigrations()
}
