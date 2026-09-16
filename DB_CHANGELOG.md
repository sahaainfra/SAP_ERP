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

### Migration 023 — dx_dashboard_role_default

**Date:** 2026-02-10  
**File:** `migrations/023_create_dx_dashboard_role_default.sql`  
**Tables Touched:** `dx_dashboard_role_default` (NEW)  
**Reason:** Store default dashboard configurations for each role, allowing admins to define what each role sees by default.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_dashboard_role_default (
  id              BIGSERIAL PRIMARY KEY,
  role_key        VARCHAR(100) NOT NULL,
  dashboard_id    BIGINT NOT NULL REFERENCES dx_dashboard(id),
  company_id      BIGINT,
  project_id      BIGINT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_role_default UNIQUE (role_key, company_id, project_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_role_default_role ON dx_dashboard_role_default (role_key);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_dashboard_role_default;
```

**Status:** ✅ Documented

---

### Migration 024 — dx_health_score_config

**Date:** 2026-02-10  
**File:** `migrations/024_create_dx_health_score_config.sql`  
**Tables Touched:** `dx_health_score_config` (NEW)  
**Reason:** Store health score component weights and thresholds, allowing admins to customize how project health is calculated.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_health_score_config (
  id              BIGSERIAL PRIMARY KEY,
  company_id      BIGINT,
  project_id      BIGINT,
  component_name  VARCHAR(100) NOT NULL,
  weight          NUMERIC(5,2) NOT NULL DEFAULT 0,
  threshold_good  NUMERIC(5,2) NOT NULL DEFAULT 80,
  threshold_warn  NUMERIC(5,2) NOT NULL DEFAULT 60,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_health_config UNIQUE (company_id, project_id, component_name)
);

CREATE INDEX IF NOT EXISTS ix_dx_health_config_project ON dx_health_score_config (project_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_health_score_config;
```

**Status:** ✅ Documented

---

### Migration 025 — dx_health_score_history

**Date:** 2026-02-10  
**File:** `migrations/025_create_dx_health_score_history.sql`  
**Tables Touched:** `dx_health_score_history` (NEW)  
**Reason:** Store historical health score data for trend analysis and reporting.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_health_score_history (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL,
  score_date      DATE NOT NULL,
  overall_score   NUMERIC(5,2) NOT NULL,
  band            VARCHAR(20) NOT NULL,
  component_scores JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_health_history UNIQUE (project_id, score_date)
);

CREATE INDEX IF NOT EXISTS ix_dx_health_history_project ON dx_health_score_history (project_id, score_date DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_health_score_history;
```

**Status:** ✅ Documented

---

### Migration 026 — dx_object_page_config

**Date:** 2026-02-10  
**File:** `migrations/026_create_dx_object_page_config.sql`  
**Tables Touched:** `dx_object_page_config` (NEW)  
**Reason:** Store object page layout configurations, defining which sections are visible and their order for each object type.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_object_page_config (
  id              BIGSERIAL PRIMARY KEY,
  object_type     VARCHAR(100) NOT NULL,
  section_key     VARCHAR(100) NOT NULL,
  section_order   INT NOT NULL DEFAULT 0,
  is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
  required_permission VARCHAR(150),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_object_page_config UNIQUE (object_type, section_key)
);

CREATE INDEX IF NOT EXISTS ix_dx_object_page_type ON dx_object_page_config (object_type);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_object_page_config;
```

**Status:** ✅ Documented

---

### Migration 027 — dx_document_chain

**Date:** 2026-02-10  
**File:** `migrations/027_create_dx_document_chain.sql`  
**Tables Touched:** `dx_document_chain` (NEW)  
**Reason:** Store document chain relationships, enabling drill-down navigation between related documents (e.g., MR → PR → PO → GRN).

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_document_chain (
  id              BIGSERIAL PRIMARY KEY,
  source_type     VARCHAR(100) NOT NULL,
  source_id       BIGINT NOT NULL,
  target_type     VARCHAR(100) NOT NULL,
  target_id       BIGINT NOT NULL,
  relationship    VARCHAR(50) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_doc_chain UNIQUE (source_type, source_id, target_type, target_id, relationship)
);

CREATE INDEX IF NOT EXISTS ix_dx_doc_chain_source ON dx_document_chain (source_type, source_id);
CREATE INDEX IF NOT EXISTS ix_dx_doc_chain_target ON dx_document_chain (target_type, target_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_document_chain;
```

**Status:** ✅ Documented

---

### Migration 028 — dx_task (Tasks)

**Date:** 2026-02-10  
**File:** `migrations/028_create_dx_task.sql`  
**Tables Touched:** `dx_task` (NEW)  
**Reason:** Task management with multiple sources (manual, system, workflow, alert, recurring, checklist).

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_task (
  id                BIGSERIAL PRIMARY KEY,
  task_number       VARCHAR(40) NOT NULL UNIQUE,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  task_type         VARCHAR(40) NOT NULL,
  source_entity     VARCHAR(80),
  source_id         BIGINT,
  company_id        BIGINT,
  project_id        BIGINT,
  site_id           BIGINT,
  assigned_to       BIGINT,
  assigned_by       BIGINT,
  assigned_at       TIMESTAMPTZ,
  due_at            TIMESTAMPTZ,
  priority          VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  status            VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  progress_percent  INT NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ,
  completed_by      BIGINT,
  completion_note   TEXT,
  blocked_reason    TEXT,
  parent_task_id    BIGINT REFERENCES dx_task(id),
  recurrence_rule   VARCHAR(100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_task_assignee ON dx_task (assigned_to, status, due_at);
CREATE INDEX IF NOT EXISTS ix_dx_task_project  ON dx_task (project_id, status);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_task;
```

**Status:** ✅ Documented

---

### Migration 029 — dx_task_comment (Task Comments)

**Date:** 2026-02-10  
**File:** `migrations/029_create_dx_task_comment.sql`  
**Tables Touched:** `dx_task_comment` (NEW)  
**Reason:** Task comments and discussions.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_task_comment (
  id          BIGSERIAL PRIMARY KEY,
  task_id     BIGINT NOT NULL REFERENCES dx_task(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL,
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_task_comment_task ON dx_task_comment (task_id, created_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_task_comment;
```

**Status:** ✅ Documented

---

### Migration 030 — dx_notification (Notifications)

**Date:** 2026-02-10  
**File:** `migrations/030_create_dx_notification.sql`  
**Tables Touched:** `dx_notification` (NEW)  
**Reason:** Multi-channel notification system with grouping and deduplication.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_notification (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  category        VARCHAR(50) NOT NULL,
  priority        VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  title           VARCHAR(255) NOT NULL,
  body            TEXT,
  entity_type     VARCHAR(80),
  entity_id       BIGINT,
  action_route    VARCHAR(255),
  project_id      BIGINT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  is_actioned     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  group_key       VARCHAR(120)
);
CREATE INDEX IF NOT EXISTS ix_dx_notif_user ON dx_notification (user_id, is_read, created_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_notification;
```

**Status:** ✅ Documented

---

### Migration 031 — dx_notification_delivery (Notification Delivery Tracking)

**Date:** 2026-02-10  
**File:** `migrations/031_create_dx_notification_delivery.sql`  
**Tables Touched:** `dx_notification_delivery` (NEW)  
**Reason:** Track delivery status across multiple channels (in-app, push, email, SMS).

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_notification_delivery (
  id              BIGSERIAL PRIMARY KEY,
  notification_id BIGINT NOT NULL REFERENCES dx_notification(id) ON DELETE CASCADE,
  channel         VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  attempts        INT NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ,
  error           TEXT
);
CREATE INDEX IF NOT EXISTS ix_dx_notif_delivery_notif ON dx_notification_delivery (notification_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_notification_delivery;
```

**Status:** ✅ Documented

---

### Migration 032 — dx_notification_preference (Notification Preferences)

**Date:** 2026-02-10  
**File:** `migrations/032_create_dx_notification_preference.sql`  
**Tables Touched:** `dx_notification_preference` (NEW)  
**Reason:** User preferences for notification channels and frequency per category.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_notification_preference (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  category        VARCHAR(50) NOT NULL,
  in_app          BOOLEAN NOT NULL DEFAULT TRUE,
  push            BOOLEAN NOT NULL DEFAULT TRUE,
  email           BOOLEAN NOT NULL DEFAULT FALSE,
  sms             BOOLEAN NOT NULL DEFAULT FALSE,
  frequency       VARCHAR(20) NOT NULL DEFAULT 'IMMEDIATE',
  quiet_start     TIME,
  quiet_end       TIME,
  CONSTRAINT uq_dx_notif_pref UNIQUE (user_id, category)
);
CREATE INDEX IF NOT EXISTS ix_dx_notif_pref_user ON dx_notification_preference (user_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_notification_preference;
```

**Status:** ✅ Documented

---

### Migration 033 — dx_notification_template (Notification Templates)

**Date:** 2026-02-10  
**File:** `migrations/033_create_dx_notification_template.sql`  
**Tables Touched:** `dx_notification_template` (NEW)  
**Reason:** Template-driven notification content with variable substitution.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_notification_template (
  id              BIGSERIAL PRIMARY KEY,
  category        VARCHAR(50) NOT NULL,
  channel         VARCHAR(20) NOT NULL,
  subject         VARCHAR(255),
  body            TEXT NOT NULL,
  variables       JSONB NOT NULL DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_notif_template UNIQUE (category, channel)
);
CREATE INDEX IF NOT EXISTS ix_dx_notif_template_category ON dx_notification_template (category, is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_notification_template;
```

**Status:** ✅ Documented

---

### Migration 034 — dx_exception (Exceptions)

**Date:** 2026-02-10  
**File:** `migrations/034_create_dx_exception.sql`  
**Tables Touched:** `dx_exception` (NEW)  
**Reason:** Management view of all exceptions (financial, operational, compliance, process).

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_exception (
  id                        BIGSERIAL PRIMARY KEY,
  category                  VARCHAR(50) NOT NULL,
  type                      VARCHAR(100) NOT NULL,
  title                     VARCHAR(255) NOT NULL,
  description               TEXT,
  impact                    NUMERIC(18,2),
  impact_unit               VARCHAR(20),
  entity_type               VARCHAR(80),
  entity_id                 BIGINT,
  entity_number             VARCHAR(100),
  project_id                BIGINT,
  owner_id                  BIGINT,
  raised_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                    VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  target_resolution_date    TIMESTAMPTZ,
  resolution_note           TEXT,
  acceptance_justification  TEXT,
  acceptance_expiry         TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_exception_category ON dx_exception (category, status);
CREATE INDEX IF NOT EXISTS ix_dx_exception_project ON dx_exception (project_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_exception_owner ON dx_exception (owner_id, status);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_exception;
```

**Status:** ✅ Documented

---

### Migration 035 — dx_out_of_office (Out of Office)

**Date:** 2026-02-10  
**File:** `migrations/035_create_dx_out_of_office.sql`  
**Tables Touched:** `dx_out_of_office` (NEW)  
**Reason:** Out-of-office settings with substitute approver assignment.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_out_of_office (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  substitute_id   BIGINT NOT NULL,
  reason          TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_ooo_user_dates UNIQUE (user_id, start_date, end_date)
);
CREATE INDEX IF NOT EXISTS ix_dx_ooo_user ON dx_out_of_office (user_id, is_active);
CREATE INDEX IF NOT EXISTS ix_dx_ooo_substitute ON dx_out_of_office (substitute_id, is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_out_of_office;
```

**Status:** ✅ Documented

---

### Migration 036 — dx_evm_baseline (EVM Baselines)

**Date:** 2026-02-10  
**File:** `migrations/036_create_dx_evm_baseline.sql`  
**Tables Touched:** `dx_evm_baseline` (NEW)  
**Reason:** Store project baselines for Earned Value Management calculations.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_evm_baseline (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL,
  baseline_date   DATE NOT NULL,
  bac             NUMERIC(18,2) NOT NULL,
  planned_schedule JSONB NOT NULL,
  planned_cost_distribution JSONB NOT NULL,
  created_by      BIGINT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_dx_evm_baseline UNIQUE (project_id, baseline_date)
);
CREATE INDEX IF NOT EXISTS ix_dx_evm_baseline_project ON dx_evm_baseline (project_id, is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_evm_baseline;
```

**Status:** ✅ Documented

---

### Migration 037 — dx_evm_snapshot (EVM Snapshots)

**Date:** 2026-02-10  
**File:** `migrations/037_create_dx_evm_snapshot.sql`  
**Tables Touched:** `dx_evm_snapshot` (NEW)  
**Reason:** Store periodic EVM calculations for trend analysis.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_evm_snapshot (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL,
  snapshot_date   DATE NOT NULL,
  pv              NUMERIC(18,2) NOT NULL,
  ev              NUMERIC(18,2) NOT NULL,
  ac              NUMERIC(18,2) NOT NULL,
  sv              NUMERIC(18,2) NOT NULL,
  cv              NUMERIC(18,2) NOT NULL,
  spi             NUMERIC(10,4) NOT NULL,
  cpi             NUMERIC(10,4) NOT NULL,
  eac             NUMERIC(18,2) NOT NULL,
  etc             NUMERIC(18,2) NOT NULL,
  vac             NUMERIC(18,2) NOT NULL,
  tcpi            NUMERIC(10,4) NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_evm_snapshot UNIQUE (project_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS ix_dx_evm_snapshot_project ON dx_evm_snapshot (project_id, snapshot_date DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_evm_snapshot;
```

**Status:** ✅ Documented

---

### Migration 038 — dx_forecast (Forecasts)

**Date:** 2026-02-10  
**File:** `migrations/038_create_dx_forecast.sql`  
**Tables Touched:** `dx_forecast` (NEW)  
**Reason:** Store forecasts with methods, inputs, and confidence levels.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_forecast (
  id              BIGSERIAL PRIMARY KEY,
  type            VARCHAR(50) NOT NULL,
  scope_id        BIGINT NOT NULL,
  scope_type      VARCHAR(20) NOT NULL,
  method_name     VARCHAR(200) NOT NULL,
  method_description TEXT,
  inputs          JSONB NOT NULL,
  point_estimate  NUMERIC(18,4) NOT NULL,
  range_low       NUMERIC(18,4),
  range_high      NUMERIC(18,4),
  confidence      VARCHAR(20) NOT NULL,
  confidence_reason TEXT,
  horizon         VARCHAR(100),
  unit            VARCHAR(50),
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_forecast_scope ON dx_forecast (scope_type, scope_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_forecast_type ON dx_forecast (type, computed_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_forecast;
```

**Status:** ✅ Documented

---

### Migration 039 — dx_forecast_accuracy (Forecast Backtesting)

**Date:** 2026-02-10  
**File:** `migrations/039_create_dx_forecast_accuracy.sql`  
**Tables Touched:** `dx_forecast_accuracy` (NEW)  
**Reason:** Track forecast accuracy for backtesting and improvement.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_forecast_accuracy (
  id              BIGSERIAL PRIMARY KEY,
  forecast_id     BIGINT NOT NULL REFERENCES dx_forecast(id),
  forecast_date   DATE NOT NULL,
  actual_date     DATE,
  forecast_value  NUMERIC(18,4) NOT NULL,
  actual_value    NUMERIC(18,4),
  variance        NUMERIC(18,4),
  variance_percent NUMERIC(10,4),
  accuracy        NUMERIC(10,4),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_forecast_accuracy_forecast ON dx_forecast_accuracy (forecast_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_forecast_accuracy;
```

**Status:** ✅ Documented

---

### Migration 040 — dx_insight (Cross-Module Insights)

**Date:** 2026-02-10  
**File:** `migrations/040_create_dx_insight.sql`  
**Tables Touched:** `dx_insight` (NEW)  
**Reason:** Store cross-module intelligence insights.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_insight (
  id              BIGSERIAL PRIMARY KEY,
  type            VARCHAR(50) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  finding         TEXT NOT NULL,
  evidence        JSONB NOT NULL,
  affected_records JSONB NOT NULL,
  recommended_action TEXT,
  action_route    VARCHAR(255),
  severity        VARCHAR(20) NOT NULL,
  project_id      BIGINT,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS ix_dx_insight_type ON dx_insight (type, is_active);
CREATE INDEX IF NOT EXISTS ix_dx_insight_project ON dx_insight (project_id, is_active);
CREATE INDEX IF NOT EXISTS ix_dx_insight_severity ON dx_insight (severity, is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_insight;
```

**Status:** ✅ Documented

---

### Migration 041 — dx_anomaly (Anomaly Detection)

**Date:** 2026-02-10  
**File:** `migrations/041_create_dx_anomaly.sql`  
**Tables Touched:** `dx_anomaly` (NEW)  
**Reason:** Store detected anomalies across transactional, behavioral, and operational categories.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_anomaly (
  id              BIGSERIAL PRIMARY KEY,
  category        VARCHAR(50) NOT NULL,
  type            VARCHAR(100) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  baseline        TEXT NOT NULL,
  actual_value    TEXT NOT NULL,
  deviation       TEXT NOT NULL,
  deviation_percent NUMERIC(10,4),
  entity_type     VARCHAR(80),
  entity_id       BIGINT,
  entity_number   VARCHAR(100),
  project_id      BIGINT,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity        VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  dismissed_by    BIGINT,
  dismissed_at    TIMESTAMPTZ,
  dismissal_reason TEXT,
  resolved_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_dx_anomaly_category ON dx_anomaly (category, status);
CREATE INDEX IF NOT EXISTS ix_dx_anomaly_project ON dx_anomaly (project_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_anomaly_severity ON dx_anomaly (severity, status);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_anomaly;
```

**Status:** ✅ Documented

---

### Migration 042 — dx_copilot_session (AI Copilot Sessions)

**Date:** 2026-02-10  
**File:** `migrations/042_create_dx_copilot_session.sql`  
**Tables Touched:** `dx_copilot_session`, `dx_copilot_message` (NEW)  
**Reason:** Store AI copilot conversations for audit and analysis.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_copilot_session (
  id              BIGSERIAL PRIMARY KEY,
  session_id      VARCHAR(100) NOT NULL UNIQUE,
  user_id         BIGINT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  message_count   INT NOT NULL DEFAULT 0,
  disclaimer_shown BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_dx_copilot_session_user ON dx_copilot_session (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS dx_copilot_message (
  id              BIGSERIAL PRIMARY KEY,
  session_id      VARCHAR(100) NOT NULL REFERENCES dx_copilot_session(session_id),
  role            VARCHAR(20) NOT NULL,
  content         TEXT NOT NULL,
  sources         JSONB,
  query           TEXT,
  data_scope      JSONB,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_copilot_message_session ON dx_copilot_message (session_id, timestamp);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_copilot_message;
DROP TABLE IF EXISTS dx_copilot_session;
```

**Status:** ✅ Documented

---

### Migration 043 — dx_report_definition (Report Definitions)

**Date:** 2026-02-10  
**File:** `migrations/043_create_dx_report_definition.sql`  
**Tables Touched:** `dx_report_definition` (NEW)  
**Reason:** Store user-defined report configurations.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_report_definition (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  data_source     VARCHAR(50) NOT NULL,
  columns         JSONB NOT NULL,
  filters         JSONB NOT NULL,
  group_by        JSONB,
  sort_by         JSONB,
  aggregations    JSONB,
  calculated_columns JSONB,
  visualization   VARCHAR(20),
  chart_type      VARCHAR(50),
  is_shared       BOOLEAN NOT NULL DEFAULT FALSE,
  shared_with     JSONB,
  created_by      BIGINT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  schedule        JSONB
);
CREATE INDEX IF NOT EXISTS ix_dx_report_definition_creator ON dx_report_definition (created_by);
CREATE INDEX IF NOT EXISTS ix_dx_report_definition_shared ON dx_report_definition (is_shared);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_report_definition;
```

**Status:** ✅ Documented

---

### Migration 044 — dx_report_execution (Report Execution Log)

**Date:** 2026-02-10  
**File:** `migrations/044_create_dx_report_execution.sql`  
**Tables Touched:** `dx_report_execution` (NEW)  
**Reason:** Log report executions for audit and performance tracking.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_report_execution (
  id              BIGSERIAL PRIMARY KEY,
  report_id       BIGINT NOT NULL REFERENCES dx_report_definition(id),
  executed_by     BIGINT NOT NULL,
  executed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parameters      JSONB,
  row_count       INT,
  duration_ms     INT,
  status          VARCHAR(20) NOT NULL,
  error_message   TEXT,
  is_background   BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_dx_report_execution_report ON dx_report_execution (report_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_report_execution_user ON dx_report_execution (executed_by, executed_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_report_execution;
```

**Status:** ✅ Documented

---

### Migration 045 — dx_print_template (Print Templates)

**Date:** 2026-02-10  
**File:** `migrations/045_create_dx_print_template.sql`  
**Tables Touched:** `dx_print_template` (NEW)  
**Reason:** Store document print templates.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_print_template (
  id              BIGSERIAL PRIMARY KEY,
  entity_type     VARCHAR(50) NOT NULL,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  layout          JSONB NOT NULL,
  header_config   JSONB NOT NULL,
  footer_config   JSONB NOT NULL,
  signature_block BOOLEAN NOT NULL DEFAULT FALSE,
  qr_code         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      BIGINT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_print_template_entity ON dx_print_template (entity_type, is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_print_template;
```

**Status:** ✅ Documented

---

### Migration 046 — dx_print_job (Print Job Log)

**Date:** 2026-02-10  
**File:** `migrations/046_create_dx_print_job.sql`  
**Tables Touched:** `dx_print_job` (NEW)  
**Reason:** Log print jobs for audit.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_print_job (
  id              BIGSERIAL PRIMARY KEY,
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       BIGINT NOT NULL,
  template_id     BIGINT NOT NULL REFERENCES dx_print_template(id),
  printed_by      BIGINT NOT NULL,
  printed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  copies          INT NOT NULL DEFAULT 1,
  format          VARCHAR(20) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_dx_print_job_entity ON dx_print_job (entity_type, entity_id, printed_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_print_job_user ON dx_print_job (printed_by, printed_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_print_job;
```

**Status:** ✅ Documented

---

### Migration 047 — dx_export_job (Export Job Log)

**Date:** 2026-02-10  
**File:** `migrations/047_create_dx_export_job.sql`  
**Tables Touched:** `dx_export_job` (NEW)  
**Reason:** Log export jobs for audit and tracking.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_export_job (
  id              BIGSERIAL PRIMARY KEY,
  report_id       BIGINT,
  entity_type     VARCHAR(50),
  filters         JSONB,
  columns         JSONB,
  format          VARCHAR(20) NOT NULL,
  requested_by    BIGINT NOT NULL,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  row_count       INT,
  file_size       BIGINT,
  download_url    TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  is_background   BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_dx_export_job_user ON dx_export_job (requested_by, requested_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_export_job_status ON dx_export_job (status, requested_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_export_job;
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
| 023 | `dx_dashboard_role_default` | NEW | ✅ Documented |
| 024 | `dx_health_score_config` | NEW | ✅ Documented |
| 025 | `dx_health_score_history` | NEW | ✅ Documented |
| 026 | `dx_object_page_config` | NEW | ✅ Documented |
| 027 | `dx_document_chain` | NEW | ✅ Documented |
| 028 | `dx_task` | NEW | ✅ Documented |
| 029 | `dx_task_comment` | NEW | ✅ Documented |
| 030 | `dx_notification` | NEW | ✅ Documented |
| 031 | `dx_notification_delivery` | NEW | ✅ Documented |
| 032 | `dx_notification_preference` | NEW | ✅ Documented |
| 033 | `dx_notification_template` | NEW | ✅ Documented |
| 034 | `dx_exception` | NEW | ✅ Documented |
| 035 | `dx_out_of_office` | NEW | ✅ Documented |
| 036 | `dx_evm_baseline` | NEW | ✅ Documented |
| 037 | `dx_evm_snapshot` | NEW | ✅ Documented |
| 038 | `dx_forecast` | NEW | ✅ Documented |
| 039 | `dx_forecast_accuracy` | NEW | ✅ Documented |
| 040 | `dx_insight` | NEW | ✅ Documented |
| 041 | `dx_anomaly` | NEW | ✅ Documented |
| 042 | `dx_copilot_session` | NEW | ✅ Documented |
| 043 | `dx_report_definition` | NEW | ✅ Documented |
| 044 | `dx_report_execution` | NEW | ✅ Documented |
| 045 | `dx_print_template` | NEW | ✅ Documented |
| 046 | `dx_print_job` | NEW | ✅ Documented |
| 047 | `dx_export_job` | NEW | ✅ Documented |

**Total new tables:** 47  
**Total tables modified:** 0  
**Total rows affected:** 0

---

**Document Status:** ✅ Complete (Part 8 Updated)  
**Next Step:** Part 9 — Data Backup & Restore Tool

---

### Migration 048 — dx_backup (Backup Records)

**Date:** 2026-02-10  
**File:** `migrations/048_create_dx_backup.sql`  
**Tables Touched:** `dx_backup` (NEW)  
**Reason:** Store backup metadata, status, and validation results.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_backup (
  id                    BIGSERIAL PRIMARY KEY,
  backup_code           VARCHAR(60) NOT NULL UNIQUE,
  backup_type           VARCHAR(30) NOT NULL,
  trigger_type          VARCHAR(20) NOT NULL,
  schedule_id           BIGINT,
  scope_json            JSONB,
  company_id            BIGINT,
  status                VARCHAR(20) NOT NULL DEFAULT 'queued',
  progress_percent      INT NOT NULL DEFAULT 0,
  current_stage         VARCHAR(80),
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  duration_seconds      INT,
  file_path             TEXT,
  file_name             VARCHAR(255),
  file_size_bytes       BIGINT,
  compressed_size_bytes BIGINT,
  compression_ratio     NUMERIC(6,3),
  checksum_sha256       VARCHAR(64),
  encryption_algorithm  VARCHAR(40),
  encryption_key_id     VARCHAR(100),
  table_count           INT,
  row_count             BIGINT,
  file_count            INT,
  schema_version        VARCHAR(40),
  app_version           VARCHAR(40),
  db_engine_version     VARCHAR(60),
  manifest_json         JSONB,
  validation_status     VARCHAR(20),
  validation_details    JSONB,
  validated_at          TIMESTAMPTZ,
  retention_until       DATE,
  is_locked             BOOLEAN NOT NULL DEFAULT FALSE,
  lock_reason           TEXT,
  error_message         TEXT,
  error_stack           TEXT,
  created_by            BIGINT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes                 TEXT
);
CREATE INDEX IF NOT EXISTS ix_dx_backup_status ON dx_backup (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_backup_type ON dx_backup (backup_type, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_backup_retain ON dx_backup (retention_until) WHERE is_locked = FALSE;
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_backup;
```

**Status:** ✅ Documented

---

### Migration 049 — dx_backup_schedule (Backup Schedules)

**Date:** 2026-02-10  
**File:** `migrations/049_create_dx_backup_schedule.sql`  
**Tables Touched:** `dx_backup_schedule` (NEW)  
**Reason:** Store automated backup schedules with cron expressions.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_backup_schedule (
  id                  BIGSERIAL PRIMARY KEY,
  schedule_name       VARCHAR(150) NOT NULL,
  backup_type         VARCHAR(30) NOT NULL,
  scope_json          JSONB,
  cron_expression     VARCHAR(100) NOT NULL,
  timezone            VARCHAR(60) NOT NULL DEFAULT 'Asia/Kolkata',
  retention_days      INT NOT NULL DEFAULT 30,
  retention_count     INT,
  storage_target      VARCHAR(40) NOT NULL DEFAULT 'local',
  storage_config_id   BIGINT,
  notify_on_success   BOOLEAN NOT NULL DEFAULT FALSE,
  notify_on_failure   BOOLEAN NOT NULL DEFAULT TRUE,
  notify_user_ids     TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at         TIMESTAMPTZ,
  last_run_status     VARCHAR(20),
  next_run_at         TIMESTAMPTZ,
  consecutive_failures INT NOT NULL DEFAULT 0,
  created_by          BIGINT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_backup_schedule_active ON dx_backup_schedule (is_active, next_run_at);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_backup_schedule;
```

**Status:** ✅ Documented

---

### Migration 050 — dx_backup_download (Download Requests)

**Date:** 2026-02-10  
**File:** `migrations/050_create_dx_backup_download.sql`  
**Tables Touched:** `dx_backup_download` (NEW)  
**Reason:** Track backup download requests with approval workflow.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_backup_download (
  id              BIGSERIAL PRIMARY KEY,
  backup_id       BIGINT NOT NULL REFERENCES dx_backup(id),
  token           VARCHAR(128) NOT NULL UNIQUE,
  requested_by    BIGINT NOT NULL,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  reason          TEXT NOT NULL,
  approved_by     BIGINT,
  approved_at     TIMESTAMPTZ,
  downloaded_at   TIMESTAMPTZ,
  download_ip     VARCHAR(64),
  download_agent  TEXT,
  bytes_served    BIGINT,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS ix_dx_backup_download_backup ON dx_backup_download (backup_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_backup_download_token ON dx_backup_download (token);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_backup_download;
```

**Status:** ✅ Documented

---

### Migration 051 — dx_restore (Restore Operations)

**Date:** 2026-02-10  
**File:** `migrations/051_create_dx_restore.sql`  
**Tables Touched:** `dx_restore` (NEW)  
**Reason:** Track restore operations with approval workflow and verification.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_restore (
  id                    BIGSERIAL PRIMARY KEY,
  restore_code          VARCHAR(60) NOT NULL UNIQUE,
  backup_id             BIGINT NOT NULL REFERENCES dx_backup(id),
  restore_type          VARCHAR(30) NOT NULL,
  scope_json            JSONB,
  target_environment    VARCHAR(30) NOT NULL,
  status                VARCHAR(30) NOT NULL DEFAULT 'requested',
  progress_percent      INT NOT NULL DEFAULT 0,
  current_stage         VARCHAR(80),
  requested_by          BIGINT NOT NULL,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  justification         TEXT NOT NULL,
  approved_by           BIGINT,
  approved_at           TIMESTAMPTZ,
  approval_note         TEXT,
  rejected_by           BIGINT,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  pre_restore_backup_id BIGINT REFERENCES dx_backup(id),
  validation_report     JSONB,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  duration_seconds      INT,
  rows_restored         BIGINT,
  tables_restored       INT,
  verification_report   JSONB,
  error_message         TEXT,
  rollback_performed    BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_restore_status ON dx_restore (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_restore_backup ON dx_restore (backup_id);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_restore;
```

**Status:** ✅ Documented

---

### Migration 052 — dx_backup_audit (Backup Audit Trail)

**Date:** 2026-02-10  
**File:** `migrations/052_create_dx_backup_audit.sql`  
**Tables Touched:** `dx_backup_audit` (NEW)  
**Reason:** Immutable audit trail for all backup and restore operations.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_backup_audit (
  id            BIGSERIAL PRIMARY KEY,
  backup_id     BIGINT,
  restore_id    BIGINT,
  action        VARCHAR(50) NOT NULL,
  performed_by  BIGINT NOT NULL,
  performed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    VARCHAR(64),
  user_agent    TEXT,
  details_json  JSONB,
  result        VARCHAR(20) NOT NULL DEFAULT 'success'
);
CREATE INDEX IF NOT EXISTS ix_dx_backup_audit_performed ON dx_backup_audit (performed_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_backup_audit_backup ON dx_backup_audit (backup_id);
CREATE INDEX IF NOT EXISTS ix_dx_backup_audit_restore ON dx_backup_audit (restore_id);
-- Note: This table should be append-only. Revoke UPDATE and DELETE permissions.
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_backup_audit;
```

**Status:** ✅ Documented

---

### Migration 053 — dx_storage_target (Storage Targets)

**Date:** 2026-02-10  
**File:** `migrations/053_create_dx_storage_target.sql`  
**Tables Touched:** `dx_storage_target` (NEW)  
**Reason:** Configure storage targets for backups (S3, Azure, GCS, etc.).

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_storage_target (
  id              BIGSERIAL PRIMARY KEY,
  target_name     VARCHAR(100) NOT NULL UNIQUE,
  target_type     VARCHAR(30) NOT NULL,
  config_json     JSONB NOT NULL,
  credential_ref  VARCHAR(150),
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_tested_at  TIMESTAMPTZ,
  last_test_ok    BOOLEAN,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_storage_target_active ON dx_storage_target (is_active);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_storage_target;
```

**Status:** ✅ Documented

---

## Summary (Updated)

| Migration | Table | Type | Status |
|---|---|---|---|
| 001-047 | (Previous parts) | Various | ✅ Documented |
| 048 | `dx_backup` | NEW | ✅ Documented |
| 049 | `dx_backup_schedule` | NEW | ✅ Documented |
| 050 | `dx_backup_download` | NEW | ✅ Documented |
| 051 | `dx_restore` | NEW | ✅ Documented |
| 052 | `dx_backup_audit` | NEW | ✅ Documented |
| 053 | `dx_storage_target` | NEW | ✅ Documented |

**Total new tables:** 53  
**Total tables modified:** 0  
**Total rows affected:** 0

---

**Document Status:** ✅ Complete (Part 10 Updated)  
**Next Step:** PRODUCTION DEPLOYMENT

---

## Part 10 — No New Tables

Part 10 focuses on security hardening, performance optimization, testing, and deployment procedures. No new database tables are required as this part works with the existing 53 tables from Parts 1-9.

**Focus Areas:**
- Security hardening of existing tables
- Performance optimization of existing queries
- Comprehensive testing (unit, integration, E2E, security, accessibility)
- Deployment procedures and runbooks
- Final acceptance validation

**Total Database Tables:** 53 (unchanged from Part 9)
