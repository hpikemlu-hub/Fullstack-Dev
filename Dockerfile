# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json files for backend
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy frontend package.json files
COPY frontend/package*.json ./frontend/

# Install ALL dependencies for frontend (including dev dependencies for build)
WORKDIR /app/frontend
RUN npm ci && npm cache clean --force

# Build frontend
RUN npm run build

# Copy backend source code
WORKDIR /app
COPY src/ ./src/
COPY server.js .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create directory for database and logs
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application
CMD ["npm", "start"]