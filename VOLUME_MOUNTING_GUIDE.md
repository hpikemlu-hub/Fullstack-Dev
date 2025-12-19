# Volume Mounting Guide for Database Persistence in Dokploy

## Overview

This guide provides comprehensive instructions for configuring volume mounting in Dokploy to ensure database persistence for the Workload Management Application with the authentication fix. Proper volume mounting is critical for maintaining data across container restarts and deployments.

## Why Volume Mounting is Critical

### Authentication System Dependencies
The authentication fix relies on persistent data storage for:
- **User Database**: Contains all user accounts including the admin user
- **Authentication Tokens**: Stores session information and token metadata
- **Application Settings**: Preserves configuration and system settings
- **Audit Logs**: Maintains authentication and security logs

### Risks Without Proper Volume Mounting
- **Data Loss**: All data is lost when the container restarts
- **Admin User Recreation**: Admin user must be recreated after each restart
- **Authentication Failures**: Users cannot authenticate after container updates
- **Configuration Reset**: All application settings return to defaults

## Required Volume Mounts

### Primary Database Volume
- **Purpose**: Stores the SQLite database file
- **Source**: `/var/lib/dokploy/volumes/workload-app-data`
- **Destination**: `/app/data`
- **Type**: `bind`
- **Critical**: Yes (Required for authentication to work)

### Optional Logs Volume
- **Purpose**: Stores application and authentication logs
- **Source**: `/var/lib/dokploy/volumes/workload-app-logs`
- **Destination**: `/app/logs`
- **Type**: `bind`
- **Critical**: No (Recommended for troubleshooting)

## Step-by-Step Volume Configuration

### Step 1: Create Volume Directories on Dokploy Server

Connect to your Dokploy server via SSH and create the necessary directories:

```bash
# Create database volume directory
sudo mkdir -p /var/lib/dokploy/volumes/workload-app-data

# Create logs volume directory (optional)
sudo mkdir -p /var/lib/dokploy/volumes/workload-app-logs

# Set appropriate permissions
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-logs

# Set directory permissions
sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-data
sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-logs
```

### Step 2: Configure Volumes in Dokploy Dashboard

1. Navigate to your application in the Dokploy dashboard
2. Click on the "Storage" or "Volumes" tab
3. Click "Add Volume"

#### Add Database Volume
- **Type**: Bind Mount
- **Source**: `/var/lib/dokploy/volumes/workload-app-data`
- **Destination**: `/app/data`
- **Read/Write**: Read/Write
- Click "Add Volume"

#### Add Logs Volume (Optional)
- **Type**: Bind Mount
- **Source**: `/var/lib/dokploy/volumes/workload-app-logs`
- **Destination**: `/app/logs`
- **Read/Write**: Read/Write
- Click "Add Volume"

### Step 3: Verify Volume Configuration

After adding volumes, verify the configuration:

1. Check the volumes list in Dokploy dashboard
2. Ensure both volumes appear with correct paths
3. Verify the status shows "Active" or "Connected"

## Volume Configuration Examples

### Basic Configuration (Minimum Required)
```yaml
volumes:
  - type: bind
    source: /var/lib/dokploy/volumes/workload-app-data
    destination: /app/data
    read_write: true
```

### Complete Configuration (Recommended)
```yaml
volumes:
  - type: bind
    source: /var/lib/dokploy/volumes/workload-app-data
    destination: /app/data
    read_write: true
  
  - type: bind
    source: /var/lib/dokploy/volumes/workload-app-logs
    destination: /app/logs
    read_write: true
```

## File Structure in Volumes

### Database Volume Structure
```
/var/lib/dokploy/volumes/workload-app-data/
├── database.sqlite          # Main SQLite database
├── database.sqlite-journal  # SQLite journal file
├── database_backup_*.sqlite # Backup files (if created)
└── .write_test             # Temporary test files (auto-deleted)
```

### Logs Volume Structure
```
/var/lib/dokploy/volumes/workload-app-logs/
├── app.log                  # Application logs
├── auth.log                 # Authentication logs
├── error.log                # Error logs
└── access.log               # Access logs
```

## Verification and Testing

### Step 1: Deploy Application with Volumes

1. Save the volume configuration
2. Redeploy your application
3. Wait for deployment to complete

### Step 2: Verify Volume Mounting

Access the container shell and verify volumes:

```bash
# Access container shell (via Dokploy terminal)
dokploy exec <container-id> sh

# Check if database directory exists and is writable
ls -la /app/data

# Test write permissions
echo "test" > /app/data/.write_test && rm /app/data/.write_test

# Check database file
ls -la /app/data/database.sqlite

# Check volume mount information
mount | grep /app/data
```

### Step 3: Test Data Persistence

1. Create a test user through the application
2. Stop and restart the application
3. Verify the test user still exists
4. Check database file persists across restarts

```bash
# Before restart
sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM users;"

# Restart application
# After restart
sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM users;"
```

## Troubleshooting Volume Issues

### Issue 1: Volume Not Mounted

**Symptoms**:
- Database file not found
- Admin user recreated after each restart
- Data loss on container restart

**Solutions**:
1. Check volume configuration in Dokploy dashboard
2. Verify source directory exists on server
3. Check permissions on source directory
4. Restart the application

```bash
# Check if source directory exists
ls -la /var/lib/dokploy/volumes/workload-app-data

# Check permissions
stat /var/lib/dokploy/volumes/workload-app-data

# Fix permissions if needed
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data
sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-data
```

### Issue 2: Permission Denied

**Symptoms**:
- Database write errors
- Container startup failures
- Authentication system errors

**Solutions**:
1. Check directory permissions
2. Verify user ID matches container user
3. Fix ownership and permissions

```bash
# Check current permissions
ls -la /var/lib/dokploy/volumes/workload-app-data

# Fix ownership
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data

# Fix permissions
sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-data

# Check container user ID
dokploy exec <container-id> id
```

### Issue 3: Database Corruption

**Symptoms**:
- Database connection errors
- Authentication failures
- Data inconsistency

**Solutions**:
1. Check database integrity
2. Restore from backup if available
3. Recreate database if necessary

```bash
# Check database integrity
sqlite3 /app/data/database.sqlite "PRAGMA integrity_check;"

# If corruption detected, recreate database
mv /app/data/database.sqlite /app/data/database.sqlite.corrupted
# Restart application to recreate database
```

## Backup and Recovery

### Manual Database Backup

Create regular backups of the database:

```bash
# Access container shell
dokploy exec <container-id> sh

# Create backup with timestamp
cp /app/data/database.sqlite /app/data/database_backup_$(date +%Y%m%d_%H%M%S).sqlite

# List backups
ls -la /app/data/database_backup_*

# Copy backup to host (if needed)
docker cp <container-id>:/app/data/database_backup_20231201_120000.sqlite ./backup/
```

### Automated Backup Script

Create a backup script for automated backups:

```bash
#!/bin/bash
# backup_database.sh

BACKUP_DIR="/app/data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="database_backup_${TIMESTAMP}.sqlite"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
cp /app/data/database.sqlite $BACKUP_DIR/$BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "database_backup_*.sqlite" -mtime +7 -delete

echo "Backup created: $BACKUP_DIR/$BACKUP_FILE"
```

### Database Recovery

Restore database from backup:

```bash
# Access container shell
dokploy exec <container-id> sh

# Stop application (if possible)
# Or stop container

# Restore from backup
cp /app/data/backups/database_backup_20231201_120000.sqlite /app/data/database.sqlite

# Fix permissions
chmod 664 /app/data/database.sqlite

# Start application
```

## Advanced Volume Configuration

### Using Docker Volumes (Alternative)

If you prefer Docker-managed volumes:

```bash
# Create Docker volume
docker volume create workload-app-data

# Use in Dokploy configuration
# Type: Volume
# Source: workload-app-data
# Destination: /app/data
```

### Network File System (NFS) for High Availability

For high-availability setups:

```bash
# Mount NFS share
sudo mount -t nfs nfs-server:/path/to/share /var/lib/dokploy/volumes/workload-app-data

# Add to fstab for persistence
echo "nfs-server:/path/to/share /var/lib/dokploy/volumes/workload-app-data nfs defaults 0 0" >> /etc/fstab
```

## Performance Optimization

### Database Performance

1. **SSD Storage**: Use SSD storage for better I/O performance
2. **Separate Volumes**: Use separate volumes for database and logs
3. **Regular Maintenance**: Implement database vacuum and optimization

```bash
# Database maintenance (run periodically)
sqlite3 /app/data/database.sqlite "VACUUM;"
sqlite3 /app/data/database.sqlite "ANALYZE;"
```

### Monitoring Volume Usage

Monitor disk space usage:

```bash
# Check volume size
du -sh /var/lib/dokploy/volumes/workload-app-data

# Check database size
ls -lh /app/data/database.sqlite

# Monitor growth
watch -n 60 'du -sh /var/lib/dokploy/volumes/workload-app-data'
```

## Security Considerations

### Volume Security

1. **Permissions**: Ensure proper file permissions
2. **Encryption**: Consider encryption for sensitive data
3. **Access Control**: Limit access to volume directories
4. **Backup Security**: Secure backup files

```bash
# Set secure permissions
chmod 700 /var/lib/dokploy/volumes/workload-app-data
chmod 600 /app/data/database.sqlite

# Encrypt backup files
gpg --symmetric --cipher-algo AES256 database_backup_20231201.sqlite
```

## Best Practices

### Volume Management

1. **Consistent Paths**: Use consistent paths across environments
2. **Documentation**: Document volume configurations
3. **Monitoring**: Monitor volume health and usage
4. **Testing**: Test volume configuration before production

### Backup Strategy

1. **Regular Backups**: Implement automated backup schedule
2. **Off-site Storage**: Store backups off-site
3. **Recovery Testing**: Test recovery procedures regularly
4. **Retention Policy**: Define backup retention policy

## Quick Reference

### Essential Commands
```bash
# Create volume directories
sudo mkdir -p /var/lib/dokploy/volumes/workload-app-data

# Set permissions
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data
sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-data

# Check volume mounting
dokploy exec <container-id> mount | grep /app/data

# Test write permissions
dokploy exec <container-id> sh -c "echo test > /app/data/.test && rm /app/data/.test"

# Create backup
dokploy exec <container-id> sh -c "cp /app/data/database.sqlite /app/data/backup_$(date +%Y%m%d).sqlite"
```

### Volume Configuration
```yaml
# Required
Source: /var/lib/dokploy/volumes/workload-app-data
Destination: /app/data
Type: bind
Read/Write: true

# Optional
Source: /var/lib/dokploy/volumes/workload-app-logs
Destination: /app/logs
Type: bind
Read/Write: true
```

### Troubleshooting Commands
```bash
# Check permissions
ls -la /var/lib/dokploy/volumes/workload-app-data

# Fix permissions
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data

# Check database integrity
dokploy exec <container-id> sqlite3 /app/data/database.sqlite "PRAGMA integrity_check;"
```

## Conclusion

Proper volume mounting is essential for the authentication system to work correctly in Dokploy. By following this guide, you ensure:

1. **Data Persistence**: Database and user data persist across restarts
2. **Authentication Stability**: Admin user and authentication data are maintained
3. **Recovery Capability**: Backup and recovery procedures are in place
4. **Security**: Proper permissions and access controls are implemented

Remember that the authentication fix depends entirely on proper volume configuration. Without it, the authentication system will fail repeatedly.