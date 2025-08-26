# Testing Guide

This guide covers testing strategies, tools, and best practices for Web App CAA. The project uses Go's built-in testing framework along with comprehensive authentication testing using the clean architecture implementation.

## Testing Philosophy

Web App CAA follows a comprehensive testing approach:

- **Unit Tests**: Test individual functions and methods in isolation
- **Integration Tests**: Test component interactions and API endpoints  
- **Authentication Tests**: Comprehensive testing of the clean auth system
- **Database Tests**: Test database operations with real database
- **End-to-End Tests**: Test complete user workflows

## Testing Structure

```
web-app-CAA/
├── internal/
│   ├── auth/                   # Clean authentication architecture
│   │   ├── interfaces.go
│   │   ├── service_test.go     # Auth service unit tests
│   │   ├── jwt_service_test.go # JWT service unit tests
│   │   ├── repository_test.go  # Repository unit tests
│   │   └── handler_test.go     # Handler integration tests
│   ├── handlers/
│   │   ├── grid.go
│   │   └── grid_test.go        # Handler tests
│   ├── services/
│   │   ├── grid.go
│   │   └── grid_test.go        # Service tests
│   └── models/
│       ├── models.go
│       └── models_test.go      # Model tests
├── test_clean_auth.sh          # Comprehensive auth test script
├── tests/
│   ├── integration/            # Integration tests
│   ├── fixtures/               # Test data
│   └── helpers/                # Test utilities
└── pkg/
    └── ollama/
        ├── client.go
        └── client_test.go      # Package tests
```

## Authentication Testing

### Comprehensive Test Script

The project includes a comprehensive authentication test script that validates all authentication functionality:

```bash
# Run the comprehensive authentication test
./test_clean_auth.sh
```

This script tests:
- ✅ User Registration
- ✅ User Login  
- ✅ Current User Retrieval
- ✅ Editor Password Validation (Correct & Wrong)
- ✅ Invalid Token Rejection
- ✅ Missing Token Rejection
- ✅ Wrong Credentials Rejection
- ✅ Duplicate Username Prevention

### Authentication Test Results

```
Testing Clean JWT Authentication Implementation
==============================================
✓ User Registration              ✓ Current User Retrieval
✓ User Login                     ✓ Editor Password Validation  
✓ Invalid Token Rejection        ✓ Missing Token Rejection
✓ Wrong Credentials Rejection    ✓ Duplicate Username Prevention

✓ All authentication functions working correctly!
✓ Clean architecture implementation successful!
```

### Clean Authentication Testing

The clean authentication architecture includes comprehensive test coverage with dependency injection and interface-based testing:

#### JWT Service Testing
```go
// internal/auth/jwt_service_test.go
func TestJWTService_GenerateToken(t *testing.T) {
    jwtService := NewJWTService("test-secret", time.Hour)
    
    userID := uint(1)
    token, err := jwtService.GenerateToken(userID)
    
    assert.NoError(t, err)
    assert.NotEmpty(t, token)
    
    // Validate the token
    claims, err := jwtService.ValidateToken(token)
    assert.NoError(t, err)
    assert.Equal(t, userID, claims.UserID)
}
```

#### Auth Service Testing  
```go
// internal/auth/service_test.go
func TestAuthService_Register(t *testing.T) {
    repo := &mockUserRepository{}
    tokenService := &mockTokenService{}
    authService := NewAuthService(repo, tokenService)
    
    user, token, err := authService.Register("testuser", "password123", "test@example.com")
    
    assert.NoError(t, err)
    assert.NotNil(t, user)
    assert.NotEmpty(t, token)
    assert.Equal(t, "testuser", user.Username)
}
```

#### Handler Integration Testing
```go
// internal/auth/handler_test.go
func TestHandler_Register(t *testing.T) {
    authService := &mockAuthService{}
    handler := NewHandler(authService)
    
    gin.SetMode(gin.TestMode)
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)
    
    // Test registration endpoint
    handler.Register(c)
    
    assert.Equal(t, http.StatusCreated, w.Code)
}
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
make test

# Or manually
go test ./...

# Run tests with verbose output
go test -v ./...

# Run specific package tests
go test ./internal/services

# Run specific test function
go test -run TestCreateUser ./internal/services
```

### Test Coverage

```bash
# Run tests with coverage
go test -cover ./...

# Generate detailed coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# View coverage in browser
open coverage.html
```

### Continuous Testing

Use `go test` with file watching:

```bash
# Install gotestsum for better output
go install gotest.tools/gotestsum@latest

# Run tests on file changes
gotestsum --watch ./...
```

## Unit Testing

### Service Layer Tests

**Example: User Service Test**

```go
// internal/services/user_test.go
package services

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    
    "github.com/daniele/web-app-caa/internal/models"
)

func setupTestDB(t *testing.T) *gorm.DB {
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    require.NoError(t, err)
    
    err = db.AutoMigrate(&models.User{}, &models.GridItem{})
    require.NoError(t, err)
    
    return db
}

func TestUserService_CreateUser(t *testing.T) {
    tests := []struct {
        name    string
        user    *models.User
        wantErr bool
    }{
        {
            name: "valid user",
            user: &models.User{
                Username: "testuser",
                Password: "hashedpassword",
            },
            wantErr: false,
        },
        {
            name: "duplicate username",
            user: &models.User{
                Username: "duplicate",
                Password: "hashedpassword",
            },
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            db := setupTestDB(t)
            service := NewUserService(db)
            
            // Create duplicate user for second test
            if tt.name == "duplicate username" {
                existingUser := &models.User{
                    Username: "duplicate",
                    Password: "existing",
                }
                require.NoError(t, service.CreateUser(existingUser))
            }
            
            err := service.CreateUser(tt.user)
            
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
                assert.NotZero(t, tt.user.ID)
            }
        })
    }
}

func TestUserService_FindByUsername(t *testing.T) {
    db := setupTestDB(t)
    service := NewUserService(db)
    
    // Create test user
    testUser := &models.User{
        Username: "findme",
        Password: "password",
    }
    require.NoError(t, service.CreateUser(testUser))
    
    // Test finding existing user
    found, err := service.FindByUsername("findme")
    assert.NoError(t, err)
    assert.Equal(t, "findme", found.Username)
    
    // Test finding non-existent user
    _, err = service.FindByUsername("notfound")
    assert.Error(t, err)
}
```

### Handler Tests

**Example: Authentication Handler Test**

```go
// internal/handlers/auth_test.go
package handlers

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    
    "github.com/daniele/web-app-caa/internal/models"
    "github.com/daniele/web-app-caa/internal/services"
)

func setupTestRouter() *gin.Engine {
    gin.SetMode(gin.TestMode)
    
    db := setupTestDB()
    userService := services.NewUserService(db)
    authHandlers := NewAuthHandlers(userService)
    
    r := gin.New()
    api := r.Group("/api")
    {
        api.POST("/register", authHandlers.Register)
        api.POST("/login", authHandlers.Login)
    }
    
    return r
}

func TestAuthHandlers_Register(t *testing.T) {
    tests := []struct {
        name       string
        payload    map[string]interface{}
        wantStatus int
    }{
        {
            name: "valid registration",
            payload: map[string]interface{}{
                "username":       "newuser",
                "password":       "password123",
                "editorPassword": "admin123",
            },
            wantStatus: http.StatusCreated,
        },
        {
            name: "missing username",
            payload: map[string]interface{}{
                "password":       "password123",
                "editorPassword": "admin123",
            },
            wantStatus: http.StatusBadRequest,
        },
        {
            name: "short password",
            payload: map[string]interface{}{
                "username":       "newuser",
                "password":       "123",
                "editorPassword": "admin123",
            },
            wantStatus: http.StatusBadRequest,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            router := setupTestRouter()
            
            jsonPayload, err := json.Marshal(tt.payload)
            require.NoError(t, err)
            
            req := httptest.NewRequest("POST", "/api/register", bytes.NewReader(jsonPayload))
            req.Header.Set("Content-Type", "application/json")
            
            w := httptest.NewRecorder()
            router.ServeHTTP(w, req)
            
            assert.Equal(t, tt.wantStatus, w.Code)
            
            if tt.wantStatus == http.StatusCreated {
                var response map[string]interface{}
                err := json.Unmarshal(w.Body.Bytes(), &response)
                assert.NoError(t, err)
                assert.Contains(t, response, "user")
            }
        })
    }
}

func TestAuthHandlers_Login(t *testing.T) {
    router := setupTestRouter()
    
    // First register a user
    registerPayload := map[string]string{
        "username":       "logintest",
        "password":       "password123",
        "editorPassword": "admin123",
    }
    
    registerBody, _ := json.Marshal(registerPayload)
    req := httptest.NewRequest("POST", "/api/register", bytes.NewReader(registerBody))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    require.Equal(t, http.StatusCreated, w.Code)
    
    // Test login
    loginPayload := map[string]string{
        "username": "logintest",
        "password": "password123",
    }
    
    loginBody, _ := json.Marshal(loginPayload)
    req = httptest.NewRequest("POST", "/api/login", bytes.NewReader(loginBody))
    req.Header.Set("Content-Type", "application/json")
    w = httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
    
    var response map[string]interface{}
    err := json.Unmarshal(w.Body.Bytes(), &response)
    assert.NoError(t, err)
    assert.Contains(t, response, "token")
    assert.Contains(t, response, "user")
}
```

## Integration Testing

### Database Integration Tests

```go
// tests/integration/database_test.go
package integration

import (
    "os"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    
    "github.com/daniele/web-app-caa/internal/database"
    "github.com/daniele/web-app-caa/internal/models"
    "github.com/daniele/web-app-caa/internal/services"
)

func TestDatabaseIntegration(t *testing.T) {
    // Use temporary SQLite database
    tempFile, err := os.CreateTemp("", "test_*.sqlite")
    require.NoError(t, err)
    defer os.Remove(tempFile.Name())
    
    // Set test database configuration
    os.Setenv("DB_DRIVER", "sqlite")
    os.Setenv("DB_SQLITE_FILE", tempFile.Name())
    
    // Initialize database
    database.Initialize()
    db := database.GetDB()
    
    // Test user operations
    userService := services.NewUserService(db)
    
    user := &models.User{
        Username: "integrationtest",
        Password: "hashedpassword",
    }
    
    err = userService.CreateUser(user)
    assert.NoError(t, err)
    
    found, err := userService.FindByUsername("integrationtest")
    assert.NoError(t, err)
    assert.Equal(t, user.Username, found.Username)
    
    // Test grid operations
    gridService := services.NewGridService(db)
    
    gridItem := &models.GridItem{
        UserID:   user.ID,
        Type:     "item",
        Label:    "Test Item",
        Category: "test",
    }
    
    err = gridService.CreateItem(gridItem)
    assert.NoError(t, err)
    
    items, err := gridService.GetUserItems(user.ID)
    assert.NoError(t, err)
    assert.Len(t, items, 1)
    assert.Equal(t, "Test Item", items[0].Label)
}
```

### API Integration Tests

```go
// tests/integration/api_test.go
package integration

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    
    "github.com/daniele/web-app-caa/internal/handlers"
)

func TestUserRegistrationFlow(t *testing.T) {
    router := setupIntegrationRouter()
    
    // Step 1: Register user
    registerData := map[string]string{
        "username":       "flowtest",
        "password":       "password123",
        "editorPassword": "admin123",
    }
    
    body, _ := json.Marshal(registerData)
    req := httptest.NewRequest("POST", "/api/register", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    require.Equal(t, http.StatusCreated, w.Code)
    
    // Step 2: Login user
    loginData := map[string]string{
        "username": "flowtest",
        "password": "password123",
    }
    
    body, _ = json.Marshal(loginData)
    req = httptest.NewRequest("POST", "/api/login", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    
    w = httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    require.Equal(t, http.StatusOK, w.Code)
    
    var loginResponse map[string]interface{}
    err := json.Unmarshal(w.Body.Bytes(), &loginResponse)
    require.NoError(t, err)
    
    token := loginResponse["token"].(string)
    require.NotEmpty(t, token)
    
    // Step 3: Setup grid
    setupData := map[string]string{
        "gridType": "simplified",
    }
    
    body, _ = json.Marshal(setupData)
    req = httptest.NewRequest("POST", "/api/setup", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+token)
    
    w = httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusCreated, w.Code)
    
    // Step 4: Get grid
    req = httptest.NewRequest("GET", "/api/grid", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    
    w = httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
    
    var gridResponse map[string]interface{}
    err = json.Unmarshal(w.Body.Bytes(), &gridResponse)
    assert.NoError(t, err)
    assert.Contains(t, gridResponse, "items")
}
```

## AI Service Testing

### Mocking AI Backends

```go
// tests/mocks/llm_mock.go
package mocks

import (
    "github.com/stretchr/testify/mock"
)

type MockLLMService struct {
    mock.Mock
}

func (m *MockLLMService) ConjugateWithTemplates(req models.ConjugateRequest) (map[string]interface{}, error) {
    args := m.Called(req)
    return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockLLMService) CorrectWithTemplate(req models.CorrectRequest) (map[string]interface{}, error) {
    args := m.Called(req)
    return args.Get(0).(map[string]interface{}), args.Error(1)
}

// Test using mock
func TestAIService_Conjugate(t *testing.T) {
    mockLLM := new(MockLLMService)
    aiService := &AIService{llmService: mockLLM}
    
    expectedResult := map[string]interface{}{
        "mangiare": "mangio",
    }
    
    mockLLM.On("ConjugateWithTemplates", mock.AnythingOfType("models.ConjugateRequest")).
        Return(expectedResult, nil)
    
    result, err := aiService.Conjugate(models.ConjugateRequest{
        Sentence:  "Io mangiare",
        BaseForms: []string{"mangiare"},
        Tense:     "presente",
    })
    
    assert.NoError(t, err)
    assert.Equal(t, expectedResult, result)
    mockLLM.AssertExpectations(t)
}
```

### AI Integration Tests

```go
func TestAIServiceIntegration(t *testing.T) {
    // Skip if no AI backend configured
    if os.Getenv("BACKEND_TYPE") == "" {
        t.Skip("No AI backend configured")
    }
    
    llmService := services.NewLLMService()
    
    req := models.ConjugateRequest{
        Sentence:  "Io mangiare la pizza",
        BaseForms: []string{"mangiare"},
        Tense:     "presente",
    }
    
    result, err := llmService.ConjugateWithTemplates(req)
    assert.NoError(t, err)
    assert.Contains(t, result, "mangiare")
    
    // Verify conjugation is correct
    conjugation := result["mangiare"].(string)
    assert.Equal(t, "mangio", conjugation)
}
```

## Test Utilities

### Test Helpers

```go
// tests/helpers/test_helpers.go
package helpers

import (
    "testing"
    
    "github.com/stretchr/testify/require"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    
    "github.com/daniele/web-app-caa/internal/models"
)

func SetupTestDB(t *testing.T) *gorm.DB {
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    require.NoError(t, err)
    
    err = db.AutoMigrate(&models.User{}, &models.GridItem{})
    require.NoError(t, err)
    
    return db
}

func CreateTestUser(t *testing.T, db *gorm.DB, username string) *models.User {
    user := &models.User{
        Username: username,
        Password: "hashedpassword",
    }
    
    err := db.Create(user).Error
    require.NoError(t, err)
    
    return user
}

func CreateTestGridItems(t *testing.T, db *gorm.DB, userID uint, count int) []models.GridItem {
    items := make([]models.GridItem, count)
    
    for i := 0; i < count; i++ {
        items[i] = models.GridItem{
            UserID:   userID,
            Type:     "item",
            Label:    fmt.Sprintf("Item %d", i+1),
            Category: "test",
        }
    }
    
    err := db.CreateInBatches(items, 100).Error
    require.NoError(t, err)
    
    return items
}
```

### Test Data Fixtures

```go
// tests/fixtures/users.go
package fixtures

import (
    "github.com/daniele/web-app-caa/internal/models"
)

var TestUsers = []models.User{
    {
        Username: "testuser1",
        Password: "hashedpass1",
        Status:   "active",
    },
    {
        Username: "testuser2", 
        Password: "hashedpass2",
        Status:   "pending_setup",
    },
}

var TestGridItems = []models.GridItem{
    {
        Type:     "category",
        Label:    "Verbi",
        Icon:     "fa-play",
        Category: "verbi",
    },
    {
        Type:     "item",
        Label:    "Mangiare",
        Icon:     "fa-utensils",
        Category: "verbi",
        Text:     "mangiare",
        Speak:    "mangiare",
    },
}
```

## Benchmarking

### Performance Tests

```go
// internal/services/user_bench_test.go
func BenchmarkUserService_CreateUser(b *testing.B) {
    db := setupTestDB(&testing.T{})
    service := NewUserService(db)
    
    b.ResetTimer()
    
    for i := 0; i < b.N; i++ {
        user := &models.User{
            Username: fmt.Sprintf("user%d", i),
            Password: "password",
        }
        
        err := service.CreateUser(user)
        if err != nil {
            b.Fatal(err)
        }
    }
}

func BenchmarkUserService_FindByUsername(b *testing.B) {
    db := setupTestDB(&testing.T{})
    service := NewUserService(db)
    
    // Create test users
    for i := 0; i < 1000; i++ {
        user := &models.User{
            Username: fmt.Sprintf("user%d", i),
            Password: "password",
        }
        service.CreateUser(user)
    }
    
    b.ResetTimer()
    
    for i := 0; i < b.N; i++ {
        username := fmt.Sprintf("user%d", i%1000)
        _, err := service.FindByUsername(username)
        if err != nil {
            b.Fatal(err)
        }
    }
}
```

Run benchmarks:

```bash
# Run benchmarks
go test -bench=. ./internal/services

# Run with memory allocation stats
go test -bench=. -benchmem ./internal/services

# Run specific benchmark
go test -bench=BenchmarkUserService_CreateUser ./internal/services
```

## Continuous Integration

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        go-version: [1.21, 1.22]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: ${{ matrix.go-version }}
    
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
    
    - name: Install dependencies
      run: go mod download
    
    - name: Run tests
      run: go test -v -race -coverprofile=coverage.out ./...
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.out
```

## Testing Best Practices

### 1. Test Organization
- One test file per source file (`user.go` → `user_test.go`)
- Group related tests in the same package
- Use descriptive test names

### 2. Test Data Management
- Use in-memory databases for unit tests
- Create fixtures for complex test data
- Clean up test data after each test

### 3. Assertion Guidelines
- Use `require` for critical assertions that should stop the test
- Use `assert` for non-critical assertions
- Check both success and error cases

### 4. Mock Usage
- Mock external dependencies (databases, APIs)
- Don't mock what you don't own
- Verify mock expectations

### 5. Test Coverage
- Aim for 80%+ test coverage
- Focus on critical business logic
- Don't chase 100% coverage blindly

### 6. Performance Testing
- Write benchmarks for performance-critical code
- Test with realistic data sizes
- Monitor performance regression

---

**Next:** [Contributing Guide →](contributing.md)
