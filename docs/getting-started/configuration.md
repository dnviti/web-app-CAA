# Configuration Guide

This guide covers all configuration options available in Web App CAA, from basic setup to advanced production configurations.

## Configuration Methods

Web App CAA supports multiple configuration methods, listed in order of precedence:

1. **Environment Variables** (highest priority)
2. **`.env` File** (project root)
3. **Default Values** (built-in defaults)

## Environment Variables

### Server Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `APP_PORT` | Server port | `6542` | `8080` |
| `APP_HOST` | Server host | `localhost` | `0.0.0.0` |
| `JWT_SECRET` | JWT signing secret | `your-default-secret-key` | `my-super-secret-jwt-key` |

!!! warning "Security Notice"
    Always set a unique `JWT_SECRET` in production environments!

### Database Configuration

#### Common Settings

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `DB_DRIVER` | Database type | `sqlite` | `sqlite`, `mysql` |

#### SQLite Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DB_SQLITE_DIR` | Database directory | `./data` | `/var/lib/webapp` |
| `DB_SQLITE_FILE` | Database filename | `database.sqlite` | `webapp.db` |

#### MySQL Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DB_HOST` | MySQL host | `localhost` | `mysql.example.com` |
| `DB_PORT` | MySQL port | `3306` | `3306` |
| `DB_USER` | MySQL username | `root` | `webapp_user` |
| `DB_PASSWORD` | MySQL password | *(empty)* | `secure_password` |
| `DB_NAME` | Database name | `webapp_caa` | `production_db` |
| `DB_CHARSET` | Character set | `utf8mb4` | `utf8mb4` |
| `DB_PARSE_TIME` | Parse time values | `true` | `true`, `false` |
| `DB_LOC` | Timezone location | `Local` | `UTC`, `Europe/Rome` |

#### Connection Pool Settings

| Variable | Description | Default | Recommended |
|----------|-------------|---------|-------------|
| `DB_MAX_OPEN_CONNS` | Maximum open connections | `25` | `25-100` |
| `DB_MAX_IDLE_CONNS` | Maximum idle connections | `5` | `5-10` |
| `DB_CONN_MAX_LIFETIME` | Connection lifetime | *(none)* | `5m` |

### AI Service Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `BACKEND_TYPE` | AI backend type | *(none)* | `ollama`, `openai` |
| `LLM_HOST` | LLM API host URL | *(none)* | `http://localhost:11434` |
| `LLM_MODEL` | Model to use | *(none)* | `llama2`, `gpt-3.5-turbo` |
| `OPENAI_API_KEY` | OpenAI API key | *(none)* | `sk-...` |

## Configuration Examples

### Development Setup

Create a `.env` file in the project root:

```env
# Development Configuration
APP_PORT=3000
APP_HOST=localhost
JWT_SECRET=development-secret-key

# SQLite for development
DB_DRIVER=sqlite
DB_SQLITE_DIR=./data
DB_SQLITE_FILE=database.sqlite

# Local Ollama setup
BACKEND_TYPE=ollama
LLM_HOST=http://localhost:11434
LLM_MODEL=llama2
```

### Production Setup

```env
# Production Configuration
APP_PORT=8080
APP_HOST=0.0.0.0
JWT_SECRET=your-super-secure-production-jwt-secret

# MySQL for production
DB_DRIVER=mysql
DB_HOST=mysql-server.internal
DB_PORT=3306
DB_USER=webapp_prod
DB_PASSWORD=ultra-secure-database-password
DB_NAME=webapp_caa_prod
DB_MAX_OPEN_CONNS=50
DB_MAX_IDLE_CONNS=10
DB_CONN_MAX_LIFETIME=5m

# OpenAI for AI services
BACKEND_TYPE=openai
LLM_HOST=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-openai-api-key-here
LLM_MODEL=gpt-3.5-turbo
```

### Docker Configuration

#### Environment File

```env
# Docker environment
APP_PORT=3000
APP_HOST=0.0.0.0
JWT_SECRET=docker-secret-key

# SQLite with volume mount
DB_DRIVER=sqlite
DB_SQLITE_DIR=/app/data
DB_SQLITE_FILE=database.sqlite

# External Ollama service
BACKEND_TYPE=ollama
LLM_HOST=http://ollama:11434
LLM_MODEL=llama2
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
      - JWT_SECRET=${JWT_SECRET}
      - DB_DRIVER=sqlite
      - DB_SQLITE_DIR=/app/data
      - BACKEND_TYPE=ollama
      - LLM_HOST=http://ollama:11434
      - LLM_MODEL=llama2
    volumes:
      - webapp_data:/app/data
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

volumes:
  webapp_data:
  ollama_models:
```

## AI Service Configurations

### Ollama Setup

#### 1. Install and Configure Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# Download a model
ollama pull llama2
```

#### 2. Application Configuration

```env
BACKEND_TYPE=ollama
LLM_HOST=http://localhost:11434
LLM_MODEL=llama2
```

#### 3. Available Models

| Model | Size | Use Case |
|-------|------|----------|
| `llama2` | 7B | General purpose, fast |
| `llama2:13b` | 13B | Better quality, slower |
| `codellama` | 7B | Code-focused |
| `mistral` | 7B | Multilingual, efficient |

### OpenAI-Compatible APIs

#### OpenAI

```env
BACKEND_TYPE=openai
LLM_HOST=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-api-key
LLM_MODEL=gpt-3.5-turbo
```

#### Azure OpenAI

```env
BACKEND_TYPE=openai
LLM_HOST=https://your-resource.openai.azure.com
OPENAI_API_KEY=your-azure-api-key
LLM_MODEL=gpt-35-turbo
```

#### Local OpenAI-Compatible

```env
BACKEND_TYPE=openai
LLM_HOST=http://localhost:8080/v1
OPENAI_API_KEY=not-needed
LLM_MODEL=local-model
```

## Database Configuration Details

### SQLite Configuration

#### File Location

```env
# Relative path (development)
DB_SQLITE_DIR=./data
DB_SQLITE_FILE=database.sqlite

# Absolute path (production)
DB_SQLITE_DIR=/var/lib/webapp-caa
DB_SQLITE_FILE=webapp.db
```

#### Performance Tuning

SQLite performs well for most use cases but consider these optimizations:

- Use SSD storage for better I/O performance
- Regular `VACUUM` operations to reclaim space
- WAL mode is enabled by default for better concurrency

### MySQL Configuration

#### Connection String Format

The application builds connection strings like:
```
username:password@tcp(host:port)/database?charset=utf8mb4&parseTime=True&loc=Local
```

#### Production Recommendations

```env
# Connection pool sizing
DB_MAX_OPEN_CONNS=50
DB_MAX_IDLE_CONNS=10
DB_CONN_MAX_LIFETIME=5m

# Character set and timezone
DB_CHARSET=utf8mb4
DB_PARSE_TIME=true
DB_LOC=UTC
```

#### SSL Configuration

For secure MySQL connections:

```env
# Enable SSL (connection string parameter)
# This requires additional MySQL configuration
DB_NAME=webapp_caa?tls=true
```

## Security Considerations

### JWT Secret

!!! danger "Critical Security"
    The `JWT_SECRET` is used to sign authentication tokens. If compromised, attackers can forge valid tokens.

#### Requirements
- Minimum 32 characters
- Use random, cryptographically secure strings
- Different for each environment
- Never commit to version control

#### Generation

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Or using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Database Security

#### SQLite
- Ensure proper file permissions (600)
- Store database files outside web root
- Regular backups with encryption

#### MySQL
- Use dedicated database user with minimal privileges
- Enable SSL/TLS for connections
- Regular security updates
- Network-level protection (VPN, private networks)

### Environment Variables

#### Best Practices
- Use `.env` files for local development only
- Use orchestration secrets in production (Docker secrets, Kubernetes secrets)
- Never commit sensitive values to git
- Use environment-specific values

#### Example `.gitignore`
```gitignore
.env
.env.local
.env.production
*.sqlite
*.sqlite-*
```

## Configuration Validation

### Startup Checks

The application performs these validation checks on startup:

1. **Required Environment Variables**: Warns about missing critical settings
2. **Database Connection**: Tests database connectivity
3. **AI Service Connection**: Verifies LLM backend availability (if configured)
4. **File Permissions**: Checks read/write access to required directories

### Health Check Endpoint

```bash
# Check application health
curl http://localhost:3000/health

# Response includes configuration status
{
  "status": "healthy",
  "database": "connected",
  "ai_service": "available"
}
```

## Configuration Troubleshooting

### Common Issues

#### Environment Variables Not Loading

```bash
# Check if .env file exists and is readable
ls -la .env
cat .env

# Verify environment variables are set
env | grep APP_
```

#### Database Connection Failures

```bash
# Test SQLite
ls -la data/
sqlite3 data/database.sqlite ".tables"

# Test MySQL
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES;"
```

#### AI Service Unavailable

```bash
# Test Ollama
curl http://localhost:11434/api/version

# Test OpenAI-compatible API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  $LLM_HOST/models
```

### Debug Mode

Enable debug logging for troubleshooting:

```env
GIN_MODE=debug
LOG_LEVEL=debug
```

---

**Next:** [Architecture Overview →](../architecture/overview.md)
