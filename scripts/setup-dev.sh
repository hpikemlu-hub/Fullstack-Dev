#!/bin/bash

# Development Environment Setup Script
# Sets up the complete fullstack development environment

set -e  # Exit on any error

echo "🚀 Setting up Unified Fullstack Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the fullstack-dev directory."
    exit 1
fi

# Check for required tools
print_status "Checking required tools..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Some features may not work."
fi

if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is not installed. Some features may not work."
fi

print_success "Required tools check completed"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install
print_success "Dependencies installed"

# Setup environment variables
print_status "Setting up environment variables..."

if [[ ! -f ".env.local" ]]; then
    print_status "Creating .env.local from template..."
    cat > .env.local << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://workload_user:workload_pass@localhost:5432/workload_dev"

# Redis Configuration (optional)
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="dev_jwt_secret_change_in_production_$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="dev_refresh_secret_change_in_production_$(openssl rand -hex 32)"

# Application Configuration
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000"
UPLOAD_PATH="./uploads"

# Legacy Supabase Configuration (for migration)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url_here"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"
EOF
    print_success "Environment file created"
else
    print_warning ".env.local already exists. Skipping creation."
fi

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads
print_success "Uploads directory created"

# Setup Docker development environment
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_status "Setting up Docker development environment..."
    
    # Create docker init scripts directory
    mkdir -p docker/init-scripts
    
    # Create database initialization script
    cat > docker/init-scripts/01-init.sql << 'EOF'
-- Initialize development database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional development users if needed
-- This script runs automatically when the database starts for the first time
EOF

    print_status "Starting Docker services (PostgreSQL and Redis)..."
    docker-compose -f docker/docker-compose.dev.yml up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Check if PostgreSQL is ready
    max_attempts=30
    attempt=1
    while ! docker-compose -f docker/docker-compose.dev.yml exec -T postgres pg_isready -U workload_user -d workload_dev > /dev/null 2>&1; do
        if [ $attempt -eq $max_attempts ]; then
            print_error "PostgreSQL failed to start after $max_attempts attempts"
            exit 1
        fi
        print_status "Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    print_success "Docker services started successfully"
else
    print_warning "Docker not available. You'll need to setup PostgreSQL and Redis manually."
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Run database migrations
print_status "Running database migrations..."
npx prisma migrate dev --name initial_migration
print_success "Database migrations completed"

# Seed the database
print_status "Seeding database with initial data..."
npx prisma db seed
print_success "Database seeded"

# Run type checking
print_status "Running TypeScript type check..."
npm run type-check
print_success "TypeScript check passed"

# Final setup verification
print_status "Verifying setup..."

# Check if we can connect to the database
if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    print_success "Database connection verified"
else
    print_error "Database connection failed"
fi

echo ""
echo "=============================================="
print_success "🎉 Development environment setup completed!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase credentials for migration"
echo "2. Run migration: npm run migrate:supabase --dry-run"
echo "3. Start development server: npm run dev"
echo ""
echo "Useful commands:"
echo "- npm run dev                 # Start development server"
echo "- npm run docker:dev          # Start all services with Docker"
echo "- npm run db:migrate          # Run database migrations"
echo "- npm run db:seed             # Seed database with test data"
echo "- npm run migrate:supabase    # Migrate data from Supabase"
echo ""
echo "Access points:"
echo "- Application: http://localhost:3000"
echo "- Database Admin: http://localhost:8080 (Adminer)"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo ""
print_status "Happy coding! 🚀"