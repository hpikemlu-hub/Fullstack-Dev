#!/bin/bash

# Docker Environment Diagnosis Script
# This script helps diagnose Docker-related issues for the workload app

echo "🐳 Docker Environment Diagnosis"
echo "================================="
echo ""

# 1. Check if Docker is installed
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    docker --version
else
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# 2. Check if Docker is running
echo ""
echo "2. Checking Docker daemon status..."
if docker info &> /dev/null; then
    echo "✅ Docker daemon is running"
else
    echo "❌ Docker daemon is not running"
    echo "Please start Docker daemon and try again"
    exit 1
fi

# 3. Check Docker Compose
echo ""
echo "3. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is installed"
    docker-compose --version
elif docker compose version &> /dev/null; then
    echo "✅ Docker Compose (plugin) is installed"
    docker compose version
else
    echo "⚠️ Docker Compose is not installed"
fi

# 4. Check for existing containers
echo ""
echo "4. Checking for existing containers..."
CONTAINERS=$(docker ps -a --filter "name=workload" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null)
if [ -n "$CONTAINERS" ]; then
    echo "Found workload-related containers:"
    echo "$CONTAINERS"
else
    echo "No workload-related containers found"
fi

# 5. Check for Docker networks
echo ""
echo "5. Checking Docker networks..."
NETWORKS=$(docker network ls --filter "name=workload" --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null)
if [ -n "$NETWORKS" ]; then
    echo "Found workload-related networks:"
    echo "$NETWORKS"
else
    echo "No workload-related networks found"
fi

# 6. Check for Docker volumes
echo ""
echo "6. Checking Docker volumes..."
VOLUMES=$(docker volume ls --filter "name=workload" --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null)
if [ -n "$VOLUMES" ]; then
    echo "Found workload-related volumes:"
    echo "$VOLUMES"
else
    echo "No workload-related volumes found"
fi

# 7. Check Dockerfile exists
echo ""
echo "7. Checking Dockerfile..."
if [ -f "./Dockerfile" ]; then
    echo "✅ Dockerfile found in current directory"
else
    echo "❌ Dockerfile not found in current directory"
fi

# 8. Check docker-compose.yml exists
echo ""
echo "8. Checking docker-compose.yml..."
if [ -f "./docker-compose.yml" ]; then
    echo "✅ docker-compose.yml found in current directory"
elif [ -f "./docker-compose.yaml" ]; then
    echo "✅ docker-compose.yaml found in current directory"
else
    echo "⚠️ docker-compose.yml not found in current directory"
fi

# 9. Check .dockerignore exists
echo ""
echo "9. Checking .dockerignore..."
if [ -f "./.dockerignore" ]; then
    echo "✅ .dockerignore found in current directory"
else
    echo "⚠️ .dockerignore not found in current directory"
fi

# 10. Check available disk space
echo ""
echo "10. Checking available disk space..."
DISK_SPACE=$(df -h . 2>/dev/null | tail -1 | awk '{print $4}')
echo "Available disk space: $DISK_SPACE"

# 11. Check Docker system usage
echo ""
echo "11. Docker system usage..."
docker system df

echo ""
echo "🎉 Docker diagnosis completed!"
echo ""
echo "Common issues and solutions:"
echo "- If Docker daemon is not running: Start Docker Desktop or run 'sudo systemctl start docker'"
echo "- If permission denied: Add your user to docker group with 'sudo usermod -aG docker \$USER'"
echo "- If out of space: Run 'docker system prune -a' to clean up unused Docker resources"