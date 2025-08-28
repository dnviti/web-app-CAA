package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Role represents a role in the RBAC system
type Role struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string    `json:"name" gorm:"uniqueIndex;not null;size:100"`
	DisplayName string    `json:"display_name" gorm:"size:255"`
	Description string    `json:"description" gorm:"type:text"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Many-to-many relationship with users
	Users []*User `json:"users,omitempty" gorm:"many2many:user_roles"`
	// Many-to-many relationship with permissions
	Permissions []*Permission `json:"permissions,omitempty" gorm:"many2many:role_permissions"`
}

func (Role) TableName() string {
	return "roles"
}

// BeforeCreate generates a UUID for the role before creating it
func (r *Role) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

// Permission represents a permission in the RBAC system
type Permission struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string    `json:"name" gorm:"uniqueIndex;not null;size:100"`
	Resource    string    `json:"resource" gorm:"not null;size:100"`
	Action      string    `json:"action" gorm:"not null;size:100"`
	Description string    `json:"description" gorm:"type:text"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Many-to-many relationship with roles
	Roles []*Role `json:"roles,omitempty" gorm:"many2many:role_permissions"`
}

func (Permission) TableName() string {
	return "permissions"
}

// BeforeCreate generates a UUID for the permission before creating it
func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

// UserRole represents the many-to-many relationship between users and roles
type UserRole struct {
	UserID string `json:"user_id" gorm:"primaryKey;type:varchar(36)"`
	RoleID string `json:"role_id" gorm:"primaryKey;type:varchar(36)"`

	User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Role Role `json:"role" gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE"`
}

func (UserRole) TableName() string {
	return "user_roles"
}

// RolePermission represents the many-to-many relationship between roles and permissions
type RolePermission struct {
	RoleID       string `json:"role_id" gorm:"primaryKey;type:varchar(36)"`
	PermissionID string `json:"permission_id" gorm:"primaryKey;type:varchar(36)"`

	Role       Role       `json:"role" gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE"`
	Permission Permission `json:"permission" gorm:"foreignKey:PermissionID;constraint:OnDelete:CASCADE"`
}

func (RolePermission) TableName() string {
	return "role_permissions"
}
