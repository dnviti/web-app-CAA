package models

import (
	"html"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID             uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Username       string    `json:"username" gorm:"uniqueIndex;not null"`
	Password       string    `json:"-" gorm:"not null"`
	EditorPassword string    `json:"-" gorm:"column:editor_password"`
	Status         string    `json:"status" gorm:"default:pending_setup;not null"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

// BeforeSave is a GORM hook that runs before saving the user
func (u *User) BeforeSave(tx *gorm.DB) error {
	// Hash password if it's being set/changed and not already hashed
	if u.Password != "" && !isAlreadyHashed(u.Password) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}

	// Hash editor password if it's being set/changed and not already hashed
	if u.EditorPassword != "" && !isAlreadyHashed(u.EditorPassword) {
		hashedEditorPassword, err := bcrypt.GenerateFromPassword([]byte(u.EditorPassword), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.EditorPassword = string(hashedEditorPassword)
	}

	// Sanitize username
	u.Username = html.EscapeString(strings.TrimSpace(u.Username))

	return nil
}

// VerifyPassword verifies the provided password against the user's hashed password
func (u *User) VerifyPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// VerifyEditorPassword verifies the provided editor password against the user's hashed editor password
func (u *User) VerifyEditorPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.EditorPassword), []byte(password))
}

// PrepareGive removes sensitive information before returning user data
func (u *User) PrepareGive() {
	u.Password = ""
	u.EditorPassword = ""
}

// isAlreadyHashed checks if a password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
func isAlreadyHashed(password string) bool {
	return strings.HasPrefix(password, "$2a$") || strings.HasPrefix(password, "$2b$") || strings.HasPrefix(password, "$2y$")
}
