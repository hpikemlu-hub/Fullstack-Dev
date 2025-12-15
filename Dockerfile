# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json files for backend
COPY package*.json ./

# Copy package.json files for frontend
COPY frontend/package*.json ./frontend/

# Install dependencies for both backend and frontend
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./frontend/

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Go back to root directory
WORKDIR /app

# Copy backend source code
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

# Start the application
CMD ["npm", "start"]