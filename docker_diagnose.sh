#!/bin/bash

echo "========================================"
echo "DOKPLOY DEPLOYMENT DIAGNOSTIC SCRIPT"
echo "========================================"

# Check if we're running in Docker
if [ -f /.dockerenv ]; then
    echo "✅ Running inside Docker container"
else
    echo "⚠️  Not running in Docker container"
fi

# Check environment variables
echo ""
echo "ENVIRONMENT VARIABLES:"
echo "NODE_ENV: ${NODE_ENV:-Not set}"
echo "DB_PATH: ${DB_PATH:-Not set}"
echo "PORT: ${PORT:-Not set}"

# Check database directory
echo ""
echo "DATABASE DIRECTORY CHECK:"
DB_DIR="/app/data"
if [ -d "$DB_DIR" ]; then
    echo "✅ Database directory exists: $DB_DIR"
    ls -la "$DB_DIR"
    echo "Directory permissions: $(stat -c '%a' $DB_DIR)"
    echo "Directory owner: $(stat -c '%U:%G' $DB_DIR)"
else
    echo "❌ Database directory does not exist: $DB_DIR"
    echo "Creating directory..."
    mkdir -p "$DB_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ Directory created successfully"
    else
        echo "❌ Failed to create directory"
    fi
fi

# Check database file
echo ""
echo "DATABASE FILE CHECK:"
DB_FILE="/app/data/database.sqlite"
if [ -f "$DB_FILE" ]; then
    echo "✅ Database file exists: $DB_FILE"
    echo "File size: $(stat -c '%s' $DB_FILE) bytes"
    echo "File permissions: $(stat -c '%a' $DB_FILE)"
    echo "File owner: $(stat -c '%U:%G' $DB_FILE)"
    echo "Last modified: $(stat -c '%y' $DB_FILE)"
else
    echo "❌ Database file does not exist: $DB_FILE"
fi

# Check if we can write to the database directory
echo ""
echo "WRITE PERMISSION TEST:"
TEST_FILE="$DB_DIR/test_write_$(date +%s)"
if touch "$TEST_FILE" 2>/dev/null; then
    echo "✅ Can write to database directory"
    rm -f "$TEST_FILE"
else
    echo "❌ Cannot write to database directory"
fi

# Run the Node.js diagnostic
echo ""
echo "RUNNING NODE.JS DIAGNOSTIC:"
node diagnose_auth.js

echo ""
echo "========================================"
echo "DIAGNOSTIC COMPLETE"
echo "========================================"