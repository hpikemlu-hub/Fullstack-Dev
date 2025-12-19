# Step-by-Step Deployment Guide for Dokploy with Authentication Fix

## Introduction

This guide provides a detailed, step-by-step process for deploying the Workload Management Application to Dokploy with the authentication fix implemented. Each step includes specific actions, commands, and verification checks to ensure a successful deployment.

## Prerequisites

Before starting, ensure you have:
- A GitHub repository with the application code
- A Dokploy account (https://dokploy.com)
- The authentication fixes implemented in your codebase

---

## Step 1: Prepare Your Repository

### 1.1 Verify Authentication Fixes
Ensure your repository includes the authentication fixes:
- Enhanced database initialization in `src/config/database.js`
- Improved admin user creation in `src/models/User.js`
- Robust server startup logic in `server.js`
- Production-ready reset script `reset_admin_prod.js`
- Updated Docker configuration with `docker-entrypoint.sh`

### 1.2 Push Latest Code to GitHub
```bash
# Navigate to your project directory
cd workload-app

# Add all changes
git add .

# Commit changes
git commit -m "Implement authentication fixes for Dokploy deployment"

# Push to GitHub
git push origin main
```

**Verification**: Check that your latest code is visible in your GitHub repository.

---

## Step 2: Create Dokploy Account and Setup

### 2.1 Create Dokploy Account
1. Go to https://dokploy.com
2. Click "Sign Up" and create an account
3. Verify your email address

### 2.2 Connect Your GitHub Account
1. In Dokploy dashboard, click "Settings"
2. Select "Integrations"
3. Click "Connect" next to GitHub
4. Authorize Dokploy to access your repositories

**Verification**: You should see your GitHub repositories listed in Dokploy.

---

## Step 3: Create New Application in Dokploy

### 3.1 Start Application Creation
1. In Dokploy dashboard, click "New Application"
2. Select "GitHub" as the source
3. Click "Next"

### 3.2 Select Repository
1. Find and select your repository from the list
2. Select the "main" branch
3. Click "Next"

### 3.3 Configure Application Settings
1. **Application Name**: Enter a descriptive name (e.g., "workload-management")
2. **Application Type**: Select "Docker"
3. Click "Next"

**Verification**: You should see a summary of your application configuration.

---

## Step 4: Configure Build Settings

### 4.1 Docker Configuration
1. **Build Context**: `/` (root directory)
2. **Dockerfile Path**: `./Dockerfile`
3. **Build Args**: Leave empty (not needed)

### 4.2 Resource Allocation
1. **CPU**: 0.5 (minimum for basic operation)
2. **Memory**: 512MB (minimum for basic operation)
3. **Storage**: 1GB (minimum for database and logs)

**Verification**: Click "Test Build" to ensure Docker configuration is correct.

---

## Step 5: Configure Environment Variables

### 5.1 Add Required Environment Variables
Click "Add Environment Variable" and add the following:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# CORS Configuration
CORS_ORIGIN=https://your-app-name.dokploy.app

# Database Configuration
DB_PATH=/app/data/database.sqlite

# Admin Reset (Optional)
RESET_ADMIN=false
```

### 5.2 Important Notes
- Replace `your-app-name.dokploy.app` with your actual Dokploy URL
- `JWT_SECRET` must be at least 32 characters long
- `RESET_ADMIN` can be set to `true` to reset admin on next startup

**Verification**: All environment variables should appear in the list with green checkmarks.

---

## Step 6: Configure Volume Mounting

### 6.1 Add Database Volume
1. Click "Add Volume"
2. Configure as follows:
   - **Source**: `/var/lib/dokploy/volumes/workload-app-data`
   - **Destination**: `/app/data`
   - **Type**: `bind`
3. Click "Add"

### 6.2 Add Logs Volume (Optional)
1. Click "Add Volume" again
2. Configure as follows:
   - **Source**: `/var/lib/dokploy/volumes/workload-app-logs`
   - **Destination**: `/app/logs`
   - **Type**: `bind`
3. Click "Add"

**Verification**: Both volumes should appear in the volumes list.

---

## Step 7: Configure Health Checks

### 7.1 Enable Health Check
1. Scroll to "Health Check" section
2. Toggle "Enable Health Check" to ON
3. Configure as follows:
   - **Path**: `/health`
   - **Port**: `3000`
   - **Interval**: `30s`
   - **Timeout**: `3s`
   - **Retries**: `3`

### 7.2 Advanced Health Check Settings
1. **Start Period**: `10s` (time to wait before starting health checks)
2. **Grace Period**: `30s` (time to wait for first successful check)

**Verification**: Health check configuration should be saved successfully.

---

## Step 8: Configure Networking

### 8.1 Port Configuration
1. **Internal Port**: `3000` (application port)
2. **External Port**: Leave as default (Dokploy will assign)

### 8.2 Domain Configuration
1. Note the assigned domain (e.g., `workload-management.dokploy.app`)
2. Update `CORS_ORIGIN` environment variable if needed

**Verification**: Port configuration should match your application requirements.

---

## Step 9: Deploy Application

### 9.1 Initial Deployment
1. Review all configurations
2. Click "Deploy" to start the deployment
3. Wait for the deployment to complete (3-7 minutes)

### 9.2 Monitor Deployment Progress
1. Watch the build logs for any errors
2. Check that all stages complete successfully:
   - Repository clone
   - Docker image build
   - Container startup
   - Health check activation

**Verification**: Application should show "Running" status with green health indicator.

---

## Step 10: Verify Deployment

### 10.1 Basic Application Verification
1. Open your application URL in a browser
2. Verify the following:
   - Application loads without errors
   - Login page is accessible
   - Health check endpoint responds: `https://your-app.dokploy.app/health`

### 10.2 Test Health Check via API
```bash
# Test health endpoint
curl https://your-app.dokploy.app/health

# Expected response:
# {"status":"ok","timestamp":"2023-12-01T12:00:00.000Z","uptime":123}
```

**Verification**: All basic checks should pass successfully.

---

## Step 11: Verify Authentication System

### 11.1 Test Admin Login
1. Navigate to the login page
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click "Login"
4. Verify successful login and redirect to dashboard

### 11.2 Test API Authentication
```bash
# Test login via API
curl -X POST https://your-app.dokploy.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected response:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{"id":1,"username":"admin","role":"Admin"}}
```

### 11.3 Verify Database Persistence
1. Create a test user or workload item
2. Restart the application from Dokploy dashboard
3. Verify the data still exists after restart

**Verification**: All authentication tests should pass successfully.

---

## Step 12: Secure Your Application

### 12.1 Change Default Admin Password
1. Login with admin/admin123
2. Navigate to profile or user settings
3. Change password to a strong, unique password
4. Verify password change works

### 12.2 Verify Security Headers
```bash
# Check security headers
curl -I https://your-app.dokploy.app

# Look for headers like:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

**Verification**: Default password should be changed and security headers present.

---

## Step 13: Configure Backups

### 13.1 Manual Database Backup
```bash
# Access container shell (via Dokploy terminal)
dokploy exec <container-id> sh

# Create backup
cp /app/data/database.sqlite /app/data/database_backup_$(date +%Y%m%d_%H%M%S).sqlite

# List backups
ls -la /app/data/database_backup_*
```

### 13.2 Automated Backup Setup (Optional)
1. Create a backup script in your repository
2. Set up cron job in Dokploy (if available)
3. Or use external backup service

**Verification**: Backup files should be created successfully.

---

## Step 14: Monitor and Maintain

### 14.1 Set Up Monitoring
1. Check application logs regularly
2. Monitor health check status
3. Set up alerts for failures (if supported)

### 14.2 Regular Maintenance Tasks
1. Review and update dependencies
2. Check database size and performance
3. Verify backup integrity
4. Monitor authentication logs

**Verification**: Monitoring should be active and maintenance tasks documented.

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Admin User Not Found
**Symptoms**: Login fails with "User not found" error
**Solutions**:
1. Check application logs for admin creation errors
2. Reset admin user:
   ```bash
   # Set environment variable
   RESET_ADMIN=true
   
   # Restart application
   ```
3. Manual reset:
   ```bash
   # Access container shell
   dokploy exec <container-id> sh
   
   # Run reset script
   npm run reset-admin
   ```

#### Issue 2: Database Permission Errors
**Symptoms**: Container startup failures, database write errors
**Solutions**:
1. Check volume mounting configuration
2. Verify volume permissions:
   ```bash
   # On Dokploy server
   ls -la /var/lib/dokploy/volumes/workload-app-data
   
   # Fix permissions if needed
   sudo chown -R 1001:1001 /var/lib/dokploy/volumes/workload-app-data
   sudo chmod -R 755 /var/lib/dokploy/volumes/workload-app-data
   ```

#### Issue 3: Health Check Failures
**Symptoms**: Health check shows as failing
**Solutions**:
1. Check application logs for startup errors
2. Verify health endpoint is accessible:
   ```bash
   curl https://your-app.dokploy.app/health
   ```
3. Check if application is listening on correct port

#### Issue 4: CORS Errors
**Symptoms**: Frontend cannot connect to API
**Solutions**:
1. Verify CORS_ORIGIN environment variable
2. Check that it matches your application URL exactly
3. Restart application after changing CORS_ORIGIN

---

## Rollback Procedures

### Quick Rollback
1. In Dokploy dashboard, go to your application
2. Click "Deployments" tab
3. Find the previous successful deployment
4. Click "Rollback" next to it

### Complete Reset
1. Stop the application
2. Remove database file:
   ```bash
   # Access container shell
   dokploy exec <container-id> sh
   
   # Remove database
   rm /app/data/database.sqlite
   ```
3. Restart the application
4. Database and admin user will be recreated

### Restore from Backup
1. Stop the application
2. Restore database from backup:
   ```bash
   # Access container shell
   dokploy exec <container-id> sh
   
   # Restore from backup
   cp /app/data/database_backup_20231201.sqlite /app/data/database.sqlite
   ```
3. Restart the application

---

## Performance Optimization

### Database Optimization
1. Regularly check database size
2. Implement data archival for old records
3. Consider database indexing for frequently queried fields

### Application Optimization
1. Monitor response times
2. Implement caching if needed
3. Optimize database queries

---

## Security Best Practices

### Regular Security Tasks
1. Update dependencies regularly
2. Review and rotate JWT secrets periodically
3. Monitor authentication logs for suspicious activity
4. Implement rate limiting for authentication endpoints

### Security Monitoring
1. Set up alerts for failed login attempts
2. Monitor for unusual API usage patterns
3. Regular security audits of user permissions

---

## Conclusion

Following this step-by-step guide ensures a successful deployment of the Workload Management Application to Dokploy with the authentication fix properly implemented. The key to a successful deployment is:

1. Proper configuration of environment variables
2. Correct volume mounting for database persistence
3. Thorough verification of the authentication system
4. Regular monitoring and maintenance

For additional support, refer to:
- Dokploy Documentation: https://docs.dokploy.com
- Application Documentation: Check the repository for additional guides
- Community Support: https://discord.gg/dokploy

---

## Quick Reference

### Essential Commands
```bash
# Reset admin user
RESET_ADMIN=true

# Check health status
curl https://your-app.dokploy.app/health

# Test authentication
curl -X POST https://your-app.dokploy.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
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

### Critical Environment Variables
```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-32-char-min-secret-key
CORS_ORIGIN=https://your-app.dokploy.app
DB_PATH=/app/data/database.sqlite