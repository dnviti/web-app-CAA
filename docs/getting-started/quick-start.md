# Quick Start Guide

Get Web App CAA up and running in just a few minutes with this quick start guide.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Go 1.21 or higher** - [Download Go](https://golang.org/dl/)
- **Git** - For cloning the repository
- **Make** (optional) - For using Makefile commands

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dnviti/web-app-CAA.git
cd web-app-CAA
```

### 2. Build and Run

#### Option A: Using Make (Recommended)

```bash
# Install dependencies
make deps

# Build the application
make build

# Run the application
make run
```

#### Option B: Manual Build

```bash
# Install dependencies
go mod tidy

# Build the application
go build -o bin/web-app-caa ./cmd/web-app-caa

# Run the application
./bin/web-app-caa
```

#### Option C: Development Mode

```bash
# Run directly without building binary
make dev

# Or manually
go run ./cmd/web-app-caa/main.go
```

### 3. Access the Application

Once the server is running, open your browser and navigate to:

```
http://localhost:3000
```

You should see the Web App CAA login page.

## First Time Setup

### 1. Create Your Account

1. Click **"Registrati"** (Register) on the login page
2. Fill in your credentials:
   - **Username**: Choose a unique username
   - **Password**: Create a secure password
   - **Editor Password**: Set an administrative password
3. Click **"Registrati"** to create your account

### 2. Choose Your Grid Template

After registration, you'll be redirected to the setup page where you can choose from:

- **Griglia Completa** (Complete Grid): Full set of predefined categories
- **Griglia Semplificata** (Simplified Grid): Essential categories only  
- **Griglia Vuota** (Empty Grid): Start from scratch

### 3. Start Using the Grid

Once setup is complete, you'll have access to:

- Interactive communication grid
- AI-powered verb conjugation
- Sentence correction tools
- Grid customization options

## Docker Quick Start

If you prefer using Docker:

### 1. Using Docker Compose (Recommended)

```bash
# Build and start all services
make docker-up

# Or manually
docker-compose up --build
```

### 2. Using Pre-built Image

```bash
# Pull the latest image
docker pull ghcr.io/dnviti/web-app-caa:latest

# Run the container
docker run -p 3000:3000 ghcr.io/dnviti/web-app-caa:latest
```

### 3. Access the Application

Navigate to `http://localhost:3000` in your browser.

## Verification

To verify everything is working correctly:

### 1. Check Server Status

Look for these log messages when starting:

```
[STARTUP] Server configuration loaded:
[STARTUP] - PORT: 3000
[STARTUP] - HOST: localhost
[STARTUP] - JWT_SECRET: [SET]
[GIN-debug] Listening and serving HTTP on localhost:3000
```

### 2. Test Core Functionality

1. **Registration**: Create a new user account
2. **Login**: Authenticate with your credentials
3. **Setup**: Choose and configure your grid template
4. **Grid Access**: View and interact with your communication grid
5. **AI Services**: Test verb conjugation and sentence correction

### 3. Database Verification

The application will automatically:

- Create the `./data/` directory
- Initialize `database.sqlite`
- Run database migrations
- Set up required tables

## Next Steps

Now that you have Web App CAA running:

1. **[Learn about Configuration](configuration.md)** - Customize your setup
2. **[Explore the Architecture](../architecture/overview.md)** - Understand the system design
3. **[Check the API Documentation](../api/authentication.md)** - Integrate with other services
4. **[Deploy with Docker](../deployment/docker.md)** - Set up for production

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Change the port
export APP_PORT=8080
./bin/web-app-caa
```

**Database Permission Errors**
```bash
# Ensure proper permissions
mkdir -p data
chmod 755 data
```

**Go Build Errors**
```bash
# Clean and rebuild
make clean
go clean -cache
make build
```

**Need Help?** 

- Check the [Installation Guide](installation.md) for detailed setup instructions
- View [Configuration Options](configuration.md) for environment variables
- Open an issue on [GitHub](https://github.com/dnviti/web-app-CAA/issues) if you encounter problems

---

**Next:** [Detailed Installation Guide →](installation.md)
