# Coolify Deployment Procedures

## Force Rebuild Procedures

### Method 1: Through Coolify UI
1. **Access Coolify Dashboard**
   - Navigate to your Coolify instance
   - Login with appropriate credentials
   - Go to Applications → Your App

2. **Force Rebuild Steps**
   ```bash
   # In Coolify UI:
   1. Click on "Deployments" tab
   2. Click "Force Rebuild" button
   3. Confirm the action in popup dialog
   4. Monitor build logs in real-time
   ```

3. **Build Configuration Override**
   - Click "Advanced Settings"
   - Check "No Cache" option
   - Set build arguments if needed:
     ```
     --no-cache
     --pull
     --force-rm
     ```

### Method 2: API-Based Force Rebuild
```bash
# Using Coolify API
curl -X POST \
  https://your-coolify-instance.com/api/v1/applications/{app-id}/deploy \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force": true,
    "no_cache": true,
    "environment": "production"
  }'
```

### Method 3: CLI Force Rebuild
```bash
# If using Coolify CLI
coolify app deploy \
  --app-id your-app-id \
  --force \
  --no-cache \
  --environment production
```

### Method 4: Git-Based Trigger
```bash
# Force rebuild by pushing empty commit
git commit --allow-empty -m "Force rebuild: $(date)"
git push origin main

# Or using git tags
git tag -a "force-rebuild-$(date +%Y%m%d-%H%M%S)" -m "Force rebuild"
git push origin --tags
```

---

## Cache Busting Strategies

### Docker Layer Cache Busting
```dockerfile
# In Dockerfile.optimized
# Add build argument for cache busting
ARG BUILD_TIMESTAMP
ARG GIT_COMMIT_SHA

# Use in RUN commands to invalidate cache
RUN echo "Build: $BUILD_TIMESTAMP, Commit: $GIT_COMMIT_SHA" > /app/build-info.txt
```

### Application Cache Busting
```javascript
// In your Node.js application
const CACHE_VERSION = process.env.CACHE_VERSION || Date.now();

// Add to static asset URLs
app.use('/static', express.static('public', {
  etag: true,
  maxAge: '1d',
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', `public, max-age=86400, must-revalidate`);
    res.setHeader('X-Cache-Version', CACHE_VERSION);
  }
}));
```

### Environment-Based Cache Control
```bash
# Set in Coolify environment variables
CACHE_VERSION=$(date +%Y%m%d%H%M%S)
BUILD_HASH=$(git rev-parse HEAD)
STATIC_ASSETS_VERSION=${CACHE_VERSION}
```

---

## Deployment Automation Scripts

### Pre-deployment Script
```bash
#!/bin/bash
# pre-deploy.sh

set -euo pipefail

echo "Starting pre-deployment checks..."

# Check system resources
check_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local memory_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        echo "WARNING: High CPU usage: ${cpu_usage}%"
        exit 1
    fi
    
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        echo "WARNING: High memory usage: ${memory_usage}%"
        exit 1
    fi
    
    echo "✓ System resources OK"
}

# Check database connectivity
check_database() {
    if ! docker exec postgres-container pg_isready -U postgres > /dev/null 2>&1; then
        echo "ERROR: Database not accessible"
        exit 1
    fi
    echo "✓ Database connectivity OK"
}

# Create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    docker exec postgres-container pg_dump -U postgres app_db > "backup_${timestamp}.sql"
    echo "✓ Backup created: backup_${timestamp}.sql"
}

# Execute checks
check_resources
check_database
create_backup

echo "Pre-deployment checks completed successfully"
```

### Post-deployment Script
```bash
#!/bin/bash
# post-deploy.sh

set -euo pipefail

APP_URL="https://your-app.com"
HEALTH_ENDPOINT="${APP_URL}/api/health"
TIMEOUT=300  # 5 minutes

echo "Starting post-deployment verification..."

# Wait for application to be ready
wait_for_app() {
    local start_time=$(date +%s)
    local end_time=$((start_time + TIMEOUT))
    
    while [ $(date +%s) -lt $end_time ]; do
        if curl -f -s "$HEALTH_ENDPOINT" > /dev/null; then
            echo "✓ Application is responding"
            return 0
        fi
        echo "Waiting for application to respond..."
        sleep 10
    done
    
    echo "ERROR: Application failed to respond within ${TIMEOUT} seconds"
    return 1
}

# Test critical endpoints
test_endpoints() {
    local endpoints=(
        "/api/health"
        "/api/ready"
        "/api/live"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="${APP_URL}${endpoint}"
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
        
        if [ "$response" -eq 200 ]; then
            echo "✓ $endpoint responding correctly"
        else
            echo "ERROR: $endpoint returned status $response"
            return 1
        fi
    done
}

# Check performance metrics
check_performance() {
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$HEALTH_ENDPOINT")
    
    if (( $(echo "$response_time > 5.0" | bc -l) )); then
        echo "WARNING: Slow response time: ${response_time}s"
        return 1
    fi
    
    echo "✓ Response time OK: ${response_time}s"
}

# Warm up cache
warm_cache() {
    echo "Warming up application cache..."
    
    # Add your cache warming URLs here
    local cache_urls=(
        "${APP_URL}/"
        "${APP_URL}/api/data"
    )
    
    for url in "${cache_urls[@]}"; do
        curl -s "$url" > /dev/null
        echo "✓ Warmed: $url"
    done
}

# Execute verification steps
wait_for_app
test_endpoints
check_performance
warm_cache

echo "Post-deployment verification completed successfully"
```

---

## Emergency Procedures

### Quick Rollback Script
```bash
#!/bin/bash
# emergency-rollback.sh

set -euo pipefail

PREVIOUS_IMAGE_TAG="$1"
APP_NAME="your-app"

if [ -z "$PREVIOUS_IMAGE_TAG" ]; then
    echo "Usage: $0 <previous-image-tag>"
    echo "Available tags:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | grep $APP_NAME
    exit 1
fi

echo "EMERGENCY ROLLBACK: Rolling back to $PREVIOUS_IMAGE_TAG"

# Stop current container
docker stop $APP_NAME || true

# Start with previous image
docker run -d \
    --name $APP_NAME \
    --restart unless-stopped \
    -p 3000:3000 \
    -e NODE_ENV=production \
    your-registry/$APP_NAME:$PREVIOUS_IMAGE_TAG

# Wait for health check
sleep 30

# Verify rollback
if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
    echo "✓ Rollback successful"
else
    echo "ERROR: Rollback failed"
    exit 1
fi
```

### System Health Check Script
```bash
#!/bin/bash
# health-check.sh

check_coolify_health() {
    echo "Checking Coolify system health..."
    
    # Check Docker daemon
    if ! docker info > /dev/null 2>&1; then
        echo "ERROR: Docker daemon not running"
        return 1
    fi
    
    # Check available disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 85 ]; then
        echo "WARNING: Disk usage high: ${disk_usage}%"
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -gt 85 ]; then
        echo "WARNING: Memory usage high: ${memory_usage}%"
    fi
    
    echo "✓ Coolify system health OK"
}

check_coolify_health
```