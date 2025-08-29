# OpenAPI Auto-Discovery Implementation

This document describes the comprehensive OpenAPI auto-discovery implementation for the Web App CAA backend.

## Overview

The Web App CAA backend now provides full OpenAPI auto-discovery capabilities, allowing any API client, documentation tool, or developer to automatically discover and interact with the API documentation.

## Features

✅ **Complete OpenAPI 2.0/Swagger Documentation**
✅ **Interactive Swagger UI**  
✅ **Multiple Discovery Endpoints**
✅ **Cross-Origin Resource Sharing (CORS) Support**
✅ **Standard Well-Known Discovery Patterns**
✅ **Comprehensive API Information Endpoints**

## Discovery Endpoints

### Primary OpenAPI Specification

| Endpoint | Content-Type | Description |
|----------|--------------|-------------|
| `/openapi.json` | `application/json` | OpenAPI 2.0/Swagger specification in JSON format |
| `/openapi.yaml` | `application/x-yaml` | OpenAPI 2.0/Swagger specification in YAML format |

### Alternative Discovery Paths

| Endpoint | Content-Type | Description |
|----------|--------------|-------------|
| `/swagger.json` | `application/json` | Swagger JSON specification (alias) |
| `/swagger.yaml` | `application/x-yaml` | Swagger YAML specification (alias) |
| `/api-docs` | `application/json` | API documentation JSON (common pattern) |
| `/api/openapi.json` | `application/json` | OpenAPI JSON under API base path |
| `/api/openapi.yaml` | `application/x-yaml` | OpenAPI YAML under API base path |

### Interactive Documentation

| Endpoint | Description |
|----------|-------------|
| `/swagger/index.html` | Interactive Swagger UI documentation |
| `/docs` | Redirects to Swagger UI |
| `/documentation` | Redirects to Swagger UI |

### API Information & Discovery

| Endpoint | Content-Type | Description |
|----------|--------------|-------------|
| `/api` | `application/json` | API information and discovery metadata |
| `/` | `application/json` | Root API welcome message (with JSON Accept header) |
| `/.well-known/openapi_description` | `application/json` | Standard OpenAPI discovery endpoint |

### Health & Status

| Endpoint | Content-Type | Description |
|----------|--------------|-------------|
| `/ping` | `text/plain` | Health check endpoint |

## OpenAPI Specification Details

- **OpenAPI Version**: 2.0 (Swagger 2.0)
- **API Version**: 1.0
- **Base Path**: `/api`
- **Host**: `localhost:6542` (configurable)
- **Authentication**: JWT Bearer tokens
- **Tags**: Auth, Grid, AI, ARASAAC, Health

### Supported Features

- **Complete endpoint documentation** with all HTTP methods
- **Request/response schemas** with detailed models
- **Authentication requirements** per endpoint
- **Parameter validation** and type definitions
- **Error response schemas** for all error conditions
- **Security definitions** for JWT authentication

## Auto-Discovery Standards Compliance

### RFC 8615 - Well-Known URIs
- `/.well-known/openapi_description` - Standard OpenAPI discovery

### Common API Documentation Patterns
- `/api-docs` - Popular documentation endpoint
- `/swagger.json` - Swagger specification access
- `/docs` - Human-readable documentation
- `/openapi.json` - OpenAPI specification access

### CORS Support
All OpenAPI endpoints include proper CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Usage Examples

### Discover API Information
```bash
curl -H "Accept: application/json" http://localhost:6542/api
```

### Get OpenAPI Specification
```bash
# JSON format
curl http://localhost:6542/openapi.json

# YAML format  
curl http://localhost:6542/openapi.yaml
```

### Access Interactive Documentation
```bash
# Open in browser
http://localhost:6542/swagger/index.html
```

### Auto-Discovery
```bash
# Standard discovery endpoint
curl http://localhost:6542/.well-known/openapi_description
```

## Integration with API Clients

### OpenAPI Generators
```bash
# Generate client code
openapi-generator generate -i http://localhost:6542/openapi.json -g python -o ./client

# Generate documentation
openapi-generator generate -i http://localhost:6542/openapi.yaml -g html2 -o ./docs
```

### Postman Import
1. Open Postman
2. Click Import
3. Select "Link" tab
4. Enter: `http://localhost:6542/openapi.json`

### Insomnia Import
1. Open Insomnia
2. Click Import/Export
3. Import from URL: `http://localhost:6542/openapi.json`

## Development Workflow

### Regenerating Documentation
```bash
# After making changes to handler annotations
make swagger

# Or manually
~/go/bin/swag init -g cmd/web-app-CAA/main.go --output docs
```

### Testing Discovery Endpoints
```bash
# Run the provided test script
./test_openapi.sh

# Or test manually
make build
./bin/web-app-caa &
curl http://localhost:6542/api
```

## File Structure

```
docs/
├── swagger.json          # Generated OpenAPI JSON specification
├── swagger.yaml          # Generated OpenAPI YAML specification
└── docs.go              # Generated Go documentation package

cmd/web-app-CAA/
└── main.go              # Main application with OpenAPI annotations

test_openapi.sh          # Test script for all discovery endpoints
```

## Implementation Details

### Swagger Annotations
The API uses comprehensive Swagger annotations in handler methods:

```go
// @Summary Register a new user
// @Description Register a new user with username, password, editor password, and grid type
// @Tags Auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.RegisterRequest true "Registration request"
// @Success 201 {object} models.AuthResponse
// @Failure 400 {object} models.ErrorResponse
// @Router /auth/register [post]
```

### File Serving
OpenAPI files are served with proper error handling and absolute path resolution:

```go
func getSwaggerFilePath(filename string) string {
    cwd, err := os.Getwd()
    if err != nil {
        log.Printf("Error getting working directory: %v", err)
        return filepath.Join("docs", filename)
    }
    return filepath.Join(cwd, "docs", filename)
}
```

## Security Considerations

- All endpoints support CORS for cross-origin access
- No authentication required for documentation endpoints
- Proper content-type headers prevent XSS attacks
- File serving includes existence checks to prevent directory traversal

## Future Enhancements

- [ ] OpenAPI 3.0 specification support
- [ ] API versioning in discovery endpoints
- [ ] Custom themes for Swagger UI
- [ ] API changelog and version history
- [ ] Rate limiting information in specification

---

**The Web App CAA backend is now fully OpenAPI auto-discovery ready!** 

Any API client, documentation tool, or developer can automatically discover, explore, and integrate with the API using standard OpenAPI discovery patterns.
