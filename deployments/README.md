# Deployment Guide

# Docker Deployments

This directory contains Docker Compose configurations for deploying the web-app-CAA with different optional dependencies.

## Overview

The deployment system uses Docker Compose **profiles** to manage optional dependencies dynamically, eliminating the need to manually comment/uncomment services in docker-compose.yaml.

## Quick Start

Use the provided deployment script for easy management:

```bash
# Start with basic configuration (web app only)
./deploy.sh up

# Start with MySQL database
./deploy.sh up mysql

# Start with Ollama AI service
./deploy.sh up ollama

# Start with RustFS storage
./deploy.sh up rustfs

# Start with all services (full development environment)
./deploy.sh up full

# Stop all services
./deploy.sh down

# Check service status
./deploy.sh status
```

## Available Profiles

### 1. Basic (default)
- **Services**: Web application only
- **Database**: SQLite (file-based)
- **AI Backend**: External (OpenAI-compatible API)
- **Storage**: Local filesystem
- **Command**: `./deploy.sh up` or `./deploy.sh up basic`

### 2. MySQL
- **Services**: Web application + MySQL database
- **Database**: MySQL 8.0 in Docker container
- **AI Backend**: External (OpenAI-compatible API)
- **Storage**: Local filesystem
- **Command**: `./deploy.sh up mysql`

### 3. Ollama
- **Services**: Web application + Ollama AI
- **Database**: SQLite (file-based)
- **AI Backend**: Ollama running locally in Docker
- **Storage**: Local filesystem
- **Command**: `./deploy.sh up ollama`

### 4. RustFS
- **Services**: Web application + RustFS storage
- **Database**: SQLite (file-based)
- **AI Backend**: External (OpenAI-compatible API)
- **Storage**: RustFS (S3-compatible object storage)
- **Command**: `./deploy.sh up rustfs`

### 5. Full Development
- **Services**: All services (Web app + MySQL + Ollama + RustFS)
- **Database**: MySQL 8.0 in Docker container
- **AI Backend**: Ollama running locally in Docker
- **Storage**: RustFS (S3-compatible object storage)
- **Command**: `./deploy.sh up full`

### 6. Production
- **Services**: Web application with production optimizations
- **Database**: SQLite (file-based)
- **AI Backend**: External (OpenAI-compatible API)
- **Storage**: Local filesystem or external S3
- **Features**: Resource limits, structured logging, release mode
- **Command**: `./deploy.sh up production`

## File Structure

```
deployments/
├── docker-compose.yaml           # Main configuration with all services
├── docker-compose.override.yml   # Development overrides
├── docker-compose.mysql.yaml     # MySQL-specific configuration
├── docker-compose.ollama.yaml    # Ollama-specific configuration
├── docker-compose.rustfs.yaml    # RustFS-specific configuration
├── docker-compose.full.yaml      # Full stack configuration
├── docker-compose.production.yaml # Production configuration
├── deploy.sh                     # Deployment management script
├── .env.rustfs                   # RustFS-specific environment variables
├── Dockerfile                    # Application container build
└── README.md                     # This file
```

## Environment Configuration

### Required Files
- `../.env` - Main application environment variables (copy from `../.env.example`)
- `.env.rustfs` - RustFS configuration (only needed when using RustFS profile)

### Key Environment Variables

#### Database Configuration
```bash
# SQLite (default)
DB_DRIVER=sqlite
DB_SQLITE_DIR=./data
DB_SQLITE_FILE=database.sqlite

# MySQL
DB_DRIVER=mysql
DB_HOST=mysql
DB_PORT=3306
DB_NAME=caa_database
DB_USER=caa
DB_PASSWORD=your_password
```

#### AI Backend Configuration
```bash
# OpenAI-compatible (default)
BACKEND_TYPE=openai
LLM_HOST=https://your-api-host/api
OPENAI_API_KEY=your-api-key
LLM_MODEL=gpt-3.5-turbo

# Ollama
BACKEND_TYPE=ollama
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.1:8b
```

#### Storage Configuration
```bash
# Local filesystem (default)
S3_ENABLED=false

# S3-compatible storage (RustFS or AWS S3)
S3_ENABLED=true
S3_ENDPOINT=http://rustfs:9000
S3_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

## Manual Docker Compose Usage

If you prefer using docker-compose directly instead of the script:

### Using Profiles
```bash
# Start specific services using profiles
docker-compose --profile mysql up -d
docker-compose --profile ollama up -d
docker-compose --profile rustfs up -d

# Combine multiple profiles
docker-compose --profile mysql --profile ollama up -d
```

### Using Multiple Compose Files
```bash
# MySQL setup
docker-compose -f docker-compose.yaml -f docker-compose.mysql.yaml up -d

# Full development environment
docker-compose -f docker-compose.yaml -f docker-compose.full.yaml up -d

# Production deployment
docker-compose -f docker-compose.yaml -f docker-compose.production.yaml up -d
```

## Service Details

### Web Application
- **Port**: 6542
- **Health**: Available at http://localhost:6542
- **Logs**: `./deploy.sh logs web-app`

### MySQL Database (Profile: mysql)
- **Port**: 3306
- **Default Database**: caa_database
- **Default User**: caa
- **Health Check**: Built-in mysqladmin ping
- **Data Persistence**: `mysql_data` volume

### Ollama AI Service (Profile: ollama)
- **Port**: 11434
- **API**: http://localhost:11434/api
- **GPU Support**: Enabled (requires NVIDIA Docker runtime)
- **Models Storage**: `ollama_data` volume
- **Health Check**: API endpoint monitoring

### RustFS Storage (Profile: rustfs)
- **API Port**: 9000
- **Console Port**: 9001
- **S3 API**: http://localhost:9000
- **Console**: http://localhost:9001
- **Data Persistence**: `rustfs_data` volume
- **Health Check**: API endpoint monitoring

## Port Configuration

Default ports can be customized using environment variables:

```bash
# Application
APP_PORT=6542

# MySQL
MYSQL_PORT=3306

# Ollama
OLLAMA_PORT=11434

# RustFS
RUSTFS_API_PORT=9000
RUSTFS_CONSOLE_PORT=9001
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Modify port environment variables if default ports are in use
2. **Missing .env file**: Copy from `.env.example` and configure
3. **GPU not available for Ollama**: Remove GPU configuration or install NVIDIA Docker runtime
4. **MySQL connection issues**: Ensure database is healthy before application starts

### Debugging Commands

```bash
# Check service status
./deploy.sh status

# View logs for specific service
./deploy.sh logs web-app
./deploy.sh logs mysql
./deploy.sh logs ollama
./deploy.sh logs rustfs

# View all logs
./deploy.sh logs

# Clean up everything (containers, volumes, networks)
./deploy.sh clean
```

### Health Checks

All services include health checks:
- **MySQL**: Uses `mysqladmin ping`
- **Ollama**: Checks `/api/health` endpoint
- **RustFS**: Checks `/health` endpoint

Services will show as "healthy" once ready to accept connections.

## Migration Guide

### From Previous Setup
If you were using the old system with commented services:

1. **Backup your data**: Ensure your `./data` directory is backed up
2. **Update environment**: Copy new variables from `.env.example`
3. **Choose profile**: Use the deployment script with appropriate profile
4. **Test**: Verify all services work correctly

### Environment Variable Changes
- `DB_TYPE` is now `DB_DRIVER`
- Added `S3_ENABLED` flag for cleaner S3 configuration
- Service hostnames updated to use Docker service names

## Production Deployment

For production environments:

1. Use the `production` profile: `./deploy.sh up production`
2. Configure external services (database, AI backend, S3)
3. Set up reverse proxy (nginx, traefik, etc.)
4. Configure SSL/TLS certificates
5. Set up monitoring and logging
6. Configure backup strategies

## Development Workflow

For development with hot reload:

1. Start with desired profile: `./deploy.sh up [profile]`
2. Development overrides are automatically applied via `docker-compose.override.yml`
3. Code changes will trigger rebuilds when volume-mounted
4. Use `./deploy.sh restart` to restart services after configuration changes

## Files

- `docker-compose.yaml` - Main Docker Compose configuration
- `docker-compose.override.yml` - Local development overrides
- `Dockerfile` - Application container build instructions
- `.env.rustfs` - RustFS-specific environment configuration

## Services

### Main Application (`web-app`)
The primary Go application with JWT authentication, RBAC, and AI integration.

### RustFS (`rustfs`) - Optional
S3-compatible object storage service written in Rust for RAG knowledge management.

**Ports:**
- `9000` - API endpoint
- `9001` - Web console

**Configuration:**
- Uses `.env.rustfs` for credentials
- Default credentials: `admin` / `admin`
- Data stored in `rustfs_data` volume

## Quick Start

### Development with Local Storage
```bash
# Start only the main application
docker-compose up web-app
```

### Development with RustFS Storage
```bash
# Start application with RustFS
docker-compose up -d

# Or start RustFS separately
docker-compose up -d rustfs
docker-compose up web-app
```

## Configuration

### Application Environment
Configure the main application through environment variables or `.env` file in the project root.

### RustFS Configuration
Edit `.env.rustfs` for RustFS-specific settings:
```bash
RUSTFS_ACCESS_KEY=admin
RUSTFS_SECRET_KEY=admin
```

For detailed RustFS configuration options, see the [RustFS Docker documentation](https://docs.rustfs.com/installation/docker.html).

### S3 Integration
To use RustFS as S3 storage, configure these environment variables:
```bash
S3_ENABLED=true
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=admin
S3_BUCKET_NAME=caa-knowledge
S3_FORCE_PATH_STYLE=true
```

## Production Deployment

For production:
1. Use strong credentials in `.env.rustfs`
2. Configure proper TLS certificates
3. Use proper network security
4. Set up backup strategies
5. Monitor service health

See `../docs/deployment/rustfs.md` for detailed production setup instructions.

## Volumes

- `rustfs_data` - Persistent storage for RustFS data
- `./data` - Application data (SQLite database)

## Health Checks

Both services include health checks:
- Application: Available at startup logs
- RustFS: HTTP health endpoint

## Troubleshooting

Common issues:
1. **Port conflicts** - Ensure ports 6542, 9000, 9001 are available
2. **Permission issues** - Check file permissions on volumes
3. **Network issues** - Verify Docker network configuration

For detailed troubleshooting, see the main documentation.
