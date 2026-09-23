# Part 15: Analytical View Layer, KPI Service & Batch Framework

## Overview

Part 15 implements the analytical layer that every dashboard, report, and export reads through. This includes the three-tier view stack (basic → composite → consumption), the KPI service, the situation/exception engine, and the batch job framework.

**Key Principle:** Every transaction, approval, status change, attendance punch, material movement, procurement action, billing event, and financial posting updates every affected dashboard and user in real time, without a page refresh, within the permission boundary of each recipient.

## What Was Delivered

### 1. Database Schema (`migrations/015_create_analytical_batch.sql`)

Created 2 new tables:
- **dx_job_run** — Batch job execution history and monitoring
- **dx_realtime_delivery** — Gap recovery tracking for WebSocket clients

### 2. Batch Job Framework (`batch-job-framework.ts`)

Manages scheduled and on-demand batch jobs with:
- Job definitions with schedules (cron)
- Execution tracking (start, end, duration, records processed)
- Failure handling (retries, alerts, manual action queue)
- Singleton enforcement (cluster-wide lock)
- Progress reporting

**Key Features:**
- Job registration and scheduling
- Execution with timeout and abort support
- Comprehensive logging
- Failure alerting (P1, WARNING, NONE)
- Job run history and monitoring

### 3. Real-Time Fan-Out Service (`realtime-fanout.ts`)

Handles per-subscriber event distribution with:
- **Permission-filtered payload construction** — never broadcast to rooms
- **Throttling and coalescing** — device-specific (DESKTOP: 400ms, TABLET: 800ms, PHONE: 1500ms)
- **Backpressure handling** — slow clients get `resync` instruction
- **Gap recovery support** — tracks last delivered event per user/device

**Key Features:**
- Event specification registry
- Session management (connect/disconnect)
- Per-subscriber payload construction
- Urgent event bypass (approvals, alerts, incidents)
- Buffer coalescing to prevent message flooding
- Delivery tracking for gap recovery

### 4. KPI Service (`kpi-service.ts`)

Provides batched KPI queries over consumption views with:
- **Permission filtering** (Part 08)
- **Batch endpoint** — one request for many KPIs
- **Trend data** — historical values for charts
- **Drill-down support** — every KPI links to source transactions
- **Provenance tracking** — every number is explainable

**Key Features:**
- KPI definition registry
- Batch query endpoint (dashboard makes ONE request)
- Source grouping for efficient querying
- Health evaluation (NEUTRAL, GOOD, WARNING, CRITICAL)
- Variance computation (value vs target)
- Value formatting by type (MONEY, QUANTITY, PERCENT, COUNT, DAYS, RATIO)
- Trend data retrieval
- Drill-down route resolution

### 5. Situation / Exception Engine (`situation-engine.ts`)

Detects conditions and creates actionable situations with:
- **Event-driven and scheduled detection**
- **Responsible party assignment** (via Part 10 approver rules)
- **Context building** for decision-making
- **Proposed actions** with permissions
- **Auto-resolve** when conditions clear
- **Escalation** on timeout
- **Duplicate suppression**

**Key Features:**
- Situation definition registry
- Event-driven evaluation
- Responsible party resolution
- Context building
- Situation lifecycle (OPEN → ACKNOWLEDGED → RESOLVED / ESCALATED)
- Auto-resolve condition checking
- Duplicate suppression with configurable window

### 6. Offline Sync Service (`sync-service.ts`)

Handles offline sync with conflict resolution:
- **Idempotency** — duplicate detection via localId
- **Allow-list enforcement** — only approved entity types
- **Permission re-check** at sync time (not capture time)
- **Per-entity conflict resolvers** — business-specific logic
- **Clock skew recording** — never trust client time

**Key Features:**
- Batch submission with ordered processing
- Idempotency checking
- Allow-list validation (attendance, DPR, MB, inspection, incident, observation)
- Permission verification at sync time
- Conflict resolution with multiple strategies:
  - ACCEPT — apply record
  - CONFLICT — return server state and options
  - REJECT — deny with explanation
- Default resolvers for attendance, measurement book, DPR
- Sync history tracking

## Key Features

### Three-Tier View Stack

```
BASIC (vw_dx_b_*)
  ↓ 1:1 to tables, renamed columns, no joins
COMPOSITE (vw_dx_c_*)
  ↓ joins, derived semantics, row-grain
CONSUMPTION (vw_dx_q_*)
  ↓ aggregation, ready for tiles/reports
```

**Rule:** Every consumption view must expose `project_id` for permission filtering.

### Per-Subscriber Fan-Out

**Never broadcast to rooms.** For each event:
1. Get candidate recipients (superset)
2. Filter to connected sessions
3. Per recipient: resolve permissions, build payload, send
4. Track delivery for gap recovery

**Consequence:** A site engineer restricted to Site 3 receives KPI updates for Site 3 only. Two users on the same project receive different numbers for the same KPI — this is correct behavior.

### Throttling & Coalescing

- **DESKTOP:** 400ms coalesce window
- **TABLET:** 800ms coalesce window
- **PHONE:** 1500ms coalesce window (save battery/data)
- **Max batch:** 50 events
- **Urgent events:** bypass buffering (approvals, alerts, incidents)

### Batch Job Groups

| Group | Examples | Schedule |
|-------|----------|----------|
| REALTIME | outbox relay, buffer flush, presence sweep | Every 5s |
| HOURLY | KPI recompute, permit expiry check | Every hour |
| NIGHTLY | stock reconciliation, hash chain verification, KPI snapshot | Daily at 02:00 |
| MONTH_END | GRNI accrual, depreciation, payroll allocation | Monthly |
| ON_DEMAND | manual triggers | As needed |

### Situation Detection

**Event-driven:**
```typescript
{
  kind: 'EVENT',
  eventType: 'store.consumption.variance_detected',
  condition: 'payload.variancePct > 10'
}
```

**Scheduled:**
```typescript
{
  kind: 'SCHEDULED',
  cron: '0 2 * * *',  // daily at 2am
  query: 'SELECT ... WHERE condition'
}
```

### Offline Sync Conflict Resolution

**Attendance:**
- Duplicate across projects → CONFLICT (fraud signal)
- Same project, out-punch missing → ACCEPT (merge)
- Already recorded → REJECT

**Measurement Book:**
- Already certified → REJECT (create revised MB)
- Content changed → CONFLICT (merge/discard/new)
- No changes → ACCEPT

**DPR:**
- Already submitted for date → CONFLICT (overwrite/keep)

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| AN-01 | BLOCK | Three-tier view stack is strict — dashboards read only consumption views |
| AN-02 | BLOCK | No analytical view bypasses permission filter |
| AN-03 | BLOCK | Long-running work runs as batch job, never in request transaction |
| AN-04 | BLOCK | Every batch job records start, end, outcome, row counts, errors |
| AN-05 | BLOCK | Situation names responsible party and proposed actions |
| AN-06 | BLOCK | Situations closed by human with explanation, never auto-closed by time |

## Performance Budgets

| Operation | Budget |
|-----------|--------|
| WebSocket connect + auth + permission resolve | ≤ 300ms |
| Event → connected client render | ≤ 3s end-to-end |
| `/kpi/batch` with 20 KPIs | ≤ 800ms |
| Consumption view query at 5-year volume | ≤ 300ms |
| Fan-out to 200 recipients | ≤ 2s |
| Replay 500 events | ≤ 2s |
| Offline batch of 50 records | ≤ 5s |

## File Structure

```
src/platform/analytical/
├── types.ts                    # All analytical types
├── batch-job-framework.ts      # Batch job execution and monitoring
├── realtime-fanout.ts          # Per-subscriber event distribution
├── kpi-service.ts              # Batched KPI queries
├── situation-engine.ts         # Exception detection and management
├── sync-service.ts             # Offline sync conflict resolution
└── index.ts                    # Module exports

migrations/
└── 015_create_analytical_batch.sql  # Database schema
```

## Integration Points

**Used By:**
- Part 17 (UI Component System) — KPI rendering
- Part 20 (Dashboard Engine) — Tile data source
- Part 58 (MIS & Reporting) — Report data source
- Part 67 (Performance) — Monitoring and optimization
- Part 69 (Cross-Module) — Consolidation

**Dependencies:**
- Part 11 (Posting Engines) — Ledger data sources
- Part 12 (Calculation Engines) — Computation primitives
- Part 14 (KPI/Alert/SLA Engines) — KPI definitions, alerts, SLA tracking

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All analytical services compile correctly
- Output: 695KB JS, 59KB CSS

## What Part 15 Does NOT Do

- ❌ Does not implement actual SQL views (framework only)
- ❌ Does not implement actual WebSocket transport (uses event bus)
- ❌ Does not implement actual database queries (mock data)
- ❌ Does not implement actual cron scheduler (simplified)
- ❌ Does not implement actual offline storage (sync protocol only)

**Part 15 defines the analytical layer contracts and services. Actual database views and transport happen in later parts.**

## Next Steps

**Part 16: Global ERP Application Shell, Navigation & Global Search**
- Application shell with header, sidebar, breadcrumbs
- Navigation system with permission filtering
- Global search with type-ahead
- Command palette

---

**Part 15 of 69 — Complete** ✅  
**Progress: 21.7% of total build**  
**Next: Part 16 — Global ERP Application Shell**
