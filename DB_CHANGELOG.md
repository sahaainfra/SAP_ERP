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

**Document Status:** ✅ Complete (Part 2 Updated)  
**Next Step:** Part 3 — Project Permission Engine
