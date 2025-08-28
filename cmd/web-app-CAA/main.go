package main

import (
	"log"
	"net/http"
	"path/filepath"

	"github.com/daniele/web-app-caa/internal/auth"
	"github.com/daniele/web-app-caa/internal/config"
	"github.com/daniele/web-app-caa/internal/database"
	"github.com/daniele/web-app-caa/internal/handlers"
	"github.com/daniele/web-app-caa/internal/middleware"
	"github.com/daniele/web-app-caa/internal/services"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/daniele/web-app-caa/docs" // Import generated docs
)

// @title           Web App CAA API
// @version         1.0
// @description     This is a CAA (Communication and Alternative Augmentative) web application API.
// @description     It provides endpoints for grid management, user authentication, and AI-powered language services.

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:6542
// @BasePath  /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Load configuration
	cfg := config.Load()

	log.Printf("[STARTUP] Server configuration loaded:")
	log.Printf("[STARTUP] - PORT: %s", cfg.Port)
	log.Printf("[STARTUP] - HOST: %s", cfg.Host)
	log.Printf("[STARTUP] - JWT_SECRET: %s", func() string {
		if cfg.JWTSecret != "" {
			return "[SET]"
		}
		return "[NOT SET]"
	}())
	log.Printf("[STARTUP] - API_SECRET: %s", func() string {
		if cfg.APISecret != "" {
			return "[SET]"
		}
		return "[NOT SET]"
	}())
	log.Printf("[STARTUP] - TOKEN_HOUR_LIFESPAN: %d", cfg.TokenHourLifespan)
	log.Printf("[STARTUP] - TRUSTED_PROXIES: %v", cfg.TrustedProxies)

	// Initialize database (now includes automatic migration and seeding)
	database.Initialize(cfg)
	db := database.GetDB()

	// Initialize RBAC service
	rbacModelPath := filepath.Join("configs", "rbac_model.conf")
	rbacService, err := services.NewRBACService(db, rbacModelPath)
	if err != nil {
		log.Fatalf("Failed to initialize RBAC service: %v", err)
	}

	// Initialize authentication system
	authFactory := auth.NewFactory(db, cfg)
	authHandler := authFactory.GetHandler()
	authMiddleware := authFactory.GetMiddleware()

	// Create Gin router
	r := gin.Default()

	// CORS middleware - equivalent to Node.js CORS configuration
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	log.Printf("[MIDDLEWARE] CORS configured with credentials and all origins")

	// Configure trusted proxies for security
	r.SetTrustedProxies(cfg.TrustedProxies)

	// Serve static files (CSS, JS, images)
	r.Static("/static", "./web/static")
	log.Printf("[MIDDLEWARE] Static files served from 'web/static' directory")

	// Create other handlers (keeping existing ones for now)
	gridHandlers := handlers.NewGridHandlers(cfg)
	aiHandlers := handlers.NewAIHandlers(cfg)
	pageHandlers := handlers.NewPageHandlers()
	rbacHandler := handlers.NewRBACHandler(rbacService)

	// Page routes (serve templates instead of static files)
	r.GET("/", pageHandlers.ServeIndex)
	r.GET("/login", pageHandlers.ServeLogin)
	r.GET("/register", pageHandlers.ServeRegister)
	r.GET("/setup", pageHandlers.ServeSetup)
	log.Printf("[ROUTES] Page routes configured to serve templates")

	// Auth API Endpoints (no authentication required)
	api := r.Group("/api")
	{
		// Auth endpoints
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/revoke", authHandler.RevokeToken)
		}
	}

	// Protected API Endpoints (authentication required)
	protected := api.Group("/")
	protected.Use(authMiddleware.RequireAuth())
	{
		// Auth endpoints
		authProtected := protected.Group("/auth")
		{
			authProtected.GET("/verify", authHandler.CurrentUser)
			authProtected.POST("/logout", authHandler.Logout)

			// RBAC endpoints (admin only) - nested under /auth
			rbac := authProtected.Group("/rbac")
			rbac.Use(middleware.RequireRole(rbacService, "admin"))
			{
				// User role management
				rbac.GET("/users/:user_id/roles", rbacHandler.GetUserRoles)
				rbac.GET("/users/:user_id/permissions", rbacHandler.GetUserPermissions)
				rbac.POST("/users/:user_id/roles/:role_name", rbacHandler.AssignUserRole)
				rbac.DELETE("/users/:user_id/roles/:role_name", rbacHandler.RemoveUserRole)
				rbac.GET("/users/:user_id/check-permission", rbacHandler.CheckPermission)

				// Role management
				rbac.GET("/roles", rbacHandler.GetAllRoles)
				rbac.POST("/roles", rbacHandler.CreateRole)
				rbac.POST("/roles/:role_name/permissions/:permission_name", rbacHandler.AssignPermissionToRole)
				rbac.DELETE("/roles/:role_name/permissions/:permission_name", rbacHandler.RemovePermissionFromRole)

				// Permission management
				rbac.GET("/permissions", rbacHandler.GetAllPermissions)
				rbac.POST("/permissions", rbacHandler.CreatePermission)
			}
		}
		protected.POST("/check-editor-password", authHandler.CheckEditorPassword)

		// Grid endpoints (keeping existing handlers for now)
		protected.POST("/setup", gridHandlers.Setup)
		protected.POST("/complete-setup", gridHandlers.CompleteSetup)
		protected.GET("/grid", gridHandlers.GetGrid)
		protected.POST("/grid", gridHandlers.SaveGrid)

		// Granular grid endpoints with RBAC
		protected.POST("/grid/item", middleware.RBACMiddleware(rbacService, "grids", "create"), gridHandlers.AddItem)
		protected.PUT("/grid/item/:id", middleware.RBACMiddleware(rbacService, "grids", "update"), gridHandlers.UpdateItem)
		protected.DELETE("/grid/item/:id", middleware.RBACMiddleware(rbacService, "grids", "delete"), gridHandlers.DeleteItem)

		// AI endpoints
		protected.POST("/conjugate", middleware.RBACMiddleware(rbacService, "ai", "use"), aiHandlers.Conjugate)
		protected.POST("/correct", middleware.RBACMiddleware(rbacService, "ai", "use"), aiHandlers.Correct)
		protected.GET("/ai/search-arasaac", middleware.RBACMiddleware(rbacService, "ai", "use"), aiHandlers.SearchArasaac)
	}

	// Chrome DevTools endpoint (to avoid 404 logs)
	r.GET("/.well-known/appspecific/com.chrome.devtools.json", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{})
	})

	// Test endpoint
	// @Summary Health check
	// @Description Check if the API server is running
	// @Tags Health
	// @Produce plain
	// @Success 200 {string} string "pong"
	// @Router /ping [get]
	r.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	log.Printf("[SWAGGER] Swagger documentation available at http://%s:%s/swagger/index.html", cfg.Host, cfg.Port)

	log.Printf("[STARTUP] Server is running on http://%s:%s", cfg.Host, cfg.Port)
	log.Printf("[STARTUP] Server startup completed successfully")
	log.Printf("[AUTH] New clean authentication architecture initialized")

	// Start server
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
