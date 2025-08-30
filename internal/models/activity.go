package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserActivity represents a user activity log entry
type UserActivity struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID      string    `json:"user_id" gorm:"not null;index"`
	Action      string    `json:"action" gorm:"not null"`
	Resource    string    `json:"resource,omitempty"`
	Description string    `json:"description"`
	IPAddress   string    `json:"ip_address"`
	UserAgent   string    `json:"user_agent"`
	CreatedAt   time.Time `json:"created_at"`
}

// TableName specifies the table name for UserActivity
func (UserActivity) TableName() string {
	return "user_activities"
}

// BeforeCreate generates a UUID for the activity before creating it
func (a *UserActivity) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}
