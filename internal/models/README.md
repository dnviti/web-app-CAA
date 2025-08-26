# Models Package

This package contains the data models for the web-app-CAA project, organized according to SOLID principles. The models are separated into logical files based on their purpose and responsibility.

## File Structure

### `user.go`
Contains the domain entity for users:
- `User` - Main user entity with authentication methods
- Helper functions for password validation and hashing

### `grid_item.go`
Contains the domain entity for grid items:
- `GridItem` - CAA system grid item entity

### `requests.go`
Contains Data Transfer Objects (DTOs) for incoming requests:
- `RegisterRequest` - User registration payload
- `LoginRequest` - User login payload
- `SetupRequest` - Grid setup payload
- `CheckEditorPasswordRequest` - Editor password verification payload
- `AddItemRequest` - Add grid item payload
- `ConjugateRequest` - AI conjugation request payload
- `CorrectRequest` - AI correction request payload

### `responses.go`
Contains Data Transfer Objects (DTOs) for outgoing responses:
- `GridResponse` - Grid data structure type alias
- `GridItemResponse` - Grid item response format
- `AuthResponse` - Authentication response format
- `LoginResponse` - Login response format

## Design Principles

This organization follows SOLID principles:

1. **Single Responsibility Principle (SRP)**: Each file has a single, focused responsibility
2. **Open/Closed Principle (OCP)**: Models are open for extension but closed for modification
3. **Liskov Substitution Principle (LSP)**: Not directly applicable to data models
4. **Interface Segregation Principle (ISP)**: Request/response models are segregated by purpose
5. **Dependency Inversion Principle (DIP)**: Models depend on abstractions (interfaces) rather than concrete implementations

## Benefits of This Organization

- **Maintainability**: Easier to find and modify specific model types
- **Scalability**: Easy to add new models without cluttering existing files
- **Readability**: Clear separation of concerns makes the codebase more understandable
- **Testing**: Easier to unit test specific model categories
- **Collaboration**: Multiple developers can work on different model files simultaneously

## Migration from `models.go`

The original `models.go` file has been split into the above files while maintaining all existing functionality and imports. No breaking changes were introduced.
