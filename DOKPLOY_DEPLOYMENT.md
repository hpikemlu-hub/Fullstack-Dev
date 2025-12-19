# Comprehensive Dokploy Deployment Guide with Authentication Fix

## Overview

This guide provides comprehensive instructions for deploying the Workload Management Application to Dokploy with the authentication fix implemented. The application includes enhanced database initialization, robust admin user creation, and improved error handling specifically designed for the Dokploy environment.

## Prerequisites

1. **GitHub Repository**: Ensure the code is pushed to your GitHub repository
2. **Dokploy Account**: You need a Dokploy account (https://dokploy.com)
3. **Authentication Fix**: Ensure the authentication fixes are implemented in your codebase

## Key Features of the Authentication Fix

- **Robust Database Initialization**: Automatic database creation with proper permissions
- **Reliable Admin User Creation**: Admin user is created automatically on first startup
- **Enhanced Error Handling**: Comprehensive error handling with retry mechanisms
- **Database Persistence**: Proper volume mounting for data persistence
- **Production Ready**: All fixes are designed for production environments

## Step 1: Push to GitHub

If you haven't already, run the following commands:

```bash
cd workload-app
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

## Step 2: Setup in Dokploy

1. Login to your Dokploy dashboard
2. Click the "New Application" button
3. Select "GitHub" as the source
4. Authorize Dokploy to access your GitHub repository
5. Select your repository from the list
6. Configure the application:

### Build Configuration

- **Build Context**: Root directory
- **Dockerfile Path**: `./Dockerfile`
- **Build Command**: Not required (handled by Dockerfile)
- **Start Command**: `npm start`

### Environment Variables

Add the following environment variables:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# CORS Configuration
CORS_ORIGIN=https://your-app-domain.dokploy.app

# Database Configuration (SQLite is recommended for this app)
DB_PATH=/app/data/database.sqlite

# Optional: Admin Reset (set to "true" to reset admin on next startup)
RESET_ADMIN=false
```

**Important Notes**:
- `JWT_SECRET` must be at least 32 characters long
- `CORS_ORIGIN` should match your Dokploy application URL
- `DB_PATH` is critical for database persistence in Dokploy

### Volume Configuration

For database persistence, add the following volume:

```bash
# Mount Volume for Database Persistence
Source: /var/lib/dokploy/volumes/your-app-data
Destination: /app/data
```

## Step 3: Database Configuration

This application uses SQLite with automatic initialization. The authentication fix ensures:

1. **Automatic Database Creation**: Database is created automatically on first startup
2. **Proper Permissions**: Database directory and file permissions are set correctly
3. **Admin User Creation**: Admin user is created automatically with default credentials
4. **Data Persistence**: Database persists across container restarts

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Security Note**: Change the default admin password immediately after first login!

## Step 4: Deployment Process

1. Click "Deploy" to start the deployment process
2. Dokploy will:
   - Clone your GitHub repository
   - Build the Docker image with multi-stage build
   - Deploy the application with proper volume mounting

3. Wait for the deployment to complete (typically 3-7 minutes)

## Step 5: Post-Deployment Verification

### Basic Application Verification

1. Open your application URL provided by Dokploy
2. Verify the following:
   - Application loads without errors
   - Health check endpoint responds: `https://your-app-url.dokploy.app/health`
   - Login page is accessible

### Authentication Verification

1. **Test Admin Login**:
   - Navigate to the login page
   - Enter credentials: `admin` / `admin123`
   - Verify successful login and redirect to dashboard

2. **API Authentication Test**:
   ```bash
   # Test login via API
   curl -X POST https://your-app-url.dokploy.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Database Persistence Test**:
   - Create a test user or workload item
   - Restart the application from Dokploy dashboard
   - Verify the data still exists after restart

## Step 6: Troubleshooting

### Common Deployment Issues

#### 1. Database Initialization Issues
**Symptoms**: Admin user not found, authentication failures
**Solutions**:
- Check application logs for database initialization errors
- Verify volume mounting is configured correctly
- Ensure `/app/data` directory is writable

#### 2. Permission Issues
**Symptoms**: Container startup failures, database write errors
**Solutions**:
- Check that the volume has proper permissions
- Verify the application is running as non-root user
- Manually reset admin user if needed

#### 3. Authentication Failures
**Symptoms**: Login always fails, JWT token errors
**Solutions**:
- Verify JWT_SECRET is set and consistent
- Check that admin user exists in database
- Reset admin user using the reset script

### Manual Admin Reset

If you need to manually reset the admin user:

1. **Via Environment Variable**:
   - Set `RESET_ADMIN=true` in environment variables
   - Restart the application
   - Reset will happen automatically during startup

2. **Via Container Shell**:
   ```bash
   # Access container shell
   dokploy exec <container-id> sh
   
   # Run reset script
   npm run reset-admin
   ```

## Step 7: Backup and Recovery

### Database Backup

For SQLite database backup:

1. **Manual Backup**:
   ```bash
   # Access container shell
   dokploy exec <container-id> sh
   
   # Create backup
   cp /app/data/database.sqlite /app/data/database_backup_$(date +%Y%m%d).sqlite
   ```

2. **Automated Backup**:
   - Set up a cron job in Dokploy to periodically copy the database
   - Use Dokploy's backup features if available

### Recovery Procedures

1. **From Backup**:
   ```bash
   # Stop application
   # Restore database from backup
   cp /app/data/database_backup_20231201.sqlite /app/data/database.sqlite
   # Start application
   ```

2. **Complete Reset**:
   - Remove the database file: `rm /app/data/database.sqlite`
   - Restart the application
   - Database and admin user will be recreated

## Step 8: Security Configuration

### Essential Security Steps

1. **Change Default Password**:
   - Login with admin/admin123
   - Immediately change the admin password
   - Use a strong, unique password

2. **Secure JWT Secret**:
   - Ensure JWT_SECRET is long and complex
   - Don't use the default value from documentation

3. **HTTPS Configuration**:
   - Ensure your application uses HTTPS
   - Update CORS_ORIGIN to use HTTPS URL

### Additional Security Measures

1. **Regular Backups**: Set up automated database backups
2. **Monitoring**: Monitor application logs for suspicious activity
3. **Updates**: Keep dependencies updated for security patches

## Step 9: Custom Domain (Optional)

To use a custom domain:

1. Select "Domains" in the Dokploy dashboard
2. Add your custom domain
3. Update DNS records according to Dokploy's instructions
4. Update the CORS_ORIGIN environment variable to your custom domain
5. Redeploy the application

## Step 10: Continuous Deployment

Dokploy will automatically redeploy when:
- Code is pushed to the main branch
- Environment variables are updated
- Manual deployment is triggered from the dashboard

## Support and Resources

- **Dokploy Documentation**: https://docs.dokploy.com
- **GitHub Issues**: https://github.com/dokploy/dokploy/issues
- **Community**: https://discord.gg/dokploy
- **Application Issues**: Check the authentication documentation in the repository

## Quick Reference

### Environment Variables
```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-32-char-min-secret-key
CORS_ORIGIN=https://your-app.dokploy.app
DB_PATH=/app/data/database.sqlite
RESET_ADMIN=false
```

### Default Credentials
```
Username: admin
Password: admin123
```

### Important Paths
```
Database: /app/data/database.sqlite
Logs: /app/logs/
Frontend: /app/frontend/dist/
```

### Useful Commands
```bash
# Reset admin user
npm run reset-admin

# Check database
sqlite3 /app/data/database.sqlite ".tables"

# View logs
docker logs <container-id>
```