package models

import (
	"time"
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

// JWTClaims represents the JWT token claims
type JWTClaims struct {
	UserID   uint   `json:"userId"`
	Username string `json:"username"`
}
