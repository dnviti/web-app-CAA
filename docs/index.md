# Web App CAA Documentation

Welcome to the **Web App CAA** (Comunicazione Aumentativa e Alternativa) documentation. This project is a Go implementation of an Augmentative and Alternative Communication (AAC) web application that helps users create custom communication grids with AI-powered language assistance.

## � Quick Navigation

### For New Users
- **[Installation Guide](getting-started/installation.md)** - Get Web App CAA running on your system
- **[Quick Start Guide](getting-started/quick-start.md)** - Your first steps with the application
- **[Configuration](getting-started/configuration.md)** - Customizing your setup

### For Developers
- **[Development Setup](development/setup.md)** - Set up your development environment
- **[Architecture Overview](architecture/overview.md)** - Understand the system design
- **[API Reference](api/authentication.md)** - Complete API documentation
- **[Testing Guide](development/testing.md)** - Testing practices and tools
- **[Contributing Guide](development/contributing.md)** - How to contribute to the project

### For DevOps/Deployment
- **[Docker Deployment](deployment/docker.md)** - Deploy using Docker containers
- **[GitHub Pages](deployment/github-pages.md)** - Documentation deployment

## �🚀 What is Web App CAA?

Web App CAA is a web application built in Go that provides:

- **Interactive Communication Grids**: Create and customize visual communication boards with categories, items, and actions
- **AI-Powered Language Support**: Italian verb conjugation and sentence correction using LLM services
- **User Authentication**: Secure user accounts with JWT-based authentication
- **Flexible Templates**: Choose from default, simplified, or empty grid templates
- **Multi-Database Support**: Works with SQLite for development and MySQL for production

## 🏗️ Key Features

### ✅ **Authentication System**
- Secure user registration with bcrypt password hashing
- JWT-based session management
- Editor password verification for administrative functions
- User status tracking (pending_setup/active)

### ✅ **Grid Management**
- Three pre-built templates: Default, Simplified, and Empty
- Full CRUD operations for grid items
- Hierarchical category organization
- Item ordering and visibility controls
- Customizable colors, icons, and actions

### ✅ **AI Services**
- **Verb Conjugation**: Italian verbs conjugated to present, past, and future tenses
- **Sentence Correction**: Grammar checking and correction
- **Template-based Processing**: Uses Go templates with RAG knowledge
- **Multiple LLM Backends**: Supports Ollama and OpenAI-compatible APIs

### ✅ **S3 Storage Integration** 🆕
- **RAG Knowledge Management**: Store and manage AI knowledge base in S3
- **Automatic Backups**: Timestamped backups with restore functionality
- **Fallback Strategy**: Graceful fallback to local files when S3 unavailable
- **Multi-Environment Support**: Separate S3 prefixes for dev/staging/prod
- **Development-Friendly**: LocalStack and RustFS support for local development

### ✅ **Architecture**
- Clean architecture with proper separation of concerns
- RESTful API design
- Middleware for logging and authentication
- Static file serving for web assets
- Docker support for easy deployment

## 🎯 Common Tasks

| I want to... | Go to... |
|--------------|----------|
| Install and try the app | [Quick Start Guide](getting-started/quick-start.md) |
| Deploy to production | [Docker Deployment](deployment/docker.md) |
| Set up S3 storage | [S3 Integration Guide](s3-integration.md) |
| Manage RAG knowledge | [RAG Knowledge API](api/rag-knowledge.md) |
| Contribute code | [Contributing Guide](development/contributing.md) |
| Understand the API | [Authentication API](api/authentication.md) |
| Set up development environment | [Development Setup](development/setup.md) |
| Run tests | [Testing Guide](development/testing.md) |
| Deploy with Docker | [Docker Deployment](deployment/docker.md) |
| Understand the architecture | [Architecture Overview](architecture/overview.md) |

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Go 1.24+ with Gin web framework |
| **Database** | SQLite (dev) / MySQL (production) |
| **ORM** | GORM with auto-migration |
| **Authentication** | JWT tokens with bcrypt |
| **AI Integration** | Ollama / OpenAI APIs |
| **Storage** | AWS S3 / LocalStack / RustFS |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Containerization** | Docker & Docker Compose |
| **Documentation** | MkDocs with Material theme |

## 🎯 Getting Started

1. **[Install Prerequisites](getting-started/installation.md)**
2. **[Clone and Build](getting-started/quick-start.md)**
3. **[Configure Environment](getting-started/configuration.md)**
4. **[Deploy with Docker](deployment/docker.md)**

## � Project Status

### ✅ Backend Implementation
The Go backend is fully implemented and production-ready:
- **Authentication & RBAC**: Complete JWT authentication with role-based access control
- **Grid Management**: Full CRUD operations for communication grids
- **AI Services**: Italian language processing with verb conjugation and correction
- **Database Layer**: SQLite/PostgreSQL/MySQL support with automatic seeding
- **API Documentation**: Complete Swagger documentation
- **Docker Support**: Production-ready containerization

📄 **[View Complete Status Report](status.md)**

### 🚀 Development Roadmap
Planned development phases for future features:
- **Phase 1**: Administrative backend interfaces (backoffice, user dashboard, admin panel)
- **Phase 2**: Enhanced authentication (registration control, email/SMS verification, 2FA)
- **Phase 3**: Frontend implementation (React/TypeScript PWA)
- **Phase 4**: Advanced features (multi-tenancy, advanced AI, integrations)

📋 **[View Detailed Roadmap](roadmap.md)**

### 🤖 For AI Agents
A comprehensive guide for AI assistants working on this project:

🔧 **[AI Agent Guide](ai-agent-guide.md)** - Complete system understanding for automated development

## �📖 Navigation

Use the sidebar to navigate through different sections:

- **Getting Started**: Installation and initial setup
- **Architecture**: System design and structure  
- **API Reference**: Complete endpoint documentation
- **Development**: Setup, testing, and contribution guides
- **Deployment**: Docker and production deployment
- **Project Management**: Status reports, roadmaps, and AI guides
- **Deployment**: Production deployment guides
- **Development**: Contributing and testing guidelines

## 🤝 Contributing

This project welcomes contributions! Please see our [Contributing Guide](development/contributing.md) for details on how to get involved.

---

**Need Help?** Check out our [FAQ](getting-started/installation.md#troubleshooting) or open an issue on [GitHub](https://github.com/dnviti/web-app-CAA/issues).
