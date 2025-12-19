#!/bin/bash

# MySQL Deployment Script for Workload Management App
# This script helps deploy the application with MySQL in different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if required tools are installed
check_dependencies() {
    print_header "Checking Dependencies"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js (for local development)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. It's required for local development."
    fi
    
    print_status "All required dependencies are installed."
}

# Function to set up environment
setup_environment() {
    print_header "Setting Up Environment"
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production file not found. Creating from template..."
        cp .env.production.example .env.production
        print_warning "Please edit .env.production with your configuration before continuing."
        exit 1
    fi
    
    # Load environment variables
    source .env.production
    
    # Check required environment variables
    required_vars=("MYSQL_PASSWORD" "JWT_SECRET" "CORS_ORIGIN")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [ "${!var}" = "your_secure_*_change_this" ]; then
            print_error "Environment variable $var is not set or using default value."
            print_error "Please edit .env.production with your actual values."
            exit 1
        fi
    done
    
    print_status "Environment setup completed."
}

# Function to create necessary directories
create_directories() {
    print_header "Creating Directories"
    
    directories=(
        "data/mysql"
        "logs/mysql"
        "data/app"
        "logs/app"
        "data/uploads"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        else
            print_status "Directory already exists: $dir"
        fi
    done
    
    # Set proper permissions
    chmod 755 data logs
    chmod 755 data/mysql logs/mysql data/app logs/app data/uploads
    
    print_status "Directory setup completed."
}

# Function to deploy with Docker Compose
deploy_docker() {
    print_header "Deploying with Docker Compose"
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service status
    print_status "Checking service status..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
    
    # Show logs
    print_status "Showing application logs (press Ctrl+C to exit)..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app
}

# Function to deploy to Dokploy
deploy_dokploy() {
    print_header "Deploying to Dokploy"
    
    print_warning "Dokploy deployment requires manual setup through the Dokploy dashboard."
    print_status "Please follow these steps:"
    echo ""
    echo "1. Log in to your Dokploy dashboard"
    echo "2. Create a new MySQL service with these settings:"
    echo "   - Database Name: workload_db"
    echo "   - User: workload_user"
    echo "   - Password: [Use the password from .env.production]"
    echo ""
    echo "3. Create a new application service:"
    echo "   - Connect your Git repository"
    echo "   - Set build context to /App/workload-app"
    echo "   - Configure environment variables from .env.production"
    echo ""
    echo "4. Set up service dependencies:"
    echo "   - Add MySQL service as dependency"
    echo "   - Configure health checks"
    echo ""
    echo "5. Deploy the application"
    echo ""
    print_status "For detailed instructions, see DOKPLOY_MYSQL_DEPLOYMENT.md"
}

# Function to run local development
run_local() {
    print_header "Starting Local Development"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required for local development."
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    cd frontend && npm install && cd ..
    
    # Start MySQL container
    print_status "Starting MySQL container..."
    docker-compose up -d mysql
    
    # Wait for MySQL to be ready
    print_status "Waiting for MySQL to be ready..."
    sleep 20
    
    # Run migrations
    print_status "Running database migrations..."
    export DB_TYPE=mysql
    export DB_HOST=localhost
    export DB_PORT=3306
    export DB_NAME=workload_db
    export DB_USER=workload_user
    export DB_PASSWORD=workload_password_change_in_production
    
    # Start the application
    print_status "Starting the application..."
    npm run dev
}

# Function to show help
show_help() {
    echo "MySQL Deployment Script for Workload Management App"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  docker     Deploy with Docker Compose (production)"
    echo "  dokploy    Show Dokploy deployment instructions"
    echo "  local      Start local development with MySQL"
    echo "  setup      Set up environment and directories"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup    # Set up environment first"
    echo "  $0 docker   # Deploy with Docker Compose"
    echo "  $0 local    # Start local development"
}

# Main script logic
main() {
    print_header "MySQL Deployment Script"
    
    case "${1:-help}" in
        "docker")
            check_dependencies
            setup_environment
            create_directories
            deploy_docker
            ;;
        "dokploy")
            check_dependencies
            setup_environment
            deploy_dokploy
            ;;
        "local")
            check_dependencies
            run_local
            ;;
        "setup")
            check_dependencies
            setup_environment
            create_directories
            print_status "Setup completed. You can now run 'docker' or 'local' commands."
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"