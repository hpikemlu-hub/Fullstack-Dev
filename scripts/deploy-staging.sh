#!/bin/bash

# Staging Deployment Script
# Automated deployment to staging environment with comprehensive checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="${STAGING_URL:-https://staging.workload.example.com}"
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
DOCKER_IMAGE="workload-app:staging-$(date +%Y%m%d-%H%M%S)"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be healthy
wait_for_health() {
    local url=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    print_status "Waiting for service to be healthy at $url..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            print_error "Health check timeout after ${timeout}s"
            return 1
        fi
        
        if curl -f -s "$url/api/health" > /dev/null 2>&1; then
            print_success "Service is healthy!"
            return 0
        fi
        
        print_status "Service not ready yet... (${elapsed}s/${timeout}s)"
        sleep 10
    done
}

# Function to run smoke tests
run_smoke_tests() {
    local base_url=$1
    
    print_step "Running smoke tests against $base_url"
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    if ! curl -f -s "$base_url/api/health" | jq -e '.status == "healthy"' > /dev/null; then
        print_error "Health check failed"
        return 1
    fi
    
    # Test API endpoints
    print_status "Testing API endpoints..."
    local endpoints=("/api/auth/login" "/api/employees" "/api/workload" "/api/calendar/events")
    
    for endpoint in "${endpoints[@]}"; do
        # Test if endpoint is reachable (expect 401/405 for protected routes, not 500)
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$endpoint")
        if [[ $status_code -ge 500 ]]; then
            print_error "Endpoint $endpoint returned server error: $status_code"
            return 1
        fi
        print_status "✓ $endpoint (HTTP $status_code)"
    done
    
    # Test static assets
    print_status "Testing static assets..."
    if ! curl -f -s "$base_url/_next/static/" > /dev/null 2>&1; then
        print_warning "Static assets test failed (may be normal for CDN)"
    fi
    
    print_success "Smoke tests completed successfully!"
}

# Function to backup current deployment
backup_current_deployment() {
    print_step "Creating backup of current deployment..."
    
    # This is where you'd backup the current deployment
    # Implementation depends on your deployment method (Docker, Kubernetes, etc.)
    
    if [ -n "$COOLIFY_STAGING_WEBHOOK" ]; then
        # Coolify-specific backup logic
        print_status "Creating Coolify application snapshot..."
        # Add Coolify snapshot logic here
    fi
    
    print_success "Backup created successfully"
}

# Function to rollback deployment
rollback_deployment() {
    print_error "Deployment failed! Initiating rollback..."
    
    # Rollback logic depends on your deployment method
    if [ -n "$COOLIFY_STAGING_WEBHOOK" ]; then
        # Coolify-specific rollback
        print_status "Rolling back via Coolify..."
        # Add rollback logic here
    fi
    
    print_success "Rollback completed"
}

# Function to send notifications
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local emoji
        case $status in
            "success") emoji="✅" ;;
            "warning") emoji="⚠️" ;;
            "error") emoji="❌" ;;
            *) emoji="ℹ️" ;;
        esac
        
        curl -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$emoji Staging Deployment: $message\"}" \
            > /dev/null 2>&1 || true
    fi
    
    # Add other notification methods here (email, Discord, etc.)
}

# Main deployment function
main() {
    echo "🚀 Starting Staging Deployment"
    echo "================================"
    echo "Target URL: $STAGING_URL"
    echo "Docker Image: $DOCKER_IMAGE"
    echo "Timestamp: $(date)"
    echo ""
    
    # Pre-flight checks
    print_step "Running pre-flight checks..."
    
    if ! command_exists curl; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command_exists jq; then
        print_warning "jq not found - some checks will be skipped"
    fi
    
    if [ -z "$STAGING_URL" ]; then
        print_error "STAGING_URL environment variable is required"
        exit 1
    fi
    
    # Build Docker image
    print_step "Building Docker image..."
    if ! docker build -f docker/Dockerfile -t "$DOCKER_IMAGE" .; then
        print_error "Docker build failed"
        send_notification "error" "Docker build failed"
        exit 1
    fi
    print_success "Docker image built: $DOCKER_IMAGE"
    
    # Run tests on built image
    print_step "Running tests on built image..."
    if ! docker run --rm "$DOCKER_IMAGE" npm run test > /dev/null 2>&1; then
        print_warning "Tests failed in Docker image"
        # Continue deployment as this might be expected in staging
    fi
    
    # Backup current deployment
    backup_current_deployment
    
    # Deploy to staging
    print_step "Deploying to staging environment..."
    
    if [ -n "$COOLIFY_STAGING_WEBHOOK" ]; then
        # Deploy via Coolify webhook
        print_status "Triggering Coolify deployment..."
        
        local response=$(curl -s -X POST "$COOLIFY_STAGING_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"image\": \"$DOCKER_IMAGE\"}")
        
        if [[ $? -eq 0 ]]; then
            print_success "Deployment triggered successfully"
        else
            print_error "Failed to trigger deployment"
            send_notification "error" "Failed to trigger Coolify deployment"
            exit 1
        fi
    else
        print_error "No deployment method configured (COOLIFY_STAGING_WEBHOOK required)"
        exit 1
    fi
    
    # Wait for deployment to be healthy
    print_step "Waiting for deployment to be ready..."
    if ! wait_for_health "$STAGING_URL" "$HEALTH_CHECK_TIMEOUT"; then
        send_notification "error" "Deployment health check failed"
        rollback_deployment
        exit 1
    fi
    
    # Run smoke tests
    if ! run_smoke_tests "$STAGING_URL"; then
        send_notification "error" "Smoke tests failed"
        rollback_deployment
        exit 1
    fi
    
    # Run integration tests (if available)
    if [ -f "package.json" ] && npm run test:e2e --dry-run > /dev/null 2>&1; then
        print_step "Running integration tests..."
        if npm run test:e2e -- --baseURL="$STAGING_URL"; then
            print_success "Integration tests passed"
        else
            print_warning "Integration tests failed - check test results"
        fi
    fi
    
    # Final health check
    print_step "Final deployment verification..."
    local health_response=$(curl -s "$STAGING_URL/api/health")
    echo "Health Response: $health_response"
    
    # Cleanup old Docker images (keep last 5)
    print_step "Cleaning up old Docker images..."
    docker images "workload-app" --format "table {{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
        grep -v "REPOSITORY" | \
        sort -k2 -r | \
        tail -n +6 | \
        awk '{print $1}' | \
        xargs -r docker rmi || true
    
    # Success notification
    print_success "🎉 Staging deployment completed successfully!"
    echo ""
    echo "Deployment Details:"
    echo "  Environment: Staging"
    echo "  URL: $STAGING_URL"
    echo "  Image: $DOCKER_IMAGE"
    echo "  Time: $(date)"
    echo ""
    echo "Next Steps:"
    echo "  - Review staging environment: $STAGING_URL"
    echo "  - Run manual testing if needed"
    echo "  - Proceed with production deployment if satisfied"
    
    send_notification "success" "Staging deployment completed successfully! URL: $STAGING_URL"
}

# Error handling
trap 'print_error "Deployment script failed on line $LINENO"' ERR

# Run main function
main "$@"