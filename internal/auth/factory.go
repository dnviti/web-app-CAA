package auth

import (
	"time"

	"github.com/daniele/web-app-caa/internal/config"
	"gorm.io/gorm"
)

// Factory creates and configures authentication components
type Factory struct {
	config       *AuthConfig
	tokenService TokenService
	userRepo     UserRepository
	gridRepo     GridRepository
	authService  AuthService
	middleware   *Middleware
	handler      *Handler
}

// AuthConfig holds auth-specific configuration derived from main config
type AuthConfig struct {
	JWTSecret     string
	TokenLifespan time.Duration
	BcryptCost    int
}

// NewFactory creates a new authentication factory
func NewFactory(db *gorm.DB, cfg *config.Config) *Factory {
	// Create auth-specific config from main config
	authConfig := &AuthConfig{
		JWTSecret:     cfg.APISecret,
		TokenLifespan: time.Duration(cfg.TokenHourLifespan) * time.Hour,
		BcryptCost:    cfg.BcryptCost,
	}

	// Create repositories
	userRepo := NewGormUserRepository(db)
	gridRepo := NewGormGridRepository(db)

	// Create services
	tokenService := NewJWTTokenService(authConfig)
	authService := NewAuthService(userRepo, gridRepo, tokenService, authConfig)

	// Create middleware and handler
	middleware := NewMiddleware(tokenService, userRepo)
	handler := NewHandler(authService)

	return &Factory{
		config:       authConfig,
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
