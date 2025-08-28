package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SigningKey represents an RSA key pair used for JWT signing
type SigningKey struct {
	ID         string     `json:"id" gorm:"primaryKey;type:varchar(36)"`
	PrivateKey string     `json:"-" gorm:"type:text;not null"`          // PEM encoded RSA private key
	PublicKey  string     `json:"public_key" gorm:"type:text;not null"` // PEM encoded RSA public key
	KeyID      string     `json:"key_id" gorm:"uniqueIndex;not null"`   // Unique identifier for the key (used in JWT header)
	IsActive   bool       `json:"is_active" gorm:"default:false"`       // Whether this key is currently used for signing
	Algorithm  string     `json:"algorithm" gorm:"default:RS256"`       // Signing algorithm (RS256, RS384, RS512)
	KeySize    int        `json:"key_size" gorm:"default:2048"`         // RSA key size in bits
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	ExpiresAt  time.Time  `json:"expires_at"`           // When this key should be rotated
	RotatedAt  *time.Time `json:"rotated_at,omitempty"` // When this key was rotated (if applicable)
}

func (SigningKey) TableName() string {
	return "signing_keys"
}

// BeforeCreate generates a UUID for the signing key before creating it
func (sk *SigningKey) BeforeCreate(tx *gorm.DB) error {
	if sk.ID == "" {
		sk.ID = uuid.New().String()
	}
	if sk.KeyID == "" {
		sk.KeyID = uuid.New().String()
	}
	return nil
}

// IsExpired checks if the signing key is expired
func (sk *SigningKey) IsExpired() bool {
	return time.Now().After(sk.ExpiresAt)
}

// IsRotated checks if the signing key has been rotated
func (sk *SigningKey) IsRotated() bool {
	return sk.RotatedAt != nil
}

// IsValidForSigning checks if the key can be used for signing (active and not expired)
func (sk *SigningKey) IsValidForSigning() bool {
	return sk.IsActive && !sk.IsExpired()
}

// IsValidForVerification checks if the key can be used for verification (not expired)
// Keys that are rotated can still verify tokens issued before rotation
func (sk *SigningKey) IsValidForVerification() bool {
	return !sk.IsExpired()
}

// GetStatus returns a human-readable status of the key
func (sk *SigningKey) GetStatus() string {
	if sk.IsExpired() {
		return "expired"
	}
	if sk.IsActive {
		return "active"
	}
	if sk.IsRotated() {
		return "rotated"
	}
	return "inactive"
}
