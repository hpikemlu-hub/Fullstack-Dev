#!/bin/bash

# 🚀 PRODUCTION DEPLOYMENT SCRIPT
# Workload Management System - Stable Stack
# Next.js 14 + React 18 + Tailwind 3

set -e

echo "🚀 STARTING PRODUCTION DEPLOYMENT..."
echo "=================================="

# Environment setup
export NODE_ENV=production
export PORT=3000

echo "📦 1. Preparing production environment..."
echo "   ✅ Node.js: $(node --version)"
echo "   ✅ NPM: $(npm --version)"
echo "   ✅ Environment: $NODE_ENV"

echo ""
echo "🏗️  2. Building production application..."
npm run build

echo ""
echo "🗄️  3. Setting up production database..."
npx prisma generate
npx prisma db push

echo ""
echo "👤 4. Seeding production data..."
JWT_SECRET="production-jwt-secret-key-minimum-32-characters-long" \
JWT_REFRESH_SECRET="production-refresh-secret-key-minimum-32-characters-long" \
npx prisma db seed

echo ""
echo "🚀 5. Starting production server..."
echo "   📍 Server will be available at: http://localhost:3000"
echo "   🔍 Health check: http://localhost:3000/api/health"
echo "   📊 Metrics: http://localhost:3000/api/metrics"

echo ""
echo "⚡ PRODUCTION DEPLOYMENT COMPLETE!"
echo "================================="
echo "🎉 Your Workload Management System is now LIVE!"
echo ""
echo "Quick verification commands:"
echo "curl http://localhost:3000/api/health"
echo "curl http://localhost:3000/api/employees"
echo "curl http://localhost:3000/api/workload"
echo ""

# Start the production server
JWT_SECRET="production-jwt-secret-key-minimum-32-characters-long" \
JWT_REFRESH_SECRET="production-refresh-secret-key-minimum-32-characters-long" \
DATABASE_URL="file:./production.db" \
NEXT_PUBLIC_BASE_URL="http://localhost:3000" \
npm start