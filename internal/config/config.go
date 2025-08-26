package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	Port           string
	Host           string
	JWTSecret      string
	TrustedProxies []string
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

	// Load trusted proxies
	trustedProxiesEnv := os.Getenv("TRUSTED_PROXIES")
	var trustedProxies []string
	if trustedProxiesEnv != "" {
		// Split by comma and trim spaces
		proxies := strings.Split(trustedProxiesEnv, ",")
		for _, proxy := range proxies {
			trustedProxies = append(trustedProxies, strings.TrimSpace(proxy))
		}
	} else {
		// Default trusted proxies
		trustedProxies = []string{"127.0.0.1", "::1"}
	}

	return &Config{
		Port:           port,
		Host:           host,
		JWTSecret:      jwtSecret,
		TrustedProxies: trustedProxies,
	}
}
