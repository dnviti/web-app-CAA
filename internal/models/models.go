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

// GridItem represents a grid item in the CAA system
type GridItem struct {
	ID             string `json:"id" gorm:"primaryKey"`
	UserID         uint   `json:"user_id" gorm:"primaryKey;index"`
	ParentCategory string `json:"parent_category" gorm:"not null;index"`
	ItemOrder      int    `json:"item_order"`
	Type           string `json:"type" gorm:"not null"`
	Label          string `json:"label" gorm:"not null"`
	Icon           string `json:"icon" gorm:"type:text"`
	Color          string `json:"color"`
	Target         string `json:"target"`
	Text           string `json:"text" gorm:"type:text"`
	Speak          string `json:"speak" gorm:"type:text"`
	Action         string `json:"action"`
	IsVisible      bool   `json:"isVisible" gorm:"default:true"`
	SymbolType     string `json:"symbol_type"`
	IsHideable     bool   `json:"isHideable" gorm:"default:true"`

	// Reference to User
	User User `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

func (GridItem) TableName() string {
	return "grid_items"
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Username       string `json:"username" binding:"required"`
	Password       string `json:"password" binding:"required"`
	EditorPassword string `json:"editorPassword" binding:"required"`
	GridType       string `json:"gridType" binding:"required"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// SetupRequest represents the setup request payload
type SetupRequest struct {
	GridType string `json:"gridType" binding:"required"`
}

// CheckEditorPasswordRequest represents the editor password check request
type CheckEditorPasswordRequest struct {
	Password string `json:"password" binding:"required"`
}

// GridResponse represents the grid data structure
type GridResponse map[string][]GridItemResponse

// GridItemResponse represents a grid item in the response
type GridItemResponse struct {
	ID         string `json:"id"`
	Type       string `json:"type"`
	Label      string `json:"label"`
	Icon       string `json:"icon"`
	Color      string `json:"color"`
	Target     string `json:"target,omitempty"`
	Text       string `json:"text,omitempty"`
	Speak      string `json:"speak,omitempty"`
	Action     string `json:"action,omitempty"`
	IsVisible  bool   `json:"isVisible"`
	SymbolType string `json:"symbol_type,omitempty"`
	IsHideable bool   `json:"isHideable"`
}

// AddItemRequest represents the add item request payload
type AddItemRequest struct {
	Item           GridItemResponse `json:"item" binding:"required"`
	ParentCategory string           `json:"parentCategory" binding:"required"`
}

// ConjugateRequest represents the conjugation request payload
type ConjugateRequest struct {
	Sentence  string   `json:"sentence"`
	Words     []string `json:"words"`
	BaseForms []string `json:"base_forms"`
	Tense     string   `json:"tense"`
}

// CorrectRequest represents the correction request payload
type CorrectRequest struct {
	Sentence string `json:"sentence"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Message string `json:"message"`
	Token   string `json:"token"`
	Status  string `json:"status"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token  string `json:"token"`
	Status string `json:"status"`
}
