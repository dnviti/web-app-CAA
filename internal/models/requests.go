package models

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

// RefreshTokenRequest represents the refresh token request payload
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
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
