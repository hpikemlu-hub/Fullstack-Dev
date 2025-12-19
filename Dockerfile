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

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create directory for database and logs with proper permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app && \
    chmod 755 /app/data

# Set environment variables
ENV NODE_ENV=production
ENV DB_PATH=/app/data/database.sqlite

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Volume for database persistence
VOLUME ["/app/data"]

# Start application
CMD ["npm", "start"]