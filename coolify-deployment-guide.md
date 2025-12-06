# Coolify Deployment Guide - Stable Stack

## Overview
Panduan deployment komprehensif untuk aplikasi Node.js di Coolify dengan optimasi production-ready, monitoring, dan operational best practices.

## Table of Contents
1. [Dockerfile Optimization](#dockerfile-optimization)
2. [Coolify Configuration](#coolify-configuration)
3. [Cache Busting Strategy](#cache-busting-strategy)
4. [Resource Management](#resource-management)
5. [Health Checks](#health-checks)
6. [Monitoring Setup](#monitoring-setup)
7. [Operational Checklists](#operational-checklists)
8. [Deployment Procedures](#deployment-procedures)
9. [Post-Deploy Verification](#post-deploy-verification)

---

## Dockerfile Optimization

### Multi-stage Production Dockerfile
Lihat file `Dockerfile.optimized` untuk implementasi lengkap dengan:
- Node.js 20.11.1 Alpine base image
- Multi-stage build untuk optimasi ukuran
- Security hardening dengan non-root user
- Built-in health checks
- Proper signal handling dengan dumb-init

### Key Features:
- **Cache Optimization**: Layer caching dengan copy package.json terpisah
- **Security**: Non-root user, minimal attack surface
- **Size Optimization**: Multi-stage build mengurangi ukuran image
- **Health Checks**: Built-in health check endpoint
- **Signal Handling**: Proper graceful shutdown

---

## Coolify Configuration

### Application Settings
Lihat file `coolify-config.json` untuk konfigurasi lengkap:
- Resource limits: Memory 512Mi-1Gi, CPU 500m-1000m
- Health check configuration
- Environment variables dengan cache busting
- Zero-downtime deployment
- Monitoring integration

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
CACHE_VERSION={{BUILD_TIMESTAMP}}
BUILD_HASH={{GIT_COMMIT_SHA}}
```

---

## Cache Busting Strategy

### Docker Build Cache
```bash
# Build dengan cache busting arguments
docker build --build-arg BUILD_TIMESTAMP=$(date +%s) \
             --build-arg GIT_COMMIT_SHA=$(git rev-parse HEAD) \
             -t your-app:latest .
```

### Application Level Cache
```javascript
// Implementasi di aplikasi Node.js
const CACHE_VERSION = process.env.CACHE_VERSION || Date.now();
app.use('/static', express.static('public', {
  etag: true,
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('X-Cache-Version', CACHE_VERSION);
  }
}));
```

---

## Resource Management

### Container Resource Limits
```yaml
resources:
  limits:
    memory: "1Gi"
    cpu: "1000m"
  requests:
    memory: "512Mi"
    cpu: "500m"
```

### Monitoring Resource Usage
```bash
# Check container resource usage
docker stats your-container-name

# Memory usage alert threshold: 80%
# CPU usage alert threshold: 70%
```

---

## Health Checks

### Implementation
Lihat file `health-checks.js` untuk implementasi lengkap:
- `/api/health` - Basic health check
- `/api/ready` - Readiness probe
- `/api/live` - Liveness probe
- `/api/metrics` - Prometheus metrics

### Health Check Endpoints
```javascript
// Basic health check returns:
{
  "uptime": 3600,
  "message": "OK",
  "timestamp": 1640995200000,
  "environment": "production",
  "version": "1.0.0",
  "memory": { "heapUsed": 50000000, "heapTotal": 100000000 }
}
```

---

## Monitoring Setup

### Prometheus & Grafana Stack
Lihat file `docker-compose.monitoring.yml` untuk setup lengkap:
- Prometheus untuk metrics collection
- Grafana untuk visualization
- Node Exporter untuk system metrics
- cAdvisor untuk container metrics

### Alert Rules
Lihat file `monitoring/alert_rules.yml` untuk:
- High memory usage alerts (>90%)
- High CPU usage alerts (>80%)
- Application down alerts
- Health check failure alerts

### Dashboard Setup
- Application performance metrics
- System resource monitoring
- Error rate tracking
- Response time monitoring

---

## Operational Checklists

### Pre-Deployment
Lihat file `operational-checklist.md` untuk checklist lengkap:
- [ ] Code review completed
- [ ] Tests passing (unit, integration)
- [ ] Security scan clean
- [ ] Database backup completed
- [ ] Monitoring operational

### Deployment Execution
- [ ] Trigger deployment in Coolify
- [ ] Monitor build process
- [ ] Verify health checks
- [ ] Test critical flows
- [ ] Validate performance metrics

### Post-Deployment
- [ ] Health endpoints responding
- [ ] Error rates normal (<1%)
- [ ] Performance within SLA
- [ ] Monitoring alerts configured

---

## Deployment Procedures

### Force Rebuild in Coolify
Lihat file `coolify-procedures.md` untuk prosedur lengkap:

#### Method 1: UI Force Rebuild
1. Access Coolify Dashboard
2. Navigate to Applications → Your App
3. Click "Deployments" → "Force Rebuild"
4. Enable "No Cache" option
5. Monitor build logs

#### Method 2: API Force Rebuild
```bash
curl -X POST \
  https://your-coolify-instance.com/api/v1/applications/{app-id}/deploy \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{"force": true, "no_cache": true}'
```

#### Method 3: Git-based Trigger
```bash
# Empty commit to trigger rebuild
git commit --allow-empty -m "Force rebuild: $(date)"
git push origin main
```

### Emergency Rollback
```bash
# Quick rollback script
./emergency-rollback.sh previous-image-tag
```

---

## Post-Deploy Verification

### Automated Verification
Lihat file `post-deploy-verification.md` untuk script lengkap:

```bash
# Run comprehensive verification
./verify-deployment.sh https://your-app.com
```

### Health Verification Steps
1. **Basic Health Checks**
   - `/api/health` returns 200
   - `/api/ready` returns 200
   - `/api/live` returns 200

2. **Performance Checks**
   - Response time < 2 seconds
   - Memory usage < 80%
   - CPU usage < 70%

3. **Load Testing**
   - 100 concurrent requests
   - Average response time < 2s
   - Error rate < 1%

### Metrics Validation
```bash
# Check key metrics
curl -s "$APP_URL/api/metrics" | grep -E "(memory|cpu|response_time)"

# Verify baselines:
# - Response time: < 2s (95th percentile)
# - Memory usage: < 80%
# - Error rate: < 1%
```

### Integration Tests
```javascript
// Automated health validation
const { validateHealthMetrics } = require('./health-metrics-validator');
const isHealthy = await validateHealthMetrics('https://your-app.com');
```

---

## Monitoring Dashboard

### Grafana Setup
- Application performance dashboard
- System resource monitoring
- Alert configuration
- Custom metrics visualization

### Key Metrics to Monitor
- **Performance**: Response time, throughput, error rate
- **Resources**: Memory, CPU, disk usage
- **Health**: Uptime, health check status
- **Business**: User activity, feature usage

---

## Backup and Recovery

### Automated Backups
- Daily database backups
- Weekly full system backups
- Container image backups
- Configuration backups

### Recovery Procedures
- RTO (Recovery Time Objective): < 2 hours
- RPO (Recovery Point Objective): < 1 hour
- Monthly backup restoration tests
- Cross-region backup replication

---

## Security Considerations

### Container Security
- Non-root user execution
- Minimal base image (Alpine)
- Regular security updates
- Vulnerability scanning

### Network Security
- HTTPS enforcement
- SSL certificate monitoring
- Rate limiting
- DDoS protection

---

## Conclusion

Deployment stack ini menyediakan:
- ✅ Production-ready Node.js 20.11.1 deployment
- ✅ Comprehensive monitoring dengan Prometheus/Grafana
- ✅ Automated health checks dan alerting
- ✅ Robust backup dan recovery procedures
- ✅ Detailed operational checklists
- ✅ Force rebuild capabilities
- ✅ Post-deploy verification automation

Gunakan checklist dan prosedur ini untuk memastikan deployment yang aman dan reliable di production.