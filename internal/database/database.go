package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/daniele/web-app-caa/internal/config"
	"github.com/daniele/web-app-caa/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Initialize initializes the database connection
func Initialize(cfg *config.Config) {
	var err error
	dbConfig := cfg.Database

	// Configure GORM logger
	logLevel := logger.Silent
	if os.Getenv("DEBUG") == "true" {
		logLevel = logger.Info
	}

	switch dbConfig.Driver {
	case "mysql":
		DB, err = initializeMySQL(dbConfig, logLevel)
	case "sqlite":
		DB, err = initializeSQLite(dbConfig, logLevel)
	default:
		log.Fatalf("Unsupported database driver: %s. Supported drivers: mysql, sqlite", dbConfig.Driver)
	}

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate the models (excluding SigningKey as it's handled by migration)
	if err := DB.AutoMigrate(
		&models.User{},
		&models.GridItem{},
		&models.Role{},
		&models.Permission{},
		&models.UserRole{},
		&models.RolePermission{},
		// SigningKey is handled by migration system for proper initialization
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Printf("[DATABASE] Connected and migrated successfully using %s driver", dbConfig.Driver)
}

// GetDB returns the database connection
func GetDB() *gorm.DB {
	return DB
}

// initializeMySQL initializes MySQL database connection
func initializeMySQL(dbConfig config.DatabaseConfig, logLevel logger.LogLevel) (*gorm.DB, error) {
	// Build MySQL DSN (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=%t&loc=%s",
		dbConfig.User,
		dbConfig.Password,
		dbConfig.Host,
		dbConfig.Port,
		dbConfig.Name,
		dbConfig.Charset,
		dbConfig.ParseTime,
		dbConfig.Loc,
	)

	log.Printf("[DATABASE] Connecting to MySQL at %s:%s/%s", dbConfig.Host, dbConfig.Port, dbConfig.Name)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MySQL: %w", err)
	}

	// Configure connection pool for MySQL
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Configure connection pool settings using config values
	sqlDB.SetMaxOpenConns(dbConfig.MaxOpenConns)
	sqlDB.SetMaxIdleConns(dbConfig.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(dbConfig.MaxLifetime)

	log.Printf("[DATABASE] MySQL connection pool configured - MaxOpen: %d, MaxIdle: %d, MaxLifetime: %v",
		dbConfig.MaxOpenConns, dbConfig.MaxIdleConns, dbConfig.MaxLifetime)

	return db, nil
}

// initializeSQLite initializes SQLite database connection
func initializeSQLite(dbConfig config.DatabaseConfig, logLevel logger.LogLevel) (*gorm.DB, error) {
	// Create database directory if it doesn't exist
	if err := os.MkdirAll(dbConfig.SQLiteDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	dbPath := filepath.Join(dbConfig.SQLiteDir, dbConfig.SQLiteFile)

	log.Printf("[DATABASE] Connecting to SQLite at %s", dbPath)

	// Open database connection
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to SQLite: %w", err)
	}

	// Configure SQLite
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Enable foreign keys for SQLite
	if _, err := sqlDB.Exec("PRAGMA foreign_keys = ON"); err != nil {
		log.Printf("[DATABASE] Warning: Failed to enable foreign keys: %v", err)
	}

	// Additional SQLite optimizations
	if _, err := sqlDB.Exec("PRAGMA journal_mode = WAL"); err != nil {
		log.Printf("[DATABASE] Warning: Failed to set WAL mode: %v", err)
	}

	if _, err := sqlDB.Exec("PRAGMA synchronous = NORMAL"); err != nil {
		log.Printf("[DATABASE] Warning: Failed to set synchronous mode: %v", err)
	}

	return db, nil
}
