# Docker Deployment

This guide covers deploying Web App CAA using Docker and Docker Compose for both development and production environments.

## Quick Start with Docker Compose

The fastest way to get Web App CAA running is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/dnviti/web-app-CAA.git
cd web-app-CAA

# Start all services
docker-compose up --build

# Or using Make
make docker-up
```

Access the application at `http://localhost:3000`

## Docker Compose Configuration

### Development Setup

**`docker-compose.yml`**

```yaml
version: '3.8'

services:
  webapp:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - APP_PORT=3000
      - APP_HOST=0.0.0.0
      - JWT_SECRET=development-jwt-secret-key
      - DB_DRIVER=sqlite
      - DB_SQLITE_DIR=/app/data
      - DB_SQLITE_FILE=database.sqlite
      - BACKEND_TYPE=ollama
      - LLM_HOST=http://ollama:11434
      - LLM_MODEL=llama2
    volumes:
      - webapp_data:/app/data
      - ./rag_knowledge.json:/app/rag_knowledge.json
    depends_on:
      - ollama
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    environment:
      - OLLAMA_ORIGINS=*
    restart: unless-stopped

volumes:
  webapp_data:
    driver: local
  ollama_models:
    driver: local
```

### Production Setup

**`docker-compose.prod.yml`**

```yaml
version: '3.8'

services:
  webapp:
    image: ghcr.io/dnviti/web-app-caa:latest
    ports:
      - "80:3000"
    environment:
      - APP_PORT=3000
      - APP_HOST=0.0.0.0
      - JWT_SECRET=${JWT_SECRET}
      - DB_DRIVER=mysql
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - BACKEND_TYPE=openai
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LLM_MODEL=gpt-3.5-turbo
    volumes:
      - webapp_data:/app/data
      - ./rag_knowledge.json:/app/rag_knowledge.json
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${DB_NAME}
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - webapp
    restart: unless-stopped

volumes:
  webapp_data:
  mysql_data:
  ollama_models:
```

## Dockerfile

The application uses a multi-stage Docker build:

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download
RUN go mod verify

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o main ./cmd/web-app-caa

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    sqlite

# Create non-root user
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main .

# Copy required files
COPY --from=builder /app/web ./web
COPY --from=builder /app/internal/prompts ./internal/prompts
COPY --from=builder /app/rag_knowledge.json ./

# Create data directory
RUN mkdir -p data && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["./main"]
```

## Environment Configuration

### Development Environment

Create a `.env` file for development:

```env
# Server Configuration
APP_PORT=3000
APP_HOST=0.0.0.0
JWT_SECRET=development-jwt-secret-change-in-production

# Database (SQLite for development)
DB_DRIVER=sqlite
DB_SQLITE_DIR=/app/data
DB_SQLITE_FILE=database.sqlite

# AI Configuration (Ollama)
BACKEND_TYPE=ollama
LLM_HOST=http://ollama:11434
LLM_MODEL=llama2

# Optional: Enable debug mode
GIN_MODE=debug
```

### Production Environment

Create a `.env.prod` file for production:

```env
# Server Configuration
APP_PORT=3000
APP_HOST=0.0.0.0
JWT_SECRET=your-super-secure-production-jwt-secret

# Database (MySQL for production)
DB_DRIVER=mysql
DB_HOST=mysql
DB_PORT=3306
DB_USER=webapp_user
DB_PASSWORD=secure-database-password
DB_NAME=webapp_caa_prod
DB_MAX_OPEN_CONNS=50
DB_MAX_IDLE_CONNS=10

# AI Configuration (OpenAI)
BACKEND_TYPE=openai
OPENAI_API_KEY=sk-your-openai-api-key
LLM_MODEL=gpt-3.5-turbo

# MySQL Configuration
MYSQL_ROOT_PASSWORD=super-secure-root-password
```

## Deployment Commands

### Development Deployment

```bash
# Start development environment
docker-compose up --build

# Start in background
docker-compose up -d --build

# View logs
docker-compose logs -f webapp

# Stop services
docker-compose down

# Clean up (remove volumes)
docker-compose down -v
```

### Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or with environment file
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d

# Update to latest version
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f webapp
```

## Service Management

### Container Operations

```bash
# Check running containers
docker-compose ps

# Execute commands in container
docker-compose exec webapp /bin/sh

# View container logs
docker-compose logs webapp
docker-compose logs ollama

# Restart specific service
docker-compose restart webapp

# Scale services (if needed)
docker-compose up -d --scale webapp=2
```

### Database Operations

#### SQLite (Development)

```bash
# Access SQLite database
docker-compose exec webapp sqlite3 /app/data/database.sqlite

# Backup database
docker-compose exec webapp cp /app/data/database.sqlite /app/data/backup.sqlite

# Copy database from container
docker cp $(docker-compose ps -q webapp):/app/data/database.sqlite ./database.sqlite
```

#### MySQL (Production)

```bash
# Access MySQL database
docker-compose exec mysql mysql -u webapp_user -p webapp_caa_prod

# Create database backup
docker-compose exec mysql mysqldump -u webapp_user -p webapp_caa_prod > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u webapp_user -p webapp_caa_prod < backup.sql
```

## Health Monitoring

### Health Check Endpoints

The application includes health check endpoints:

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health status
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "ai_service": "available"
}
```

### Container Health Checks

Monitor container health:

```bash
# Check container health
docker-compose ps

# View health check logs
docker inspect $(docker-compose ps -q webapp) | grep Health -A 10
```

## Volume Management

### Data Persistence

```bash
# List Docker volumes
docker volume ls

# Inspect volume
docker volume inspect web-app-caa_webapp_data

# Backup volume
docker run --rm -v web-app-caa_webapp_data:/data -v $(pwd):/backup alpine tar czf /backup/webapp_data.tar.gz -C /data .

# Restore volume
docker run --rm -v web-app-caa_webapp_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/webapp_data.tar.gz"
```

### Cleanup

```bash
# Remove unused containers and images
docker system prune

# Remove specific volumes
docker volume rm web-app-caa_webapp_data

# Complete cleanup
docker-compose down -v --remove-orphans
docker system prune -a
```

## Performance Optimization

### Resource Limits

**`docker-compose.override.yml`** for resource constraints:

```yaml
version: '3.8'

services:
  webapp:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  mysql:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'

  ollama:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
```

### Docker Build Optimization

```dockerfile
# Use build cache
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

# Multi-stage optimization
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build ...
```

## Security Considerations

### Container Security

```dockerfile
# Run as non-root user
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser
USER appuser

# Read-only root filesystem
docker run --read-only --tmpfs /tmp web-app-caa

# Drop capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE web-app-caa
```

### Network Security

```yaml
# Custom network
networks:
  webapp_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  webapp:
    networks:
      - webapp_network
```

### Secrets Management

```yaml
# Using Docker secrets
secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  db_password:
    file: ./secrets/db_password.txt

services:
  webapp:
    secrets:
      - jwt_secret
      - db_password
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
      - DB_PASSWORD_FILE=/run/secrets/db_password
```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs webapp

# Check container status
docker-compose ps

# Inspect container
docker inspect $(docker-compose ps -q webapp)
```

**Database connection issues:**
```bash
# Test database connection
docker-compose exec webapp ping mysql

# Check database logs
docker-compose logs mysql

# Verify database is ready
docker-compose exec mysql mysqladmin ping
```

**Port conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :3000

# Use different ports
docker-compose up --build -p 8080:3000
```

**Volume permission issues:**
```bash
# Fix permissions
docker-compose exec webapp chown -R appuser:appgroup /app/data
```

### Debug Mode

Enable debug logging:

```yaml
services:
  webapp:
    environment:
      - GIN_MODE=debug
      - LOG_LEVEL=debug
```

---

**Next:** [Production Deployment →](production.md)
