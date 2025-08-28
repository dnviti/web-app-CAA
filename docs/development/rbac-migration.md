# Database Migrations System

This document describes the database migration system that automatically manages database schema changes and data initialization, including RBAC (Role-Based Access Control) setup.

## Overview

The application uses a dedicated migration system located in `internal/migrations/` that:

1. **Tracks migration execution** in the `migration_records` table
2. **Ensures idempotent operation** - migrations run only once
3. **Provides detailed logging** with `[MIGRATIONS]` and specific migration prefixes
4. **Supports rollback functionality** for each migration

## Migration System Architecture

### Core Components

- **`migration_runner.go`** - Core migration runner and tracking system
- **`migrations.go`** - Registry of all available migrations  
- **`001_rbac_setup.go`** - RBAC system initialization migration
- **Migration tracking table** - `migration_records` stores executed migrations

### Migration Structure

```go
type Migration struct {
    ID          string
    Name        string
    Description string
    Version     string
    Execute     func(db *gorm.DB) error
    Rollback    func(db *gorm.DB) error
}
```

## RBAC Migration (001_rbac_setup)

The first migration sets up the complete RBAC system:

### What It Creates

1. **3 Default Roles**: `admin`, `editor`, `user`
2. **15 Default Permissions** covering all resources and actions
3. **Initial User Accounts** with proper role assignments
4. **Role-Permission relationships**
5. **User-Role assignments**

## Default Roles

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

| Username | Password   | Role   | Email                    | Status |
|----------|-----------|--------|--------------------------|--------|
| admin    | admin123  | admin  | admin@webapp-caa.local   | active |
| editor   | editor123 | editor | editor@webapp-caa.local  | active |
| user     | user123   | user   | user@webapp-caa.local    | active |

## Migration Process

The migration system runs automatically during application startup:

1. **Database Connection**: After GORM AutoMigrate completes
2. **Migration Runner Initialization**: `RunDatabaseMigrations(db)` is called
3. **Migration Tracking Setup**: Creates `migration_records` table if needed
4. **Migration Execution**: Runs pending migrations in order
5. **RBAC Policy Sync**: Casbin policies are synced with database after migrations

### Migration Logs

The system provides detailed logging for tracking:

```
[MIGRATIONS] Starting database migrations...
[MIGRATIONS] Executing migration: 001_create_rbac_system
[RBAC MIGRATION] Executing RBAC setup migration...
[RBAC MIGRATION] Created default role: admin
[RBAC MIGRATION] Created default role: editor
[RBAC MIGRATION] Created default role: user
[RBAC MIGRATION] Assigned permission 'users:read' to role 'admin'
...
[RBAC MIGRATION] Created default user: admin
[RBAC MIGRATION] Assigned role 'admin' to user 'admin'
...
[RBAC MIGRATION] RBAC system setup completed successfully
[MIGRATIONS] Completed migration: 001_create_rbac_system
[MIGRATIONS] Successfully executed 1 migrations
[RBAC] RBAC service initialized successfully
```

### Idempotent Operation

On subsequent runs with existing data:

```
[MIGRATIONS] Starting database migrations...
[MIGRATIONS] Skipping migration 001_create_rbac_system (already executed)
[MIGRATIONS] Skipped 1 already executed migrations
[RBAC] RBAC service initialized successfully
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
| users    | read   | ✓     |        |      |
| users    | create | ✓     |        |      |
| users    | update | ✓     |        |      |
| users    | delete | ✓     |        |      |
| roles    | read   | ✓     |        |      |
| roles    | create | ✓     |        |      |
| roles    | update | ✓     |        |      |
| roles    | delete | ✓     |        |      |
| grids    | read   | ✓     | ✓      |      |
| grids    | create | ✓     | ✓      |      |
| grids    | update | ✓     | ✓      |      |
| grids    | delete | ✓     | ✓      |      |
| grids    | own    | ✓     | ✓      | ✓    |
| ai       | use    | ✓     | ✓      | ✓    |
| system   | admin  | ✓     |        |      |

## Migration Logs

The migration process logs its progress with the `[RBAC]` prefix:

```
[RBAC] Created default role: admin
[RBAC] Created default role: editor  
[RBAC] Created default role: user
[RBAC] Created default user 'admin' with role 'admin'
[RBAC] Created default user 'editor' with role 'editor'
[RBAC] Created default user 'user' with role 'user'
[RBAC] RBAC migration completed successfully
[RBAC] RBAC service initialized successfully
```

## Testing the Migration

To test the migration:

1. Start with a fresh database
2. Run the application
3. Check the logs for migration messages
4. Verify you can login with the default accounts
5. Test role-based permissions

## Adding New Migrations

To add a new migration:

1. **Create Migration File**: `internal/migrations/002_your_migration.go`
2. **Implement Migration Function**:

```go
func CreateYourMigration() Migration {
    return Migration{
        ID:          "002-your-migration",
        Name:        "002_your_migration_name", 
        Description: "Description of what this migration does",
        Version:     "1.0.0",
        Execute:     executeYourMigration,
        Rollback:    rollbackYourMigration,
    }
}

func executeYourMigration(db *gorm.DB) error {
    // Migration logic here
    log.Printf("[YOUR MIGRATION] Starting migration...")
    // ... implementation
    return nil
}

func rollbackYourMigration(db *gorm.DB) error {
    // Rollback logic here  
    return nil
}
```

3. **Register Migration**: Add to `internal/migrations/migrations.go`:

```go
func GetAllMigrations() []Migration {
    return []Migration{
        CreateRBACMigration(),
        CreateYourMigration(), // Add your migration here
    }
}
```

## Migration Best Practices

- **Idempotent**: Always check if resources exist before creating
- **Logged**: Use clear logging with migration-specific prefixes
- **Reversible**: Implement rollback functionality when possible
- **Versioned**: Use semantic versioning for migrations
- **Tested**: Test both execution and rollback scenarios

## Migration Management

### Manual Migration Control

You can disable automatic migrations by modifying the RBAC service initialization if needed, but this is not recommended for production.

### Database Schema

The `migration_records` table structure:

```sql
CREATE TABLE migration_records (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    version VARCHAR(255) NOT NULL,
    executed_at BIGINT NOT NULL
);
```

## Troubleshooting

- **Migrations not running**: Check database connection and GORM AutoMigrate success
- **Duplicate data**: Ensure migration logic checks for existing resources
- **Missing permissions**: Verify Casbin policy sync after migration completion  
- **Migration stuck**: Check `migration_records` table for execution status
- **Rollback needed**: Implement and test rollback functions for safe reversal

### Common Issues

1. **Migration executed but resources missing**: Check migration logs for errors during execution
2. **Casbin policies not working**: Ensure RBAC service syncs policies after migration
3. **Default users can't login**: Verify password hashing in user creation
4. **Permission denied errors**: Check role-permission assignments in database

### Debugging Commands

```bash
# Check migration status
sqlite3 database.sqlite "SELECT * FROM migration_records;"

# Verify RBAC setup
sqlite3 database.sqlite "SELECT COUNT(*) FROM roles;"
sqlite3 database.sqlite "SELECT COUNT(*) FROM permissions;" 
sqlite3 database.sqlite "SELECT COUNT(*) FROM users;"

# Check relationships
sqlite3 database.sqlite "SELECT u.username, r.name FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id;"
```
