# Post-Deploy Verification Guide

## Automated Health Verification

### Health Check Verification Script
```bash
#!/bin/bash
# verify-deployment.sh

set -euo pipefail

APP_URL="${1:-https://your-app.com}"
TIMEOUT=300
RETRY_INTERVAL=10

echo "=== POST-DEPLOYMENT VERIFICATION ==="
echo "Application URL: $APP_URL"
echo "Timeout: ${TIMEOUT}s"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK") echo -e "${GREEN}✓${NC} $message" ;;
        "WARN") echo -e "${YELLOW}⚠${NC} $message" ;;
        "ERROR") echo -e "${RED}✗${NC} $message" ;;
        *) echo "$message" ;;
    esac
}

# Test function with retry logic
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    local max_attempts=$((TIMEOUT / RETRY_INTERVAL))
    local attempt=1
    
    print_status "INFO" "Testing $description..."
    
    while [ $attempt -le $max_attempts ]; do
        local response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" "${APP_URL}${endpoint}" 2>/dev/null || echo "000:0")
        local status_code=$(echo $response | cut -d: -f1)
        local response_time=$(echo $response | cut -d: -f2)
        
        if [ "$status_code" = "$expected_status" ]; then
            print_status "OK" "$description (${response_time}s)"
            return 0
        else
            if [ $attempt -eq $max_attempts ]; then
                print_status "ERROR" "$description failed - Status: $status_code"
                return 1
            fi
            print_status "WARN" "Attempt $attempt/$max_attempts failed, retrying in ${RETRY_INTERVAL}s..."
            sleep $RETRY_INTERVAL
            ((attempt++))
        fi
    done
}

# Performance test
test_performance() {
    local endpoint=$1
    local max_response_time=$2
    local description=$3
    
    print_status "INFO" "Performance testing $description..."
    
    local response=$(curl -s -o /dev/null -w "%{time_total}:%{http_code}" "${APP_URL}${endpoint}")
    local response_time=$(echo $response | cut -d: -f1)
    local status_code=$(echo $response | cut -d: -f2)
    
    if [ "$status_code" = "200" ]; then
        if (( $(echo "$response_time <= $max_response_time" | bc -l) )); then
            print_status "OK" "$description performance OK (${response_time}s)"
            return 0
        else
            print_status "WARN" "$description slow response (${response_time}s > ${max_response_time}s)"
            return 1
        fi
    else
        print_status "ERROR" "$description failed - Status: $status_code"
        return 1
    fi
}

# Load test simulation
load_test() {
    print_status "INFO" "Running basic load test..."
    
    local concurrent_requests=10
    local total_requests=100
    local endpoint="/api/health"
    
    # Create temporary file for results
    local temp_file=$(mktemp)
    
    # Run concurrent requests
    for i in $(seq 1 $concurrent_requests); do
        (
            for j in $(seq 1 $((total_requests / concurrent_requests))); do
                curl -s -o /dev/null -w "%{time_total}\n" "${APP_URL}${endpoint}"
            done
        ) >> "$temp_file" &
    done
    
    # Wait for all background jobs to complete
    wait
    
    # Calculate statistics
    local avg_time=$(awk '{ sum += $1; count++ } END { print sum/count }' "$temp_file")
    local max_time=$(sort -n "$temp_file" | tail -1)
    local min_time=$(sort -n "$temp_file" | head -1)
    
    rm "$temp_file"
    
    print_status "OK" "Load test completed:"
    echo "    Average response time: ${avg_time}s"
    echo "    Min response time: ${min_time}s"
    echo "    Max response time: ${max_time}s"
    echo "    Total requests: $total_requests"
    
    # Check if performance is acceptable
    if (( $(echo "$avg_time <= 2.0" | bc -l) )); then
        print_status "OK" "Load test performance acceptable"
        return 0
    else
        print_status "WARN" "Load test performance degraded"
        return 1
    fi
}

# Database connectivity test
test_database() {
    print_status "INFO" "Testing database connectivity..."
    
    local db_endpoint="/api/db-health"
    local response=$(curl -s "${APP_URL}${db_endpoint}" 2>/dev/null || echo '{"status":"error"}')
    
    if echo "$response" | grep -q '"status":"ok"'; then
        print_status "OK" "Database connectivity verified"
        return 0
    else
        print_status "ERROR" "Database connectivity failed"
        echo "Response: $response"
        return 1
    fi
}

# Memory usage check
check_memory_usage() {
    print_status "INFO" "Checking memory usage..."
    
    local metrics_response=$(curl -s "${APP_URL}/api/metrics" 2>/dev/null)
    local heap_used=$(echo "$metrics_response" | grep "nodejs_memory_heap_used_bytes" | awk '{print $2}')
    local heap_total=$(echo "$metrics_response" | grep "nodejs_memory_heap_total_bytes" | awk '{print $2}')
    
    if [ -n "$heap_used" ] && [ -n "$heap_total" ]; then
        local usage_percent=$(echo "scale=2; $heap_used * 100 / $heap_total" | bc)
        
        if (( $(echo "$usage_percent <= 80" | bc -l) )); then
            print_status "OK" "Memory usage normal (${usage_percent}%)"
            return 0
        else
            print_status "WARN" "High memory usage (${usage_percent}%)"
            return 1
        fi
    else
        print_status "WARN" "Could not retrieve memory metrics"
        return 1
    fi
}

# SSL certificate check
check_ssl() {
    if [[ $APP_URL == https://* ]]; then
        print_status "INFO" "Checking SSL certificate..."
        
        local domain=$(echo "$APP_URL" | sed 's|https://||' | sed 's|/.*||')
        local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
        
        if [ -n "$expiry_date" ]; then
            local expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ $days_until_expiry -gt 30 ]; then
                print_status "OK" "SSL certificate valid for $days_until_expiry days"
                return 0
            else
                print_status "WARN" "SSL certificate expires in $days_until_expiry days"
                return 1
            fi
        else
            print_status "ERROR" "Could not retrieve SSL certificate information"
            return 1
        fi
    else
        print_status "INFO" "Skipping SSL check for non-HTTPS URL"
        return 0
    fi
}

# Main verification sequence
main() {
    local exit_code=0
    
    echo "Starting post-deployment verification..."
    
    # Core health checks
    test_endpoint "/api/health" "200" "Basic health check" || exit_code=1
    test_endpoint "/api/ready" "200" "Readiness check" || exit_code=1
    test_endpoint "/api/live" "200" "Liveness check" || exit_code=1
    
    # Performance checks
    test_performance "/api/health" "2.0" "Health endpoint" || exit_code=1
    test_performance "/" "3.0" "Homepage" || exit_code=1
    
    # System checks
    check_memory_usage || exit_code=1
    test_database || exit_code=1
    check_ssl || exit_code=1
    
    # Load testing
    load_test || exit_code=1
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        print_status "OK" "ALL VERIFICATION CHECKS PASSED"
        echo ""
        echo "Deployment verification completed successfully!"
        echo "Application is ready for production traffic."
    else
        print_status "ERROR" "SOME VERIFICATION CHECKS FAILED"
        echo ""
        echo "Deployment verification completed with issues."
        echo "Please review the failed checks before directing traffic."
    fi
    
    return $exit_code
}

# Execute main function
main "$@"
```

## Metrics Validation Checklist

### Key Performance Indicators (KPIs)
```bash
# Application Performance Metrics
curl -s "$APP_URL/api/metrics" | grep -E "(response_time|error_rate|throughput)"

# Expected Baselines:
# - Response time: < 2 seconds (95th percentile)
# - Error rate: < 1%
# - Throughput: > 100 requests/minute
# - Memory usage: < 80%
# - CPU usage: < 70%
```

### Health Metrics Validation
```javascript
// health-metrics-validator.js
const axios = require('axios');

const validateHealthMetrics = async (appUrl) => {
    try {
        // Get health data
        const healthResponse = await axios.get(`${appUrl}/api/health`);
        const metricsResponse = await axios.get(`${appUrl}/api/metrics`);
        
        const health = healthResponse.data;
        const metrics = metricsResponse.data;
        
        // Validation rules
        const validations = [
            {
                name: 'Uptime',
                check: () => health.uptime > 30,
                message: 'Application should be running for at least 30 seconds'
            },
            {
                name: 'Memory Usage',
                check: () => (health.memory.heapUsed / health.memory.heapTotal) < 0.8,
                message: 'Memory usage should be below 80%'
            },
            {
                name: 'Response Time',
                check: () => health.timestamp && (Date.now() - health.timestamp) < 5000,
                message: 'Health check response should be recent (< 5s)'
            }
        ];
        
        let allPassed = true;
        
        validations.forEach(validation => {
            const passed = validation.check();
            console.log(`${passed ? '✓' : '✗'} ${validation.name}: ${passed ? 'PASS' : 'FAIL'}`);
            if (!passed) {
                console.log(`  ${validation.message}`);
                allPassed = false;
            }
        });
        
        return allPassed;
        
    } catch (error) {
        console.error('Health metrics validation failed:', error.message);
        return false;
    }
};

module.exports = { validateHealthMetrics };
```

## Monitoring Dashboard Setup

### Grafana Dashboard JSON
```json
{
  "dashboard": {
    "title": "Node.js Application Dashboard",
    "panels": [
      {
        "title": "Response Time",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(rate(http_request_duration_seconds_sum[5m])) / avg(rate(http_request_duration_seconds_count[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "nodejs_memory_heap_used_bytes"
          },
          {
            "expr": "nodejs_memory_heap_total_bytes"
          }
        ]
      }
    ]
  }
}
```

## Integration with CI/CD

### GitHub Actions Verification Step
```yaml
# .github/workflows/verify-deployment.yml
name: Post-Deploy Verification

on:
  workflow_run:
    workflows: ["Deploy to Production"]
    types: [completed]

jobs:
  verify:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Wait for deployment
        run: sleep 60
        
      - name: Run verification script
        run: |
          chmod +x ./verify-deployment.sh
          ./verify-deployment.sh ${{ secrets.PRODUCTION_URL }}
          
      - name: Send notification
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: "Post-deployment verification failed!"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```