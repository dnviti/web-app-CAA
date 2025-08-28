# Database Initialization Process

## Overview

The application uses a **fully automated database setup** that runs at startup. No manual migration commands are needed - everything happens automatically when the application starts.

## Automated Initialization Flow

### 1. **Application Startup**
```
[STARTUP] Server configuration loaded
[STARTUP] Database connection established
[DATABASE] Connected, migrated, and seeded successfully using sqlite driver
```

### 2. **Automatic Schema Migration (GORM AutoMigrate)**
- All tables are created/updated automatically based on Go struct definitions
- Constraints, indexes, and foreign keys are handled automatically
- No manual SQL scripts required

### 3. **Automatic Data Seeding**
```
[DATABASE SEEDING] Starting RBAC data seeding...
[DATABASE SEEDING] Created default role: admin
[DATABASE SEEDING] Created default role: editor  
[DATABASE SEEDING] Created default role: user
[DATABASE SEEDING] Created permission: users:read
[DATABASE SEEDING] Created permission: users:create
...
[DATABASE SEEDING] RBAC data seeding completed successfully

[DATABASE SEEDING] Verifying signing keys setup...
[DATABASE SEEDING] No signing keys found, creating initial RSA key pair
[DATABASE SEEDING] Generated and stored new signing key with ID: abc-123-def
[DATABASE SEEDING] Initial RSA signing key created and activated
```

### 4. **Service Initialization**  
```
[RBAC] RBAC service initialized successfully
[STARTUP] Server starting on :6542
```

## Key Benefits

### ✅ **Zero Configuration**
- Fresh databases are automatically set up
- No manual migration commands to run
- Works identically in dev, staging, and production

### ✅ **Idempotent Operations**
- Safe to restart the application multiple times
- Existing data is not duplicated or corrupted
- Missing data is automatically recreated

### ✅ **Type Safety**
- Schema derived from Go structs with compile-time checking
- No SQL DDL scripts to maintain
- Model changes automatically reflected in database

### ✅ **Self-Healing**
- Automatically detects and fixes missing default data
- Ensures at least one active signing key exists
- Recreates missing roles/permissions if needed

## What Happens Automatically

| Component | What's Created | When |
|-----------|----------------|------|
| **Tables** | All model tables with proper constraints | Every startup (AutoMigrate) |
| **Roles** | admin, editor, user roles | First startup + if missing |
| **Permissions** | Full permission set for all resources | First startup + if missing |
| **Default Users** | admin, editor, user accounts | First startup + if missing |
| **Role Assignments** | Users assigned to appropriate roles | First startup + if missing |
| **Signing Keys** | RSA key pairs for JWT signing | First startup + if no active keys |

## For Developers

### Adding New Models
1. Create struct in `internal/models/`
2. Add to AutoMigrate list in `database.go`  
3. Restart application - table is automatically created

### Adding Default Data
1. Add seeding logic to `internal/database/seeding.go`
2. Make it idempotent (check before creating)
3. Restart application - data is automatically seeded

### No More Manual Migrations!
- ❌ Don't create migration files
- ❌ Don't run migration commands  
- ❌ Don't worry about schema versioning
- ✅ Just modify models and restart

## Migration History

This application has evolved through different migration strategies:

- **v1.0**: Manual migrations with SQL scripts
- **v2.0**: GORM AutoMigrate + manual data migrations  
- **v3.0**: Full automation with AutoMigrate + automatic seeding (current)

The old manual migration system has been removed for simplicity and reliability.
