#!/bin/bash

# Host Permission Fix Script for Dokploy Volume Mounting
# This script helps fix permission issues on the host server

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
    echo "Usage: $0 [OPTIONS] VOLUME_PATH"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --user UID          Target user ID (default: 1000)"
    echo "  -g, --group GID         Target group ID (default: 1000)"
    echo "  -o, --owner USER:GROUP  Set owner using user:group format"
    echo "  -p, --permissions MODE  Set directory permissions (default: 755)"
    echo "  -r, --recursive         Apply changes recursively"
    echo "  -d, --dry-run           Show what would be changed without making changes"
    echo "  -f, --force             Force changes even if they seem incorrect"
    echo ""
    echo "Examples:"
    echo "  $0 /host/path/to/volume"
    echo "  $0 -u 1000 -g 1000 -r /host/path/to/volume"
    echo "  $0 -o appuser:appgroup -p 775 -r /host/path/to/volume"
    echo "  $0 -d -r /host/path/to/volume"
}

# Default values
TARGET_UID=1000
TARGET_GID=1000
TARGET_OWNER=""
PERMISSIONS=755
RECURSIVE=false
DRY_RUN=false
FORCE=false
VOLUME_PATH=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -u|--user)
            TARGET_UID="$2"
            shift 2
            ;;
        -g|--group)
            TARGET_GID="$2"
            shift 2
            ;;
        -o|--owner)
            TARGET_OWNER="$2"
            shift 2
            ;;
        -p|--permissions)
            PERMISSIONS="$2"
            shift 2
            ;;
        -r|--recursive)
            RECURSIVE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -*)
            print_status "error" "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$VOLUME_PATH" ]; then
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

# Check if volume path is provided
if [ -z "$VOLUME_PATH" ]; then
    print_status "error" "Volume path is required"
    show_usage
    exit 1
fi

print_status "info" "Fixing permissions for volume: $VOLUME_PATH"

# Check if volume path exists
if [ ! -e "$VOLUME_PATH" ]; then
    print_status "error" "Volume path $VOLUME_PATH does not exist"
    exit 1
fi

# Get current ownership and permissions
if [ -d "$VOLUME_PATH" ]; then
    CURRENT_UID=$(stat -c "%u" "$VOLUME_PATH")
    CURRENT_GID=$(stat -c "%g" "$VOLUME_PATH")
    CURRENT_PERM=$(stat -c "%a" "$VOLUME_PATH")
    TYPE="directory"
else
    CURRENT_UID=$(stat -c "%u" "$VOLUME_PATH")
    CURRENT_GID=$(stat -c "%g" "$VOLUME_PATH")
    CURRENT_PERM=$(stat -c "%a" "$VOLUME_PATH")
    TYPE="file"
fi

print_status "info" "Current $TYPE ownership: $CURRENT_UID:$CURRENT_GID"
print_status "info" "Current $TYPE permissions: $CURRENT_PERM"

# Determine target owner
if [ -n "$TARGET_OWNER" ]; then
    # Parse user:group format
    TARGET_USER=$(echo "$TARGET_OWNER" | cut -d: -f1)
    TARGET_GROUP=$(echo "$TARGET_OWNER" | cut -d: -f2)
    
    # Get UID and GID from user and group names
    if id "$TARGET_USER" >/dev/null 2>&1; then
        TARGET_UID=$(id -u "$TARGET_USER")
    else
        print_status "warning" "User $TARGET_USER does not exist, using UID $TARGET_UID"
    fi
    
    if getent group "$TARGET_GROUP" >/dev/null 2>&1; then
        TARGET_GID=$(getent group "$TARGET_GROUP" | cut -d: -f3)
    else
        print_status "warning" "Group $TARGET_GROUP does not exist, using GID $TARGET_GID"
    fi
fi

print_status "info" "Target ownership: $TARGET_UID:$TARGET_GID"
print_status "info" "Target permissions: $PERMISSIONS"

# Check if changes are needed
if [ "$CURRENT_UID" = "$TARGET_UID" ] && [ "$CURRENT_GID" = "$TARGET_GID" ] && [ "$CURRENT_PERM" = "$PERMISSIONS" ]; then
    print_status "success" "Ownership and permissions are already correct"
    exit 0
fi

# Show what will be changed
if [ "$DRY_RUN" = true ]; then
    print_status "info" "DRY RUN - The following changes would be made:"
    
    if [ "$CURRENT_UID" != "$TARGET_UID" ] || [ "$CURRENT_GID" != "$TARGET_GID" ]; then
        echo "  chown $([ "$RECURSIVE" = true ] && echo "-R") $TARGET_UID:$TARGET_GID $VOLUME_PATH"
    fi
    
    if [ "$CURRENT_PERM" != "$PERMISSIONS" ]; then
        echo "  chmod $([ "$RECURSIVE" = true ] && echo "-R") $PERMISSIONS $VOLUME_PATH"
    fi
    
    exit 0
fi

# Confirm changes unless force is used
if [ "$FORCE" = false ]; then
    echo ""
    print_status "warning" "This will change ownership and/or permissions of $VOLUME_PATH"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "info" "Operation cancelled"
        exit 0
    fi
fi

# Fix ownership
if [ "$CURRENT_UID" != "$TARGET_UID" ] || [ "$CURRENT_GID" != "$TARGET_GID" ]; then
    print_status "info" "Changing ownership to $TARGET_UID:$TARGET_GID..."
    
    if [ "$RECURSIVE" = true ]; then
        chown -R "$TARGET_UID:$TARGET_GID" "$VOLUME_PATH"
    else
        chown "$TARGET_UID:$TARGET_GID" "$VOLUME_PATH"
    fi
    
    if [ $? -eq 0 ]; then
        print_status "success" "Ownership changed successfully"
    else
        print_status "error" "Failed to change ownership"
        exit 1
    fi
fi

# Fix permissions
if [ "$CURRENT_PERM" != "$PERMISSIONS" ]; then
    print_status "info" "Changing permissions to $PERMISSIONS..."
    
    if [ "$RECURSIVE" = true ]; then
        chmod -R "$PERMISSIONS" "$VOLUME_PATH"
    else
        chmod "$PERMISSIONS" "$VOLUME_PATH"
    fi
    
    if [ $? -eq 0 ]; then
        print_status "success" "Permissions changed successfully"
    else
        print_status "error" "Failed to change permissions"
        exit 1
    fi
fi

# Special handling for directories - ensure subdirectories have execute permission
if [ -d "$VOLUME_PATH" ] && [ "$RECURSIVE" = true ]; then
    print_status "info" "Ensuring subdirectories have execute permission..."
    find "$VOLUME_PATH" -type d -exec chmod a+x {} \;
fi

# Special handling for files - ensure they have read permission
if [ -d "$VOLUME_PATH" ] && [ "$RECURSIVE" = true ]; then
    print_status "info" "Ensuring files have read permission..."
    find "$VOLUME_PATH" -type f -exec chmod a+r {} \;
fi

# Verify changes
NEW_UID=$(stat -c "%u" "$VOLUME_PATH")
NEW_GID=$(stat -c "%g" "$VOLUME_PATH")
NEW_PERM=$(stat -c "%a" "$VOLUME_PATH")

print_status "info" "New ownership: $NEW_UID:$NEW_GID"
print_status "info" "New permissions: $NEW_PERM"

if [ "$NEW_UID" = "$TARGET_UID" ] && [ "$NEW_GID" = "$TARGET_GID" ] && [ "$NEW_PERM" = "$PERMISSIONS" ]; then
    print_status "success" "All changes applied successfully"
else
    print_status "error" "Some changes could not be applied"
    exit 1
fi

# Additional recommendations
echo ""
print_status "info" "Additional recommendations:"
echo "1. If you're using Docker, consider adding these environment variables to your container:"
echo "   - PUID=$TARGET_UID"
echo "   - PGID=$TARGET_GID"
echo ""
echo "2. For persistent permission fixes, add this script to your deployment process"
echo ""
echo "3. If you're still experiencing issues, check for SELinux or AppArmor restrictions:"
echo "   - For SELinux: sudo setenforce 0 (temporary) or sudo chcon -Rt svirt_sandbox_file_t $VOLUME_PATH"
echo "   - For AppArmor: Check /var/log/kern.log for denials"

echo ""
print_status "info" "For more information, see FIX_PERMISSION_GUIDE.md"