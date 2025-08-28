# RBAC System Initialization

This document describes how the RBAC (Role-Based Access Control) system is automatically initialized when the application starts.

## Overview

The application uses **automatic RBAC seeding** that runs during database initialization. No manual migrations or commands are needed - the RBAC system is set up automatically on first run and maintained thereafter.

## Automatic RBAC Setup

### Core Components

- **`internal/database/seeding.go`** - Contains all RBAC seeding logic
- **`database.Initialize()`** - Calls seeding functions automatically
- **Idempotent operations** - Safe to run multiple times

### What Gets Created Automatically

The system automatically creates:

1. **3 Default Roles**: `admin`, `editor`, `user`
2. **Complete Permission Set** covering all resources and actions
3. **Default User Accounts** with secure passwords
4. **Role-Permission Relationships** 
5. **User-Role Assignments**

## Default Roles Created

### Admin Role
- **Name**: `admin`
- **Display Name**: Administrator
- **Description**: Full system access with all administrative privileges
- **Permissions**: All permissions including user management, role management, grid management, AI services, and system administration

### Editor Role
- **Name**: `editor`
- **Display Name**: Editor
- **Description**: Can manage grid items and content
- **Permissions**: Grid management (create, read, update, delete), AI services access

### User Role
- **Name**: `user`
- **Display Name**: User
- **Description**: Basic user with limited permissions
- **Permissions**: Manage own grid items, AI services access

## Default User Accounts

The migration creates three initial accounts:

- **Full Administrative Access**: All permissions in the system
- **User Management**: Create, read, update, delete users
- **System Configuration**: All system settings and configuration

### Editor Role
- **Content Management**: Create, read, update, delete grid items
- **Limited User Access**: Read-only access to users
- **AI Services**: Access to AI-powered features

### User Role  
- **Basic Access**: Read access to their own grid items
- **AI Services**: Access to AI-powered language features
- **Limited Permissions**: Cannot modify system settings

## Default Users Created

The system automatically creates these default accounts:

| Username | Password   | Editor Password | Role   | Email                     | Status        |
|----------|-----------|-----------------|--------|---------------------------|---------------|
| admin    | admin123  | editor123      | admin  | admin@caa-app.local       | active        |
| editor   | editor123 | editor123      | editor | editor@caa-app.local      | active        |
| user     | user123   | (none)         | user   | user@caa-app.local        | pending_setup |

> **Security Note**: Change these default passwords in production!

## Automatic Initialization Process

The RBAC system initializes automatically during application startup:

1. **Database Connection**: Established first
2. **Schema Creation**: GORM AutoMigrate creates all tables
3. **RBAC Seeding**: `SeedRBACData()` function executes
4. **Idempotent Checks**: Existing data is preserved, missing data is added
5. **Service Initialization**: RBAC service starts with fully populated database

### Seeding Logs

The system provides detailed logging:

```
[DATABASE SEEDING] Starting RBAC data seeding...
[DATABASE SEEDING] Created default role: admin
[DATABASE SEEDING] Created default role: editor
[DATABASE SEEDING] Created default role: user
[DATABASE SEEDING] Created permission: users:read
[DATABASE SEEDING] Created permission: users:create
...
[DATABASE SEEDING] Created default user: admin
[DATABASE SEEDING] Created default user: editor
[DATABASE SEEDING] User user already exists, skipping
[DATABASE SEEDING] RBAC data seeding completed successfully
[RBAC] RBAC service initialized successfully
```

### Subsequent Runs

On subsequent runs, the system intelligently skips existing data:

```
[DATABASE SEEDING] Starting RBAC data seeding...
[DATABASE SEEDING] Role admin already exists, skipping
[DATABASE SEEDING] Role editor already exists, skipping
[DATABASE SEEDING] Role user already exists, skipping
[DATABASE SEEDING] User admin already exists, skipping
...
[DATABASE SEEDING] RBAC data seeding completed successfully
```

## Security Notes

⚠️ **Important**: The default passwords are for initial setup only. In production:

1. Change all default passwords immediately after first login
2. Consider disabling or removing default accounts if not needed
3. Use strong, unique passwords for all accounts
4. Implement proper password policies

## Permissions Matrix

| Resource | Action | Admin | Editor | User |
|----------|--------|-------|--------|------|
| users    | read   | ✓     | ✓      |      |
| users    | create | ✓     |        |      |
| users    | update | ✓     |        |      |
| users    | delete | ✓     |        |      |
| roles    | read   | ✓     |        |      |
| roles    | create | ✓     |        |      |
| roles    | update | ✓     |        |      |
| roles    | delete | ✓     |        |      |
| grids    | read   | ✓     | ✓      | ✓    |
| grids    | create | ✓     | ✓      |      |
| grids    | update | ✓     | ✓      |      |
| grids    | delete | ✓     | ✓      |      |
| ai       | read   | ✓     | ✓      | ✓    |
| ai       | use    | ✓     | ✓      | ✓    |
| system   | admin  | ✓     |        |      |
| system   | config | ✓     |        |      |

## Testing the Setup

To verify the RBAC system initialized correctly:

1. Start with a fresh database
2. Run the application
3. Check the logs for seeding messages
4. Verify you can login with the default accounts:
   - Username: `admin`, Password: `admin123`
   - Username: `editor`, Password: `editor123` 
   - Username: `user`, Password: `user123`
5. Test role-based permissions in the application

## Customizing Default Data

To modify the default RBAC setup, edit the seeding functions in `internal/database/seeding.go`:

### Adding New Roles
```go
// Add to seedDefaultRoles() function
{
    Name:        "moderator",
    DisplayName: "Moderator", 
    Description: "Can moderate content and assist users",
    IsActive:    true,
},
```

### Adding New Permissions
```go
// Add to seedDefaultPermissions() function
{Name: "content:moderate", Resource: "content", Action: "moderate", Description: "Moderate content"},
```

### Adding New Default Users
```go
// Add to seedDefaultUsers() function
{
    Username: "moderator",
    Email:    "moderator@caa-app.local",
    Password: "moderator123",
    Status:   "active",
    IsActive: true,
},
```

> **Note**: After modifying seeding functions, restart the application. The system will automatically create any missing data.

## Troubleshooting

### Common Issues

1. **No default users created**: Check seeding logs for errors during user creation
2. **Can't login with default credentials**: Verify password hashing is working
3. **Permission denied errors**: Check role-permission assignments
4. **Missing roles/permissions**: Restart application to trigger seeding

### Debugging Commands

```bash
# Check RBAC setup (SQLite example)
sqlite3 data/database.sqlite "SELECT * FROM roles;"
sqlite3 data/database.sqlite "SELECT * FROM permissions;" 
sqlite3 data/database.sqlite "SELECT * FROM users;"

# Check role assignments
sqlite3 data/database.sqlite "SELECT u.username, r.name FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id;"

# Check permission assignments
sqlite3 data/database.sqlite "SELECT r.name as role, p.name as permission FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.name, p.name;"
```

## Benefits of Automatic Seeding

- **Zero Configuration**: Works out of the box
- **Consistent**: Same setup in dev, staging, and production
- **Self-Healing**: Missing data is automatically recreated
- **Idempotent**: Safe to restart multiple times
- **No Manual Steps**: No migration commands to remember
