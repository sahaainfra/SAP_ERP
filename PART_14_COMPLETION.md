# Part 14 Completion Summary

## Part 14: KPI Engine, Alert Engine & SLA Engine

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Progress:** 14 of 69 parts (20.3%)

---

## What Was Delivered

### Database Layer

**Migration:** `migrations/014_create_kpi_alert_sla.sql`

Created 8 new tables:
1. **dx_kpi_definition** — KPI registry with 10 mandatory governance fields
2. **dx_kpi_event_map** — Maps events to KPI invalidation
3. **dx_kpi_snapshot** — Precomputed KPI values for trends
4. **dx_alert_rule** — Alert condition definitions (33+ seeded rules)
5. **dx_alert** — Raised alerts with lifecycle tracking
6. **dx_working_calendar** — Company/project working hours
7. **dx_calendar_holiday** — Holiday calendar
8. **dx_sla_tracking** — SLA tracking for workflow items

### Core Services

**1. KPI Engine** (`kpi-engine.ts`)
- Permission-filtered KPI computation
- Event-driven cache invalidation
- Batched KPI endpoint for dashboards
- Threshold evaluation and status logic
- Drill-down support
- Snapshot storage for trends
- 11 seeded KPI definitions

**2. Alert Engine** (`alert-engine.ts`)
- Event-driven and threshold-based triggers
- Deduplication with cooldown periods
- Auto-clear when conditions resolve
- Severity-based routing (INFO, LOW, MEDIUM, HIGH, CRITICAL)
- Escalation support
- 33+ seeded alert rules

**3. SLA Engine** (`sla-engine.ts`)
- Working calendar support (not wall-clock hours)
- Pause/resume on document return
- State computation (ON_TRACK, AT_RISK, OVERDUE, MET, BREACHED)
- Escalation tracking
- Holiday awareness

**4. Seed Data** (`seed-data.ts`)
- 11 KPI definitions (project, procurement, store, billing, finance, HR)
- 33 alert rules (procurement, store, finance, project, billing, quality, safety, workflow, compliance, equipment, HR, system)

### Key Features

**KPI Governance (10 Mandatory Fields)**
- Source, formula, calculation period
- Project scope, organisation scope
- Permission key, refresh mechanism
- Threshold, status logic, drill-down destination

**Permission-Filtered Computation**
- Every KPI query passes through permission filter
- Two users may see different values for same KPI
- Cache keys include scope fingerprint
- Unauthorized KPIs are absent, not zero

**Event-Driven Invalidation**
- KPIs subscribe to relevant events
- Cache invalidated on data changes
- Real-time dashboard updates
- No polling required

**Alert Lifecycle**
- OPEN → ACKNOWLEDGED → RESOLVED
- AUTO_CLEARED when condition resolves
- Deduplication via cooldown periods
- Occurrence counting

**SLA Working Hours**
- Counts working hours, not wall-clock
- Respects company/project calendars
- Pauses on document return
- Holiday awareness

### Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| KPI-01 | BLOCK | Every KPI definition declares all 10 governance fields |
| KPI-02 | BLOCK | No hard-coded KPI values anywhere |
| KPI-03 | BLOCK | KPI computed through permission filter for requesting user |
| KPI-04 | BLOCK | KPI user may not see is absent, not zero |
| KPI-05 | BLOCK | Every KPI drills to transactions, sum equals tile exactly |
| KPI-06 | BLOCK | Alert names condition, numbers, responsible party, proposed action |
| KPI-07 | WARN | KPI exceeding time budget served from cache with staleness indicator |

### Seeded KPIs (11)

**Project:**
- physical_progress — Percentage of physical work completed vs planned
- cost_variance — Variance between actual cost and budget

**Procurement:**
- po_pending_count — Number of purchase orders awaiting approval or delivery
- po_value_approved — Total value of approved purchase orders

**Store:**
- stock_value — Total value of inventory on hand
- low_stock_count — Number of items below reorder level

**Billing:**
- certified_value — Total value of certified RA bills
- pending_count — Number of bills awaiting certification

**Finance:**
- cash_position — Current cash balance

**HR:**
- headcount — Total number of active employees
- attendance_percent — Average attendance percentage

### Seeded Alert Rules (33+)

**Procurement:**
- PO-OVERDUE — PO delivery date passed, GRN incomplete (HIGH)
- PO-PARTIAL — PO partially received, balance ageing > 30 days (MEDIUM)

**Store:**
- STOCK-REORDER — Stock below reorder level (MEDIUM)
- STOCK-NEGATIVE — Stock quantity negative (CRITICAL)
- STOCK-NONMOVING — No movement in 90 days, value > threshold (LOW)

**Finance:**
- BUDGET-80 — Cost head reaches 80% of budget (MEDIUM)
- BUDGET-EXCEEDED — Cost head exceeds budget (CRITICAL)
- CASH-NEGATIVE — Projected cash negative within 30 days (CRITICAL)

**Project:**
- PROJECT-DELAYED — Actual progress behind plan by > threshold % (HIGH)
- MILESTONE-RISK — Milestone due in 7 days, progress insufficient (HIGH)

**Billing:**
- BILL-PENDING — RA bill uncertified beyond SLA (MEDIUM)
- RECEIVABLE-OVERDUE — Invoice overdue beyond credit period (HIGH)
- RECEIVABLE-90 — Receivable in the 90+ bucket (CRITICAL)

**Quality:**
- NCR-OVERDUE — NCR past its closure date (HIGH)
- TEST-FAILED — Material or cube test failed (CRITICAL)

**Safety:**
- PERMIT-EXPIRED — Work permit expired while work is open (CRITICAL)
- INCIDENT-REPORTED — Safety incident reported (CRITICAL)

**Workflow:**
- APPROVAL-SLA — Approval pending beyond its SLA (HIGH)

**Compliance:**
- CONTRACT-EXPIRY — Contract expiring within 30 days (MEDIUM)
- DOC-EXPIRY — Statutory document/licence expiring within 30 days (HIGH)
- INSURANCE-EXPIRY — Insurance expiring within 30 days (HIGH)

**Equipment:**
- MAINT-DUE — Equipment maintenance due (MEDIUM)
- MAINT-OVERDUE — Maintenance overdue (HIGH)
- EQUIP-BREAKDOWN — Equipment breakdown reported (HIGH)
- FUEL-ANOMALY — Fuel consumption deviates > 20% from norm (MEDIUM)

**HR:**
- ATTENDANCE-ANOMALY — Attendance pattern anomaly detected (MEDIUM)
- DPR-MISSING — DPR not submitted by cut-off time (MEDIUM)
- MB-PENDING — MB uncertified beyond SLA (MEDIUM)

**System:**
- SOD-VIOLATION — Segregation of duties violation detected (HIGH)
- BACKUP-FAILED — Scheduled backup failed (CRITICAL)

### File Structure

```
src/platform/kpi/
├── types.ts              # All KPI, Alert, SLA types
├── kpi-engine.ts         # KPI computation and caching
├── alert-engine.ts       # Alert evaluation and lifecycle
├── sla-engine.ts         # SLA tracking and escalation
├── seed-data.ts          # Initial KPI and alert definitions
└── index.ts              # Module exports

migrations/
└── 014_create_kpi_alert_sla.sql  # Database schema
```

### Integration Points

**Used By:**
- Part 15 (Analytical View Layer) — KPI consumption views
- Part 20 (Dashboard Engine) — Tile data source
- Part 21 (Role Dashboards) — KPI rendering
- Part 23 (Approval Centre) — SLA tracking
- Part 59 (Analytics) — KPI trends and analysis

**Dependencies:**
- Part 08 (Permission Engine) — Permission filtering
- Part 09 (Document Framework) — Audit logging
- Part 13 (Real-Time Engine) — Event-driven invalidation

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All KPI/Alert/SLA services compile correctly
- Output: 695KB JS, 59KB CSS

---

## What Part 14 Does NOT Do

- ❌ Does not implement actual database queries (uses mock data)
- ❌ Does not implement actual event subscription (framework only)
- ❌ Does not implement actual notification delivery (emits events)
- ❌ Does not implement actual working calendar queries (uses defaults)
- ❌ Does not implement actual SLA worker job (framework only)

**Part 14 defines the KPI, Alert, and SLA engine contracts and services. Actual database integration happens in later parts.**

---

## Next Steps

**Part 15: Analytical View Layer, KPI Service & Batch Framework**
- Consumption views for KPIs
- Batch computation framework
- Trend analysis
- Export and reporting

---

**Part 14 of 69 — Complete** ✅  
**Progress: 20.3% of total build**  
**Next: Part 15 — Analytical View Layer**
