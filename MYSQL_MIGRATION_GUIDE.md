# MySQL Migration Guide

## Overview

This guide provides step-by-step instructions for migrating the Workload Management Application from SQLite to MySQL in the Dokploy environment.

## Prerequisites

### 1. MySQL Service Setup
- Ensure MySQL service is configured in Dokploy
- Note the MySQL connection details:
  - Host (DB_HOST)
  - Port (DB_PORT, default: 3306)
  - Database name (DB_NAME)
  - Username (DB_USER)
  - Password (DB_PASSWORD)

### 2. Environment Variables
Set the following environment variables in your Dokploy deployment:

```bash
# Database Configuration
DB_TYPE=mysql
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=workload_app
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password

# Optional MySQL Configuration
DB_CONNECTION_LIMIT=20
DB_ACQUIRE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=60000
DB_RETRY_DELAY=2000
DB_MAX_RETRIES=5

# Fallback Configuration (optional)
DB_FALLBACK_TO_SQLITE=true

# SQLite Backup Path (for migration)
SQLITE_DB_PATH=./database.sqlite
```

## Migration Process

### Step 1: Backup Current SQLite Database
Before starting the migration, ensure you have a backup of your current SQLite database:

```bash
# The migration script automatically creates a backup
# But you can manually backup as well:
cp database.sqlite database.sqlite.manual_backup.$(date +%s)
```

### Step 2: Deploy Updated Application
Deploy the updated application with MySQL support to Dokploy:

1. The application will start with SQLite by default (DB_TYPE not set)
2. All database operations will continue to work normally
3. The new database configuration supports both SQLite and MySQL

### Step 3: Run Migration Script
Execute the migration script to transfer data from SQLite to MySQL:

```bash
# Set MySQL environment variables first
export DB_HOST=your-mysql-host
export DB_USER=your-mysql-user
export DB_PASSWORD=your-mysql-password
export DB_NAME=workload_app

# Run migration
npm run migrate-to-mysql
```

The migration script will:
1. Validate MySQL configuration
2. Backup the SQLite database
3. Connect to both databases
4. Create MySQL tables if they don't exist
5. Migrate users and workloads
6. Verify data integrity
7. Provide migration summary

### Step 4: Switch to MySQL
After successful migration, update your environment variables to use MySQL:

```bash
# Set DB_TYPE to mysql
DB_TYPE=mysql
```

Restart your application in Dokploy. The application will now use MySQL.

### Step 5: Verify Migration
Test the application to ensure everything works correctly:

1. Check user authentication
2. Verify workload data
3. Test CRUD operations
4. Monitor application logs

## Rollback Process

If you need to rollback to SQLite for any reason:

### Option 1: Use Rollback Script
```bash
# List available backups
npm run list-sqlite-backups

# Rollback to latest backup
npm run rollback-to-sqlite
```

### Option 2: Manual Rollback
1. Set `DB_TYPE=sqlite` in environment variables
2. Restore SQLite database from backup
3. Restart application

## Database Configuration Details

### MySQL Configuration
The MySQL configuration includes:
- Connection pooling (default: 20 connections)
- Retry logic with exponential backoff
- Proper error handling
- Automatic reconnection
- UTF8MB4 charset support
- InnoDB engine with proper indexing

### SQLite Configuration
The SQLite configuration remains unchanged and includes:
- File-based storage
- Foreign key constraints
- Busy timeout handling
- Directory permission checks

## API Compatibility

The database abstraction layer ensures:
- Same API interface for both databases
- Transparent switching between SQLite and MySQL
- Automatic fallback capabilities
- Consistent error handling

## Environment Variable Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_TYPE` | Database type ('sqlite' or 'mysql') | 'sqlite' | No |
| `DB_HOST` | MySQL host address | 'localhost' | Yes (for MySQL) |
| `DB_PORT` | MySQL port | 3306 | No |
| `DB_USER` | MySQL username | - | Yes (for MySQL) |
| `DB_PASSWORD` | MySQL password | - | Yes (for MySQL) |
| `DB_NAME` | MySQL database name | - | Yes (for MySQL) |
| `DB_CONNECTION_LIMIT` | MySQL connection pool limit | 20 | No |
| `DB_ACQUIRE_TIMEOUT` | MySQL connection acquire timeout (ms) | 60000 | No |
| `DB_CONNECTION_TIMEOUT` | MySQL connection timeout (ms) | 60000 | No |
| `DB_RETRY_DELAY` | MySQL retry delay (ms) | 2000 | No |
| `DB_MAX_RETRIES` | Maximum MySQL connection retries | 5 | No |
| `DB_FALLBACK_TO_SQLITE` | Enable SQLite fallback on MySQL failure | true | No |
| `SQLITE_DB_PATH` | SQLite database file path | './database.sqlite' | No |

## Troubleshooting

### Common Issues

1. **MySQL Connection Failed**
   - Check environment variables
   - Verify MySQL service is running
   - Check network connectivity
   - Review MySQL user permissions

2. **Migration Data Mismatch**
   - Verify SQLite backup integrity
   - Check MySQL table structure
   - Review migration logs
   - Run migration with verbose logging

3. **Application Won't Start**
   - Check database configuration
   - Verify environment variables
   - Review application logs
   - Test database connectivity

### Debug Commands

```bash
# Test database connection
node -e "
const db = require('./src/config/database');
db.initialize().then(() => console.log('DB OK')).catch(console.error);
"

# Check database type
node -e "
const db = require('./src/config/database');
console.log('Database type:', db.getType());
console.log('Is MySQL:', db.isMySQL());
console.log('Is SQLite:', db.isSQLite());
"

# Test migration without running
node -e "
const migrator = require('./scripts/migrate-to-mysql');
migrator.validateMySQLConfig();
console.log('MySQL config OK');
"
```

## Performance Considerations

### MySQL Optimizations
- Connection pooling reduces overhead
- Proper indexing improves query performance
- InnoDB engine provides ACID compliance
- UTF8MB4 charset supports full Unicode

### Migration Performance
- Batch processing for large datasets
- Progress logging for monitoring
- Integrity verification ensures data consistency
- Automatic backup prevents data loss

## Security Considerations

1. **Environment Variables**: Store database credentials securely
2. **Network Security**: Use SSL connections for MySQL
3. **Access Control**: Limit database user permissions
4. **Backup Security**: Protect backup files

## Monitoring and Maintenance

### Health Checks
The application includes database health checks:
```javascript
// Check database health
const health = await database.healthCheck();
console.log(health);
```

### Monitoring Metrics
- Connection pool usage
- Query performance
- Error rates
- Migration progress

## Next Steps

1. **Testing**: Thoroughly test the migrated application
2. **Monitoring**: Set up database monitoring
3. **Backup**: Configure automated MySQL backups
4. **Documentation**: Update operational documentation
5. **Training**: Train operations team on MySQL management

## Support

For issues with the migration:
1. Check application logs
2. Review this guide
3. Consult the migration strategy document
4. Contact the development team

---

**Note**: This migration maintains full backward compatibility. You can switch between SQLite and MySQL by changing the `DB_TYPE` environment variable and restarting the application.