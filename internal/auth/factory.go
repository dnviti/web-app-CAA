package auth

import (
	"os"
	"strconv"
	"time"

	"gorm.io/gorm"
)

// Factory creates and configures authentication components
type Factory struct {
	config       *Config
	tokenService TokenService
	userRepo     UserRepository
	gridRepo     GridRepository
	authService  AuthService
	middleware   *Middleware
	handler      *Handler
}

// NewFactory creates a new authentication factory
func NewFactory(db *gorm.DB) *Factory {
	// Load configuration from environment
	config := loadConfig()

	// Create repositories
	userRepo := NewGormUserRepository(db)
	gridRepo := NewGormGridRepository(db)

	// Create services
	tokenService := NewJWTTokenService(config)
	authService := NewAuthService(userRepo, gridRepo, tokenService, config)

	// Create middleware and handler
	middleware := NewMiddleware(tokenService, userRepo)
	handler := NewHandler(authService)

	return &Factory{
		config:       config,
		tokenService: tokenService,
		userRepo:     userRepo,
		gridRepo:     gridRepo,
		authService:  authService,
		middleware:   middleware,
		handler:      handler,
	}
}

// GetHandler returns the authentication handler
func (f *Factory) GetHandler() *Handler {
	return f.handler
}

// GetMiddleware returns the authentication middleware
func (f *Factory) GetMiddleware() *Middleware {
	return f.middleware
}

// GetAuthService returns the authentication service
func (f *Factory) GetAuthService() AuthService {
	return f.authService
}

// GetTokenService returns the token service
func (f *Factory) GetTokenService() TokenService {
	return f.tokenService
}

// GetUserRepository returns the user repository
func (f *Factory) GetUserRepository() UserRepository {
	return f.userRepo
}

// GetGridRepository returns the grid repository
func (f *Factory) GetGridRepository() GridRepository {
	return f.gridRepo
}

// loadConfig loads authentication configuration from environment variables
func loadConfig() *Config {
	jwtSecret := os.Getenv("API_SECRET")
	if jwtSecret == "" {
		jwtSecret = os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "your-default-secret-key"
		}
	}

	tokenLifespanHours := 24 // default
	if lifespanStr := os.Getenv("TOKEN_HOUR_LIFESPAN"); lifespanStr != "" {
		if hours, err := strconv.Atoi(lifespanStr); err == nil {
			tokenLifespanHours = hours
		}
	}

	return &Config{
		JWTSecret:     jwtSecret,
		TokenLifespan: time.Duration(tokenLifespanHours) * time.Hour,
		BcryptCost:    12, // Default bcrypt cost
	}
}
