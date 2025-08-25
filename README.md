# Web App CAA - Go Implementation

This is the Go implementation of the Web App CAA (Comunicazione Aumentativa e Alternativa), originally implemented in Node.js and Python. This Go server maintains exact functional parity with the original implementation while using modern Go frameworks and libraries.

## Project Structure

This project follows the [Standard Go Project Layout](https://github.com/golang-standards/project-layout):

```
├── cmd/
│   └── web-app-caa/        # Main application entry point
│       └── main.go
├── internal/               # Private application code
│   ├── config/            # Configuration management
│   ├── database/          # Database layer
│   ├── handlers/          # HTTP request handlers
│   ├── middleware/        # Authentication and logging middleware
│   ├── models/            # Data models and structures
│   ├── prompts/           # AI prompt templates
│   └── services/          # Business logic layer
├── pkg/                   # Public library code
│   └── ollama/            # Ollama client library
├── web/                   # Web application assets
│   ├── static/            # Static files (CSS, JS, images)
│   └── templates/         # HTML templates
├── deployments/           # Docker and deployment configs
├── docs/                  # Documentation
├── data/                  # Application data (gitignored)
├── configs/               # Configuration files
├── Makefile              # Build automation
├── go.mod                # Go module definition
└── README.md
```

## Architecture

The Go implementation follows a clean architecture with proper separation of concerns:

- **cmd/web-app-caa/**: Application entry point and server setup
- **internal/models/**: Data models and request/response structures
- **internal/database/**: Database connection and configuration
- **internal/services/**: Business logic layer
- **internal/handlers/**: HTTP request handlers
- **internal/middleware/**: Authentication and logging middleware
- **internal/config/**: Configuration management
- **pkg/ollama/**: Reusable Ollama client library
- **web/**: Static web assets and HTML templates

## Quick Start

### Prerequisites
- Go 1.21 or higher
- Make (optional, for using Makefile commands)

### Build and Run

#### Using Make (Recommended)
```bash
# Install dependencies
make deps

# Build the application
make build

# Run the application
make run

# Or run in development mode (without building binary)
make dev

# Run tests
make test

# Format code
make fmt

# Clean build artifacts
make clean
```

#### Manual Build
```bash
# Install dependencies
go mod tidy

# Build the application
go build -o bin/web-app-caa ./cmd/web-app-caa

# Run the application
./bin/web-app-caa

# Or run directly
go run ./cmd/web-app-caa/main.go
```

#### Using Docker
```bash
# Build Docker image
make docker-build

# Run with Docker Compose
make docker-up

# Stop Docker containers
make docker-down
```

### Container Registry

The project includes a GitHub Actions workflow for building and pushing container images to GitHub Container Registry (ghcr.io).

#### Manual Deployment
To trigger a container build and push:

1. Go to the **Actions** tab in the GitHub repository
2. Select the **"Build and Push Container"** workflow
3. Click **"Run workflow"**
4. Optionally specify a custom image tag (default: `latest`)
5. Click **"Run workflow"** to start the build

The built container will be available at:
```
ghcr.io/dnviti/web-app-caa:latest
```

#### Pull and Run Container
```bash
# Pull the latest container
docker pull ghcr.io/dnviti/web-app-caa:latest

# Run the container
docker run -p 3000:3000 -e APP_PORT=3000 ghcr.io/dnviti/web-app-caa:latest
```

## Features Implemented

### ✅ Authentication System
- User registration with hashed passwords (bcrypt)
- JWT-based authentication
- Editor password verification
- User status management (pending_setup/active)

### ✅ Database Layer
- SQLite database with GORM ORM
- User management (create, find, update)
- Grid item management (CRUD operations)
- Transaction support for data consistency
- Auto-migration of database schema

### ✅ Grid Management
- Default, simplified, and empty grid templates
- Full CRUD operations on grid items
- Category management with proper hierarchical structure
- Item ordering and visibility controls
- Image processing placeholder (ready for implementation)

### ✅ API Endpoints
All original Node.js endpoints have been implemented:

**Authentication:**
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/check-editor-password` - Editor password verification

**Grid Management:**
- `POST /api/setup` - Initial grid setup
- `POST /api/complete-setup` - Mark setup as complete
- `GET /api/grid` - Retrieve user's grid
- `POST /api/grid` - Save entire grid
- `POST /api/grid/item` - Add new grid item
- `PUT /api/grid/item/:id` - Update grid item
- `DELETE /api/grid/item/:id` - Delete grid item

**AI Services (Direct LLM Integration):**
- `POST /api/conjugate` - Verb conjugation service
- `POST /api/correct` - Sentence correction service

### ✅ Middleware & Infrastructure
- Request logging with timestamps and response times
- CORS configuration matching original Node.js setup
- Static file serving for web assets
- JWT token validation with user verification
- Database connection management
- Error handling and recovery

### ✅ Static Web Interface
- All original HTML, CSS, and JavaScript files
- Login and registration pages
- Setup wizard
- Main CAA interface

## Dependencies

The Go implementation uses the following key dependencies:

- **Gin**: Web framework for HTTP routing and middleware
- **GORM**: ORM for database operations
- **SQLite**: Database driver
- **JWT-Go**: JWT token handling
- **bcrypt**: Password hashing
- **Standard Go libraries**: HTTP client, JSON, logging, etc.

## Configuration

Environment variables (with defaults):

### Server Configuration
- `APP_PORT`: Server port (default: 3000)
- `APP_HOST`: Server host (default: localhost)
- `JWT_SECRET`: JWT signing secret (default: your-default-secret-key)

### Database Configuration
- `DB_DRIVER`: Database driver - `sqlite` or `mysql` (default: sqlite)

#### MySQL Configuration (when DB_DRIVER=mysql)
- `DB_HOST`: MySQL host (default: localhost)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_USER`: MySQL username (default: root)
- `DB_PASSWORD`: MySQL password (default: empty)
- `DB_NAME`: MySQL database name (default: webapp_caa)
- `DB_CHARSET`: MySQL charset (default: utf8mb4)
- `DB_PARSE_TIME`: Parse time values (default: true)
- `DB_LOC`: MySQL timezone location (default: Local)
- `DB_MAX_OPEN_CONNS`: Maximum open connections (default: 25)
- `DB_MAX_IDLE_CONNS`: Maximum idle connections (default: 5)

#### SQLite Configuration (when DB_DRIVER=sqlite)
- `DB_SQLITE_DIR`: SQLite database directory (default: ./data)
- `DB_SQLITE_FILE`: SQLite database filename (default: database.sqlite)

### AI Configuration
- `LLM_MODEL`: LLM model to use for direct integration
- `LLM_HOST`: LLM API host URL
- `BACKEND_TYPE`: AI backend type (`ollama` or `openai`)
- `OPENAI_API_KEY`: OpenAI API key (for OpenAI-compatible APIs)

## Database

The application supports both SQLite and MySQL databases:

### SQLite (Default)
- File-based database stored in `./data/database.sqlite`
- No additional setup required
- Perfect for development and small deployments

### MySQL
- Full-featured relational database
- Connection pooling and optimization
- Suitable for production environments

Both databases support:
- Automatic schema migration on startup
- Foreign key constraints
- Transaction support for data integrity

## AI Integration

The Go server provides direct AI functionality using integrated LLM services with template-based processing:

- Italian verb conjugation with RAG knowledge
- Sentence correction and completion  
- Tense-specific grammar processing

## Key Implementation Details

### Authentication Flow
1. User registration creates hashed passwords and initial grid
2. Login returns JWT token with user ID and username
3. Protected endpoints verify JWT and check user exists in database
4. Editor password provides additional security for administrative functions

### Grid System
1. Three grid templates: default (full), simplified, empty
2. Hierarchical category structure with parent-child relationships
3. Items have properties: type, label, icon, color, text, speak, action
4. System controls for speech, deletion, and tense selection
5. Proper ordering and visibility management

### Database Design
- **users**: User accounts with status tracking
- **grid_items**: Grid items with user association and category organization
- Composite primary key (id, user_id) for grid items
- Foreign key constraints with cascade deletion

## Compatibility

This Go implementation maintains 100% API compatibility with the original Node.js server:
- Same endpoint paths and HTTP methods
- Identical request/response formats
- Same authentication mechanisms
- Compatible database schema
- Identical static web assets

## Running the Application

1. Build: `go build -o web-app-caa main.go`
2. Run: `./web-app-caa`
3. Access: http://localhost:3000

The application will:
- Create database directory and file if needed
- Auto-migrate database schema
- Start HTTP server with all endpoints
- Serve static files from public directory

## Testing

The implementation has been tested with:
- User registration and login flows
- Grid retrieval and manipulation
- Authentication token validation
- Editor password verification
- Item CRUD operations
- Error handling and recovery
- Static file serving

All core functionality matches the original Node.js implementation exactly.
