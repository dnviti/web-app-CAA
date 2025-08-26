package models

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
