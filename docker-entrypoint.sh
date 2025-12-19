#!/bin/sh

# Docker entrypoint script for Workload Management App
# Ensures proper database directory setup and permissions

set -e

echo "🐳 Starting Docker container setup..."

# Ensure database directory exists and has proper permissions
if [ ! -d "/app/data" ]; then
    echo "📁 Creating database directory: /app/data"
    mkdir -p /app/data
fi

# Ensure logs directory exists
if [ ! -d "/app/logs" ]; then
    echo "📁 Creating logs directory: /app/logs"
    mkdir -p /app/logs
fi

# Set proper permissions
echo "🔧 Setting directory permissions..."
chmod 755 /app/data
chmod 755 /app/logs

# Check if we can write to the data directory
if [ ! -w "/app/data" ]; then
    echo "❌ Error: /app/data directory is not writable"
    exit 1
fi

# Check if database file exists
if [ -f "/app/data/database.sqlite" ]; then
    echo "📝 Database file exists: /app/data/database.sqlite"
    
    # Check if database file is writable
    if [ ! -w "/app/data/database.sqlite" ]; then
        echo "🔧 Fixing database file permissions..."
        chmod 664 /app/data/database.sqlite
    fi
else
    echo "📝 Database file does not exist, will be created on startup"
fi

# Create a test file to verify write permissions
TEST_FILE="/app/data/.write_test_$$"
echo "test" > "$TEST_FILE"
if [ $? -eq 0 ]; then
    echo "✅ Database directory is writable"
    rm -f "$TEST_FILE"
else
    echo "❌ Error: Cannot write to database directory"
    exit 1
fi

# Display environment information
echo "🔧 Environment Information:"
echo "   NODE_ENV: ${NODE_ENV:-development}"
echo "   DB_PATH: ${DB_PATH:-/app/data/database.sqlite}"
echo "   User ID: $(id -u)"
echo "   Group ID: $(id -g)"

# Check if admin reset is requested
if [ "$RESET_ADMIN" = "true" ]; then
    echo "🔐 Admin reset requested, running reset script..."
    node reset_admin_prod.js
fi

echo "✅ Docker container setup complete"
echo "🚀 Starting application..."

# Execute the command passed to this script
exec "$@"