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

**Document Status:** ✅ Complete (Part 12 Updated)  
**Next Step:** Part 13 — Planning, WBS, Scheduling & Progress

---

### Migration 049 — dx_org_node (Enterprise Hierarchy)

**Date:** 2026-02-10  
**File:** `migrations/049_create_dx_org_node.sql`  
**Tables Touched:** `dx_org_node` (NEW)  
**Reason:** Materialized enterprise hierarchy for fast subtree queries.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_org_node (
  id            BIGSERIAL PRIMARY KEY,
  level_type    VARCHAR(30) NOT NULL,
  source_table  VARCHAR(80) NOT NULL,
  source_id     BIGINT NOT NULL,
  parent_id     BIGINT REFERENCES dx_org_node(id),
  path          VARCHAR(500) NOT NULL,
  depth         SMALLINT NOT NULL,
  code          VARCHAR(60) NOT NULL,
  name          VARCHAR(250) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_org_source UNIQUE (source_table, source_id)
);
CREATE INDEX IF NOT EXISTS ix_dx_org_path ON dx_org_node (path varchar_pattern_ops);
CREATE INDEX IF NOT EXISTS ix_dx_org_parent ON dx_org_node (parent_id, sort_order);
CREATE INDEX IF NOT EXISTS ix_dx_org_level ON dx_org_node (level_type, is_active);
```

**Status:** ✅ Documented

---

### Migration 050 — dx_project_profile (Project Contract Details)

**Date:** 2026-02-10  
**File:** `migrations/050_create_dx_project_profile.sql`  
**Tables Touched:** `dx_project_profile` (NEW)  
**Reason:** Extended project master with contract details, retention, LD, escalation.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_project_profile (
  project_id            BIGINT PRIMARY KEY,
  contract_type         VARCHAR(30),
  client_id             BIGINT,
  contract_value        NUMERIC(18,2),
  revised_contract_value NUMERIC(18,2),
  loa_number            VARCHAR(80),
  loa_date              DATE,
  agreement_date        DATE,
  commencement_date     DATE,
  original_completion   DATE,
  revised_completion    DATE,
  actual_completion     DATE,
  defect_liability_months SMALLINT,
  retention_percent     NUMERIC(6,3),
  retention_ceiling_pct NUMERIC(6,3),
  mobilisation_adv_pct  NUMERIC(6,3),
  material_adv_pct      NUMERIC(6,3),
  advance_recovery_rule VARCHAR(30),
  price_escalation_flag BOOLEAN DEFAULT FALSE,
  escalation_formula_id BIGINT,
  ld_percent_per_week   NUMERIC(6,3),
  ld_ceiling_percent    NUMERIC(6,3),
  currency_code         CHAR(3) NOT NULL DEFAULT 'INR',
  gst_state_code        CHAR(2),
  project_gstin         VARCHAR(20),
  billing_cycle         VARCHAR(20),
  health_override       VARCHAR(20),
  geofence_polygon      JSONB,
  geofence_radius_m     INTEGER,
  working_calendar_id   BIGINT,
  is_closed             BOOLEAN NOT NULL DEFAULT FALSE,
  closed_at             TIMESTAMPTZ,
  created_by            BIGINT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_by            BIGINT,
  updated_at            TIMESTAMPTZ
);
```

**Status:** ✅ Documented

---

### Migration 051 — dx_project_config (Project Configuration)

**Date:** 2026-02-10  
**File:** `migrations/051_create_dx_project_config.sql`  
**Tables Touched:** `dx_project_config` (NEW)  
**Reason:** Key-value configuration for project behavior switches.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_project_config (
  id           BIGSERIAL PRIMARY KEY,
  project_id   BIGINT NOT NULL,
  config_key   VARCHAR(100) NOT NULL,
  config_value TEXT NOT NULL,
  value_type   VARCHAR(20) NOT NULL,
  updated_by   BIGINT,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_dx_pcfg UNIQUE (project_id, config_key)
);
```

**Status:** ✅ Documented

---

### Migration 052 — dx_boq_version (BOQ Version Control)

**Date:** 2026-02-10  
**File:** `migrations/052_create_dx_boq_version.sql`  
**Tables Touched:** `dx_boq_version` (NEW)  
**Reason:** BOQ version control with effective dating.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_boq_version (
  id             BIGSERIAL PRIMARY KEY,
  project_id     BIGINT NOT NULL,
  package_id     BIGINT,
  version_no     INTEGER NOT NULL,
  version_type   VARCHAR(20) NOT NULL,
  reference_no   VARCHAR(80),
  effective_from DATE NOT NULL,
  status         VARCHAR(20) NOT NULL,
  approved_by    BIGINT,
  approved_at    TIMESTAMPTZ,
  total_value    NUMERIC(18,2),
  CONSTRAINT uq_dx_boqver UNIQUE (project_id, package_id, version_no)
);
```

**Status:** ✅ Documented

---

### Migration 053 — dx_boq_item_extension (BOQ Item Extensions)

**Date:** 2026-02-10  
**File:** `migrations/053_create_dx_boq_item_extension.sql`  
**Tables Touched:** `dx_boq_item_extension` (NEW)  
**Reason:** Extended BOQ items with cost code, WBS, measurement method.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_boq_item_extension (
  id                BIGSERIAL PRIMARY KEY,
  boq_item_id       BIGINT NOT NULL,
  boq_version_id    BIGINT NOT NULL,
  parent_boq_item_id BIGINT,
  cost_code_id      BIGINT,
  wbs_id            BIGINT,
  is_provisional    BOOLEAN DEFAULT FALSE,
  is_daywork        BOOLEAN DEFAULT FALSE,
  is_non_tendered   BOOLEAN DEFAULT FALSE,
  qty_ceiling_pct   NUMERIC(6,3),
  measurement_method VARCHAR(40),
  deduction_rule_id BIGINT,
  is_locked         BOOLEAN DEFAULT FALSE,
  CONSTRAINT uq_dx_boqext UNIQUE (boq_item_id, boq_version_id)
);
```

**Status:** ✅ Documented

---

### Migration 054 — dx_item_category (Item Category Hierarchy)

**Date:** 2026-02-10  
**File:** `migrations/054_create_dx_item_category.sql`  
**Tables Touched:** `dx_item_category` (NEW)  
**Reason:** Hierarchical item categories with materialized paths.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_item_category (
  id          BIGSERIAL PRIMARY KEY,
  parent_id   BIGINT REFERENCES dx_item_category(id),
  code        VARCHAR(60) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  level       INTEGER NOT NULL,
  path        VARCHAR(500) NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  CONSTRAINT uq_dx_cat_code UNIQUE (code)
);
CREATE INDEX IF NOT EXISTS ix_dx_cat_path ON dx_item_category (path varchar_pattern_ops);
```

**Status:** ✅ Documented

---

### Migration 055 — dx_item_extension (Item Master Extensions)

**Date:** 2026-02-10  
**File:** `migrations/055_create_dx_item_extension.sql`  
**Tables Touched:** `dx_item_extension` (NEW)  
**Reason:** Extended item master with HSN, brand, shelf life, reorder defaults.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_item_extension (
  item_id              BIGINT PRIMARY KEY,
  category_id          BIGINT REFERENCES dx_item_category(id),
  hsn_code             VARCHAR(20),
  sac_code             VARCHAR(20),
  brand                VARCHAR(100),
  make                 VARCHAR(100),
  shelf_life_days      INTEGER,
  is_hazardous         BOOLEAN DEFAULT FALSE,
  storage_conditions   TEXT,
  reorder_level        NUMERIC(18,4),
  reorder_qty          NUMERIC(18,4),
  lead_time_days       INTEGER,
  standard_rate        NUMERIC(18,4),
  standard_rate_effective_from DATE,
  specifications       JSONB,
  alternate_items      JSONB
);
```

**Status:** ✅ Documented

---

### Migration 056 — dx_uom (Unit of Measure Master)

**Date:** 2026-02-10  
**File:** `migrations/056_create_dx_uom.sql`  
**Tables Touched:** `dx_uom` (NEW)  
**Reason:** Unit of measure master with categories.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_uom (
  id               BIGSERIAL PRIMARY KEY,
  code             VARCHAR(20) NOT NULL,
  name             VARCHAR(100) NOT NULL,
  category         VARCHAR(30) NOT NULL,
  base_uom_id      BIGINT REFERENCES dx_uom(id),
  conversion_factor NUMERIC(20,8),
  is_active        BOOLEAN DEFAULT TRUE,
  CONSTRAINT uq_dx_uom_code UNIQUE (code)
);
```

**Status:** ✅ Documented

---

### Migration 057 — dx_uom_conversion (UoM Conversions)

**Date:** 2026-02-10  
**File:** `migrations/057_create_dx_uom_conversion.sql`  
**Tables Touched:** `dx_uom_conversion` (NEW)  
**Reason:** Explicit UoM conversion factors, item-specific or global.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_uom_conversion (
  id          BIGSERIAL PRIMARY KEY,
  from_uom    VARCHAR(20) NOT NULL,
  to_uom      VARCHAR(20) NOT NULL,
  factor      NUMERIC(20,8) NOT NULL,
  item_id     BIGINT,
  is_active   BOOLEAN DEFAULT TRUE,
  CONSTRAINT uq_dx_uom UNIQUE (from_uom, to_uom, item_id)
);
```

**Status:** ✅ Documented

---

### Migration 058 — dx_party_compliance (Vendor/Client Compliance)

**Date:** 2026-02-10  
**File:** `migrations/058_create_dx_party_compliance.sql`  
**Tables Touched:** `dx_party_compliance` (NEW)  
**Reason:** Track compliance documents for vendors and clients.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_party_compliance (
  id              BIGSERIAL PRIMARY KEY,
  party_type      VARCHAR(20) NOT NULL,
  source_table    VARCHAR(80) NOT NULL,
  party_id        BIGINT NOT NULL,
  document_type   VARCHAR(60) NOT NULL,
  document_number VARCHAR(80),
  issue_date      DATE,
  expiry_date     DATE,
  file_id         BIGINT,
  verified_by     BIGINT,
  verified_at     TIMESTAMPTZ,
  verification_source VARCHAR(30),
  status          VARCHAR(20) NOT NULL,
  CONSTRAINT uq_dx_party_doc UNIQUE (source_table, party_id, document_type, document_number)
);
```

**Status:** ✅ Documented

---

### Migration 059 — dx_vendor_scorecard (Vendor Performance)

**Date:** 2026-02-10  
**File:** `migrations/059_create_dx_vendor_scorecard.sql`  
**Tables Touched:** `dx_vendor_scorecard` (NEW)  
**Reason:** Computed vendor performance metrics from transactions.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_vendor_scorecard (
  vendor_id                   BIGINT PRIMARY KEY,
  on_time_delivery_percent    NUMERIC(6,3),
  quantity_accuracy_percent   NUMERIC(6,3),
  qc_rejection_percent        NUMERIC(6,3),
  rate_competitiveness_index  NUMERIC(6,3),
  document_compliance_percent NUMERIC(6,3),
  dispute_count               INTEGER,
  avg_response_time_hours     NUMERIC(8,2),
  overall_score               NUMERIC(6,3),
  transaction_count           INTEGER,
  last_updated                TIMESTAMPTZ
);
```

**Status:** ✅ Documented

---

### Migration 060 — dx_rate_master (Effective-Dated Rates)

**Date:** 2026-02-10  
**File:** `migrations/060_create_dx_rate_master.sql`  
**Tables Touched:** `dx_rate_master` (NEW)  
**Reason:** Effective-dated rate management with scope hierarchy.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_rate_master (
  id              BIGSERIAL PRIMARY KEY,
  rate_type       VARCHAR(30) NOT NULL,
  scope_type      VARCHAR(20) NOT NULL,
  scope_id        BIGINT,
  reference_type  VARCHAR(30) NOT NULL,
  reference_id    BIGINT NOT NULL,
  uom             VARCHAR(20) NOT NULL,
  rate            NUMERIC(18,4) NOT NULL,
  currency_code   CHAR(3) NOT NULL DEFAULT 'INR',
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  approved_by     BIGINT,
  approved_at     TIMESTAMPTZ,
  source_document VARCHAR(80),
  created_by      BIGINT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dx_rate_lookup ON dx_rate_master
  (rate_type, reference_type, reference_id, scope_type, scope_id, effective_from DESC);
```

**Status:** ✅ Documented

---

### Migration 061 — dx_number_series (Numbering Series)

**Date:** 2026-02-10  
**File:** `migrations/061_create_dx_number_series.sql`  
**Tables Touched:** `dx_number_series` (NEW)  
**Reason:** Governed numbering series with pattern-based generation.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_number_series (
  id            BIGSERIAL PRIMARY KEY,
  document_type VARCHAR(60) NOT NULL,
  scope_type    VARCHAR(20) NOT NULL,
  scope_id      BIGINT,
  fiscal_year   VARCHAR(9),
  prefix        VARCHAR(30),
  suffix        VARCHAR(30),
  pattern       VARCHAR(120) NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  padding       SMALLINT NOT NULL DEFAULT 4,
  reset_rule    VARCHAR(20) NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  CONSTRAINT uq_dx_series UNIQUE (document_type, scope_type, scope_id, fiscal_year)
);
```

**Status:** ✅ Documented

---

### Migration 062 — dx_master_governance (Governance Configuration)

**Date:** 2026-02-10  
**File:** `migrations/062_create_dx_master_governance.sql`  
**Tables Touched:** `dx_master_governance` (NEW)  
**Reason:** Configurable governance rules per master type.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_master_governance (
  id                 BIGSERIAL PRIMARY KEY,
  master_type        VARCHAR(60) NOT NULL UNIQUE,
  source_table       VARCHAR(80) NOT NULL,
  approval_on_create BOOLEAN NOT NULL DEFAULT FALSE,
  approval_on_update BOOLEAN NOT NULL DEFAULT FALSE,
  approval_on_deactivate BOOLEAN NOT NULL DEFAULT FALSE,
  controlled_fields  JSONB,
  duplicate_rules    JSONB,
  required_documents JSONB,
  is_enabled         BOOLEAN NOT NULL DEFAULT FALSE
);
```

**Status:** ✅ Documented

---

### Migration 063 — dx_master_change_request (Change Requests)

**Date:** 2026-02-10  
**File:** `migrations/063_create_dx_master_change_request.sql`  
**Tables Touched:** `dx_master_change_request` (NEW)  
**Reason:** Change request workflow for master data modifications.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_master_change_request (
  id             BIGSERIAL PRIMARY KEY,
  request_no     VARCHAR(40) NOT NULL UNIQUE,
  master_type    VARCHAR(60) NOT NULL,
  source_table   VARCHAR(80) NOT NULL,
  source_id      BIGINT,
  change_type    VARCHAR(20) NOT NULL,
  proposed_data  JSONB NOT NULL,
  current_data   JSONB,
  reason         TEXT NOT NULL,
  status         VARCHAR(20) NOT NULL,
  requested_by   BIGINT NOT NULL,
  requested_at   TIMESTAMPTZ DEFAULT NOW(),
  decided_by     BIGINT,
  decided_at     TIMESTAMPTZ,
  decision_note  TEXT,
  applied_at     TIMESTAMPTZ,
  applied_record_id BIGINT
);
```

**Status:** ✅ Documented

---

### Migration 064 — dx_master_audit (Master Audit Trail)

**Date:** 2026-02-10  
**File:** `migrations/064_create_dx_master_audit.sql`  
**Tables Touched:** `dx_master_audit` (NEW)  
**Reason:** Field-level audit trail for master data changes with hash chaining.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_master_audit (
  id           BIGSERIAL PRIMARY KEY,
  master_type  VARCHAR(60) NOT NULL,
  source_table VARCHAR(80) NOT NULL,
  source_id    BIGINT NOT NULL,
  action       VARCHAR(20) NOT NULL,
  field_name   VARCHAR(80),
  old_value    TEXT,
  new_value    TEXT,
  change_request_id BIGINT,
  changed_by   BIGINT NOT NULL,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address   VARCHAR(45),
  row_hash     CHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_dx_maudit_rec ON dx_master_audit (source_table, source_id, changed_at DESC);
```

**Status:** ✅ Documented

---

### Migration 065 — dx_master_merge (Merge Tracking)

**Date:** 2026-02-10  
**File:** `migrations/065_create_dx_master_merge.sql`  
**Tables Touched:** `dx_master_merge` (NEW)  
**Reason:** Track merged master records without deleting historical data.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_master_merge (
  id            BIGSERIAL PRIMARY KEY,
  master_type   VARCHAR(60) NOT NULL,
  source_table  VARCHAR(80) NOT NULL,
  surviving_id  BIGINT NOT NULL,
  merged_id     BIGINT NOT NULL,
  merged_by     BIGINT NOT NULL,
  merged_at     TIMESTAMPTZ DEFAULT NOW(),
  reason        TEXT NOT NULL,
  transaction_count INTEGER NOT NULL,
  CONSTRAINT uq_dx_merge UNIQUE (source_table, merged_id)
);
```

**Status:** ✅ Documented

---

### Migration 066 — dx_master_quality_metric (Quality Metrics)

**Date:** 2026-02-10  
**File:** `migrations/066_create_dx_master_quality_metric.sql`  
**Tables Touched:** `dx_master_quality_metric` (NEW)  
**Reason:** Computed quality metrics per master type.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_master_quality_metric (
  master_type           VARCHAR(60) PRIMARY KEY,
  total_records         INTEGER NOT NULL,
  complete_records      INTEGER NOT NULL,
  completeness_percent  NUMERIC(6,3) NOT NULL,
  duplicate_candidates  INTEGER NOT NULL,
  expired_documents     INTEGER NOT NULL,
  orphan_references     INTEGER NOT NULL,
  inactive_with_transactions INTEGER NOT NULL,
  not_used_in_24_months INTEGER NOT NULL,
  last_computed         TIMESTAMPTZ NOT NULL
);
```

**Status:** ✅ Documented

---

### Migration 067 — dx_master_duplicate_candidate (Duplicate Detection)

**Date:** 2026-02-10  
**File:** `migrations/067_create_dx_master_duplicate_candidate.sql`  
**Tables Touched:** `dx_master_duplicate_candidate` (NEW)  
**Reason:** Track duplicate candidates for review and merge.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_master_duplicate_candidate (
  id            BIGSERIAL PRIMARY KEY,
  master_type   VARCHAR(60) NOT NULL,
  source_table  VARCHAR(80) NOT NULL,
  record_id_1   BIGINT NOT NULL,
  record_id_2   BIGINT NOT NULL,
  match_score   NUMERIC(6,3) NOT NULL,
  match_fields  JSONB NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  detected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by   BIGINT,
  reviewed_at   TIMESTAMPTZ
);
```

**Status:** ✅ Documented

---

### Migration 048 — dx_sync_log (Offline Sync Log)

**Date:** 2026-02-10  
**File:** `migrations/048_create_dx_sync_log.sql`  
**Tables Touched:** `dx_sync_log` (NEW)  
**Reason:** Track offline sync operations with idempotency keys to prevent duplicate records.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_sync_log (
  id               BIGSERIAL PRIMARY KEY,
  local_id         UUID NOT NULL,
  device_id        VARCHAR(100) NOT NULL,
  user_id          BIGINT NOT NULL,
  project_id       BIGINT,
  entity_type      VARCHAR(80) NOT NULL,
  server_record_id BIGINT,
  status           VARCHAR(20) NOT NULL,     -- ACCEPTED | REJECTED | DUPLICATE
  captured_at      TIMESTAMPTZ NOT NULL,     -- device clock
  received_at      TIMESTAMPTZ NOT NULL,     -- server clock
  clock_skew_sec   INTEGER,
  error_message    TEXT,
  payload_hash     CHAR(64) NOT NULL,
  CONSTRAINT uq_dx_sync_local UNIQUE (local_id)
);
CREATE INDEX IF NOT EXISTS ix_dx_sync_user ON dx_sync_log (user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_sync_status ON dx_sync_log (status, received_at DESC);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS dx_sync_log;
```

**Status:** ✅ Documented

---

## Summary

| Migration | Table | Type | Status |
|---|---|---|---|
| 001-047 | (Parts 1-10) | Various | ✅ Documented |
| 048 | `dx_sync_log` | NEW | ✅ Documented |

**Total new tables:** 54  
**Total tables modified:** 0  
**Total rows affected:** 0

---

**Document Status:** ✅ Complete (Part 11 Updated)  
**Next Step:** Part 12 — Master Data & Enterprise Structure

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

---

## Part 11 — Responsive & Multi-Device Framework

Part 11 focuses on responsive design, multi-device support, offline capabilities, and PWA features. Only 1 new table was added for offline sync tracking.

**New Table:**
- `dx_sync_log` — Offline sync operations with idempotency

**Total Database Tables:** 54 (53 + 1 from Part 11)

---

## Part 12 — Master Data & Enterprise Structure

Part 12 adds comprehensive master data management with 19 new tables covering enterprise hierarchy, project profiles, BOQ versioning, item categories, UoM conversions, vendor compliance, rate management, numbering series, master governance, change requests, audit trails, duplicate detection, and data quality metrics.

**New Tables (19):**
- `dx_org_node` — Enterprise hierarchy materialization
- `dx_project_profile` — Project contract details
- `dx_project_config` — Project configuration
- `dx_boq_version` — BOQ version control
- `dx_boq_item_extension` — BOQ item extensions
- `dx_item_category` — Item category hierarchy
- `dx_item_extension` — Item master extensions
- `dx_uom` — Unit of measure master
- `dx_uom_conversion` — UoM conversions
- `dx_party_compliance` — Vendor/client compliance
- `dx_vendor_scorecard` — Vendor performance
- `dx_rate_master` — Effective-dated rates
- `dx_number_series` — Numbering series
- `dx_master_governance` — Governance configuration
- `dx_master_change_request` — Change requests
- `dx_master_audit` — Master audit trail
- `dx_master_merge` — Merge tracking
- `dx_master_quality_metric` — Quality metrics
- `dx_master_duplicate_candidate` — Duplicate detection

**Total Database Tables:** 73 (54 + 19 from Part 12)

---

### Migration 068 — dx_wbs (Work Breakdown Structure)

**Date:** 2026-02-10  
**File:** `migrations/068_create_dx_wbs.sql`  
**Tables Touched:** `dx_wbs` (NEW)  
**Reason:** Work breakdown structure with materialized paths for fast hierarchy queries.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_wbs (
  id             BIGSERIAL PRIMARY KEY,
  project_id     BIGINT NOT NULL,
  package_id     BIGINT,
  parent_id      BIGINT REFERENCES dx_wbs(id),
  wbs_code       VARCHAR(60) NOT NULL,
  path           VARCHAR(500) NOT NULL,
  depth          SMALLINT NOT NULL,
  name           VARCHAR(250) NOT NULL,
  wbs_type       VARCHAR(20) NOT NULL,
  site_id        BIGINT,
  area_id        BIGINT,
  cost_code_id   BIGINT,
  responsible_user_id BIGINT,
  weightage      NUMERIC(9,5),
  weight_basis   VARCHAR(20) NOT NULL,
  budget_cost    NUMERIC(18,2),
  budget_revenue NUMERIC(18,2),
  is_billable    BOOLEAN DEFAULT TRUE,
  is_active      BOOLEAN DEFAULT TRUE,
  sort_order     INTEGER DEFAULT 0,
  CONSTRAINT uq_dx_wbs UNIQUE (project_id, wbs_code)
);
CREATE INDEX IF NOT EXISTS ix_dx_wbs_path ON dx_wbs (path varchar_pattern_ops);
CREATE INDEX IF NOT EXISTS ix_dx_wbs_parent ON dx_wbs (parent_id);
CREATE INDEX IF NOT EXISTS ix_dx_wbs_project ON dx_wbs (project_id, is_active);
```

**Status:** ✅ Documented

---

### Migration 069 — dx_wbs_boq_map (WBS-BOQ Mapping)

**Date:** 2026-02-10  
**File:** `migrations/069_create_dx_wbs_boq_map.sql`  
**Tables Touched:** `dx_wbs_boq_map` (NEW)  
**Reason:** Maps BOQ items to WBS nodes with quantity allocation.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_wbs_boq_map (
  id          BIGSERIAL PRIMARY KEY,
  wbs_id      BIGINT NOT NULL REFERENCES dx_wbs(id),
  boq_item_id BIGINT NOT NULL,
  mapped_qty  NUMERIC(18,4) NOT NULL,
  CONSTRAINT uq_dx_wbsboq UNIQUE (wbs_id, boq_item_id)
);
CREATE INDEX IF NOT EXISTS ix_dx_wbsboq_wbs ON dx_wbs_boq_map (wbs_id);
CREATE INDEX IF NOT EXISTS ix_dx_wbsboq_boq ON dx_wbs_boq_map (boq_item_id);
```

**Status:** ✅ Documented

---

### Migration 070 — dx_schedule_activity (Schedule Activities)

**Date:** 2026-02-10  
**File:** `migrations/070_create_dx_schedule_activity.sql`  
**Tables Touched:** `dx_schedule_activity` (NEW)  
**Reason:** Schedule activities with planned/actual/forecast dates and CPM calculation fields.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_schedule_activity (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL,
  wbs_id          BIGINT NOT NULL REFERENCES dx_wbs(id),
  activity_code   VARCHAR(60) NOT NULL,
  name            VARCHAR(250) NOT NULL,
  activity_type   VARCHAR(20) NOT NULL,
  planned_start   DATE,
  planned_finish  DATE,
  actual_start    DATE,
  actual_finish   DATE,
  forecast_start  DATE,
  forecast_finish DATE,
  duration_days   NUMERIC(9,2),
  remaining_days  NUMERIC(9,2),
  calendar_id     BIGINT,
  total_float     NUMERIC(9,2),
  free_float      NUMERIC(9,2),
  is_critical     BOOLEAN DEFAULT FALSE,
  progress_pct    NUMERIC(6,3) DEFAULT 0,
  constraint_type VARCHAR(20),
  constraint_date DATE,
  status          VARCHAR(20) NOT NULL,
  CONSTRAINT uq_dx_act UNIQUE (project_id, activity_code)
);
CREATE INDEX IF NOT EXISTS ix_dx_act_project ON dx_schedule_activity (project_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_act_wbs ON dx_schedule_activity (wbs_id);
CREATE INDEX IF NOT EXISTS ix_dx_act_critical ON dx_schedule_activity (project_id, is_critical);
```

**Status:** ✅ Documented

---

### Migration 071 — dx_activity_relation (Activity Dependencies)

**Date:** 2026-02-10  
**File:** `migrations/071_create_dx_activity_relation.sql`  
**Tables Touched:** `dx_activity_relation` (NEW)  
**Reason:** Activity dependencies (predecessor/successor relationships).

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_activity_relation (
  id             BIGSERIAL PRIMARY KEY,
  predecessor_id BIGINT NOT NULL REFERENCES dx_schedule_activity(id),
  successor_id   BIGINT NOT NULL REFERENCES dx_schedule_activity(id),
  relation_type  VARCHAR(3) NOT NULL,
  lag_days       NUMERIC(9,2) DEFAULT 0,
  CONSTRAINT uq_dx_rel UNIQUE (predecessor_id, successor_id, relation_type)
);
CREATE INDEX IF NOT EXISTS ix_dx_rel_pred ON dx_activity_relation (predecessor_id);
CREATE INDEX IF NOT EXISTS ix_dx_rel_succ ON dx_activity_relation (successor_id);
```

**Status:** ✅ Documented

---

### Migration 072 — dx_baseline (Schedule Baselines)

**Date:** 2026-02-10  
**File:** `migrations/072_create_dx_baseline.sql`  
**Tables Touched:** `dx_baseline` (NEW)  
**Reason:** Immutable schedule baselines for variance tracking.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_baseline (
  id            BIGSERIAL PRIMARY KEY,
  project_id    BIGINT NOT NULL,
  baseline_no   INTEGER NOT NULL,
  baseline_type VARCHAR(20) NOT NULL,
  reason        TEXT NOT NULL,
  reference_no  VARCHAR(80),
  snapshot_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by   BIGINT,
  approved_at   TIMESTAMPTZ,
  status        VARCHAR(20) NOT NULL,
  is_current    BOOLEAN DEFAULT FALSE,
  CONSTRAINT uq_dx_baseline UNIQUE (project_id, baseline_no)
);
CREATE INDEX IF NOT EXISTS ix_dx_baseline_project ON dx_baseline (project_id, is_current);
```

**Status:** ✅ Documented

---

### Migration 073 — dx_baseline_activity (Baseline Activities)

**Date:** 2026-02-10  
**File:** `migrations/073_create_dx_baseline_activity.sql`  
**Tables Touched:** `dx_baseline_activity` (NEW)  
**Reason:** Snapshot of activities at baseline time for variance comparison.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_baseline_activity (
  id            BIGSERIAL PRIMARY KEY,
  baseline_id   BIGINT NOT NULL REFERENCES dx_baseline(id),
  activity_id   BIGINT NOT NULL REFERENCES dx_schedule_activity(id),
  wbs_id        BIGINT NOT NULL REFERENCES dx_wbs(id),
  planned_start DATE NOT NULL,
  planned_finish DATE NOT NULL,
  duration_days NUMERIC(9,2),
  budget_cost   NUMERIC(18,2),
  budget_value  NUMERIC(18,2),
  weightage     NUMERIC(9,5),
  CONSTRAINT uq_dx_bl_act UNIQUE (baseline_id, activity_id)
);
CREATE INDEX IF NOT EXISTS ix_dx_bl_act_baseline ON dx_baseline_activity (baseline_id);
```

**Status:** ✅ Documented

---

### Migration 074 — dx_progress_entry (Progress Measurements)

**Date:** 2026-02-10  
**File:** `migrations/074_create_dx_progress_entry.sql`  
**Tables Touched:** `dx_progress_entry` (NEW)  
**Reason:** Physical progress entries with 6 measurement methods.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_progress_entry (
  id             BIGSERIAL PRIMARY KEY,
  project_id     BIGINT NOT NULL,
  wbs_id         BIGINT NOT NULL REFERENCES dx_wbs(id),
  activity_id    BIGINT REFERENCES dx_schedule_activity(id),
  cutoff_date    DATE NOT NULL,
  method         VARCHAR(20) NOT NULL,
  previous_pct   NUMERIC(6,3) NOT NULL,
  current_pct    NUMERIC(6,3) NOT NULL,
  source_type    VARCHAR(30) NOT NULL,
  source_ref_id  BIGINT,
  executed_qty   NUMERIC(18,4),
  remark         TEXT,
  entered_by     BIGINT NOT NULL,
  entered_at     TIMESTAMPTZ DEFAULT NOW(),
  approved_by    BIGINT,
  approved_at    TIMESTAMPTZ,
  status         VARCHAR(20) NOT NULL,
  is_decrease    BOOLEAN DEFAULT FALSE,
  decrease_reason VARCHAR(60),
  CONSTRAINT uq_dx_prog UNIQUE (wbs_id, activity_id, cutoff_date)
);
CREATE INDEX IF NOT EXISTS ix_dx_prog_project ON dx_progress_entry (project_id, cutoff_date DESC);
CREATE INDEX IF NOT EXISTS ix_dx_prog_wbs ON dx_progress_entry (wbs_id, cutoff_date DESC);
```

**Status:** ✅ Documented

---

### Migration 075 — dx_progress_snapshot (Progress Snapshots)

**Date:** 2026-02-10  
**File:** `migrations/075_create_dx_progress_snapshot.sql`  
**Tables Touched:** `dx_progress_snapshot` (NEW)  
**Reason:** Daily progress snapshots for S-curve and EVM calculations.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_progress_snapshot (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL,
  wbs_id          BIGINT NOT NULL REFERENCES dx_wbs(id),
  snapshot_date   DATE NOT NULL,
  planned_pct     NUMERIC(6,3),
  actual_pct      NUMERIC(6,3),
  earned_value    NUMERIC(18,2),
  actual_cost     NUMERIC(18,2),
  variance_pct    NUMERIC(6,3),
  variance_days   NUMERIC(9,2),
  CONSTRAINT uq_dx_snap UNIQUE (project_id, wbs_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS ix_dx_snap_project ON dx_progress_snapshot (project_id, snapshot_date DESC);
```

**Status:** ✅ Documented

---

### Migration 076 — dx_lookahead (Look-ahead Plans)

**Date:** 2026-02-10  
**File:** `migrations/076_create_dx_lookahead.sql`  
**Tables Touched:** `dx_lookahead` (NEW)  
**Reason:** Weekly/fortnightly look-ahead planning with PPC tracking.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_lookahead (
  id           BIGSERIAL PRIMARY KEY,
  project_id   BIGINT NOT NULL,
  period_type  VARCHAR(10) NOT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  prepared_by  BIGINT,
  prepared_at  TIMESTAMPTZ,
  status       VARCHAR(20) NOT NULL,
  ppc_percent  NUMERIC(6,3)
);
CREATE INDEX IF NOT EXISTS ix_dx_lookahead_project ON dx_lookahead (project_id, period_start DESC);
```

**Status:** ✅ Documented

---

### Migration 077 — dx_lookahead_task (Look-ahead Tasks)

**Date:** 2026-02-10  
**File:** `migrations/077_create_dx_lookahead_task.sql`  
**Tables Touched:** `dx_lookahead_task` (NEW)  
**Reason:** Tasks within look-ahead periods with completion tracking.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_lookahead_task (
  id              BIGSERIAL PRIMARY KEY,
  lookahead_id    BIGINT NOT NULL REFERENCES dx_lookahead(id),
  activity_id     BIGINT REFERENCES dx_schedule_activity(id),
  wbs_id          BIGINT NOT NULL REFERENCES dx_wbs(id),
  description     VARCHAR(300) NOT NULL,
  planned_qty     NUMERIC(18,4),
  uom             VARCHAR(20),
  planned_start   DATE,
  planned_finish  DATE,
  achieved_qty    NUMERIC(18,4),
  is_completed    BOOLEAN DEFAULT FALSE,
  variance_reason VARCHAR(60),
  responsible_id  BIGINT,
  is_constrained  BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_dx_lat_lookahead ON dx_lookahead_task (lookahead_id);
```

**Status:** ✅ Documented

---

### Migration 078 — dx_constraint (Constraints & Obstructions)

**Date:** 2026-02-10  
**File:** `migrations/078_create_dx_constraint.sql`  
**Tables Touched:** `dx_constraint` (NEW)  
**Reason:** Track constraints and obstructions affecting project progress.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_constraint (
  id             BIGSERIAL PRIMARY KEY,
  project_id     BIGINT NOT NULL,
  wbs_id         BIGINT REFERENCES dx_wbs(id),
  activity_id    BIGINT REFERENCES dx_schedule_activity(id),
  constraint_type VARCHAR(40) NOT NULL,
  title          VARCHAR(250) NOT NULL,
  description    TEXT,
  raised_by      BIGINT NOT NULL,
  raised_at      TIMESTAMPTZ DEFAULT NOW(),
  owner_id       BIGINT NOT NULL,
  required_by    DATE NOT NULL,
  severity       VARCHAR(20) NOT NULL,
  status         VARCHAR(20) NOT NULL,
  resolved_at    TIMESTAMPTZ,
  resolution     TEXT,
  delay_days     INTEGER,
  cost_impact    NUMERIC(18,2),
  linked_document_type VARCHAR(40),
  linked_document_id BIGINT
);
CREATE INDEX IF NOT EXISTS ix_dx_constraint_project ON dx_constraint (project_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_constraint_severity ON dx_constraint (severity, status);
```

**Status:** ✅ Documented

---

### Migration 079 — dx_resource_plan (Resource Planning)

**Date:** 2026-02-10  
**File:** `migrations/079_create_dx_resource_plan.sql`  
**Tables Touched:** `dx_resource_plan` (NEW)  
**Reason:** Resource planning for manpower, material, equipment, and subcontract.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_resource_plan (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL,
  wbs_id          BIGINT REFERENCES dx_wbs(id),
  activity_id     BIGINT REFERENCES dx_schedule_activity(id),
  resource_type   VARCHAR(20) NOT NULL,
  resource_ref_id BIGINT NOT NULL,
  uom             VARCHAR(20) NOT NULL,
  planned_qty     NUMERIC(18,4) NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  rate            NUMERIC(18,4),
  planned_cost    NUMERIC(18,2),
  source          VARCHAR(20) NOT NULL,
  norm_id         BIGINT
);
CREATE INDEX IF NOT EXISTS ix_dx_resplan_project ON dx_resource_plan (project_id, period_start);
CREATE INDEX IF NOT EXISTS ix_dx_resplan_type ON dx_resource_plan (resource_type, period_start);
```

**Status:** ✅ Documented

---

### Migration 080 — dx_resource_norm (Resource Norms)

**Date:** 2026-02-10  
**File:** `migrations/080_create_dx_resource_norm.sql`  
**Tables Touched:** `dx_resource_norm` (NEW)  
**Reason:** Consumption norms for generating resource requirements from BOQ.

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS dx_resource_norm (
  id              BIGSERIAL PRIMARY KEY,
  boq_item_id     BIGINT,
  item_category_id BIGINT,
  resource_type   VARCHAR(20) NOT NULL,
  resource_ref_id BIGINT NOT NULL,
  qty_per_unit    NUMERIC(18,6) NOT NULL,
  uom             VARCHAR(20) NOT NULL,
  wastage_pct     NUMERIC(6,3) DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS ix_dx_resnorm_boq ON dx_resource_norm (boq_item_id);
CREATE INDEX IF NOT EXISTS ix_dx_resnorm_category ON dx_resource_norm (item_category_id);
```

**Status:** ✅ Documented

---

## Summary (Part 13)

| Migration | Table | Type | Status |
|---|---|---|---|
| 068 | `dx_wbs` | NEW | ✅ Documented |
| 069 | `dx_wbs_boq_map` | NEW | ✅ Documented |
| 070 | `dx_schedule_activity` | NEW | ✅ Documented |
| 071 | `dx_activity_relation` | NEW | ✅ Documented |
| 072 | `dx_baseline` | NEW | ✅ Documented |
| 073 | `dx_baseline_activity` | NEW | ✅ Documented |
| 074 | `dx_progress_entry` | NEW | ✅ Documented |
| 075 | `dx_progress_snapshot` | NEW | ✅ Documented |
| 076 | `dx_lookahead` | NEW | ✅ Documented |
| 077 | `dx_lookahead_task` | NEW | ✅ Documented |
| 078 | `dx_constraint` | NEW | ✅ Documented |
| 079 | `dx_resource_plan` | NEW | ✅ Documented |
| 080 | `dx_resource_norm` | NEW | ✅ Documented |

**Total new tables in Part 13:** 13  
**Total new tables across all parts:** 86 (73 + 13 from Part 13)  
**Total tables modified:** 0  
**Total rows affected:** 0

---

**Document Status:** ✅ Complete (Part 14 Updated)  
**Next Step:** Part 15 — Inventory, Stores & Material Management

---

## Part 14 — Procurement: Indent → RFQ → Comparative → Purchase Order

Part 14 adds comprehensive procurement management with 12 new tables covering indent extensions, RFQ management, quotation tracking, comparative statements, PO extensions, delivery schedules, amendments, and rate contracts.

**New Tables (12):**
- `dx_indent_extension` — Indent master data extensions with budget/stock checks
- `dx_indent_item_extension` — Indent item extensions with theoretical requirements
- `dx_rfq` — RFQ master with sealed support
- `dx_rfq_indent_map` — RFQ to indent mapping for consolidation
- `dx_rfq_vendor` — RFQ vendor invitations with portal tokens
- `dx_quotation` — Quotation master with landed rate computation
- `dx_quotation_item` — Quotation line items with technical evaluation
- `dx_comparative` — Comparative statement with evaluation basis
- `dx_comparative_recommendation` — CS recommendations with deviation reasons
- `dx_po_extension` — PO extensions with 7 release gates
- `dx_po_delivery_schedule` — PO delivery schedules with revision tracking
- `dx_po_amendment` — PO amendments with before/after snapshots

**Total new tables in Part 14:** 12  
**Total new tables across all parts:** 98 (86 + 12 from Part 14)  
**Total tables modified:** 0  
**Total rows affected:** 0

---

## Part 15 — Inventory, Stores & Material Management

Part 15 adds comprehensive inventory and material management with 14 new tables covering append-only stock ledger, GRN extensions with three-way match, issue extensions with cost destination, consumption reconciliation, transfers, returns, adjustments, scrap/damage, stock take with blind count, and valuation configuration.

**New Tables (14):**
- `dx_stock_ledger` — Append-only stock ledger with hash chaining
- `dx_grn_extension` — GRN master data extensions with three-way match
- `dx_grn_item_extension` — GRN line item extensions with batch tracking
- `dx_issue_extension` — Issue master data extensions with cost destination
- `dx_material_consumption` — Consumption reconciliation (theoretical vs actual)
- `dx_material_transfer` — Transfer master with in-transit tracking
- `dx_material_transfer_item` — Transfer line items
- `dx_material_return` — Return to store with grading
- `dx_return_to_vendor` — Return to vendor with debit note
- `dx_stock_adjustment` — Stock adjustments with approval workflow
- `dx_scrap_damage` — Scrap and damage tracking
- `dx_stock_take` — Stock take master with blind count
- `dx_stock_take_line` — Stock take line items with variance
- `dx_valuation_config` — Valuation method configuration

**Total new tables in Part 15:** 14  
**Total new tables across all parts:** 112 (98 + 14 from Part 15)  
**Total tables modified:** 0  
**Total rows affected:** 0

---

**Document Status:** ✅ Complete (Part 16 Updated)  
**Next Step:** Part 17 — Measurement Book / e-MB & Quantity Survey

---

## Part 16 — Subcontractor & Work Order Management

Part 16 adds comprehensive subcontractor management with 10 new tables covering work order management with margin checking, free-issue material recovery, SC billing with automated deduction engine, labour compliance tracking, backcharges, retention/advance ledgers, SC performance scoring, and DLP tracking.

**New Tables (10):**
- `dx_work_order` — Work order master with margin and compliance tracking
- `dx_work_order_item` — WO line items with BOQ linkage and margin calculation
- `dx_wo_amendment` — WO amendments with before/after snapshots
- `dx_free_issue_account` — Free-issue material tracking with recovery
- `dx_sc_bill` — SC bill master with certification chain
- `dx_sc_bill_item` — SC bill line items
- `dx_sc_bill_deduction` — Automated and manual deductions
- `dx_sc_compliance_period` — Labour compliance (PF/ESIC/wage) tracking
- `dx_backcharge` — Backcharge tracking with recovery
- `dx_sc_performance` — SC performance scoring

**Total new tables in Part 16:** 10  
**Total new tables across all parts:** 122 (112 + 10 from Part 16)  
**Total tables modified:** 0  
**Total rows affected:** 0

---

**Document Status:** ✅ Complete (Part 16 Updated)  
**Next Step:** Part 17 — Measurement Book / e-MB & Quantity Survey
