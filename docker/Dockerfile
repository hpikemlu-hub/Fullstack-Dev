# Unified Fullstack Dockerfile
# Optimized for production deployment on Coolify

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install system dependencies for better performance and security
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev) for build stage
RUN \
  if [ -f package-lock.json ]; then \
    npm ci --frozen-lockfile --no-audit --no-fund; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Clean npm cache to reduce image size
RUN npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Install ALL dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then \
    npm ci --frozen-lockfile --no-audit --no-fund; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Copy source code
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN npx prisma generate

# Build the application with optimizations
RUN npm run build

# Install only production dependencies for final stage
RUN rm -rf node_modules && \
    npm ci --only=production --frozen-lockfile --no-audit --no-fund

# Stage 3: Production image  
FROM node:18-alpine AS runner
WORKDIR /app

# Install production runtime dependencies and security updates
RUN apk add --no-cache \
    dumb-init \
    curl \
    tzdata \
    && apk upgrade --no-cache

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create user and group (if not already created)
RUN addgroup --system --gid 1001 nodejs || true
RUN adduser --system --uid 1001 nextjs || true

# Copy built application
COPY --from=builder /app/public ./public

# Copy Next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy scripts for database setup
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Create uploads directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Create healthcheck script
RUN echo '#!/usr/bin/env node\n\
const http = require("http");\n\
const options = {\n\
  hostname: "localhost",\n\
  port: 3000,\n\
  path: "/api/health",\n\
  method: "GET",\n\
  timeout: 2000\n\
};\n\
const req = http.request(options, (res) => {\n\
  if (res.statusCode === 200) {\n\
    process.exit(0);\n\
  } else {\n\
    process.exit(1);\n\
  }\n\
});\n\
req.on("error", () => process.exit(1));\n\
req.on("timeout", () => { req.destroy(); process.exit(1); });\n\
req.end();' > healthcheck.js && \
    chmod +x healthcheck.js

# Health check with comprehensive monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]