package models

// CreateUserRequest represents the request to create a user
type CreateUserRequest struct {
	Username       string `json:"username" binding:"required,min=3,max=50"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=6"`
	EditorPassword string `json:"editor_password" binding:"required,min=6"`
	IsActive       *bool  `json:"is_active,omitempty"`
}

// UpdateUserRequest represents the request to update a user
type UpdateUserRequest struct {
	Username       string `json:"username" binding:"omitempty,min=3,max=50"`
	Email          string `json:"email" binding:"omitempty,email"`
	Password       string `json:"password" binding:"omitempty,min=6"`
	EditorPassword string `json:"editor_password" binding:"omitempty,min=6"`
	Status         string `json:"status" binding:"omitempty,oneof=pending_setup active inactive"`
	IsActive       *bool  `json:"is_active,omitempty"`
}

// UserResponse represents a user response (without sensitive data)
type UserResponse struct {
	ID        string  `json:"id"`
	Username  string  `json:"username"`
	Email     string  `json:"email"`
	Status    string  `json:"status"`
	IsActive  bool    `json:"is_active"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
	Roles     []*Role `json:"roles,omitempty"`
}

// UserListResponse represents paginated user list response
type UserListResponse struct {
	Users      []UserResponse `json:"users"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"total_pages"`
}

// BulkUserOperationRequest represents bulk operations on users
type BulkUserOperationRequest struct {
	UserIDs   []string `json:"user_ids" binding:"required"`
	Operation string   `json:"operation" binding:"required,oneof=activate deactivate delete assign_role remove_role"`
	RoleName  string   `json:"role_name,omitempty"` // Required for role operations
}

// BulkOperationResult represents the result of a bulk operation on users
type BulkOperationResult struct {
	UserID  string `json:"user_id"`
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// SystemHealthResponse represents system health status
type SystemHealthResponse struct {
	Status    string                 `json:"status"`
	Timestamp string                 `json:"timestamp"`
	Services  map[string]interface{} `json:"services"`
}

// UserAnalyticsResponse represents user analytics data
type UserAnalyticsResponse struct {
	TotalUsers          int64                    `json:"total_users"`
	ActiveUsers         int64                    `json:"active_users"`
	PendingUsers        int64                    `json:"pending_users"`
	InactiveUsers       int64                    `json:"inactive_users"`
	RecentRegistrations int64                    `json:"recent_registrations"`
	RoleDistribution    map[string]int64         `json:"role_distribution"`
	StatusDistribution  map[string]int64         `json:"status_distribution"`
	UserGrowth          []map[string]interface{} `json:"user_growth"`
}
