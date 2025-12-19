# Troubleshooting Guide for Dokploy Deployment with Authentication Fix

## Overview

This guide provides comprehensive troubleshooting steps for common issues that may occur when deploying the Workload Management Application to Dokploy with the authentication fix. Each issue includes symptoms, causes, diagnostic steps, and solutions.

## Quick Reference - Common Issues

| Issue Category | Most Common Problems | Quick Fix |
|----------------|---------------------|-----------|
| Authentication | Admin user not found | Set `RESET_ADMIN=true` and restart |
| Database | Database not persisting | Check volume mounting configuration |
| Permissions | Container startup failures | Fix volume permissions |
| Environment | CORS errors | Update `CORS_ORIGIN` environment variable |
| Performance | Slow authentication | Check database configuration |

---

## Category 1: Authentication Issues

### Issue 1.1: Admin User Not Found

**Symptoms**:
- Login fails with "User not found" error
- Authentication system reports no admin user exists
- Application starts but authentication doesn't work

**Diagnostic Steps**:
```bash
# Check if admin user exists in database
dokploy exec <container-id> sqlite3 /app/data/database.sqlite "SELECT username, role FROM users WHERE role='Admin';"

# Check application logs for admin creation
dokploy logs <container-id> | grep -i admin

# Check database initialization
dokploy logs <container-id> | grep -i "database\|admin"
```

**Causes**:
1. Database initialization failed
2. Admin user creation failed during startup
3. Database file doesn't exist or is corrupted
4. Volume mounting issues

**Solutions**:

#### Solution A: Reset Admin User
```bash
# Method 1: Via Environment Variable
# In Dokploy dashboard, set:
RESET_ADMIN=true

# Restart application
# Admin user will be recreated on next startup

# Method 2: Via Container Shell
dokploy exec <container-id> sh
npm run reset-admin
```

#### Solution B: Recreate Database
```bash
# Access container shell
dokploy exec <container-id> sh

# Backup existing database (if needed)
cp /app/data/database.sqlite /app/data/database_backup_$(date +%Y%m%d).sqlite

# Remove database file
rm /app/data/database.sqlite

# Restart application
# Database and admin user will be recreated
```

#### Solution C: Check Database Permissions
```bash
# Check database file permissions
dokploy exec <container-id> ls -la /app/data/database.sqlite

# Fix permissions if needed
dokploy exec <container-id> chmod 664 /app/data/database.sqlite

# Check directory permissions
dokploy exec <container-id> ls -la /app/data/

# Fix directory permissions
dokploy exec <container-id> chmod 755 /app/data/
```

### Issue 1.2: JWT Token Errors

**Symptoms**:
- Login succeeds but subsequent API calls fail
- "Invalid token" errors
- Token expiration issues

**Diagnostic Steps**:
```bash
# Check JWT_SECRET is set
dokploy exec <container-id> env | grep JWT_SECRET

# Test token generation
TOKEN=$(curl -s -X POST https://your-app.dokploy.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Test token validation
curl -X GET https://your-app.dokploy.app/api/auth/user \
  -H "Authorization: Bearer $TOKEN"
```

**Causes**:
1. JWT_SECRET not set or too short
2. JWT_SECRET changed between deployments
3. Token expiration misconfiguration
4. Clock synchronization issues

**Solutions**:

#### Solution A: Fix JWT_SECRET
```bash
# Ensure JWT_SECRET is at least 32 characters
# In Dokploy dashboard, update environment variable:
JWT_SECRET=your-new-super-secret-jwt-key-minimum-32-characters-long

# Restart application
```

#### Solution B: Check Token Configuration
```bash
# Check JWT configuration in code
# File: src/config/jwt.js
# Verify:
# - expiresIn is set appropriately
# - algorithm is correct (HS256)
# - secret is properly referenced
```

### Issue 1.3: CORS Errors

**Symptoms**:
- Frontend cannot connect to API
- "CORS policy" errors in browser console
- Network errors in frontend

**Diagnostic Steps**:
```bash
# Check CORS_ORIGIN environment variable
dokploy exec <container-id> env | grep CORS_ORIGIN

# Test CORS headers
curl -I https://your-app.dokploy.app/api/auth/login

# Check actual frontend URL
# Compare with CORS_ORIGIN value
```

**Causes**:
1. CORS_ORIGIN doesn't match frontend URL
2. Protocol mismatch (HTTP vs HTTPS)
3. Port number missing or incorrect
4. Subdomain variations

**Solutions**:

#### Solution A: Fix CORS Configuration
```bash
# Update CORS_ORIGIN in Dokploy environment variables
# Examples:
CORS_ORIGIN=https://your-app.dokploy.app
CORS_ORIGIN=https://workload.yourdomain.com
CORS_ORIGIN=https://your-app.dokploy.app:3000

# Restart application
```

#### Solution B: Debug CORS Issues
```bash
# Check CORS headers in response
curl -v -X OPTIONS https://your-app.dokploy.app/api/auth/login \
  -H "Origin: https://your-frontend-url.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Look for:
# Access-Control-Allow-Origin: https://your-frontend-url.com
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE
# Access-Control-Allow-Headers: Content-Type,Authorization
```

---

## Category 2: Database Issues

### Issue 2.1: Database Not Persisting

**Symptoms**:
- Data lost after container restart
- Admin user recreated after each restart
- Database file missing or empty

**Diagnostic Steps**:
```bash
# Check if volume is mounted
dokploy exec <container-id> mount | grep /app/data

# Check database file exists
dokploy exec <container-id> ls -la /app/data/database.sqlite

# Check volume source on host
# SSH to Dokploy server:
ls -la /var/lib/dokploy/volumes/workload-app-data/

# Check volume permissions
stat /var/lib/dokploy/volumes/workload-app-data/
```

**Causes**:
1. Volume not configured in Dokploy
2. Volume source directory doesn't exist
3. Incorrect volume permissions
4. Volume type misconfiguration

**Solutions**:

#### Solution A: Configure Volume Mounting
```bash
# On Dokploy server, create volume directory
sudo mkdir -p /var/lib/dokploy/volumes/workload-app-data

# Set correct permissions
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data
sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-data

# In Dokploy dashboard, add volume:
# Type: Bind Mount
# Source: /var/lib/dokploy/volumes/workload-app-data
# Destination: /app/data
# Read/Write: true
```

#### Solution B: Verify Volume Configuration
```bash
# Check volume configuration in Dokploy dashboard
# Verify:
# - Source path is correct
# - Destination path is /app/data
# - Type is Bind Mount
# - Read/Write is enabled

# Restart application after configuration
```

### Issue 2.2: Database Permission Errors

**Symptoms**:
- "Permission denied" errors
- Database write failures
- Container startup failures

**Diagnostic Steps**:
```bash
# Check database file permissions
dokploy exec <container-id> ls -la /app/data/database.sqlite

# Check directory permissions
dokploy exec <container-id> ls -la /app/data/

# Check user ID
dokploy exec <container-id> id

# Test write permissions
dokploy exec <container-id> sh -c "echo test > /app/data/.test && rm /app/data/.test"
```

**Causes**:
1. Volume owned by wrong user
2. Incorrect directory permissions
3. Read-only volume mount
4. Security context issues

**Solutions**:

#### Solution A: Fix Volume Permissions
```bash
# On Dokploy server:
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data
sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-data

# Check container user ID
dokploy exec <container-id> id
# Should show: uid=1001(nodejs) gid=1001(nodejs)
```

#### Solution B: Recreate Volume with Correct Permissions
```bash
# Stop application
# Remove existing volume
sudo rm -rf /var/lib/dokploy/volumes/workload-app-data

# Recreate with correct permissions
sudo mkdir -p /var/lib/dokploy/volumes/workload-app-data
sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data
sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-data

# Restart application
```

### Issue 2.3: Database Corruption

**Symptoms**:
- "Database is locked" errors
- "Database disk image is malformed"
- Intermittent database failures

**Diagnostic Steps**:
```bash
# Check database integrity
dokploy exec <container-id> sqlite3 /app/data/database.sqlite "PRAGMA integrity_check;"

# Check for journal files
dokploy exec <container-id> ls -la /app/data/database.sqlite*

# Check database size
dokploy exec <container-id> wc -c /app/data/database.sqlite
```

**Causes**:
1. Improper shutdown
2. Disk space issues
3. Concurrent access conflicts
4. File system corruption

**Solutions**:

#### Solution A: Database Recovery
```bash
# Access container shell
dokploy exec <container-id> sh

# Backup corrupted database
cp /app/data/database.sqlite /app/data/database_corrupted_$(date +%Y%m%d).sqlite

# Try to recover
sqlite3 /app/data/database.sqlite ".recover" | sqlite3 /app/data/database_recovered.sqlite

# Test recovered database
sqlite3 /app/data/database_recovered.sqlite "PRAGMA integrity_check;"

# If recovery successful, replace original
mv /app/data/database_recovered.sqlite /app/data/database.sqlite
```

#### Solution B: Fresh Database Creation
```bash
# Backup existing database
cp /app/data/database.sqlite /app/data/database_backup_$(date +%Y%m%d).sqlite

# Remove corrupted database
rm /app/data/database.sqlite

# Restart application
# New database will be created with admin user
```

---

## Category 3: Container and Deployment Issues

### Issue 3.1: Container Startup Failures

**Symptoms**:
- Container fails to start
- Continuous restart loops
- Health check failures

**Diagnostic Steps**:
```bash
# Check container logs
dokploy logs <container-id>

# Check container status
dokploy ps | grep <container-id>

# Check resource usage
dokploy stats <container-id>

# Check health check configuration
dokploy inspect <container-id> | grep -A 10 -B 5 Health
```

**Causes**:
1. Missing environment variables
2. Port conflicts
3. Resource constraints
4. Application startup errors

**Solutions**:

#### Solution A: Check Environment Variables
```bash
# List all environment variables
dokploy exec <container-id> env

# Verify critical variables are set:
# NODE_ENV=production
# PORT=3000
# JWT_SECRET=your-secret-key
# CORS_ORIGIN=your-app-url
# DB_PATH=/app/data/database.sqlite
```

#### Solution B: Fix Port Conflicts
```bash
# Check what's using port 3000
dokploy exec <container-id> netstat -tlnp | grep :3000

# Update PORT environment variable if needed
# In Dokploy dashboard, set:
PORT=3001

# Restart application
```

#### Solution C: Increase Resources
```bash
# Check resource limits
dokploy inspect <container-id> | grep -A 10 -B 5 Resources

# Increase memory/CPU limits in Dokploy dashboard
# Recommended minimum:
# Memory: 512MB
# CPU: 0.5 cores
```

### Issue 3.2: Health Check Failures

**Symptoms**:
- Health check shows as failing
- Container marked as unhealthy
- Automatic restarts

**Diagnostic Steps**:
```bash
# Test health endpoint manually
curl -v https://your-app.dokploy.app/health

# Check health check configuration
dokploy inspect <container-id> | grep -A 20 HealthCheck

# Check application logs for errors
dokploy logs <container-id> | tail -50
```

**Causes**:
1. Health endpoint not responding
2. Incorrect health check configuration
3. Application not fully started
4. Network issues

**Solutions**:

#### Solution A: Fix Health Check Configuration
```bash
# In Dokploy dashboard, configure health check:
# Path: /health
# Port: 3000
# Interval: 30s
# Timeout: 3s
# Retries: 3
# Start Period: 10s
```

#### Solution B: Debug Health Endpoint
```bash
# Test health endpoint with verbose output
curl -v https://your-app.dokploy.app/health

# Check if application is listening
dokploy exec <container-id> netstat -tlnp | grep :3000

# Check application startup logs
dokploy logs <container-id> | grep -E "(listen|port|started)"
```

---

## Category 4: Environment Configuration Issues

### Issue 4.1: Missing Environment Variables

**Symptoms**:
- Application fails to start
- Configuration errors
- Authentication system not working

**Diagnostic Steps**:
```bash
# List all environment variables
dokploy exec <container-id> env | sort

# Check for required variables
dokploy exec <container-id> env | grep -E "(NODE_ENV|JWT_SECRET|CORS_ORIGIN|DB_PATH)"

# Check application logs for missing variable errors
dokploy logs <container-id> | grep -i "undefined\|missing\|required"
```

**Causes**:
1. Variables not added to Dokploy configuration
2. Variable names misspelled
3. Variables not saved properly
4. Case sensitivity issues

**Solutions**:

#### Solution A: Add Missing Variables
```bash
# In Dokploy dashboard, add all required variables:
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
CORS_ORIGIN=https://your-app.dokploy.app
DB_PATH=/app/data/database.sqlite
RESET_ADMIN=false
```

#### Solution B: Verify Variable Names
```bash
# Check exact variable names in application code
# Files to check:
# - src/config/database.js
# - src/config/jwt.js
# - server.js

# Ensure names match exactly (case-sensitive)
```

### Issue 4.2: Invalid Environment Variable Values

**Symptoms**:
- Configuration errors
- Authentication failures
- CORS issues

**Diagnostic Steps**:
```bash
# Check JWT_SECRET length
dokploy exec <container-id> sh -c 'echo ${#JWT_SECRET}'

# Check CORS_ORIGIN format
dokploy exec <container-id> env | grep CORS_ORIGIN

# Validate URLs
curl -I $CORS_ORIGIN
```

**Causes**:
1. JWT_SECRET too short
2. Invalid URL format for CORS_ORIGIN
3. Incorrect port numbers
4. Protocol mismatches

**Solutions**:

#### Solution A: Fix JWT_SECRET
```bash
# Generate new secure JWT secret
openssl rand -base64 32

# Update in Dokploy dashboard
JWT_SECRET=new-generated-secret-key-32-chars-minimum

# Restart application
```

#### Solution B: Fix CORS_ORIGIN
```bash
# Ensure CORS_ORIGIN is a valid URL
# Examples:
CORS_ORIGIN=https://your-app.dokploy.app
CORS_ORIGIN=https://workload.yourdomain.com

# Must include protocol (http:// or https://)
# Must match frontend URL exactly
```

---

## Category 5: Performance Issues

### Issue 5.1: Slow Authentication

**Symptoms**:
- Login takes long time
- API responses are slow
- Database queries are slow

**Diagnostic Steps**:
```bash
# Measure login response time
time curl -X POST https://your-app.dokploy.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check database query performance
dokploy exec <container-id> sqlite3 /app/data/database.sqlite "EXPLAIN QUERY PLAN SELECT * FROM users WHERE username='admin';"

# Check resource usage
dokploy stats <container-id>
```

**Causes**:
1. Database not optimized
2. Insufficient resources
3. Network latency
4. Database locking issues

**Solutions**:

#### Solution A: Optimize Database
```bash
# Run database optimization
dokploy exec <container-id> sqlite3 /app/data/database.sqlite "VACUUM;"
dokploy exec <container-id> sqlite3 /app/data/database.sqlite "ANALYZE;"

# Add indexes if needed
dokploy exec <container-id> sqlite3 /app/data/database.sqlite "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);"
```

#### Solution B: Increase Resources
```bash
# Increase memory allocation in Dokploy dashboard
# Recommended for production:
# Memory: 1GB or more
# CPU: 1 core or more
```

### Issue 5.2: High Memory Usage

**Symptoms**:
- Container uses excessive memory
- Out of memory errors
- Container restarts

**Diagnostic Steps**:
```bash
# Check memory usage
dokploy stats <container-id>

# Check for memory leaks
dokploy exec <container-id> ps aux

# Check application logs for memory errors
dokploy logs <container-id> | grep -i "memory\|oom"
```

**Causes**:
1. Memory leaks in application
2. Insufficient memory limits
3. Database connection leaks
4. Large dataset processing

**Solutions**:

#### Solution A: Increase Memory Limits
```bash
# In Dokploy dashboard, increase memory limit
# Recommended minimum: 512MB
# Recommended for production: 1GB or more
```

#### Solution B: Optimize Application
```bash
# Check for database connection leaks
dokploy exec <container-id> netstat -anp | grep :3000

# Restart application to clear memory
dokploy restart <container-id>
```

---

## Advanced Troubleshooting Techniques

### Diagnostic Script

Create a comprehensive diagnostic script:

```bash
#!/bin/bash
# diagnose_dokploy.sh

APP_URL="https://your-app.dokploy.app"
CONTAINER_ID="<container-id>"

echo "Dokploy Deployment Diagnostic Tool"
echo "================================="

# Check 1: Application Accessibility
echo "1. Checking Application Accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)
if [ $HTTP_STATUS -eq 200 ]; then
    echo "✓ Application accessible"
else
    echo "✗ Application not accessible (HTTP $HTTP_STATUS)"
fi

# Check 2: Health Endpoint
echo "2. Checking Health Endpoint..."
HEALTH_RESPONSE=$(curl -s $APP_URL/health)
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    echo "✓ Health endpoint responding"
else
    echo "✗ Health endpoint not responding"
fi

# Check 3: Admin Login
echo "3. Checking Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST $APP_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    echo "✓ Admin login working"
else
    echo "✗ Admin login failed"
fi

# Check 4: Environment Variables
echo "4. Checking Environment Variables..."
JWT_SECRET_LENGTH=$(dokploy exec $CONTAINER_ID sh -c 'echo ${#JWT_SECRET}')
if [ $JWT_SECRET_LENGTH -ge 32 ]; then
    echo "✓ JWT_SECRET length sufficient ($JWT_SECRET_LENGTH chars)"
else
    echo "✗ JWT_SECRET too short ($JWT_SECRET_LENGTH chars)"
fi

# Check 5: Database
echo "5. Checking Database..."
DB_EXISTS=$(dokploy exec $CONTAINER_ID test -f /app/data/database.sqlite && echo "yes" || echo "no")
if [ "$DB_EXISTS" = "yes" ]; then
    echo "✓ Database file exists"
    ADMIN_EXISTS=$(dokploy exec $CONTAINER_ID sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM users WHERE role='Admin';")
    if [ $ADMIN_EXISTS -eq 1 ]; then
        echo "✓ Admin user exists"
    else
        echo "✗ Admin user missing"
    fi
else
    echo "✗ Database file missing"
fi

# Check 6: Volume Mounting
echo "6. Checking Volume Mounting..."
VOLUME_MOUNTED=$(dokploy exec $CONTAINER_ID mount | grep /app/data | wc -l)
if [ $VOLUME_MOUNTED -eq 1 ]; then
    echo "✓ Volume mounted correctly"
else
    echo "✗ Volume not mounted"
fi

echo "================================="
echo "Diagnostic Complete"
```

### Log Analysis Techniques

#### Authentication Log Analysis
```bash
# Extract authentication-related logs
dokploy logs <container-id> | grep -E "(login|auth|admin|jwt)" | tail -50

# Check for errors
dokploy logs <container-id> | grep -i error | tail -20

# Check database initialization
dokploy logs <container-id> | grep -E "(database|init|create)" | tail -20
```

#### Performance Log Analysis
```bash
# Check slow queries
dokploy logs <container-id> | grep -E "(slow|timeout|delay)" | tail -20

# Check resource usage
dokploy stats <container-id> --no-stream

# Check memory usage pattern
dokploy logs <container-id> | grep -i memory | tail -20
```

## Emergency Procedures

### Complete Reset Procedure

If all troubleshooting fails:

1. **Backup Current Data**:
   ```bash
   # Backup database
   dokploy exec <container-id> cp /app/data/database.sqlite /app/data/emergency_backup_$(date +%Y%m%d_%H%M%S).sqlite
   
   # Copy backup to host
   docker cp <container-id>:/app/data/emergency_backup_*.sqlite ./
   ```

2. **Reset Application**:
   ```bash
   # Stop application
   dokploy stop <container-id>
   
   # Remove database file
   dokploy exec <container-id> rm /app/data/database.sqlite
   
   # Reset environment variables
   RESET_ADMIN=true
   
   # Start application
   dokploy start <container-id>
   ```

3. **Verify Reset**:
   ```bash
   # Test admin login
   curl -X POST https://your-app.dokploy.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

### Contact Support

If issues persist:

1. **Collect Diagnostic Information**:
   ```bash
   # Save container logs
   dokploy logs <container-id> > container_logs.txt
   
   # Save environment variables
   dokploy exec <container-id> env > environment.txt
   
   # Save diagnostic output
   ./diagnose_dokploy.sh > diagnostic.txt
   ```

2. **Create Support Ticket**:
   - Include all diagnostic files
   - Describe the issue in detail
   - Mention troubleshooting steps already taken
   - Include application version and deployment details

## Conclusion

This troubleshooting guide covers the most common issues encountered when deploying the Workload Management Application to Dokploy with the authentication fix. Key takeaways:

1. **Authentication Issues**: Usually related to admin user creation or JWT configuration
2. **Database Issues**: Often caused by volume mounting or permission problems
3. **Environment Issues**: Typically missing or misconfigured environment variables
4. **Performance Issues**: Usually related to resource allocation or database optimization

When troubleshooting:
- Start with the simplest solutions first
- Check logs for specific error messages
- Verify configuration before making changes
- Document all changes for future reference

Regular monitoring and preventive maintenance can help avoid many of these issues.