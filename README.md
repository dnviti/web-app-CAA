# Web App CAA

**Augmentative and Alternative Communication (AAC) Web Application**

A modern, AI-powered communication system built with Go and React to help users create custom communication grids with intelligent language assistance.

## 🚀 Quick Start

### Prerequisites

- **Go 1.24+** - [Install Go](https://golang.org/dl/)
- **Node.js 18+** (for frontend development) - [Install Node.js](https://nodejs.org/)
- **Git** - [Install Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/dnviti/web-app-CAA.git
cd web-app-CAA

# Install dependencies and build
make deps
make build

# Run the application
make run
```

The application will be available at `http://localhost:6542`

### Docker Deployment

```bash
# Quick start with Docker Compose
docker-compose -f deployments/docker-compose.yaml up -d

# Or using Make
make docker-up
```

## 📋 Features

### ✅ **Core Functionality**
- **Interactive Communication Grids**: Visual communication boards with categories, items, and actions
- **AI-Powered Language Support**: Italian verb conjugation and sentence correction using LLMs
- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Grid Templates**: Default, simplified, and empty grid templates
- **Multi-Database Support**: SQLite (development) and MySQL (production)

### ✅ **Advanced Features**
- **Role-Based Access Control (RBAC)**: Fine-grained permissions using Casbin
- **S3 Storage Integration**: RAG knowledge management with AWS S3 compatibility
- **Dual Frontend Architecture**: Legacy HTML templates + Modern React TypeScript frontend
- **Comprehensive API**: RESTful API with Swagger/OpenAPI documentation
- **Docker Support**: Production-ready containerization
- **Activity Tracking**: User activity monitoring and analytics

### 🤖 **AI Integration**
- **Multiple LLM Backends**: Ollama, OpenAI, and compatible APIs
- **Verb Conjugation**: Italian verbs in present, past, and future tenses
- **Sentence Correction**: Grammar checking and correction
- **RAG Knowledge Base**: Template-based processing with S3 storage
- **Flexible Configuration**: Easy model switching and endpoint configuration

## 🏗️ Architecture

### Backend (Go)
```
cmd/web-app-CAA/          # Application entry point
internal/
├── auth/                 # JWT authentication & RBAC
├── config/               # Configuration management
├── database/             # GORM database layer
├── handlers/             # HTTP request handlers
├── middleware/           # Authentication & logging
├── models/               # Data models & API structures
└── services/             # Business logic
pkg/                      # Reusable libraries
web/                      # Legacy HTML templates
```

### Frontend (React TypeScript)
```
frontend/
├── src/
│   ├── api/             # API client functions
│   ├── components/      # React components
│   ├── pages/           # Application pages
│   ├── types/           # TypeScript definitions
│   └── utils/           # Helper utilities
├── public/              # Static assets
└── dist/                # Built frontend (served by Go)
```

### Key Technologies
- **Backend**: Go 1.24+, Gin web framework, GORM ORM
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Database**: SQLite (dev), MySQL/PostgreSQL (prod)
- **Authentication**: JWT with refresh tokens, bcrypt hashing
- **AI**: Ollama, OpenAI-compatible APIs
- **Storage**: AWS S3, LocalStack (dev), RustFS (testing)
- **Deployment**: Docker, Docker Compose

## 🛠️ Development

### Build Commands

#### Backend
```bash
make build        # Build Go binary (with CGO for SQLite)
make run          # Build and run
make dev          # Run without building (go run)
make test         # Run tests
make lint         # Run linter (requires golangci-lint)
make fmt          # Format code
make swagger      # Generate API documentation
```

#### Frontend
```bash
cd frontend/
npm run dev       # Development server
npm run build     # Production build
npm run test      # Run tests
npm run lint      # ESLint
npm run type-check # TypeScript checking
```

#### Docker
```bash
make docker-build    # Build Docker image
make docker-up       # Start with docker-compose
make docker-down     # Stop containers
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server
APP_PORT=6542
JWT_SECRET=your-super-secret-jwt-key

# Database
DB_DRIVER=sqlite                    # or mysql
DB_SQLITE_DIR=./data

# AI Services (Optional)
BACKEND_TYPE=ollama                 # or openai
LLM_HOST=http://localhost:11434
LLM_MODEL=llama2

# S3 Storage (Optional)
S3_ENABLED=false
S3_BUCKET_NAME=your-caa-bucket
S3_REGION=us-east-1
```

## 📖 Documentation

### For Users
- **[Installation Guide](docs/getting-started/installation.md)** - Complete setup instructions
- **[Quick Start Guide](docs/getting-started/quick-start.md)** - Get up and running
- **[Configuration Guide](docs/getting-started/configuration.md)** - Environment setup

### For Developers
- **[Architecture Overview](docs/architecture/overview.md)** - System design
- **[API Documentation](docs/api/authentication.md)** - Complete API reference
- **[Development Setup](docs/development/setup.md)** - Development environment
- **[Testing Guide](docs/development/testing.md)** - Testing practices

### For DevOps
- **[Docker Deployment](docs/deployment/docker.md)** - Container deployment
- **[S3 Integration](docs/s3-integration.md)** - Storage configuration

Full documentation is available at **[docs/](docs/index.md)** and can be browsed with [MkDocs](https://www.mkdocs.org/):

```bash
pip install -r docs/requirements.txt
mkdocs serve
```

## 🔗 API Reference

The application provides a comprehensive RESTful API documented with Swagger/OpenAPI 3.0.

### Key Endpoints
- **Authentication**: `POST /auth/login`, `POST /auth/register`
- **Grid Management**: `GET /api/grid`, `POST /api/grid/items`
- **AI Services**: `POST /api/ai/conjugate`, `POST /api/ai/correct`
- **User Management**: `GET /api/users`, `POST /api/users`
- **RAG Knowledge**: `GET /api/rag/knowledge`, `POST /api/rag/knowledge`

### Interactive Documentation
- **Swagger UI**: `http://localhost:6542/swagger/index.html`
- **OpenAPI Spec**: `http://localhost:6542/swagger/doc.json`

## 🧪 Testing

### Backend Tests
```bash
make test                           # Run all Go tests
go test -v ./internal/auth/         # Test specific package
```

### Frontend Tests
```bash
cd frontend/
npm run test                        # Run Vitest tests
npm run test:coverage               # With coverage
```

### API Testing
Manual testing scripts are available:
```bash
# Test authentication flow
./scripts/test_auth.sh

# Test admin functionality
./scripts/test_admin_flow.sh
```

## 🐳 Docker Deployment

### Quick Deploy
```bash
# Clone and deploy
git clone https://github.com/dnviti/web-app-CAA.git
cd web-app-CAA
docker-compose -f deployments/docker-compose.yaml up -d
```

### Production Deployment
```bash
# Build production image
make docker-build

# Tag and push (if using container registry)
docker tag web-app-caa your-registry/web-app-caa:latest
docker push your-registry/web-app-caa:latest
```

### Service Profiles
Enable optional services via Docker Compose profiles:
```bash
# With MySQL and Ollama
COMPOSE_PROFILES=mysql,ollama docker-compose up -d

# With all services
COMPOSE_PROFILES=mysql,ollama,rustfs docker-compose up -d
```

## 🔧 Configuration

### Database Options
- **SQLite** (default): Zero-config, file-based database
- **MySQL**: Production database with connection pooling
- **PostgreSQL**: Alternative production database

### AI Service Options
- **Ollama**: Local LLM server for privacy and offline use
- **OpenAI**: Cloud-based GPT models
- **OpenWebUI**: Self-hosted OpenAI-compatible endpoint

### Storage Options
- **Local Files**: Default file-based storage
- **AWS S3**: Scalable cloud storage
- **LocalStack**: Local S3 emulation for development
- **RustFS**: Lightweight S3-compatible server

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/development/contributing.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test: `make test && cd frontend && npm test`
4. Commit with descriptive messages
5. Push and create a Pull Request

### Code Style
- **Go**: Follow `gofmt` and `golangci-lint` standards
- **TypeScript**: Follow ESLint and Prettier configuration
- **Commits**: Use conventional commit messages

## 📊 Project Status

### ✅ **Backend** (Complete)
- Authentication & RBAC with Casbin
- Grid management with full CRUD operations
- AI services for Italian language processing
- S3 storage integration with fallback
- Comprehensive API documentation
- Docker deployment ready

### 🚧 **Frontend** (In Development)
- Modern React TypeScript implementation
- Admin dashboard with user management
- Grid editing interface
- PWA capabilities with offline support

### 📋 **Roadmap**
- **Phase 1**: Complete admin interfaces
- **Phase 2**: Enhanced authentication (2FA, email verification)
- **Phase 3**: Advanced AI features and multi-language support
- **Phase 4**: Multi-tenancy and enterprise features

View detailed status: **[docs/status.md](docs/status.md)**

## 📄 License

This project is open source. See [LICENSE](LICENSE) for details.

## 🆘 Support

- **Documentation**: [docs/index.md](docs/index.md)
- **Issues**: [GitHub Issues](https://github.com/dnviti/web-app-CAA/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dnviti/web-app-CAA/discussions)

---

**Made with ❤️ for the AAC community**