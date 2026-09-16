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

**Document Status:** ✅ Complete  
**Next Step:** Part 4 — Real-time Data Engine (will add cache and event tables)
