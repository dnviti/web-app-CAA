package auth

import (
	"log"
	"time"

	"github.com/daniele/web-app-caa/internal/config"
	"gorm.io/gorm"
)

// Factory creates and configures authentication components
type Factory struct {
	config            *AuthConfig
	signingKeyRepo    SigningKeyRepository
	signingKeyService SigningKeyService
	tokenService      TokenService
	userRepo          UserRepository
	gridRepo          GridRepository
	refreshTokenRepo  RefreshTokenRepository
	authService       AuthService
	middleware        *Middleware
	handler           *Handler
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
		JWTSecret:     cfg.JWTSecret,
		TokenLifespan: time.Duration(cfg.TokenHourLifespan) * time.Hour,
		BcryptCost:    cfg.BcryptCost,
	}

	// Create repositories
	userRepo := NewGormUserRepository(db)
	gridRepo := NewGormGridRepository(db)
	refreshTokenRepo := NewRefreshTokenRepository(db)
	signingKeyRepo := NewSigningKeyRepository(db)

	// Create signing key service
	signingKeyService := NewSigningKeyService(signingKeyRepo, &cfg.RSAKeys)

	// Create token service with RSA signing
	tokenService := NewJWTTokenService(signingKeyService)

	// Create auth service
	authService := NewAuthService(userRepo, gridRepo, tokenService, refreshTokenRepo, authConfig)

	// Create middleware and handler
	middleware := NewMiddleware(tokenService, userRepo)
	handler := NewHandler(authService)

	// Start auto key rotation
	if err := signingKeyService.StartAutoRotation(); err != nil {
		log.Printf("[AUTH-FACTORY] Warning: Failed to start auto key rotation: %v", err)
	} else {
		log.Printf("[AUTH-FACTORY] RSA key auto-rotation started")
	}

	return &Factory{
		config:            authConfig,
		signingKeyRepo:    signingKeyRepo,
		signingKeyService: signingKeyService,
		tokenService:      tokenService,
		userRepo:          userRepo,
		gridRepo:          gridRepo,
		refreshTokenRepo:  refreshTokenRepo,
		authService:       authService,
		middleware:        middleware,
		handler:           handler,
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

// GetSigningKeyService returns the signing key service
func (f *Factory) GetSigningKeyService() SigningKeyService {
	return f.signingKeyService
}

// GetSigningKeyRepository returns the signing key repository
func (f *Factory) GetSigningKeyRepository() SigningKeyRepository {
	return f.signingKeyRepo
}

// GetRefreshTokenRepository returns the refresh token repository
func (f *Factory) GetRefreshTokenRepository() RefreshTokenRepository {
	return f.refreshTokenRepo
}

// Cleanup performs cleanup operations (like stopping auto-rotation)
func (f *Factory) Cleanup() {
	if f.signingKeyService != nil {
		f.signingKeyService.StopAutoRotation()
		log.Printf("[AUTH-FACTORY] Authentication factory cleanup completed")
	}
}
