package services

import (
	"fmt"
	"log"
	"strings"

	"github.com/daniele/web-app-caa/internal/database"
	"github.com/daniele/web-app-caa/internal/models"
	"github.com/google/uuid"

	"gorm.io/gorm"
)

// GridService handles grid-related operations
type GridService struct{}

// NewGridService creates a new GridService
func NewGridService() *GridService {
	return &GridService{}
}

// SaveGrid saves the entire grid for a user
func (s *GridService) SaveGrid(gridData map[string][]models.GridItemResponse, userID uint) error {
	log.Printf("Saving grid for user ID: %d", userID)

	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Delete existing grid items for the user
		log.Printf("Deleting existing grid items for user ID: %d", userID)
		if err := tx.Where("user_id = ?", userID).Delete(&models.GridItem{}).Error; err != nil {
			return err
		}

		totalItems := 0

		// Process each category
		for categoryKey, items := range gridData {
			log.Printf("Processing category: %s with %d items", categoryKey, len(items))

			for index, item := range items {
				// Process image if it's a base64 data URL
				iconData := item.Icon
				if strings.HasPrefix(iconData, "data:image/") {
					log.Printf("Processing image for item: %s", item.ID)
					// Process image (placeholder for now - would implement actual image processing)
					optimizedIcon, err := s.processImage(iconData)
					if err != nil {
						log.Printf("Error processing image for item %s: %v", item.ID, err)
						// Continue with original icon on error
					} else {
						iconData = optimizedIcon
					}
				}

				gridItem := models.GridItem{
					ID:             item.ID,
					UserID:         userID,
					ParentCategory: categoryKey,
					ItemOrder:      index,
					Type:           item.Type,
					Label:          item.Label,
					Icon:           iconData,
					Color:          item.Color,
					Target:         item.Target,
					Text:           item.Text,
					Speak:          item.Speak,
					Action:         item.Action,
					IsVisible:      item.IsVisible,
					SymbolType:     item.SymbolType,
					IsHideable:     item.IsHideable,
				}

				if err := tx.Create(&gridItem).Error; err != nil {
					return err
				}
				totalItems++
			}
		}

		log.Printf("Total items saved: %d", totalItems)
		return nil
	})
}

// GetGrid retrieves the grid for a user
func (s *GridService) GetGrid(userID uint) (map[string][]models.GridItemResponse, error) {
	log.Printf("Getting grid for user ID: %d", userID)

	var items []models.GridItem
	result := database.DB.Where("user_id = ?", userID).
		Order("parent_category ASC, item_order ASC").
		Find(&items)

	if result.Error != nil {
		log.Printf("Error getting grid: %v", result.Error)
		return nil, result.Error
	}

	if len(items) == 0 {
		log.Printf("No grid items found for user")
		return nil, nil
	}

	log.Printf("Found %d grid items", len(items))
	gridData := make(map[string][]models.GridItemResponse)

	// First pass: populate gridData with items from the database
	for _, item := range items {
		if _, exists := gridData[item.ParentCategory]; !exists {
			gridData[item.ParentCategory] = []models.GridItemResponse{}
			log.Printf("Initialized category: %s", item.ParentCategory)
		}

		gridItemResponse := models.GridItemResponse{
			ID:         item.ID,
			Type:       item.Type,
			Label:      item.Label,
			Icon:       item.Icon,
			Color:      item.Color,
			Target:     item.Target,
			Text:       item.Text,
			Speak:      item.Speak,
			Action:     item.Action,
			IsVisible:  item.IsVisible,
			SymbolType: item.SymbolType,
			IsHideable: item.IsHideable,
		}

		gridData[item.ParentCategory] = append(gridData[item.ParentCategory], gridItemResponse)
	}

	// Second pass: ensure every category target has an array, even if it's empty
	for _, categoryItems := range gridData {
		for _, item := range categoryItems {
			if item.Type == "category" && item.Target != "" {
				if _, exists := gridData[item.Target]; !exists {
					log.Printf("Initializing empty category target: %s", item.Target)
					gridData[item.Target] = []models.GridItemResponse{}
				}
			}
		}
	}

	log.Printf("Grid retrieved with %d categories", len(gridData))
	return gridData, nil
}

// AddItem adds a new item to the grid
func (s *GridService) AddItem(itemData models.GridItemResponse, parentCategory string, userID uint) (*models.GridItemResponse, error) {
	log.Printf("Adding item to category %s for user %d", parentCategory, userID)

	// Generate a new UUID for the item - backend controls all IDs
	newID := uuid.New().String()
	log.Printf("Generated new UUID: %s", newID)

	// Process image if needed
	iconData := itemData.Icon
	if strings.HasPrefix(iconData, "data:image/") {
		log.Printf("Processing image for new item")
		optimizedIcon, err := s.processImage(iconData)
		if err != nil {
			log.Printf("Error processing image: %v", err)
			// Continue with original icon
		} else {
			iconData = optimizedIcon
		}
	}

	// Get max order for the category
	var maxOrder int
	err := database.DB.Model(&models.GridItem{}).
		Where("parent_category = ? AND user_id = ?", parentCategory, userID).
		Select("COALESCE(MAX(item_order), -1) as max_order").
		Row().Scan(&maxOrder)
	if err != nil {
		log.Printf("Warning: failed to get max order, using default: %v", err)
		maxOrder = -1
	}

	newOrder := maxOrder + 1
	log.Printf("New item order: %d", newOrder)

	gridItem := models.GridItem{
		ID:             newID, // Use the backend-generated UUID
		UserID:         userID,
		ParentCategory: parentCategory,
		ItemOrder:      newOrder,
		Type:           itemData.Type,
		Label:          itemData.Label,
		Icon:           iconData,
		Color:          itemData.Color,
		Target:         itemData.Target,
		Text:           itemData.Text,
		Speak:          itemData.Speak,
		Action:         itemData.Action,
		IsVisible:      itemData.IsVisible,
		SymbolType:     itemData.SymbolType,
		IsHideable:     itemData.IsHideable,
	}

	if err := database.DB.Create(&gridItem).Error; err != nil {
		log.Printf("Error adding item: %v", err)
		return nil, err
	}

	log.Printf("Item added successfully with UUID: %s", newID)

	response := models.GridItemResponse{
		ID:         newID, // Return the backend-generated UUID
		Type:       itemData.Type,
		Label:      itemData.Label,
		Icon:       iconData,
		Color:      itemData.Color,
		Target:     itemData.Target,
		Text:       itemData.Text,
		Speak:      itemData.Speak,
		Action:     itemData.Action,
		IsVisible:  itemData.IsVisible,
		SymbolType: itemData.SymbolType,
		IsHideable: itemData.IsHideable,
	}

	return &response, nil
}

// UpdateItem updates an existing item
func (s *GridService) UpdateItem(itemID string, itemData models.GridItemResponse, userID uint) error {
	log.Printf("Updating item %s for user %d", itemID, userID)

	// Process image if needed
	iconData := itemData.Icon
	if strings.HasPrefix(iconData, "data:image/") {
		log.Printf("Processing image for item update")
		optimizedIcon, err := s.processImage(iconData)
		if err != nil {
			log.Printf("Error processing image: %v", err)
		} else {
			iconData = optimizedIcon
		}
	}

	updates := map[string]interface{}{}
	if itemData.Label != "" {
		updates["label"] = itemData.Label
	}
	if iconData != "" {
		updates["icon"] = iconData
	}
	if itemData.Color != "" {
		updates["color"] = itemData.Color
	}
	if itemData.Target != "" {
		updates["target"] = itemData.Target
	}
	if itemData.Text != "" {
		updates["text"] = itemData.Text
	}
	if itemData.Speak != "" {
		updates["speak"] = itemData.Speak
	}
	if itemData.Action != "" {
		updates["action"] = itemData.Action
	}
	if itemData.SymbolType != "" {
		updates["symbol_type"] = itemData.SymbolType
	}
	// Note: booleans need special handling
	updates["is_visible"] = itemData.IsVisible
	updates["is_hideable"] = itemData.IsHideable

	if len(updates) == 0 {
		log.Printf("No fields to update for item")
		return fmt.Errorf("no fields to update")
	}

	log.Printf("Updating fields: %v", getKeys(updates))

	result := database.DB.Model(&models.GridItem{}).
		Where("id = ? AND user_id = ?", itemID, userID).
		Updates(updates)

	if result.Error != nil {
		log.Printf("Error updating item: %v", result.Error)
		return result.Error
	}

	if result.RowsAffected == 0 {
		log.Printf("Item not found or user not authorized for update")
		return fmt.Errorf("item not found or user not authorized")
	}

	log.Printf("Item updated successfully, changes: %d", result.RowsAffected)
	return nil
}

// DeleteItem deletes an item
func (s *GridService) DeleteItem(itemID string, userID uint) error {
	log.Printf("Deleting item %s for user %d", itemID, userID)

	result := database.DB.Where("id = ? AND user_id = ?", itemID, userID).Delete(&models.GridItem{})

	if result.Error != nil {
		log.Printf("Error deleting item: %v", result.Error)
		return result.Error
	}

	if result.RowsAffected == 0 {
		log.Printf("Item not found or user not authorized for deletion")
		return fmt.Errorf("item not found or user not authorized")
	}

	log.Printf("Item deleted successfully, changes: %d", result.RowsAffected)
	return nil
}

// DeleteCategoryContents deletes all items in a category
func (s *GridService) DeleteCategoryContents(categoryTarget string, userID uint) error {
	log.Printf("Deleting contents of category %s for user %d", categoryTarget, userID)

	result := database.DB.Where("parent_category = ? AND user_id = ?", categoryTarget, userID).Delete(&models.GridItem{})

	if result.Error != nil {
		log.Printf("Error deleting category contents: %v", result.Error)
		return result.Error
	}

	log.Printf("Category contents deleted, changes: %d", result.RowsAffected)
	return nil
}

// processImage processes base64 image data (placeholder implementation)
func (s *GridService) processImage(base64String string) (string, error) {
	// This is a placeholder for image processing logic
	// In the original Node.js version, this used Sharp to resize and convert to WebP
	// For now, we'll return the original image
	log.Printf("Image processing placeholder - returning original")
	return base64String, nil
}

// Helper function to get map keys
func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
