# API Documentation

This document describes the REST API endpoints for the Web App CAA (Communication and Alternative Augmentative) application.

## Swagger/OpenAPI Documentation

The API is fully documented using OpenAPI 3.0 specification with Swagger UI for interactive documentation.

### Accessing Swagger UI

When the server is running, you can access the interactive API documentation at:

```
http://localhost:6542/swagger/index.html
```

### Generating Documentation

To regenerate the Swagger documentation after making changes to the API:

```bash
make swagger
```

Or manually:

```bash
~/go/bin/swag init -g cmd/web-app-CAA/main.go --output docs
```

## Authentication

Most API endpoints require authentication using JWT Bearer tokens. To authenticate:

1. Register a new user using `POST /api/register`
2. Login using `POST /api/login` to receive a JWT token
3. Include the token in the Authorization header: `Authorization: Bearer <your-token>`

## API Endpoints

### Authentication Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login and receive JWT token
- `GET /api/user` - Get current user information (requires auth)
- `POST /api/check-editor-password` - Validate editor password (requires auth)

### Grid Management Endpoints

- `POST /api/setup` - Setup a new grid (simplified, empty, or default)
- `POST /api/complete-setup` - Mark setup as complete
- `GET /api/grid` - Retrieve user's grid configuration
- `POST /api/grid` - Save complete grid configuration
- `POST /api/grid/item` - Add a new item to the grid
- `PUT /api/grid/item/{id}` - Update an existing grid item
- `DELETE /api/grid/item/{id}` - Delete a grid item

### AI Language Processing Endpoints

- `POST /api/conjugate` - Conjugate Italian verbs based on tense
- `POST /api/correct` - Correct Italian sentences using AI

## Models

### User Model
```json
{
  "id": 1,
  "username": "string",
  "status": "pending_setup|complete",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Grid Item Model
```json
{
  "id": "string",
  "type": "string",
  "label": "string",
  "icon": "string",
  "color": "string",
  "target": "string",
  "text": "string",
  "speak": "string",
  "action": "string",
  "isVisible": true,
  "symbol_type": "string",
  "isHideable": true
}
```

## Response Formats

### Success Response
```json
{
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error message",
  "message": "Optional additional details"
}
```

### Authentication Response
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-string",
  "status": "user-status"
}
```

## Development

### Adding New Endpoints

1. Create your handler function in the appropriate handler file
2. Add Swagger annotations using the format:
   ```go
   // @Summary Brief description
   // @Description Detailed description
   // @Tags TagName
   // @Accept json
   // @Produce json
   // @Security BearerAuth (if auth required)
   // @Param paramName body/path/query ModelType true "Description"
   // @Success 200 {object} ResponseModel
   // @Failure 400 {object} models.ErrorResponse
   // @Router /endpoint [method]
   ```
3. Register the route in `main.go`
4. Regenerate documentation with `make swagger`

### Swagger Annotation Guidelines

- Use consistent tag names (Auth, Grid, AI)
- Always specify proper HTTP status codes
- Use specific response models instead of `gin.H`
- Include security annotations for protected endpoints
- Provide clear parameter descriptions
