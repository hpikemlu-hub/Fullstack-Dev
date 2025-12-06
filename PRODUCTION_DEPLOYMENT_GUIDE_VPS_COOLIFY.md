# 🚀 Production Deployment Guide: VPS + Coolify Setup

## Executive Summary

This comprehensive guide provides production-ready deployment strategy for the HPSB Workload Management System using VPS + Coolify + GitHub integration. It ensures secure, scalable, and maintainable infrastructure with zero-downtime deployments.

**Target Architecture:**
- **Platform**: VPS (Virtual Private Server)
- **Container Orchestration**: Coolify (Self-hosted PaaS)
- **Database**: PostgreSQL (Production optimized)
- **Cache**: Redis (Session & Performance)
- **CI/CD**: GitHub Actions → Coolify Webhooks
- **Monitoring**: Built-in metrics + Prometheus/Grafana
- **Backup**: Automated daily backups with retention

---

## 📋 Table of Contents

1. [Pre-Deployment Preparation](#1-pre-deployment-preparation)
2. [VPS Requirements & Optimization](#2-vps-requirements--optimization)
3. [Coolify Installation & Configuration](#3-coolify-installation--configuration)
4. [Production Environment Setup](#4-production-environment-setup)
5. [GitHub Integration & CI/CD](#5-github-integration--cicd)
6. [Security Hardening](#6-security-hardening)
7. [Monitoring & Alerting](#7-monitoring--alerting)
8. [Backup & Disaster Recovery](#8-backup--disaster-recovery)
9. [Deployment Procedures](#9-deployment-procedures)
10. [Performance Optimization](#10-performance-optimization)
11. [Maintenance & Operations](#11-maintenance--operations)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Pre-Deployment Preparation

### 1.1 Infrastructure Requirements Assessment

**Minimum VPS Specifications:**
```yaml
CPU: 2 vCPUs (4 recommended for production)
RAM: 4GB (8GB recommended)
Storage: 50GB SSD (100GB recommended)
Network: 100 Mbps (1 Gbps preferred)
OS: Ubuntu 22.04 LTS or Debian 11
```

**Recommended Production Specifications:**
```yaml
CPU: 4-8 vCPUs
RAM: 8-16GB
Storage: 100-200GB NVMe SSD
Network: 1 Gbps
Backup Storage: Additional 50GB for backups
```

### 1.2 Domain & SSL Preparation

**Domain Configuration:**
- Primary domain: `workload.kemlu.go.id`
- Staging domain: `staging-workload.kemlu.go.id`
- API subdomain: `api-workload.kemlu.go.id` (optional)

**DNS Records Required:**
```dns
A     workload.kemlu.go.id        → VPS_IP_ADDRESS
A     staging-workload.kemlu.go.id → VPS_IP_ADDRESS
A     coolify.kemlu.go.id         → VPS_IP_ADDRESS
CNAME www.workload.kemlu.go.id    → workload.kemlu.go.id
```

### 1.3 Security Certificates

**SSL Strategy:**
- Let's Encrypt certificates (auto-renewal via Coolify)
- Wildcard certificates for subdomains
- HSTS and security headers implementation

---

## 2. VPS Requirements & Optimization

### 2.1 VPS Provider Selection Criteria

**Recommended Providers:**
1. **DigitalOcean** - Excellent for Coolify
2. **Linode/Akamai** - Great performance
3. **Vultr** - Cost-effective
4. **Hetzner** - European choice with good pricing

### 2.2 Operating System Optimization

**Ubuntu 22.04 LTS Setup:**
```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    curl \
    wget \
    git \
    htop \
    nano \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    unattended-upgrades

# Configure automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2.3 System Security Hardening

**Firewall Configuration:**
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp  # Coolify dashboard
sudo ufw enable
```

**SSH Security:**
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22  # Consider changing to non-standard port
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

sudo systemctl restart sshd
```

### 2.4 Performance Optimization

**Kernel Parameters:**
```bash
# Optimize for web workloads
sudo tee -a /etc/sysctl.conf << EOF
# Network optimization
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# File handling
fs.file-max = 65535

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sudo sysctl -p
```

---

## 3. Coolify Installation & Configuration

### 3.1 Docker Engine Installation

**Install Docker:**
```bash
# Remove old versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Configure Docker daemon
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl restart docker
sudo systemctl enable docker
```

### 3.2 Coolify Installation

**Install Coolify:**
```bash
# Download and run Coolify installer
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Wait for installation to complete
# Access Coolify at http://YOUR_VPS_IP:8000
```

**Initial Coolify Setup:**
1. Access `http://YOUR_VPS_IP:8000`
2. Create admin account
3. Configure instance settings
4. Set up SSL for Coolify dashboard
5. Configure backup storage

### 3.3 Coolify Configuration

**Server Configuration:**
```yaml
# Server settings in Coolify dashboard
Name: "Production Server"
Description: "HPSB Workload Management Production"
IP: YOUR_VPS_IP
User: root or your_user
SSH Key: [Upload your private key]
```

**Environment Configuration:**
- Create "Production" environment
- Create "Staging" environment  
- Configure resource limits per environment

---

## 4. Production Environment Setup

### 4.1 PostgreSQL Production Configuration

**Database Service Setup in Coolify:**
```yaml
Service: PostgreSQL 15
Name: "workload-postgres-prod"
Version: "15-alpine"
Database Name: "workload_production"
Username: "workload_user"
Password: [Generate strong 32-char password]

# Resource Limits
Memory: 1GB
CPU: 1 vCPU
Storage: 20GB persistent volume
```

**Production Database Optimization:**
```sql
-- PostgreSQL configuration for production
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();
```

### 4.2 Redis Cache Configuration

**Redis Service Setup:**
```yaml
Service: Redis 7
Name: "workload-redis-prod"
Version: "7-alpine"
Configuration:
  maxmemory: 512mb
  maxmemory-policy: allkeys-lru
  appendonly: yes
  save: "900 1 300 10 60 10000"

# Resource Limits
Memory: 512MB
CPU: 0.5 vCPU
Storage: 2GB persistent volume
```

### 4.3 Application Container Configuration

**Environment Variables for Production:**
```bash
# Application Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database Connection
DATABASE_URL=postgresql://workload_user:[PASSWORD]@workload-postgres-prod:5432/workload_production

# Redis Connection
REDIS_URL=redis://workload-redis-prod:6379

# Security Keys (Generate with: openssl rand -hex 32)
JWT_SECRET=[32-char-hex-secret]
JWT_REFRESH_SECRET=[32-char-hex-secret]

# CORS Configuration
ALLOWED_ORIGINS=https://workload.kemlu.go.id,https://www.workload.kemlu.go.id

# File Upload
UPLOAD_PATH=/app/uploads

# Application Settings
NEXT_TELEMETRY_DISABLED=1
LOG_LEVEL=info
ENABLE_METRICS=true

# Health Check
HEALTH_CHECK_TIMEOUT=5000

# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
```

### 4.4 Container Resource Allocation

**Production Resource Limits:**
```yaml
Application Container:
  Memory: 1GB limit, 512MB reservation
  CPU: 1 vCPU limit, 0.5 vCPU reservation
  
Database Container:
  Memory: 1GB limit, 768MB reservation  
  CPU: 1 vCPU limit, 0.5 vCPU reservation

Redis Container:
  Memory: 512MB limit, 256MB reservation
  CPU: 0.5 vCPU limit, 0.25 vCPU reservation
```

---

## 5. GitHub Integration & CI/CD

### 5.1 GitHub Repository Configuration

**Repository Setup:**
```bash
# Repository structure for production
production/
├── .github/workflows/
│   ├── production-deploy.yml
│   ├── staging-deploy.yml
│   └── security-scan.yml
├── docker/
│   ├── Dockerfile.prod
│   └── docker-compose.prod.yml
├── scripts/
│   ├── deploy-production.sh
│   ├── health-check.sh
│   └── rollback.sh
└── coolify/
    ├── production.yaml
    └── staging.yaml
```

### 5.2 GitHub Actions Workflow

**Production Deployment Workflow:**
```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [ main ]
    paths-ignore:
      - 'docs/**'
      - 'README.md'
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Run security scan
        run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Build production image
        run: |
          docker build -f docker/Dockerfile -t workload-app:${{ github.sha }} .
          docker tag workload-app:${{ github.sha }} workload-app:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to Coolify
        uses: fjogeleit/http-request-action@v1
        with:
          url: ${{ secrets.COOLIFY_WEBHOOK_URL }}
          method: 'POST'
          customHeaders: '{"Authorization": "Bearer ${{ secrets.COOLIFY_TOKEN }}"}'
          data: '{"ref": "main", "commit": "${{ github.sha }}"}'
          
      - name: Wait for deployment
        run: sleep 60
        
      - name: Health check
        run: |
          curl -f https://workload.kemlu.go.id/api/health || exit 1
          
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---
## 6. Security Hardening

### 6.1 Application Security

**Security Headers Configuration:**
```typescript
// next.config.ts - Security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

### 6.2 Secrets Management

**Environment Variables Security:**
```bash
# Generate secure secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET

# Database password requirements:
# - Minimum 20 characters
# - Mix of uppercase, lowercase, numbers, symbols
# - No dictionary words
```

---

## 7. Monitoring & Alerting Setup

### 7.1 Health Check Implementation

**Enhanced Health Check Endpoint:**
```typescript
// /api/health endpoint implementation
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    diskSpace: await checkDiskSpace(),
    memory: await checkMemoryUsage()
  };

  const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
  
  return Response.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  }, { status: isHealthy ? 200 : 503 });
}
```

### 7.2 Application Metrics

**Prometheus Metrics Integration:**
```typescript
// /api/metrics endpoint
export async function GET() {
  const metrics = [
    `# HELP app_requests_total Total number of requests`,
    `# TYPE app_requests_total counter`,
    `app_requests_total{method="GET",status="200"} ${requestCounts.get('GET_200')}`,
    
    `# HELP app_response_time Response time in milliseconds`,
    `# TYPE app_response_time histogram`,
    `app_response_time_sum ${responseTimes.sum}`,
    `app_response_time_count ${responseTimes.count}`
  ].join('\n');

  return new Response(metrics, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

---

## 8. Backup & Disaster Recovery

### 8.1 Automated Backup System

**Database Backup Script:**
```bash
#!/bin/bash
# /scripts/backup-database.sh
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/database"
DB_NAME="workload_production"

# Create backup with compression
pg_dump -h workload-postgres-prod -U workload_user $DB_NAME | \
  gzip > "$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

# Verify backup integrity
gunzip -t "$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_${TIMESTAMP}.sql.gz"
```

### 8.2 Application Data Backup

**File Upload Backup:**
```bash
#!/bin/bash
# /scripts/backup-uploads.sh
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
UPLOAD_DIR="/app/uploads"
BACKUP_DIR="/backups/uploads"

# Create incremental backup
rsync -av --delete "$UPLOAD_DIR/" "$BACKUP_DIR/current/"

# Create daily snapshot
tar -czf "$BACKUP_DIR/daily/uploads_${TIMESTAMP}.tar.gz" \
    -C "$BACKUP_DIR" current/

# Keep 7 daily backups
find "$BACKUP_DIR/daily" -name "*.tar.gz" -mtime +7 -delete
```

---

## 9. Deployment Procedures

### 9.1 Zero-Downtime Deployment Strategy

**Blue-Green Deployment with Coolify:**

1. **Preparation Phase:**
   ```bash
   # Verify health of current deployment
   curl -f https://workload.kemlu.go.id/api/health
   
   # Create database backup
   ./scripts/backup-database.sh
   
   # Tag deployment
   git tag production-$(date +%Y%m%d-%H%M%S)
   git push origin --tags
   ```

2. **Deployment Phase:**
   ```bash
   # Deploy to staging first
   curl -X POST $COOLIFY_STAGING_WEBHOOK
   
   # Verify staging deployment
   ./scripts/health-check.sh https://staging-workload.kemlu.go.id
   
   # Deploy to production
   curl -X POST $COOLIFY_PRODUCTION_WEBHOOK
   ```

3. **Verification Phase:**
   ```bash
   # Wait for deployment to complete
   sleep 120
   
   # Comprehensive health check
   ./scripts/production-health-check.sh
   
   # Performance verification
   ./scripts/performance-check.sh
   ```

### 9.2 Database Migration in Production

**Safe Migration Process:**
```bash
#!/bin/bash
# /scripts/migrate-production.sh
set -e

# Put application in maintenance mode
echo "🔧 Starting maintenance mode..."
docker exec workload-app touch /app/maintenance.lock

# Create pre-migration backup
echo "📦 Creating pre-migration backup..."
./scripts/backup-database.sh

# Run migrations
echo "🔄 Running database migrations..."
docker exec workload-app npx prisma migrate deploy

# Verify migration
echo "✅ Verifying migration..."
docker exec workload-app npx prisma db seed --preview-feature

# Remove maintenance mode
echo "🚀 Removing maintenance mode..."
docker exec workload-app rm -f /app/maintenance.lock

echo "✅ Migration completed successfully!"
```

### 9.3 Rollback Procedures

**Emergency Rollback Process:**
```bash
#!/bin/bash
# /scripts/rollback.sh
set -e

ROLLBACK_TAG=${1:-"previous"}

echo "🚨 Starting emergency rollback to: $ROLLBACK_TAG"

# Stop current application
docker stop workload-app

# Restore database from backup
echo "📦 Restoring database backup..."
LATEST_BACKUP=$(ls -t /backups/database/*.sql.gz | head -1)
gunzip -c "$LATEST_BACKUP" | \
  psql -h workload-postgres-prod -U workload_user workload_production

# Deploy previous version
echo "🔄 Deploying previous version..."
git checkout $ROLLBACK_TAG
docker-compose -f docker/docker-compose.prod.yml up -d

# Verify rollback
echo "✅ Verifying rollback..."
sleep 60
curl -f https://workload.kemlu.go.id/api/health

echo "✅ Rollback completed successfully!"
```

---

## 10. Performance Optimization

### 10.1 VPS Performance Tuning

**System Optimization:**
```bash
# CPU governor for performance
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Network optimization
sudo sysctl -w net.core.somaxconn=65535
sudo sysctl -w net.core.netdev_max_backlog=5000
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=65535

# File system optimization
sudo sysctl -w fs.file-max=2097152
echo 'root soft nofile 2097152' | sudo tee -a /etc/security/limits.conf
echo 'root hard nofile 2097152' | sudo tee -a /etc/security/limits.conf
```

### 10.2 Application Performance

**Next.js Optimization:**
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizeCss: true,
    swcMinify: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    }
  ]
};
```

### 10.3 Database Performance

**PostgreSQL Production Tuning:**
```sql
-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Memory settings
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '16MB';

-- Checkpoint settings
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '32MB';
ALTER SYSTEM SET checkpoint_timeout = '15min';

-- Query optimization
ALTER SYSTEM SET default_statistics_target = 500;
ALTER SYSTEM SET random_page_cost = 1.1;

SELECT pg_reload_conf();
```

---

## 11. Production Deployment Checklist

### 11.1 Pre-Deployment Checklist

**Infrastructure Verification:**
- [ ] VPS provisioned with minimum 4GB RAM, 2 vCPUs
- [ ] Ubuntu 22.04 LTS installed and updated
- [ ] Docker and Docker Compose installed
- [ ] Coolify installed and configured
- [ ] Domain DNS records configured
- [ ] SSL certificates configured
- [ ] Firewall rules configured (UFW)
- [ ] SSH key-based authentication enabled
- [ ] System monitoring tools installed

**Security Verification:**
- [ ] JWT secrets generated (32+ characters)
- [ ] Database passwords generated (20+ characters)
- [ ] Environment variables secured in Coolify
- [ ] Security headers configured
- [ ] HTTPS enforced across all endpoints
- [ ] Database access restricted to application
- [ ] Regular security updates enabled
- [ ] Fail2ban configured for SSH protection

**Application Verification:**
- [ ] Code deployed to production branch
- [ ] Database migrations tested in staging
- [ ] Environment variables configured
- [ ] Health check endpoints implemented
- [ ] Error handling and logging configured
- [ ] Performance optimizations applied
- [ ] Backup procedures tested
- [ ] Monitoring and alerting configured

### 11.2 Deployment Execution Checklist

**During Deployment:**
- [ ] Create pre-deployment database backup
- [ ] Tag deployment version in Git
- [ ] Deploy to staging environment first
- [ ] Verify staging deployment functionality
- [ ] Run automated test suite
- [ ] Deploy to production environment
- [ ] Wait for deployment completion (2-3 minutes)
- [ ] Verify application startup logs
- [ ] Execute health check endpoints
- [ ] Test critical user journeys
- [ ] Verify database connectivity
- [ ] Check application performance metrics

### 11.3 Post-Deployment Verification

**System Health Verification:**
- [ ] Application responds to health checks
- [ ] Database queries executing correctly
- [ ] Redis cache functioning properly
- [ ] File uploads working correctly
- [ ] User authentication functional
- [ ] Email notifications working (if applicable)
- [ ] SSL certificates valid and auto-renewal configured
- [ ] Performance metrics within acceptable ranges
- [ ] Error logs show no critical issues
- [ ] Backup systems operational

**Business Function Verification:**
- [ ] User login/logout functionality
- [ ] Dashboard loads correctly
- [ ] Workload management features operational
- [ ] Calendar functionality working
- [ ] Employee management accessible
- [ ] Reports generation functional
- [ ] Data integrity maintained
- [ ] Real-time features operational

---

## 12. Maintenance & Operations

### 12.1 Regular Maintenance Tasks

**Daily Tasks (Automated):**
- Database backup creation and verification
- Log file rotation and cleanup
- Performance metrics collection
- Security update checks
- Health check monitoring
- Disk space monitoring

**Weekly Tasks:**
- Review application logs for errors
- Check system resource utilization
- Verify backup integrity
- Update dependencies (staging first)
- Performance benchmarking
- Security scan execution

**Monthly Tasks:**
- Full system backup creation
- Security audit and review
- Performance optimization review
- Capacity planning assessment
- Disaster recovery drill
- Documentation updates

### 12.2 Emergency Procedures

**Incident Response Plan:**

1. **Service Down (P0 - Critical):**
   ```bash
   # Immediate response (within 5 minutes)
   ./scripts/emergency-health-check.sh
   ./scripts/restart-services.sh
   
   # If restart fails, rollback
   ./scripts/rollback.sh previous
   
   # Notify stakeholders
   ./scripts/notify-incident.sh "critical"
   ```

2. **Performance Issues (P1 - High):**
   ```bash
   # Performance analysis
   ./scripts/performance-diagnosis.sh
   
   # Resource monitoring
   docker stats --no-stream
   
   # Database performance check
   ./scripts/db-performance-check.sh
   ```

3. **Security Incident (P0 - Critical):**
   ```bash
   # Immediate isolation
   sudo ufw deny in
   
   # Evidence collection
   ./scripts/collect-logs.sh
   
   # Incident documentation
   ./scripts/document-incident.sh
   ```

### 12.3 Update Procedures

**Security Updates (Weekly):**
```bash
#!/bin/bash
# System security updates
sudo apt update && sudo apt upgrade -y

# Docker updates
sudo apt update docker-ce docker-ce-cli containerd.io

# Application dependency updates (staging first)
cd /app && npm audit fix --production
```

**Feature Updates (Sprint-based):**
```bash
#!/bin/bash
# Feature deployment process
git checkout main
git pull origin main
./scripts/deploy-staging.sh
./scripts/verify-staging.sh
./scripts/deploy-production.sh
./scripts/verify-production.sh
```

---

## 🎯 Summary & Quick Start

### Production Deployment Timeline

**Phase 1 (Day 1): Infrastructure Setup**
- Provision VPS and install base system (2 hours)
- Install and configure Coolify (1 hour)
- Configure DNS and SSL certificates (1 hour)

**Phase 2 (Day 2): Environment Configuration**
- Set up PostgreSQL and Redis services (1 hour)
- Configure application environment variables (30 minutes)
- Set up monitoring and alerting (1 hour)

**Phase 3 (Day 3): Application Deployment**
- Deploy application to staging environment (30 minutes)
- Test staging deployment thoroughly (2 hours)
- Deploy to production environment (30 minutes)
- Perform post-deployment verification (1 hour)

**Phase 4 (Day 4): Operations Setup**
- Configure backup systems (1 hour)
- Set up CI/CD pipeline (1 hour)
- Document procedures and train team (2 hours)

### Quick Start Commands

```bash
# 1. VPS Setup
wget https://cdn.coollabs.io/coolify/install.sh
sudo bash install.sh

# 2. Application Deployment
# Clone repository to Coolify
# Configure environment variables
# Deploy via GitHub integration

# 3. Verification
curl -f https://workload.kemlu.go.id/api/health
./scripts/production-health-check.sh

# 4. Ongoing Operations
./scripts/backup-database.sh  # Run daily
./scripts/performance-check.sh  # Run weekly
```

### Success Metrics

- **Uptime Target**: 99.9% (8.77 hours downtime/year)
- **Response Time**: < 2 seconds average
- **Deployment Time**: < 5 minutes
- **Recovery Time**: < 15 minutes
- **Backup Success**: 100% daily completion

---

**🚀 Your HPSB Workload Management System is now ready for production deployment with enterprise-grade reliability, security, and performance!**