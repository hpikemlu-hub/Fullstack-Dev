#!/bin/bash

# =============================================================================
# SIMPLE DOKPLOY VOLUME SETUP SCRIPT
# =============================================================================
# This script creates necessary directories for Dokploy volume mounting
# and sets proper permissions
# =============================================================================

# Exit on any error
set -e

# Default values
APP_NAME="workload-app"
VOLUME_BASE_DIR="/opt/dokploy/volumes"
DB_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/database"
UPLOADS_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/uploads"
LOGS_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/logs"
BACKUP_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/backups"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo "ERROR: This script must be run as root or with sudo privileges"
    echo "Please run: sudo ./simple-volume-setup.sh"
    exit 1
fi

echo "=================================================================="
echo "    SIMPLE DOKPLOY VOLUME SETUP SCRIPT"
echo "=================================================================="
echo "This script will create directories for volume mounting in Dokploy"
echo ""

echo "Application Name: $APP_NAME"
echo "Base Volume Directory: $VOLUME_BASE_DIR"
echo ""

# Create base volume directory
echo "Creating base volume directory: $VOLUME_BASE_DIR"
if [[ -d "$VOLUME_BASE_DIR" ]]; then
    echo "Base directory already exists"
else
    mkdir -p "$VOLUME_BASE_DIR"
    chmod 755 "$VOLUME_BASE_DIR"
    echo "Base directory created successfully"
fi

# Create database volume directory
echo "Creating database volume directory: $DB_VOLUME_DIR"
if [[ -d "$DB_VOLUME_DIR" ]]; then
    echo "Database directory already exists"
else
    mkdir -p "$DB_VOLUME_DIR"
    chmod 755 "$DB_VOLUME_DIR"
    echo "Database directory created successfully"
fi

# Create uploads volume directory
echo "Creating uploads volume directory: $UPLOADS_VOLUME_DIR"
if [[ -d "$UPLOADS_VOLUME_DIR" ]]; then
    echo "Uploads directory already exists"
else
    mkdir -p "$UPLOADS_VOLUME_DIR"
    chmod 755 "$UPLOADS_VOLUME_DIR"
    echo "Uploads directory created successfully"
fi

# Create logs volume directory
echo "Creating logs volume directory: $LOGS_VOLUME_DIR"
if [[ -d "$LOGS_VOLUME_DIR" ]]; then
    echo "Logs directory already exists"
else
    mkdir -p "$LOGS_VOLUME_DIR"
    chmod 755 "$LOGS_VOLUME_DIR"
    echo "Logs directory created successfully"
fi

# Create backups volume directory
echo "Creating backups volume directory: $BACKUP_VOLUME_DIR"
if [[ -d "$BACKUP_VOLUME_DIR" ]]; then
    echo "Backups directory already exists"
else
    mkdir -p "$BACKUP_VOLUME_DIR"
    chmod 755 "$BACKUP_VOLUME_DIR"
    echo "Backups directory created successfully"
fi

# Set ownership for all directories
echo "Setting ownership for all directories..."
chown -R root:root "$VOLUME_BASE_DIR"
echo "Ownership set successfully"

# Verify all directories exist
echo ""
echo "Verifying all directories..."
if [[ -d "$DB_VOLUME_DIR" ]]; then
    echo "✓ Database directory exists: $DB_VOLUME_DIR"
else
    echo "✗ Database directory missing: $DB_VOLUME_DIR"
fi

if [[ -d "$UPLOADS_VOLUME_DIR" ]]; then
    echo "✓ Uploads directory exists: $UPLOADS_VOLUME_DIR"
else
    echo "✗ Uploads directory missing: $UPLOADS_VOLUME_DIR"
fi

if [[ -d "$LOGS_VOLUME_DIR" ]]; then
    echo "✓ Logs directory exists: $LOGS_VOLUME_DIR"
else
    echo "✗ Logs directory missing: $LOGS_VOLUME_DIR"
fi

if [[ -d "$BACKUP_VOLUME_DIR" ]]; then
    echo "✓ Backups directory exists: $BACKUP_VOLUME_DIR"
else
    echo "✗ Backups directory missing: $BACKUP_VOLUME_DIR"
fi

echo ""
echo "=================================================================="
echo "    DOKPLOY DASHBOARD CONFIGURATION INSTRUCTIONS"
echo "=================================================================="
echo ""
echo "Follow these steps to add volume mounts in your Dokploy dashboard:"
echo ""
echo "1. Access your Dokploy dashboard"
echo "   - Open your browser and navigate to your Dokploy instance"
echo "   - Login with your credentials"
echo ""
echo "2. Navigate to your application"
echo "   - Click on your application: $APP_NAME"
echo "   - Go to the 'Settings' tab"
echo "   - Click on 'Volumes' section"
echo ""
echo "3. Add the following volume mounts:"
echo ""
echo "   Database Volume:"
echo "   - Host Path: $DB_VOLUME_DIR"
echo "   - Container Path: /app/data"
echo "   - Click 'Add Volume'"
echo ""
echo "   Uploads Volume:"
echo "   - Host Path: $UPLOADS_VOLUME_DIR"
echo "   - Container Path: /app/uploads"
echo "   - Click 'Add Volume'"
echo ""
echo "   Logs Volume:"
echo "   - Host Path: $LOGS_VOLUME_DIR"
echo "   - Container Path: /app/logs"
echo "   - Click 'Add Volume'"
echo ""
echo "   Backups Volume:"
echo "   - Host Path: $BACKUP_VOLUME_DIR"
echo "   - Container Path: /app/backups"
echo "   - Click 'Add Volume'"
echo ""
echo "4. Save and redeploy"
echo "   - Click 'Save Changes' at the bottom of the page"
echo "   - Wait for the application to redeploy with the new volumes"
echo ""
echo "5. Verify the configuration"
echo "   - After redeployment, check that your application can access the volumes"
echo "   - Test file uploads, database operations, and logging"
echo ""
echo "=================================================================="
echo "Volume setup completed successfully!"
echo "=================================================================="