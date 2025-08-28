# Development Setup

This guide covers setting up a development environment for Web App CAA, including all necessary tools, dependencies, and configuration.

## Prerequisites

### Required Software

Ensure you have the following installed on your development machine:

#### Go Programming Language
**Version**: 1.21 or higher

=== "Linux (Ubuntu/Debian)"
    ```bash
    # Using package manager
    sudo apt update
    sudo apt install golang-go
    
    # Verify installation
    go version
    ```

=== "macOS"
    ```bash
    # Using Homebrew
    brew install go
    
    # Or download from https://golang.org/dl/
    go version
    ```

=== "Windows"
    1. Download installer from [golang.org/dl](https://golang.org/dl/)
    2. Run the installer
    3. Verify in Command Prompt: `go version`

#### Git Version Control
```bash
# Linux (Ubuntu/Debian)
sudo apt install git

# macOS
brew install git

# Windows: Download from https://git-scm.com/
```

#### Make (Optional but Recommended)
```bash
# Linux
sudo apt install make

# macOS (usually pre-installed)
xcode-select --install

# Windows (via Chocolatey)
choco install make
```

#### Docker (Optional)
For containerized development:
- **Docker Desktop**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Usually included with Docker Desktop

### Development Tools

#### Recommended Code Editor
- **VS Code** with Go extension
- **GoLand** (JetBrains IDE)
- **Vim/Neovim** with go plugins

#### VS Code Extensions
```json
{
  "recommendations": [
    "golang.go",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-yaml",
    "ms-vscode-remote.remote-containers"
  ]
}
```

## Project Setup

### 1. Clone the Repository

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/web-app-CAA.git
cd web-app-CAA

# Add upstream remote
git remote add upstream https://github.com/dnviti/web-app-CAA.git

# Verify remotes
git remote -v
```

### 2. Install Dependencies

```bash
# Download Go modules
go mod download
go mod tidy

# Or using Make
make deps
```

### 3. Environment Configuration

Create a development environment file:

```bash
# Copy example configuration
cp .env.example .env

# Edit with your settings
nano .env
```

**Development `.env` file:**
```env
# Server Configuration
APP_PORT=6542
APP_HOST=localhost
JWT_SECRET=development-jwt-secret-change-in-production

# Database Configuration (SQLite for development)
DB_DRIVER=sqlite
DB_SQLITE_DIR=./data
DB_SQLITE_FILE=database.sqlite

# AI Configuration (optional - Ollama)
BACKEND_TYPE=ollama
LLM_HOST=http://localhost:11434
LLM_MODEL=llama2

# Debug Settings
GIN_MODE=debug
LOG_LEVEL=debug
```

### 4. Database Setup

The application will automatically create the SQLite database on first run:

```bash
# Create data directory
mkdir -p data

# Set proper permissions
chmod 755 data
```

### 5. AI Services Setup (Optional)

#### Option A: Ollama (Local AI)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# Download a model (in another terminal)
ollama pull llama2
```

#### Option B: OpenAI API

```bash
# Set OpenAI configuration in .env
echo "BACKEND_TYPE=openai" >> .env
echo "OPENAI_API_KEY=your-api-key" >> .env
echo "LLM_MODEL=gpt-3.5-turbo" >> .env
```

## Development Workflow

### 1. Start Development Server

```bash
# Using Make (recommended)
make dev

# Or manually
go run ./cmd/web-app-caa/main.go
```

The application will be available at: `http://localhost:6542`

### 2. Watch for Changes

For automatic rebuilds on file changes, use a tool like `air`:

```bash
# Install air
go install github.com/cosmtrek/air@latest

# Create air configuration
cat > .air.toml << 'EOF'
root = "."
testdata_dir = "testdata"
tmp_dir = "tmp"

[build]
  args_bin = []
  bin = "./tmp/main"
  cmd = "go build -o ./tmp/main ./cmd/web-app-caa"
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "testdata", "data"]
  exclude_file = []
  exclude_regex = ["_test.go"]
  exclude_unchanged = false
  follow_symlink = false
  full_bin = ""
  include_dir = []
  include_ext = ["go", "tpl", "tmpl", "html"]
  kill_delay = "0s"
  log = "build-errors.log"
  send_interrupt = false
  stop_on_root = false

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  runner = "green"
  watcher = "cyan"

[log]
  time = false

[misc]
  clean_on_exit = false
EOF

# Start with hot reload
air
```

### 3. Run Tests

```bash
# Run all tests
make test

# Or manually
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test ./internal/services -v
```

### 4. Code Formatting

```bash
# Format code
make fmt

# Or manually
go fmt ./...
gofmt -s -w .
```

### 5. Build Application

```bash
# Build binary
make build

# Or manually
go build -o bin/web-app-caa ./cmd/web-app-caa
```

## Docker Development

### Using Docker Compose

```bash
# Start all services
make docker-up

# Or manually
docker-compose up --build

# Stop services
docker-compose down
```

### Development Container

Create a development container configuration:

**.devcontainer/devcontainer.json:**
```json
{
  "name": "Web App CAA Dev",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "webapp",
  "workspaceFolder": "/app",
  "features": {
    "ghcr.io/devcontainers/features/go:1": {
      "version": "1.21"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "golang.go",
        "ms-vscode.vscode-json"
      ]
    }
  },
  "forwardPorts": [6542],
  "postCreateCommand": "go mod download"
}
```

## Debugging

### VS Code Debug Configuration

Create **.vscode/launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Package",
      "type": "go",
      "request": "launch",
      "mode": "auto",
      "program": "./cmd/web-app-caa",
      "env": {
        "APP_PORT": "6542",
        "GIN_MODE": "debug"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Debug with Delve

```bash
# Install delve debugger
go install github.com/go-delve/delve/cmd/dlv@latest

# Start debugging session
dlv debug ./cmd/web-app-caa

# Set breakpoint and continue
(dlv) break main.main
(dlv) continue
```

## Database Development

### SQLite Management

```bash
# Access database directly
sqlite3 data/database.sqlite

# View tables
.tables

# Describe table structure
.schema users

# Query data
SELECT * FROM users;
```

### Database Migrations

When modifying models:

```go
// Add new field to model
type User struct {
    ID       uint   `gorm:"primaryKey"`
    Username string `gorm:"unique;not null"`
    Password string `gorm:"not null"`
    Email    string `gorm:"unique"` // New field
}

// GORM will auto-migrate on next run
```

## Frontend Development

### Static Files Structure

```
web/
├── static/
│   ├── script/
│   │   ├── auth.js
│   │   ├── script.js
│   │   └── setup.js
│   └── style/
│       ├── style.css
│       └── setup.css
└── templates/
    ├── layout.tmpl
    ├── index.tmpl
    └── ...
```

### Live Reload for Static Files

The Gin framework serves static files directly, so changes are reflected immediately without restart.

### Template Development

Templates use Go's `html/template` package:

```html
<!-- templates/example.tmpl -->
{{define "content"}}
<div class="container">
    <h1>{{.Title}}</h1>
    {{if .User}}
        <p>Welcome, {{.User.Username}}!</p>
    {{end}}
</div>
{{end}}
```

## Testing

### Unit Tests

```go
// internal/services/user_test.go
func TestCreateUser(t *testing.T) {
    db := setupTestDB(t)
    service := NewUserService(db)
    
    user := &models.User{
        Username: "testuser",
        Password: "hashedpass",
    }
    
    err := service.CreateUser(user)
    assert.NoError(t, err)
    assert.NotZero(t, user.ID)
}
```

### Integration Tests

```go
func TestUserRegistration(t *testing.T) {
    router := setupTestRouter()
    
    payload := `{"username":"newuser","password":"password123"}`
    req := httptest.NewRequest("POST", "/api/register", strings.NewReader(payload))
    req.Header.Set("Content-Type", "application/json")
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusCreated, w.Code)
}
```

### Test Database Setup

```go
func setupTestDB(t *testing.T) *gorm.DB {
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    require.NoError(t, err)
    
    err = db.AutoMigrate(&models.User{}, &models.GridItem{})
    require.NoError(t, err)
    
    return db
}
```

## Performance Profiling

### CPU Profiling

```go
import _ "net/http/pprof"

// Add to main.go
go func() {
    log.Println(http.ListenAndServe("localhost:6060", nil))
}()
```

Access profiling at: `http://localhost:6060/debug/pprof/`

### Memory Profiling

```bash
# Generate CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Generate memory profile  
go tool pprof http://localhost:6060/debug/pprof/heap
```

## Common Development Tasks

### CGO Configuration

This project requires CGO to be enabled for SQLite support. See [CGO_ENABLED=1 Issue](./cgo-issue.md) for detailed information about handling CGO in different environments.

**Quick summary:**
- SQLite driver requires `CGO_ENABLED=1`
- Use `task build` or `make build` (both handle CGO properly)
- In CI/CD, ensure build dependencies are installed

### Adding a New API Endpoint

1. **Define route in main.go:**
   ```go
   api.POST("/new-endpoint", handlers.NewEndpoint)
   ```

2. **Implement handler:**
   ```go
   func (h *Handler) NewEndpoint(c *gin.Context) {
       // Implementation
   }
   ```

3. **Add tests:**
   ```go
   func TestNewEndpoint(t *testing.T) {
       // Test implementation
   }
   ```

4. **Update documentation:**
   - Add to API docs in `docs/api/`

### Adding a New Database Model

1. **Define model:**
   ```go
   type NewModel struct {
       ID        uint `gorm:"primaryKey"`
       Name      string
       CreatedAt time.Time
   }
   ```

2. **Add to auto-migration:**
   ```go
   db.AutoMigrate(&User{}, &GridItem{}, &NewModel{})
   ```

3. **Create service methods:**
   ```go
   func (s *Service) CreateNewModel(model *NewModel) error {
       return s.db.Create(model).Error
   }
   ```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process using port 6542
lsof -ti:6542 | xargs kill -9

# Or use different port
APP_PORT=6542 make dev
```

**Module download failures:**
```bash
# Clear module cache
go clean -modcache

# Set proxy
export GOPROXY=https://proxy.golang.org,direct
go mod download
```

**Database locked:**
```bash
# Stop all instances
pkill web-app-caa

# Remove lock files
rm -f data/*.sqlite-*
```

### Debug Logging

Enable verbose logging:

```bash
# Set environment variables
export GIN_MODE=debug
export LOG_LEVEL=debug

# Or in .env file
echo "GIN_MODE=debug" >> .env
echo "LOG_LEVEL=debug" >> .env
```

---

**Next:** [Testing Guide →](testing.md)
