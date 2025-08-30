# S3 Storage Integration for RAG Knowledge

This document describes how to configure and use S3 storage for managing the RAG (Retrieval-Augmented Generation) knowledge base in the Web App CAA project.

## Overview

The S3 storage integration allows you to:
- Store and manage `rag_knowledge.json` in AWS S3 or S3-compatible services
- Create timestamped backups of the knowledge base
- Restore from previous backups
- Manage multiple environments (dev/staging/prod) with separate S3 prefixes
- Use local S3-compatible services like LocalStack or RustFS for development

## Configuration

### Environment Variables

Add these environment variables to your `.env` file:

```bash
# Enable S3 storage
S3_ENABLED=true

# AWS S3 Configuration
S3_REGION=us-east-1
S3_BUCKET_NAME=your-caa-bucket
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key

# Optional: Custom endpoint (for LocalStack, RustFS, etc.)
S3_ENDPOINT=

# Optional: Key prefix for organization
S3_KEY_PREFIX=caa

# Optional: Force path style (needed for some S3-compatible services)
S3_FORCE_PATH_STYLE=false
```

### S3 Bucket Structure

When configured, the S3 bucket will have the following structure:

```
your-bucket/
├── caa/                          # Key prefix (configurable)
│   ├── rag_knowledge.json        # Main knowledge file
│   └── backups/                  # Backup directory
│       ├── rag_knowledge_20240829_143052.json
│       ├── rag_knowledge_20240829_150130.json
│       └── ...
```

## Setup Instructions

### AWS S3 Setup

1. **Create an S3 bucket:**
   ```bash
   aws s3 mb s3://your-caa-bucket
   ```

2. **Create IAM policy for S3 access:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket",
           "s3:HeadBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-caa-bucket",
           "arn:aws:s3:::your-caa-bucket/*"
         ]
       }
     ]
   }
   ```

3. **Create IAM user and attach policy:**
   ```bash
   aws iam create-user --user-name caa-s3-user
   aws iam attach-user-policy --user-name caa-s3-user --policy-arn arn:aws:iam::YOUR_ACCOUNT:policy/CAA-S3-Policy
   aws iam create-access-key --user-name caa-s3-user
   ```

### LocalStack Setup (Development)

For local development, you can use LocalStack to simulate S3:

1. **Install LocalStack:**
   ```bash
   pip install localstack
   ```

2. **Start LocalStack:**
   ```bash
   localstack start
   ```

3. **Create bucket:**
   ```bash
   aws --endpoint-url=http://localhost:4566 s3 mb s3://caa-bucket
   ```

4. **Configure environment:**
   ```bash
   S3_ENABLED=true
   S3_REGION=us-east-1
   S3_BUCKET_NAME=caa-bucket
   S3_ACCESS_KEY_ID=test
   S3_SECRET_ACCESS_KEY=test
   S3_ENDPOINT=http://localhost:4566
   S3_KEY_PREFIX=dev
   S3_FORCE_PATH_STYLE=true
   ```

### RustFS Setup (Alternative)

RustFS is another S3-compatible storage solution that's already included in the Docker Compose setup:

1. **Start RustFS with Docker Compose:**
   ```bash
   cd deployments
   ./deploy.sh up rustfs
   ```

2. **Configure environment:**
   ```bash
   S3_ENABLED=true
   S3_REGION=us-east-1
   S3_BUCKET_NAME=caa-bucket
   S3_ACCESS_KEY_ID=admin
   S3_SECRET_ACCESS_KEY=admin
   S3_ENDPOINT=http://localhost:9000
   S3_KEY_PREFIX=dev
   S3_FORCE_PATH_STYLE=true
   ```

3. **Access RustFS Console:**
   - API: http://localhost:9000
   - Console: http://localhost:9001

## API Endpoints

The following API endpoints are available for managing RAG knowledge (admin access required):

### Get RAG Knowledge
```http
GET /api/rag-knowledge
Authorization: Bearer <token>
```

### Update RAG Knowledge
```http
PUT /api/rag-knowledge?save_to_s3=true
Authorization: Bearer <token>
Content-Type: application/json

{
  "presente_indicativo": {
    "description": "...",
    "general_rules": { ... }
  }
}
```

### Reload RAG Knowledge
```http
POST /api/rag-knowledge/reload
Authorization: Bearer <token>
```

### Create Backup
```http
POST /api/rag-knowledge/backup
Authorization: Bearer <token>
```

### List Backups
```http
GET /api/rag-knowledge/backups
Authorization: Bearer <token>
```

### Restore from Backup
```http
POST /api/rag-knowledge/restore/{backup_key}
Authorization: Bearer <token>
```

### Check S3 Health
```http
GET /api/rag-knowledge/health
Authorization: Bearer <token>
```

## Behavior

### Fallback Strategy

The system implements a fallback strategy:

1. **When S3 is enabled:** The application tries to load RAG knowledge from S3
2. **When S3 fails or is disabled:** The application falls back to loading from the local `rag_knowledge.json` file
3. **Updates:** When updating knowledge, you can choose whether to save to S3 using the `save_to_s3` query parameter

### Automatic Backup

- Backups are created with timestamps in the format: `rag_knowledge_YYYYMMDD_HHMMSS.json`
- Backups are stored in the `backups/` subdirectory within your S3 key prefix
- Manual backups can be created via the API endpoint

### Security

- All RAG knowledge management endpoints require admin-level authentication
- S3 credentials should be stored securely and rotated regularly
- Use IAM roles with minimal required permissions

## Monitoring

### Health Checks

Use the health endpoint to verify S3 connectivity:

```bash
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:6542/api/rag-knowledge/health
```

### Logs

The application logs S3 operations with detailed information:
- Connection status
- Upload/download operations
- Error messages
- File sizes and timestamps

## Troubleshooting

### Common Issues

1. **S3 Connection Fails:**
   - Check AWS credentials and permissions
   - Verify bucket exists and is accessible
   - Check network connectivity

2. **LocalStack Issues:**
   - Ensure LocalStack is running on the correct port
   - Use `S3_FORCE_PATH_STYLE=true` for LocalStack
   - Create bucket before first use

3. **Permission Errors:**
   - Verify IAM policy includes all required S3 actions
   - Check bucket policy doesn't block access
   - Ensure credentials are not expired

### Debug Mode

Enable debug logging by setting the log level in your application configuration to see detailed S3 operation logs.

## Migration

### From Local to S3

1. Enable S3 configuration
2. Ensure your local `rag_knowledge.json` is up to date
3. Start the application (it will load from local file initially)
4. Use the update endpoint with `save_to_s3=true` to upload to S3
5. Restart the application (it will now load from S3)

### Backup Before Migration

Always create a backup of your local `rag_knowledge.json` before migrating to S3.
