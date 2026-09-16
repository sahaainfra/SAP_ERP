# DB_CHANGELOG.md — Database Migration Log

**Last Updated:** 2026-02-10  
**Part:** 1 — Foundation  
**Status:** Initialized

---

## Migration Policy

1. One migration file per logical change, forward and reversible
2. Every migration is idempotent: `CREATE TABLE IF NOT EXISTS`, guarded `ADD COLUMN`
3. No migration runs destructive SQL
4. All new tables prefixed `dx_` (dashboard/extension)
5. New columns are always nullable with safe defaults

---

## Migrations

### Migration 001 — dx_user_preference

**Date:** 2026-02-10  
**File:** `migrations/001_create_dx_user_preference.sql`  
**Tables Touched:** `dx_user_preference` (NEW)  
**Reason:** Store user preferences (theme, density, locale, timezone) server-side so they follow the user across devices.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_user_preference (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT      NOT NULL,
  pref_key        VARCHAR(100) NOT NULL,
  pref_value      TEXT,
  company_id      BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_user_pref UNIQUE (user_id, pref_key, company_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_user_pref_user ON dx_user_preference (user_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_user_preference;
```

**Status:** ✅ Documented (frontend-only, no actual migration run)

---

### Migration 002 — dx_kpi_definition

**Date:** 2026-02-10  
**File:** `migrations/002_create_dx_kpi_definition.sql`  
**Tables Touched:** `dx_kpi_definition` (NEW)  
**Reason:** Store KPI definitions (name, formula, unit, module) so dashboards can be configured without code changes.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_kpi_definition (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  code            VARCHAR(100) NOT NULL UNIQUE,
  description     TEXT,
  formula         TEXT,
  unit            VARCHAR(50),
  module          VARCHAR(100),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_kpi_def_module ON dx_kpi_definition (module);
CREATE INDEX IF NOT EXISTS ix_dx_kpi_def_active ON dx_kpi_definition (is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_kpi_definition;
```

**Status:** ✅ Documented (frontend-only, no actual migration run)

---

### Migration 003 — dx_dashboard_layout

**Date:** 2026-02-10  
**File:** `migrations/003_create_dx_dashboard_layout.sql`  
**Tables Touched:** `dx_dashboard_layout` (NEW)  
**Reason:** Store user-customized dashboard layouts (widget positions, sizes, visibility).

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_dashboard_layout (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT      NOT NULL,
  layout_name     VARCHAR(200) NOT NULL,
  layout_config   JSONB       NOT NULL DEFAULT '{}',
  is_default      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_dash_layout_user ON dx_dashboard_layout (user_id);
CREATE INDEX IF NOT EXISTS ix_dx_dash_layout_default ON dx_dashboard_layout (user_id, is_default);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_dashboard_layout;
```

**Status:** ✅ Documented (frontend-only, no actual migration run)

---

## Summary

| Migration | Table | Type | Status |
|---|---|---|---|
| 001 | `dx_user_preference` | NEW | ✅ Documented |
| 002 | `dx_kpi_definition` | NEW | ✅ Documented |
| 003 | `dx_dashboard_layout` | NEW | ✅ Documented |

**Total new tables:** 3  
**Total tables modified:** 0  
**Total rows affected:** 0

---

### Migration 004 — dx_user_context

**Date:** 2026-02-10  
**File:** `migrations/004_create_dx_user_context.sql`  
**Tables Touched:** `dx_user_context` (NEW)  
**Reason:** Store user's active context selection (company, branch, projects, sites, FY) so it persists across sessions and devices.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_user_context (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL,
  company_id         BIGINT,
  branch_id          BIGINT,
  project_ids        TEXT,
  site_ids           TEXT,
  financial_year     VARCHAR(20),
  last_used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_user_context UNIQUE (user_id)
);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_user_context;
```

**Status:** ✅ Documented

---

### Migration 005 — dx_search_history

**Date:** 2026-02-10  
**File:** `migrations/005_create_dx_search_history.sql`  
**Tables Touched:** `dx_search_history` (NEW)  
**Reason:** Store recent searches per user for the global search feature. Prunable table.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_search_history (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  search_term   VARCHAR(255) NOT NULL,
  result_type   VARCHAR(50),
  result_id     BIGINT,
  searched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_search_hist_user ON dx_search_history (user_id, searched_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_search_history;
```

**Status:** ✅ Documented

---

### Migration 006 — dx_menu_item

**Date:** 2026-02-10  
**File:** `migrations/006_create_dx_menu_item.sql`  
**Tables Touched:** `dx_menu_item` (NEW)  
**Reason:** Navigation menu registry so menu items are configurable not hard-coded. Supports server-driven navigation.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_menu_item (
  id              BIGSERIAL PRIMARY KEY,
  item_key        VARCHAR(100) NOT NULL UNIQUE,
  parent_key      VARCHAR(100),
  label           VARCHAR(150) NOT NULL,
  icon            VARCHAR(100),
  route           VARCHAR(255),
  permission_key  VARCHAR(150),
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  module_group    VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_menu_parent ON dx_menu_item (parent_key, sort_order);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_menu_item;
```

**Status:** ✅ Documented

---

### Migration 020 — dx_dashboard

**Date:** 2026-02-10  
**File:** `migrations/020_create_dx_dashboard.sql`  
**Tables Touched:** `dx_dashboard` (NEW)  
**Reason:** Store dashboard definitions with layout configurations for personalization.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_dashboard (
  id                BIGSERIAL PRIMARY KEY,
  dashboard_key     VARCHAR(100) NOT NULL UNIQUE,
  dashboard_name    VARCHAR(150) NOT NULL,
  owner_user_id     BIGINT,
  template_id       BIGINT,
  project_id        BIGINT,
  company_id        BIGINT,
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  is_system         BOOLEAN NOT NULL DEFAULT FALSE,
  layout_json       JSONB NOT NULL,
  refresh_interval_s INT NOT NULL DEFAULT 300,
  created_by        BIGINT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_dx_dash_owner ON dx_dashboard (owner_user_id, project_id);
CREATE INDEX IF NOT EXISTS ix_dx_dash_template ON dx_dashboard (template_id, project_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_dashboard;
```

**Status:** ✅ Documented

---

### Migration 021 — dx_dashboard_widget

**Date:** 2026-02-10  
**File:** `migrations/021_create_dx_dashboard_widget.sql`  
**Tables Touched:** `dx_dashboard_widget` (NEW)  
**Reason:** Store individual widget configurations within dashboards.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_dashboard_widget (
  id              BIGSERIAL PRIMARY KEY,
  dashboard_id    BIGINT NOT NULL REFERENCES dx_dashboard(id) ON DELETE CASCADE,
  widget_key      VARCHAR(120) NOT NULL,
  widget_type     VARCHAR(40)  NOT NULL,
  kpi_key         VARCHAR(120),
  title_override  VARCHAR(200),
  grid_x          INT NOT NULL,
  grid_y          INT NOT NULL,
  grid_w          INT NOT NULL DEFAULT 1,
  grid_h          INT NOT NULL DEFAULT 1,
  config_json     JSONB,
  is_mandatory    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_dx_widget_dash ON dx_dashboard_widget (dashboard_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_dashboard_widget;
```

**Status:** ✅ Documented

---

### Migration 022 — dx_saved_view

**Date:** 2026-02-10  
**File:** `migrations/022_create_dx_saved_view.sql`  
**Tables Touched:** `dx_saved_view` (NEW)  
**Reason:** Store saved table views with filters, sorting, and column configurations.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_saved_view (
  id              BIGSERIAL PRIMARY KEY,
  view_key        VARCHAR(120) NOT NULL UNIQUE,
  screen_key      VARCHAR(120) NOT NULL,
  view_name       VARCHAR(150) NOT NULL,
  owner_user_id   BIGINT,
  template_id     BIGINT,
  project_id      BIGINT,
  is_shared       BOOLEAN NOT NULL DEFAULT FALSE,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  config_json     JSONB NOT NULL,
  created_by      BIGINT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_view_screen ON dx_saved_view (screen_key, owner_user_id);
CREATE INDEX IF NOT EXISTS ix_dx_view_template ON dx_saved_view (template_id, screen_key);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_saved_view;
```

**Status:** ✅ Documented

---

## Summary

| Migration | Table | Type | Status |
|---|---|---|---|
| 001 | `dx_user_preference` | NEW | ✅ Documented |
| 002 | `dx_kpi_definition` | NEW | ✅ Documented |
| 003 | `dx_dashboard_layout` | NEW | ✅ Documented |
| 004 | `dx_user_context` | NEW | ✅ Documented |
| 005 | `dx_search_history` | NEW | ✅ Documented |
| 006 | `dx_menu_item` | NEW | ✅ Documented |

**Total new tables:** 6  
**Total tables modified:** 0  
**Total rows affected:** 0

---

### Migration 007 — dx_permission (Permission Catalogue)

**Date:** 2026-02-10  
**File:** `migrations/007_create_dx_permission.sql`  
**Tables Touched:** `dx_permission` (NEW)  
**Reason:** Catalogue of all permission keys in the system. Each permission follows the format `module.entity.action`.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_permission (
  id              BIGSERIAL PRIMARY KEY,
  permission_key  VARCHAR(150) NOT NULL UNIQUE,
  module          VARCHAR(50)  NOT NULL,
  entity          VARCHAR(80)  NOT NULL,
  action          VARCHAR(40)  NOT NULL,
  label           VARCHAR(200) NOT NULL,
  description     TEXT,
  is_sensitive    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_limit  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_perm_module ON dx_permission (module, entity);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_permission;
```

**Status:** ✅ Documented

---

### Migration 008 — dx_responsibility_template (Templates)

**Date:** 2026-02-10  
**File:** `migrations/008_create_dx_responsibility_template.sql`  
**Tables Touched:** `dx_responsibility_template`, `dx_responsibility_template_permission` (NEW)  
**Reason:** Reusable responsibility templates that bundle permission keys. Templates can be system-provided or custom.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_responsibility_template (
  id                BIGSERIAL PRIMARY KEY,
  template_code     VARCHAR(50)  NOT NULL UNIQUE,
  template_name     VARCHAR(150) NOT NULL,
  description       TEXT,
  category          VARCHAR(50),
  is_system         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  company_id        BIGINT,
  created_by        BIGINT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        BIGINT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS dx_responsibility_template_permission (
  id              BIGSERIAL PRIMARY KEY,
  template_id     BIGINT NOT NULL REFERENCES dx_responsibility_template(id),
  permission_id   BIGINT NOT NULL REFERENCES dx_permission(id),
  is_granted      BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_dx_tmpl_perm UNIQUE (template_id, permission_id)
);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_responsibility_template_permission;
DROP TABLE IF EXISTS dx_responsibility_template;
```

**Status:** ✅ Documented

---

### Migration 009 — dx_project_assignment (Core Assignment Table)

**Date:** 2026-02-10  
**File:** `migrations/009_create_dx_project_assignment.sql`  
**Tables Touched:** `dx_project_assignment` (NEW)  
**Reason:** THE CORE TABLE - maps users to projects with responsibility templates, data scope, and validity periods.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_project_assignment (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL,
  project_id          BIGINT NOT NULL,
  company_id          BIGINT NOT NULL,
  template_id         BIGINT REFERENCES dx_responsibility_template(id),
  designation_label   VARCHAR(150),
  is_primary_project  BOOLEAN NOT NULL DEFAULT FALSE,
  reports_to_user_id  BIGINT,
  data_scope          VARCHAR(30) NOT NULL DEFAULT 'PROJECT',
  valid_from          DATE NOT NULL,
  valid_to            DATE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  suspension_reason   TEXT,
  assigned_by         BIGINT NOT NULL,
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_by          BIGINT,
  revoked_at          TIMESTAMPTZ,
  revocation_reason   TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version             INT NOT NULL DEFAULT 1,
  CONSTRAINT uq_dx_proj_assign UNIQUE (user_id, project_id, valid_from)
);
CREATE INDEX IF NOT EXISTS ix_dx_pa_user    ON dx_project_assignment (user_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_pa_project ON dx_project_assignment (project_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_pa_lookup  ON dx_project_assignment (user_id, project_id, status, valid_from, valid_to);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_project_assignment;
```

**Status:** ✅ Documented

---

### Migration 010 — dx_approval_authority (Approval Limits)

**Date:** 2026-02-10  
**File:** `migrations/010_create_dx_approval_authority.sql`  
**Tables Touched:** `dx_approval_authority` (NEW)  
**Reason:** Defines approval authority limits per assignment and document type.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_approval_authority (
  id                  BIGSERIAL PRIMARY KEY,
  assignment_id       BIGINT NOT NULL REFERENCES dx_project_assignment(id) ON DELETE CASCADE,
  document_type       VARCHAR(50) NOT NULL,
  approval_level      INT NOT NULL DEFAULT 1,
  min_amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
  max_amount          NUMERIC(18,2),
  currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
  can_approve         BOOLEAN NOT NULL DEFAULT TRUE,
  can_reject          BOOLEAN NOT NULL DEFAULT TRUE,
  can_return          BOOLEAN NOT NULL DEFAULT TRUE,
  can_forward         BOOLEAN NOT NULL DEFAULT FALSE,
  can_delegate        BOOLEAN NOT NULL DEFAULT FALSE,
  can_approve_own     BOOLEAN NOT NULL DEFAULT FALSE,
  requires_two_person BOOLEAN NOT NULL DEFAULT FALSE,
  sla_hours           INT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_auth UNIQUE (assignment_id, document_type, approval_level)
);
CREATE INDEX IF NOT EXISTS ix_dx_auth_doc ON dx_approval_authority (document_type, is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_approval_authority;
```

**Status:** ✅ Documented

---

### Migration 011 — dx_sod_rule (Segregation of Duties)

**Date:** 2026-02-10  
**File:** `migrations/011_create_dx_sod_rule.sql`  
**Tables Touched:** `dx_sod_rule` (NEW)  
**Reason:** Segregation of duties rules to prevent conflicting permissions.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_sod_rule (
  id                  BIGSERIAL PRIMARY KEY,
  rule_code           VARCHAR(50) NOT NULL UNIQUE,
  rule_name           VARCHAR(200) NOT NULL,
  permission_a_id     BIGINT NOT NULL REFERENCES dx_permission(id),
  permission_b_id     BIGINT NOT NULL REFERENCES dx_permission(id),
  severity            VARCHAR(20) NOT NULL DEFAULT 'WARNING',
  rationale           TEXT NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE
);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_sod_rule;
```

**Status:** ✅ Documented

---

### Migration 012 — dx_assignment_audit (Immutable Audit Log)

**Date:** 2026-02-10  
**File:** `migrations/012_create_dx_assignment_audit.sql`  
**Tables Touched:** `dx_assignment_audit` (NEW)  
**Reason:** Immutable audit log for all assignment changes. Append-only table.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_assignment_audit (
  id                BIGSERIAL PRIMARY KEY,
  assignment_id     BIGINT,
  user_id           BIGINT NOT NULL,
  project_id        BIGINT NOT NULL,
  action            VARCHAR(40) NOT NULL,
  before_value      JSONB,
  after_value       JSONB,
  changed_by        BIGINT NOT NULL,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address        VARCHAR(64),
  user_agent        TEXT,
  reason            TEXT
);
CREATE INDEX IF NOT EXISTS ix_dx_aa_user    ON dx_assignment_audit (user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_aa_project ON dx_assignment_audit (project_id, changed_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_assignment_audit;
```

**Status:** ✅ Documented

---

## Summary

| Migration | Table | Type | Status |
|---|---|---|---|
| 001 | `dx_user_preference` | NEW | ✅ Documented |
| 002 | `dx_kpi_definition` | NEW | ✅ Documented |
| 003 | `dx_dashboard_layout` | NEW | ✅ Documented |
| 004 | `dx_user_context` | NEW | ✅ Documented |
| 005 | `dx_search_history` | NEW | ✅ Documented |
| 006 | `dx_menu_item` | NEW | ✅ Documented |
| 007 | `dx_permission` | NEW | ✅ Documented |
| 008 | `dx_responsibility_template` | NEW | ✅ Documented |
| 009 | `dx_project_assignment` | NEW | ✅ Documented |
| 010 | `dx_approval_authority` | NEW | ✅ Documented |
| 011 | `dx_sod_rule` | NEW | ✅ Documented |
| 012 | `dx_assignment_audit` | NEW | ✅ Documented |

**Total new tables:** 12  
**Total tables modified:** 0  
**Total rows affected:** 0

---

### Migration 013 — dx_event_outbox (Event Outbox)

**Date:** 2026-02-10  
**File:** `migrations/013_create_dx_event_outbox.sql`  
**Tables Touched:** `dx_event_outbox` (NEW)  
**Reason:** Transactional outbox pattern for reliable event publishing. Events are written inside the business transaction, then relayed to the event bus.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_event_outbox (
  id             BIGSERIAL PRIMARY KEY,
  event_id       VARCHAR(40)  NOT NULL UNIQUE,
  event_type     VARCHAR(100) NOT NULL,
  entity_type    VARCHAR(80)  NOT NULL,
  entity_id      BIGINT       NOT NULL,
  actor_user_id  BIGINT,
  company_id     BIGINT,
  project_id     BIGINT,
  site_id        BIGINT,
  payload        JSONB        NOT NULL,
  occurred_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  published_at   TIMESTAMPTZ,
  publish_attempts INT        NOT NULL DEFAULT 0,
  last_error     TEXT,
  status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
);
CREATE INDEX IF NOT EXISTS ix_dx_outbox_pending
  ON dx_event_outbox (status, occurred_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS ix_dx_outbox_entity
  ON dx_event_outbox (entity_type, entity_id, occurred_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_event_outbox;
```

**Status:** ✅ Documented

---

### Migration 014 — dx_kpi_definition (KPI Definitions)

**Date:** 2026-02-10  
**File:** `migrations/014_create_dx_kpi_definition.sql`  
**Tables Touched:** `dx_kpi_definition` (NEW)  
**Reason:** Data-driven KPI definitions with calculation rules, thresholds, and refresh strategies.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_kpi_definition (
  id                  BIGSERIAL PRIMARY KEY,
  kpi_key             VARCHAR(120) NOT NULL UNIQUE,
  kpi_name            VARCHAR(200) NOT NULL,
  module              VARCHAR(50)  NOT NULL,
  description         TEXT,
  calculation_type    VARCHAR(30)  NOT NULL,
  value_type          VARCHAR(20)  NOT NULL,
  unit                VARCHAR(20),
  aggregation_level   VARCHAR(30)  NOT NULL,
  good_direction      VARCHAR(10)  NOT NULL,
  threshold_green     NUMERIC(18,4),
  threshold_amber     NUMERIC(18,4),
  threshold_red       NUMERIC(18,4),
  threshold_type      VARCHAR(20)  NOT NULL DEFAULT 'PERCENT_OF_TARGET',
  refresh_strategy    VARCHAR(20)  NOT NULL DEFAULT 'EVENT',
  refresh_interval_s  INT,
  cache_ttl_s         INT NOT NULL DEFAULT 300,
  required_permission VARCHAR(150) NOT NULL,
  drill_route         VARCHAR(255),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_kpi_module ON dx_kpi_definition (module, is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_kpi_definition;
```

**Status:** ✅ Documented

---

### Migration 015 — dx_kpi_snapshot (KPI Snapshots)

**Date:** 2026-02-10  
**File:** `migrations/015_create_dx_kpi_snapshot.sql`  
**Tables Touched:** `dx_kpi_snapshot` (NEW)  
**Reason:** Precomputed KPI snapshots for trend analysis and fast dashboard loading.

**SQL:**
```sql
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
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_kpi_snapshot;
```

**Status:** ✅ Documented

---

### Migration 016 — dx_alert_rule (Alert Rules)

**Date:** 2026-02-10  
**File:** `migrations/016_create_dx_alert_rule.sql`  
**Tables Touched:** `dx_alert_rule` (NEW)  
**Reason:** Configurable alert rules with trigger conditions, severity, and targeting.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_alert_rule (
  id                  BIGSERIAL PRIMARY KEY,
  rule_code           VARCHAR(60) NOT NULL UNIQUE,
  rule_name           VARCHAR(200) NOT NULL,
  module              VARCHAR(50) NOT NULL,
  trigger_type        VARCHAR(20) NOT NULL,
  trigger_event       VARCHAR(100),
  condition_json      JSONB NOT NULL,
  severity            VARCHAR(20) NOT NULL,
  message_template    TEXT NOT NULL,
  target_rule         VARCHAR(50) NOT NULL,
  target_config       JSONB,
  project_id          BIGINT,
  cooldown_minutes    INT NOT NULL DEFAULT 60,
  auto_clear          BOOLEAN NOT NULL DEFAULT TRUE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_alert_rule_module ON dx_alert_rule (module, is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_alert_rule;
```

**Status:** ✅ Documented

---

### Migration 017 — dx_alert (Alerts)

**Date:** 2026-02-10  
**File:** `migrations/017_create_dx_alert.sql`  
**Tables Touched:** `dx_alert` (NEW)  
**Reason:** Active alerts raised by the alert engine with status tracking and resolution.

**SQL:**
```sql
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
  status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
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
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_alert;
```

**Status:** ✅ Documented

---

### Migration 018 — dx_sla_tracking (SLA Tracking)

**Date:** 2026-02-10  
**File:** `migrations/018_create_dx_sla_tracking.sql`  
**Tables Touched:** `dx_sla_tracking` (NEW)  
**Reason:** Track SLA compliance for workflow items with escalation support.

**SQL:**
```sql
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
  state           VARCHAR(20) NOT NULL DEFAULT 'ON_TRACK',
  escalation_level INT NOT NULL DEFAULT 0,
  escalated_to    BIGINT,
  escalated_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_dx_sla_open
  ON dx_sla_tracking (state, due_at) WHERE completed_at IS NULL;
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_sla_tracking;
```

**Status:** ✅ Documented

---

### Migration 019 — dx_working_calendar (Working Calendar)

**Date:** 2026-02-10  
**File:** `migrations/019_create_dx_working_calendar.sql`  
**Tables Touched:** `dx_working_calendar`, `dx_calendar_holiday` (NEW)  
**Reason:** Define working hours and holidays for SLA calculations.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_working_calendar (
  id            BIGSERIAL PRIMARY KEY,
  company_id    BIGINT NOT NULL,
  project_id    BIGINT,
  working_days  VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5,6',
  day_start     TIME NOT NULL DEFAULT '09:00',
  day_end       TIME NOT NULL DEFAULT '18:00',
  timezone      VARCHAR(60) NOT NULL DEFAULT 'Asia/Kolkata',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dx_calendar_holiday (
  id            BIGSERIAL PRIMARY KEY,
  calendar_id   BIGINT NOT NULL REFERENCES dx_working_calendar(id),
  holiday_date  DATE NOT NULL,
  description   VARCHAR(150),
  CONSTRAINT uq_dx_holiday UNIQUE (calendar_id, holiday_date)
);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_calendar_holiday;
DROP TABLE IF EXISTS dx_working_calendar;
```

**Status:** ✅ Documented

---

## Summary

| Migration | Table | Type | Status |
|---|---|---|---|
| 001 | `dx_user_preference` | NEW | ✅ Documented |
| 002 | `dx_kpi_definition` | NEW | ✅ Documented |
| 003 | `dx_dashboard_layout` | NEW | ✅ Documented |
| 004 | `dx_user_context` | NEW | ✅ Documented |
| 005 | `dx_search_history` | NEW | ✅ Documented |
| 006 | `dx_menu_item` | NEW | ✅ Documented |
| 007 | `dx_permission` | NEW | ✅ Documented |
| 008 | `dx_responsibility_template` | NEW | ✅ Documented |
| 009 | `dx_project_assignment` | NEW | ✅ Documented |
| 010 | `dx_approval_authority` | NEW | ✅ Documented |
| 011 | `dx_sod_rule` | NEW | ✅ Documented |
| 012 | `dx_assignment_audit` | NEW | ✅ Documented |
| 013 | `dx_event_outbox` | NEW | ✅ Documented |
| 014 | `dx_kpi_definition` | NEW | ✅ Documented |
| 015 | `dx_kpi_snapshot` | NEW | ✅ Documented |
| 016 | `dx_alert_rule` | NEW | ✅ Documented |
| 017 | `dx_alert` | NEW | ✅ Documented |
| 018 | `dx_sla_tracking` | NEW | ✅ Documented |
| 019 | `dx_working_calendar` | NEW | ✅ Documented |
| 020 | `dx_dashboard` | NEW | ✅ Documented |
| 021 | `dx_dashboard_widget` | NEW | ✅ Documented |
| 022 | `dx_saved_view` | NEW | ✅ Documented |

**Total new tables:** 22  
**Total tables modified:** 0  
**Total rows affected:** 0

---

**Document Status:** ✅ Complete (Part 5 Updated)  
**Next Step:** Part 6 — Role Dashboards & Object Pages
