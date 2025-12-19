# MySQL Deployment Guide for Workload Management App

This guide provides comprehensive instructions for deploying the Workload Management Application with MySQL database support, optimized for both local development and Dokploy production environments.

## Quick Start

### For Local Development
```bash
# Set up environment and directories
./scripts/deploy-mysql.sh setup

# Start local development with MySQL
./scripts/deploy-mysql.sh local
```

### For Production Deployment
```bash
# Set up environment
./scripts/deploy-mysql.sh setup

# Deploy with Docker Compose
./scripts/deploy-mysql.sh docker

# Or get Dokploy instructions
./scripts/deploy-mysql.sh dokploy
```

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Configuration](#configuration)
4. [Deployment Options](#deployment-options)
5. [Migration Process](#migration-process)
6. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
7. [Security Considerations](#security-considerations)

## Overview

The Workload Management Application now supports both SQLite (for development) and MySQL (for production) databases. This implementation provides:

- **Dual Database Support**: Seamlessly switch between SQLite and MySQL
- **Migration Tools**: Automated migration from SQLite to MySQL
- **Docker Optimization**: Optimized Docker configuration for MySQL
- **Dokploy Integration**: Specialized configuration for Dokploy environment
- **Health Checks**: Comprehensive health monitoring for both application and database
- **Fallback Support**: Graceful fallback to SQLite if MySQL is unavailable

## Prerequisites

### Required Software
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### For Dokploy Deployment
- Dokploy account with service creation permissions
- SSL certificate (recommended for production)

## Configuration

### Environment Variables

The application uses different environment variables based on the database type:

#### SQLite Configuration (Default)
```bash
DB_TYPE=sqlite
DB_PATH=./database.sqlite
```

#### MySQL Configuration
```bash
DB_TYPE=mysql
DB_HOST=mysql-service.dokploy.local  # For Dokploy
DB_HOST=localhost                     # For local development
DB_PORT=3306
DB_NAME=workload_db
DB_USER=workload_user
DB_PASSWORD=your_secure_password
DB_CONNECTION_LIMIT=20
DB_CONNECTION_TIMEOUT=60000
DB_ACQUIRE_TIMEOUT=60000
MYSQL_FALLBACK_TO_SQLITE=false
```

#### Migration Control
```bash
MIGRATE_TO_MYSQL=true      # Enable SQLite to MySQL migration
RUN_MIGRATIONS=true        # Run database migrations
RUN_SEED=true             # Run seed data
RESET_ADMIN=false         # Reset admin user
```

### Configuration Files

1. **.env**: Local development configuration
2. **.env.production**: Production configuration
3. **.env.mysql.example**: MySQL configuration template

## Deployment Options

### Option 1: Local Development with MySQL

Perfect for testing MySQL functionality locally:

```bash
# 1. Set up environment
./scripts/deploy-mysql.sh setup

# 2. Start local development
./scripts/deploy-mysql.sh local
```

This will:
- Start a MySQL container
- Run database migrations
- Start the application with MySQL connection
- Enable hot-reloading for development

### Option 2: Docker Compose Production

For self-hosted production environments:

```bash
# 1. Configure production environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 2. Deploy
./scripts/deploy-mysql.sh docker
```

Features:
- Production-optimized MySQL configuration
- Persistent data volumes
- Health checks and monitoring
- Resource limits and optimization

### Option 3: Dokploy Cloud Deployment

For managed cloud deployment:

```bash
# Get deployment instructions
./scripts/deploy-mysql.sh dokploy
```

Key features:
- Managed MySQL service
- Automatic scaling
- Built-in monitoring
- SSL termination
- Automated backups

## Migration Process

### From SQLite to MySQL

The application includes automated migration tools:

1. **Backup Existing Data**
   ```bash
   # Backup is automatically created during migration
   # Manual backup: cp database.sqlite database.sqlite.backup.$(date +%s)
   ```

2. **Run Migration**
   ```bash
   # Set migration environment variables
   export MIGRATE_TO_MYSQL=true
   export DB_TYPE=mysql
   export DB_HOST=your_mysql_host
   # ... other MySQL variables
   
   # Run migration
   node scripts/migrate-to-mysql.js
   ```

3. **Verify Migration**
   ```bash
   # Test migration results
   node scripts/test-database-config.js
   ```

### Migration Features

- **Data Integrity**: Maintains all existing data and relationships
- **Rollback Support**: Easy rollback to SQLite if needed
- **Progress Tracking**: Detailed migration logs
- **Error Handling**: Graceful handling of migration errors

## Monitoring and Troubleshooting

### Health Checks

The application includes comprehensive health monitoring:

1. **Application Health**: `/health` endpoint
   - Application status
   - Database connectivity
   - Authentication system
   - File system permissions

2. **Database Health**: MySQL-specific checks
   - Connection status
   - Query performance
   - Resource usage

### Common Issues

#### MySQL Connection Errors
```
Error: ECONNREFUSED
Solution: Check MySQL service status and connection details
```

#### Migration Failures
```
Error: Migration failed
Solution: Check migration logs, verify database permissions
```

#### Performance Issues
```
Error: Slow query response
Solution: Optimize database queries, increase connection pool size
```

### Log Monitoring

Monitor application logs for:
- Database connection errors
- Migration status
- Authentication issues
- Performance metrics

## Security Considerations

### Database Security

1. **Strong Passwords**: Use complex passwords for MySQL
2. **Limited Privileges**: Grant only necessary permissions
3. **Encrypted Connections**: Use SSL/TLS for database connections
4. **Regular Updates**: Keep MySQL and dependencies updated

### Application Security

1. **Environment Variables**: Store sensitive data in environment variables
2. **JWT Security**: Use strong JWT secrets
3. **CORS Configuration**: Properly configure CORS origins
4. **Input Validation**: Validate all user inputs

### Infrastructure Security

1. **Network Isolation**: Isolate database from public internet
2. **SSL/TLS**: Use HTTPS for all communications
3. **Access Control**: Implement proper access controls
4. **Regular Backups**: Maintain regular backup schedules

## Performance Optimization

### Database Optimization

1. **Connection Pooling**: Optimize connection pool size
2. **Query Optimization**: Use efficient queries
3. **Indexing**: Proper database indexing
4. **Caching**: Implement query caching

### Application Optimization

1. **Resource Limits**: Set appropriate CPU/memory limits
2. **Load Balancing**: Use load balancers for high traffic
3. **Caching**: Implement application-level caching
4. **Monitoring**: Continuous performance monitoring

## Scaling Considerations

### Horizontal Scaling

1. **Multiple Instances**: Run multiple application instances
2. **Load Balancer**: Distribute traffic across instances
3. **Session Management**: Implement session persistence
4. **Database Scaling**: Use read replicas for read-heavy workloads

### Vertical Scaling

1. **Resource Allocation**: Increase CPU/memory as needed
2. **Database Resources**: Scale MySQL resources independently
3. **Storage**: Expand storage as data grows
4. **Monitoring**: Monitor resource utilization

## Backup and Recovery

### Database Backups

1. **Automated Backups**: Regular automated backups
2. **Manual Backups**: Manual backups before major changes
3. **Backup Verification**: Regular backup restoration tests
4. **Offsite Storage**: Store backups in multiple locations

### Application Backups

1. **Volume Snapshots**: Regular volume snapshots
2. **Configuration Backups**: Backup configuration files
3. **Code Repository**: Tag releases in version control
4. **Documentation**: Maintain updated documentation

## Support and Resources

### Documentation

- [DOKPLOY_MYSQL_DEPLOYMENT.md](./DOKPLOY_MYSQL_DEPLOYMENT.md) - Detailed Dokploy deployment guide
- [MYSQL_MIGRATION_GUIDE.md](./MYSQL_MIGRATION_GUIDE.md) - Migration procedures
- [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) - Common issues and solutions

### Scripts

- `scripts/deploy-mysql.sh` - Deployment automation script
- `scripts/migrate-to-mysql.js` - Migration script
- `scripts/rollback-to-sqlite.js` - Rollback script
- `scripts/test-database-config.js` - Database testing script

### Configuration Files

- `docker-compose.yml` - Local development configuration
- `docker-compose.prod.yml` - Production configuration
- `.env.mysql.example` - MySQL environment template
- `.env.production` - Production environment configuration

## Conclusion

This MySQL deployment implementation provides a robust, scalable, and maintainable solution for the Workload Management Application. With proper configuration and monitoring, it can handle production workloads while maintaining data integrity and security.

For additional support or questions, refer to the documentation files or contact the development team.