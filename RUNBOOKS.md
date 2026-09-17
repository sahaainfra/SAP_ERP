# Operational Runbooks - Part 10

## Overview

This document contains step-by-step procedures for handling common operational incidents and maintenance tasks. Each runbook is designed to be executed by on-call engineers.

---

## 1. Database Unavailable

### Symptoms
- Application returns 500 errors
- Health check fails: `/health/database`
- Monitoring alerts: "Database connection failed"
- Users report "System unavailable"

### Severity: CRITICAL

### Immediate Actions

1. **Verify the Issue**
   ```bash
   # Check database service
   kubectl get pods -l app=postgres
   
   # Check database logs
   kubectl logs -l app=postgres --tail=100
   
   # Test connection
   kubectl exec -it postgres-0 -- psql -U postgres -c "SELECT 1"
   ```

2. **Check Resource Usage**
   ```bash
   # CPU and memory
   kubectl top pod postgres-0
   
   # Disk space
   kubectl exec -it postgres-0 -- df -h
   
   # Connection count
   kubectl exec -it postgres-0 -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity"
   ```

3. **If Database Pod is Down**
   ```bash
   # Restart database pod
   kubectl delete pod postgres-0
   
   # Wait for restart
   kubectl rollout status statefulset/postgres
   
   # Verify recovery
   kubectl exec -it postgres-0 -- psql -U postgres -c "SELECT 1"
   ```

4. **If Database is Overloaded**
   ```bash
   # Check slow queries
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     SELECT pid, now() - pg_stat_activity.query_start AS duration, query
     FROM pg_stat_activity
     WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
     ORDER BY duration DESC
   "
   
   # Kill long-running queries (if safe)
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE query_start < now() - interval '10 minutes'
   "
   ```

5. **If Disk is Full**
   ```bash
   # Check disk usage
   kubectl exec -it postgres-0 -- du -sh /var/lib/postgresql/data/*
   
   # Clean up old WAL files (if safe)
   kubectl exec -it postgres-0 -- psql -U postgres -c "SELECT pg_rotate_logfile()"
   
   # Expand PVC if needed
   kubectl patch pvc postgres-data -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
   ```

6. **Failover to Replica** (if primary is unrecoverable)
   ```bash
   # Promote replica to primary
   kubectl exec -it postgres-replica-0 -- psql -U postgres -c "SELECT pg_promote()"
   
   # Update application connection string
   kubectl set env deployment/construction-erp DATABASE_URL=postgresql://postgres-replica-0:5432/construction_erp
   
   # Restart application
   kubectl rollout restart deployment/construction-erp
   ```

### Communication

- **Internal**: Notify technical lead and architecture team
- **Users**: Update status page: "Database maintenance in progress. Expected resolution: <time>"
- **Stakeholders**: Email briefing if outage > 15 minutes

### Recovery Verification

```bash
# Check application health
curl https://app.construction-erp.example.com/health

# Check database health
curl https://app.construction-erp.example.com/health/database

# Run smoke tests
npm run test:smoke

# Monitor for 30 minutes
kubectl logs -f deployment/construction-erp | grep -i error
```

### Post-Incident

- [ ] Document root cause
- [ ] Update monitoring alerts if needed
- [ ] Schedule post-mortem meeting
- [ ] Update runbook if procedures were unclear

---

## 2. WebSocket Gateway Down

### Symptoms
- Real-time updates not working
- Dashboard shows "Offline" indicator
- Users report "Data not updating"
- Monitoring alerts: "WebSocket connections dropped"

### Severity: HIGH

### Immediate Actions

1. **Check WebSocket Service**
   ```bash
   # Check pods
   kubectl get pods -l app=websocket-gateway
   
   # Check logs
   kubectl logs -l app=websocket-gateway --tail=100
   
   # Check connections
   kubectl exec -it websocket-gateway-0 -- netstat -an | grep ESTABLISHED | wc -l
   ```

2. **Restart WebSocket Gateway**
   ```bash
   kubectl rollout restart deployment/websocket-gateway
   kubectl rollout status deployment/websocket-gateway
   ```

3. **Check Event Bus**
   ```bash
   # If using Redis
   kubectl exec -it redis-0 -- redis-cli INFO clients
   
   # Check queue depth
   kubectl exec -it redis-0 -- redis-cli LLEN event_queue
   ```

4. **Verify Client Reconnection**
   ```bash
   # Check application logs for reconnection attempts
   kubectl logs -l app=construction-erp | grep -i "websocket"
   ```

### Recovery Verification

```bash
# Check WebSocket health
curl https://app.construction-erp.example.com/health/websocket

# Monitor connections
kubectl exec -it websocket-gateway-0 -- netstat -an | grep ESTABLISHED | wc -l

# Verify real-time updates
# (Manual test: open dashboard, verify KPIs update)
```

---

## 3. Backup Failure

### Symptoms
- Monitoring alerts: "Backup failed"
- Last backup age > 26 hours
- Backup dashboard shows failure status

### Severity: HIGH

### Immediate Actions

1. **Check Backup Logs**
   ```bash
   # Find failed backup job
   kubectl get jobs -l app=backup-job
   
   # Check job logs
   kubectl logs job/backup-job-<timestamp>
   
   # Check backup service logs
   kubectl logs -l app=backup-service --tail=100
   ```

2. **Identify Failure Reason**
   - **Disk space**: Check storage target
   - **Network**: Check connectivity to storage
   - **Permissions**: Check storage credentials
   - **Database lock**: Check for long-running transactions

3. **Resolve Issue**
   
   **If disk space:**
   ```bash
   # Check storage usage
   df -h /backups
   
   # Clean up old backups (if safe)
   find /backups -name "*.bak" -mtime +30 -delete
   
   # Or expand storage
   ```
   
   **If network:**
   ```bash
   # Test connectivity
   ping <storage-endpoint>
   curl -I https://<storage-endpoint>
   ```
   
   **If permissions:**
   ```bash
   # Verify credentials in secret manager
   kubectl get secret backup-credentials -o yaml
   ```

4. **Retry Backup**
   ```bash
   # Trigger manual backup
   kubectl create job --from=cronjob/backup-daily backup-manual-$(date +%s)
   
   # Monitor progress
   kubectl logs -f job/backup-manual-<timestamp>
   ```

5. **Validate Backup**
   ```bash
   # Check backup file exists
   ls -lh /backups/backup-*.bak
   
   # Verify checksum
   sha256sum /backups/backup-*.bak
   
   # Test restore to sandbox
   npm run backup:restore -- --target=sandbox --file=backup-*.bak
   ```

### Communication

- **Internal**: Notify operations team
- **Stakeholders**: Email if backup age > 48 hours

---

## 4. Performance Degradation

### Symptoms
- Response times > budget
- User complaints about slowness
- Monitoring alerts: "p95 response time exceeded"
- Dashboard loading slowly

### Severity: MEDIUM (can escalate to HIGH)

### Immediate Actions

1. **Identify Bottleneck**
   ```bash
   # Check APM dashboard
   # (Link to New Relic / Datadog / etc.)
   
   # Check slow queries
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     SELECT query, calls, total_time, mean_time
     FROM pg_stat_statements
     ORDER BY mean_time DESC
     LIMIT 10
   "
   
   # Check cache hit rate
   kubectl exec -it redis-0 -- redis-cli INFO stats | grep keyspace_hits
   ```

2. **Check Resource Usage**
   ```bash
   # Application pods
   kubectl top pods -l app=construction-erp
   
   # Database
   kubectl top pod postgres-0
   
   # Cache
   kubectl top pod redis-0
   ```

3. **Scale if Needed**
   ```bash
   # Scale application
   kubectl scale deployment/construction-erp --replicas=5
   
   # Scale database (read replicas)
   kubectl scale statefulset/postgres-replica --replicas=3
   ```

4. **Clear Cache** (if cache is stale)
   ```bash
   kubectl exec -it redis-0 -- redis-cli FLUSHDB
   ```

5. **Optimize Queries** (if specific queries are slow)
   ```bash
   # Analyze query
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     EXPLAIN ANALYZE <slow-query>
   "
   
   # Add index if needed
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     CREATE INDEX CONCURRENTLY idx_<table>_<column> ON <table>(<column>)
   "
   ```

### Recovery Verification

```bash
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://app.construction-erp.example.com/api/dashboard

# Check APM dashboard
# (Verify p95 < budget)

# Monitor for 1 hour
kubectl logs -f deployment/construction-erp | grep "response_time"
```

---

## 5. Suspected Data Breach

### Symptoms
- Unusual access patterns
- Audit log anomalies
- Security alerts
- User reports unauthorized access

### Severity: CRITICAL

### Immediate Actions

1. **Contain the Breach**
   ```bash
   # Suspend suspicious user accounts
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     UPDATE users SET is_active = false WHERE id IN (<suspicious-user-ids>)
   "
   
   # Revoke all active sessions
   kubectl exec -it redis-0 -- redis-cli KEYS "session:*" | xargs redis-cli DEL
   
   # Rotate API keys
   kubectl create secret generic api-keys --from-literal=key=<new-key> --dry-run=client -o yaml | kubectl apply -f -
   kubectl rollout restart deployment/construction-erp
   ```

2. **Preserve Evidence**
   ```bash
   # Export audit logs
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     COPY dx_audit_log TO '/tmp/audit_log_$(date +%Y%m%d).csv' WITH CSV HEADER
   "
   kubectl cp postgres-0:/tmp/audit_log_*.csv ./audit_log.csv
   
   # Export access logs
   kubectl logs deployment/construction-erp --since=24h > access_logs.txt
   
   # Preserve database state
   pg_dump -h localhost -U postgres construction_erp > forensic_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Assess Impact**
   ```bash
   # Check what data was accessed
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     SELECT action, resource_type, resource_id, COUNT(*)
     FROM dx_audit_log
     WHERE user_id = <suspicious-user-id>
     AND timestamp > NOW() - INTERVAL '24 hours'
     GROUP BY action, resource_type, resource_id
   "
   ```

4. **Notify Stakeholders**
   - **Immediate**: CISO, legal counsel, PR team
   - **Within 1 hour**: Executive team
   - **Within 24 hours**: Affected users (if PII compromised)
   - **Within 72 hours**: Regulatory bodies (if required by law)

5. **Engage Forensics Team**
   - Contact incident response retainer
   - Preserve all logs and evidence
   - Do NOT delete or modify any data

### Communication

- **Internal**: Incident response team activated
- **Users**: "We are investigating a security incident. No action required at this time."
- **Regulators**: Notify within 72 hours if PII compromised (GDPR, etc.)
- **Media**: Only if required by law or if breach is public

### Post-Incident

- [ ] Complete forensic investigation
- [ ] Identify root cause
- [ ] Patch vulnerability
- [ ] Rotate all credentials
- [ ] Update security policies
- [ ] Conduct security training
- [ ] File regulatory reports (if required)
- [ ] Notify affected users (if required)

---

## 6. Mass Permission Error

### Symptoms
- Users report "Access denied" for previously accessible features
- Monitoring alerts: "403 error rate spike"
- Audit log shows permission changes

### Severity: HIGH

### Immediate Actions

1. **Identify Scope**
   ```bash
   # Check recent permission changes
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     SELECT * FROM dx_audit_log
     WHERE action LIKE '%permission%'
     AND timestamp > NOW() - INTERVAL '1 hour'
     ORDER BY timestamp DESC
   "
   ```

2. **Check for Erroneous Changes**
   ```bash
   # Check if assignments were revoked
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     SELECT user_id, project_id, status, updated_at
     FROM dx_project_assignment
     WHERE updated_at > NOW() - INTERVAL '1 hour'
     ORDER BY updated_at DESC
   "
   ```

3. **Rollback if Needed**
   ```bash
   # Restore from audit log
   kubectl exec -it postgres-0 -- psql -U postgres -c "
     UPDATE dx_project_assignment
     SET status = 'ACTIVE'
     WHERE id IN (<affected-assignment-ids>)
   "
   ```

4. **Clear Permission Cache**
   ```bash
   kubectl exec -it redis-0 -- redis-cli KEYS "permission:*" | xargs redis-cli DEL
   ```

5. **Verify Recovery**
   ```bash
   # Test with affected user
   curl -H "Authorization: Bearer <user-token>" \
        https://app.construction-erp.example.com/api/permissions
   ```

---

## 7. Third-Party Integration Failure

### Symptoms
- Integration-specific features not working
- Monitoring alerts: "Integration <name> unavailable"
- Error logs show integration timeouts

### Severity: MEDIUM

### Immediate Actions

1. **Identify Failed Integration**
   ```bash
   # Check integration logs
   kubectl logs -l app=construction-erp | grep -i "integration"
   
   # Check integration status
   curl https://app.construction-erp.example.com/health/integrations
   ```

2. **Check Third-Party Status**
   - Visit vendor status page
   - Check vendor Twitter/status updates
   - Test integration endpoint directly

3. **Enable Fallback** (if available)
   ```bash
   # Enable manual mode
   kubectl set env deployment/construction-erp INTEGRATION_<NAME>_MODE=manual
   kubectl rollout restart deployment/construction-erp
   ```

4. **Notify Users**
   - Update status page
   - Send email if critical integration

5. **Monitor Vendor**
   - Subscribe to vendor status updates
   - Escalate to vendor support if needed

---

## 8. Storage Full

### Symptoms
- Monitoring alerts: "Disk usage > 90%"
- Application errors: "No space left on device"
- Backup failures

### Severity: HIGH

### Immediate Actions

1. **Identify Largest Consumers**
   ```bash
   # Check disk usage
   df -h
   
   # Find largest directories
   du -sh /var/lib/postgresql/data/* | sort -rh | head -20
   du -sh /backups/* | sort -rh | head -20
   du -sh /logs/* | sort -rh | head -20
   ```

2. **Clean Up Old Data**
   ```bash
   # Remove old backups (keep last 30 days)
   find /backups -name "*.bak" -mtime +30 -delete
   
   # Remove old logs (keep last 7 days)
   find /logs -name "*.log" -mtime +7 -delete
   
   # Vacuum database
   kubectl exec -it postgres-0 -- psql -U postgres -c "VACUUM ANALYZE"
   ```

3. **Expand Storage** (if cleanup insufficient)
   ```bash
   # Expand PVC
   kubectl patch pvc postgres-data -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'
   
   # Wait for expansion
   kubectl get pvc postgres-data -w
   ```

4. **Prevent Recurrence**
   ```bash
   # Set up log rotation
   kubectl edit configmap logging-config
   
   # Set up backup retention policy
   kubectl edit cronjob backup-daily
   ```

---

## Maintenance Windows

### Scheduled Maintenance

- **Frequency**: Monthly (first Sunday, 2:00 AM - 6:00 AM)
- **Notification**: 1 week in advance via email and status page
- **Scope**: Database updates, infrastructure upgrades, security patches

### Emergency Maintenance

- **Approval**: Technical lead + operations manager
- **Notification**: Immediate via email, SMS, and status page
- **Scope**: Critical security patches, data corruption fixes

---

## Contact Information

### On-Call Rotation

| Week | Primary | Secondary |
|------|---------|-----------|
| 1 | John Doe | Jane Smith |
| 2 | Jane Smith | Bob Johnson |
| 3 | Bob Johnson | Alice Williams |
| 4 | Alice Williams | John Doe |

### Escalation Path

1. **On-call engineer**: +1-555-0100
2. **Technical lead**: +1-555-0101
3. **Operations manager**: +1-555-0102
4. **CTO**: +1-555-0103

### Vendor Support

- **Database**: support@postgres.example.com
- **Cloud provider**: support@cloud.example.com
- **Monitoring**: support@monitoring.example.com

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-10  
**Next Review**: 2026-03-10
