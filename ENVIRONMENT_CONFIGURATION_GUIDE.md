# Environment Configuration Guide for Dokploy Deployment

## Overview

This guide provides comprehensive documentation of all environment variables required for deploying the Workload Management Application to Dokploy with the authentication fix. Each variable includes its purpose, default values, and special considerations for the authentication system.

## Required Environment Variables

### Core Application Variables

#### NODE_ENV
- **Purpose**: Sets the application environment mode
- **Required**: Yes
- **Default Value**: `production`
- **Possible Values**: `development`, `production`, `test`
- **Authentication Impact**: 
  - Determines database path location
  - Controls error reporting verbosity
  - Affects security headers configuration

```bash
NODE_ENV=production
```

#### PORT
- **Purpose**: Specifies the port on which the application listens
- **Required**: Yes
- **Default Value**: `3000`
- **Possible Values**: Any valid port number (1024-65535)
- **Authentication Impact**: None

```bash
PORT=3000
```

### Security Variables

#### JWT_SECRET
- **Purpose**: Secret key for signing and verifying JWT tokens
- **Required**: Yes (Critical)
- **Default Value**: None (must be provided)
- **Minimum Length**: 32 characters
- **Authentication Impact**: 
  - Critical for token security
  - Must be consistent across restarts
  - Changing this will invalidate all existing tokens

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
```

**Security Best Practices**:
- Use a cryptographically strong random string
- Minimum 32 characters recommended
- Never use the example value in production
- Store securely and rotate periodically

### CORS Configuration

#### CORS_ORIGIN
- **Purpose**: Specifies allowed origins for Cross-Origin Resource Sharing
- **Required**: Yes
- **Default Value**: None (must be provided)
- **Format**: Full URL including protocol
- **Authentication Impact**: 
  - Must match your Dokploy application URL exactly
  - Incorrect value will prevent frontend from accessing API

```bash
CORS_ORIGIN=https://your-app-name.dokploy.app
```

**Examples**:
```bash
# For Dokploy subdomain
CORS_ORIGIN=https://workload-app.dokploy.app

# For custom domain
CORS_ORIGIN=https://workload.yourdomain.com

# For multiple origins (if supported)
CORS_ORIGIN=https://workload.yourdomain.com,https://staging.yourdomain.com
```

### Database Configuration

#### DB_PATH
- **Purpose**: Specifies the file path for the SQLite database
- **Required**: Yes
- **Default Value**: `/app/data/database.sqlite` (in production)
- **Authentication Impact**: 
  - Critical for database persistence
  - Must match volume mount destination
  - Changing this will create a new database

```bash
DB_PATH=/app/data/database.sqlite
```

**Important Notes**:
- Must be within the mounted volume for persistence
- Directory must be writable by the application
- Path must be absolute in production

### Admin User Management

#### RESET_ADMIN
- **Purpose**: Triggers admin user reset on application startup
- **Required**: No
- **Default Value**: `false`
- **Possible Values**: `true`, `false`
- **Authentication Impact**: 
  - When `true`, recreates admin user on next startup
  - Useful for recovery from authentication issues
  - Automatically resets to `false` after use

```bash
RESET_ADMIN=false
```

**Usage Examples**:
```bash
# Normal operation
RESET_ADMIN=false

# Reset admin user (one-time)
RESET_ADMIN=true
```

## Optional Environment Variables

### Logging Configuration

#### LOG_LEVEL
- **Purpose**: Controls verbosity of application logs
- **Required**: No
- **Default Value**: `info`
- **Possible Values**: `error`, `warn`, `info`, `debug`
- **Authentication Impact**: Affects visibility of authentication-related logs

```bash
LOG_LEVEL=info
```

### Performance Configuration

#### DB_TIMEOUT
- **Purpose**: Database connection timeout in milliseconds
- **Required**: No
- **Default Value**: `30000` (30 seconds)
- **Authentication Impact**: Affects database operations during authentication

```bash
DB_TIMEOUT=30000
```

## Environment Variable Templates

### Production Template
```bash
# Core Application
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-production-jwt-secret-key-minimum-32-characters-long

# CORS
CORS_ORIGIN=https://your-app-name.dokploy.app

# Database
DB_PATH=/app/data/database.sqlite

# Admin Management
RESET_ADMIN=false

# Optional
LOG_LEVEL=info
DB_TIMEOUT=30000
```

### Development Template
```bash
# Core Application
NODE_ENV=development
PORT=3000

# Security
JWT_SECRET=development-jwt-secret-key-for-testing-only

# CORS
CORS_ORIGIN=http://localhost:3000

# Database
DB_PATH=./database.sqlite

# Admin Management
RESET_ADMIN=false

# Optional
LOG_LEVEL=debug
DB_TIMEOUT=30000
```

### Staging Template
```bash
# Core Application
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=staging-jwt-secret-key-different-from-production

# CORS
CORS_ORIGIN=https://staging-app-name.dokploy.app

# Database
DB_PATH=/app/data/database.sqlite

# Admin Management
RESET_ADMIN=false

# Optional
LOG_LEVEL=info
DB_TIMEOUT=30000
```

## Security Considerations

### JWT Secret Management

#### Generating a Secure JWT Secret
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### JWT Secret Rotation
1. Set new JWT_SECRET in environment variables
2. Restart the application
3. All existing tokens will become invalid
4. Users will need to log in again

### CORS Security

#### Strict CORS Configuration
```bash
# Single domain (most secure)
CORS_ORIGIN=https://your-app.dokploy.app

# Multiple domains (if needed)
CORS_ORIGIN=https://your-app.dokploy.app,https://admin.yourdomain.com
```

#### Common CORS Issues
1. **Protocol Mismatch**: HTTP vs HTTPS
2. **Trailing Slash**: Include or exclude consistently
3. **Subdomain Variations**: www vs non-www
4. **Port Numbers**: Include if not standard (80/443)

## Environment Variable Validation

### Application Startup Validation
The application validates critical environment variables on startup:

1. **JWT_SECRET**: Must be present and at least 32 characters
2. **CORS_ORIGIN**: Must be a valid URL format
3. **DB_PATH**: Parent directory must be writable
4. **PORT**: Must be a valid port number

### Validation Error Messages
```
❌ JWT_SECRET must be at least 32 characters long
❌ CORS_ORIGIN must be a valid URL
❌ Database directory is not writable: /app/data
❌ PORT must be a valid number between 1024 and 65535
```

## Troubleshooting Environment Variables

### Common Issues and Solutions

#### Issue 1: Authentication Fails After Deployment
**Cause**: JWT_SECRET changed or not set
**Solution**:
1. Verify JWT_SECRET is set correctly
2. Ensure it's at least 32 characters
3. Restart the application
4. Clear browser cache and login again

#### Issue 2: Frontend Cannot Access API
**Cause**: CORS_ORIGIN mismatch
**Solution**:
1. Check the actual application URL
2. Update CORS_ORIGIN to match exactly
3. Include protocol (https://)
4. Restart the application

#### Issue 3: Database Not Persisting
**Cause**: DB_PATH not in mounted volume
**Solution**:
1. Verify volume mounting configuration
2. Ensure DB_PATH is `/app/data/database.sqlite`
3. Check volume permissions
4. Restart the application

#### Issue 4: Admin User Not Available
**Cause**: Database initialization failed
**Solution**:
1. Check application logs for errors
2. Verify database directory permissions
3. Set RESET_ADMIN=true
4. Restart the application

## Environment Variable Management in Dokploy

### Adding Environment Variables in Dokploy

1. Navigate to your application in Dokploy
2. Click on "Environment" tab
3. Click "Add Environment Variable"
4. Enter variable name and value
5. Click "Add"
6. Repeat for all variables
7. Click "Save Changes"
8. Redeploy the application

### Updating Environment Variables

1. Navigate to the "Environment" tab
2. Find the variable to update
3. Click "Edit"
4. Update the value
5. Click "Save"
6. Redeploy the application

### Environment Variable Groups

For managing multiple environments, consider using variable groups:

```bash
# Base Variables (common to all environments)
NODE_ENV=production
PORT=3000
DB_PATH=/app/data/database.sqlite

# Environment-Specific Variables
# Production
JWT_SECRET=prod-jwt-secret
CORS_ORIGIN=https://prod-app.dokploy.app

# Staging
JWT_SECRET=staging-jwt-secret
CORS_ORIGIN=https://staging-app.dokploy.app
```

## Best Practices

### Security Best Practices

1. **Use Strong Secrets**: Always use cryptographically strong random strings
2. **Separate Environments**: Use different secrets for different environments
3. **Regular Rotation**: Rotate secrets periodically
4. **Limit Access**: Restrict access to environment variable configuration
5. **Audit Changes**: Track changes to environment variables

### Operational Best Practices

1. **Document Changes**: Keep a record of environment variable changes
2. **Test Changes**: Test environment variable changes in staging first
3. **Monitor Impact**: Monitor application behavior after changes
4. **Backup Values**: Keep secure backups of critical values
5. **Version Control**: Never commit secrets to version control

### Development Best Practices

1. **Default Values**: Provide sensible defaults for non-sensitive variables
2. **Validation**: Implement validation for required variables
3. **Documentation**: Document all variables and their purposes
4. **Examples**: Provide example configurations for different environments
5. **Testing**: Test with different variable combinations

## Quick Reference

### Required Variables Checklist
- [ ] NODE_ENV=production
- [ ] PORT=3000
- [ ] JWT_SECRET=[32+ character secret]
- [ ] CORS_ORIGIN=[your app URL]
- [ ] DB_PATH=/app/data/database.sqlite

### Optional Variables
- [ ] RESET_ADMIN=false
- [ ] LOG_LEVEL=info
- [ ] DB_TIMEOUT=30000

### Security Checklist
- [ ] JWT_SECRET is at least 32 characters
- [ ] JWT_SECRET is unique to this deployment
- [ ] CORS_ORIGIN matches the application URL exactly
- [ ] No default or example secrets are used in production

### Verification Commands
```bash
# Test health endpoint
curl https://your-app.dokploy.app/health

# Test authentication
curl -X POST https://your-app.dokploy.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check environment (in container)
dokploy exec <container-id> env | grep -E "(NODE_ENV|JWT_SECRET|CORS_ORIGIN|DB_PATH)"
```

## Conclusion

Proper configuration of environment variables is critical for the successful deployment and operation of the Workload Management Application with the authentication fix. Pay special attention to:

1. **JWT_SECRET**: Must be strong and consistent
2. **CORS_ORIGIN**: Must match your application URL exactly
3. **DB_PATH**: Must be in the mounted volume for persistence
4. **RESET_ADMIN**: Use carefully for admin user recovery

Following this guide ensures that your authentication system works correctly and securely in the Dokploy environment.