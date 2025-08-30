# RustFS Integration Guide

This guide explains how to use RustFS as an S3-compatible storage backend for RAG knowledge management.

## Overview

RustFS is a high-performance# Test File Operations

```bash
# Get current RAG knowledge
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" 
     http://localhost:6542/api/rag-knowledge

# Update RAG knowledge
curl -X PUT 
     -H "Authorization: Bearer YOUR_JWT_TOKEN" 
     -H "Content-Type: application/json" 
     -d '{"key": "value"}' 
     http://localhost:6542/api/rag-knowledge
```

### 3. Monitor RustFS Console

Check the RustFS console at http://localhost:9001 to see:
- Bucket contents under `caa-knowledge`
- Files with your configured prefix (default: `rag/`)
- Access logs and metricstible object storage system written in Rust that can be used as a drop-in replacement for AWS S3. Our application supports RustFS through the same S3 integration with specific configuration options.

## Quick Start with Docker Compose

### 1. Start RustFS Service

The RustFS service is already included in the docker-compose.yaml file:

```bash
# Start RustFS along with the application
cd deployments
docker-compose up -d rustfs

# Or start everything including RustFS
docker-compose up -d
```

### 2. Access RustFS Console

- **API Endpoint**: http://localhost:9000
- **Web Console**: http://localhost:9001
- **Default Credentials**: 
  - Username: `admin`
  - Password: `admin`

### 3. Configure Application for RustFS

Update your `.env` file:

```bash
# Enable S3 storage
S3_ENABLED=true

# RustFS Configuration
S3_REGION=us-east-1
S3_BUCKET_NAME=caa-knowledge
S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=admin
S3_ENDPOINT=http://localhost:9000
S3_KEY_PREFIX=rag
S3_FORCE_PATH_STYLE=true
```

### 4. RustFS Environment Configuration

The RustFS service uses an `.env.rustfs` file for its configuration:

```bash
# .env.rustfs
RUSTFS_ACCESS_KEY=admin
RUSTFS_SECRET_KEY=admin
```

For additional configuration options, please refer to the [RustFS Docker installation documentation](https://docs.rustfs.com/installation/docker.html).

## Production RustFS Setup

### 1. RustFS Server Configuration

For production, run RustFS with proper security:

```yaml
# docker-compose.prod.yml
services:
  rustfs:
    image: rustfs/rustfs:latest
    container_name: rustfs-prod
    ports:
      - "9000:9000"
      - "9001:9001"
    env_file: .env.rustfs
    volumes:
      - rustfs_data:/data
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/health"]
      interval: 30s
      timeout: 20s
      retries: 3
```

### 2. Environment Variables

```bash
# .env.rustfs - Strong credentials for production
RUSTFS_ACCESS_KEY=your-admin-user
RUSTFS_SECRET_KEY=your-strong-secret-key

# Application S3 config
S3_ENABLED=true
S3_REGION=us-east-1
S3_BUCKET_NAME=your-company-caa-knowledge
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://your-rustfs-domain.com
S3_KEY_PREFIX=prod
S3_FORCE_PATH_STYLE=true
```

### 3. Additional Configuration

For detailed configuration options including:
- Authentication methods
- Storage backends
- Performance tuning
- Security settings
- SSL/TLS configuration

Please refer to the [RustFS Docker installation documentation](https://docs.rustfs.com/installation/docker.html).

## Configuration Options

### Required Settings for RustFS

```bash
# Must be true to enable S3 storage
S3_ENABLED=true

# RustFS endpoint (without /api suffix)
S3_ENDPOINT=http://localhost:9000

# Must be true for RustFS
S3_FORCE_PATH_STYLE=true

# Your RustFS credentials
S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=admin

# Bucket and organization
S3_BUCKET_NAME=caa-knowledge
S3_KEY_PREFIX=rag
S3_REGION=us-east-1
```

### RustFS-Specific Notes

1. **Path Style URLs**: RustFS requires `S3_FORCE_PATH_STYLE=true`
2. **Region**: Can be any valid AWS region format, doesn't need to match actual location
3. **Endpoint**: Should point to RustFS API port (default 9000), not console port (9001)
4. **TLS**: For HTTPS endpoints, ensure proper TLS certificates
5. **Configuration**: For advanced configuration, see [RustFS documentation](https://docs.rustfs.com/installation/docker.html)

## Verification

### 1. Check S3 Health Endpoint

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:6542/api/rag-knowledge/health
```

Expected response:
```json
{
  "status": "healthy",
  "storage_type": "s3",
  "bucket": "caa-knowledge",
  "region": "us-east-1",
  "endpoint": "http://localhost:9000",
  "connection": "ok"
}
```

### 2. Test File Operations

```bash
# Get current RAG knowledge
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:6542/api/rag-knowledge

# Update RAG knowledge
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"key": "value"}' \
     http://localhost:6542/api/rag-knowledge
```

### 3. Monitor RustFS Console

Check the RustFS console at http://localhost:9001 to see:
- Bucket contents under `caa-knowledge`
- Files with your configured prefix (default: `rag/`)
- Access logs and metrics

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure RustFS is running on the correct port
   - Check if `S3_ENDPOINT` matches your RustFS setup
   - Verify network connectivity

2. **Access Denied**
   - Check access key and secret key
   - Ensure the bucket exists
   - Verify bucket permissions

3. **Bucket Not Found**
   - Create the bucket in RustFS console
   - Check bucket name in configuration

4. **Path Style Issues**
   - Ensure `S3_FORCE_PATH_STYLE=true` is set
   - RustFS requires path-style URLs

### Debug Mode

Enable debug logging in your application:

```bash
# Add to your environment
DEBUG_S3=true
LOG_LEVEL=debug
```

This will show detailed S3 operations in the application logs.

## Security Considerations

### Production Security

1. **Strong Credentials**: Use strong, unique passwords
2. **Network Security**: Use HTTPS endpoints
3. **Access Keys**: Create specific access keys with minimal required permissions
4. **Network Isolation**: Run RustFS in a private network when possible
5. **Configuration Security**: Secure the `.env.rustfs` file with proper permissions

### Backup Strategy

1. **Automatic Backups**: Use the built-in backup endpoints
2. **RustFS Replication**: Configure RustFS server-side replication (see [RustFS documentation](https://docs.rustfs.com/installation/docker.html))
3. **External Backups**: Regular snapshots of RustFS data directory

## Performance Optimization

### RustFS Configuration

For performance tuning options, please refer to the [RustFS Docker documentation](https://docs.rustfs.com/installation/docker.html) which covers:
- Memory management
- Concurrent request handling
- Storage optimization
- Caching strategies

### Application Configuration

```bash
# Optimize for your use case
S3_KEY_PREFIX=environments/production/rag
```

This setup provides a robust, S3-compatible storage solution using RustFS that can scale from development to enterprise production environments. For detailed configuration options and advanced features, please consult the [RustFS Docker installation documentation](https://docs.rustfs.com/installation/docker.html).
