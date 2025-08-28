package migrations

import (
	"github.com/daniele/web-app-caa/internal/config"
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

// GetSigningKeyMigration returns the signing key migration
func GetSigningKeyMigration(cfg *config.RSAKeyConfig) Migration {
	return Migration{
		ID:          "003_signing_keys",
		Name:        "SigningKeys",
		Description: "Create signing keys table and generate initial RSA key pair",
		Version:     "1.0.0",
		Execute: func(db *gorm.DB) error {
			return SigningKeyMigration(db, cfg)
		},
		Rollback: func(db *gorm.DB) error {
			return db.Migrator().DropTable("signing_keys")
		},
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

// RunDatabaseMigrationsWithRSA runs all database migrations including signing key migration
func RunDatabaseMigrationsWithRSA(db *gorm.DB, cfg *config.RSAKeyConfig) error {
	runner := NewMigrationRunner(db)

	// Add all standard migrations
	for _, migration := range GetAllMigrations() {
		runner.AddMigration(migration)
	}

	// Add signing key migration
	runner.AddMigration(GetSigningKeyMigration(cfg))

	// Execute migrations
	return runner.RunMigrations()
}
