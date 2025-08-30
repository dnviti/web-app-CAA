# RAG Knowledge Management API Documentation

This document describes the RAG (Retrieval-Augmented Generation) Knowledge Management API endpoints that provide S3 storage integration for managing the knowledge base used by the AI language processing system.

## Overview

The RAG Knowledge Management system allows administrators to:
- Retrieve and update the AI knowledge base
- Store knowledge data in AWS S3 or S3-compatible services
- Create and restore from timestamped backups
- Monitor S3 storage health and connectivity

## Authentication

All RAG knowledge management endpoints require:
1. **Bearer Token Authentication**: Include `Authorization: Bearer <jwt-token>` header
2. **Admin Role**: User must have admin privileges in the RBAC system

## Base URL

All endpoints are prefixed with `/api` and require authentication:
```
https://your-domain.com/api/rag-knowledge
```

## Endpoints

### 1. Get RAG Knowledge

Retrieve the current RAG knowledge data used by the AI system.

```http
GET /api/rag-knowledge
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "presente_indicativo": {
    "description": "Used for actions happening now...",
    "general_rules": {
      "-are verbs (parlare)": {
        "conjugation": "io parlo, tu parli...",
        "example": "Parlo italiano..."
      }
    },
    "irregular_verbs": {
      "Essere (to be)": {
        "conjugation": "sono, sei, è...",
        "example": "Siamo studenti."
      }
    }
  },
  "passato_prossimo": {
    // ... more knowledge data
  }
}
```

**Error Responses:**
- `500 Internal Server Error`: No RAG knowledge available

---

### 2. Update RAG Knowledge

Update the RAG knowledge data and optionally save to S3 storage.

```http
PUT /api/rag-knowledge?save_to_s3=true
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "presente_indicativo": {
    "description": "Updated description...",
    "general_rules": {
      // ... updated knowledge structure
    }
  }
}
```

**Query Parameters:**
- `save_to_s3` (boolean, optional): Whether to save the updated knowledge to S3 storage. Default: `false`

**Response (200 OK):**
```json
{
  "message": "RAG knowledge updated successfully",
  "saved_to_s3": true
}
```

**Error Responses:**
- `400 Bad Request`: Invalid JSON format
- `500 Internal Server Error`: Failed to update RAG knowledge

---

### 3. Reload RAG Knowledge

Reload RAG knowledge from S3 storage or fall back to local file.

```http
POST /api/rag-knowledge/reload
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "message": "RAG knowledge reloaded successfully"
}
```

**Error Responses:**
- `500 Internal Server Error`: Failed to reload RAG knowledge

---

### 4. Create Backup

Create a timestamped backup of the current RAG knowledge in S3.

```http
POST /api/rag-knowledge/backup
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "message": "RAG knowledge backup created successfully"
}
```

**Error Responses:**
- `500 Internal Server Error`: S3 not enabled or backup failed

---

### 5. List Backups

List all available RAG knowledge backups in S3 storage.

```http
GET /api/rag-knowledge/backups
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "backups": [
    {
      "Key": "caa/backups/rag_knowledge_20240829_143052.json",
      "LastModified": "2024-08-29T14:30:52Z",
      "Size": 15264
    },
    {
      "Key": "caa/backups/rag_knowledge_20240829_120015.json",
      "LastModified": "2024-08-29T12:00:15Z",
      "Size": 15180
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error`: S3 not enabled or list failed

---

### 6. Restore from Backup

Restore RAG knowledge from a specific timestamped backup.

```http
POST /api/rag-knowledge/restore/{backup_key}
Authorization: Bearer <admin-token>
```

**Path Parameters:**
- `backup_key` (string, required): The S3 backup key (e.g., `caa/backups/rag_knowledge_20240829_143052.json`)

**Response (200 OK):**
```json
{
  "message": "RAG knowledge restored from backup: caa/backups/rag_knowledge_20240829_143052.json"
}
```

**Error Responses:**
- `400 Bad Request`: Backup key required
- `500 Internal Server Error`: Restore failed

---

### 7. Check S3 Health

Check the health and connectivity of S3 storage service.

```http
GET /api/rag-knowledge/health
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "message": "S3 storage is healthy",
  "status": "ok"
}
```

**Error Responses:**
- `500 Internal Server Error`: S3 health check failed or S3 not enabled

## S3 Configuration

To enable S3 storage for RAG knowledge management, configure these environment variables:

```bash
# Required for S3 functionality
S3_ENABLED=true
S3_REGION=us-east-1
S3_BUCKET_NAME=your-caa-bucket
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Optional configuration
S3_ENDPOINT=                    # Custom endpoint for LocalStack/RustFS
S3_KEY_PREFIX=caa              # Key prefix for organization
S3_FORCE_PATH_STYLE=true       # Path-style URLs for compatibility
```

## Storage Behavior

### Fallback Strategy

The system implements intelligent fallback behavior:

1. **S3 Enabled + Available**: Loads knowledge from S3
2. **S3 Enabled + Unavailable**: Falls back to local `rag_knowledge.json`
3. **S3 Disabled**: Uses local `rag_knowledge.json` only

### File Structure in S3

```
your-bucket/
├── caa/                          # Key prefix (configurable)
│   ├── rag_knowledge.json        # Main knowledge file
│   └── backups/                  # Backup directory
│       ├── rag_knowledge_20240829_143052.json
│       ├── rag_knowledge_20240829_120015.json
│       └── ...
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Detailed error message describing what went wrong"
}
```

Common error scenarios:
- **S3 Not Configured**: When S3 operations are attempted but S3 is disabled
- **Authentication Required**: When requests are made without proper admin authentication
- **Network Issues**: When S3 is unreachable or bucket access fails
- **Invalid Data**: When updating knowledge with malformed JSON

## Rate Limiting

No specific rate limiting is implemented for these endpoints, but they are subject to the application's general rate limiting policies.

## Examples

### Complete Workflow Example

```bash
# 1. Check S3 health
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.example.com/api/rag-knowledge/health

# 2. Get current knowledge
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.example.com/api/rag-knowledge

# 3. Create backup before changes
curl -X POST \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.example.com/api/rag-knowledge/backup

# 4. Update knowledge with S3 save
curl -X PUT \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d @updated_knowledge.json \
     "https://api.example.com/api/rag-knowledge?save_to_s3=true"

# 5. Verify changes by reloading
curl -X POST \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.example.com/api/rag-knowledge/reload
```

### Backup and Restore Example

```bash
# List available backups
BACKUPS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
          https://api.example.com/api/rag-knowledge/backups)

echo $BACKUPS | jq '.backups[0].Key'  # Get latest backup key

# Restore from specific backup
BACKUP_KEY="caa/backups/rag_knowledge_20240829_143052.json"
curl -X POST \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.example.com/api/rag-knowledge/restore/$BACKUP_KEY
```

## Security Considerations

1. **Admin Only**: All endpoints require admin privileges
2. **Secure Tokens**: Use strong JWT tokens with proper expiration
3. **S3 Permissions**: Limit S3 IAM permissions to necessary actions only
4. **Network Security**: Use HTTPS for all API communications
5. **Backup Encryption**: Consider S3 server-side encryption for sensitive data

## Monitoring

Monitor these aspects for production usage:

- **S3 Health**: Regular health checks to ensure connectivity
- **Backup Frequency**: Automated backup creation before major updates
- **Storage Costs**: Monitor S3 storage usage and costs
- **Access Logs**: Track admin access to knowledge management endpoints

## Development and Testing

For development environments, use LocalStack or RustFS:

```bash
# LocalStack configuration
S3_ENABLED=true
S3_ENDPOINT=http://localhost:4566
S3_BUCKET_NAME=caa-bucket
S3_ACCESS_KEY_ID=test
S3_SECRET_ACCESS_KEY=test
S3_FORCE_PATH_STYLE=true
```

See the [S3 Integration Guide](./s3-integration.md) for detailed setup instructions.
