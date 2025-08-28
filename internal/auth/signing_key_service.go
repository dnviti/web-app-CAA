package auth

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"time"

	"github.com/daniele/web-app-caa/internal/config"
	"github.com/daniele/web-app-caa/internal/models"
)

// SigningKeyService manages RSA signing keys
type SigningKeyService interface {
	EnsureValidKey() (*models.SigningKey, error)
	GetSigningKey() (*rsa.PrivateKey, string, error) // Returns private key and key ID
	GetVerificationKey(keyID string) (*rsa.PublicKey, error)
	RotateKeys() error
	ForceRotateKeys() error // Force rotation even if current key is still valid
	StartAutoRotation() error
	StopAutoRotation()
}

// SigningKeyServiceImpl implements SigningKeyService
type SigningKeyServiceImpl struct {
	repo           SigningKeyRepository
	config         *config.RSAKeyConfig
	rotationTicker *time.Ticker
	stopChannel    chan bool
}

// NewSigningKeyService creates a new signing key service
func NewSigningKeyService(repo SigningKeyRepository, cfg *config.RSAKeyConfig) SigningKeyService {
	return &SigningKeyServiceImpl{
		repo:        repo,
		config:      cfg,
		stopChannel: make(chan bool),
	}
}

// EnsureValidKey ensures there's a valid active signing key, creating one if necessary
func (s *SigningKeyServiceImpl) EnsureValidKey() (*models.SigningKey, error) {
	// Try to get active key
	activeKey, err := s.repo.GetActiveKey()
	if err == nil && activeKey.IsValidForSigning() {
		return activeKey, nil
	}

	log.Printf("[SIGNING-KEY-SERVICE] No valid active key found, generating new one")

	// Create new key
	expiresAt := time.Now().Add(s.config.RotationPeriod)
	newKey, err := s.repo.CreateKey(s.config.KeySize, s.config.Algorithm, expiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create new signing key: %w", err)
	}

	// Activate the new key
	if err := s.repo.ActivateKey(newKey.KeyID); err != nil {
		return nil, fmt.Errorf("failed to activate new signing key: %w", err)
	}

	// Update the key state
	newKey.IsActive = true
	return newKey, nil
}

// GetSigningKey returns the current active private key for signing
func (s *SigningKeyServiceImpl) GetSigningKey() (*rsa.PrivateKey, string, error) {
	activeKey, err := s.EnsureValidKey()
	if err != nil {
		return nil, "", err
	}

	// Parse the private key PEM
	block, _ := pem.Decode([]byte(activeKey.PrivateKey))
	if block == nil {
		return nil, "", fmt.Errorf("failed to decode private key PEM")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, "", fmt.Errorf("failed to parse private key: %w", err)
	}

	return privateKey, activeKey.KeyID, nil
}

// GetVerificationKey returns the public key for a specific key ID for verification
func (s *SigningKeyServiceImpl) GetVerificationKey(keyID string) (*rsa.PublicKey, error) {
	key, err := s.repo.GetKeyByKeyID(keyID)
	if err != nil {
		return nil, fmt.Errorf("key not found: %w", err)
	}

	if !key.IsValidForVerification() {
		return nil, fmt.Errorf("key %s is expired", keyID)
	}

	// Parse the public key PEM
	block, _ := pem.Decode([]byte(key.PublicKey))
	if block == nil {
		return nil, fmt.Errorf("failed to decode public key PEM")
	}

	publicKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %w", err)
	}

	rsaPublicKey, ok := publicKey.(*rsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("key is not an RSA public key")
	}

	return rsaPublicKey, nil
}

// RotateKeys creates a new signing key, marks old keys as expired, and activates the new key
func (s *SigningKeyServiceImpl) RotateKeys() error {
	log.Printf("[SIGNING-KEY-SERVICE] Starting key rotation")

	// Get the current active key for logging purposes
	currentKey, err := s.repo.GetActiveKey()
	var currentKeyID string
	if err == nil {
		currentKeyID = currentKey.KeyID
	}

	// Create new key
	expiresAt := time.Now().Add(s.config.RotationPeriod)
	newKey, err := s.repo.CreateKey(s.config.KeySize, s.config.Algorithm, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to create new signing key during rotation: %w", err)
	}

	// Activate the new key (this will automatically mark old keys as rotated)
	if err := s.repo.ActivateKey(newKey.KeyID); err != nil {
		return fmt.Errorf("failed to activate new signing key during rotation: %w", err)
	}

	// Cleanup expired keys (keys that expired more than 7 days ago)
	if err := s.repo.CleanupExpiredKeys(); err != nil {
		log.Printf("[SIGNING-KEY-SERVICE] Warning: Failed to cleanup expired keys: %v", err)
	}

	if currentKeyID != "" {
		log.Printf("[SIGNING-KEY-SERVICE] Key rotation completed: %s -> %s", currentKeyID, newKey.KeyID)
	} else {
		log.Printf("[SIGNING-KEY-SERVICE] Key rotation completed successfully, new key ID: %s", newKey.KeyID)
	}
	return nil
}

// ForceRotateKeys forces key rotation regardless of current key validity
func (s *SigningKeyServiceImpl) ForceRotateKeys() error {
	log.Printf("[SIGNING-KEY-SERVICE] Force rotating keys")
	return s.RotateKeys()
}

// StartAutoRotation starts automatic key rotation
func (s *SigningKeyServiceImpl) StartAutoRotation() error {
	if s.rotationTicker != nil {
		return fmt.Errorf("auto rotation is already running")
	}

	// Ensure we have a valid key to start with
	_, err := s.EnsureValidKey()
	if err != nil {
		return fmt.Errorf("failed to ensure valid key before starting auto rotation: %w", err)
	}

	// Calculate rotation interval (rotate when 80% of the key's lifetime has passed)
	rotationInterval := time.Duration(float64(s.config.RotationPeriod) * 0.8)
	s.rotationTicker = time.NewTicker(rotationInterval)

	log.Printf("[SIGNING-KEY-SERVICE] Starting auto rotation with interval: %v", rotationInterval)

	go func() {
		for {
			select {
			case <-s.rotationTicker.C:
				if err := s.RotateKeys(); err != nil {
					log.Printf("[SIGNING-KEY-SERVICE] Auto rotation failed: %v", err)
				}
			case <-s.stopChannel:
				log.Printf("[SIGNING-KEY-SERVICE] Auto rotation stopped")
				return
			}
		}
	}()

	return nil
}

// StopAutoRotation stops automatic key rotation
func (s *SigningKeyServiceImpl) StopAutoRotation() {
	if s.rotationTicker != nil {
		s.rotationTicker.Stop()
		s.rotationTicker = nil
		s.stopChannel <- true
		log.Printf("[SIGNING-KEY-SERVICE] Auto rotation stopped")
	}
}
