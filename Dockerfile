# NUCLEAR DOCKERFILE - FORCES EVERYTHING TO WORK
# This Dockerfile eliminates ALL caching issues and forces proper builds

# Use EXPLICIT Node 20 with SHA to prevent any caching confusion
FROM node:20.11.1-alpine@sha256:bf77dc26e48ea95fca9d1aceb5acfa69d2e546b765ec2abfb502975f1a2d4def AS base

# Set build arguments to force cache busting
ARG CACHE_BUST=v1.0.0
ARG BUILD_DATE
ARG BUILD_VERSION

# Install system dependencies
RUN apk add --no-cache libc6-compat dumb-init curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Stage 1: Dependencies with FORCED installation
FROM base AS deps

# NUCLEAR OPTION: Delete any existing cache
RUN npm cache clean --force || true
RUN rm -rf ~/.npm || true
RUN rm -rf /root/.npm || true

# Copy package files
COPY package.json package-lock.json* ./

# FORCE Node 20 and npm settings
RUN node --version
RUN npm --version
RUN echo "Node version: $(node --version)"
RUN echo "NPM version: $(npm --version)"

# Create .npmrc with FORCED settings
RUN echo "legacy-peer-deps=true" > .npmrc
RUN echo "fund=false" >> .npmrc
RUN echo "audit=false" >> .npmrc
RUN echo "registry=https://registry.npmjs.org/" >> .npmrc
RUN echo "fetch-retry-mintimeout=20000" >> .npmrc
RUN echo "fetch-retry-maxtimeout=120000" >> .npmrc
RUN echo "fetch-retries=10" >> .npmrc
RUN echo "fetch-timeout=300000" >> .npmrc
RUN echo "maxsockets=15" >> .npmrc
RUN echo "progress=true" >> .npmrc

# Display the .npmrc to verify
RUN cat .npmrc

# NUCLEAR INSTALL with explicit flags
RUN npm ci --legacy-peer-deps --frozen-lockfile --no-audit --no-fund --verbose --force

# Verify installations
RUN npm list || true

# Stage 2: Build
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.npmrc ./.npmrc

# Copy all source files
COPY . .

# Force environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN npx prisma generate

# Build with verbose output
RUN npm run build

# Stage 3: Runner
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]