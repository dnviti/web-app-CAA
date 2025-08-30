#!/bin/bash

# Validation script for dynamic Docker Compose deployment system
# This script validates the configuration and tests different profiles

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info "Validating Docker Compose configuration..."

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

print_success "Docker and Docker Compose are available"

# Validate main docker-compose.yaml
print_info "Validating main docker-compose.yaml..."
if docker-compose -f docker-compose.yaml config > /dev/null 2>&1; then
    print_success "Main docker-compose.yaml is valid"
else
    print_error "Main docker-compose.yaml has configuration errors"
    docker-compose -f docker-compose.yaml config
    exit 1
fi

# Validate profile configurations
profiles=("mysql" "ollama" "rustfs")
for profile in "${profiles[@]}"; do
    print_info "Validating profile: $profile"
    if docker-compose --profile "$profile" config > /dev/null 2>&1; then
        print_success "Profile '$profile' is valid"
    else
        print_error "Profile '$profile' has configuration errors"
        docker-compose --profile "$profile" config
        exit 1
    fi
done

# Validate compose file combinations
compose_files=("docker-compose.mysql.yaml" "docker-compose.ollama.yaml" "docker-compose.rustfs.yaml" "docker-compose.full.yaml" "docker-compose.production.yaml")
for compose_file in "${compose_files[@]}"; do
    if [[ -f "$compose_file" ]]; then
        print_info "Validating $compose_file..."
        if docker-compose -f docker-compose.yaml -f "$compose_file" config > /dev/null 2>&1; then
            print_success "$compose_file is valid"
        else
            print_error "$compose_file has configuration errors"
            docker-compose -f docker-compose.yaml -f "$compose_file" config
            exit 1
        fi
    else
        print_warning "$compose_file not found"
    fi
done

# Check environment files
print_info "Checking environment files..."
if [[ -f "../.env" ]]; then
    print_success "Main .env file exists"
else
    print_warning "Main .env file not found. Copy from ../.env.example"
fi

if [[ -f ".env.rustfs" ]]; then
    print_success "RustFS .env file exists"
else
    print_warning "RustFS .env file not found. May be needed for RustFS profile"
fi

# Check if deployment script exists and is executable
print_info "Checking deployment script..."
if [[ -f "deploy.sh" ]]; then
    if [[ -x "deploy.sh" ]]; then
        print_success "Deployment script exists and is executable"
    else
        print_warning "Deployment script exists but is not executable"
        print_info "Run: chmod +x deploy.sh"
    fi
else
    print_error "Deployment script not found"
    exit 1
fi

# Test deployment script basic functionality
print_info "Testing deployment script help..."
if ./deploy.sh help > /dev/null 2>&1; then
    print_success "Deployment script help works"
else
    print_error "Deployment script help failed"
    exit 1
fi

# Summary
echo ""
print_success "=== VALIDATION SUMMARY ==="
print_success "✓ Docker and Docker Compose available"
print_success "✓ Main docker-compose.yaml valid"
print_success "✓ All profiles validate successfully"
print_success "✓ All compose file combinations valid"
print_success "✓ Deployment script ready"

echo ""
print_info "=== QUICK START ==="
echo "1. Copy environment file:     cp ../.env.example ../.env"
echo "2. Edit configuration:        nano ../.env"
echo "3. Start basic setup:         ./deploy.sh up"
echo "4. Or start with profile:     ./deploy.sh up mysql"
echo "5. Check status:              ./deploy.sh status"
echo "6. View logs:                 ./deploy.sh logs"
echo "7. Stop services:             ./deploy.sh down"

echo ""
print_info "Available profiles: basic, mysql, ollama, rustfs, full, production"
print_info "For detailed documentation, see README.md"

print_success "Validation completed successfully! 🎉"
