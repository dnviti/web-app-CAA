# Installation Guide

This comprehensive guide covers all installation methods and requirements for Web App CAA.

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows
- **Memory**: Minimum 512MB RAM, 1GB+ recommended
- **Storage**: At least 100MB free space
- **Network**: Internet connection for AI services (optional)

### Required Software

#### Go Programming Language

Web App CAA requires **Go 1.21 or higher**.

=== "Linux (Ubuntu/Debian)"
    ```bash
    # Using package manager
    sudo apt update
    sudo apt install golang-go
    
    # Or download from official source
    wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
    sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    source ~/.bashrc
    ```

=== "macOS"
    ```bash
    # Using Homebrew
    brew install go
    
    # Or download installer from https://golang.org/dl/
    ```

=== "Windows"
    1. Download installer from [golang.org/dl](https://golang.org/dl/)
    2. Run the `.msi` installer
    3. Add Go to your PATH (usually done automatically)

#### Git Version Control

```bash
# Linux (Ubuntu/Debian)
sudo apt install git

# macOS
brew install git

# Windows - Download from https://git-scm.com/
```

#### Make Build Tool (Optional)

=== "Linux"
    ```bash
    sudo apt install make
    ```

=== "macOS"
    ```bash
    # Usually pre-installed with Xcode Command Line Tools
    xcode-select --install
    ```

=== "Windows"
    ```bash
    # Install via Chocolatey
    choco install make
    
    # Or use Windows Subsystem for Linux (WSL)
    ```

## Installation Methods

### Method 1: Source Installation (Recommended)

This is the most flexible method for development and customization.

#### 1. Clone the Repository

```bash
git clone https://github.com/dnviti/web-app-CAA.git
cd web-app-CAA
```

#### 2. Install Dependencies

```bash
# Using Make
make deps

# Or manually
go mod download
go mod tidy
```

#### 3. Build the Application

```bash
# Using Make
make build

# Or manually
go build -o bin/web-app-caa ./cmd/web-app-caa/main.go
```

#### 4. Run the Application

```bash
# Using Make
make run

# Or manually
./bin/web-app-caa
```

### Method 2: Docker Installation

Perfect for containerized environments and easy deployment.

#### Prerequisites
- **Docker** 20.10+ - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** 2.0+ - Usually included with Docker Desktop

#### Option A: Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/dnviti/web-app-CAA.git
cd web-app-CAA

# Build and start services
docker-compose up --build

# Or using Make
make docker-up
```

#### Option B: Using Pre-built Image

```bash
# Pull the latest image
docker pull ghcr.io/dnviti/web-app-caa:latest

# Run with default settings
docker run -p 3000:3000 ghcr.io/dnviti/web-app-caa:latest

# Run with custom configuration
docker run -p 8080:8080 \
  -e APP_PORT=8080 \
  -e JWT_SECRET=your-secret-key \
  ghcr.io/dnviti/web-app-caa:latest
```

#### Option C: Build Your Own Image

```bash
# Build the image
docker build -t web-app-caa .

# Run the container
docker run -p 3000:3000 web-app-caa
```

### Method 3: Binary Releases

Download pre-compiled binaries from the [GitHub Releases](https://github.com/dnviti/web-app-CAA/releases) page.

```bash
# Download the latest release (adjust URL for your platform)
wget https://github.com/dnviti/web-app-CAA/releases/latest/download/web-app-caa-linux-amd64

# Make executable
chmod +x web-app-caa-linux-amd64

# Run
./web-app-caa-linux-amd64
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
APP_PORT=3000
APP_HOST=localhost
JWT_SECRET=your-super-secret-jwt-key

# Database Configuration
DB_DRIVER=sqlite
DB_SQLITE_DIR=./data
DB_SQLITE_FILE=database.sqlite

# AI Configuration (Optional)
BACKEND_TYPE=ollama
LLM_HOST=http://localhost:11434
LLM_MODEL=llama2
```

### Database Setup

#### SQLite (Default)

No additional setup required. The application will:

1. Create the `./data/` directory
2. Initialize `database.sqlite`
3. Run automatic migrations

#### MySQL (Production)

1. **Install MySQL Server**
2. **Create Database and User**:
   ```sql
   CREATE DATABASE webapp_caa;
   CREATE USER 'webapp'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON webapp_caa.* TO 'webapp'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Configure Environment**:
   ```env
   DB_DRIVER=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=webapp
   DB_PASSWORD=secure_password
   DB_NAME=webapp_caa
   ```

### AI Services Setup (Optional)

#### Ollama Installation

=== "Linux"
    ```bash
    curl -fsSL https://ollama.ai/install.sh | sh
    ollama serve
    ollama pull llama2
    ```

=== "macOS"
    ```bash
    brew install ollama
    ollama serve
    ollama pull llama2
    ```

=== "Windows"
    Download from [ollama.ai](https://ollama.ai/download) and follow the installer.

#### OpenAI-Compatible API

```env
BACKEND_TYPE=openai
LLM_HOST=https://api.openai.com/v1
OPENAI_API_KEY=your-openai-api-key
LLM_MODEL=gpt-3.5-turbo
```

## Verification

### 1. Check Installation

```bash
# Verify Go installation
go version

# Should output: go version go1.21.x...

# Check application build
./bin/web-app-caa --help
```

### 2. Test Basic Functionality

```bash
# Start the server
./bin/web-app-caa

# In another terminal, test the health endpoint
curl http://localhost:3000/api/health
```

### 3. Verify Database Connection

Check the logs for successful database initialization:

```
[INFO] Database initialized successfully
[INFO] Auto-migration completed
[INFO] Server starting on localhost:3000
```

## Troubleshooting

### Common Issues

#### Go Installation Issues

**"go: command not found"**
```bash
# Add Go to PATH
export PATH=$PATH:/usr/local/go/bin
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
```

**Go version too old**
```bash
# Update Go
sudo rm -rf /usr/local/go
# Download and install latest version
```

#### Build Errors

**Module download failures**
```bash
# Set Go proxy
export GOPROXY=https://proxy.golang.org,direct
go mod download
```

**Permission denied**
```bash
# Fix permissions
chmod +x bin/web-app-caa
```

#### Runtime Errors

**Port already in use**
```bash
# Change port
export APP_PORT=8080
./bin/web-app-caa
```

**Database permission errors**
```bash
# Create data directory with proper permissions
mkdir -p data
chmod 755 data
```

**SQLite locked errors**
```bash
# Stop all instances and remove lock files
pkill web-app-caa
rm -f data/*.sqlite-*
```

#### Docker Issues

**Permission denied (Docker)**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

**Port conflicts**
```bash
# Use different port
docker run -p 8080:3000 web-app-caa
```

### Performance Tuning

#### Database Optimization

For MySQL in production:

```env
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=5m
```

#### Memory Configuration

```bash
# Set Go garbage collector target
export GOGC=100

# For containers, limit memory
docker run -m 512m web-app-caa
```

### Getting Help

If you encounter issues not covered here:

1. **Check the Logs**: Look for error messages in the application output
2. **Search Issues**: Check [GitHub Issues](https://github.com/dnviti/web-app-CAA/issues)
3. **Create Issue**: Open a new issue with:
   - Your operating system
   - Go version (`go version`)
   - Error messages and logs
   - Steps to reproduce

---

**Next:** [Configuration Guide →](configuration.md)
