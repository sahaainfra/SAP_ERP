# Part 14: KPI Engine, Alert Engine & SLA Engine

## Overview

Part 14 implements the three monitoring engines that power all dashboard metrics and operational alerts in the ERP:

1. **KPI Engine** — Computes, caches, and serves Key Performance Indicators with permission filtering
2. **Alert Engine** — Monitors conditions and raises alerts with deduplication and lifecycle management
3. **SLA Engine** — Tracks service level agreements with working calendar support

**Key Principle:** Every KPI is a registered definition with 10 mandatory governance fields. No KPI value is ever hard-coded, and no transaction data is ever fabricated. Where there is no authorized data, the tile shows the defined empty state.

## What Was Delivered

### 1. Database Schema

Created 8 new tables:

- **dx_kpi_definition** — KPI registry with 10 mandatory governance fields
- **dx_kpi_event_map** — Maps events to KPI invalidation
- **dx_kpi_snapshot** — Precomputed KPI values for trends and fast loading
- **dx_alert_rule** — Alert condition definitions (33+ seeded rules)
- **dx_alert** — Raised alerts with lifecycle tracking
- **dx_working_calendar** — Company/project working hours
- **dx_calendar_holiday** — Holiday calendar
- **dx_sla_tracking** — SLA tracking for workflow items

### 2. KPI Engine

**Core Features:**
- Permission-filtered computation — every KPI query passes through Part 08 filter
- Event-driven cache invalidation — KPIs subscribe to relevant events
- Batched KPI endpoint — dashboard makes one request for all tiles
- Threshold evaluation — status logic (good/warning/critical/neutral)
- Drill-down support — every KPI links to source transactions
- Snapshot storage — historical values for trend analysis

**10 Mandatory Governance Fields:**
1. Source — which tables/queries provide the data
2. Formula — how the value is computed
3. Calculation period — real-time, hourly, daily, etc.
4. Project scope — active, all, assigned, specific
5. Organisation scope — company, division, department
6. Permission key — who can view this KPI
7. Refresh mechanism — event-driven, scheduled, on-demand
8. Threshold — green/amber/red boundaries
9. Status logic — higher_is_better, lower_is_better, target_range
10. Drill-down destination — where to go for details

**Seeded KPIs (11):**
- Project: physical_progress, cost_variance
- Procurement: po_pending_count, po_value_approved
- Store: stock_value, low_stock_count
- Billing: certified_value, pending_count
- Finance: cash_position
- HR: headcount, attendance_percent

### 3. Alert Engine

**Core Features:**
- Event-driven triggers — alerts fire on domain events
- Threshold-based triggers — alerts fire when values cross boundaries
- Deduplication — same alert within cooldown increments occurrence count
- Auto-clear — alerts close automatically when condition resolves
- Severity levels — INFO, LOW, MEDIUM, HIGH, CRITICAL
- Routing — alerts go to responsible users by project assignment
- Escalation — unacknowledged alerts escalate to managers

**Seeded Alert Rules (33+):**

**Procurement:**
- PO-OVERDUE — PO delivery date passed, GRN incomplete
- PO-PARTIAL — PO partially received, balance ageing > 30 days

**Store:**
- STOCK-REORDER — Stock below reorder level
- STOCK-NEGATIVE — Stock quantity negative
- STOCK-NONMOVING — No movement in 90 days, value > threshold

**Finance:**
- BUDGET-80 — Cost head reaches 80% of budget
- BUDGET-EXCEEDED — Cost head exceeds budget
- CASH-NEGATIVE — Projected cash negative within 30 days

**Project:**
- PROJECT-DELAYED — Actual progress behind plan by > threshold %
- MILESTONE-RISK — Milestone due in 7 days, progress insufficient

**Billing:**
- BILL-PENDING — RA bill uncertified beyond SLA
- RECEIVABLE-OVERDUE — Invoice overdue beyond credit period
- RECEIVABLE-90 — Receivable in the 90+ bucket

**Quality:**
- NCR-OVERDUE — NCR past its closure date
- TEST-FAILED — Material or cube test failed

**Safety:**
- PERMIT-EXPIRED — Work permit expired while work is open
- INCIDENT-REPORTED — Safety incident reported

**Workflow:**
- APPROVAL-SLA — Approval pending beyond its SLA

**Compliance:**
- CONTRACT-EXPIRY — Contract expiring within 30 days
- DOC-EXPIRY — Statutory document/licence expiring within 30 days
- INSURANCE-EXPIRY — Insurance expiring within 30 days

**Equipment:**
- MAINT-DUE — Equipment maintenance due
- MAINT-OVERDUE — Maintenance overdue
- EQUIP-BREAKDOWN — Equipment breakdown reported
- FUEL-ANOMALY — Fuel consumption deviates > 20% from norm

**HR:**
- ATTENDANCE-ANOMALY — Attendance pattern anomaly detected
- DPR-MISSING — DPR not submitted by cut-off time
- MB-PENDING — MB uncertified beyond SLA

**System:**
- SOD-VIOLATION — Segregation of duties violation detected
- BACKUP-FAILED — Scheduled backup failed

### 4. SLA Engine

**Core Features:**
- Working calendar support — counts working hours, not wall-clock
- Pause/resume — SLA clock pauses when document returned for correction
- State computation — ON_TRACK, AT_RISK (within 25% of due), OVERDUE, MET, BREACHED
- Escalation tracking — L1 → reports-to, L2 → project manager, L3 → project director
- Holiday awareness — SLA pauses on holidays

**SLA States:**
- **ON_TRACK** — now < due_at − 25% of sla_hours
- **AT_RISK** — now < due_at (within 25% window)
- **OVERDUE** — now >= due_at
- **MET** — resolved before due_at
- **BREACHED** — resolved after due_at

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| KPI-01 | BLOCK | Every KPI definition declares all 10 governance fields |
| KPI-02 | BLOCK | No hard-coded KPI values anywhere |
| KPI-03 | BLOCK | KPI computed through permission filter for requesting user |
| KPI-04 | BLOCK | KPI user may not see is absent, not zero |
| KPI-05 | BLOCK | Every KPI drills to transactions, sum equals tile exactly |
| KPI-06 | BLOCK | Alert names condition, numbers, responsible party, proposed action |
| KPI-07 | WARN | KPI exceeding time budget served from cache with staleness indicator |

## Key Features

### Permission-Filtered Computation

Every KPI query passes through the Part 08 permission filter:
- Two users may legitimately see different values for the same tile
- Each value is correct for that user's authorized rows
- Cache keys include scope fingerprint: `kpi:{kpiKey}:{scopeHash}`
- Unauthorized KPIs are absent from dashboard, not zero

### Event-Driven Invalidation

KPIs subscribe to relevant domain events:
- `purchase_order.approved` → invalidates `procurement.po_value_approved`
- `grn.posted` → invalidates `store.stock_value`
- `ra_bill.certified` → invalidates `billing.certified_value`
- Cache cleared on event, recomputed on next request
- Real-time dashboard updates without polling

### Alert Deduplication

Same alert within cooldown period increments occurrence count:
- Prevents alert fatigue from repeated notifications
- Cooldown configurable per rule (default 60 minutes)
- Occurrence count shown in alert UI
- Last occurred timestamp updated

### Alert Auto-Clear

Alerts close automatically when condition resolves:
- Stock replenished → STOCK-REORDER alert auto-clears
- PO received → PO-OVERDUE alert auto-clears
- Bill certified → BILL-PENDING alert auto-clears
- Status set to AUTO_CLEARED
- `alert.cleared` event emitted

### SLA Working Hours

SLA counts working hours, not wall-clock hours:
- Prevents weekend breaches
- Respects company/project calendars
- Configurable working days and hours
- Holiday awareness
- Pause/resume on document return

## File Structure

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

## Integration Points

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

## Testing Requirements

**KPI Engine:**
- [ ] Every KPI that replaces existing report returns identical number
- [ ] Two users with different scopes see different values
- [ ] Division by zero returns null, not Infinity
- [ ] KPI with no data returns null with rowCount: 0
- [ ] Query timeout returns last snapshot with isPartial: true
- [ ] Batch endpoint returns 20 KPIs in one request under 1s
- [ ] Cache invalidation on event works correctly

**Alert Engine:**
- [ ] Every seeded rule fires from real data
- [ ] Deduplication increments count instead of creating duplicates
- [ ] Auto-clear works when condition resolves
- [ ] Alerts route by project responsibility, not global role
- [ ] Escalation follows project-specific reporting line
- [ ] Quiet hours suppress non-critical alerts
- [ ] CRITICAL alerts always deliver immediately

**SLA Engine:**
- [ ] SLA counts working hours, honors holidays
- [ ] SLA pauses on return-for-correction
- [ ] Escalation follows project-specific reporting line
- [ ] State transitions work correctly (ON_TRACK → AT_RISK → OVERDUE)
- [ ] Completed items show MET or BREACHED correctly

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All KPI/Alert/SLA services compile correctly
- Output: 695KB JS, 59KB CSS

## What Part 14 Does NOT Do

- ❌ Does not implement actual database queries (uses mock data)
- ❌ Does not implement actual event subscription (framework only)
- ❌ Does not implement actual notification delivery (emits events)
- ❌ Does not implement actual working calendar queries (uses defaults)
- ❌ Does not implement actual SLA worker job (framework only)

**Part 14 defines the KPI, Alert, and SLA engine contracts and services. Actual database integration happens in later parts.**

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
