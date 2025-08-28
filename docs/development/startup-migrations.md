# Startup Migration Process

## Overview

The application now runs database migrations automatically at startup, ensuring that all database schema changes and data initialization are applied consistently across deployments.

## Migration Flow

### 1. **Application Startup**
```
[STARTUP] Server configuration loaded
[STARTUP] Database connection established
[STARTUP] Running database migrations...
```

### 2. **Migration Execution**
```
[MIGRATIONS] Starting database migrations...
[MIGRATIONS] Executing migration: 001_create_rbac_system
[RBAC MIGRATION] Executing RBAC setup migration...
[RBAC MIGRATION] Created default role: admin
[RBAC MIGRATION] Created default role: editor
[RBAC MIGRATION] Created default role: user
...
[RBAC MIGRATION] RBAC system setup completed successfully
[MIGRATIONS] Completed migration: 001_create_rbac_system
[MIGRATIONS] Successfully executed 1 migrations
```

### 3. **Subsequent Runs (Idempotent)**
```
[MIGRATIONS] Starting database migrations...
[MIGRATIONS] Skipping migration 001_create_rbac_system (already executed)
[MIGRATIONS] Skipped 1 already executed migrations
```

### 4. **Service Initialization**
```
[STARTUP] Database migrations completed successfully
[RBAC] RBAC service initialized successfully
```

## Key Features

### ✅ **Automatic Execution**
- Migrations run automatically on every application startup
- No manual intervention required
- Integrated into the startup sequence

### ✅ **Idempotent Operation**  
- Safe to run multiple times
- Tracks executed migrations in `migration_records` table
- Skips already executed migrations

### ✅ **Comprehensive Logging**
- `[STARTUP]` - Application startup messages
- `[MIGRATIONS]` - Migration system messages
- `[RBAC MIGRATION]` - RBAC-specific migration logs
- Clear success/skip/error messages

### ✅ **Error Handling**
- Application fails fast if migrations fail
- Clear error messages for troubleshooting
- Prevents startup with inconsistent database state

## Migration Tracking

### Database Table: `migration_records`
```sql
CREATE TABLE migration_records (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    version VARCHAR(255) NOT NULL,  
    executed_at BIGINT NOT NULL
);
```

### Example Record
```
001_create_rbac_system | Creates default roles (admin, editor, user), permissions, and initial user accounts | 1.0.0 | 1693243800
```

## Integration Points

1. **main.go**: Calls `migrations.RunDatabaseMigrations(db)` during startup
2. **RBAC Service**: Initializes after migrations complete
3. **Database**: Migration tracking table created automatically
4. **Casbin**: Policies synced after migration completion

## Adding New Migrations

To add new migrations, follow the established pattern:

1. Create new migration file: `internal/migrations/002_your_migration.go`
2. Register in `internal/migrations/migrations.go`
3. Migrations will run automatically on next startup

## Benefits

- **Consistency**: Same migration process in all environments
- **Safety**: Idempotent execution prevents data corruption
- **Transparency**: Detailed logging for audit and debugging
- **Automation**: Zero manual intervention required
- **Reliability**: Fail-fast approach ensures data integrity
