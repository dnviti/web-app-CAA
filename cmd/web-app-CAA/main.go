package main

import (
	"log"
	"net/http"
	"os"
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

// getSwaggerFilePath returns the absolute path to swagger files
func getSwaggerFilePath(filename string) string {
	// Get current working directory
	cwd, err := os.Getwd()
	if err != nil {
		log.Printf("Error getting working directory: %v", err)
		return filepath.Join("docs", filename)
	}
	return filepath.Join(cwd, "docs", filename)
}

// @title           Web App CAA API
// @version         1.0
// @description     This is a CAA (Communication and Alternative Augmentative) web application API.
// @description     It provides endpoints for grid management, user authentication, and AI-powered language services.
// @description
// @description     ## Auto-Discovery
// @description     This API supports standard OpenAPI auto-discovery patterns:
// @description     - OpenAPI 2.0/Swagger JSON: `/openapi.json`
// @description     - OpenAPI 2.0/Swagger YAML: `/openapi.yaml`
// @description     - Interactive Documentation: `/swagger/index.html`
// @description     - API Information: `/api`
// @description     - Well-known OpenAPI Discovery: `/.well-known/openapi_description`

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

// @externalDocs.description  OpenAPI
// @externalDocs.url          https://swagger.io/resources/open-api/

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
	arasaacHandlers := handlers.NewArasaacHandlers()
	pageHandlers := handlers.NewPageHandlers()
	rbacHandler := handlers.NewRBACHandler(rbacService)

	// Initialize LLM service and RAG knowledge handler
	llmService := services.NewLLMService(cfg)
	ragKnowledgeHandler := handlers.NewRagKnowledgeHandler(llmService)

	// Page routes (serve templates for specific paths)
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

		// RAG Knowledge management endpoints (admin only)
		ragKnowledge := protected.Group("/rag-knowledge")
		ragKnowledge.Use(middleware.RequireRole(rbacService, "admin"))
		{
			ragKnowledge.GET("", ragKnowledgeHandler.GetRagKnowledge)
			ragKnowledge.PUT("", ragKnowledgeHandler.UpdateRagKnowledge)
			ragKnowledge.POST("/reload", ragKnowledgeHandler.ReloadRagKnowledge)
			ragKnowledge.POST("/backup", ragKnowledgeHandler.BackupRagKnowledge)
			ragKnowledge.GET("/backups", ragKnowledgeHandler.ListRagKnowledgeBackups)
			ragKnowledge.POST("/restore/:backup_key", ragKnowledgeHandler.RestoreRagKnowledgeFromBackup)
			ragKnowledge.GET("/health", ragKnowledgeHandler.CheckS3Health)
		}

		// ARASAAC endpoints (moved from AI, requires basic authentication but no special AI permissions)
		protected.GET("/arasaac/search", arasaacHandlers.SearchArasaac)
	}

	// Public ARASAAC icon endpoint (no auth required for image serving)
	r.GET("/api/arasaac/icon/:id", arasaacHandlers.GetIcon)

	// Chrome DevTools endpoint (to avoid 404 logs)
	r.GET("/.well-known/appspecific/com.chrome.devtools.json", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{})
	})

	// API discovery and information endpoint
	r.GET("/api", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.Header("Access-Control-Allow-Origin", "*")
		c.JSON(http.StatusOK, gin.H{
			"name":        "Web App CAA API",
			"version":     "1.0",
			"description": "CAA (Communication and Alternative Augmentative) web application API providing endpoints for grid management, user authentication, and AI-powered language services.",
			"documentation": gin.H{
				"swagger_ui":   "http://" + cfg.Host + ":" + cfg.Port + "/swagger/index.html",
				"openapi_json": "http://" + cfg.Host + ":" + cfg.Port + "/openapi.json",
				"openapi_yaml": "http://" + cfg.Host + ":" + cfg.Port + "/openapi.yaml",
			},
			"endpoints": gin.H{
				"base_url": "http://" + cfg.Host + ":" + cfg.Port + "/api",
				"health":   "http://" + cfg.Host + ":" + cfg.Port + "/ping",
			},
			"openapi": "2.0",
			"contact": gin.H{
				"name":  "API Support",
				"url":   "http://www.swagger.io/support",
				"email": "support@swagger.io",
			},
		})
	})

	// API root with HTML response for browser users
	r.GET("/", func(c *gin.Context) {
		// Check if request accepts HTML (from browser)
		if c.GetHeader("Accept") != "" && c.GetHeader("Accept") != "application/json" {
			pageHandlers.ServeIndex(c)
			return
		}

		// For API clients, return JSON discovery info
		c.Header("Content-Type", "application/json")
		c.Header("Access-Control-Allow-Origin", "*")
		c.JSON(http.StatusOK, gin.H{
			"message": "Welcome to Web App CAA API",
			"version": "1.0",
			"documentation": gin.H{
				"swagger_ui":   "http://" + cfg.Host + ":" + cfg.Port + "/swagger/index.html",
				"openapi_json": "http://" + cfg.Host + ":" + cfg.Port + "/openapi.json",
				"openapi_yaml": "http://" + cfg.Host + ":" + cfg.Port + "/openapi.yaml",
			},
			"api_base": "http://" + cfg.Host + ":" + cfg.Port + "/api",
		})
	})

	// Additional OpenAPI discovery endpoints (common patterns)
	r.GET("/swagger.json", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.Header("Access-Control-Allow-Origin", "*")
		swaggerPath := getSwaggerFilePath("swagger.json")
		if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
			log.Printf("Swagger JSON file not found at: %s", swaggerPath)
			c.JSON(http.StatusNotFound, gin.H{"error": "OpenAPI specification not found"})
			return
		}
		c.File(swaggerPath)
	})

	r.GET("/swagger.yaml", func(c *gin.Context) {
		c.Header("Content-Type", "application/x-yaml")
		c.Header("Access-Control-Allow-Origin", "*")
		swaggerPath := getSwaggerFilePath("swagger.yaml")
		if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
			log.Printf("Swagger YAML file not found at: %s", swaggerPath)
			c.JSON(http.StatusNotFound, gin.H{"error": "OpenAPI specification not found"})
			return
		}
		c.File(swaggerPath)
	})

	r.GET("/api-docs", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.Header("Access-Control-Allow-Origin", "*")
		swaggerPath := getSwaggerFilePath("swagger.json")
		if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
			log.Printf("API docs file not found at: %s", swaggerPath)
			c.JSON(http.StatusNotFound, gin.H{"error": "OpenAPI specification not found"})
			return
		}
		c.File(swaggerPath)
	})

	r.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusPermanentRedirect, "/swagger/index.html")
	})

	r.GET("/documentation", func(c *gin.Context) {
		c.Redirect(http.StatusPermanentRedirect, "/swagger/index.html")
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

	// OpenAPI/Swagger documentation endpoints for auto-discovery
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Standard OpenAPI endpoints for auto-discovery
	r.GET("/openapi.json", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.Header("Access-Control-Allow-Origin", "*")
		swaggerPath := getSwaggerFilePath("swagger.json")
		if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
			log.Printf("OpenAPI JSON file not found at: %s", swaggerPath)
			c.JSON(http.StatusNotFound, gin.H{"error": "OpenAPI specification not found"})
			return
		}
		c.File(swaggerPath)
	})

	r.GET("/openapi.yaml", func(c *gin.Context) {
		c.Header("Content-Type", "application/x-yaml")
		c.Header("Access-Control-Allow-Origin", "*")
		swaggerPath := getSwaggerFilePath("swagger.yaml")
		if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
			log.Printf("OpenAPI YAML file not found at: %s", swaggerPath)
			c.JSON(http.StatusNotFound, gin.H{"error": "OpenAPI specification not found"})
			return
		}
		c.File(swaggerPath)
	})

	// Alternative OpenAPI discovery endpoints
	r.GET("/api/openapi.json", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.Header("Access-Control-Allow-Origin", "*")
		swaggerPath := getSwaggerFilePath("swagger.json")
		if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
			log.Printf("OpenAPI JSON file not found at: %s", swaggerPath)
			c.JSON(http.StatusNotFound, gin.H{"error": "OpenAPI specification not found"})
			return
		}
		c.File(swaggerPath)
	})

	r.GET("/api/openapi.yaml", func(c *gin.Context) {
		c.Header("Content-Type", "application/x-yaml")
		c.Header("Access-Control-Allow-Origin", "*")
		swaggerPath := getSwaggerFilePath("swagger.yaml")
		if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
			log.Printf("OpenAPI YAML file not found at: %s", swaggerPath)
			c.JSON(http.StatusNotFound, gin.H{"error": "OpenAPI specification not found"})
			return
		}
		c.File(swaggerPath)
	})

	// OpenAPI discovery endpoint (follows OpenAPI 3.0 specification)
	r.GET("/.well-known/openapi_description", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.Header("Access-Control-Allow-Origin", "*")
		c.JSON(http.StatusOK, gin.H{
			"openapi_description": gin.H{
				"openapi": "3.0.0",
				"info": gin.H{
					"title":       "Web App CAA API",
					"version":     "1.0",
					"description": "This is a CAA (Communication and Alternative Augmentative) web application API. It provides endpoints for grid management, user authentication, and AI-powered language services.",
				},
				"servers": []gin.H{
					{
						"url":         "http://" + cfg.Host + ":" + cfg.Port + "/api",
						"description": "Development server",
					},
				},
				"paths": gin.H{
					"/openapi.json": gin.H{
						"description": "OpenAPI 2.0/Swagger specification in JSON format",
						"url":         "http://" + cfg.Host + ":" + cfg.Port + "/openapi.json",
					},
					"/openapi.yaml": gin.H{
						"description": "OpenAPI 2.0/Swagger specification in YAML format",
						"url":         "http://" + cfg.Host + ":" + cfg.Port + "/openapi.yaml",
					},
					"/swagger/index.html": gin.H{
						"description": "Interactive Swagger UI documentation",
						"url":         "http://" + cfg.Host + ":" + cfg.Port + "/swagger/index.html",
					},
				},
			},
		})
	})

	log.Printf("[SWAGGER] Swagger documentation available at http://%s:%s/swagger/index.html", cfg.Host, cfg.Port)
	log.Printf("[OPENAPI] OpenAPI JSON specification available at http://%s:%s/openapi.json", cfg.Host, cfg.Port)
	log.Printf("[OPENAPI] OpenAPI YAML specification available at http://%s:%s/openapi.yaml", cfg.Host, cfg.Port)
	log.Printf("[OPENAPI] OpenAPI auto-discovery available at http://%s:%s/.well-known/openapi_description", cfg.Host, cfg.Port)

	log.Printf("[STARTUP] Server is running on http://%s:%s", cfg.Host, cfg.Port)
	log.Printf("[STARTUP] Server startup completed successfully")
	log.Printf("[AUTH] New clean authentication architecture initialized")

	// Start server
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
