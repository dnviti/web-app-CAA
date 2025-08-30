# Web App CAA API Documentation

This directory contains comprehensive API documentation for the Web App CAA system.

## Overview

Web App CAA is a Communication and Alternative Augmentative (CAA) web application that provides:

- **Grid Management**: Create and manage communication grids with pictograms
- **User Authentication**: Secure JWT-based authentication with RBAC
- **AI Language Services**: Italian verb conjugation and sentence correction
- **RAG Knowledge Management**: S3-integrated knowledge base management
- **ARASAAC Integration**: Access to pictogram databases

## API Documentation Structure

### Authentication & Authorization
- [`authentication.md`](./authentication.md) - JWT authentication, user management, RBAC system

### Core Features
- [`grid.md`](./grid.md) - Grid management, CRUD operations, templates
- [`ai.md`](./ai.md) - AI language services, verb conjugation, sentence correction

### Knowledge Management
- [`rag-knowledge.md`](./rag-knowledge.md) - **NEW**: S3-integrated RAG knowledge management

### External Services
- ARASAAC pictogram integration (documentation in main API files)

### Technical Documentation
- [`swagger.md`](./swagger.md) - OpenAPI/Swagger specification details
- [`swagger-implementation.md`](./swagger-implementation.md) - Implementation notes

## Quick Start

### Base URL
```
https://your-domain.com/api
```

### Authentication
All protected endpoints require a Bearer token:
```http
Authorization: Bearer <jwt-token>
```

### Interactive Documentation
- **Swagger UI**: `https://your-domain.com/swagger/index.html`
- **OpenAPI JSON**: `https://your-domain.com/openapi.json`
- **OpenAPI YAML**: `https://your-domain.com/openapi.yaml`

## New Features: RAG Knowledge Management

The latest addition to the API includes comprehensive S3-integrated knowledge management:

### Key Features
- **S3 Storage Integration**: Store knowledge base in AWS S3 or compatible services
- **Backup & Restore**: Timestamped backups with easy restoration
- **Fallback Strategy**: Automatic fallback to local files when S3 is unavailable
- **Health Monitoring**: S3 connectivity and health checks
- **Admin Controls**: Full RBAC integration for secure access

### Endpoints Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rag-knowledge` | Retrieve current knowledge |
| `PUT` | `/rag-knowledge` | Update knowledge (optional S3 save) |
| `POST` | `/rag-knowledge/reload` | Reload from storage |
| `POST` | `/rag-knowledge/backup` | Create timestamped backup |
| `GET` | `/rag-knowledge/backups` | List available backups |
| `POST` | `/rag-knowledge/restore/{key}` | Restore from backup |
| `GET` | `/rag-knowledge/health` | Check S3 health |

> **👤 Admin Required**: All RAG knowledge endpoints require admin privileges

## Configuration

### Environment Variables

#### S3 Storage (New)
```bash
S3_ENABLED=true                    # Enable S3 storage
S3_REGION=us-east-1               # AWS region
S3_BUCKET_NAME=your-caa-bucket    # S3 bucket name
S3_ACCESS_KEY_ID=your-key         # AWS access key
S3_SECRET_ACCESS_KEY=your-secret  # AWS secret key
S3_ENDPOINT=                      # Custom endpoint (LocalStack/RustFS)
S3_KEY_PREFIX=caa                 # Key prefix for organization
S3_FORCE_PATH_STYLE=true          # Path-style URLs
```

#### Core Application
```bash
APP_PORT=6542                     # Server port
APP_HOST=localhost                # Server host
JWT_SECRET=your-secret            # JWT signing secret
```

#### Database
```bash
DB_DRIVER=sqlite                  # Database driver (sqlite/mysql)
DB_SQLITE_DIR=./data             # SQLite directory
DB_SQLITE_FILE=database.sqlite   # SQLite filename
```

#### AI Services
```bash
BACKEND_TYPE=ollama               # AI backend (ollama/openai)
LLM_HOST=http://localhost:11434   # LLM host
LLM_MODEL=your-model              # Model name
OPENAI_API_KEY=your-key          # OpenAI API key (if using OpenAI)
```

## Response Format

### Success Response
```json
{
  "data": { /* response data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient privileges
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Security

### Authentication Flow
1. **Register/Login**: Obtain JWT token via `/api/auth/login`
2. **Include Token**: Add `Authorization: Bearer <token>` to requests
3. **Role-Based Access**: Admin endpoints require admin role
4. **Token Refresh**: Use `/api/auth/refresh` to refresh expired tokens

### RBAC (Role-Based Access Control)
- **admin**: Full system access including knowledge management
- **editor**: Grid management and AI services
- **user**: Basic grid access and usage

### Security Best Practices
- Use HTTPS in production
- Rotate JWT secrets regularly
- Implement proper CORS policies
- Monitor API access logs
- Use strong S3 IAM permissions

## Development

### Local Development Setup

1. **Clone and Setup**:
   ```bash
   git clone <repository>
   cd web-app-caa
   cp .env.example .env
   ```

2. **Configure Environment**:
   Edit `.env` with your settings

3. **Run with Docker** (Recommended):
   ```bash
   docker-compose up -d
   ```

4. **Or Run Locally**:
   ```bash
   go run cmd/web-app-CAA/main.go
   ```

### S3 Development with LocalStack

```bash
# Start LocalStack
docker-compose -f docker-compose.s3-dev.yml up -d

# Configure for LocalStack
S3_ENABLED=true
S3_ENDPOINT=http://localhost:4566
S3_BUCKET_NAME=caa-bucket
S3_ACCESS_KEY_ID=test
S3_SECRET_ACCESS_KEY=test
```

### Testing

Use the provided test script for RAG knowledge management:
```bash
./test-s3-integration.sh
```

## Support and Resources

### Documentation Links
- [S3 Integration Guide](../s3-integration.md)
- [Architecture Overview](../architecture/overview.md)
- [Development Setup](../development/setup.md)
- [Deployment Guide](../deployment/docker.md)

### OpenAPI Discovery
- Standard OpenAPI auto-discovery at `/.well-known/openapi_description`
- Machine-readable API specification for tooling integration
- Full Swagger UI with interactive testing capabilities

### Changelog
- **v1.1.0**: Added S3-integrated RAG knowledge management
- **v1.0.0**: Initial API release with authentication, grids, and AI services

---

*For detailed endpoint documentation, see the individual API documentation files in this directory.*
