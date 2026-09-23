-- Part 15 — Analytical View Layer & Batch Framework Tables
-- 
-- Creates the infrastructure for batch job tracking and real-time delivery:
-- 1. dx_job_run - Batch job execution history and monitoring
-- 2. dx_realtime_delivery - Gap recovery tracking for WebSocket clients
--
-- Note: The analytical view layer (vw_dx_b_*, vw_dx_c_*, vw_dx_q_*) would be
-- created as actual SQL views in production. This migration focuses on the
-- tracking tables that support the batch framework and real-time delivery.

-- ═══════════════════════════════════════════════════════════════════════════
-- JOB RUN (Batch Job Execution History)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_job_run (
  id                  BIGSERIAL PRIMARY KEY,
  job_code            VARCHAR(80) NOT NULL,
  started_at          TIMESTAMPTZ NOT NULL,
  finished_at         TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL,  -- RUNNING|SUCCESS|FAILED|TIMEOUT|SKIPPED
  node_id             VARCHAR(60),
  records_processed   INTEGER,
  records_failed      INTEGER,
  duration_ms         INTEGER,
  error               TEXT,
  output              JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_job_run_code ON dx_job_run (job_code, started_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_job_run_status ON dx_job_run (status, started_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_job_run_node ON dx_job_run (node_id, started_at DESC);

COMMENT ON TABLE dx_job_run IS
  'Batch job execution history - tracks all scheduled and on-demand jobs';

COMMENT ON COLUMN dx_job_run.status IS
  'RUNNING: job in progress, SUCCESS: completed successfully, FAILED: error occurred, TIMEOUT: exceeded time limit, SKIPPED: did not run when expected';

COMMENT ON COLUMN dx_job_run.records_processed IS
  'Number of records successfully processed by the job';

COMMENT ON COLUMN dx_job_run.records_failed IS
  'Number of records that failed processing (job may still succeed overall)';

COMMENT ON COLUMN dx_job_run.output IS
  'JSON output from the job - summary statistics, affected IDs, etc.';

-- ═══════════════════════════════════════════════════════════════════════════
-- REALTIME DELIVERY (Gap Recovery Tracking)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_realtime_delivery (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  last_event_id   BIGINT NOT NULL,
  device_class    VARCHAR(20),  -- DESKTOP|TABLET|PHONE
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_rtdel UNIQUE (user_id, device_class)
);

CREATE INDEX IF NOT EXISTS ix_dx_rtdel_user ON dx_realtime_delivery (user_id, updated_at DESC);

COMMENT ON TABLE dx_realtime_delivery IS
  'Tracks last delivered event per user per device for gap recovery on reconnect';

COMMENT ON COLUMN dx_realtime_delivery.last_event_id IS
  'Monotonic event ID from dx_event_outbox - client sends this on reconnect to replay missed events';

COMMENT ON COLUMN dx_realtime_delivery.device_class IS
  'Device type affects coalescing strategy - phones get more aggressive batching to save battery/data';

-- ═══════════════════════════════════════════════════════════════════════════
-- ANALYTICAL VIEW LAYER (Conceptual - would be actual SQL views)
-- ═══════════════════════════════════════════════════════════════════════════

-- The analytical view layer follows a three-tier architecture:
--
-- BASIC TIER (vw_dx_b_*):
--   - 1:1 mapping to physical tables
--   - Renames columns to logical names
--   - No joins, no business logic
--   - Example: vw_dx_b_purchase_order maps tbl_purchase_order columns
--
-- COMPOSITE TIER (vw_dx_c_*):
--   - Joins basic views with extension tables
--   - Adds business semantics (status mapping, derived fields)
--   - Still at row grain (no aggregation)
--   - Example: vw_dx_c_purchase_order joins PO header + extension + GRN totals
--
-- CONSUMPTION TIER (vw_dx_q_*):
--   - Aggregates composite views
--   - Ready for dashboard tiles and reports
--   - Must expose project_id for permission filtering
--   - Example: vw_dx_q_commitment_by_cost_code aggregates PO commitments
--
-- RULE: Every consumption view must expose project_id so Part 08 query filter can scope it.
-- A view without project_id is rejected by schema test.

-- Example consumption view (would be created as actual SQL view):
-- CREATE VIEW vw_dx_q_commitment_by_cost_code AS
-- SELECT project_id, cost_code_id,
--        SUM(open_commitment) AS open_commitment,
--        SUM(total_value) AS total_committed,
--        COUNT(*) FILTER (WHERE status = 'RELEASED') AS open_po_count
--   FROM vw_dx_c_purchase_order
--  WHERE status NOT IN ('CANCELLED','CLOSED','DRAFT')
--  GROUP BY project_id, cost_code_id;

-- ═══════════════════════════════════════════════════════════════════════════
-- MATERIALIZATION POLICY
-- ═══════════════════════════════════════════════════════════════════════════

-- KPIs declare their refresh strategy in dx_kpi_definition:
--
-- LIVE (< 3s):
--   - Query consumption view directly
--   - Must run under 300ms at volume
--   - Used for high-frequency KPIs (stock levels, cash position)
--
-- NEAR_LIVE (< 60s):
--   - Incremental read-model table updated by outbox subscriber
--   - ReadModelUpdater handles event-driven updates
--   - Used for most dashboard KPIs
--
-- PERIODIC (hourly/daily):
--   - Materialized view refreshed by batch job
--   - BatchJobFramework schedules refresh
--   - Used for expensive aggregations (profitability, EVM)
--
-- DAILY (trend data):
--   - dx_kpi_snapshot stores daily grain
--   - Used for trend charts and historical analysis
