# Multi-stage build for frontend
FROM node:18-alpine as frontend-builder

# Set working directory for frontend build
WORKDIR /app/frontend

# Copy frontend package.json files
COPY frontend/package*.json ./

# Install ALL dependencies for frontend (including dev dependencies for build)
RUN npm install --force && npm cache clean --force

# Copy frontend source files including index.html and environment files
COPY frontend/ ./

# Build frontend with production mode
RUN NODE_ENV=production npm run build

# Production stage
FROM node:18-alpine

# Install additional tools that are needed for permission handling
RUN apk add --no-cache \
    shadow \
    su-exec \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package.json files for backend
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy backend source code
COPY src/ ./src/
COPY server.js .

# Copy admin reset scripts
COPY reset_admin_prod.js .
COPY docker_reset_admin.sh .

# Make the shell script executable
RUN chmod +x docker_reset_admin.sh

# Copy frontend build files from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create app user with configurable UID/GID
ARG PUID=1000
ARG PGID=1000

# Create group and user with specified IDs
RUN addgroup -g ${PGID} -S appgroup && \
    adduser -S -u ${PUID} -G appgroup -h /app -s /bin/bash appuser

# Create directories that are needed for the application
RUN mkdir -p /app/data /app/logs /app/uploads /app/temp /app/public/uploads && \
    chown -R appuser:appgroup /app/data /app/logs /app/uploads /app/temp /app/public/uploads && \
    chmod 755 /app/data /app/logs /app/uploads /app/temp /app/public/uploads

# Set environment variables
ENV NODE_ENV=production
ENV DB_PATH=/app/data/database.sqlite
ENV PUID=${PUID}
ENV PGID=${PGID}

# Create a startup script to ensure database directory exists and has proper permissions
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Volume for data persistence
VOLUME ["/app/data", "/app/logs", "/app/uploads"]

# Use the entrypoint script to ensure proper setup
ENTRYPOINT ["docker-entrypoint.sh"]

# Start application
CMD ["npm", "start"]