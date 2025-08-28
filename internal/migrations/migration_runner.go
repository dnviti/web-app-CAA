package migrations

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Migration represents a database migration
type Migration struct {
	ID          string
	Name        string
	Description string
	Version     string
	Execute     func(db *gorm.DB) error
	Rollback    func(db *gorm.DB) error
}

// MigrationRunner handles database migrations
type MigrationRunner struct {
	db         *gorm.DB
	migrations []Migration
}

// NewMigrationRunner creates a new migration runner
func NewMigrationRunner(db *gorm.DB) *MigrationRunner {
	return &MigrationRunner{
		db:         db,
		migrations: []Migration{},
	}
}

// AddMigration adds a migration to the runner
func (mr *MigrationRunner) AddMigration(migration Migration) {
	mr.migrations = append(mr.migrations, migration)
}

// RunMigrations executes all pending migrations
func (mr *MigrationRunner) RunMigrations() error {
	log.Printf("[MIGRATIONS] Starting database migrations...")

	// Create migration tracking table if it doesn't exist
	if err := mr.createMigrationTable(); err != nil {
		return fmt.Errorf("failed to create migration table: %w", err)
	}

	executed := 0
	skipped := 0
	for _, migration := range mr.migrations {
		wasSkipped, err := mr.executeMigration(migration)
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", migration.Name, err)
		}
		if wasSkipped {
			skipped++
		} else {
			executed++
		}
	}

	if executed > 0 {
		log.Printf("[MIGRATIONS] Successfully executed %d migrations", executed)
	}
	if skipped > 0 {
		log.Printf("[MIGRATIONS] Skipped %d already executed migrations", skipped)
	}
	if executed == 0 && skipped == 0 {
		log.Printf("[MIGRATIONS] No migrations found")
	}

	return nil
}

// createMigrationTable creates the migration tracking table
func (mr *MigrationRunner) createMigrationTable() error {
	type MigrationRecord struct {
		ID          string `gorm:"primaryKey;type:varchar(36)"`
		Name        string `gorm:"uniqueIndex;not null"`
		Description string `gorm:"type:text"`
		Version     string `gorm:"not null"`
		ExecutedAt  int64  `gorm:"not null"`
	}

	return mr.db.AutoMigrate(&MigrationRecord{})
}

// executeMigration executes a single migration if not already executed
// Returns (wasSkipped, error)
func (mr *MigrationRunner) executeMigration(migration Migration) (bool, error) {
	// Check if migration was already executed
	var count int64
	mr.db.Table("migration_records").Where("name = ?", migration.Name).Count(&count)

	if count > 0 {
		log.Printf("[MIGRATIONS] Skipping migration %s (already executed)", migration.Name)
		return true, nil
	}

	log.Printf("[MIGRATIONS] Executing migration: %s", migration.Name)

	// Execute the migration
	if err := migration.Execute(mr.db); err != nil {
		return false, err
	}

	// Record the migration as executed
	record := struct {
		ID          string `gorm:"primaryKey;type:varchar(36)"`
		Name        string `gorm:"uniqueIndex;not null"`
		Description string `gorm:"type:text"`
		Version     string `gorm:"not null"`
		ExecutedAt  int64  `gorm:"not null"`
	}{
		ID:          uuid.New().String(),
		Name:        migration.Name,
		Description: migration.Description,
		Version:     migration.Version,
		ExecutedAt:  time.Now().Unix(),
	}

	if err := mr.db.Table("migration_records").Create(&record).Error; err != nil {
		return false, fmt.Errorf("failed to record migration execution: %w", err)
	}

	log.Printf("[MIGRATIONS] Completed migration: %s", migration.Name)
	return false, nil
}
