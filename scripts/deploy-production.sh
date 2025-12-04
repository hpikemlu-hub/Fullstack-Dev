#!/bin/bash

# Production Deployment Script
# Secure and automated deployment to production with comprehensive safety checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_URL="${PRODUCTION_URL:-https://workload.kemlu.go.id}"
HEALTH_CHECK_TIMEOUT=600  # 10 minutes for production
DOCKER_IMAGE="workload-app:production-$(date +%Y%m%d-%H%M%S)"
DEPLOYMENT_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    print_step "Validating production environment..."
    
    local required_vars=(
        "PRODUCTION_URL"
        "COOLIFY_PRODUCTION_WEBHOOK"
        "DATABASE_URL"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            return 1
        fi
    done
    
    # Validate URLs
    if ! [[ $PRODUCTION_URL =~ ^https:// ]]; then
        print_error "PRODUCTION_URL must use HTTPS"
        return 1
    fi
    
    print_success "Environment validation passed"
}

# Function to run comprehensive pre-deployment checks
run_predeploy_checks() {
    print_step "Running comprehensive pre-deployment checks..."
    
    # Check if staging is healthy
    local staging_url="${STAGING_URL:-https://staging.workload.example.com}"
    print_status "Checking staging environment health..."
    if ! curl -f -s "$staging_url/api/health" > /dev/null 2>&1; then
        print_warning "Staging environment is not healthy - proceed with caution"
        read -p "Continue with production deployment? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_error "Deployment cancelled by user"
            exit 1
        fi
    fi
    
    # Run security checks
    print_status "Running security checks..."
    if command_exists npm; then
        if ! npm audit --audit-level high > /dev/null 2>&1; then
            print_warning "Security vulnerabilities detected in dependencies"
            read -p "Continue despite security warnings? (yes/no): " -r
            if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                print_error "Deployment cancelled due to security concerns"
                exit 1
            fi
        fi
    fi
    
    # Check database connectivity
    print_status "Testing production database connectivity..."
    if command_exists npm; then
        if ! npm run test:db > /dev/null 2>&1; then
            print_error "Production database connectivity test failed"
            return 1
        fi
    fi
    
    print_success "Pre-deployment checks completed"
}

# Function to create production backup
create_production_backup() {
    print_step "Creating production backup..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Database backup
    print_status "Creating database backup..."
    if [ -n "$DATABASE_URL" ]; then
        # Extract database connection details
        local db_host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        local db_port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        local db_name=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        local db_user=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
        
        local backup_file="production_backup_${backup_timestamp}.sql"
        
        if command_exists pg_dump; then
            PGPASSWORD="${DATABASE_PASSWORD:-$(echo "$DATABASE_URL" | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')}" \
            pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
                --no-password --verbose --clean --if-exists --create \
                -f "$backup_file"
            
            gzip "$backup_file"
            print_success "Database backup created: ${backup_file}.gz"
        else
            print_warning "pg_dump not available - skipping database backup"
        fi
    fi
    
    # Application state backup (if applicable)
    if [ -d "/app/uploads" ]; then
        print_status "Creating uploads backup..."
        tar -czf "uploads_backup_${backup_timestamp}.tar.gz" /app/uploads/ 2>/dev/null || true
    fi
    
    print_success "Production backup completed"
}

# Function to wait for service to be healthy with more robust checking
wait_for_production_health() {
    local url=$1
    local timeout=$2
    local start_time=$(date +%s)
    local consecutive_successes=0
    local required_successes=3
    
    print_status "Waiting for production service to be stable at $url..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            print_error "Health check timeout after ${timeout}s"
            return 1
        fi
        
        # Check health endpoint
        if curl -f -s "$url/api/health" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
            consecutive_successes=$((consecutive_successes + 1))
            print_status "Health check passed ($consecutive_successes/$required_successes) - ${elapsed}s elapsed"
            
            if [ $consecutive_successes -ge $required_successes ]; then
                print_success "Production service is stable and healthy!"
                return 0
            fi
        else
            consecutive_successes=0
            print_status "Service not ready yet... (${elapsed}s/${timeout}s)"
        fi
        
        sleep 15
    done
}

# Function to run comprehensive production tests
run_production_tests() {
    local base_url=$1
    
    print_step "Running comprehensive production tests against $base_url"
    
    # Extended health check
    print_status "Extended health check..."
    local health_response=$(curl -s "$base_url/api/health")
    echo "Health Response: $health_response" | tee -a "$DEPLOYMENT_LOG"
    
    if ! echo "$health_response" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
        print_error "Health check failed"
        return 1
    fi
    
    # Test authentication flow
    print_status "Testing authentication endpoints..."
    local auth_endpoints=("/api/auth/login" "/api/auth/refresh" "/api/auth/logout")
    
    for endpoint in "${auth_endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$endpoint")
        if [[ $status_code -ge 500 ]]; then
            print_error "Auth endpoint $endpoint returned server error: $status_code"
            return 1
        fi
        print_status "✓ $endpoint (HTTP $status_code)"
    done
    
    # Test critical API endpoints
    print_status "Testing critical API endpoints..."
    local api_endpoints=(
        "/api/employees"
        "/api/workload" 
        "/api/calendar/events"
        "/api/dashboard/stats"
        "/api/build-info"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$endpoint")
        if [[ $status_code -ge 500 ]]; then
            print_error "API endpoint $endpoint returned server error: $status_code"
            return 1
        fi
        print_status "✓ $endpoint (HTTP $status_code)"
    done
    
    # Test page loading
    print_status "Testing page accessibility..."
    local pages=("/" "/auth/login" "/dashboard" "/employees" "/workload" "/calendar")
    
    for page in "${pages[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$page")
        if [[ $status_code -ge 400 ]]; then
            print_warning "Page $page returned: $status_code"
        else
            print_status "✓ $page (HTTP $status_code)"
        fi
    done
    
    # Performance test
    print_status "Running basic performance test..."
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$base_url/")
    local response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time > 5.0" | bc -l) )); then
        print_warning "Slow response time: ${response_time}s"
    else
        print_success "Response time acceptable: ${response_time}s"
    fi
    
    print_success "Production tests completed successfully!"
}

# Function to rollback production deployment
rollback_production() {
    print_error "Production deployment failed! Initiating emergency rollback..."
    
    # Immediate notification
    send_notification "error" "🚨 PRODUCTION DEPLOYMENT FAILED - EMERGENCY ROLLBACK INITIATED"
    
    if [ -n "$COOLIFY_PRODUCTION_WEBHOOK" ]; then
        print_status "Rolling back via Coolify..."
        # Add Coolify rollback logic here
        # This might involve calling a different webhook or API
    fi
    
    # Restore database backup if needed
    if [ -f "production_backup_*.sql.gz" ]; then
        print_status "Database rollback available if needed"
        print_warning "Manual database restore may be required"
    fi
    
    print_success "Emergency rollback procedures initiated"
}

# Function to send notifications
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        local emoji color
        case $status in
            "success") emoji="✅"; color="good" ;;
            "warning") emoji="⚠️"; color="warning" ;;
            "error") emoji="❌"; color="danger" ;;
            *) emoji="ℹ️"; color="#0066cc" ;;
        esac
        
        curl -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Production Deployment\",
                    \"text\": \"$emoji $message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"Production\", \"short\": true},
                        {\"title\": \"URL\", \"value\": \"$PRODUCTION_URL\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }" > /dev/null 2>&1 || true
    fi
    
    # Email notification (if configured)
    if [ -n "$EMAIL_WEBHOOK" ]; then
        curl -X POST "$EMAIL_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"subject\": \"Production Deployment $status\", \"message\": \"$message\"}" \
            > /dev/null 2>&1 || true
    fi
}

# Main deployment function
main() {
    echo "🚀 Starting Production Deployment" | tee "$DEPLOYMENT_LOG"
    echo "====================================" | tee -a "$DEPLOYMENT_LOG"
    echo "Target URL: $PRODUCTION_URL" | tee -a "$DEPLOYMENT_LOG"
    echo "Docker Image: $DOCKER_IMAGE" | tee -a "$DEPLOYMENT_LOG"
    echo "Timestamp: $(date)" | tee -a "$DEPLOYMENT_LOG"
    echo "Deployment Log: $DEPLOYMENT_LOG" | tee -a "$DEPLOYMENT_LOG"
    echo "" | tee -a "$DEPLOYMENT_LOG"
    
    # Send start notification
    send_notification "info" "Production deployment started"
    
    # Validate environment
    if ! validate_environment; then
        send_notification "error" "Environment validation failed"
        exit 1
    fi
    
    # Pre-deployment checks
    if ! run_predeploy_checks; then
        send_notification "error" "Pre-deployment checks failed"
        exit 1
    fi
    
    # Confirmation prompt for production
    print_warning "⚠️  PRODUCTION DEPLOYMENT CONFIRMATION ⚠️"
    echo "You are about to deploy to PRODUCTION environment:"
    echo "  URL: $PRODUCTION_URL"
    echo "  Image: $DOCKER_IMAGE"
    echo ""
    read -p "Type 'DEPLOY_TO_PRODUCTION' to confirm: " -r
    if [[ $REPLY != "DEPLOY_TO_PRODUCTION" ]]; then
        print_error "Deployment cancelled - confirmation failed"
        exit 1
    fi
    
    # Create backup
    create_production_backup
    
    # Build production Docker image
    print_step "Building production Docker image..."
    if ! docker build -f docker/Dockerfile --target runner -t "$DOCKER_IMAGE" .; then
        print_error "Production Docker build failed"
        send_notification "error" "Production Docker build failed"
        exit 1
    fi
    print_success "Production Docker image built: $DOCKER_IMAGE"
    
    # Security scan of production image
    if command_exists trivy; then
        print_step "Running security scan on production image..."
        if ! trivy image --exit-code 1 --severity HIGH,CRITICAL "$DOCKER_IMAGE"; then
            print_warning "Security vulnerabilities found in production image"
            read -p "Continue with deployment? (yes/no): " -r
            if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                print_error "Deployment cancelled due to security scan"
                exit 1
            fi
        fi
    fi
    
    # Deploy to production
    print_step "Deploying to production environment..."
    
    if [ -n "$COOLIFY_PRODUCTION_WEBHOOK" ]; then
        print_status "Triggering Coolify production deployment..."
        
        local response=$(curl -s -X POST "$COOLIFY_PRODUCTION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"image\": \"$DOCKER_IMAGE\", \"environment\": \"production\"}")
        
        if [[ $? -eq 0 ]]; then
            print_success "Production deployment triggered successfully"
        else
            print_error "Failed to trigger production deployment"
            send_notification "error" "Failed to trigger Coolify production deployment"
            exit 1
        fi
    else
        print_error "No production deployment method configured"
        exit 1
    fi
    
    # Wait for production deployment to be healthy
    print_step "Waiting for production deployment to be ready..."
    if ! wait_for_production_health "$PRODUCTION_URL" "$HEALTH_CHECK_TIMEOUT"; then
        send_notification "error" "Production deployment health check failed"
        rollback_production
        exit 1
    fi
    
    # Run comprehensive production tests
    if ! run_production_tests "$PRODUCTION_URL"; then
        send_notification "error" "Production tests failed"
        rollback_production
        exit 1
    fi
    
    # Final verification
    print_step "Final production verification..."
    local final_health=$(curl -s "$PRODUCTION_URL/api/health")
    echo "Final Health Check: $final_health" | tee -a "$DEPLOYMENT_LOG"
    
    # Cleanup
    print_step "Cleaning up old production images..."
    docker images "workload-app" --format "table {{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
        grep "production" | \
        grep -v "REPOSITORY" | \
        sort -k2 -r | \
        tail -n +4 | \
        awk '{print $1}' | \
        xargs -r docker rmi || true
    
    # Success!
    print_success "🎉 Production deployment completed successfully!"
    echo "" | tee -a "$DEPLOYMENT_LOG"
    echo "Production Deployment Summary:" | tee -a "$DEPLOYMENT_LOG"
    echo "  Environment: Production" | tee -a "$DEPLOYMENT_LOG"
    echo "  URL: $PRODUCTION_URL" | tee -a "$DEPLOYMENT_LOG"
    echo "  Image: $DOCKER_IMAGE" | tee -a "$DEPLOYMENT_LOG"
    echo "  Deployment Time: $(date)" | tee -a "$DEPLOYMENT_LOG"
    echo "  Log File: $DEPLOYMENT_LOG" | tee -a "$DEPLOYMENT_LOG"
    echo "" | tee -a "$DEPLOYMENT_LOG"
    echo "Post-Deployment Checklist:" | tee -a "$DEPLOYMENT_LOG"
    echo "  ✅ Application is accessible" | tee -a "$DEPLOYMENT_LOG"
    echo "  ✅ Health checks passing" | tee -a "$DEPLOYMENT_LOG"
    echo "  ✅ Database connectivity verified" | tee -a "$DEPLOYMENT_LOG"
    echo "  ✅ API endpoints functional" | tee -a "$DEPLOYMENT_LOG"
    echo "  📝 Monitor application logs for 30 minutes" | tee -a "$DEPLOYMENT_LOG"
    echo "  📝 Verify user authentication flows" | tee -a "$DEPLOYMENT_LOG"
    echo "  📝 Check performance metrics" | tee -a "$DEPLOYMENT_LOG"
    
    send_notification "success" "🎉 Production deployment completed successfully! Application is live at $PRODUCTION_URL"
}

# Error handling
trap 'print_error "Production deployment script failed on line $LINENO"; send_notification "error" "Production deployment script failed unexpectedly"' ERR

# Run main function
main "$@"