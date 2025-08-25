# Docker Deployment Guide

This project includes complete Docker support for easy deployment and development.

## Quick Start

1. **Copy the environment file and configure it:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Web app: http://localhost:3000

## Files Overview

- `Dockerfile` - Multi-stage Docker build configuration
- `docker-compose.yaml` - Production deployment configuration
- `docker-compose.override.yml` - Development overrides
- `.dockerignore` - Files excluded from Docker build context
- `.env.example` - Environment variables template

## Configuration Options

### Database Options

#### SQLite (Default - Recommended for single instance)
```bash
DB_DRIVER=sqlite
DB_SQLITE_DIR=./data
DB_SQLITE_FILE=database.sqlite
```

#### MySQL (For production with multiple instances)
```bash
DB_DRIVER=mysql
DB_HOST=mysql  # or external MySQL host
DB_PORT=3306
DB_NAME=caa_database
DB_USER=caa
DB_PASSWORD=your_secure_password
```

### AI Backend Options

#### OpenAI Compatible API
```bash
BACKEND_TYPE=openai
LLM_HOST=https://api.openai.com/v1
OPENAI_API_KEY=your-api-key
LLM_MODEL=gpt-3.5-turbo
```

#### Ollama
```bash
BACKEND_TYPE=ollama
LLM_HOST=http://ollama:11434
LLM_MODEL=llama2
```

## Deployment Scenarios

### 1. Simple Deployment (SQLite + External AI Service)
This is the default configuration, just run:
```bash
docker-compose up -d
```

### 2. Full Stack with MySQL
Uncomment the MySQL service in `docker-compose.yaml`:
```bash
# Edit docker-compose.yaml to uncomment mysql service
# Configure .env for MySQL
docker-compose up -d
```

### 3. Full Stack with Ollama
Uncomment the Ollama service in `docker-compose.yaml`:
```bash
# Edit docker-compose.yaml to uncomment ollama service
# Configure .env for Ollama
docker-compose up -d
```

## Development

### Hot Reload Development
```bash
# This will use docker-compose.override.yml automatically
docker-compose up
```

### Build Only
```bash
docker build -t web-app-caa .
```

### Run Without Compose
```bash
docker run -p 3000:3000 --env-file .env web-app-caa
```

## Docker Commands

### View logs
```bash
docker-compose logs -f web-app
```

### Stop services
```bash
docker-compose down
```

### Rebuild after changes
```bash
docker-compose up --build -d
```

### Clean up
```bash
docker-compose down -v  # Removes volumes
docker system prune     # Clean up unused images
```

## Production Considerations

1. **Secrets Management**: Use Docker secrets or external secret management instead of .env files
2. **Reverse Proxy**: Consider using nginx or traefik in front of the application
3. **Health Checks**: The application exposes `/ping` endpoint for health checks
4. **Volume Mounts**: For SQLite, ensure data persistence with volume mounts
5. **Resource Limits**: Add resource limits in production docker-compose files

## Troubleshooting

### Database Issues
- For SQLite: Ensure the `./data` directory exists and has proper permissions
- For MySQL: Check connection settings and ensure MySQL service is running

### Build Issues
- Clear Docker cache: `docker system prune -a`
- Check Go version compatibility in Dockerfile
- Ensure all required files are not excluded in .dockerignore

### Runtime Issues
- Check logs: `docker-compose logs web-app`
- Verify environment variables: `docker-compose exec web-app printenv`
- Test connectivity: `docker-compose exec web-app wget -qO- http://localhost:3000/ping`
