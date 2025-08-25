package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	Port      string
	Host      string
	JWTSecret string
}

// Load loads the application configuration
func Load() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("[CONFIG] Warning: Could not load .env file: %v", err)
	}

	// Load configuration
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "3000"
	}

	host := os.Getenv("APP_HOST")
	if host == "" {
		host = "localhost"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-default-secret-key"
	}

	return &Config{
		Port:      port,
		Host:      host,
		JWTSecret: jwtSecret,
	}
}
