# Project Structure

This document provides a comprehensive overview of the Web App CAA project structure, following the Standard Go Project Layout principles.

## Directory Layout

```
web-app-CAA/
├── cmd/                    # Main applications
│   └── web-app-caa/
│       └── main.go        # Application entry point
├── internal/              # Private application code
│   ├── config/           # Configuration management
│   ├── database/         # Database layer
│   ├── handlers/         # HTTP request handlers
│   ├── middleware/       # Middleware components
│   ├── models/           # Data models
│   ├── prompts/          # AI prompt templates
│   └── services/         # Business logic layer
├── pkg/                  # Public library code
│   └── ollama/          # Ollama client library
├── web/                 # Web application assets
│   ├── static/          # Static files (CSS, JS, images)
│   └── templates/       # HTML templates
├── deployments/         # Docker and deployment configs
├── docs/               # Documentation (MkDocs)
├── data/              # Application data (gitignored)
├── configs/           # Configuration files
├── bin/              # Compiled binaries
├── Makefile          # Build automation
├── go.mod           # Go module definition
├── go.sum           # Go module checksums
├── .env.example     # Environment variables template
└── README.md        # Project overview
```

## Core Directories

### `/cmd` - Main Applications

The entry points for the application executables.

```
cmd/
└── web-app-caa/
    └── main.go           # Main application entry point
```

#### `main.go`

```go
package main

import (
    "github.com/daniele/web-app-caa/internal/config"
    "github.com/daniele/web-app-caa/internal/database"
    "github.com/daniele/web-app-caa/internal/handlers"
    "github.com/gin-gonic/gin"
)

func main() {
    // Configuration loading
    cfg := config.Load()
    
    // Database initialization
    database.Initialize()
    
    // Router setup with handlers
    r := setupRouter()
    
    // Start server
    r.Run(cfg.Host + ":" + cfg.Port)
}
```

### `/internal` - Private Application Code

Contains the core application logic that should not be imported by other applications.

```
internal/
├── config/
│   └── config.go         # Configuration management
├── database/
│   └── database.go       # Database connection and setup
├── handlers/
│   ├── auth.go          # Authentication handlers
│   ├── grid.go          # Grid management handlers
│   ├── ai.go            # AI service handlers
│   └── pages.go         # Web page handlers
├── middleware/
│   ├── auth.go          # Authentication middleware
│   └── ollama.go        # Ollama-specific middleware
├── models/
│   └── models.go        # Data structures and models
├── prompts/
│   ├── presente.tmpl    # Present tense prompt template
│   ├── passato.tmpl     # Past tense prompt template
│   ├── futuro.tmpl      # Future tense prompt template
│   └── correct_sentence.tmpl  # Sentence correction template
└── services/
    ├── user.go          # User management service
    ├── grid.go          # Grid management service
    ├── grids.go         # Grid template service
    ├── ai.go            # AI service coordination
    └── llm.go           # LLM service implementation
```

#### Configuration Layer

**`internal/config/config.go`**
```go
type Config struct {
    Port      string
    Host      string
    JWTSecret string
    Database  DatabaseConfig
    AI        AIConfig
}

func Load() *Config {
    // Load from environment variables and .env file
}
```

#### Database Layer

**`internal/database/database.go`**
```go
func Initialize() {
    // Database connection setup
    // Auto-migration
    // Connection pooling configuration
}
```

#### Handler Layer

**`internal/handlers/auth.go`**
```go
type AuthHandlers struct {
    userService *services.UserService
}

func (h *AuthHandlers) Login(c *gin.Context) {
    // Handle user login
}

func (h *AuthHandlers) Register(c *gin.Context) {
    // Handle user registration
}
```

#### Service Layer

**`internal/services/user.go`**
```go
type UserService struct {
    db *gorm.DB
}

func (s *UserService) CreateUser(user *models.User) error {
    // Business logic for user creation
}
```

#### Models Layer

**`internal/models/models.go`**
```go
type User struct {
    ID       uint   `gorm:"primaryKey"`
    Username string `gorm:"unique;not null"`
    Password string `gorm:"not null"`
    Status   string `gorm:"default:pending_setup"`
}

type GridItem struct {
    ID       uint   `gorm:"primaryKey"`
    UserID   uint   `gorm:"not null"`
    Type     string `gorm:"not null"`
    Label    string
    Icon     string
    Color    string
}
```

### `/pkg` - Public Library Code

Reusable code that can be imported by external applications.

```
pkg/
└── ollama/
    └── client.go         # Ollama API client library
```

#### Ollama Client

**`pkg/ollama/client.go`**
```go
type Client interface {
    SimpleChat(model, prompt string) (string, error)
    StreamChat(model, prompt string) (<-chan string, error)
}

type HTTPClient struct {
    baseURL string
    client  *http.Client
}
```

### `/web` - Web Application Assets

Static files and templates for the web interface.

```
web/
├── static/
│   ├── script/
│   │   ├── auth.js       # Authentication JavaScript
│   │   ├── checkAuth.js  # Auth verification
│   │   ├── config.js     # Configuration utilities
│   │   ├── script.js     # Main application logic
│   │   └── setup.js      # Setup wizard
│   └── style/
│       ├── style.css     # Main stylesheet
│       └── setup.css     # Setup page styles
└── templates/
    ├── layout.tmpl       # Base layout template
    ├── index.tmpl        # Main page template
    ├── login.tmpl        # Login page template
    ├── register.tmpl     # Registration page template
    └── setup.tmpl        # Setup wizard template
```

#### Template Structure

**`web/templates/layout.tmpl`**
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{.Title}} - Web App CAA</title>
    <link rel="stylesheet" href="/static/style/style.css">
</head>
<body>
    <div class="container">
        {{template "content" .}}
    </div>
    <script src="/static/script/script.js"></script>
</body>
</html>
```

## Build and Deployment

### `/deployments` - Deployment Configuration

```
deployments/
├── docker-compose.yml          # Development compose file
├── docker-compose.override.yml # Local overrides
└── Dockerfile                  # Container build definition
```

#### Dockerfile

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main ./cmd/web-app-caa

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/web ./web
COPY --from=builder /app/internal/prompts ./internal/prompts

CMD ["./main"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  webapp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - APP_PORT=3000
      - APP_HOST=0.0.0.0
    volumes:
      - ./data:/app/data
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

volumes:
  ollama_models:
```

### `Makefile` - Build Automation

```makefile
.PHONY: build run test clean docker-build docker-up

BINARY_NAME=web-app-caa
BINARY_PATH=./bin/$(BINARY_NAME)

build:
	go build -o $(BINARY_PATH) ./cmd/web-app-caa

run: build
	$(BINARY_PATH)

dev:
	go run ./cmd/web-app-caa/main.go

test:
	go test -v ./...

docker-build:
	docker build -t $(BINARY_NAME) .

docker-up:
	docker-compose up --build

clean:
	go clean
	rm -f $(BINARY_PATH)
```

## Configuration Files

### Go Module Files

**`go.mod`**
```go
module github.com/daniele/web-app-caa

go 1.21

require (
    github.com/gin-gonic/gin v1.10.1
    github.com/golang-jwt/jwt/v5 v5.3.0
    gorm.io/gorm v1.30.1
    gorm.io/driver/sqlite v1.6.0
    // ... other dependencies
)
```

### Environment Configuration

**`.env.example`**
```env
# Server Configuration
APP_PORT=3000
APP_HOST=localhost
JWT_SECRET=your-jwt-secret-key

# Database Configuration  
DB_DRIVER=sqlite
DB_SQLITE_DIR=./data
DB_SQLITE_FILE=database.sqlite

# AI Configuration
BACKEND_TYPE=ollama
LLM_HOST=http://localhost:11434
LLM_MODEL=llama2
```

## Data Directory

```
data/                    # Runtime data (gitignored)
├── database.sqlite      # SQLite database file
├── database.sqlite-shm  # Shared memory file
└── database.sqlite-wal  # Write-ahead log file
```

## Documentation

```
docs/                    # MkDocs documentation
├── mkdocs.yml          # MkDocs configuration
├── index.md            # Documentation homepage
├── getting-started/    # Getting started guides
├── architecture/       # Architecture documentation
├── api/               # API reference
├── deployment/        # Deployment guides
└── development/       # Development guides
```

## File Naming Conventions

### Go Files

- **Package names**: lowercase, single word
- **File names**: lowercase with underscores (`user_service.go`)
- **Test files**: suffix with `_test.go`
- **Interface files**: often suffixed with `_interface.go`

### Template Files

- **Extension**: `.tmpl` for Go templates
- **Naming**: descriptive, lowercase (`login.tmpl`, `user_profile.tmpl`)

### Static Files

- **JavaScript**: `.js` extension, camelCase naming
- **CSS**: `.css` extension, kebab-case naming
- **Images**: descriptive names with appropriate extensions

## Import Organization

Go files follow this import organization:

```go
package handlers

import (
    // Standard library imports
    "fmt"
    "net/http"
    
    // Third-party imports
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    
    // Local imports
    "github.com/daniele/web-app-caa/internal/models"
    "github.com/daniele/web-app-caa/internal/services"
)
```

## Code Organization Principles

### 1. **Separation of Concerns**
Each package has a single, well-defined responsibility.

### 2. **Dependency Direction**
Dependencies flow inward: handlers → services → models.

### 3. **Interface Usage**
Services depend on interfaces, not concrete implementations.

### 4. **Error Handling**
Consistent error handling patterns throughout the codebase.

### 5. **Testing Structure**
Tests are co-located with the code they test (`*_test.go` files).

---

**Next:** [Database Schema →](database.md)
