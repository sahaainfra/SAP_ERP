# Part 15 Completion Summary

## Part 15: Analytical View Layer, KPI Service & Batch Framework

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Progress:** 15 of 69 parts (21.7%)

---

## What Was Delivered

### Database Layer

**Migration:** `migrations/015_create_analytical_batch.sql`

Created 2 new tables:
1. **dx_job_run** — Batch job execution history and monitoring
2. **dx_realtime_delivery** — Gap recovery tracking for WebSocket clients

### Core Services

**1. Batch Job Framework** (`batch-job-framework.ts`)
- Job registration and scheduling (cron-based)
- Execution with timeout and abort support
- Comprehensive logging (info, warn, error)
- Failure alerting (P1, WARNING, NONE)
- Singleton enforcement (cluster-wide lock)
- Job run history and monitoring
- Support for REALTIME, HOURLY, NIGHTLY, MONTH_END, ON_DEMAND groups

**2. Real-Time Fan-Out Service** (`realtime-fanout.ts`)
- Per-subscriber payload construction (never broadcast to rooms)
- Permission-filtered distribution
- Throttling and coalescing (device-specific: DESKTOP 400ms, TABLET 800ms, PHONE 1500ms)
- Backpressure handling (slow clients get `resync` instruction)
- Gap recovery support (tracks last delivered event per user/device)
- Urgent event bypass (approvals, alerts, incidents)
- Buffer coalescing to prevent message flooding (max 50 events)

**3. KPI Service** (`kpi-service.ts`)
- Batched KPI endpoint (dashboard makes ONE request for many KPIs)
- Permission filtering (Part 08)
- Source grouping for efficient querying
- Health evaluation (NEUTRAL, GOOD, WARNING, CRITICAL)
- Variance computation (value vs target)
- Value formatting by type (MONEY, QUANTITY, PERCENT, COUNT, DAYS, RATIO)
- Trend data retrieval (DAY, WEEK, MONTH grain)
- Drill-down route resolution
- Provenance tracking (every number is explainable)

**4. Situation / Exception Engine** (`situation-engine.ts`)
- Event-driven and scheduled detection
- Responsible party assignment (via Part 10 approver rules)
- Context building for decision-making
- Proposed actions with permissions
- Auto-resolve when conditions clear
- Escalation on timeout
- Duplicate suppression with configurable window
- Situation lifecycle (OPEN → ACKNOWLEDGED → RESOLVED / ESCALATED)

**5. Offline Sync Service** (`sync-service.ts`)
- Idempotency checking (duplicate detection via localId)
- Allow-list enforcement (attendance, DPR, MB, inspection, incident, observation)
- Permission re-check at sync time (not capture time)
- Per-entity conflict resolvers with business-specific logic
- Clock skew recording (never trust client time)
- Default resolvers for:
  - Attendance: duplicate detection, out-punch merge, fraud signal
  - Measurement Book: certification check, content hash comparison
  - DPR: date-based duplicate detection
- Sync history tracking

### Key Features

**Three-Tier View Stack:**
```
BASIC (vw_dx_b_*)
  ↓ 1:1 to tables, renamed columns, no joins
COMPOSITE (vw_dx_c_*)
  ↓ joins, derived semantics, row-grain
CONSUMPTION (vw_dx_q_*)
  ↓ aggregation, ready for tiles/reports
```

**Rule:** Every consumption view must expose `project_id` for permission filtering.

**Per-Subscriber Fan-Out:**
- Never broadcast to rooms (prevents data leaks)
- For each event: get candidates → filter to connected → per recipient: resolve permissions, build payload, send
- Two users on same project receive different numbers for same KPI (correct behavior)
- A site engineer restricted to Site 3 receives KPI updates for Site 3 only

**Throttling & Coalescing:**
- DESKTOP: 400ms coalesce window
- TABLET: 800ms coalesce window
- PHONE: 1500ms coalesce window (save battery/data)
- Max batch: 50 events
- Urgent events bypass buffering (approvals, alerts, incidents)

**Batch Job Groups:**
| Group | Examples | Schedule |
|-------|----------|----------|
| REALTIME | outbox relay, buffer flush, presence sweep | Every 5s |
| HOURLY | KPI recompute, permit expiry check | Every hour |
| NIGHTLY | stock reconciliation, hash chain verification, KPI snapshot | Daily at 02:00 |
| MONTH_END | GRNI accrual, depreciation, payroll allocation | Monthly |
| ON_DEMAND | manual triggers | As needed |

**Situation Detection:**
- Event-driven: `store.consumption.variance_detected` with condition `payload.variancePct > 10`
- Scheduled: cron-based queries for periodic checks
- Responsible party resolved via Part 10 approver rules
- Context built for decision-making without opening other screens
- Proposed actions with required permissions
- Auto-resolve when condition clears
- Escalation on timeout (48h → supervisor, 96h → project manager)
- Duplicate suppression (configurable window, e.g., 24h)

**Offline Sync Conflict Resolution:**
- **Attendance:**
  - Duplicate across projects → CONFLICT (fraud signal)
  - Same project, out-punch missing → ACCEPT (merge)
  - Already recorded → REJECT
- **Measurement Book:**
  - Already certified → REJECT (create revised MB)
  - Content changed → CONFLICT (merge/discard/new)
  - No changes → ACCEPT
- **DPR:**
  - Already submitted for date → CONFLICT (overwrite/keep)

### Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| AN-01 | BLOCK | Three-tier view stack is strict — dashboards read only consumption views |
| AN-02 | BLOCK | No analytical view bypasses permission filter |
| AN-03 | BLOCK | Long-running work runs as batch job, never in request transaction |
| AN-04 | BLOCK | Every batch job records start, end, outcome, row counts, errors |
| AN-05 | BLOCK | Situation names responsible party and proposed actions |
| AN-06 | BLOCK | Situations closed by human with explanation, never auto-closed by time |

### Performance Budgets

| Operation | Budget |
|-----------|--------|
| WebSocket connect + auth + permission resolve | ≤ 300ms |
| Event → connected client render | ≤ 3s end-to-end |
| `/kpi/batch` with 20 KPIs | ≤ 800ms |
| Consumption view query at 5-year volume | ≤ 300ms |
| Fan-out to 200 recipients | ≤ 2s |
| Replay 500 events | ≤ 2s |
| Offline batch of 50 records | ≤ 5s |

### File Structure

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

### Integration Points

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

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All analytical services compile correctly
- Output: 695KB JS, 59KB CSS

---

## What Part 15 Does NOT Do

- ❌ Does not implement actual SQL views (framework only)
- ❌ Does not implement actual WebSocket transport (uses event bus)
- ❌ Does not implement actual database queries (mock data)
- ❌ Does not implement actual cron scheduler (simplified)
- ❌ Does not implement actual offline storage (sync protocol only)

**Part 15 defines the analytical layer contracts and services. Actual database views and transport happen in later parts.**

---

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
