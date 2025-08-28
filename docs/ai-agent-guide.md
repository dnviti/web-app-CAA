# AI Agent Guide - Web App CAA

## Overview

This guide provides comprehensive system understanding for AI agents working on Web App CAA. It covers architecture, implementation patterns, testing strategies, and development workflows to enable flawless feature development and system maintenance.

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Web App CAA                               │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React/TypeScript) - User Interface Layer             │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (Gin/Go) - RESTful API with JWT Authentication       │
├─────────────────────────────────────────────────────────────────┤
│  Business Logic - Services, Handlers, Middleware                │
├─────────────────────────────────────────────────────────────────┤
│  Authentication & RBAC - JWT + Casbin Authorization             │
├─────────────────────────────────────────────────────────────────┤
│  Database Layer (GORM) - SQLite/PostgreSQL/MySQL Support        │
├─────────────────────────────────────────────────────────────────┤
│  External Services - AI (Ollama/OpenAI), ARASAAC Icons          │
└─────────────────────────────────────────────────────────────────┘
```

### Core Principles
1. **Clean Architecture**: Clear separation of concerns with interfaces
2. **SOLID Principles**: Single responsibility, dependency inversion
3. **Security First**: All endpoints protected by RBAC
4. **API-Driven**: Frontend consumes RESTful APIs
5. **Database Agnostic**: Support multiple database backends
6. **Container Ready**: Docker deployment support

## 🔐 Authentication & Authorization System

### Authentication Flow
```go
// 1. User Login
POST /api/auth/login
{
  "username": "user",
  "password": "password"
}

// 2. JWT Token Response
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "refresh_token": "91e7615e5b33f3b6be2c4d5241557c4492915bb3e...",
  "user": {
    "id": "0e063dfd-012d-4dfa-a0c2-ff20cc938d35",
    "username": "user",
    "status": "active"
  }
}

// 3. Protected Request
GET /api/protected/resource
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

### RBAC Implementation
The system uses Casbin for policy-based authorization:

**Default Roles**:
- `admin` - Full system access
- `editor` - Grid and content management
- `user` - Basic communication features

**Permission Structure**:
```
user_id, resource, action
"admin", "*", "*"                    // Admin has all permissions
"editor", "grids", "create|read|update|delete"
"editor", "ai", "use"
"user", "grids", "read"
"user", "ai", "use"
```

### Key Files for Authentication
```
internal/auth/
├── factory.go          # Dependency injection factory
├── handler.go          # Authentication HTTP handlers
├── interfaces.go       # Service interfaces
├── jwt_service.go      # JWT token operations
├── middleware.go       # Authentication middleware
├── repository.go       # User data persistence
└── service.go          # Authentication business logic

internal/middleware/
└── rbac.go            # RBAC middleware functions
```

## 📊 Database Schema & Models

### Core Tables
```sql
-- Users
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    editor_password VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending_setup',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Roles
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Permissions
CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Many-to-Many Relationships
CREATE TABLE user_roles (
    user_id VARCHAR(36),
    role_id VARCHAR(36),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id VARCHAR(36),
    permission_id VARCHAR(36),
    PRIMARY KEY (role_id, permission_id)
);
```

### Model Patterns
```go
// Standard model structure
type User struct {
    ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
    Username  string    `json:"username" gorm:"uniqueIndex;not null"`
    Email     string    `json:"email" gorm:"uniqueIndex;size:255"`
    Password  string    `json:"-" gorm:"not null"`
    Status    string    `json:"status" gorm:"default:pending_setup;not null"`
    IsActive  bool      `json:"is_active" gorm:"default:true"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    
    // Relationships
    Roles []*Role `json:"roles,omitempty" gorm:"many2many:user_roles"`
}

// Hooks for automatic operations
func (u *User) BeforeCreate(tx *gorm.DB) error {
    if u.ID == "" {
        u.ID = uuid.New().String()
    }
    return nil
}
```

## 🔧 API Development Patterns

### Handler Structure
```go
// Standard handler pattern
type ExampleHandler struct {
    service ExampleService
}

func NewExampleHandler(service ExampleService) *ExampleHandler {
    return &ExampleHandler{service: service}
}

// HTTP handler with proper error handling
func (h *ExampleHandler) CreateItem(c *gin.Context) {
    var req CreateItemRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Extract user from context (set by middleware)
    userID := auth.GetUserID(c)
    if userID == "" {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
        return
    }
    
    // Business logic
    item, err := h.service.CreateItem(userID, &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{"item": item})
}
```

### Service Layer Pattern
```go
type ExampleService interface {
    CreateItem(userID string, req *CreateItemRequest) (*Item, error)
    GetItem(userID, itemID string) (*Item, error)
    UpdateItem(userID, itemID string, req *UpdateItemRequest) (*Item, error)
    DeleteItem(userID, itemID string) error
}

type ExampleServiceImpl struct {
    repo ExampleRepository
    rbac *services.RBACService
}

func (s *ExampleServiceImpl) CreateItem(userID string, req *CreateItemRequest) (*Item, error) {
    // Permission check
    allowed, err := s.rbac.CheckPermission(userID, "items", "create")
    if err != nil {
        return nil, err
    }
    if !allowed {
        return nil, errors.New("insufficient permissions")
    }
    
    // Business logic
    item := &Item{
        Name:      req.Name,
        CreatedBy: userID,
    }
    
    return s.repo.Create(item)
}
```

### Route Registration with RBAC
```go
// In main.go or router setup
protected := api.Group("/")
protected.Use(authMiddleware.RequireAuth())
{
    // Resource-specific endpoints
    items := protected.Group("/items")
    {
        items.GET("/", itemHandler.GetItems)
        items.POST("/", 
            middleware.RBACMiddleware(rbacService, "items", "create"), 
            itemHandler.CreateItem)
        items.PUT("/:id", 
            middleware.RBACMiddleware(rbacService, "items", "update"), 
            itemHandler.UpdateItem)
        items.DELETE("/:id", 
            middleware.RBACMiddleware(rbacService, "items", "delete"), 
            itemHandler.DeleteItem)
    }
    
    // Admin-only endpoints
    admin := protected.Group("/admin")
    admin.Use(middleware.RequireRole(rbacService, "admin"))
    {
        admin.GET("/users", adminHandler.GetUsers)
        admin.POST("/users", adminHandler.CreateUser)
    }
}
```

## 🧪 Testing Patterns

### Unit Testing
```go
func TestUserService_CreateUser(t *testing.T) {
    // Setup
    mockRepo := &MockUserRepository{}
    mockRBAC := &MockRBACService{}
    service := NewUserService(mockRepo, mockRBAC)
    
    // Test data
    req := &CreateUserRequest{
        Username: "testuser",
        Password: "password123",
        Email:    "test@example.com",
    }
    
    // Mock expectations
    mockRepo.On("Create", mock.AnythingOfType("*models.User")).Return(nil)
    mockRBAC.On("AssignUserRole", mock.Anything, "user").Return(nil)
    
    // Execute
    user, err := service.CreateUser(req)
    
    // Assert
    assert.NoError(t, err)
    assert.Equal(t, "testuser", user.Username)
    assert.True(t, user.IsActive)
    mockRepo.AssertExpectations(t)
}
```

### Integration Testing
```go
func TestAuthenticationFlow(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer teardownTestDB(t, db)
    
    // Setup services
    authFactory := auth.NewFactory(db, testConfig)
    authHandler := authFactory.GetHandler()
    
    // Setup router
    r := gin.New()
    r.POST("/auth/login", authHandler.Login)
    
    // Test login
    loginData := `{"username": "admin", "password": "admin123"}`
    req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(loginData))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()
    
    r.ServeHTTP(w, req)
    
    // Assert
    assert.Equal(t, http.StatusOK, w.Code)
    
    var response map[string]interface{}
    err := json.Unmarshal(w.Body.Bytes(), &response)
    assert.NoError(t, err)
    assert.Contains(t, response, "token")
    assert.Contains(t, response, "user")
}
```

## 🔍 Development Workflow

### Adding New Features

#### 1. Define API Contract
```go
// Request/Response models
type CreateFeatureRequest struct {
    Name        string `json:"name" binding:"required"`
    Description string `json:"description"`
    IsActive    bool   `json:"is_active"`
}

type FeatureResponse struct {
    ID          string    `json:"id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    IsActive    bool      `json:"is_active"`
    CreatedAt   time.Time `json:"created_at"`
    CreatedBy   string    `json:"created_by"`
}
```

#### 2. Create Database Model
```go
type Feature struct {
    ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
    Name        string    `json:"name" gorm:"not null;size:255"`
    Description string    `json:"description" gorm:"type:text"`
    IsActive    bool      `json:"is_active" gorm:"default:true"`
    CreatedBy   string    `json:"created_by" gorm:"not null"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

func (Feature) TableName() string {
    return "features"
}

func (f *Feature) BeforeCreate(tx *gorm.DB) error {
    if f.ID == "" {
        f.ID = uuid.New().String()
    }
    return nil
}
```

#### 3. Create Repository Interface & Implementation
```go
type FeatureRepository interface {
    Create(feature *Feature) error
    GetByID(id string) (*Feature, error)
    GetByUserID(userID string) ([]*Feature, error)
    Update(feature *Feature) error
    Delete(id string) error
}

type GormFeatureRepository struct {
    db *gorm.DB
}

func NewFeatureRepository(db *gorm.DB) FeatureRepository {
    return &GormFeatureRepository{db: db}
}

func (r *GormFeatureRepository) Create(feature *Feature) error {
    return r.db.Create(feature).Error
}
```

#### 4. Create Service Layer
```go
type FeatureService interface {
    CreateFeature(userID string, req *CreateFeatureRequest) (*Feature, error)
    GetFeature(userID, featureID string) (*Feature, error)
    GetUserFeatures(userID string) ([]*Feature, error)
    UpdateFeature(userID, featureID string, req *UpdateFeatureRequest) (*Feature, error)
    DeleteFeature(userID, featureID string) error
}

type FeatureServiceImpl struct {
    repo FeatureRepository
    rbac *services.RBACService
}

func NewFeatureService(repo FeatureRepository, rbac *services.RBACService) FeatureService {
    return &FeatureServiceImpl{
        repo: repo,
        rbac: rbac,
    }
}
```

#### 5. Create HTTP Handlers
```go
type FeatureHandler struct {
    service FeatureService
}

func NewFeatureHandler(service FeatureService) *FeatureHandler {
    return &FeatureHandler{service: service}
}

// CreateFeature creates a new feature
// @Summary Create feature
// @Description Create a new feature item
// @Tags Features
// @Accept json
// @Produce json
// @Param feature body CreateFeatureRequest true "Feature data"
// @Success 201 {object} FeatureResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /features [post]
func (h *FeatureHandler) CreateFeature(c *gin.Context) {
    // Implementation following standard pattern
}
```

#### 6. Register Routes
```go
// In main.go
featureRepo := repositories.NewFeatureRepository(db)
featureService := services.NewFeatureService(featureRepo, rbacService)
featureHandler := handlers.NewFeatureHandler(featureService)

protected := api.Group("/")
protected.Use(authMiddleware.RequireAuth())
{
    features := protected.Group("/features")
    {
        features.GET("/", featureHandler.GetFeatures)
        features.POST("/", 
            middleware.RBACMiddleware(rbacService, "features", "create"),
            featureHandler.CreateFeature)
        features.PUT("/:id", 
            middleware.RBACMiddleware(rbacService, "features", "update"),
            featureHandler.UpdateFeature)
        features.DELETE("/:id", 
            middleware.RBACMiddleware(rbacService, "features", "delete"),
            featureHandler.DeleteFeature)
    }
}
```

#### 7. Add RBAC Permissions
```go
// In database/seeding.go
permissions := []PermissionData{
    {
        Name:        "features:create",
        Resource:    "features",
        Action:      "create",
        Description: "Create new features",
    },
    {
        Name:        "features:read",
        Resource:    "features", 
        Action:      "read",
        Description: "Read features",
    },
    {
        Name:        "features:update",
        Resource:    "features",
        Action:      "update",
        Description: "Update features",
    },
    {
        Name:        "features:delete",
        Resource:    "features",
        Action:      "delete",
        Description: "Delete features",
    },
}
```

#### 8. Update Swagger Documentation
```bash
# Generate updated API documentation
make swagger
```

#### 9. Write Tests
```go
func TestFeatureHandler_CreateFeature(t *testing.T) {
    // Unit tests for handler
}

func TestFeatureService_CreateFeature(t *testing.T) {
    // Unit tests for service
}

func TestFeatureRepository_Create(t *testing.T) {
    // Integration tests for repository
}
```

## 🚀 Deployment & Configuration

### Environment Variables
```bash
# Server Configuration
APP_PORT=6542
APP_HOST=0.0.0.0
TRUSTED_PROXIES=127.0.0.1,::1

# Authentication
JWT_SECRET=your-secret-key
API_SECRET=your-api-secret
TOKEN_HOUR_LIFESPAN=24
BCRYPT_COST=12

# Database
DB_DRIVER=sqlite
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web_app_caa
DB_USER=username
DB_PASSWORD=password
DB_SSLMODE=disable

# AI Services
OLLAMA_HOST=http://localhost:11434
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4
LLM_BACKEND=openai

# External APIs
ARASAAC_API_URL=https://api.arasaac.org
```

### Docker Deployment
```dockerfile
FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o web-app-caa ./cmd/web-app-CAA

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/web-app-caa .
COPY --from=builder /app/configs ./configs
COPY --from=builder /app/web ./web
COPY --from=builder /app/internal/prompts ./internal/prompts

EXPOSE 6542
CMD ["./web-app-caa"]
```

## 🛠️ Development Tools

### Useful Commands
```bash
# Development
make dev                    # Run in development mode
make build                  # Build binary
make test                   # Run all tests
make swagger               # Generate API documentation

# Docker
make docker-build         # Build Docker image
make docker-up            # Start with docker-compose
make docker-down          # Stop docker-compose

# Database
make db-migrate           # Run database migrations
make db-seed             # Seed database with default data
make db-reset            # Reset and reseed database
```

### Development Environment Setup
```bash
# Clone repository
git clone https://github.com/dnviti/web-app-CAA.git
cd web-app-CAA

# Install dependencies
go mod download
make deps

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
make dev  # Automatically runs migrations and seeding

# Generate API documentation
make swagger

# Run tests
make test
```

## 📚 Key Concepts for AI Agents

### 1. Security-First Development
- **Every endpoint must be protected**: Use appropriate middleware
- **RBAC permissions**: Check permissions in service layer
- **Input validation**: Always validate and sanitize inputs
- **Error handling**: Proper HTTP status codes and error messages

### 2. Clean Architecture Compliance
- **Interfaces first**: Define interfaces before implementations
- **Dependency injection**: Use factory pattern for dependencies
- **Separation of concerns**: Handler → Service → Repository → Database
- **Testability**: All components should be easily testable

### 3. API Design Standards
- **RESTful conventions**: Proper HTTP methods and status codes
- **Consistent naming**: Use camelCase for JSON, snake_case for DB
- **Pagination**: Implement for list endpoints
- **Filtering**: Support query parameters for filtering
- **Swagger documentation**: Document all endpoints

### 4. Database Patterns
- **UUID primary keys**: Use UUIDs for all entity IDs
- **Soft deletes**: Implement where appropriate
- **Timestamps**: Always include created_at and updated_at
- **Relationships**: Properly define foreign keys and associations
- **Migrations**: Use GORM AutoMigrate for schema changes

### 5. Testing Strategy
- **Unit tests**: Test business logic in isolation
- **Integration tests**: Test API endpoints end-to-end
- **Mock dependencies**: Use interfaces for easy mocking
- **Test coverage**: Aim for >80% coverage on new features
- **Test data**: Use factories for consistent test data

### 6. Error Handling
- **Structured errors**: Use consistent error response format
- **Logging**: Log errors with context and stack traces
- **User-friendly messages**: Don't expose internal errors
- **HTTP status codes**: Use appropriate codes for different scenarios

### 7. Performance Considerations
- **Database indexing**: Add indexes for query performance
- **Pagination**: Limit large result sets
- **Caching**: Implement where appropriate
- **Connection pooling**: Configure database connections properly

## 🔍 Debugging & Troubleshooting

### Common Issues

#### Authentication Problems
```go
// Check token extraction
tokenString, err := m.tokenService.ExtractTokenFromRequest(c)
if err != nil {
    log.Printf("[AUTH-DEBUG] Token extraction failed: %v", err)
    log.Printf("[AUTH-DEBUG] Headers: %+v", c.Request.Header)
}

// Check token validation
claims, err := m.tokenService.ValidateToken(tokenString)
if err != nil {
    log.Printf("[AUTH-DEBUG] Token validation failed: %v", err)
    log.Printf("[AUTH-DEBUG] Token: %s", tokenString[:min(50, len(tokenString))])
}
```

#### RBAC Permission Issues
```go
// Debug permission checking
allowed, err := rbacService.CheckPermission(userID, resource, action)
log.Printf("[RBAC-DEBUG] Permission check: user=%s, resource=%s, action=%s, allowed=%t, err=%v", 
    userID, resource, action, allowed, err)

// Check user roles
roles, err := rbacService.GetUserRoles(userID)
log.Printf("[RBAC-DEBUG] User roles: %+v, err=%v", roles, err)
```

#### Database Connection Issues
```go
// Check database connection
if err := db.DB.Ping(); err != nil {
    log.Printf("[DB-DEBUG] Database ping failed: %v", err)
}

// Check migrations
if err := db.AutoMigrate(&models.User{}); err != nil {
    log.Printf("[DB-DEBUG] Migration failed: %v", err)
}
```

### Logging Best Practices
```go
// Structured logging with context
log.Printf("[%s] %s: %s", component, operation, message)

// Examples:
log.Printf("[AUTH-SERVICE] Login attempt: username=%s, success=%t", username, success)
log.Printf("[RBAC-SERVICE] Permission granted: user=%s, resource=%s, action=%s", userID, resource, action)
log.Printf("[GRID-SERVICE] Grid created: id=%s, type=%s, user=%s", gridID, gridType, userID)
```

## 📖 Additional Resources

### Documentation Structure
```
docs/
├── status.md              # Current implementation status
├── roadmap.md            # Development roadmap
├── ai-agent-guide.md     # This comprehensive guide
├── api/
│   ├── authentication.md # Auth API documentation
│   ├── grid.md          # Grid API documentation
│   └── ai.md            # AI services documentation
├── architecture/
│   ├── overview.md       # System architecture
│   ├── database.md      # Database schema
│   └── structure.md     # Code structure
└── development/
    ├── setup.md         # Development setup
    ├── testing.md       # Testing guidelines
    └── rbac-migration.md # RBAC implementation details
```

### External Dependencies
- **Gin**: Web framework
- **GORM**: ORM for database operations
- **Casbin**: Authorization library
- **golang-jwt**: JWT implementation
- **bcrypt**: Password hashing
- **UUID**: Unique identifier generation
- **Swagger**: API documentation

This guide provides all the information needed for AI agents to understand, maintain, and extend the Web App CAA system effectively. Follow these patterns and principles to ensure consistent, secure, and maintainable code.
