# Authentication API

The Authentication API handles user registration, login, and authorization for Web App CAA. All endpoints use JSON for request and response bodies.

## Base URL

```
http://localhost:3000/api
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Database
    
    Note over Client,Database: Registration Flow
    Client->>API: POST /register
    API->>Database: Create user
    Database-->>API: User created
    API-->>Client: Success response
    
    Note over Client,Database: Login Flow  
    Client->>API: POST /login
    API->>Database: Validate credentials
    Database-->>API: User data
    API-->>Client: JWT token + user info
    
    Note over Client,Database: Protected Requests
    Client->>API: Request with JWT header
    API->>API: Validate token
    API->>Database: Get user data
    Database-->>API: User data
    API-->>Client: Protected resource
```

## Endpoints

### POST /api/register

Register a new user account.

#### Request

```http
POST /api/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password_123",
  "editorPassword": "admin_password_456"
}
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Unique username (3-50 characters) |
| `password` | string | Yes | User password (minimum 6 characters) |
| `editorPassword` | string | Yes | Administrative password for editor functions |

#### Response

=== "Success (201 Created)"
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": 1,
        "username": "john_doe",
        "status": "pending_setup"
      }
    }
    ```

=== "Username Exists (409 Conflict)"
    ```json
    {
      "error": "Username already exists"
    }
    ```

=== "Validation Error (400 Bad Request)"
    ```json
    {
      "error": "Username must be between 3 and 50 characters"
    }
    ```

=== "Server Error (500 Internal Server Error)"
    ```json
    {
      "error": "Internal server error"
    }
    ```

#### Validation Rules

- **Username**: 3-50 characters, alphanumeric and underscores only
- **Password**: Minimum 6 characters
- **Editor Password**: Required for administrative functions

#### Example Usage

```javascript
// Registration example
const registerUser = async (userData) => {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('Registration successful:', result.user);
    // Redirect to login or setup
  } else {
    console.error('Registration failed:', result.error);
  }
};
```

### POST /api/login

Authenticate a user and receive a JWT token.

#### Request

```http
POST /api/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password_123"
}
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | User's username |
| `password` | string | Yes | User's password |

#### Response

=== "Success (200 OK)"
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "john_doe",
        "status": "active"
      }
    }
    ```

=== "Invalid Credentials (401 Unauthorized)"
    ```json
    {
      "error": "Invalid username or password"
    }
    ```

=== "Validation Error (400 Bad Request)"
    ```json
    {
      "error": "Username and password are required"
    }
    ```

#### JWT Token

The returned token is a JSON Web Token (JWT) that must be included in the `Authorization` header for protected endpoints:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token Claims

```json
{
  "userId": 1,
  "username": "john_doe",
  "exp": 1735689600,
  "iat": 1735603200
}
```

#### Example Usage

```javascript
// Login example
const loginUser = async (credentials) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  
  const result = await response.json();
  
  if (response.ok) {
    // Store token for subsequent requests
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    console.log('Login successful');
  } else {
    console.error('Login failed:', result.error);
  }
};
```

### POST /api/check-editor-password

Verify the editor password for administrative functions.

!!! note "Protected Endpoint"
    This endpoint requires a valid JWT token in the Authorization header.

#### Request

```http
POST /api/check-editor-password
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "editorPassword": "admin_password_456"
}
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `editorPassword` | string | Yes | Editor/administrative password |

#### Response

=== "Correct Password (200 OK)"
    ```json
    {
      "message": "Editor password is correct",
      "valid": true
    }
    ```

=== "Incorrect Password (401 Unauthorized)"
    ```json
    {
      "error": "Invalid editor password",
      "valid": false
    }
    ```

=== "Missing Token (401 Unauthorized)"
    ```json
    {
      "error": "Authorization token required"
    }
    ```

#### Example Usage

```javascript
// Check editor password
const verifyEditorPassword = async (password) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/check-editor-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ editorPassword: password })
  });
  
  const result = await response.json();
  return result.valid;
};
```

## Authentication Middleware

Protected endpoints automatically validate JWT tokens through authentication middleware.

### Middleware Flow

1. **Extract Token**: Get token from `Authorization: Bearer <token>` header
2. **Validate Token**: Verify JWT signature and expiration
3. **Load User**: Fetch user data from database
4. **Set Context**: Add user information to request context

### Protected Endpoint Usage

```javascript
// Making authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    return;
  }
  
  return response;
};
```

## Error Handling

### HTTP Status Codes

| Status | Description | When Used |
|--------|-------------|-----------|
| `200` | OK | Successful request |
| `201` | Created | User registration successful |
| `400` | Bad Request | Invalid request payload |
| `401` | Unauthorized | Authentication failed |
| `409` | Conflict | Username already exists |
| `500` | Internal Server Error | Server error |

### Error Response Format

All error responses follow this format:

```json
{
  "error": "Descriptive error message",
  "details": "Optional additional details"
}
```

### Common Errors

#### Invalid JWT Token

```json
{
  "error": "Invalid or expired token"
}
```

#### Missing Authorization Header

```json
{
  "error": "Authorization token required"
}
```

#### User Not Found

```json
{
  "error": "User not found"
}
```

## Security Considerations

### Password Security

- Passwords are hashed using bcrypt with cost factor 12
- Original passwords are never stored or logged
- Password validation ensures minimum complexity

### JWT Security

- Tokens are signed with HS256 algorithm
- Secret key should be cryptographically secure
- Tokens have reasonable expiration times
- Tokens are validated on every protected request

### Rate Limiting

Consider implementing rate limiting for authentication endpoints:

```javascript
// Example rate limiting configuration
const rateLimit = {
  '/api/login': '5 requests per minute',
  '/api/register': '3 requests per hour'
};
```

## Integration Examples

### Frontend Integration

```javascript
// Complete authentication flow
class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }
  
  async register(userData) {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }
    
    return result;
  }
  
  async login(credentials) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }
    
    this.token = result.token;
    this.user = result.user;
    
    localStorage.setItem('authToken', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
    
    return result;
  }
  
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
  
  isAuthenticated() {
    return !!this.token && !!this.user;
  }
  
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}
```

---

**Next:** [Grid Management API →](grid.md)
