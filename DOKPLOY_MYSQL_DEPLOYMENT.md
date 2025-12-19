# Dokploy MySQL Deployment Guide

This guide provides comprehensive instructions for deploying the Workload Management Application with MySQL database in the Dokploy environment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MySQL Service Setup](#mysql-service-setup)
3. [Application Deployment](#application-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Service Dependencies](#service-dependencies)
6. [Migration Procedures](#migration-procedures)
7. [Health Checks](#health-checks)
8. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

## Prerequisites

Before deploying with MySQL, ensure you have:
- Dokploy account with appropriate permissions
- Access to create MySQL services
- Application code with MySQL support (already implemented)
- SSL certificate for your domain (recommended for production)

## MySQL Service Setup

### 1. Create MySQL Service in Dokploy

1. Navigate to your Dokploy dashboard
2. Click on "Services" → "Add New Service"
3. Select "MySQL" from the service templates
4. Configure the MySQL service:
   ```
   Service Name: workload-mysql
   Database Name: workload_db
   User: workload_user
   Password: [Generate a secure password]
   Version: MySQL 8.0
   ```

5. Set up resource limits:
   ```
   CPU: 0.5 cores (minimum)
   Memory: 512MB (minimum)
   Storage: 10GB (minimum)
   ```

6. Configure backup settings:
   ```
   Backup Frequency: Daily
   Retention Period: 30 days
   ```

7. Click "Create Service" and wait for deployment

### 2. Verify MySQL Service

Once deployed, verify the MySQL service:
1. Check service status (should be "Running")
2. Note the connection details provided by Dokploy
3. Test connectivity using Dokploy's built-in tools

## Application Deployment

### 1. Create Application Service

1. In Dokploy, create a new application service
2. Connect your Git repository
3. Configure build settings:
   ```
   Build Context: /App/workload-app
   Dockerfile Path: Dockerfile
   ```

### 2. Configure Application Settings

1. Set up resource limits:
   ```
   CPU: 1.0 cores
   Memory: 1GB
   Storage: 5GB
   ```

2. Configure port settings:
   ```
   Internal Port: 3000
   External Port: 443 (HTTPS)
   ```

3. Set up SSL certificate:
   ```
   Enable HTTPS: Yes
   Certificate Type: Let's Encrypt (or custom)
   ```

## Environment Configuration

### 1. Set Environment Variables

In your application service settings, configure the following environment variables:

```bash
# Database Configuration
DB_TYPE=mysql
DB_HOST=workload-mysql.dokploy.local
DB_PORT=3306
DB_NAME=workload_db
DB_USER=workload_user
DB_PASSWORD=your_secure_mysql_password_here
DB_CONNECTION_LIMIT=20
DB_CONNECTION_TIMEOUT=60000
DB_ACQUIRE_TIMEOUT=60000
MYSQL_FALLBACK_TO_SQLITE=false

# Application Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
CORS_ORIGIN=https://your-app-domain.dokploy.app

# Migration Control
MIGRATE_TO_MYSQL=true
RUN_MIGRATIONS=true
RUN_SEED=true
RESET_ADMIN=false

# User/Group Settings
PUID=1000
PGID=1000
```

### 2. Secure Configuration

1. Use Dokploy secrets for sensitive data:
   - `DB_PASSWORD`
   - `JWT_SECRET`

2. Configure secrets in Dokploy:
   ```
   Secret Name: DB_PASSWORD
   Value: [Your secure MySQL password]
   
   Secret Name: JWT_SECRET
   Value: [Your secure JWT secret]
   ```

3. Reference secrets in environment variables:
   ```bash
   DB_PASSWORD=${DB_PASSWORD}
   JWT_SECRET=${JWT_SECRET}
   ```

## Service Dependencies

### 1. Configure Dependencies

1. In your application service settings, add MySQL service as a dependency:
   ```
   Dependency Service: workload-mysql
   Startup Order: MySQL starts first
   Health Check: Wait for MySQL to be healthy
   ```

2. Set up health checks for the dependency:
   ```bash
   Health Check Path: /health
   Check Interval: 30 seconds
   Timeout: 10 seconds
   Retries: 3
   ```

### 2. Volume Mounting

Configure persistent volumes for the application:

```bash
# Data Volume
Volume Name: app-data
Mount Path: /app/data
Size: 5GB

# Logs Volume
Volume Name: app-logs
Mount Path: /app/logs
Size: 2GB

# Uploads Volume
Volume Name: app-uploads
Mount Path: /app/uploads
Size: 10GB
```

## Migration Procedures

### 1. Initial Deployment Migration

For the first deployment with MySQL:

1. Set migration environment variables:
   ```bash
   MIGRATE_TO_MYSQL=true
   RUN_MIGRATIONS=true
   RUN_SEED=true
   ```

2. Deploy the application
3. Monitor migration logs in Dokploy
4. Verify migration completion:
   - Check application logs for migration success messages
   - Verify database tables are created
   - Test application functionality

### 2. Data Migration from SQLite

If migrating from existing SQLite database:

1. Create backup of SQLite data
2. Update migration settings:
   ```bash
   MIGRATE_TO_MYSQL=true
   BACKUP_SQLITE_BEFORE_MIGRATION=true
   ```

3. Deploy and monitor migration
4. Verify data integrity:
   - Compare record counts
   - Test critical functionality
   - Validate user authentication

### 3. Post-Migration

After successful migration:

1. Update environment variables:
   ```bash
   MIGRATE_TO_MYSQL=false
   RUN_MIGRATIONS=false
   RUN_SEED=false
   ```

2. Redeploy application
3. Remove SQLite dependencies (optional)

## Health Checks

### 1. Application Health Check

The application includes a comprehensive health check at `/health` that verifies:
- Application status
- Database connectivity
- Authentication system
- File system permissions

### 2. MySQL Health Check

Dokploy automatically monitors MySQL service health:
- Database connectivity
- Query response time
- Resource usage
- Disk space

### 3. Custom Health Monitoring

Set up additional monitoring:

```bash
# Custom Health Check Endpoint
Health Check Path: /api/health
Check Interval: 30 seconds
Timeout: 10 seconds
Success Criteria: HTTP 200 response
```

## Monitoring and Troubleshooting

### 1. Log Monitoring

Monitor application logs for:
- Database connection errors
- Migration status
- Authentication issues
- Performance metrics

### 2. Common Issues and Solutions

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

### 3. Performance Optimization

1. Database optimization:
   ```bash
   DB_CONNECTION_LIMIT=30
   DB_CONNECTION_TIMEOUT=30000
   DB_ACQUIRE_TIMEOUT=30000
   ```

2. Application optimization:
   ```bash
   NODE_ENV=production
   UV_THREADPOOL_SIZE=16
   ```

### 4. Backup and Recovery

1. MySQL backups:
   - Automated daily backups
   - Manual backup before major changes
   - Test restoration procedures

2. Application backups:
   - Volume snapshots
   - Configuration backups
   - Code repository tags

### 5. Scaling Considerations

For high-traffic deployments:

1. Horizontal scaling:
   - Multiple application instances
   - Load balancer configuration
   - Session management

2. Database scaling:
   - Read replicas
   - Connection pooling
   - Query optimization

## Security Best Practices

1. Database security:
   - Strong password policies
   - Limited database user permissions
   - Encrypted connections

2. Application security:
   - Regular security updates
   - Input validation
   - Rate limiting

3. Infrastructure security:
   - Network isolation
   - SSL/TLS encryption
   - Access control

## Conclusion

This guide provides a comprehensive approach to deploying the Workload Management Application with MySQL in Dokploy. Following these steps ensures a secure, scalable, and maintainable deployment.

For additional support, refer to:
- Dokploy documentation
- MySQL documentation
- Application troubleshooting guide

Remember to regularly update dependencies and monitor system performance for optimal operation.