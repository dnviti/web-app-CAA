package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"time"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SigningKeyRepository handles signing key persistence
type SigningKeyRepository interface {
	GetActiveKey() (*models.SigningKey, error)
	GetKeyByKeyID(keyID string) (*models.SigningKey, error)
	GetValidKeys() ([]*models.SigningKey, error)
	CreateKey(keySize int, algorithm string, expiresAt time.Time) (*models.SigningKey, error)
	ActivateKey(keyID string) error
	DeactivateAllKeys() error
	MarkKeyAsRotated(keyID string) error
	ExpireActiveKeys() error
	CleanupExpiredKeys() error
}

// SigningKeyRepositoryImpl implements SigningKeyRepository
type SigningKeyRepositoryImpl struct {
	db *gorm.DB
}

// NewSigningKeyRepository creates a new signing key repository
func NewSigningKeyRepository(db *gorm.DB) SigningKeyRepository {
	return &SigningKeyRepositoryImpl{db: db}
}

// GetActiveKey retrieves the currently active signing key
func (r *SigningKeyRepositoryImpl) GetActiveKey() (*models.SigningKey, error) {
	var key models.SigningKey
	err := r.db.Where("is_active = ? AND expires_at > ?", true, time.Now()).First(&key).Error
	if err != nil {
		return nil, err
	}
	return &key, nil
}

// GetKeyByKeyID retrieves a signing key by its key ID
func (r *SigningKeyRepositoryImpl) GetKeyByKeyID(keyID string) (*models.SigningKey, error) {
	var key models.SigningKey
	err := r.db.Where("key_id = ?", keyID).First(&key).Error
	if err != nil {
		return nil, err
	}
	return &key, nil
}

// GetValidKeys retrieves all valid (non-expired) keys for verification
func (r *SigningKeyRepositoryImpl) GetValidKeys() ([]*models.SigningKey, error) {
	var keys []*models.SigningKey
	err := r.db.Where("expires_at > ?", time.Now()).Find(&keys).Error
	if err != nil {
		return nil, err
	}
	return keys, nil
}

// CreateKey generates a new RSA key pair and stores it in the database
func (r *SigningKeyRepositoryImpl) CreateKey(keySize int, algorithm string, expiresAt time.Time) (*models.SigningKey, error) {
	log.Printf("[SIGNING-KEY-REPO] Generating new RSA key pair (size: %d bits, algorithm: %s)", keySize, algorithm)

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

	log.Printf("[SIGNING-KEY-REPO] Generated and stored new signing key with ID: %s", signingKey.KeyID)
	return signingKey, nil
}

// ActivateKey sets a key as active and deactivates all other keys
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

		log.Printf("[SIGNING-KEY-REPO] Activated signing key: %s", keyID)
		return nil
	})
}

// DeactivateAllKeys deactivates all signing keys
func (r *SigningKeyRepositoryImpl) DeactivateAllKeys() error {
	err := r.db.Model(&models.SigningKey{}).Where("is_active = ?", true).Update("is_active", false).Error
	if err != nil {
		return fmt.Errorf("failed to deactivate all keys: %w", err)
	}
	log.Printf("[SIGNING-KEY-REPO] Deactivated all signing keys")
	return nil
}

// MarkKeyAsRotated marks a key as rotated by setting the RotatedAt timestamp
func (r *SigningKeyRepositoryImpl) MarkKeyAsRotated(keyID string) error {
	now := time.Now()
	result := r.db.Model(&models.SigningKey{}).
		Where("key_id = ?", keyID).
		Update("rotated_at", &now)

	if result.Error != nil {
		return fmt.Errorf("failed to mark key %s as rotated: %w", keyID, result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("key with ID %s not found", keyID)
	}

	log.Printf("[SIGNING-KEY-REPO] Marked signing key as rotated: %s", keyID)
	return nil
}

// ExpireActiveKeys marks all active keys as expired by setting their ExpiresAt to now
func (r *SigningKeyRepositoryImpl) ExpireActiveKeys() error {
	now := time.Now()
	result := r.db.Model(&models.SigningKey{}).
		Where("is_active = ? AND expires_at > ?", true, now).
		Updates(map[string]interface{}{
			"expires_at": now,
			"rotated_at": &now,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to expire active keys: %w", result.Error)
	}

	if result.RowsAffected > 0 {
		log.Printf("[SIGNING-KEY-REPO] Expired %d active signing keys", result.RowsAffected)
	}
	return nil
}

// CleanupExpiredKeys removes expired keys from the database
func (r *SigningKeyRepositoryImpl) CleanupExpiredKeys() error {
	// Only delete keys that expired more than 7 days ago to allow for clock skew
	cutoffTime := time.Now().AddDate(0, 0, -7)
	result := r.db.Where("expires_at < ?", cutoffTime).Delete(&models.SigningKey{})
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup expired keys: %w", result.Error)
	}
	if result.RowsAffected > 0 {
		log.Printf("[SIGNING-KEY-REPO] Cleaned up %d expired signing keys", result.RowsAffected)
	}
	return nil
}
