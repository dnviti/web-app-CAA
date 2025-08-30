# Web App CAA - Augmentative and Alternative Communication

A modern web application for Augmentative and Alternative Communication (CAA/AAC), built with Go backend and React frontend. This application provides a comprehensive communication grid system with AI-powered language processing, user management, and administrative features.

## Project Structure

This project follows the [Standard Go Project Layout](https://github.com/golang-standards/project-layout):

```
├── cmd/
│   └── web-app-CAA/        # Main application entry point
├── internal/               # Private application code
│   ├── auth/              # Authentication and JWT handling
│   ├── config/            # Configuration management
│   ├── database/          # Database layer with GORM
│   ├── handlers/          # HTTP request handlers
│   ├── middleware/        # RBAC, authentication, logging
│   ├── models/            # Data models and API structures
│   └── services/          # Business logic (grid, AI, RBAC, user management)
├── frontend/              # Modern React TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components and admin panel
│   │   ├── pages/         # Application pages
│   │   ├── api/           # API client functions
│   │   ├── types/         # TypeScript type definitions
│   │   └── store/         # State management
│   ├── package.json
│   └── vite.config.ts
├── web/                   # Legacy HTML templates and static assets
├── docs/                  # Documentation and API specs
├── Makefile               # Build automation
└── docker-compose.yml     # Container orchestration
```

## Architecture

### Backend (Go)
Clean architecture with separation of concerns:
- **Authentication**: JWT with refresh tokens, signing key rotation, RBAC with role-based permissions
- **Database**: SQLite/MySQL with GORM, automatic migrations and seeding
- **API**: RESTful endpoints with comprehensive Swagger documentation
- **Services**: Business logic for grid management, AI processing, user management
- **Middleware**: Request logging, CORS, authentication, authorization

### Frontend (React + TypeScript)
Modern single-page application with:
- **Components**: Reusable UI components with Tailwind CSS
- **State Management**: Zustand for global state
- **API Integration**: Axios with React Query for data fetching
- **Admin Panel**: User management, system health monitoring, analytics
- **Authentication**: JWT token management with auto-refresh

## Quick Start

### Prerequisites
- Go 1.21 or higher
- Make (optional, for using Makefile commands)
- CGO-compatible C compiler (required for SQLite support)
  - Linux: `gcc` and `musl-dev` or `libc6-dev`
  - macOS: Xcode command line tools (`xcode-select --install`)
  - Windows: MinGW-w64 or Visual Studio Build Tools

### Important: CGO Configuration

This application uses SQLite with the `mattn/go-sqlite3` driver, which requires CGO to be enabled. The Makefile automatically handles this configuration.

**Build Requirements:**
- C compiler (gcc, clang, or equivalent)
- CGO_ENABLED=1 (automatically set by Makefile)
- For static binaries without SQLite: use `make build-nocgo`

### Backend (Go)
```bash
# Install dependencies
make deps

# Build the application
make build

# Run the application
make run

# Development mode (hot reload)
make dev

# Run tests
make test

# Generate Swagger docs
make swagger

# Code formatting and linting
make fmt
make lint
```

### Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Docker
```bash
# Build and run with Docker Compose
make docker-build
make docker-up

# Stop containers
make docker-down
```

## API Documentation (Swagger/OpenAPI)

This application provides comprehensive API documentation using Swagger/OpenAPI 3.0 specification.

### Accessing Swagger UI

When the server is running, access the interactive API documentation at:
```
http://localhost:6542/swagger/index.html
```

### Features

- **Interactive API Testing**: Test all endpoints directly from the browser
- **Authentication Support**: Built-in JWT Bearer token authentication
- **Complete Model Definitions**: All request and response models documented
- **Organized by Tags**: Endpoints grouped by functionality (Auth, Grid, AI, Health)

### API Endpoints

- **Authentication**: User registration, login, and JWT token management
- **Grid Management**: CRUD operations for CAA communication grids
- **AI Language Processing**: Italian verb conjugation and sentence correction
- **Health Checks**: Server status and monitoring endpoints

### Regenerating Documentation

After modifying API endpoints or models, regenerate the documentation:

```bash
make swagger
```

Or manually:
```bash
~/go/bin/swag init -g cmd/web-app-CAA/main.go --output docs
```

### API Development

For detailed information about adding new endpoints and following API conventions, see [docs/api/swagger.md](docs/api/swagger.md).

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

## Features

### 🔐 Authentication & Authorization
- JWT authentication with refresh tokens and signing key rotation
- Role-Based Access Control (RBAC) with Casbin integration
- User registration, login, and password management
- Protected routes and API endpoints
- Admin panel with user management capabilities

### 📊 Communication Grid System
- Interactive CAA communication grids with drag-and-drop
- Multiple grid templates (default, simplified, empty)
- Category management with hierarchical structure
- Symbol and item customization
- User-specific grid configurations

### 🤖 AI Language Processing
- Italian verb conjugation with contextual awareness
- Sentence correction and grammar assistance
- Direct LLM integration (Ollama/OpenAI compatible)
- RAG knowledge management with S3 storage

### 👨‍💼 Admin Dashboard
- User management (create, update, delete, bulk operations)
- System health monitoring with real database status
- User analytics and role distribution
- Comprehensive admin controls

### 🛠️ Technical Features
- Dual frontend support (modern React + legacy HTML)
- SQLite/MySQL database with automatic migrations
- Comprehensive API documentation (Swagger/OpenAPI)
- Docker containerization with GitHub Actions CI/CD
- S3-compatible storage integration

## API Documentation

Comprehensive API documentation is available via Swagger UI when the server is running:
```
http://localhost:6542/swagger/index.html
```

### Key API Endpoints

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with JWT tokens
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

**Grid Management:**
- `GET /api/grid` - Retrieve user's communication grid
- `POST /api/grid/setup` - Initial grid setup with templates
- `POST /api/grid/item` - Add new grid item
- `PUT /api/grid/item/:id` - Update grid item
- `DELETE /api/grid/item/:id` - Delete grid item

**AI Services:**
- `POST /api/ai/conjugate` - Italian verb conjugation
- `POST /api/ai/correct` - Sentence correction and grammar

**Admin Panel (RBAC Protected):**
- `GET /api/admin/users` - List and manage users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user details
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/bulk` - Bulk user operations
- `GET /api/admin/analytics/users` - User analytics
- `GET /api/admin/system/ping` - System health check


## Technology Stack

### Backend
- **Go 1.21+**: Core language
- **Gin**: Web framework and routing
- **GORM**: Database ORM with auto-migration
- **JWT**: Authentication with refresh tokens
- **Casbin**: Role-Based Access Control (RBAC)
- **Swagger**: API documentation generation
- **Docker**: Containerization

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and development server
- **Tailwind CSS**: Styling framework
- **React Query**: Data fetching and caching
- **Zustand**: State management
- **React Router**: Client-side routing

### Database
- **SQLite**: Default embedded database
- **MySQL**: Optional production database
- **GORM**: Automatic migrations and seeding

## Configuration

Environment variables (with defaults):

### Server Configuration
- `APP_PORT`: Server port (default: 6542)
- `APP_HOST`: Server host (default: localhost)
- `JWT_SECRET`: JWT signing secret (default: your-default-secret-key)

### Database Configuration
- `DB_DRIVER`: Database driver - `sqlite` or `mysql` (default: sqlite)

##### MySQL Configuration (when DB_DRIVER=mysql)
- `DB_HOST`: MySQL host (default: localhost)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_USER`: MySQL username (default: root)
- `DB_PASSWORD`: MySQL password (default: empty)
- `DB_NAME`: MySQL database name (default: webapp_caa)

### S3 Storage Configuration (Optional)
- `S3_ENABLED`: Enable S3 storage for RAG knowledge (default: false)
- `S3_REGION`: AWS S3 region (default: us-east-1)
- `S3_BUCKET_NAME`: S3 bucket name (required if S3_ENABLED=true)
- `S3_ACCESS_KEY_ID`: AWS access key ID
- `S3_SECRET_ACCESS_KEY`: AWS secret access key
- `S3_ENDPOINT`: Custom S3 endpoint for LocalStack (optional)
- `S3_KEY_PREFIX`: Key prefix for organization (default: caa)
- `S3_FORCE_PATH_STYLE`: Force path-style URLs (default: true)

> **Note:** When S3 is enabled, the application loads RAG knowledge from S3 with automatic fallback to local files.

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

### RBAC Configuration
- `RBAC_POLICY_FILE`: Path to Casbin policy file (default: configs/rbac_policy.conf)
- `RBAC_MODEL_FILE`: Path to Casbin model file (default: configs/rbac_model.conf)

## Database

### Automatic Database Setup
The application uses a fully automated approach:

**Schema Migration (GORM AutoMigrate):**
- Automatic table creation and schema updates
- Includes: users, grid_items, roles, permissions, user_roles, role_permissions, refresh_tokens, signing_keys, user_activities
- No manual migration files needed

**Data Seeding:**
- RBAC setup with default roles (admin, editor, user) and permissions
- Default admin user creation
- SigningKey initialization for JWT security
- Idempotent operations - safe to run multiple times

### Supported Databases
**SQLite (Default):**
- File-based database in `./data/database.sqlite`
- Zero configuration required
- Ideal for development and small deployments

**MySQL:**
- Production-ready with connection pooling
- Full relational database features
- Horizontal scaling support

## AI Integration

Direct LLM integration for language processing:
- **Italian Verb Conjugation**: Context-aware conjugation with tense support
- **Sentence Correction**: Grammar and syntax correction
- **RAG Knowledge**: Enhanced responses using stored knowledge base
- **Multi-Backend Support**: Ollama and OpenAI-compatible APIs

Supported models: Llama, Mistral, OpenAI GPT, and other compatible LLMs.

## Development

### Database Models
**Core Models:**
- **users**: Authentication, status, and profile information
- **grid_items**: CAA communication grid items with user association
- **roles/permissions**: RBAC authorization system
- **user_roles/role_permissions**: Many-to-many RBAC relationships
- **refresh_tokens**: Secure token refresh mechanism
- **signing_keys**: JWT signing key rotation for security
- **user_activities**: Activity tracking and audit logs

### Authentication Flow
1. User registration with bcrypt password hashing
2. Login returns JWT access token + refresh token
3. Automatic signing key rotation for enhanced security
4. RBAC middleware validates permissions
5. Token refresh mechanism for session management

### Admin Panel Features
- User management with bulk operations
- Real-time system health monitoring
- Database connection status and type detection
- User analytics and role distribution
- Activity logging and audit trails

## Deployment

### Production Checklist
- [ ] Set `JWT_SECRET` to a secure random value
- [ ] Configure database (MySQL recommended for production)
- [ ] Set up S3 storage for RAG knowledge (optional)
- [ ] Configure RBAC policies as needed
- [ ] Enable HTTPS with reverse proxy (nginx/apache)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Container Deployment
The application is automatically built and published to GitHub Container Registry:
```bash
# Pull and run the latest container
docker pull ghcr.io/dnviti/web-app-caa:latest
docker run -p 6542:6542 -e JWT_SECRET=your-secret ghcr.io/dnviti/web-app-caa:latest
```

## Getting Started

1. **Clone and build:**
   ```bash
   git clone https://github.com/dnviti/web-app-CAA.git
   cd web-app-CAA
   make build
   ```

2. **Run the application:**
   ```bash
   make run
   ```

3. **Access the application:**
   - Backend API: http://localhost:6542
   - Swagger UI: http://localhost:6542/swagger/index.html
   - Frontend dev server: http://localhost:5173 (if running `npm run dev`)

4. **Default admin user:**
   - Username: `admin`
   - Password: `admin123`
   - (Change password after first login)

The application will automatically:
- Create database and migrate schema
- Seed default roles and admin user
- Generate JWT signing keys
- Start HTTP server with all endpoints

## Testing

Comprehensive testing scripts are available:

```bash
# Test JWT authentication flow
./scripts/test_jwt.sh

# Test admin panel functionality
./scripts/test_admin_flow.sh

# Run Go unit tests
make test

# Run frontend tests
cd frontend && npm test
```

### Manual Testing
Use the Swagger UI at `/swagger/index.html` for interactive API testing with built-in authentication support.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
