-- Part 14 — KPI, Alert & SLA Engine Tables
-- 
-- Creates the core monitoring infrastructure:
-- 1. dx_kpi_definition - KPI registry with 10 mandatory governance fields
-- 2. dx_kpi_event_map - Maps events to KPI invalidation
-- 3. dx_kpi_snapshot - Precomputed KPI values for trends and fast loading
-- 4. dx_alert_rule - Alert condition definitions
-- 5. dx_alert - Raised alerts with lifecycle tracking
-- 6. dx_working_calendar - Company/project working hours
-- 7. dx_calendar_holiday - Holiday calendar
-- 8. dx_sla_tracking - SLA tracking for workflow items
--
-- All tables follow additive-only policy with dx_ prefix.

-- ═══════════════════════════════════════════════════════════════════════════
-- KPI DEFINITION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_kpi_definition (
  id                  BIGSERIAL PRIMARY KEY,
  kpi_key             VARCHAR(120) NOT NULL UNIQUE,
  kpi_name            VARCHAR(200) NOT NULL,
  module              VARCHAR(50)  NOT NULL,
  description         TEXT,
  calculation_type    VARCHAR(30)  NOT NULL,  -- SUM|COUNT|AVG|RATIO|VARIANCE|CUSTOM
  value_type          VARCHAR(20)  NOT NULL,  -- CURRENCY|QUANTITY|PERCENT|COUNT|DAYS|RATIO
  unit                VARCHAR(20),
  aggregation_level   VARCHAR(30)  NOT NULL,  -- COMPANY|PROJECT|SITE|PACKAGE|WBS|USER
  source_definition   JSONB        NOT NULL,  -- tables, joins, filters (logical names only)
  target_source       VARCHAR(50),            -- BUDGET|CONTRACT|PLAN|MANUAL|NONE
  good_direction      VARCHAR(10)  NOT NULL,  -- UP|DOWN|TARGET
  threshold_green     NUMERIC(18,4),
  threshold_amber     NUMERIC(18,4),
  threshold_red       NUMERIC(18,4),
  threshold_type      VARCHAR(20)  NOT NULL DEFAULT 'PERCENT_OF_TARGET',
  refresh_strategy    VARCHAR(20)  NOT NULL DEFAULT 'EVENT', -- EVENT|INTERVAL|ON_DEMAND
  refresh_interval_s  INT,
  cache_ttl_s         INT NOT NULL DEFAULT 300,
  required_permission VARCHAR(150) NOT NULL,
  drill_route         VARCHAR(255),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_kpi_module ON dx_kpi_definition (module, is_active);
CREATE INDEX IF NOT EXISTS ix_dx_kpi_refresh ON dx_kpi_definition (refresh_strategy, is_active);

COMMENT ON TABLE dx_kpi_definition IS
  'KPI registry with 10 mandatory governance fields - source, formula, period, scope, permission, refresh, threshold, status logic, drill-down';

COMMENT ON COLUMN dx_kpi_definition.source_definition IS
  'JSON defining tables, joins, filters using logical names from SCHEMA_MAP';

COMMENT ON COLUMN dx_kpi_definition.required_permission IS
  'Permission key required to view this KPI - mandatory, prevents unauthorized access';

-- ═══════════════════════════════════════════════════════════════════════════
-- KPI EVENT MAP
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_kpi_event_map (
  id             BIGSERIAL PRIMARY KEY,
  kpi_id         BIGINT NOT NULL REFERENCES dx_kpi_definition(id) ON DELETE CASCADE,
  event_type     VARCHAR(100) NOT NULL,
  CONSTRAINT uq_dx_kpi_evt UNIQUE (kpi_id, event_type)
);

CREATE INDEX IF NOT EXISTS ix_dx_kpi_evt_type ON dx_kpi_event_map (event_type);

COMMENT ON TABLE dx_kpi_event_map IS
  'Maps event types to KPIs for event-driven invalidation';

-- ═══════════════════════════════════════════════════════════════════════════
-- KPI SNAPSHOT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_kpi_snapshot (
  id             BIGSERIAL PRIMARY KEY,
  kpi_key        VARCHAR(120) NOT NULL,
  company_id     BIGINT,
  project_id     BIGINT,
  site_id        BIGINT,
  period_start   DATE,
  period_end     DATE,
  value          NUMERIC(20,4),
  target_value   NUMERIC(20,4),
  computed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  compute_ms     INT,
  row_count      BIGINT
);

CREATE INDEX IF NOT EXISTS ix_dx_kpi_snap
  ON dx_kpi_snapshot (kpi_key, project_id, computed_at DESC);

COMMENT ON TABLE dx_kpi_snapshot IS
  'Precomputed KPI values for trends and fast loading - refreshed every 15 minutes for heavy KPIs';

-- ═══════════════════════════════════════════════════════════════════════════
-- ALERT RULE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_alert_rule (
  id                  BIGSERIAL PRIMARY KEY,
  rule_code           VARCHAR(60) NOT NULL UNIQUE,
  rule_name           VARCHAR(200) NOT NULL,
  module              VARCHAR(50) NOT NULL,
  trigger_type        VARCHAR(20) NOT NULL,   -- EVENT | THRESHOLD | SCHEDULE
  trigger_event       VARCHAR(100),
  condition_json      JSONB NOT NULL,
  severity            VARCHAR(20) NOT NULL,   -- INFO|LOW|MEDIUM|HIGH|CRITICAL
  message_template    TEXT NOT NULL,
  target_rule         VARCHAR(50) NOT NULL,   -- ROLE|RESPONSIBILITY|OWNER|MANAGER|CUSTOM
  target_config       JSONB,
  project_id          BIGINT,                 -- NULL = applies to all projects
  cooldown_minutes    INT NOT NULL DEFAULT 60,
  auto_clear          BOOLEAN NOT NULL DEFAULT TRUE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_alert_rule_trigger ON dx_alert_rule (trigger_type, is_active);
CREATE INDEX IF NOT EXISTS ix_dx_alert_rule_event ON dx_alert_rule (trigger_event) WHERE trigger_event IS NOT NULL;

COMMENT ON TABLE dx_alert_rule IS
  'Alert condition definitions - 33+ seeded rules covering procurement, materials, finance, quality, safety';

COMMENT ON COLUMN dx_alert_rule.condition_json IS
  'JSON defining the alert condition with field comparisons and thresholds';

COMMENT ON COLUMN dx_alert_rule.target_rule IS
  'How to determine alert recipients: ROLE (by role), RESPONSIBILITY (by project assignment), OWNER (document owner), MANAGER (reports-to chain)';

-- ═══════════════════════════════════════════════════════════════════════════
-- ALERT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_alert (
  id              BIGSERIAL PRIMARY KEY,
  rule_id         BIGINT NOT NULL REFERENCES dx_alert_rule(id),
  severity        VARCHAR(20) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  message         TEXT NOT NULL,
  entity_type     VARCHAR(80),
  entity_id       BIGINT,
  company_id      BIGINT,
  project_id      BIGINT,
  site_id         BIGINT,
  status          VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN|ACKNOWLEDGED|RESOLVED|AUTO_CLEARED
  raised_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_by BIGINT,
  acknowledged_at TIMESTAMPTZ,
  resolved_by     BIGINT,
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,
  occurrence_count INT NOT NULL DEFAULT 1,
  last_occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_alert_open
  ON dx_alert (status, severity, project_id, raised_at DESC);

CREATE INDEX IF NOT EXISTS ix_dx_alert_entity
  ON dx_alert (entity_type, entity_id, raised_at DESC);

COMMENT ON TABLE dx_alert IS
  'Raised alerts with lifecycle tracking - deduplication via occurrence_count, auto-clear when condition resolves';

-- ═══════════════════════════════════════════════════════════════════════════
-- WORKING CALENDAR
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_working_calendar (
  id            BIGSERIAL PRIMARY KEY,
  company_id    BIGINT NOT NULL,
  project_id    BIGINT,                -- NULL = company default
  calendar_name VARCHAR(100) NOT NULL,
  working_days  VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5,6', -- 1=Mon, 7=Sun
  day_start     TIME NOT NULL DEFAULT '09:00',
  day_end       TIME NOT NULL DEFAULT '18:00',
  timezone      VARCHAR(60) NOT NULL DEFAULT 'Asia/Kolkata',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_calendar UNIQUE (company_id, project_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_calendar_company ON dx_working_calendar (company_id, is_active);

COMMENT ON TABLE dx_working_calendar IS
  'Working hours per company/project - SLA counts working hours, not wall-clock hours';

-- ═══════════════════════════════════════════════════════════════════════════
-- CALENDAR HOLIDAY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_calendar_holiday (
  id            BIGSERIAL PRIMARY KEY,
  calendar_id   BIGINT NOT NULL REFERENCES dx_working_calendar(id) ON DELETE CASCADE,
  holiday_date  DATE NOT NULL,
  description   VARCHAR(150),
  CONSTRAINT uq_dx_holiday UNIQUE (calendar_id, holiday_date)
);

CREATE INDEX IF NOT EXISTS ix_dx_holiday_date ON dx_calendar_holiday (holiday_date);

COMMENT ON TABLE dx_calendar_holiday IS
  'Holiday calendar - SLA pauses on holidays';

-- ═══════════════════════════════════════════════════════════════════════════
-- SLA TRACKING
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_sla_tracking (
  id              BIGSERIAL PRIMARY KEY,
  entity_type     VARCHAR(80) NOT NULL,
  entity_id       BIGINT NOT NULL,
  workflow_step   VARCHAR(80),
  assigned_to     BIGINT,
  project_id      BIGINT,
  started_at      TIMESTAMPTZ NOT NULL,
  due_at          TIMESTAMPTZ NOT NULL,
  paused_at       TIMESTAMPTZ,
  total_paused_minutes INT NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  state           VARCHAR(20) NOT NULL DEFAULT 'ON_TRACK', -- ON_TRACK|AT_RISK|OVERDUE|MET|BREACHED
  escalation_level INT NOT NULL DEFAULT 0,
  escalated_to    BIGINT,
  escalated_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_dx_sla_open
  ON dx_sla_tracking (state, due_at) WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_dx_sla_entity
  ON dx_sla_tracking (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS ix_dx_sla_assigned
  ON dx_sla_tracking (assigned_to, state, due_at);

COMMENT ON TABLE dx_sla_tracking IS
  'SLA tracking for workflow items - states: ON_TRACK, AT_RISK (within 25% of due), OVERDUE, MET, BREACHED';

COMMENT ON COLUMN dx_sla_tracking.total_paused_minutes IS
  'Accumulated pause time when document returned for correction - SLA clock stops during pause';
