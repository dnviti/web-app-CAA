package migrations

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"time"

	"github.com/daniele/web-app-caa/internal/config"
	"github.com/daniele/web-app-caa/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SigningKeyMigration creates the signing_keys table and generates initial key
func SigningKeyMigration(db *gorm.DB, cfg *config.RSAKeyConfig) error {
	// Create the table
	if err := db.AutoMigrate(&models.SigningKey{}); err != nil {
		return err
	}

	log.Printf("[MIGRATION] Signing keys table created/verified")

	// Check if we have any signing keys
	var count int64
	if err := db.Model(&models.SigningKey{}).Count(&count).Error; err != nil {
		return err
	}

	// If no keys exist, create the initial key
	if count == 0 {
		log.Printf("[MIGRATION] No signing keys found, creating initial RSA key pair")

		// Import the auth package functions we need
		keyRepo := &SigningKeyRepositoryImpl{db: db}
		expiresAt := time.Now().Add(cfg.RotationPeriod)

		// Create initial signing key
		initialKey, err := keyRepo.CreateKey(cfg.KeySize, cfg.Algorithm, expiresAt)
		if err != nil {
			return err
		}

		// Activate the initial key
		if err := keyRepo.ActivateKey(initialKey.KeyID); err != nil {
			return err
		}

		log.Printf("[MIGRATION] Initial RSA signing key created and activated: %s (algorithm: %s, key size: %d bits)",
			initialKey.KeyID, initialKey.Algorithm, initialKey.KeySize)
	} else {
		log.Printf("[MIGRATION] Found %d existing signing keys", count)

		// Verify we have at least one active, non-expired key
		var activeCount int64
		if err := db.Model(&models.SigningKey{}).
			Where("is_active = ? AND expires_at > ?", true, time.Now()).
			Count(&activeCount).Error; err != nil {
			return err
		}

		if activeCount == 0 {
			log.Printf("[MIGRATION] No active signing keys found, creating new one")
			keyRepo := &SigningKeyRepositoryImpl{db: db}
			expiresAt := time.Now().Add(cfg.RotationPeriod)

			// Create new signing key
			newKey, err := keyRepo.CreateKey(cfg.KeySize, cfg.Algorithm, expiresAt)
			if err != nil {
				return err
			}

			// Activate the new key
			if err := keyRepo.ActivateKey(newKey.KeyID); err != nil {
				return err
			}

			log.Printf("[MIGRATION] New active RSA signing key created: %s", newKey.KeyID)
		}
	}

	return nil
}

// SigningKeyRepositoryImpl minimal implementation for migration
type SigningKeyRepositoryImpl struct {
	db *gorm.DB
}

// CreateKey implementation for migration (simplified version)
func (r *SigningKeyRepositoryImpl) CreateKey(keySize int, algorithm string, expiresAt time.Time) (*models.SigningKey, error) {
	// This implementation is duplicated here to avoid circular imports during migration
	// It matches the implementation in auth/signing_key_repository.go

	log.Printf("[MIGRATION] Generating new RSA key pair (size: %d bits, algorithm: %s)", keySize, algorithm)

	// Generate RSA key pair
	privateKey, err := rsa.GenerateKey(rand.Reader, keySize)
	if err != nil {
		return nil, fmt.Errorf("failed to generate RSA key pair: %w", err)
	}

	// Encode private key to PEM format
	privateKeyPEM := &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	}
	privateKeyPEMBytes := pem.EncodeToMemory(privateKeyPEM)

	// Extract public key and encode to PEM format
	publicKey := &privateKey.PublicKey
	publicKeyPKIX, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal public key: %w", err)
	}

	publicKeyPEM := &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: publicKeyPKIX,
	}
	publicKeyPEMBytes := pem.EncodeToMemory(publicKeyPEM)

	// Create signing key model
	signingKey := &models.SigningKey{
		PrivateKey: string(privateKeyPEMBytes),
		PublicKey:  string(publicKeyPEMBytes),
		KeyID:      uuid.New().String(),
		IsActive:   false, // Not active by default
		Algorithm:  algorithm,
		KeySize:    keySize,
		ExpiresAt:  expiresAt,
	}

	// Save to database
	if err := r.db.Create(signingKey).Error; err != nil {
		return nil, fmt.Errorf("failed to save signing key: %w", err)
	}

	log.Printf("[MIGRATION] Generated and stored new signing key with ID: %s", signingKey.KeyID)
	return signingKey, nil
}

// ActivateKey implementation for migration
func (r *SigningKeyRepositoryImpl) ActivateKey(keyID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// First mark all currently active keys as rotated and deactivate them
		now := time.Now()
		if err := tx.Model(&models.SigningKey{}).
			Where("is_active = ?", true).
			Updates(map[string]interface{}{
				"is_active":  false,
				"rotated_at": &now,
			}).Error; err != nil {
			return fmt.Errorf("failed to deactivate and mark existing keys as rotated: %w", err)
		}

		// Activate the specified key
		result := tx.Model(&models.SigningKey{}).Where("key_id = ?", keyID).Update("is_active", true)
		if result.Error != nil {
			return fmt.Errorf("failed to activate key %s: %w", keyID, result.Error)
		}
		if result.RowsAffected == 0 {
			return fmt.Errorf("key with ID %s not found", keyID)
		}

		log.Printf("[MIGRATION] Activated signing key: %s", keyID)
		return nil
	})
}
