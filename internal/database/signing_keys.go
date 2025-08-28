package database

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"log"
	"time"

	"github.com/daniele/web-app-caa/internal/config"
	"github.com/daniele/web-app-caa/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SeedSigningKeys ensures there's always at least one active signing key
// This function is idempotent - it can be run multiple times safely
func SeedSigningKeys(db *gorm.DB, cfg *config.RSAKeyConfig) error {
	log.Printf("[DATABASE SEEDING] Verifying signing keys setup...")

	// Check if we have any signing keys
	var count int64
	if err := db.Model(&models.SigningKey{}).Count(&count).Error; err != nil {
		return err
	}

	// If no keys exist, create the initial key
	if count == 0 {
		log.Printf("[DATABASE SEEDING] No signing keys found, creating initial RSA key pair")

		expiresAt := time.Now().Add(cfg.RotationPeriod)
		initialKey, err := createSigningKey(db, cfg.KeySize, cfg.Algorithm, expiresAt)
		if err != nil {
			return err
		}

		// Activate the initial key
		if err := activateSigningKey(db, initialKey.KeyID); err != nil {
			return err
		}

		log.Printf("[DATABASE SEEDING] Initial RSA signing key created and activated: %s (algorithm: %s, key size: %d bits)",
			initialKey.KeyID, initialKey.Algorithm, initialKey.KeySize)
	} else {
		log.Printf("[DATABASE SEEDING] Found %d existing signing keys", count)

		// Verify we have at least one active, non-expired key
		var activeCount int64
		if err := db.Model(&models.SigningKey{}).
			Where("is_active = ? AND expires_at > ?", true, time.Now()).
			Count(&activeCount).Error; err != nil {
			return err
		}

		if activeCount == 0 {
			log.Printf("[DATABASE SEEDING] No active signing keys found, creating new one")
			expiresAt := time.Now().Add(cfg.RotationPeriod)

			// Create new signing key
			newKey, err := createSigningKey(db, cfg.KeySize, cfg.Algorithm, expiresAt)
			if err != nil {
				return err
			}

			// Activate the new key
			if err := activateSigningKey(db, newKey.KeyID); err != nil {
				return err
			}

			log.Printf("[DATABASE SEEDING] New active RSA signing key created: %s", newKey.KeyID)
		} else {
			log.Printf("[DATABASE SEEDING] Found %d active signing keys", activeCount)
		}
	}

	return nil
}

// createSigningKey generates a new RSA key pair and stores it in the database
func createSigningKey(db *gorm.DB, keySize int, algorithm string, expiresAt time.Time) (*models.SigningKey, error) {
	log.Printf("[DATABASE SEEDING] Generating new RSA key pair (size: %d bits, algorithm: %s)", keySize, algorithm)

	// Generate RSA key pair
	privateKey, err := rsa.GenerateKey(rand.Reader, keySize)
	if err != nil {
		return nil, err
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
		return nil, err
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
	if err := db.Create(signingKey).Error; err != nil {
		return nil, err
	}

	log.Printf("[DATABASE SEEDING] Generated and stored new signing key with ID: %s", signingKey.KeyID)
	return signingKey, nil
}

// activateSigningKey activates a specific key and deactivates all others
func activateSigningKey(db *gorm.DB, keyID string) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// First mark all currently active keys as rotated and deactivate them
		now := time.Now()
		if err := tx.Model(&models.SigningKey{}).
			Where("is_active = ?", true).
			Updates(map[string]interface{}{
				"is_active":  false,
				"rotated_at": &now,
			}).Error; err != nil {
			return err
		}

		// Activate the specified key
		result := tx.Model(&models.SigningKey{}).Where("key_id = ?", keyID).Update("is_active", true)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		log.Printf("[DATABASE SEEDING] Activated signing key: %s", keyID)
		return nil
	})
}
