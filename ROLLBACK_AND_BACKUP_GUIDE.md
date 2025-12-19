# Rollback and Backup Guide for Dokploy Deployment

## Overview

This guide provides comprehensive procedures for creating backups and performing rollbacks for the Workload Management Application deployed on Dokploy with authentication fix. Proper backup and rollback procedures are essential for maintaining system stability and quickly recovering from deployment issues.

## Backup Strategy

### Backup Types and Frequency

| Backup Type | Frequency | Retention | Purpose |
|--------------|------------|------------|---------|
| Database Backup | Daily | 30 days | User data and authentication data |
| Application Backup | Before deployments | 5 versions | Code and configuration |
| Configuration Backup | When changed | 10 versions | Environment variables and settings |
| Volume Backup | Weekly | 4 weeks | Complete data volume |

### Critical Components to Backup

1. **SQLite Database** (`/app/data/database.sqlite`)
   - Contains all user accounts and authentication data
   - Stores application data and settings
   - Critical for authentication system

2. **Environment Variables**
   - JWT_SECRET and security configurations
   - Database and CORS settings
   - Application-specific configurations

3. **Application Code**
   - Current deployed version
   - Docker configuration
   - Authentication fixes and customizations

4. **Volume Data**
   - Complete `/app/data` directory
   - Log files and temporary data
   - Backup files and archives

## Database Backup Procedures

### Manual Database Backup

#### Method 1: Direct Database Copy
```bash
# Access container shell (via Dokploy terminal)
dokploy exec <container-id> sh

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp /app/data/database.sqlite /app/data/database_backup_${TIMESTAMP}.sqlite

# Verify backup
ls -la /app/data/database_backup_${TIMESTAMP}.sqlite

# Test backup integrity
sqlite3 /app/data/database_backup_${TIMESTAMP}.sqlite "PRAGMA integrity_check;"
```

#### Method 2: SQL Export
```bash
# Access container shell
dokploy exec <container-id> sh

# Export database as SQL
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sqlite3 /app/data/database.sqlite .dump > /app/data/database_export_${TIMESTAMP}.sql

# Compress the export
gzip /app/data/database_export_${TIMESTAMP}.sql
```

#### Method 3: Automated Backup Script
```bash
#!/bin/bash
# automated_backup.sh

BACKUP_DIR="/app/data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
cp /app/data/database.sqlite $BACKUP_DIR/database_backup_${TIMESTAMP}.sqlite

# Create compressed backup
gzip -c $BACKUP_DIR/database_backup_${TIMESTAMP}.sqlite > $BACKUP_DIR/database_backup_${TIMESTAMP}.sqlite.gz

# Remove uncompressed backup
rm $BACKUP_DIR/database_backup_${TIMESTAMP}.sqlite

# Clean old backups
find $BACKUP_DIR -name "database_backup_*.sqlite.gz" -mtime +$RETENTION_DAYS -delete

# Log backup operation
echo "Database backup created: database_backup_${TIMESTAMP}.sqlite.gz" >> $BACKUP_DIR/backup.log

# Verify backup
if [ -f "$BACKUP_DIR/database_backup_${TIMESTAMP}.sqlite.gz" ]; then
    echo "✓ Backup successful"
else
    echo "✗ Backup failed"
    exit 1
fi
```

### Copying Backups to Host

#### Method 1: Docker Copy
```bash
# Copy backup to host machine
docker cp <container-id>:/app/data/database_backup_20231201_120000.sqlite.gz ./backups/

# Verify copy
ls -la ./backups/database_backup_20231201_120000.sqlite.gz
```

#### Method 2: SCP Transfer
```bash
# From Dokploy server to remote location
scp /var/lib/dokploy/volumes/workload-app-data/database_backup_20231201_120000.sqlite.gz \
  user@backup-server:/backups/workload-app/
```

### Automated Backup Setup

#### Method 1: Cron Job in Container
```bash
# Add to container's crontab
# Access container shell
dokploy exec <container-id> sh

# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /app/data/automated_backup.sh

# Restart cron service
service cron restart
```

#### Method 2: Host-Level Cron Job
```bash
# On Dokploy server, create host backup script
sudo nano /usr/local/bin/backup-workload-app.sh

#!/bin/bash
CONTAINER_ID="<container-id>"
BACKUP_DIR="/var/backups/workload-app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Create backup inside container
docker exec $CONTAINER_ID sh -c "cp /app/data/database.sqlite /app/data/database_backup_${TIMESTAMP}.sqlite"

# Copy backup to host
docker cp $CONTAINER_ID:/app/data/database_backup_${TIMESTAMP}.sqlite $BACKUP_DIR/

# Compress backup
gzip $BACKUP_DIR/database_backup_${TIMESTAMP}.sqlite

# Clean up inside container
docker exec $CONTAINER_ID rm /app/data/database_backup_${TIMESTAMP}.sqlite

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "database_backup_*.sqlite.gz" -mtime +30 -delete

echo "Backup completed: database_backup_${TIMESTAMP}.sqlite.gz"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-workload-app.sh

# Add to crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-workload-app.sh >> /var/log/backup-workload-app.log 2>&1
```

## Configuration Backup

### Environment Variables Backup
```bash
# Export environment variables
dokploy exec <container-id> env > environment_backup_$(date +%Y%m%d_%H%M%S).txt

# Filter application-specific variables
dokploy exec <container-id> env | grep -E "(NODE_ENV|JWT_SECRET|CORS_ORIGIN|DB_PATH)" > config_backup_$(date +%Y%m%d_%H%M%S).txt
```

### Dokploy Configuration Backup
```bash
# Export application configuration
dokploy export <app-id> > dokploy_config_$(date +%Y%m%d).json

# Backup deployment settings
dokploy get <app-id> > deployment_config_$(date +%Y%m%d).json
```

## Volume Backup Procedures

### Complete Volume Backup
```bash
# On Dokploy server
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SOURCE_DIR="/var/lib/dokploy/volumes/workload-app-data"
BACKUP_DIR="/var/backups/workload-app-volumes"

mkdir -p $BACKUP_DIR

# Create compressed archive
tar -czf $BACKUP_DIR/volume_backup_${TIMESTAMP}.tar.gz -C $SOURCE_DIR .

# Verify archive
tar -tzf $BACKUP_DIR/volume_backup_${TIMESTAMP}.tar.gz | head -10

# Clean old backups (keep 4 weeks)
find $BACKUP_DIR -name "volume_backup_*.tar.gz" -mtime +28 -delete
```

### Incremental Volume Backup
```bash
#!/bin/bash
# incremental_volume_backup.sh

SOURCE_DIR="/var/lib/dokploy/volumes/workload-app-data"
BACKUP_DIR="/var/backups/workload-app-volumes"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_FILE="$BACKUP_DIR/.last_backup"

mkdir -p $BACKUP_DIR

# Create incremental backup
if [ -f "$SNAPSHOT_FILE" ]; then
    # Incremental backup
    tar --create --file=- --listed-incremental=$SNAPSHOT_FILE -C $SOURCE_DIR . | \
    gzip > $BACKUP_DIR/incremental_backup_${TIMESTAMP}.tar.gz
else
    # Full backup
    tar -czf $BACKUP_DIR/full_backup_${TIMESTAMP}.tar.gz -C $SOURCE_DIR .
    touch $SNAPSHOT_FILE
fi

echo "Backup completed: ${TIMESTAMP}"
```

## Rollback Procedures

### Database Rollback

#### Method 1: Restore from Database Backup
```bash
# Access container shell
dokploy exec <container-id> sh

# Stop application (if possible)
# Or stop container: dokploy stop <container-id>

# Create current database backup (just in case)
cp /app/data/database.sqlite /app/data/database_before_restore_$(date +%Y%m%d_%H%M%S).sqlite

# Restore from backup
cp /app/data/database_backup_20231201_120000.sqlite /app/data/database.sqlite

# Fix permissions
chmod 664 /app/data/database.sqlite

# Verify restored database
sqlite3 /app/data/database.sqlite "PRAGMA integrity_check;"
sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM users WHERE role='Admin';"

# Start application
# dokploy start <container-id>
```

#### Method 2: Restore from SQL Export
```bash
# Access container shell
dokploy exec <container-id> sh

# Backup current database
mv /app/data/database.sqlite /app/data/database_before_restore_$(date +%Y%m%d_%H%M%S).sqlite

# Create new database from SQL export
gunzip -c /app/data/database_export_20231201_120000.sql.gz | sqlite3 /app/data/database.sqlite

# Verify restore
sqlite3 /app/data/database.sqlite "PRAGMA integrity_check;"

# Start application
```

#### Method 3: Point-in-Time Recovery
```bash
# If you have WAL mode enabled and journal files
# Access container shell
dokploy exec <container-id> sh

# Check available journal files
ls -la /app/data/database.sqlite*

# Use journal file for recovery
cp /app/data/database.sqlite-wal /app/data/database_recovered.sqlite

# Verify recovered database
sqlite3 /app/data/database_recovered.sqlite "PRAGMA integrity_check;"

# If successful, replace original
mv /app/data/database.sqlite /app/data/database_corrupted_$(date +%Y%m%d_%H%M%S).sqlite
mv /app/data/database_recovered.sqlite /app/data/database.sqlite
```

### Application Rollback

#### Method 1: Dokploy Deployment Rollback
```bash
# List recent deployments
dokploy deployments list <app-id>

# Rollback to specific deployment
dokploy rollback <app-id> <deployment-id>

# Or rollback to previous deployment
dokploy rollback <app-id> --previous
```

#### Method 2: Manual Code Rollback
```bash
# Clone specific version
git clone https://github.com/your-repo.git --branch <tag-or-commit> rollback-version

# Push rollback version to main branch
cd rollback-version
git push -f origin main

# Trigger deployment in Dokploy
# Or wait for automatic deployment
```

#### Method 3: Container Rebuild with Previous Version
```bash
# Get previous Docker image
docker images | grep workload-app

# Tag previous version
docker tag workload-app:previous workload-app:latest

# Redeploy with previous image
dokploy deploy <app-id> --image workload-app:latest
```

### Configuration Rollback

#### Environment Variables Rollback
```bash
# Restore from backup file
dokploy exec <container-id> sh -c "cat config_backup_20231201_120000.txt" > temp_config.txt

# Update environment variables in Dokploy dashboard
# Or use API to update:
dokploy set-env <app-id> --from-file temp_config.txt

# Restart application
dokploy restart <container-id>
```

### Complete System Rollback

#### Full System Restore
```bash
# Stop application
dokploy stop <container-id>

# Restore volume from backup
cd /var/lib/dokploy/volumes/
rm -rf workload-app-data
tar -xzf /var/backups/workload-app-volumes/volume_backup_20231201_120000.tar.gz

# Restore environment variables
dokploy set-env <app-id> --from-file /var/backups/config_backup_20231201_120000.txt

# Start application
dokploy start <container-id>

# Verify restoration
curl -f https://your-app.dokploy.app/health
```

## Disaster Recovery

### Complete System Failure Recovery

#### Step 1: Assess Damage
```bash
# Check container status
dokploy ps | grep <app-id>

# Check volume integrity
ls -la /var/lib/dokploy/volumes/workload-app-data/

# Check last backup availability
ls -la /var/backups/workload-app/
```

#### Step 2: Prepare New Environment
```bash
# Create new application in Dokploy (if needed)
dokploy create-app --name workload-app-recovery --source github --repo your-repo

# Configure environment variables from backup
dokploy set-env workload-app-recovery --from-file /var/backups/config_backup_latest.txt

# Configure volume mounting
dokploy add-volume workload-app-recovery \
  --source /var/lib/dokploy/volumes/workload-app-data-recovery \
  --destination /app/data
```

#### Step 3: Restore Data
```bash
# Restore database from latest backup
cp /var/backups/workload-app/database_backup_latest.sqlite \
  /var/lib/dokploy/volumes/workload-app-data-recovery/database.sqlite

# Set correct permissions
chown 1001:1001 /var/lib/dokploy/volumes/workload-app-data-recovery/database.sqlite
chmod 664 /var/lib/dokploy/volumes/workload-app-data-recovery/database.sqlite
```

#### Step 4: Verify Recovery
```bash
# Start recovered application
dokploy start workload-app-recovery

# Test authentication
curl -X POST https://workload-app-recovery.dokploy.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test data integrity
sqlite3 /var/lib/dokploy/volumes/workload-app-data-recovery/database.sqlite "SELECT COUNT(*) FROM users;"
```

## Testing Backup and Recovery Procedures

### Backup Testing
```bash
#!/bin/bash
# test_backup_recovery.sh

echo "Testing Backup and Recovery Procedures..."

# Create test data
curl -X POST https://your-app.dokploy.app/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"test-backup-user","password":"testpass","nama":"Test Backup User","role":"User"}'

# Create backup
./automated_backup.sh

# Delete test user
USER_ID=$(curl -s -X GET https://your-app.dokploy.app/api/users \
  -H "Authorization: Bearer $TOKEN" | \
  jq -r '.users[] | select(.username=="test-backup-user") | .id')

curl -X DELETE https://your-app.dokploy.app/api/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"

# Restore from backup
LATEST_BACKUP=$(ls -t /app/data/backups/database_backup_*.sqlite.gz | head -1)
gunzip -c $LATEST_BACKUP > /app/data/database.sqlite

# Verify test user is restored
TEST_USER_EXISTS=$(sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM users WHERE username='test-backup-user';")

if [ $TEST_USER_EXISTS -eq 1 ]; then
    echo "✓ Backup and recovery test successful"
else
    echo "✗ Backup and recovery test failed"
    exit 1
fi
```

### Recovery Time Objectives (RTO)

| Recovery Type | Target Time | Actual Time | Status |
|---------------|--------------|--------------|---------|
| Database Restore | 5 minutes | TBD | Test |
| Application Rollback | 10 minutes | TBD | Test |
| Full System Recovery | 30 minutes | TBD | Test |

### Recovery Point Objectives (RPO)

| Data Type | Maximum Data Loss | Actual Loss | Status |
|-----------|-------------------|--------------|---------|
| User Data | 24 hours | TBD | Test |
| Configuration | Immediate | TBD | Test |
| Application Code | Last deployment | TBD | Test |

## Automation Scripts

### Complete Backup Script
```bash
#!/bin/bash
# complete_backup.sh

APP_NAME="workload-app"
CONTAINER_ID="<container-id>"
BACKUP_BASE_DIR="/var/backups/$APP_NAME"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "Starting complete backup for $APP_NAME..."

# Create backup directories
mkdir -p $BACKUP_BASE_DIR/{database,config,volumes,logs}

# Database backup
echo "Creating database backup..."
docker exec $CONTAINER_ID sh -c "cp /app/data/database.sqlite /app/data/database_backup_${TIMESTAMP}.sqlite"
docker cp $CONTAINER_ID:/app/data/database_backup_${TIMESTAMP}.sqlite $BACKUP_BASE_DIR/database/
gzip $BACKUP_BASE_DIR/database/database_backup_${TIMESTAMP}.sqlite
docker exec $CONTAINER_ID rm /app/data/database_backup_${TIMESTAMP}.sqlite

# Configuration backup
echo "Creating configuration backup..."
docker exec $CONTAINER_ID env > $BACKUP_BASE_DIR/config/environment_${TIMESTAMP}.txt
docker exec $CONTAINER_ID env | grep -E "(NODE_ENV|JWT_SECRET|CORS_ORIGIN|DB_PATH)" > $BACKUP_BASE_DIR/config/config_${TIMESTAMP}.txt

# Volume backup
echo "Creating volume backup..."
tar -czf $BACKUP_BASE_DIR/volumes/volume_${TIMESTAMP}.tar.gz -C /var/lib/dokploy/volumes/workload-app-data .

# Create backup manifest
cat > $BACKUP_BASE_DIR/backup_manifest_${TIMESTAMP}.txt << EOF
Backup created: $(date)
Application: $APP_NAME
Container: $CONTAINER_ID
Components:
- Database: database_backup_${TIMESTAMP}.sqlite.gz
- Environment: environment_${TIMESTAMP}.txt
- Configuration: config_${TIMESTAMP}.txt
- Volume: volume_${TIMESTAMP}.tar.gz
EOF

# Clean old backups
find $BACKUP_BASE_DIR -name "*_${TIMESTAMP}*" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $TIMESTAMP"
echo "Backup location: $BACKUP_BASE_DIR"
```

### Complete Restore Script
```bash
#!/bin/bash
# complete_restore.sh

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_timestamp>"
    echo "Example: $0 20231201_120000"
    exit 1
fi

TIMESTAMP=$1
APP_NAME="workload-app"
CONTAINER_ID="<container-id>"
BACKUP_BASE_DIR="/var/backups/$APP_NAME"

echo "Starting complete restore for $APP_NAME from backup $TIMESTAMP..."

# Verify backup exists
if [ ! -f "$BACKUP_BASE_DIR/backup_manifest_${TIMESTAMP}.txt" ]; then
    echo "Error: Backup manifest not found for timestamp $TIMESTAMP"
    exit 1
fi

# Stop application
echo "Stopping application..."
dokploy stop $CONTAINER_ID

# Create current state backup
echo "Creating current state backup..."
mkdir -p $BACKUP_BASE_DIR/emergency/$(date +%Y%m%d_%H%M%S)
docker cp $CONTAINER_ID:/app/data $BACKUP_BASE_DIR/emergency/$(date +%Y%m%d_%H%M%S)/
docker exec $CONTAINER_ID env > $BACKUP_BASE_DIR/emergency/$(date +%Y%m%d_%H%M%S)/environment.txt

# Restore database
echo "Restoring database..."
gunzip -c $BACKUP_BASE_DIR/database/database_backup_${TIMESTAMP}.sqlite.gz > /var/lib/dokploy/volumes/workload-app-data/database.sqlite
chown 1001:1001 /var/lib/dokploy/volumes/workload-app-data/database.sqlite
chmod 664 /var/lib/dokploy/volumes/workload-app-data/database.sqlite

# Restore configuration
echo "Restoring configuration..."
dokploy set-env $APP_NAME --from-file $BACKUP_BASE_DIR/config/config_${TIMESTAMP}.txt

# Restore volume (if needed)
echo "Restoring volume..."
tar -xzf $BACKUP_BASE_DIR/volumes/volume_${TIMESTAMP}.tar.gz -C /var/lib/dokploy/volumes/workload-app-data/

# Start application
echo "Starting application..."
dokploy start $CONTAINER_ID

# Verify restore
echo "Verifying restore..."
sleep 30
curl -f https://your-app.dokploy.app/health

if [ $? -eq 0 ]; then
    echo "✓ Restore completed successfully"
else
    echo "✗ Restore failed - check application logs"
    exit 1
fi

echo "Restore completed from backup $TIMESTAMP"
```

## Monitoring and Alerts

### Backup Monitoring
```bash
#!/bin/bash
# monitor_backups.sh

BACKUP_DIR="/var/backups/workload-app"
ALERT_EMAIL="admin@yourcompany.com"
MAX_AGE_HOURS=25

# Check for recent database backup
LATEST_DB_BACKUP=$(ls -t $BACKUP_DIR/database/database_backup_*.sqlite.gz 2>/dev/null | head -1)

if [ -z "$LATEST_DB_BACKUP" ]; then
    echo "ALERT: No database backups found!" | mail -s "Backup Alert" $ALERT_EMAIL
    exit 1
fi

BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y $LATEST_DB_BACKUP)) / 3600 ))

if [ $BACKUP_AGE -gt $MAX_AGE_HOURS ]; then
    echo "ALERT: Database backup is $BACKUP_AGE hours old!" | mail -s "Backup Alert" $ALERT_EMAIL
fi

# Check backup file sizes
BACKUP_SIZE=$(stat -c%s $LATEST_DB_BACKUP)
MIN_SIZE=1000  # 1KB minimum

if [ $BACKUP_SIZE -lt $MIN_SIZE ]; then
    echo "ALERT: Database backup size is too small ($BACKUP_SIZE bytes)!" | mail -s "Backup Alert" $ALERT_EMAIL
fi

echo "Backup monitoring completed successfully"
```

## Best Practices

### Backup Best Practices

1. **Regular Schedule**: Automate daily backups with consistent timing
2. **Multiple Locations**: Store backups in multiple locations (local and remote)
3. **Test Restores**: Regularly test backup restoration procedures
4. **Retention Policy**: Implement clear retention policies for different backup types
5. **Encryption**: Encrypt sensitive backup data for security

### Recovery Best Practices

1. **Document Procedures**: Maintain clear, step-by-step recovery documentation
2. **Test Regularly**: Test recovery procedures monthly
3. **Monitor RTO/RPO**: Track and optimize recovery times and data loss
4. **Communication**: Establish clear communication procedures for recovery events
5. **Post-Recovery Verification**: Always verify system functionality after recovery

## Conclusion

This comprehensive backup and rollback guide ensures that:

1. **Data is Protected**: Regular backups protect against data loss
2. **Quick Recovery**: Established procedures enable fast recovery
3. **System Reliability**: Testing ensures procedures work when needed
4. **Minimal Downtime**: Efficient rollback procedures minimize service interruption

Regular execution of backup procedures and testing of recovery processes is essential for maintaining system reliability and quickly recovering from deployment issues.