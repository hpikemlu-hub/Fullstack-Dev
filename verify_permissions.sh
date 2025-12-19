#!/bin/bash

# Permission Verification Script for Dokploy Volume Mounting
# This script helps verify that volume permissions are correctly set

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "success")
            echo -e "${GREEN}✓ $message${NC}"
            ;;
        "error")
            echo -e "${RED}✗ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠ $message${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ $message${NC}"
            ;;
    esac
}

# Function to display usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [CONTAINER_NAME] [VOLUME_PATH]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -c, --container NAME    Specify container name"
    echo "  -v, --volume PATH       Specify volume path on host"
    echo "  -u, --user UID          Expected user ID (default: 1000)"
    echo "  -g, --group GID         Expected group ID (default: 1000)"
    echo ""
    echo "Examples:"
    echo "  $0 my-app-container /host/path/to/volume"
    echo "  $0 -c my-app-container -v /host/path/to/volume -u 1000 -g 1000"
}

# Default values
CONTAINER_NAME=""
VOLUME_PATH=""
EXPECTED_UID=1000
EXPECTED_GID=1000

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -c|--container)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -v|--volume)
            VOLUME_PATH="$2"
            shift 2
            ;;
        -u|--user)
            EXPECTED_UID="$2"
            shift 2
            ;;
        -g|--group)
            EXPECTED_GID="$2"
            shift 2
            ;;
        -*)
            print_status "error" "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$CONTAINER_NAME" ]; then
                CONTAINER_NAME="$1"
            elif [ -z "$VOLUME_PATH" ]; then
                VOLUME_PATH="$1"
            else
                print_status "error" "Too many arguments"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Check if required arguments are provided
if [ -z "$CONTAINER_NAME" ] || [ -z "$VOLUME_PATH" ]; then
    print_status "error" "Container name and volume path are required"
    show_usage
    exit 1
fi

print_status "info" "Verifying permissions for container: $CONTAINER_NAME"
print_status "info" "Volume path: $VOLUME_PATH"
print_status "info" "Expected user ID: $EXPECTED_UID"
print_status "info" "Expected group ID: $EXPECTED_GID"
echo ""

# Check if container exists and is running
if ! docker ps --format "table {{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
    print_status "error" "Container $CONTAINER_NAME is not running or does not exist"
    exit 1
fi

print_status "success" "Container $CONTAINER_NAME is running"

# Get container user information
print_status "info" "Getting container user information..."
CONTAINER_UID=$(docker exec "$CONTAINER_NAME" id -u)
CONTAINER_GID=$(docker exec "$CONTAINER_NAME" id -g)
print_status "info" "Container user: $CONTAINER_UID:$CONTAINER_GID"

# Check if volume path exists on host
if [ ! -d "$VOLUME_PATH" ]; then
    print_status "error" "Volume path $VOLUME_PATH does not exist on host"
    exit 1
fi

print_status "success" "Volume path exists on host"

# Get volume ownership information
VOLUME_UID=$(stat -c "%u" "$VOLUME_PATH")
VOLUME_GID=$(stat -c "%g" "$VOLUME_PATH")
print_status "info" "Volume owner: $VOLUME_UID:$VOLUME_GID"

# Check if ownership matches
if [ "$CONTAINER_UID" = "$VOLUME_UID" ] && [ "$CONTAINER_GID" = "$VOLUME_GID" ]; then
    print_status "success" "Ownership matches between container and volume"
else
    print_status "error" "Ownership mismatch between container ($CONTAINER_UID:$CONTAINER_GID) and volume ($VOLUME_UID:$VOLUME_GID)"
    
    # Suggest fix
    print_status "info" "To fix ownership, run:"
    echo "sudo chown -R $CONTAINER_UID:$CONTAINER_GID $VOLUME_PATH"
fi

# Check volume permissions
VOLUME_PERM=$(stat -c "%a" "$VOLUME_PATH")
print_status "info" "Volume permissions: $VOLUME_PERM"

if [ "$VOLUME_PERM" = "755" ] || [ "$VOLUME_PERM" = "775" ] || [ "$VOLUME_PERM" = "777" ]; then
    print_status "success" "Volume permissions are adequate"
else
    print_status "warning" "Volume permissions might be too restrictive"
    print_status "info" "To fix permissions, run:"
    echo "sudo chmod 755 $VOLUME_PATH"
fi

# Test write access in container
print_status "info" "Testing write access in container..."

# Create a test file in the mounted volume
TEST_FILE="/app/data/.permission_test_$(date +%s)"
if docker exec "$CONTAINER_NAME" sh -c "echo 'test' > $TEST_FILE" 2>/dev/null; then
    print_status "success" "Write access test passed"
    docker exec "$CONTAINER_NAME" rm -f "$TEST_FILE"
else
    print_status "error" "Write access test failed"
    
    # Try to fix permissions
    print_status "info" "Attempting to fix permissions..."
    docker exec "$CONTAINER_NAME" sh -c "chmod 777 /app/data" 2>/dev/null || true
    
    # Try again
    if docker exec "$CONTAINER_NAME" sh -c "echo 'test' > $TEST_FILE" 2>/dev/null; then
        print_status "success" "Write access test passed after fixing permissions"
        docker exec "$CONTAINER_NAME" rm -f "$TEST_FILE"
    else
        print_status "error" "Write access test still failed after attempting to fix permissions"
    fi
fi

# Test application functionality
print_status "info" "Testing application functionality..."

# Check if application is responding
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    print_status "success" "Application is responding"
else
    print_status "warning" "Application is not responding on port 3000"
    print_status "info" "This might be normal if the application uses a different port or is still starting up"
fi

# Check container logs for permission errors
print_status "info" "Checking container logs for permission errors..."
PERMISSION_ERRORS=$(docker logs "$CONTAINER_NAME" 2>&1 | grep -i "permission\|denied\|eacces\|operation not permitted" | tail -5)

if [ -n "$PERMISSION_ERRORS" ]; then
    print_status "warning" "Found permission-related errors in container logs:"
    echo "$PERMISSION_ERRORS"
else
    print_status "success" "No permission errors found in container logs"
fi

# Summary
echo ""
print_status "info" "Permission verification summary:"
echo "  Container: $CONTAINER_NAME"
echo "  Volume: $VOLUME_PATH"
echo "  Container user: $CONTAINER_UID:$CONTAINER_GID"
echo "  Volume owner: $VOLUME_UID:$VOLUME_GID"
echo "  Volume permissions: $VOLUME_PERM"

if [ "$CONTAINER_UID" = "$VOLUME_UID" ] && [ "$CONTAINER_GID" = "$VOLUME_GID" ]; then
    print_status "success" "✓ Ownership is correct"
else
    print_status "error" "✗ Ownership needs to be fixed"
fi

if [ "$VOLUME_PERM" = "755" ] || [ "$VOLUME_PERM" = "775" ] || [ "$VOLUME_PERM" = "777" ]; then
    print_status "success" "✓ Permissions are adequate"
else
    print_status "warning" "⚠ Permissions might need adjustment"
fi

# Recommendations
echo ""
print_status "info" "Recommendations:"

if [ "$CONTAINER_UID" != "$VOLUME_UID" ] || [ "$CONTAINER_GID" != "$VOLUME_GID" ]; then
    echo "1. Fix ownership: sudo chown -R $CONTAINER_UID:$CONTAINER_GID $VOLUME_PATH"
fi

if [ "$VOLUME_PERM" != "755" ] && [ "$VOLUME_PERM" != "775" ] && [ "$VOLUME_PERM" != "777" ]; then
    echo "2. Fix permissions: sudo chmod 755 $VOLUME_PATH"
fi

echo "3. Consider using PUID and PGID environment variables when running the container"
echo "4. For persistent permission fixes, add them to your deployment script"

echo ""
print_status "info" "For more information, see FIX_PERMISSION_GUIDE.md"