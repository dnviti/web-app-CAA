package main

import (
	"log"
	"net/http"
	"os"

	"github.com/daniele/web-app-caa/internal/database"
	"github.com/daniele/web-app-caa/internal/handlers"
	"github.com/daniele/web-app-caa/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("[STARTUP] Warning: Could not load .env file: %v", err)
	}

	// Load configuration
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "3000"
	}

	host := os.Getenv("APP_HOST")
	if host == "" {
		host = "localhost"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-default-secret-key"
	}

	log.Printf("[STARTUP] Server configuration loaded:")
	log.Printf("[STARTUP] - PORT: %s", port)
	log.Printf("[STARTUP] - HOST: %s", host)
	log.Printf("[STARTUP] - JWT_SECRET: %s", func() string {
		if jwtSecret != "" {
			return "[SET]"
		}
		return "[NOT SET]"
	}())

	// Initialize database
	database.Initialize()

	// Create Gin router
	r := gin.Default()

	// Add middleware
	r.Use(middleware.RequestLogging())

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
	log.Printf("[MIDDLEWARE] JSON parser configured")

	// Configure trusted proxies for security
	r.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// Serve static files (CSS, JS, images)
	r.Static("/static", "./web/static")
	log.Printf("[MIDDLEWARE] Static files served from 'web/static' directory")

	// Create handlers
	authHandlers := handlers.NewAuthHandlers()
	gridHandlers := handlers.NewGridHandlers()
	aiHandlers := handlers.NewAIHandlers()
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
		api.POST("/register", authHandlers.Register)
		api.POST("/login", authHandlers.Login)
	}

	// Protected API Endpoints (authentication required)
	protected := api.Group("/")
	protected.Use(middleware.AuthenticateToken())
	{
		// Auth endpoints
		protected.POST("/check-editor-password", authHandlers.CheckEditorPassword)

		// Grid endpoints
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

	// Test endpoint
	r.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	log.Printf("[STARTUP] Server is running on http://%s:%s", host, port)
	log.Printf("[STARTUP] Server startup completed successfully")

	// Start server
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
