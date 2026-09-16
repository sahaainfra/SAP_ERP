# Deployment Guide - Part 10

## Overview

This guide covers the deployment process for the Construction ERP system, including environment setup, database migrations, application deployment, and rollback procedures.

## Environments

### Development
- **Purpose**: Feature development and local testing
- **Data**: Mock data, small datasets
- **Access**: Developers only
- **URL**: `http://localhost:5173`

### Testing
- **Purpose**: Integration testing and QA
- **Data**: Anonymized production-scale data
- **Access**: QA team, developers
- **URL**: `https://test.construction-erp.example.com`

### Staging
- **Purpose**: Pre-production validation
- **Data**: Production-scale anonymized data
- **Access**: QA team, operations, select users
- **URL**: `https://staging.construction-erp.example.com`
- **Requirements**: Must mirror production infrastructure

### Production
- **Purpose**: Live system for end users
- **Data**: Real production data
- **Access**: All authorized users
- **URL**: `https://app.construction-erp.example.com`

## Pre-Deployment Checklist

### Code Quality
- [ ] All unit tests passing (≥80% coverage)
- [ ] All integration tests passing
- [ ] All permission matrix tests passing
- [ ] All E2E tests passing for critical journeys
- [ ] Performance tests within budget
- [ ] Security scan passed (no high/critical vulnerabilities)
- [ ] Accessibility tests passed (WCAG 2.2 AA)
- [ ] Visual regression tests passed (all themes/densities)

### Documentation
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Migration scripts tested
- [ ] Rollback procedure documented and tested
- [ ] Runbooks updated
- [ ] User documentation updated

### Infrastructure
- [ ] Database backups verified
- [ ] Storage capacity checked
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] Load balancer configured
- [ ] Monitoring alerts configured

### Security
- [ ] Secrets rotated (if applicable)
- [ ] Firewall rules updated
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] Audit logging enabled

## Deployment Pipeline

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐
│  Commit │───▶│  Lint &  │───▶│  Unit   │───▶│  Build   │───▶│Integration│
│         │    │ Type Check│    │  Tests  │    │          │    │  Tests   │
└─────────┘    └──────────┘    └─────────┘    └──────────┘    └──────────┘
                                                                      │
                                                                      ▼
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐
│  Smoke  │◀───│Production│◀───│ Manual │◀───│   E2E    │◀───│Permission│
│  Tests  │    │  Deploy  │    │ Approval│    │  Suite   │    │  Matrix  │
└─────────┘    └──────────┘    └─────────┘    └──────────┘    └──────────┘
```

### Pipeline Stages

1. **Lint & Type Check**
   - ESLint for code quality
   - TypeScript type checking
   - Must pass with zero errors

2. **Unit Tests**
   - Business logic tests
   - Calculation tests
   - Utility function tests
   - Coverage ≥80%

3. **Build**
   - Production build
   - Asset optimization
   - Bundle size check

4. **Integration Tests**
   - API endpoint tests
   - Database integration tests
   - External service mocks

5. **Permission Matrix**
   - All endpoints tested with all permission combinations
   - 100% coverage required

6. **E2E Suite**
   - All 16 critical user journeys
   - Cross-browser testing
   - Mobile responsiveness

7. **Security Scan**
   - SAST (Static Application Security Testing)
   - Dependency vulnerability scan
   - Secret detection
   - Must pass with no high/critical findings

8. **Performance Suite**
   - All performance budgets validated
   - Load testing with seeded dataset
   - Must pass all budgets

9. **Accessibility Suite**
   - WCAG 2.2 AA compliance
   - Screen reader testing
   - Keyboard navigation

10. **Manual Approval**
    - Release manager review
    - Stakeholder sign-off
    - Go/no-go decision

11. **Deploy to Staging**
    - Blue-green deployment
    - Smoke tests
    - Monitoring validation

12. **Deploy to Production**
    - Rolling deployment
    - Health checks
    - Feature flags (if applicable)

13. **Post-Deployment**
    - Smoke tests
    - Monitoring validation
    - User acceptance testing

## Database Migration

### Migration Process

1. **Pre-Migration**
   ```bash
   # Create backup
   pg_dump -h localhost -U postgres construction_erp > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Validate backup
   pg_restore -l backup_*.sql
   ```

2. **Run Migrations**
   ```bash
   # Check pending migrations
   npm run db:migrate:status
   
   # Run migrations
   npm run db:migrate
   
   # Verify migration
   npm run db:migrate:status
   ```

3. **Post-Migration**
   ```bash
   # Validate data integrity
   npm run db:validate
   
   # Update statistics
   npm run db:analyze
   ```

### Migration Safety Rules

- **Never** drop or rename columns in the same release
- **Always** add nullable columns first, backfill, then add constraints
- **Always** test migrations on a restored production copy
- **Always** have a rollback script ready
- **Never** run migrations without a backup

### Zero-Downtime Migration Pattern

```sql
-- Step 1: Add new column (nullable)
ALTER TABLE projects ADD COLUMN new_field VARCHAR(255);

-- Step 2: Backfill data (batch processing)
UPDATE projects SET new_field = old_field WHERE new_field IS NULL;

-- Step 3: Deploy code that writes to both columns
-- (Application code update)

-- Step 4: Deploy code that reads from new column
-- (Application code update)

-- Step 5: Add NOT NULL constraint (after validation)
ALTER TABLE projects ALTER COLUMN new_field SET NOT NULL;

-- Step 6: Remove old column (in next release)
-- ALTER TABLE projects DROP COLUMN old_field;
```

## Rollback Procedure

### Application Rollback

```bash
# Identify current version
kubectl get deployment construction-erp -o jsonpath='{.spec.template.spec.containers[0].image}'

# Rollback to previous version
kubectl rollout undo deployment/construction-erp

# Verify rollback
kubectl rollout status deployment/construction-erp

# Check health
kubectl get pods -l app=construction-erp
```

### Database Rollback

```bash
# Identify migration to rollback
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:undo

# Or rollback to specific version
npm run db:migrate:undo -- --to=20260210120000

# Verify rollback
npm run db:migrate:status
```

### Full Rollback (Emergency)

```bash
# 1. Stop application
kubectl scale deployment/construction-erp --replicas=0

# 2. Restore database from backup
pg_restore -h localhost -U postgres -d construction_erp backup_*.sql

# 3. Rollback application code
git checkout <previous-tag>
npm run build
kubectl set image deployment/construction-erp app=<previous-image>

# 4. Start application
kubectl scale deployment/construction-erp --replicas=3

# 5. Verify health
kubectl get pods -l app=construction-erp
curl https://app.construction-erp.example.com/health
```

## Feature Flags

### Configuration

Feature flags are stored in the database and can be toggled without deployment:

```sql
-- Enable feature
UPDATE dx_feature_flags SET enabled = true WHERE flag_key = 'new_dashboard';

-- Disable feature
UPDATE dx_feature_flags SET enabled = false WHERE flag_key = 'new_dashboard';

-- Check feature status
SELECT * FROM dx_feature_flags WHERE flag_key = 'new_dashboard';
```

### Usage in Code

```typescript
import { useFeatureFlag } from './hooks/useFeatureFlag';

function MyComponent() {
  const isEnabled = useFeatureFlag('new_dashboard');
  
  if (!isEnabled) {
    return <OldDashboard />;
  }
  
  return <NewDashboard />;
}
```

## Monitoring & Alerting

### Health Checks

```bash
# Application health
curl https://app.construction-erp.example.com/health

# Database health
curl https://app.construction-erp.example.com/health/database

# Cache health
curl https://app.construction-erp.example.com/health/cache

# Queue health
curl https://app.construction-erp.example.com/health/queue
```

### Metrics

- **Response Time**: p50, p95, p99
- **Error Rate**: 4xx, 5xx
- **Throughput**: Requests per second
- **Database**: Connections, query time, cache hit rate
- **Queue**: Depth, processing time, failures
- **WebSocket**: Connections, message rate

### Alerts

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Response Time (p95) | >500ms | >1000ms | Investigate slow queries |
| Error Rate | >1% | >5% | Check logs, rollback if needed |
| Database Connections | >80% | >95% | Scale connection pool |
| Queue Depth | >100 | >500 | Scale workers |
| Disk Usage | >80% | >95% | Clean up or expand storage |
| Backup Age | >26h | >48h | Investigate backup failure |

## Runbooks

See [RUNBOOKS.md](./RUNBOOKS.md) for detailed operational procedures.

## Go-Live Checklist

### Technical
- [ ] All tests passing
- [ ] Performance budgets met
- [ ] Security scan passed
- [ ] Monitoring configured
- [ ] Alerting configured
- [ ] Backups verified
- [ ] Rollback tested

### Operational
- [ ] Runbooks written
- [ ] On-call rota defined
- [ ] Support process defined
- [ ] Escalation paths documented
- [ ] Incident response plan ready

### Business
- [ ] User training completed
- [ ] Documentation published
- [ ] Stakeholder sign-off
- [ ] Legal/compliance approval
- [ ] Data migration validated

### Communication
- [ ] Users notified
- [ ] Support team briefed
- [ ] Status page updated
- [ ] Emergency contacts confirmed

## Post-Deployment

### Immediate (0-2 hours)
- Monitor error rates
- Check performance metrics
- Verify all integrations
- Confirm backups running

### Short-term (2-24 hours)
- Review user feedback
- Monitor system health
- Check for anomalies
- Validate data integrity

### Long-term (1-7 days)
- Analyze performance trends
- Review error patterns
- Optimize based on usage
- Plan next iteration

## Support

### Escalation Path

1. **Level 1**: On-call engineer
2. **Level 2**: Technical lead
3. **Level 3**: Architecture team
4. **Level 4**: Vendor support (if applicable)

### Contact Information

- **On-call**: +1-555-0100
- **Technical Lead**: tech-lead@example.com
- **Architecture**: architecture@example.com
- **Emergency**: emergency@example.com

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-10  
**Next Review**: 2026-03-10
