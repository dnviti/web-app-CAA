package main

import (
	"log"
	"net/http"

	"github.com/daniele/web-app-caa/internal/auth"
	"github.com/daniele/web-app-caa/internal/config"
	"github.com/daniele/web-app-caa/internal/database"
	"github.com/daniele/web-app-caa/internal/handlers"

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

	// Initialize database
	database.Initialize(cfg)
	db := database.GetDB()

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
		}
		protected.POST("/check-editor-password", authHandler.CheckEditorPassword)

		// Grid endpoints (keeping existing handlers for now)
		protected.POST("/setup", gridHandlers.Setup)
		protected.POST("/complete-setup", gridHandlers.CompleteSetup)
		protected.GET("/grid", gridHandlers.GetGrid)
		protected.POST("/grid", gridHandlers.SaveGrid)

		// Granular grid endpoints
		protected.POST("/grid/item", gridHandlers.AddItem)
		protected.PUT("/grid/item/:id", gridHandlers.UpdateItem)
		protected.DELETE("/grid/item/:id", gridHandlers.DeleteItem)

		// AI endpoints
		protected.POST("/conjugate", aiHandlers.Conjugate)
		protected.POST("/correct", aiHandlers.Correct)
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
