#!/bin/bash

# Docker Admin Reset Script for Dokploy
# This script can be executed within the running Docker container to reset the admin user

echo "=== Docker Admin Reset Script for Dokploy ==="

# Check if we're running inside a Docker container
if [ ! -f /.dockerenv ]; then
    echo "⚠️ Warning: This script is designed to run inside a Docker container"
    echo "If you want to run this from the host, use:"
    echo "docker exec -it <container_name> /bin/bash -c 'cd /app && ./docker_reset_admin.sh'"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Change to the app directory
cd /app

# Set production environment variables
export NODE_ENV=production
export DB_PATH=/app/data/database.sqlite

echo "Environment:"
echo "  NODE_ENV: $NODE_ENV"
echo "  DB_PATH: $DB_PATH"
echo ""

# Run the admin reset script
echo "Running admin reset script..."
node reset_admin_prod.js

echo ""
echo "=== Script execution complete ==="