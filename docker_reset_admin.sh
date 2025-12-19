#!/bin/bash

# Docker Admin Reset Script
# This script resets the admin user in a Docker container

DOCKER_CONTAINER_NAME=${1:-workload-app}

echo "🔧 Docker Admin Reset Script"
echo "============================"
echo "Container: $DOCKER_CONTAINER_NAME"
echo ""

# Check if container exists
if ! docker ps -a --format "table {{.Names}}" | grep -q "^$DOCKER_CONTAINER_NAME$"; then
    echo "❌ Container '$DOCKER_CONTAINER_NAME' not found"
    echo "Available containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

# Check if container is running
if ! docker ps --format "table {{.Names}}" | grep -q "^$DOCKER_CONTAINER_NAME$"; then
    echo "⚠️ Container '$DOCKER_CONTAINER_NAME' is not running"
    echo "Starting container..."
    docker start "$DOCKER_CONTAINER_NAME"
    
    # Wait for container to start
    echo "⏳ Waiting for container to initialize..."
    sleep 5
fi

echo "✅ Container '$DOCKER_CONTAINER_NAME' is running"
echo ""

# Reset admin user in container
echo "🔄 Resetting admin user in container..."
docker exec "$DOCKER_CONTAINER_NAME" node reset_admin_prod.js

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Admin user reset completed successfully"
    echo ""
    echo "📋 Admin credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "🌐 You can now login to the application"
else
    echo ""
    echo "❌ Failed to reset admin user"
    echo "Check container logs for more details:"
    echo "docker logs $DOCKER_CONTAINER_NAME"
fi