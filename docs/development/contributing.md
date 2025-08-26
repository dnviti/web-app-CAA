# Contributing to Web App CAA

Thank you for your interest in contributing to Web App CAA! This guide will help you get started with contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation](#documentation)
7. [Pull Request Process](#pull-request-process)
8. [Issue Reporting](#issue-reporting)
9. [Architecture Decisions](#architecture-decisions)

## Code of Conduct

This project adheres to a code of conduct adapted from the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Standards

Examples of behavior that contributes to creating a positive environment:
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Go 1.21+** installed
2. **Git** configured with your name and email
3. **Make** installed (for build tasks)
4. **Docker** (optional, for containerized development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/web-app-CAA.git
cd web-app-CAA
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/dnviti/web-app-CAA.git
```

### Environment Setup

1. Copy the environment configuration:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
go mod download
```

3. Set up the database:

```bash
make setup-db
```

4. Run the application:

```bash
make run
```

The application should be available at `http://localhost:8080`.

## Development Workflow

### Branch Strategy

We use a simplified Git flow:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Critical fixes for production

### Creating a Feature Branch

1. Sync with upstream:

```bash
git checkout main
git pull upstream main
```

2. Create and switch to a feature branch:

```bash
# Sync with upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Follow our coding standards and project structure:

- **Code Style**: Follow Go best practices and `gofmt` formatting
- **Comments**: Document public functions and complex logic
- **Tests**: Add tests for new functionality
- **Commit Messages**: Use clear, descriptive commit messages

### 3. Test Your Changes

```bash
# Run tests
make test

# Check code formatting
make fmt

# Run linters (if available)
make lint

# Test the application manually
make dev
```

### 4. Submit a Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create pull request on GitHub
# Include description of changes and any breaking changes
```

## Coding Standards

### Go Code Style

Follow these Go conventions:

#### File Structure
```go
// Package declaration
package handlers

// Imports organized: standard -> third-party -> local
import (
    "context"
    "fmt"
    
    "github.com/gin-gonic/gin"
    
    "github.com/daniele/web-app-caa/internal/models"
    "github.com/daniele/web-app-caa/internal/services"
)
```

#### Function Documentation
```go
// CreateUser creates a new user in the database with validation.
// It returns an error if the username already exists or validation fails.
func CreateUser(db *gorm.DB, user *models.User) error {
    // Implementation
}
```

#### Error Handling
```go
// Proper error handling
result, err := someOperation()
if err != nil {
    log.Printf("Operation failed: %v", err)
    return fmt.Errorf("failed to complete operation: %w", err)
}
```

#### Variable Naming
```go
// Good: descriptive names
userService := services.NewUserService()
gridItems := []models.GridItem{}

// Avoid: abbreviated names
usrSvc := services.NewUserService()
items := []models.GridItem{}
```

### Database Changes

When making database changes:

1. **Create Migration**: Document schema changes
2. **Update Models**: Modify GORM models accordingly
3. **Test Migration**: Ensure both SQLite and MySQL work
4. **Backward Compatibility**: Consider existing data

Example model change:
```go
// Before
type User struct {
    ID       uint   `gorm:"primaryKey"`
    Username string `gorm:"unique;not null"`
    Password string `gorm:"not null"`
}

// After - adding email field
type User struct {
    ID       uint   `gorm:"primaryKey"`
    Username string `gorm:"unique;not null"`
    Password string `gorm:"not null"`
    Email    string `gorm:"unique"` // New field, nullable for backward compatibility
}
```

### API Changes

For API modifications:

1. **Maintain Compatibility**: Don't break existing endpoints
2. **Version New Features**: Use API versioning if needed
3. **Document Changes**: Update API documentation
4. **Test Thoroughly**: Ensure all clients continue working

## Project Areas

### Core Components

#### 1. Authentication System
**Location**: `internal/handlers/auth.go`, `internal/services/user.go`

**Contribution areas**:
- OAuth integration
- Multi-factor authentication
- Session management improvements
- Password policy enhancements

#### 2. Grid Management
**Location**: `internal/handlers/grid.go`, `internal/services/grid.go`

**Contribution areas**:
- New grid templates
- Advanced grid customization
- Import/export functionality
- Grid sharing features

#### 3. AI Services
**Location**: `internal/services/ai.go`, `internal/services/llm.go`

**Contribution areas**:
- Additional language support
- New LLM integrations
- Improved prompt engineering
- Caching and performance

#### 4. Frontend
**Location**: `web/static/`, `web/templates/`

**Contribution areas**:
- UI/UX improvements
- Accessibility enhancements
- Mobile responsiveness
- Progressive Web App features

### Testing

#### Unit Tests
```go
func TestCreateUser(t *testing.T) {
    // Setup
    db := setupTestDB()
    defer db.Close()
    
    user := &models.User{
        Username: "testuser",
        Password: "hashedpassword",
    }
    
    // Execute
    err := CreateUser(db, user)
    
    // Assert
    assert.NoError(t, err)
    assert.NotZero(t, user.ID)
}
```

#### Integration Tests
```go
func TestUserRegistrationFlow(t *testing.T) {
    // Setup test server
    router := setupTestRouter()
    
    // Test registration
    payload := `{"username":"newuser","password":"password123"}`
    req := httptest.NewRequest("POST", "/api/register", strings.NewReader(payload))
    req.Header.Set("Content-Type", "application/json")
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusCreated, w.Code)
}
```

## Issue Guidelines

### Bug Reports

When reporting bugs, include:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Ubuntu 20.04
- Go version: 1.21.5
- Docker version: 20.10.8

## Additional Context
Screenshots, logs, or other relevant information
```

### Feature Requests

For feature requests:

```markdown
## Feature Description
Clear description of the requested feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Mockups, examples, or related issues
```

## Documentation

### Code Documentation

- **Package Documentation**: Describe package purpose
- **Function Documentation**: Document public APIs
- **Example Usage**: Provide examples for complex functions
- **Inline Comments**: Explain complex logic

### User Documentation

When adding features that affect users:

1. **Update API docs** in `docs/api/`
2. **Update user guides** in `docs/getting-started/`
3. **Add configuration examples**
4. **Include screenshots** for UI changes

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

1. **Update Documentation**
2. **Run Full Test Suite**
3. **Update CHANGELOG.md**
4. **Tag Release**
5. **Build and Test Docker Images**
6. **Create GitHub Release**

## Community

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Request Reviews**: Code collaboration

### Code of Conduct

We follow a code of conduct based on the [Contributor Covenant](https://www.contributor-covenant.org/):

- **Be respectful** and inclusive
- **Be constructive** in feedback
- **Focus on what's best** for the community
- **Show empathy** towards other community members

## Advanced Contributions

### Adding New LLM Backends

To add support for a new LLM service:

1. **Implement Client Interface**:
   ```go
   type NewLLMClient struct {
       apiKey string
       baseURL string
   }
   
   func (c *NewLLMClient) Chat(prompt string) (string, error) {
       // Implementation
   }
   ```

2. **Update LLMService**:
   ```go
   func (s *LLMService) initializeClients() {
       switch s.backendType {
       case "ollama":
           s.ollamaClient = ollama.NewClient(s.llmHost)
       case "openai":
           s.openaiClient = openai.NewClient(s.openaiKey)
       case "newllm":
           s.newLLMClient = NewLLMClient(s.apiKey, s.baseURL)
       }
   }
   ```

3. **Add Configuration Support**
4. **Write Tests**
5. **Update Documentation**

### Adding New Grid Templates

To create new grid templates:

1. **Define Template Structure**:
   ```go
   func NewCustomTemplate() []models.GridItem {
       return []models.GridItem{
           {
               Type: "category",
               Label: "Custom Category",
               Icon: "fa-custom",
               Color: "#FF5722",
               Category: "custom",
           },
           // More items...
       }
   }
   ```

2. **Register Template**:
   ```go
   templates := map[string]func() []models.GridItem{
       "default": DefaultTemplate,
       "simplified": SimplifiedTemplate,
       "empty": EmptyTemplate,
       "custom": NewCustomTemplate,
   }
   ```

3. **Update Frontend Options**
4. **Add Tests and Documentation**

## Getting Help

If you need help with contributing:

1. **Check existing documentation** in this repository
2. **Search existing issues** for similar questions
3. **Create a new issue** with your question
4. **Join the discussion** in GitHub Discussions

We appreciate all contributions, whether they're bug fixes, new features, documentation improvements, or simply reporting issues. Thank you for helping make Web App CAA better!

---

**Next:** [Testing Guide →](testing.md)
