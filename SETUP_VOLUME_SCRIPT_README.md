# Dokploy Volume Mounting Configuration Script

## Overview

The `setup-dokploy-volume.sh` script is a comprehensive bash script designed to help users configure volume mounting for their Dokploy applications. This script automates the process of creating necessary directories, setting proper permissions, and providing clear instructions for configuring volume mounts in the Dokploy dashboard.

## Features

- ✅ Creates required volume directories on the host server
- ✅ Sets proper ownership and permissions
- ✅ Verifies configuration after setup
- ✅ Provides step-by-step instructions for Dokploy dashboard configuration
- ✅ Error handling and validation
- ✅ Clear output with color-coded status messages
- ✅ Checks for existing directories and handles them appropriately
- ✅ Customizable application name and base directory

## Usage

### Prerequisites

- Root or sudo privileges on the server
- Access to the Dokploy dashboard

### Running the Script

1. Make the script executable:
   ```bash
   chmod +x setup-dokploy-volume.sh
   ```

2. Run the script with sudo:
   ```bash
   sudo ./setup-dokploy-volume.sh
   ```

### Script Execution Flow

1. **Initial Setup**
   - Displays banner and introduction
   - Checks for root privileges
   - Prompts for custom values (app name, base directory)

2. **Directory Creation**
   - Creates base volume directory (`/opt/dokploy/volumes` by default)
   - Creates application-specific subdirectories:
     - Database: `/opt/dokploy/volumes/{app-name}/database`
     - Uploads: `/opt/dokploy/volumes/{app-name}/uploads`
     - Logs: `/opt/dokploy/volumes/{app-name}/logs`
     - Backups: `/opt/dokploy/volumes/{app-name}/backups`

3. **Permission and Ownership**
   - Sets directory permissions to 755
   - Sets ownership to root:root
   - Creates .gitkeep files to ensure directories are tracked

4. **Verification**
   - Verifies all directories exist
   - Checks write permissions
   - Reports any issues found

5. **Dashboard Instructions**
   - Provides detailed step-by-step instructions for configuring volume mounts in the Dokploy dashboard
   - Includes exact paths and container mount points

6. **Summary**
   - Displays a summary of all created directories
   - Provides next steps for completing the configuration

## Default Directory Structure

```
/opt/dokploy/volumes/
└── workload-app/
    ├── database/     (mounted to /app/data in container)
    ├── uploads/      (mounted to /app/uploads in container)
    ├── logs/         (mounted to /app/logs in container)
    └── backups/      (mounted to /app/backups in container)
```

## Customization

The script allows customization of:

- **Application Name**: Default is "workload-app"
- **Base Volume Directory**: Default is "/opt/dokploy/volumes"

These can be changed when prompted during script execution.

## Error Handling

The script includes comprehensive error handling:

- Checks for root privileges before execution
- Validates directory creation and permission setting
- Verifies all directories are properly configured
- Provides clear error messages with troubleshooting hints
- Exits gracefully on any error with appropriate status codes

## Output Examples

### Success Messages
```
[SUCCESS] Database directory created with permissions 755
[SUCCESS] Database directory verified with correct permissions
[SUCCESS] All volume directories verified successfully
```

### Warning Messages
```
[WARNING] Database directory already exists
[WARNING] Current permissions: 755
```

### Error Messages
```
[ERROR] This script must be run as root or with sudo privileges
[ERROR] Failed to create Database directory
[ERROR] Permission verification failed for Database
```

## Troubleshooting

### Permission Denied Errors
- Ensure you're running the script with sudo: `sudo ./setup-dokploy-volume.sh`
- Check that your user has sudo privileges

### Directory Already Exists
- The script will handle existing directories gracefully
- It will verify and fix permissions if needed

### Dokploy Dashboard Issues
- Ensure you're using the correct paths as shown in the script output
- Verify your application has permission to access the mounted directories
- Check that the container paths match your application's expected paths

## Integration with Docker

The script is designed to work with Docker containers managed by Dokploy. The default container paths are:

- `/app/data` - For database files
- `/app/uploads` - For user uploads
- `/app/logs` - For application logs
- `/app/backups` - For backup files

These paths should match the paths used in your application's Dockerfile and code.

## Security Considerations

- Directories are created with 755 permissions (readable by all, writable by owner)
- Ownership is set to root:root by default
- Adjust permissions and ownership based on your specific security requirements
- Consider creating a dedicated user for your application if needed

## Support

For issues or questions about this script:

1. Check the script output for specific error messages
2. Verify you have the necessary permissions
3. Ensure your Dokploy instance is properly configured
4. Review the VOLUME_MOUNTING_GUIDE.md for additional context

## Version History

- **v1.0**: Initial release with comprehensive volume mounting configuration