package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	// Server configuration
	Port           string
	Host           string
	TrustedProxies []string

	// Authentication configuration
	JWTSecret         string
	TokenHourLifespan int
	BcryptCost        int
	RSAKeys           RSAKeyConfig

	// Database configuration
	Database DatabaseConfig

	// External services configuration
	Ollama OllamaConfig
	LLM    LLMConfig
	APIs   APIConfig
}

// RSAKeyConfig holds RSA signing key configuration
type RSAKeyConfig struct {
	KeySize        int           // RSA key size in bits (default: 2048)
	Algorithm      string        // Signing algorithm (RS256, RS384, RS512)
	RotationDays   int           // Days after which keys should be rotated
	RotationPeriod time.Duration // Calculated rotation period
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Driver       string
	Host         string
	Port         string
	User         string
	Password     string
	Name         string
	Charset      string
	ParseTime    bool
	Loc          string
	SQLiteDir    string
	SQLiteFile   string
	MaxOpenConns int
	MaxIdleConns int
	MaxLifetime  time.Duration
}

// OllamaConfig holds Ollama client configuration
type OllamaConfig struct {
	BaseURL string
	Timeout time.Duration
}

// LLMConfig holds LLM service configuration
type LLMConfig struct {
	Host        string
	BackendType string
	Model       string
	OpenAIKey   string
}

// APIConfig holds external API configuration
type APIConfig struct {
	ArasaacBaseURL string
}

// Load loads the application configuration
func Load() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("[CONFIG] Warning: Could not load .env file: %v", err)
	}

	return &Config{
		// Server configuration
		Port:           getEnv("APP_PORT", "6542"),
		Host:           getEnv("APP_HOST", "localhost"),
		TrustedProxies: parseTrustedProxies(),

		// Authentication configuration
		JWTSecret:         getJWTSecret(),
		TokenHourLifespan: getEnvInt("TOKEN_HOUR_LIFESPAN", 24),
		BcryptCost:        getEnvInt("BCRYPT_COST", 12),
		RSAKeys:           loadRSAKeyConfig(),

		// Database configuration
		Database: DatabaseConfig{
			Driver:       getEnv("DB_TYPE", "sqlite"),
			Host:         getEnv("DB_HOST", "localhost"),
			Port:         getEnv("DB_PORT", "3306"),
			User:         getEnv("DB_USER", "root"),
			Password:     getEnv("DB_PASSWORD", ""),
			Name:         getEnv("DB_NAME", "webapp_caa"),
			Charset:      getEnv("DB_CHARSET", "utf8mb4"),
			ParseTime:    getEnvBool("DB_PARSE_TIME", true),
			Loc:          getEnv("DB_LOC", "Local"),
			SQLiteDir:    getEnv("DB_SQLITE_DIR", "./data"),
			SQLiteFile:   getEnv("DB_SQLITE_FILE", "database.sqlite"),
			MaxOpenConns: getEnvInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns: getEnvInt("DB_MAX_IDLE_CONNS", 5),
			MaxLifetime:  time.Hour,
		},

		// External services configuration
		Ollama: OllamaConfig{
			BaseURL: getEnv("OLLAMA_BASE_URL", "http://localhost:11434"),
			Timeout: getEnvDuration("OLLAMA_TIMEOUT", 60*time.Second),
		},

		LLM: LLMConfig{
			Host:        getEnv("LLM_HOST", "http://localhost:11434"),
			BackendType: getEnv("BACKEND_TYPE", "ollama"),
			Model:       getEnv("LLM_MODEL", ""),
			OpenAIKey:   getEnv("OPENAI_API_KEY", ""),
		},

		APIs: APIConfig{
			ArasaacBaseURL: getEnv("ARASAAC_BASE_URL", "https://api.arasaac.org/api/pictograms"),
		},
	}
}

// Helper functions for loading configuration values
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	intVal, err := strconv.Atoi(value)
	if err != nil {
		log.Printf("[CONFIG] Warning: Invalid integer value for %s: %s, using default: %d", key, value, defaultValue)
		return defaultValue
	}
	return intVal
}

func getEnvBool(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	boolVal, err := strconv.ParseBool(value)
	if err != nil {
		log.Printf("[CONFIG] Warning: Invalid boolean value for %s: %s, using default: %t", key, value, defaultValue)
		return defaultValue
	}
	return boolVal
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	duration, err := time.ParseDuration(value)
	if err != nil {
		log.Printf("[CONFIG] Warning: Invalid duration value for %s: %s, using default: %v", key, value, defaultValue)
		return defaultValue
	}
	return duration
}

func getJWTSecret() string {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-default-secret-key"
		log.Printf("[CONFIG] Warning: JWT_SECRET not set, using default")
	}
	return jwtSecret
}

func parseTrustedProxies() []string {
	trustedProxiesEnv := os.Getenv("TRUSTED_PROXIES")
	if trustedProxiesEnv == "" {
		// Default trusted proxies
		return []string{"127.0.0.1", "::1"}
	}

	// Split by comma and trim spaces
	proxies := strings.Split(trustedProxiesEnv, ",")
	var result []string
	for _, proxy := range proxies {
		result = append(result, strings.TrimSpace(proxy))
	}
	return result
}

func loadRSAKeyConfig() RSAKeyConfig {
	rotationDays := getEnvInt("RSA_KEY_ROTATION_DAYS", 30) // Default: rotate every 30 days
	return RSAKeyConfig{
		KeySize:        getEnvInt("RSA_KEY_SIZE", 2048),
		Algorithm:      getEnv("RSA_ALGORITHM", "RS256"),
		RotationDays:   rotationDays,
		RotationPeriod: time.Duration(rotationDays) * 24 * time.Hour,
	}
}
