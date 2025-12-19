# Dokploy Authentication Verification Checklist

This document provides a comprehensive checklist to verify that the authentication flow is working correctly with the implemented fixes for the Dokploy deployment.

## 1. Pre-Deployment Verification

### 1.1 Code Review
- [ ] Review database.js for proper error handling and retry logic
- [ ] Review User.js for enhanced authentication methods
- [ ] Review server.js for startup initialization with admin user
- [ ] Review reset_admin_prod.js for production admin reset functionality
- [ ] Review Dockerfile for proper container setup
- [ ] Review docker-entrypoint.sh for directory creation and permissions

### 1.2 Local Testing
- [ ] Run `node test_auth_flow.js` to verify authentication flow locally
- [ ] Run `node test_docker_auth.js` to verify Docker-specific functionality
- [ ] Test admin user creation with `node reset_admin_prod.js`
- [ ] Verify database initialization works correctly
- [ ] Test authentication with correct and incorrect credentials

## 2. Docker Container Verification

### 2.1 Build Verification
```bash
# Build the Docker image
docker build -t workload-app .

# Verify the image was built successfully
docker images | grep workload-app
```

- [ ] Docker image builds without errors
- [ ] All dependencies are installed correctly
- [ ] Frontend build completes successfully
- [ ] Non-root user is created properly

### 2.2 Container Startup Verification
```bash
# Start the container
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name workload-test workload-app

# Check container logs
docker logs workload-test

# Check container status
docker ps | grep workload-test
```

- [ ] Container starts successfully
- [ ] Database directory is created with proper permissions
- [ ] Database file is created in /app/data
- [ ] Admin user is created automatically
- [ ] Server starts without errors
- [ ] Health check passes

## 3. Database Verification

### 3.1 Database File Verification
```bash
# Check if database file exists
docker exec workload-test ls -la /app/data/database.sqlite

# Check database file permissions
docker exec workload-test stat /app/data/database.sqlite

# Check database file size
docker exec workload-test wc -c /app/data/database.sqlite
```

- [ ] Database file exists at /app/data/database.sqlite
- [ ] Database file has correct permissions (readable and writable)
- [ ] Database file size is reasonable (not empty)
- [ ] Database file persists after container restart

### 3.2 Database Content Verification
```bash
# Connect to database and check tables
docker exec -it workload-test node -e "
const database = require('./src/config/database');
database.initialize().then(async () => {
  const tables = await database.all(\"SELECT name FROM sqlite_master WHERE type='table'\");
  console.log('Tables:', tables.map(t => t.name));
  const users = await database.all('SELECT username, role FROM users');
  console.log('Users:', users);
  await database.close();
}).catch(console.error);
"
```

- [ ] Users table exists
- [ ] Workloads table exists
- [ ] Admin user exists in the database
- [ ] Admin user has correct role (Admin)
- [ ] Admin user has correct username (admin)
- [ ] Database integrity check passes

## 4. Authentication Flow Verification

### 4.1 Admin User Login
```bash
# Test admin login via curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

- [ ] Login request succeeds (HTTP 200)
- [ ] Response contains JWT token
- [ ] Response contains user data without password
- [ ] Token has correct expiration time
- [ ] User role is correctly set to "Admin"

### 4.2 Authentication Error Handling
```bash
# Test login with wrong password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}'

# Test login with non-existent user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nonexistent","password":"password"}'

# Test login with empty credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"","password":""}'
```

- [ ] Wrong password returns HTTP 401
- [ ] Non-existent user returns HTTP 401
- [ ] Empty credentials return HTTP 401
- [ ] Error messages are appropriate and don't leak sensitive information

### 4.3 Token Validation
```bash
# Extract token from login response and test protected route
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Test protected route with valid token
curl -X GET http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer $TOKEN"

# Test protected route with invalid token
curl -X GET http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer invalid-token"
```

- [ ] Protected route works with valid token
- [ ] Protected route returns user data
- [ ] Protected route fails with invalid token
- [ ] Token middleware correctly validates tokens

## 5. Production Environment Verification

### 5.1 Environment Variables
```bash
# Check environment variables in container
docker exec workload-test env | grep -E "(NODE_ENV|DB_PATH|JWT_SECRET)"
```

- [ ] NODE_ENV is set to "production"
- [ ] DB_PATH is set to "/app/data/database.sqlite"
- [ ] JWT_SECRET is set (not empty)
- [ ] CORS_ORIGIN is set correctly for production domain

### 5.2 Security Verification
```bash
# Check if running as non-root user
docker exec workload-test id

# Check file permissions
docker exec workload-test ls -la /app/data

# Test security headers
curl -I http://localhost:3000
```

- [ ] Application runs as non-root user
- [ ] Database directory has correct permissions
- [ ] Security headers are present (helmet middleware)
- [ ] CORS is properly configured for production domain

## 6. Persistence Verification

### 6.1 Data Persistence After Restart
```bash
# Create test data
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"testuser","password":"testpass","nama":"Test User","role":"User"}'

# Stop and restart container
docker stop workload-test
docker start workload-test

# Verify data persists after restart
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Test user is created successfully
- [ ] Data persists after container restart
- [ ] Admin user is still available after restart
- [ ] Authentication works after restart

### 6.2 Volume Mounting Verification
```bash
# Check if volume is properly mounted
docker inspect workload-test | grep -A 10 -B 5 "Mounts"

# Check if data is written to mounted volume
ls -la ./data
```

- [ ] Volume is properly mounted
- [ ] Database file is in the mounted volume
- [ ] Data is accessible from the host
- [ ] Volume permissions are correct

## 7. Performance and Health Checks

### 7.1 Health Check Verification
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test API health endpoint
curl http://localhost:3000/api/health

# Check Docker health status
docker ps | grep workload-test
```

- [ ] Health endpoint returns HTTP 200
- [ ] Health endpoint includes uptime and environment info
- [ ] Docker health check passes
- [ ] Application responds within health check timeout

### 7.2 Performance Verification
```bash
# Test multiple concurrent login requests
for i in {1..10}; do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' > /dev/null &
done
wait

# Check application logs for errors
docker logs workload-test | tail -20
```

- [ ] Multiple concurrent requests work correctly
- [ ] No database locking issues
- [ ] No memory leaks or crashes
- [ ] Application remains stable under load

## 8. Frontend Integration Verification

### 8.1 Frontend Build Verification
```bash
# Check if frontend is built correctly
docker exec workload-test ls -la /app/frontend/dist

# Check if index.html exists
docker exec workload-test cat /app/frontend/dist/index.html | head -10
```

- [ ] Frontend build completes successfully
- [ ] Static files are served correctly
- [ ] Frontend can access API endpoints
- [ ] Login page loads correctly

### 8.2 Frontend Authentication Flow
- [ ] Login page loads without errors
- [ ] Login form submits correctly
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows error message
- [ ] Token is stored correctly in localStorage
- [ ] Protected routes are properly guarded

## 9. Troubleshooting Common Issues

### 9.1 Database Issues
**Problem**: Database file not created
**Solution**: Check /app/data directory permissions and Docker volume mounting

**Problem**: Database connection failed
**Solution**: Verify DB_PATH environment variable and directory permissions

**Problem**: Admin user not created
**Solution**: Run `node reset_admin_prod.js` in the container

### 9.2 Authentication Issues
**Problem**: Login always fails
**Solution**: Check admin user exists in database and password is correct

**Problem**: JWT token invalid
**Solution**: Verify JWT_SECRET environment variable is set consistently

**Problem**: CORS errors
**Solution**: Check CORS_ORIGIN environment variable and frontend URL

### 9.3 Container Issues
**Problem**: Container won't start
**Solution**: Check container logs for startup errors

**Problem**: Health check fails
**Solution**: Verify application is listening on correct port

**Problem**: Data doesn't persist
**Solution**: Check volume mounting and directory permissions

## 10. Final Verification Checklist

- [ ] All automated tests pass
- [ ] Manual authentication tests pass
- [ ] Database persistence works correctly
- [ ] Container starts and runs stable
- [ ] Health checks pass
- [ ] Security configurations are correct
- [ ] Frontend integration works
- [ ] Performance is acceptable
- [ ] Error handling works correctly
- [ ] Logging provides sufficient information for troubleshooting

## 11. Production Deployment Verification

After deploying to Dokploy:

- [ ] Application is accessible via the production URL
- [ ] SSL certificate is properly configured
- [ ] Database volume is properly mounted and persistent
- [ ] Admin user can login with correct credentials
- [ ] All authentication flows work as expected
- [ ] Error monitoring and logging are working
- [ ] Backup and recovery procedures are tested

## 12. Ongoing Monitoring

- [ ] Set up monitoring for authentication failures
- [ ] Monitor database file size and growth
- [ ] Monitor application performance and uptime
- [ ] Set up alerts for critical errors
- [ ] Regularly verify backup integrity
- [ ] Periodically test disaster recovery procedures