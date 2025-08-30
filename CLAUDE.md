# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web App CAA is an Augmentative and Alternative Communication (CAA) web application implemented in Go with a React frontend. The project is migrated from Node.js/Python to maintain exact functional parity while using modern frameworks.

## Build and Development Commands

### Backend (Go)
- Build: `make build` (enables CGO for SQLite)
- Run: `make run` or `make dev` (run without building)
- Test: `make test`
- Lint: `make lint` (requires golangci-lint)
- Format: `make fmt`
- Vet: `make vet`
- Dependencies: `make deps`
- Swagger docs: `make swagger`

### Frontend (React/TypeScript)
Navigate to `/frontend` directory:
- Dev server: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Type check: `npm run type-check`

### Docker
- Build: `make docker-build`
- Run: `make docker-up`
- Stop: `make docker-down`

## Architecture

### Backend Structure (Standard Go Project Layout)
- `cmd/web-app-CAA/`: Application entry point
- `internal/`: Private application code
  - `auth/`: Clean authentication architecture with JWT, refresh tokens, signing key rotation
  - `config/`: Configuration management
  - `database/`: Database layer with GORM
  - `handlers/`: HTTP request handlers
  - `middleware/`: RBAC, authentication, and logging middleware
  - `models/`: Data models and API request/response structures
  - `services/`: Business logic (grid management, AI, user management, RBAC)
- `pkg/`: Reusable public libraries
- `web/`: Static HTML templates and assets
- `frontend/`: Modern React TypeScript frontend

### Key Features
- **Dual Frontend**: Legacy HTML/JS templates (web/) + Modern React app (frontend/)
- **Authentication**: JWT with refresh tokens, signing key rotation, RBAC with Casbin
- **Database**: SQLite (default) or MySQL with GORM, automatic migrations
- **AI Integration**: Direct LLM integration (Ollama/OpenAI) for verb conjugation and sentence correction
- **S3 Storage**: RAG knowledge management with S3-compatible storage
- **API Documentation**: Comprehensive Swagger/OpenAPI 3.0 documentation

### Database Models
- **users**: Authentication, status tracking, RBAC roles
- **grid_items**: CAA communication grid with user association
- **signing_keys**: JWT signing key rotation for security
- **refresh_tokens**: Secure token refresh mechanism
- **activity**: User activity tracking
- **roles/permissions**: RBAC authorization system

### Authentication Flow
1. Registration/Login with bcrypt password hashing
2. JWT token + refresh token generation
3. Automatic signing key rotation for security
4. RBAC authorization with role-based permissions
5. Protected endpoints with middleware validation

## Configuration

Uses environment variables with sensible defaults:
- `APP_PORT`: Server port (default: 6542)
- `JWT_SECRET`: JWT signing secret
- `DB_DRIVER`: sqlite or mysql (default: sqlite)
- `S3_ENABLED`: Enable S3 storage (default: false)
- `LLM_MODEL`/`LLM_HOST`: AI model configuration
- `BACKEND_TYPE`: ollama or openai

## Important Notes

### CGO Requirement
- SQLite driver requires CGO_ENABLED=1
- Build commands automatically handle this
- Required C compiler dependencies listed in README

### API Compatibility
- Maintains 100% API compatibility with original Node.js implementation
- Same endpoint paths, request/response formats
- Compatible database schema

### Testing
- Comprehensive test scripts: `test_admin_flow.sh`, JWT authentication tests
- Manual testing instructions in README
- Swagger UI for interactive API testing at `/swagger/index.html`

### Development Tips
- Use `make dev` for rapid development (skips build)
- Swagger docs auto-regenerate with `make swagger`
- Frontend development server runs on separate port
- Both legacy and modern frontends can coexist

## Error Handling
- Structured error responses throughout API
- Comprehensive logging with request/response times
- CORS configured for development and production
- Health check endpoints for monitoring