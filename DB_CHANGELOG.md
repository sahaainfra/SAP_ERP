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

**Document Status:** ✅ Complete (Part 3 Updated)  
**Next Step:** Part 4 — Real-time Data Engine
