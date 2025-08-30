#!/bin/bash

# Docker Compose Deployment Manager for web-app-CAA
# This script provides easy management of optional dependencies using Docker Compose profiles

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to show usage
show_usage() {
    echo "Docker Compose Deployment Manager for web-app-CAA"
    echo ""
    echo "USAGE:"
    echo "  $0 <command> [options]"
    echo ""
    echo "COMMANDS:"
    echo "  up [profile]     Start services with optional profile"
    echo "  down            Stop all services"
    echo "  logs [service]  Show logs for specific service or all"
    echo "  status          Show status of all services"
    echo "  restart         Restart all running services"
    echo "  clean           Clean up all containers, volumes and networks"
    echo "  profiles        List available profiles"
    echo ""
    echo "PROFILES:"
    echo "  basic           Web app only (SQLite + external AI)"
    echo "  mysql           Web app + MySQL database"
    echo "  ollama          Web app + Ollama AI service"
    echo "  rustfs          Web app + RustFS storage"
    echo "  full            All services (MySQL + Ollama + RustFS)"
    echo "  production      Production configuration"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 up                 # Start with basic configuration"
    echo "  $0 up mysql           # Start with MySQL database"
    echo "  $0 up ollama          # Start with Ollama AI service"
    echo "  $0 up rustfs          # Start with RustFS storage"
    echo "  $0 up full            # Start with all services"
    echo "  $0 down               # Stop all services"
    echo "  $0 logs web-app       # Show logs for web-app service"
    echo "  $0 status             # Show service status"
}

# Function to check if .env files exist
check_env_files() {
    local missing_files=()
    
    if [[ ! -f "../.env" ]]; then
        if [[ -f "../.env.example" ]]; then
            print_warning ".env file not found, but .env.example exists. Consider copying it:"
            print_info "cp ../.env.example ../.env"
        else
            missing_files+=("../.env")
        fi
    fi
    
    if [[ ! -f ".env.rustfs" ]]; then
        missing_files+=(".env.rustfs")
    fi
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        print_warning "Missing environment files: ${missing_files[*]}"
        print_info "Some services might not work correctly without proper configuration"
    fi
}

# Function to start services based on profile
start_services() {
    local profile="${1:-basic}"
    
    print_info "Starting services with profile: $profile"
    check_env_files
    
    case "$profile" in
        "basic")
            docker-compose up -d
            ;;
        "mysql")
            docker-compose --profile mysql up -d
            ;;
        "ollama")
            docker-compose --profile ollama up -d
            ;;
        "rustfs")
            docker-compose --profile rustfs up -d
            ;;
        "full")
            docker-compose -f docker-compose.yaml -f docker-compose.full.yaml up -d
            ;;
        "production")
            docker-compose -f docker-compose.yaml -f docker-compose.production.yaml up -d
            ;;
        *)
            print_error "Unknown profile: $profile"
            show_usage
            exit 1
            ;;
    esac
    
    print_success "Services started successfully!"
    print_info "You can check the status with: $0 status"
}

# Function to stop services
stop_services() {
    print_info "Stopping all services..."
    docker-compose down
    print_success "Services stopped successfully!"
}

# Function to show logs
show_logs() {
    local service="$1"
    if [[ -n "$service" ]]; then
        print_info "Showing logs for service: $service"
        docker-compose logs -f "$service"
    else
        print_info "Showing logs for all services"
        docker-compose logs -f
    fi
}

# Function to show service status
show_status() {
    print_info "Service Status:"
    docker-compose ps
    
    echo ""
    print_info "Available Profiles Status:"
    
    # Check which services are running
    local running_services
    running_services=$(docker-compose ps --services --filter status=running)
    
    if echo "$running_services" | grep -q "mysql"; then
        echo -e "  MySQL Database: ${GREEN}Running${NC}"
    else
        echo -e "  MySQL Database: ${RED}Stopped${NC}"
    fi
    
    if echo "$running_services" | grep -q "ollama"; then
        echo -e "  Ollama AI:      ${GREEN}Running${NC}"
    else
        echo -e "  Ollama AI:      ${RED}Stopped${NC}"
    fi
    
    if echo "$running_services" | grep -q "rustfs"; then
        echo -e "  RustFS Storage: ${GREEN}Running${NC}"
    else
        echo -e "  RustFS Storage: ${RED}Stopped${NC}"
    fi
}

# Function to restart services
restart_services() {
    print_info "Restarting services..."
    docker-compose restart
    print_success "Services restarted successfully!"
}

# Function to clean up
clean_up() {
    print_warning "This will remove all containers, volumes, and networks."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Function to list profiles
list_profiles() {
    echo "Available Docker Compose Profiles:"
    echo ""
    echo "• basic       - Web application only (default)"
    echo "              Uses: SQLite database, external AI services"
    echo ""
    echo "• mysql       - Web application + MySQL database"
    echo "              Uses: MySQL in Docker, external AI services"
    echo ""
    echo "• ollama      - Web application + Ollama AI"
    echo "              Uses: SQLite database, Ollama in Docker"
    echo ""
    echo "• rustfs      - Web application + RustFS storage"
    echo "              Uses: SQLite database, RustFS S3-compatible storage"
    echo ""
    echo "• full        - All services enabled"
    echo "              Uses: MySQL + Ollama + RustFS (complete development setup)"
    echo ""
    echo "• production  - Optimized for production deployment"
    echo "              Uses: SQLite, external services, resource limits, logging"
}

# Main script logic
case "${1:-help}" in
    "up")
        start_services "$2"
        ;;
    "down")
        stop_services
        ;;
    "logs")
        show_logs "$2"
        ;;
    "status")
        show_status
        ;;
    "restart")
        restart_services
        ;;
    "clean")
        clean_up
        ;;
    "profiles")
        list_profiles
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
