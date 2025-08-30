# User Management & RBAC API Documentation

This document provides comprehensive documentation for the user management and RBAC (Role-Based Access Control) API endpoints implemented in the Web App CAA system.

## Table of Contents

1. [Authentication](#authentication)
2. [User Management Endpoints](#user-management-endpoints)
3. [RBAC Endpoints](#rbac-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)

## Authentication

All endpoints (except registration and login) require authentication using JWT Bearer tokens.

```http
Authorization: Bearer <your-jwt-token>
```

## User Management Endpoints

All user management endpoints require admin role access.

### 1. Get All Users

Retrieve all users with optional pagination and filtering.

```http
GET /api/admin/users
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by username or email
- `status` (optional): Filter by status (`pending_setup`, `active`, `inactive`)
- `is_active` (optional): Filter by active status (boolean)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "user1",
      "email": "user1@example.com",
      "status": "active",
      "is_active": true,
      "created_at": "2025-01-02 15:04:05",
      "updated_at": "2025-01-02 15:04:05",
      "roles": [
        {
          "id": "uuid",
          "name": "user",
          "display_name": "Regular User"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

### 2. Get User by ID

Retrieve a specific user by their ID.

```http
GET /api/admin/users/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "username": "user1",
  "email": "user1@example.com",
  "status": "active",
  "is_active": true,
  "created_at": "2025-01-02 15:04:05",
  "updated_at": "2025-01-02 15:04:05",
  "roles": [...]
}
```

### 3. Create User

Create a new user account (admin only).

```http
POST /api/admin/users
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword123",
  "editor_password": "editorpass123",
  "is_active": true
}
```

**Response:** Returns the created user object (without sensitive data).

### 4. Update User

Update an existing user's information.

```http
PUT /api/admin/users/{id}
```

**Request Body:**
```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "password": "newpassword123",
  "editor_password": "neweditorpass123",
  "status": "active",
  "is_active": true
}
```

**Note:** All fields are optional. Only provided fields will be updated.

### 5. Delete User

Deactivate a user account (soft delete).

```http
DELETE /api/admin/users/{id}
```

**Response:**
```json
{
  "message": "User deactivated successfully"
}
```

### 6. Get User Activity

Retrieve activity logs for a specific user.

```http
GET /api/admin/users/{id}/activity
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "user_created",
      "resource": "users",
      "description": "User account created",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-01-02T15:04:05Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

### 7. Bulk User Operations

Perform bulk operations on multiple users.

```http
POST /api/admin/users/bulk
```

**Request Body:**
```json
{
  "user_ids": ["uuid1", "uuid2", "uuid3"],
  "operation": "activate",
  "role_name": "editor"
}
```

**Operations:**
- `activate`: Activate users
- `deactivate`: Deactivate users
- `delete`: Soft delete users
- `assign_role`: Assign a role (requires `role_name`)
- `remove_role`: Remove a role (requires `role_name`)

**Response:**
```json
{
  "operation": "activate",
  "results": [
    {
      "user_id": "uuid1",
      "success": true,
      "message": "User activated"
    },
    {
      "user_id": "uuid2",
      "success": false,
      "message": "User not found"
    }
  ]
}
```

## RBAC Endpoints

### User Role Management

#### Get User Roles
```http
GET /api/auth/rbac/users/{user_id}/roles
```

#### Get User Permissions
```http
GET /api/auth/rbac/users/{user_id}/permissions
```

#### Assign Role to User
```http
POST /api/auth/rbac/users/{user_id}/roles/{role_name}
```

#### Remove Role from User
```http
DELETE /api/auth/rbac/users/{user_id}/roles/{role_name}
```

#### Check User Permission
```http
GET /api/auth/rbac/users/{user_id}/check-permission?resource=users&action=read
```

### Role Management

#### Get All Roles
```http
GET /api/auth/rbac/roles
```

#### Create Role
```http
POST /api/auth/rbac/roles
```

**Request Body:**
```json
{
  "name": "manager",
  "display_name": "Manager",
  "description": "Management role"
}
```

#### Assign Permission to Role
```http
POST /api/auth/rbac/roles/{role_name}/permissions/{permission_name}
```

#### Remove Permission from Role
```http
DELETE /api/auth/rbac/roles/{role_name}/permissions/{permission_name}
```

### Permission Management

#### Get All Permissions
```http
GET /api/auth/rbac/permissions
```

#### Create Permission
```http
POST /api/auth/rbac/permissions
```

**Request Body:**
```json
{
  "name": "users:read",
  "resource": "users",
  "action": "read",
  "description": "Read users"
}
```

## Admin Endpoints

### System Health

Check system health status.

```http
GET /api/admin/system/ping
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-02T15:04:05Z",
  "services": {
    "database": "healthy",
    "rbac": "healthy",
    "auth": "healthy"
  }
}
```

### Analytics

#### User Analytics
```http
GET /api/admin/analytics/users
```

**Response:**
```json
{
  "total_users": 100,
  "active_users": 85,
  "pending_users": 10,
  "inactive_users": 5,
  "recent_registrations": 12,
  "role_distribution": {
    "admin": 2,
    "editor": 20,
    "user": 78
  },
  "status_distribution": {
    "active": 85,
    "pending_setup": 10,
    "inactive": 5
  },
  "user_growth": []
}
```

#### Grid Analytics
```http
GET /api/admin/analytics/grids
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

## Security Considerations

### Authentication
- All endpoints require JWT authentication except registration/login
- JWT tokens contain user ID and expiration claims
- Refresh token mechanism for token renewal

### Authorization
- Role-based access control using Casbin
- Admin role required for user management endpoints
- Permission-based resource access control

### Data Protection
- Passwords are hashed using bcrypt
- Sensitive data is removed from API responses
- Input validation and sanitization

### Audit Trail
- User activities are logged in the database
- Activity logs include IP address and user agent
- Admin actions are tracked for compliance

## Default Roles and Permissions

### Admin Role
- Full system access
- User management capabilities
- RBAC management
- System administration

### Editor Role  
- Grid management
- AI services access
- Limited user viewing

### User Role
- Basic grid access
- AI services usage
- Read-only permissions

## Getting Started

1. **Authentication:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

2. **Get Users (with admin token):**
   ```bash
   curl -X GET http://localhost:8080/api/admin/users \
     -H "Authorization: Bearer <admin-token>"
   ```

3. **Create User:**
   ```bash
   curl -X POST http://localhost:8080/api/admin/users \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"username":"newuser","email":"new@example.com","password":"pass123","editor_password":"edit123"}'
   ```

## Integration Examples

### Frontend Integration
```javascript
// Get all users
const response = await fetch('/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Backend Integration
```go
// Check user permission
allowed, err := rbacService.CheckPermission(userID, "users", "read")
if err != nil || !allowed {
    return gin.H{"error": "Access denied"}
}
```

This comprehensive API provides full user lifecycle management, granular role-based permissions, and administrative oversight capabilities for the Web App CAA system.
