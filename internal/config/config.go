package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	Port              string
	Host              string
	JWTSecret         string
	APISecret         string
	TokenHourLifespan int
	TrustedProxies    []string
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
		port = "6542"
	}

	host := os.Getenv("APP_HOST")
	if host == "" {
		host = "localhost"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-default-secret-key"
	}

	apiSecret := os.Getenv("API_SECRET")
	if apiSecret == "" {
		// Fallback to JWT_SECRET for backwards compatibility
		apiSecret = jwtSecret
	}

	tokenHourLifespan := 24 // Default to 24 hours
	if lifespanStr := os.Getenv("TOKEN_HOUR_LIFESPAN"); lifespanStr != "" {
		if parsed, err := strconv.Atoi(lifespanStr); err == nil {
			tokenHourLifespan = parsed
		}
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
		Port:              port,
		Host:              host,
		JWTSecret:         jwtSecret,
		APISecret:         apiSecret,
		TokenHourLifespan: tokenHourLifespan,
		TrustedProxies:    trustedProxies,
	}
}
