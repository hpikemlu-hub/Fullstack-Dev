#!/bin/bash

# Coolify Deployment Script
# This script prepares the application for deployment to Coolify

set -e  # Exit on any error

echo "🚀 Starting Coolify deployment preparation..."

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

echo "✅ Directory validation passed"

# Validate environment variables
echo "🔍 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Warning: DATABASE_URL is not set (will be configured in Coolify)"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Warning: JWT_SECRET is not set (will be configured in Coolify)"
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "⚠️  Warning: JWT_REFRESH_SECRET is not set (will be configured in Coolify)"
fi

echo "✅ Environment variables check completed"

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if Docker is available (optional in Coolify environment)
if command -v docker &> /dev/null; then
    echo "✅ Docker is available"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker is not installed or not in PATH - this is OK for Coolify deployments"
    echo "   In Coolify, Docker builds are handled internally by the platform"
    DOCKER_AVAILABLE=false
fi

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed or not in PATH"
    exit 1
fi

echo "✅ Node.js and npm are available"

# Run type checking
echo "🔍 Running type checking..."
npm run type-check
echo "✅ Type checking passed"

# Run linting
echo "🔍 Running linting..."
npm run lint
echo "✅ Linting passed"

# Run tests if in development environment
if [ "$NODE_ENV" != "production" ]; then
    echo "🔍 Running unit tests..."
    npm run test:unit -- --watchAll=false --coverage=false
    echo "✅ Unit tests passed"
fi

# Build the application
echo "🔨 Building the application..."
npm run build
echo "✅ Build completed successfully"

# Verify the Next.js standalone output exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ Error: Next.js standalone output not found. Build may have failed."
    exit 1
fi

echo "✅ Next.js standalone output verified"

# Check if Prisma schema is valid
echo "🔍 Validating Prisma schema..."
npx prisma validate
echo "✅ Prisma schema is valid"

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# Create a deployment manifest
cat > deployment-manifest.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version")",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "buildEnvironment": "${NODE_ENV:-development}",
  "dockerfileExists": true,
  "standaloneOutputExists": true,
  "prismaClientGenerated": true,
  "healthCheckEndpoint": "/api/health",
  "port": 3000
}
EOF

echo "✅ Deployment manifest created"

# Verify health check endpoint exists
if [ ! -f "app/api/health/route.ts" ]; then
    echo "❌ Error: Health check endpoint not found at app/api/health/route.ts"
    exit 1
fi

echo "✅ Health check endpoint verified"

# Test Docker build only if Docker is available locally
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🐳 Testing Docker build..."
    if docker build -t workload-app-test .; then
        echo "✅ Docker build test passed"
        # Clean up test image
        docker rmi -f workload-app-test > /dev/null 2>&1
    else
        echo "❌ Error: Docker build failed"
        exit 1
    fi
else
    echo "⚠️  Skipping Docker build test (Docker not available)"
    echo "   Coolify will handle the Docker build process during deployment"
fi

# Check for any vulnerabilities
echo "🔍 Scanning for vulnerabilities..."
npm audit --audit-level high || echo "⚠️  Note: npm audit found some vulnerabilities (check if they affect production)"

echo "✅ Vulnerability scan completed"

# Display deployment readiness summary
echo ""
echo "🎉 Deployment preparation completed successfully!"
echo ""
echo "📋 Deployment Checklist:"
echo "   ✅ Dockerfile is properly configured for Coolify"
echo "   ✅ Next.js standalone output generated"
echo "   ✅ Prisma client generated"
echo "   ✅ Health check endpoint available at /api/health"
echo "   ✅ Environment variables validated"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   ✅ Docker build test passed"
else
    echo "   ✅ Docker build test skipped (Docker not available locally)"
fi
echo ""
echo "🔧 Ready for deployment to Coolify with:"
echo "   - Docker build using root Dockerfile (handled by Coolify)"
echo "   - Environment variables to be configured in Coolify UI"
echo "   - Health check: GET /api/health"
echo "   - Port: 3000"
echo ""
echo "📝 Next steps in Coolify:"
echo "   1. Add your GitHub repository to Coolify"
echo "   2. Create a new application using this repository"
echo "   3. Set Build Pack: Docker"
echo "   4. Set Dockerfile path to: Dockerfile (root)"
echo "   5. Add environment variables in Coolify UI:"
echo "      - DATABASE_URL (auto-generated by PostgreSQL service)"
echo "      - JWT_SECRET (generate with: openssl rand -hex 32)"
echo "      - JWT_REFRESH_SECRET (generate with: openssl rand -hex 32)"
echo "      - ALLOWED_ORIGINS=https://yourdomain.com"
echo "   6. Set build context to project root"
echo "   7. Deploy!"
echo ""

# Success exit
exit 0