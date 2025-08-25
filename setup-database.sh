#!/bin/bash

# Database Setup Script for Web-App-CAA
# This script helps configure database environment variables

echo "=== Web-App-CAA Database Setup ==="
echo ""

# Function to read user input with default value
read_with_default() {
    local prompt="$1"
    local default="$2"
    local varname="$3"
    
    echo -n "$prompt [$default]: "
    read value
    if [ -z "$value" ]; then
        value="$default"
    fi
    eval "$varname='$value'"
}

echo "Choose your database type:"
echo "1. SQLite (recommended for development)"
echo "2. MySQL (recommended for production)"
echo ""

read -p "Enter your choice (1 or 2): " db_choice

if [ "$db_choice" = "2" ]; then
    echo ""
    echo "=== MySQL Configuration ==="
    
    read_with_default "MySQL Host" "localhost" DB_HOST
    read_with_default "MySQL Port" "3306" DB_PORT
    read_with_default "MySQL Username" "webapp_caa" DB_USER
    read_with_default "MySQL Database Name" "webapp_caa_db" DB_NAME
    echo -n "MySQL Password: "
    read -s DB_PASSWORD
    echo ""
    read_with_default "MySQL Charset" "utf8mb4" DB_CHARSET
    read_with_default "Max Open Connections" "25" DB_MAX_OPEN_CONNS
    read_with_default "Max Idle Connections" "5" DB_MAX_IDLE_CONNS
    
    echo ""
    echo "=== Generated Environment Variables ==="
    echo "DB_DRIVER=mysql"
    echo "DB_HOST=$DB_HOST"
    echo "DB_PORT=$DB_PORT"
    echo "DB_USER=$DB_USER"
    echo "DB_PASSWORD=$DB_PASSWORD"
    echo "DB_NAME=$DB_NAME"
    echo "DB_CHARSET=$DB_CHARSET"
    echo "DB_MAX_OPEN_CONNS=$DB_MAX_OPEN_CONNS"
    echo "DB_MAX_IDLE_CONNS=$DB_MAX_IDLE_CONNS"
    echo ""
    
    # Create .env file
    cat > .env << EOF
# Database Configuration - MySQL
DB_DRIVER=mysql
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_CHARSET=$DB_CHARSET
DB_PARSE_TIME=true
DB_LOC=Local
DB_MAX_OPEN_CONNS=$DB_MAX_OPEN_CONNS
DB_MAX_IDLE_CONNS=$DB_MAX_IDLE_CONNS

# Server Configuration
APP_HOST=localhost
APP_PORT=3000
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key")

# AI Configuration (configure as needed)
# BACKEND_TYPE=ollama
# LLM_HOST=http://localhost:11434
# LLM_MODEL=llama3.1:8b

# Debug
DEBUG=false
EOF

else
    echo ""
    echo "=== SQLite Configuration ==="
    
    read_with_default "SQLite Directory" "./data" DB_SQLITE_DIR
    read_with_default "SQLite Filename" "database.sqlite" DB_SQLITE_FILE
    
    echo ""
    echo "=== Generated Environment Variables ==="
    echo "DB_DRIVER=sqlite"
    echo "DB_SQLITE_DIR=$DB_SQLITE_DIR"
    echo "DB_SQLITE_FILE=$DB_SQLITE_FILE"
    echo ""
    
    # Create .env file
    cat > .env << EOF
# Database Configuration - SQLite
DB_DRIVER=sqlite
DB_SQLITE_DIR=$DB_SQLITE_DIR
DB_SQLITE_FILE=$DB_SQLITE_FILE

# Server Configuration
APP_HOST=localhost
APP_PORT=3000
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key")

# AI Configuration (configure as needed)
# BACKEND_TYPE=ollama
# LLM_HOST=http://localhost:11434
# LLM_MODEL=llama3.1:8b

# Debug
DEBUG=false
EOF

fi

echo ""
echo "✅ Configuration saved to .env file"
echo ""
echo "Next steps:"
if [ "$db_choice" = "2" ]; then
    echo "1. Ensure MySQL server is running and accessible"
    echo "2. Create the database: CREATE DATABASE $DB_NAME;"
    echo "3. Grant permissions to user: GRANT ALL ON $DB_NAME.* TO '$DB_USER'@'%';"
fi
echo "4. Build and run: go build -o webapp main.go && ./webapp"
echo ""
echo "The application will automatically migrate the database schema on startup."
