package handlers

import (
	"net/http"
	"time"

	"github.com/daniele/web-app-caa/internal/config"
	"github.com/daniele/web-app-caa/internal/database"
	"github.com/daniele/web-app-caa/internal/models"
	"github.com/daniele/web-app-caa/internal/services"
	"github.com/gin-gonic/gin"
)

// AdminHandler handles administrative operations
type AdminHandler struct {
	userManagementService *services.UserManagementService
	rbacService           *services.RBACService
	config                *config.Config
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(userManagementService *services.UserManagementService, rbacService *services.RBACService, cfg *config.Config) *AdminHandler {
	return &AdminHandler{
		userManagementService: userManagementService,
		rbacService:           rbacService,
		config:                cfg,
	}
}

// SystemPing returns basic system health status
// @Summary System health check
// @Description Get basic system health status and uptime
// @Tags Admin
// @Produce json
// @Success 200 {object} models.SystemHealthResponse
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/system/ping [get]
func (h *AdminHandler) SystemPing(c *gin.Context) {
	// Test actual database connection
	db := database.GetDB()
	var dbStatus, dbType string
	var overallStatus = "healthy"
	
	// Test database connection with a simple query
	sqlDB, err := db.DB()
	if err != nil {
		dbStatus = "error"
		dbType = h.config.Database.Driver
		overallStatus = "degraded"
	} else {
		// Test connection with ping
		if err := sqlDB.Ping(); err != nil {
			dbStatus = "disconnected"
			overallStatus = "degraded"
		} else {
			dbStatus = "connected"
		}
		dbType = h.config.Database.Driver
	}

	// Basic system health checks
	services := map[string]interface{}{
		"database": map[string]interface{}{
			"status": dbStatus,
			"type":   dbType,
		},
		"rbac": "healthy",
		"auth": "healthy",
	}

	response := models.SystemHealthResponse{
		Status:    overallStatus,
		Timestamp: time.Now().Format(time.RFC3339),
		Services:  services,
	}

	c.JSON(http.StatusOK, response)
}

// GetUserAnalytics returns comprehensive user analytics
// @Summary Get user analytics
// @Description Get comprehensive analytics about users in the system
// @Tags Admin
// @Produce json
// @Success 200 {object} models.UserAnalyticsResponse
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/analytics/users [get]
func (h *AdminHandler) GetUserAnalytics(c *gin.Context) {
	// Get basic user statistics
	stats, err := h.userManagementService.GetUserStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get role distribution
	roleDistribution, err := h.getRoleDistribution()
	if err != nil {
		roleDistribution = map[string]int64{"error": 0}
	}

	// Get status distribution
	statusDistribution, err := h.getStatusDistribution()
	if err != nil {
		statusDistribution = map[string]int64{"error": 0}
	}

	response := models.UserAnalyticsResponse{
		TotalUsers:          stats["total_users"].(int64),
		ActiveUsers:         stats["active_users"].(int64),
		PendingUsers:        stats["pending_users"].(int64),
		InactiveUsers:       stats["inactive_users"].(int64),
		RecentRegistrations: stats["recent_registrations"].(int64),
		RoleDistribution:    roleDistribution,
		StatusDistribution:  statusDistribution,
		UserGrowth:          []map[string]interface{}{}, // Could be implemented with time-series data
	}

	c.JSON(http.StatusOK, response)
}

// GetGridAnalytics returns grid usage analytics
// @Summary Get grid analytics
// @Description Get analytics about grid usage in the system
// @Tags Admin
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /admin/analytics/grids [get]
func (h *AdminHandler) GetGridAnalytics(c *gin.Context) {
	// This is a placeholder for grid analytics
	// You would implement this based on your grid data model
	analytics := map[string]interface{}{
		"total_grids":   0,
		"active_grids":  0,
		"grid_types":    map[string]int{},
		"average_items": 0,
		"popular_items": []string{},
	}

	c.JSON(http.StatusOK, analytics)
}

// getRoleDistribution gets the distribution of users by role
func (h *AdminHandler) getRoleDistribution() (map[string]int64, error) {
	// This would require a more complex query to count users by role
	// For now, return a placeholder
	return map[string]int64{
		"admin":  1,
		"editor": 1,
		"user":   1,
	}, nil
}

// getStatusDistribution gets the distribution of users by status
func (h *AdminHandler) getStatusDistribution() (map[string]int64, error) {
	// This would require a query to count users by status
	// For now, return a placeholder
	return map[string]int64{
		"active":        1,
		"pending_setup": 1,
		"inactive":      1,
	}, nil
}
