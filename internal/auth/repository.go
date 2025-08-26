package auth

import (
	"log"

	"github.com/daniele/web-app-caa/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// GormUserRepository implements UserRepository using GORM
type GormUserRepository struct {
	db *gorm.DB
}

// NewGormUserRepository creates a new GORM user repository
func NewGormUserRepository(db *gorm.DB) UserRepository {
	return &GormUserRepository{db: db}
}

// Create creates a new user in the database
func (r *GormUserRepository) Create(user *models.User) error {
	log.Printf("[USER-REPO] Creating user: %s", user.Username)
	if err := r.db.Create(user).Error; err != nil {
		log.Printf("[USER-REPO] Error creating user: %v", err)
		return err
	}
	log.Printf("[USER-REPO] User created successfully with ID: %d", user.ID)
	return nil
}

// FindByID finds a user by ID
func (r *GormUserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// FindByUsername finds a user by username
func (r *GormUserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// Update updates a user in the database
func (r *GormUserRepository) Update(user *models.User) error {
	if err := r.db.Save(user).Error; err != nil {
		log.Printf("[USER-REPO] Error updating user: %v", err)
		return err
	}
	return nil
}

// CheckPassword validates a password against the stored hash
func (r *GormUserRepository) CheckPassword(user *models.User, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
}

// GormGridRepository implements GridRepository using GORM
type GormGridRepository struct {
	db *gorm.DB
}

// NewGormGridRepository creates a new GORM grid repository
func NewGormGridRepository(db *gorm.DB) GridRepository {
	return &GormGridRepository{db: db}
}

// CreateGridItems creates multiple grid items in the database
func (r *GormGridRepository) CreateGridItems(items []models.GridItem) error {
	if len(items) == 0 {
		return nil
	}

	log.Printf("[GRID-REPO] Creating %d grid items", len(items))
	if err := r.db.Create(&items).Error; err != nil {
		log.Printf("[GRID-REPO] Error creating grid items: %v", err)
		return err
	}
	log.Printf("[GRID-REPO] Grid items created successfully")
	return nil
}

// FindByUserID finds all grid items for a user
func (r *GormGridRepository) FindByUserID(userID uint) ([]models.GridItem, error) {
	var items []models.GridItem
	if err := r.db.Where("user_id = ?", userID).Find(&items).Error; err != nil {
		log.Printf("[GRID-REPO] Error finding grid items for user %d: %v", userID, err)
		return nil, err
	}
	return items, nil
}
