#!/bin/bash

# =============================================================================
# DOKPLOY VOLUME MOUNTING CONFIGURATION SCRIPT
# =============================================================================
# This script helps configure volume mounting for Dokploy applications
# Author: Workload App Team
# Version: 1.0
# =============================================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
APP_NAME="workload-app"
VOLUME_BASE_DIR="/opt/dokploy/volumes"
DB_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/database"
UPLOADS_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/uploads"
LOGS_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/logs"
BACKUP_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/backups"

# Function to print colored output
print_status() {
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

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root or with sudo privileges"
        echo "Please run: sudo ./setup-dokploy-volume.sh"
        exit 1
    fi
}

# Function to display banner
display_banner() {
    echo -e "${BLUE}"
    echo "=================================================================="
    echo "    DOKPLOY VOLUME MOUNTING CONFIGURATION SCRIPT"
    echo "=================================================================="
    echo -e "${NC}"
    echo "This script will configure volume mounting for your Dokploy application."
    echo "It will create the necessary directories and set proper permissions."
    echo ""
}

# Function to prompt for custom values
prompt_custom_values() {
    echo -e "${YELLOW}Default Configuration:${NC}"
    echo "  App Name: $APP_NAME"
    echo "  Base Volume Directory: $VOLUME_BASE_DIR"
    echo ""
    
    read -p "Do you want to use these default values? (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter application name [$APP_NAME]: " new_app_name
        if [[ ! -z "$new_app_name" ]]; then
            APP_NAME="$new_app_name"
        fi
        
        read -p "Enter base volume directory [$VOLUME_BASE_DIR]: " new_base_dir
        if [[ ! -z "$new_base_dir" ]]; then
            VOLUME_BASE_DIR="$new_base_dir"
        fi
        
        # Update volume paths with new values
        DB_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/database"
        UPLOADS_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/uploads"
        LOGS_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/logs"
        BACKUP_VOLUME_DIR="$VOLUME_BASE_DIR/$APP_NAME/backups"
    fi
}

# Function to create directory with proper permissions
create_volume_directory() {
    local dir_path=$1
    local dir_name=$2
    local permissions=$3
    
    print_status "Creating $dir_name directory: $dir_path"
    
    if [[ -d "$dir_path" ]]; then
        print_warning "$dir_name directory already exists"
        print_status "Checking existing permissions..."
        
        # Check current permissions
        current_perms=$(stat -c "%a" "$dir_path" 2>/dev/null || echo "unknown")
        print_status "Current permissions: $current_perms"
        
        # Fix permissions if needed
        if [[ "$current_perms" != "$permissions" ]]; then
            print_status "Updating permissions to $permissions..."
            chmod "$permissions" "$dir_path"
            print_success "Permissions updated"
        else
            print_success "Permissions are already correct"
        fi
    else
        print_status "Creating directory structure..."
        mkdir -p "$dir_path"
        chmod "$permissions" "$dir_path"
        print_success "$dir_name directory created with permissions $permissions"
    fi
    
    # Verify directory exists and has correct permissions
    if [[ -d "$dir_path" ]]; then
        actual_perms=$(stat -c "%a" "$dir_path" 2>/dev/null || echo "unknown")
        if [[ "$actual_perms" == "$permissions" ]]; then
            print_success "$dir_name directory verified with correct permissions"
        else
            print_error "Permission verification failed for $dir_name"
            print_error "Expected: $permissions, Got: $actual_perms"
            return 1
        fi
    else
        print_error "Failed to create $dir_name directory"
        return 1
    fi
    
    return 0
}

# Function to set ownership
set_ownership() {
    local dir_path=$1
    local dir_name=$2
    
    print_status "Setting ownership for $dir_name directory..."
    
    # Try to determine the appropriate user/group
    # Default to root:root, but you can customize this based on your setup
    chown -R root:root "$dir_path"
    
    print_success "Ownership set for $dir_name directory"
}

# Function to create .gitkeep files to ensure directories are tracked
create_gitkeep_files() {
    local dir_path=$1
    local dir_name=$2
    
    print_status "Creating .gitkeep file for $dir_name directory..."
    touch "$dir_path/.gitkeep"
    print_success ".gitkeep file created for $dir_name"
}

# Function to verify all directories
verify_directories() {
    print_status "Verifying all volume directories..."
    
    local all_dirs=("$DB_VOLUME_DIR" "$UPLOADS_VOLUME_DIR" "$LOGS_VOLUME_DIR" "$BACKUP_VOLUME_DIR")
    local dir_names=("Database" "Uploads" "Logs" "Backups")
    local all_valid=true
    
    for i in "${!all_dirs[@]}"; do
        local dir="${all_dirs[$i]}"
        local name="${dir_names[$i]}"
        
        if [[ -d "$dir" ]]; then
            print_success "$name directory exists: $dir"
            
            # Check if directory is writable
            if [[ -w "$dir" ]]; then
                print_success "$name directory is writable"
            else
                print_error "$name directory is not writable"
                all_valid=false
            fi
        else
            print_error "$name directory does not exist: $dir"
            all_valid=false
        fi
    done
    
    if [[ "$all_valid" == true ]]; then
        print_success "All volume directories verified successfully"
        return 0
    else
        print_error "Some volume directories failed verification"
        return 1
    fi
}

# Function to display Dokploy dashboard instructions
display_dokploy_instructions() {
    echo ""
    echo -e "${GREEN}==================================================================${NC}"
    echo -e "${GREEN}    DOKPLOY DASHBOARD CONFIGURATION INSTRUCTIONS${NC}"
    echo -e "${GREEN}==================================================================${NC}"
    echo ""
    echo "Follow these steps to add volume mounts in your Dokploy dashboard:"
    echo ""
    echo -e "${YELLOW}1. Access your Dokploy dashboard${NC}"
    echo "   - Open your browser and navigate to your Dokploy instance"
    echo "   - Login with your credentials"
    echo ""
    echo -e "${YELLOW}2. Navigate to your application${NC}"
    echo "   - Click on your application: $APP_NAME"
    echo "   - Go to the 'Settings' tab"
    echo "   - Click on 'Volumes' section"
    echo ""
    echo -e "${YELLOW}3. Add the following volume mounts:${NC}"
    echo ""
    echo "   ${BLUE}Database Volume:${NC}"
    echo "   - Host Path: $DB_VOLUME_DIR"
    echo "   - Container Path: /app/data"
    echo "   - Click 'Add Volume'"
    echo ""
    echo "   ${BLUE}Uploads Volume:${NC}"
    echo "   - Host Path: $UPLOADS_VOLUME_DIR"
    echo "   - Container Path: /app/uploads"
    echo "   - Click 'Add Volume'"
    echo ""
    echo "   ${BLUE}Logs Volume:${NC}"
    echo "   - Host Path: $LOGS_VOLUME_DIR"
    echo "   - Container Path: /app/logs"
    echo "   - Click 'Add Volume'"
    echo ""
    echo "   ${BLUE}Backups Volume:${NC}"
    echo "   - Host Path: $BACKUP_VOLUME_DIR"
    echo "   - Container Path: /app/backups"
    echo "   - Click 'Add Volume'"
    echo ""
    echo -e "${YELLOW}4. Save and redeploy${NC}"
    echo "   - Click 'Save Changes' at the bottom of the page"
    echo "   - Wait for the application to redeploy with the new volumes"
    echo ""
    echo -e "${YELLOW}5. Verify the configuration${NC}"
    echo "   - After redeployment, check that your application can access the volumes"
    echo "   - Test file uploads, database operations, and logging"
    echo ""
    echo -e "${GREEN}==================================================================${NC}"
}

# Function to display summary
display_summary() {
    echo ""
    echo -e "${GREEN}==================================================================${NC}"
    echo -e "${GREEN}    VOLUME CONFIGURATION SUMMARY${NC}"
    echo -e "${GREEN}==================================================================${NC}"
    echo ""
    echo "Application Name: $APP_NAME"
    echo "Base Volume Directory: $VOLUME_BASE_DIR"
    echo ""
    echo "Created Directories:"
    echo "  Database:  $DB_VOLUME_DIR"
    echo "  Uploads:   $UPLOADS_VOLUME_DIR"
    echo "  Logs:      $LOGS_VOLUME_DIR"
    echo "  Backups:   $BACKUP_VOLUME_DIR"
    echo ""
    echo "All directories have been created with proper permissions and ownership."
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Follow the Dokploy dashboard instructions above"
    echo "2. Redeploy your application"
    echo "3. Test that data persistence is working correctly"
    echo ""
    echo -e "${GREEN}Volume configuration completed successfully!${NC}"
}

# Main execution function
main() {
    display_banner
    
    # Check if running as root
    check_root
    
    # Prompt for custom values
    prompt_custom_values
    
    echo ""
    print_status "Starting volume configuration for application: $APP_NAME"
    print_status "Base directory: $VOLUME_BASE_DIR"
    echo ""
    
    # Create base volume directory
    create_volume_directory "$VOLUME_BASE_DIR" "Base Volume" "755"
    
    # Create application-specific directories
    create_volume_directory "$DB_VOLUME_DIR" "Database" "755" || exit 1
    create_volume_directory "$UPLOADS_VOLUME_DIR" "Uploads" "755" || exit 1
    create_volume_directory "$LOGS_VOLUME_DIR" "Logs" "755" || exit 1
    create_volume_directory "$BACKUP_VOLUME_DIR" "Backups" "755" || exit 1
    
    # Set ownership for all directories
    set_ownership "$DB_VOLUME_DIR" "Database"
    set_ownership "$UPLOADS_VOLUME_DIR" "Uploads"
    set_ownership "$LOGS_VOLUME_DIR" "Logs"
    set_ownership "$BACKUP_VOLUME_DIR" "Backups"
    
    # Create .gitkeep files
    create_gitkeep_files "$DB_VOLUME_DIR" "Database"
    create_gitkeep_files "$UPLOADS_VOLUME_DIR" "Uploads"
    create_gitkeep_files "$LOGS_VOLUME_DIR" "Logs"
    create_gitkeep_files "$BACKUP_VOLUME_DIR" "Backups"
    
    # Verify all directories
    verify_directories || exit 1
    
    # Display Dokploy instructions
    display_dokploy_instructions
    
    # Display summary
    display_summary
}

# Error handling
trap 'print_error "Script failed at line $LINENO"' ERR

# Run main function
main "$@"