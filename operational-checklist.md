# Operational Checklist - Coolify Deployment

## Pre-Deployment Checklist

### Code & Build Preparation
- [ ] Code review completed and approved
- [ ] Unit tests passing (minimum 80% coverage)
- [ ] Integration tests passing
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Dependencies updated and security patches applied
- [ ] Environment variables configured and secrets secured
- [ ] Database migrations prepared and tested
- [ ] Cache busting strategy implemented
- [ ] Build artifacts optimized (Docker image size < 500MB)

### Infrastructure Readiness
- [ ] Coolify server resources available (CPU: 70%, Memory: 70%, Disk: 80%)
- [ ] Database backup completed successfully
- [ ] Monitoring stack operational (Prometheus/Grafana)
- [ ] Log aggregation working properly
- [ ] SSL certificates valid and renewed
- [ ] DNS configuration verified
- [ ] CDN cache warming strategy ready

### Deployment Configuration
- [ ] Resource limits configured appropriately
- [ ] Health check endpoints tested
- [ ] Zero-downtime deployment strategy confirmed
- [ ] Rollback plan prepared and tested
- [ ] Feature flags configured (if applicable)
- [ ] Load balancer configuration verified

---

## Deployment Execution Checklist

### Pre-Deployment Actions
- [ ] Notify stakeholders about deployment window
- [ ] Enable maintenance mode (if required)
- [ ] Create pre-deployment database backup
- [ ] Verify current system health metrics
- [ ] Document current version and configuration
- [ ] Prepare communication channels for issues

### Deployment Steps
- [ ] Trigger deployment in Coolify
- [ ] Monitor build process for errors
- [ ] Verify container image creation
- [ ] Confirm health checks passing
- [ ] Validate application startup logs
- [ ] Test critical user flows
- [ ] Verify database connectivity
- [ ] Check external service integrations

### Post-Deployment Verification
- [ ] Application responding on all endpoints
- [ ] Health check endpoints returning 200 OK
- [ ] Database queries executing successfully
- [ ] Cache warming completed
- [ ] Static assets loading correctly
- [ ] SSL certificates working
- [ ] Performance metrics within acceptable range
- [ ] Error rates normal (< 1%)

---

## Backup Strategy Checklist

### Database Backups
- [ ] Automated daily backups scheduled
- [ ] Weekly full database backups
- [ ] Point-in-time recovery configured
- [ ] Backup integrity verified monthly
- [ ] Cross-region backup replication enabled
- [ ] Backup retention policy: 30 days daily, 12 weeks weekly
- [ ] Backup restoration process documented and tested

### Application Backups
- [ ] Container image backups in registry
- [ ] Configuration backups (environment variables)
- [ ] SSL certificate backups
- [ ] Static asset backups
- [ ] Log file backups (if needed for compliance)

### Backup Testing
- [ ] Monthly backup restoration test
- [ ] Recovery time objective (RTO): < 2 hours
- [ ] Recovery point objective (RPO): < 1 hour
- [ ] Backup monitoring alerts configured
- [ ] Backup failure notification system active

---

## Rollback Checklist

### Immediate Rollback Triggers
- [ ] Health checks failing for > 5 minutes
- [ ] Error rate > 5% for > 3 minutes
- [ ] Response time > 5 seconds for > 5 minutes
- [ ] Database connectivity lost
- [ ] Critical functionality unavailable
- [ ] Security vulnerability discovered

### Rollback Execution
- [ ] Stop current deployment immediately
- [ ] Revert to previous stable container image
- [ ] Rollback database migrations (if safe)
- [ ] Clear application caches
- [ ] Verify health checks passing
- [ ] Test critical user flows
- [ ] Notify stakeholders of rollback
- [ ] Document rollback reasons and actions

### Post-Rollback Actions
- [ ] Investigate root cause of deployment failure
- [ ] Update deployment procedures if needed
- [ ] Fix identified issues in development
- [ ] Plan next deployment with fixes
- [ ] Update monitoring alerts if needed
- [ ] Review and improve testing coverage

---

## Monitoring & Alerting Checklist

### Application Monitoring
- [ ] Response time monitoring active
- [ ] Error rate tracking configured
- [ ] Memory usage monitoring
- [ ] CPU utilization tracking
- [ ] Database connection pool monitoring
- [ ] Queue processing metrics (if applicable)

### Infrastructure Monitoring
- [ ] Server resource utilization
- [ ] Container health status
- [ ] Network connectivity monitoring
- [ ] Disk space monitoring
- [ ] SSL certificate expiry monitoring

### Alerting Configuration
- [ ] Critical alerts to on-call team (< 5 minutes)
- [ ] Warning alerts to development team (< 15 minutes)
- [ ] Performance degradation alerts
- [ ] Security incident alerts
- [ ] Backup failure alerts
- [ ] Certificate expiry alerts (30 days notice)