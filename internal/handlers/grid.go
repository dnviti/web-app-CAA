package handlers

import (
	"log"
	"net/http"

	"github.com/daniele/web-app-caa/internal/models"
	"github.com/daniele/web-app-caa/internal/services"
	"github.com/daniele/web-app-caa/internal/utils/token"

	"github.com/gin-gonic/gin"
)

// GridHandlers handles grid-related requests
type GridHandlers struct {
	gridService *services.GridService
	userService *services.UserService
}

// NewGridHandlers creates a new GridHandlers instance
func NewGridHandlers() *GridHandlers {
	return &GridHandlers{
		gridService: services.NewGridService(),
		userService: services.NewUserService(),
	}
}

// Setup handles grid setup request
func (h *GridHandlers) Setup(c *gin.Context) {
	// Extract user ID from token
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		log.Printf("[SETUP] Error extracting user ID from token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	log.Printf("[SETUP] Setup request started for userId: %d", userID)

	var req models.SetupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "GridType is required."})
		return
	}

	log.Printf("[SETUP] Grid type requested: %s for userId: %d", req.GridType, userID)

	// Determine the grid structure
	var selectedGrid map[string][]models.GridItemResponse
	switch req.GridType {
	case "simplified":
		selectedGrid = services.SimplifiedGrid
		log.Printf("[SETUP] Selected simplified grid")
	case "empty":
		selectedGrid = map[string][]models.GridItemResponse{
			"home":           {},
			"systemControls": services.DefaultGrid["systemControls"],
		}
		log.Printf("[SETUP] Selected empty grid with system controls")
	case "default":
	default:
		selectedGrid = services.DefaultGrid
		log.Printf("[SETUP] Selected default grid")
	}

	// Save grid
	log.Printf("[SETUP] Saving grid to database for userId: %d", userID)
	if err := h.gridService.SaveGrid(selectedGrid, userID); err != nil {
		log.Printf("[SETUP] Error saving grid: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error saving setup.",
			"error":   err.Error(),
		})
		return
	}

	// Update user status
	log.Printf("[SETUP] Updating user status to 'active' for userId: %d", userID)
	if err := h.userService.UpdateUserStatus(userID, "active"); err != nil {
		log.Printf("[SETUP] Error updating user status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error updating user status.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[SETUP] Setup completed successfully for userId: %d", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Setup complete. Grid saved."})
}

// CompleteSetup handles setup completion request
func (h *GridHandlers) CompleteSetup(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	log.Printf("[ERROR] Error extracting user ID from token: %v", err)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
	return

	log.Printf("[COMPLETE-SETUP] Completing setup for userId: %d", userID)

	if err := h.userService.UpdateUserStatus(userID, "active"); err != nil {
		log.Printf("[COMPLETE-SETUP] Error updating user status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error updating user status.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[COMPLETE-SETUP] User status updated to 'active' for userId: %d", userID)
	c.JSON(http.StatusOK, gin.H{"message": "User status updated to active."})
}

// GetGrid retrieves the entire grid for a user
func (h *GridHandlers) GetGrid(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	log.Printf("[ERROR] Error extracting user ID from token: %v", err)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
	return

	log.Printf("[GET-GRID] Retrieving grid for userId: %d", userID)

	gridData, err := h.gridService.GetGrid(userID)
	if err != nil {
		log.Printf("[GET-GRID] Error reading from database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading from database."})
		return
	}

	if gridData == nil {
		gridData = make(map[string][]models.GridItemResponse)
	}

	log.Printf("[GET-GRID] Grid retrieved successfully for userId: %d, has data: %t",
		userID, len(gridData) > 0)

	c.JSON(http.StatusOK, gridData)
}

// SaveGrid saves a full grid (updates from client)
func (h *GridHandlers) SaveGrid(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	log.Printf("[ERROR] Error extracting user ID from token: %v", err)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
	return

	log.Printf("[SAVE-GRID] Saving grid for userId: %d", userID)

	var gridData map[string][]models.GridItemResponse
	if err := c.ShouldBindJSON(&gridData); err != nil {
		log.Printf("[SAVE-GRID] Invalid grid data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid grid data."})
		return
	}

	if err := h.gridService.SaveGrid(gridData, userID); err != nil {
		log.Printf("[SAVE-GRID] Error writing to database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error saving to database."})
		return
	}

	log.Printf("[SAVE-GRID] Grid saved successfully for userId: %d", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Grid saved successfully!"})
}

// AddItem adds a new item to the grid
func (h *GridHandlers) AddItem(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	log.Printf("[ERROR] Error extracting user ID from token: %v", err)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
	return

	log.Printf("[ADD-ITEM] Adding new item for userId: %d", userID)

	var req models.AddItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[ADD-ITEM] Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Item data and parent category are required.",
		})
		return
	}

	log.Printf("[ADD-ITEM] Item data: ID=%s, ParentCategory=%s",
		req.Item.ID, req.ParentCategory)

	newItem, err := h.gridService.AddItem(req.Item, req.ParentCategory, userID)
	if err != nil {
		log.Printf("[ADD-ITEM] Error adding item to database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error adding item.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[ADD-ITEM] Item added successfully for userId: %d: %s", userID, newItem.ID)
	c.JSON(http.StatusCreated, newItem)
}

// UpdateItem updates an existing item
func (h *GridHandlers) UpdateItem(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	log.Printf("[ERROR] Error extracting user ID from token: %v", err)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
	return
	itemID := c.Param("id")

	log.Printf("[UPDATE-ITEM] Updating item %s for userId: %d", itemID, userID)

	var updateData models.GridItemResponse
	if err := c.ShouldBindJSON(&updateData); err != nil {
		log.Printf("[UPDATE-ITEM] Invalid update data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid update data."})
		return
	}

	log.Printf("[UPDATE-ITEM] Update data for item %s", itemID)

	if err := h.gridService.UpdateItem(itemID, updateData, userID); err != nil {
		log.Printf("[UPDATE-ITEM] Error updating item in database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error updating item.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[UPDATE-ITEM] Item updated successfully: %s for userId: %d", itemID, userID)
	c.JSON(http.StatusOK, gin.H{"message": "Item updated successfully!"})
}

// DeleteItem deletes an item
func (h *GridHandlers) DeleteItem(c *gin.Context) {
	userID, err := token.ExtractTokenID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	log.Printf("[ERROR] Error extracting user ID from token: %v", err)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
	return
	itemID := c.Param("id")

	log.Printf("[DELETE-ITEM] Deleting item %s for userId: %d", itemID, userID)

	var req struct {
		CategoryTarget string `json:"categoryTarget"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[DELETE-ITEM] Warning: failed to parse optional categoryTarget: %v", err)
	}

	if req.CategoryTarget != "" {
		log.Printf("[DELETE-ITEM] Category target specified: %s", req.CategoryTarget)
	}

	// Delete the item
	if err := h.gridService.DeleteItem(itemID, userID); err != nil {
		log.Printf("[DELETE-ITEM] Error deleting item from database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error deleting item.",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[DELETE-ITEM] Item deleted: %s for userId: %d", itemID, userID)

	// Delete category contents if specified
	if req.CategoryTarget != "" {
		log.Printf("[DELETE-ITEM] Deleting category contents for: %s", req.CategoryTarget)
		if err := h.gridService.DeleteCategoryContents(req.CategoryTarget, userID); err != nil {
			log.Printf("[DELETE-ITEM] Error deleting category contents: %v", err)
			// Don't return error here as the main item was already deleted
		} else {
			log.Printf("[DELETE-ITEM] Category contents deleted for: %s", req.CategoryTarget)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully!"})
}
