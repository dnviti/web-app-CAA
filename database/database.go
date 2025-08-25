package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"gin/models"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Driver    string
	Host      string
	Port      string
	User      string
	Password  string
	Name      string
	Charset   string
	ParseTime bool
	Loc       string
}

// loadDatabaseConfig loads database configuration from environment variables
func loadDatabaseConfig() DatabaseConfig {
	config := DatabaseConfig{
		Driver:    getEnv("DB_TYPE", "sqlite"), // Changed from DB_DRIVER to DB_TYPE to match .env
		Host:      getEnv("DB_HOST", "localhost"),
		Port:      getEnv("DB_PORT", "3306"),
		User:      getEnv("DB_USER", "root"),
		Password:  getEnv("DB_PASSWORD", ""),
		Name:      getEnv("DB_NAME", "webapp_caa"),
		Charset:   getEnv("DB_CHARSET", "utf8mb4"),
		ParseTime: getEnvBool("DB_PARSE_TIME", true),
		Loc:       getEnv("DB_LOC", "Local"),
	}

	log.Printf("[DATABASE] Configuration loaded - Driver: %s, Host: %s, Port: %s, Name: %s",
		config.Driver, config.Host, config.Port, config.Name)

	return config
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// getEnvBool gets boolean environment variable with fallback
func getEnvBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		return value == "true" || value == "1" || value == "yes"
	}
	return fallback
}

// Initialize initializes the database connection
func Initialize() {
	var err error
	config := loadDatabaseConfig()

	// Configure GORM logger
	logLevel := logger.Silent
	if os.Getenv("DEBUG") == "true" {
		logLevel = logger.Info
	}

	switch config.Driver {
	case "mysql":
		DB, err = initializeMySQL(config, logLevel)
	case "sqlite":
		DB, err = initializeSQLite(logLevel)
	default:
		log.Fatalf("Unsupported database driver: %s. Supported drivers: mysql, sqlite", config.Driver)
	}

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate the models
	if err := DB.AutoMigrate(&models.User{}, &models.GridItem{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Printf("[DATABASE] Connected and migrated successfully using %s driver", config.Driver)
}

// initializeMySQL initializes MySQL database connection
func initializeMySQL(config DatabaseConfig, logLevel logger.LogLevel) (*gorm.DB, error) {
	// Build MySQL DSN (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=%t&loc=%s",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		config.Name,
		config.Charset,
		config.ParseTime,
		config.Loc,
	)

	log.Printf("[DATABASE] Connecting to MySQL at %s:%s/%s", config.Host, config.Port, config.Name)

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

	// Configure connection pool settings
	maxOpenConns := 25
	maxIdleConns := 5
	maxLifetime := time.Hour

	if envMaxOpen := getEnv("DB_MAX_OPEN_CONNS", ""); envMaxOpen != "" {
		if parsed, parseErr := fmt.Sscanf(envMaxOpen, "%d", &maxOpenConns); parseErr != nil || parsed != 1 {
			log.Printf("[DATABASE] Invalid DB_MAX_OPEN_CONNS value, using default: %d", maxOpenConns)
		}
	}

	if envMaxIdle := getEnv("DB_MAX_IDLE_CONNS", ""); envMaxIdle != "" {
		if parsed, parseErr := fmt.Sscanf(envMaxIdle, "%d", &maxIdleConns); parseErr != nil || parsed != 1 {
			log.Printf("[DATABASE] Invalid DB_MAX_IDLE_CONNS value, using default: %d", maxIdleConns)
		}
	}

	sqlDB.SetMaxOpenConns(maxOpenConns)
	sqlDB.SetMaxIdleConns(maxIdleConns)
	sqlDB.SetConnMaxLifetime(maxLifetime)

	log.Printf("[DATABASE] MySQL connection pool configured - MaxOpen: %d, MaxIdle: %d, MaxLifetime: %v",
		maxOpenConns, maxIdleConns, maxLifetime)

	return db, nil
}

// initializeSQLite initializes SQLite database connection
func initializeSQLite(logLevel logger.LogLevel) (*gorm.DB, error) {
	// Create database directory if it doesn't exist
	dbDir := getEnv("DB_SQLITE_DIR", filepath.Join(".", "data"))
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	dbFile := getEnv("DB_SQLITE_FILE", "database.sqlite")
	dbPath := filepath.Join(dbDir, dbFile)

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
