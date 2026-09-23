-- Part 17 — Shared Enterprise UI Component System Tables
-- 
-- Creates the infrastructure for dashboards, widgets, and saved views:
-- 1. dx_dashboard - Dashboard definitions (personal and role defaults)
-- 2. dx_dashboard_widget - Widget instances within dashboards
-- 3. dx_saved_view - Saved table/list views with filters and columns
--
-- All tables follow additive-only policy with dx_ prefix.

-- ═══════════════════════════════════════════════════════════════════════════
-- DASHBOARD
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_dashboard (
  id                  BIGSERIAL PRIMARY KEY,
  dashboard_key       VARCHAR(100) NOT NULL,
  dashboard_name      VARCHAR(150) NOT NULL,
  owner_user_id       BIGINT,                -- NULL = system/role default
  template_id         BIGINT,                -- responsibility template default
  project_id          BIGINT,                -- NULL = applies to all projects
  company_id          BIGINT,
  is_default          BOOLEAN NOT NULL DEFAULT FALSE,
  is_system           BOOLEAN NOT NULL DEFAULT FALSE,
  layout_json         JSONB NOT NULL,
  refresh_interval_s  INT NOT NULL DEFAULT 300,
  created_by          BIGINT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version             INT NOT NULL DEFAULT 1,
  CONSTRAINT uq_dx_dashboard_key UNIQUE (dashboard_key, owner_user_id, project_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_dash_owner ON dx_dashboard (owner_user_id, project_id);
CREATE INDEX IF NOT EXISTS ix_dx_dash_template ON dx_dashboard (template_id, project_id);
CREATE INDEX IF NOT EXISTS ix_dx_dash_default ON dx_dashboard (is_default, owner_user_id);

COMMENT ON TABLE dx_dashboard IS
  'Dashboard definitions - personal dashboards and role/project defaults';

COMMENT ON COLUMN dx_dashboard.owner_user_id IS
  'NULL for system/role defaults, user ID for personal dashboards';

COMMENT ON COLUMN dx_dashboard.layout_json IS
  'JSON containing grid layout, widget positions, and configuration';

-- ═══════════════════════════════════════════════════════════════════════════
-- DASHBOARD WIDGET
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_dashboard_widget (
  id              BIGSERIAL PRIMARY KEY,
  dashboard_id    BIGINT NOT NULL REFERENCES dx_dashboard(id) ON DELETE CASCADE,
  widget_key      VARCHAR(120) NOT NULL,
  widget_type     VARCHAR(40)  NOT NULL,   -- KPI|CHART|TABLE|LIST|TILE|CUSTOM
  kpi_key         VARCHAR(120),
  title_override  VARCHAR(200),
  grid_x          INT NOT NULL,
  grid_y          INT NOT NULL,
  grid_w          INT NOT NULL DEFAULT 1,
  grid_h          INT NOT NULL DEFAULT 1,
  config_json     JSONB,
  is_mandatory    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_widget_key UNIQUE (dashboard_id, widget_key)
);

CREATE INDEX IF NOT EXISTS ix_dx_widget_dash ON dx_dashboard_widget (dashboard_id);
CREATE INDEX IF NOT EXISTS ix_dx_widget_type ON dx_dashboard_widget (widget_type);

COMMENT ON TABLE dx_dashboard_widget IS
  'Widget instances within dashboards - KPI cards, charts, tables, etc.';

COMMENT ON COLUMN dx_dashboard_widget.widget_type IS
  'KPI: Key Performance Indicator card, CHART: Analytical chart, TABLE: Data table, LIST: Item list, TILE: Launchpad tile, CUSTOM: Custom component';

COMMENT ON COLUMN dx_dashboard_widget.grid_x IS
  'Grid column position (0-based)';

COMMENT ON COLUMN dx_dashboard_widget.grid_y IS
  'Grid row position (0-based)';

COMMENT ON COLUMN dx_dashboard_widget.grid_w IS
  'Grid width in columns (1, 2, or 4)';

COMMENT ON COLUMN dx_dashboard_widget.grid_h IS
  'Grid height in rows (1 or 2)';

COMMENT ON COLUMN dx_dashboard_widget.config_json IS
  'Widget-specific configuration (chart type, filters, drill target, etc.)';

-- ═══════════════════════════════════════════════════════════════════════════
-- SAVED VIEW
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_saved_view (
  id              BIGSERIAL PRIMARY KEY,
  view_key        VARCHAR(120) NOT NULL,
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
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_view_key UNIQUE (view_key, owner_user_id, screen_key)
);

CREATE INDEX IF NOT EXISTS ix_dx_view_screen ON dx_saved_view (screen_key, owner_user_id);
CREATE INDEX IF NOT EXISTS ix_dx_view_shared ON dx_saved_view (is_shared, screen_key);
CREATE INDEX IF NOT EXISTS ix_dx_view_default ON dx_saved_view (is_default, owner_user_id, screen_key);

COMMENT ON TABLE dx_saved_view IS
  'Saved table/list views with column selection, filters, sort, and grouping';

COMMENT ON COLUMN dx_saved_view.config_json IS
  'JSON containing columns, filters, sort, grouping, page size, and other view settings';

COMMENT ON COLUMN dx_saved_view.is_shared IS
  'TRUE = view is shared to project or template, FALSE = personal only';

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Default Dashboards)
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert system default dashboards for common roles
-- In production, these would be managed by administrators via the dashboard builder

INSERT INTO dx_dashboard (dashboard_key, dashboard_name, owner_user_id, template_id, is_default, is_system, layout_json, refresh_interval_s, created_by) VALUES
-- Project Manager Dashboard
('pm_default', 'Project Manager Dashboard', NULL, NULL, TRUE, TRUE, 
 '{"grid": {"columns": 4, "rowHeight": 200}, "widgets": []}', 300, 1),

-- Commercial Manager Dashboard
('cm_default', 'Commercial Manager Dashboard', NULL, NULL, TRUE, TRUE,
 '{"grid": {"columns": 4, "rowHeight": 200}, "widgets": []}', 300, 1),

-- Site Engineer Dashboard
('se_default', 'Site Engineer Dashboard', NULL, NULL, TRUE, TRUE,
 '{"grid": {"columns": 4, "rowHeight": 200}, "widgets": []}', 300, 1),

-- Store Keeper Dashboard
('sk_default', 'Store Keeper Dashboard', NULL, NULL, TRUE, TRUE,
 '{"grid": {"columns": 4, "rowHeight": 200}, "widgets": []}', 300, 1),

-- Finance Manager Dashboard
('fm_default', 'Finance Manager Dashboard', NULL, NULL, TRUE, TRUE,
 '{"grid": {"columns": 4, "rowHeight": 200}, "widgets": []}', 300, 1);
