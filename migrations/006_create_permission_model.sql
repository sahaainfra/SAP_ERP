-- Part 06 — User, Role, Responsibility & Permission Model
-- 
-- This migration creates the complete permission model that layers on top of
-- the existing roles and permissions system. It provides project-scoped
-- authorization with responsibility templates, approval authorities, delegation,
-- field restrictions, and segregation of duties.
--
-- Key principle: A user may hold different roles, responsibilities, authorities
-- and permissions on different projects.

-- ═══════════════════════════════════════════════════════════════════════════
-- PERMISSION CATALOGUE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_permission (
  id              BIGSERIAL PRIMARY KEY,
  permission_key  VARCHAR(150) NOT NULL UNIQUE,   -- 'procure.po.approve'
  module          VARCHAR(50)  NOT NULL,
  entity          VARCHAR(80)  NOT NULL,
  action          VARCHAR(40)  NOT NULL,
  label           VARCHAR(200) NOT NULL,
  description     TEXT,
  is_sensitive    BOOLEAN NOT NULL DEFAULT FALSE, -- financial/HR data
  requires_limit  BOOLEAN NOT NULL DEFAULT FALSE, -- needs a monetary authority limit
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_perm_module ON dx_permission (module, entity);
CREATE INDEX IF NOT EXISTS ix_dx_perm_key ON dx_permission (permission_key);

COMMENT ON TABLE dx_permission IS
  'Permission catalogue: every permission key that exists in the system';

COMMENT ON COLUMN dx_permission.permission_key IS
  'Format: module.entity.action (e.g., procure.po.approve)';

COMMENT ON COLUMN dx_permission.is_sensitive IS
  'TRUE for financial/HR data requiring special handling';

COMMENT ON COLUMN dx_permission.requires_limit IS
  'TRUE if this permission needs a monetary authority limit';

-- ═══════════════════════════════════════════════════════════════════════════
-- RESPONSIBILITY TEMPLATES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_responsibility_template (
  id                BIGSERIAL PRIMARY KEY,
  template_code     VARCHAR(50)  NOT NULL UNIQUE,
  template_name     VARCHAR(150) NOT NULL,
  description       TEXT,
  category          VARCHAR(50),        -- execution / commercial / finance / support
  is_system         BOOLEAN NOT NULL DEFAULT FALSE,  -- system templates cannot be deleted
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  company_id        BIGINT,             -- NULL = available to all companies
  created_by        BIGINT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        BIGINT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_dx_tmpl_category ON dx_responsibility_template (category);

COMMENT ON TABLE dx_responsibility_template IS
  'Responsibility templates: named, reusable bundles of permissions';

COMMENT ON COLUMN dx_responsibility_template.is_system IS
  'System templates cannot be deleted, only edited';

CREATE TABLE IF NOT EXISTS dx_responsibility_template_permission (
  id              BIGSERIAL PRIMARY KEY,
  template_id     BIGINT NOT NULL REFERENCES dx_responsibility_template(id) ON DELETE CASCADE,
  permission_id   BIGINT NOT NULL REFERENCES dx_permission(id),
  is_granted      BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_dx_tmpl_perm UNIQUE (template_id, permission_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_tmpl_perm_template ON dx_responsibility_template_permission (template_id);

COMMENT ON TABLE dx_responsibility_template_permission IS
  'Maps permissions to responsibility templates';

-- ═══════════════════════════════════════════════════════════════════════════
-- PROJECT ASSIGNMENT (CORE TABLE)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_project_assignment (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL,
  project_id          BIGINT NOT NULL,
  company_id          BIGINT NOT NULL,
  template_id         BIGINT REFERENCES dx_responsibility_template(id),
  designation_label   VARCHAR(150),        -- 'Project Manager — Package 2'
  is_primary_project  BOOLEAN NOT NULL DEFAULT FALSE,
  reports_to_user_id  BIGINT,              -- project-specific reporting line
  data_scope          VARCHAR(30) NOT NULL DEFAULT 'PROJECT',
                       -- OWN | SITE | PACKAGE | PROJECT | ALL_ASSIGNED
  valid_from          DATE NOT NULL,
  valid_to            DATE,                -- NULL = open-ended
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                       -- ACTIVE | SUSPENDED | EXPIRED | REVOKED
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
  CONSTRAINT uq_dx_proj_assign UNIQUE (user_id, project_id, valid_from),
  CONSTRAINT ck_dx_pa_dates CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE INDEX IF NOT EXISTS ix_dx_pa_user    ON dx_project_assignment (user_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_pa_project ON dx_project_assignment (project_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_pa_lookup  ON dx_project_assignment (user_id, project_id, status, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS ix_dx_pa_company ON dx_project_assignment (company_id, status);

COMMENT ON TABLE dx_project_assignment IS
  'Core table: user × project assignment with responsibility template';

COMMENT ON COLUMN dx_project_assignment.data_scope IS
  'OWN = only own records, SITE = assigned sites, PACKAGE = assigned packages, PROJECT = entire project, ALL_ASSIGNED = all assigned projects';

COMMENT ON COLUMN dx_project_assignment.status IS
  'ACTIVE = current, SUSPENDED = temporarily disabled, EXPIRED = past valid_to, REVOKED = explicitly revoked';

-- ═══════════════════════════════════════════════════════════════════════════
-- ASSIGNMENT PERMISSION OVERRIDES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_assignment_permission (
  id              BIGSERIAL PRIMARY KEY,
  assignment_id   BIGINT NOT NULL REFERENCES dx_project_assignment(id) ON DELETE CASCADE,
  permission_id   BIGINT NOT NULL REFERENCES dx_permission(id),
  is_granted      BOOLEAN NOT NULL,    -- TRUE = explicit grant, FALSE = explicit DENY
  source          VARCHAR(20) NOT NULL DEFAULT 'OVERRIDE', -- TEMPLATE | OVERRIDE
  granted_by      BIGINT NOT NULL,
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason          TEXT,
  CONSTRAINT uq_dx_assign_perm UNIQUE (assignment_id, permission_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_ap_assignment ON dx_assignment_permission (assignment_id);

COMMENT ON TABLE dx_assignment_permission IS
  'Per-assignment permission overrides (grant or deny a single key)';

COMMENT ON COLUMN dx_assignment_permission.is_granted IS
  'TRUE = explicit grant, FALSE = explicit DENY (DENY always wins)';

-- ═══════════════════════════════════════════════════════════════════════════
-- APPROVAL AUTHORITY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_approval_authority (
  id                  BIGSERIAL PRIMARY KEY,
  assignment_id       BIGINT NOT NULL REFERENCES dx_project_assignment(id) ON DELETE CASCADE,
  document_type       VARCHAR(50) NOT NULL,   -- PR | PO | MR | GRN | MB | RA_BILL | PAYMENT | JV
  approval_level      INT NOT NULL DEFAULT 1, -- position in the approval chain
  min_amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
  max_amount          NUMERIC(18,2),          -- NULL = unlimited
  currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
  can_approve         BOOLEAN NOT NULL DEFAULT TRUE,
  can_reject          BOOLEAN NOT NULL DEFAULT TRUE,
  can_return          BOOLEAN NOT NULL DEFAULT TRUE,
  can_forward         BOOLEAN NOT NULL DEFAULT FALSE,
  can_delegate        BOOLEAN NOT NULL DEFAULT FALSE,
  can_approve_own     BOOLEAN NOT NULL DEFAULT FALSE,  -- almost always FALSE
  requires_two_person BOOLEAN NOT NULL DEFAULT FALSE,
  sla_hours           INT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_auth UNIQUE (assignment_id, document_type, approval_level)
);

CREATE INDEX IF NOT EXISTS ix_dx_auth_doc ON dx_approval_authority (document_type, is_active);
CREATE INDEX IF NOT EXISTS ix_dx_auth_assignment ON dx_approval_authority (assignment_id);

COMMENT ON TABLE dx_approval_authority IS
  'Approval authority per assignment, per document type, per value band';

COMMENT ON COLUMN dx_approval_authority.max_amount IS
  'NULL means unlimited approval authority';

COMMENT ON COLUMN dx_approval_authority.can_approve_own IS
  'Almost always FALSE - prevents self-approval';

-- ═══════════════════════════════════════════════════════════════════════════
-- ASSIGNMENT SCOPE (Site/Package Restriction)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_assignment_scope (
  id              BIGSERIAL PRIMARY KEY,
  assignment_id   BIGINT NOT NULL REFERENCES dx_project_assignment(id) ON DELETE CASCADE,
  scope_type      VARCHAR(20) NOT NULL,   -- SITE | PACKAGE | WBS | COST_CENTRE | STORE
  scope_id        BIGINT NOT NULL,
  is_included     BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_dx_assign_scope UNIQUE (assignment_id, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_as_assignment ON dx_assignment_scope (assignment_id);
CREATE INDEX IF NOT EXISTS ix_dx_as_scope ON dx_assignment_scope (scope_type, scope_id);

COMMENT ON TABLE dx_assignment_scope IS
  'Site/package restriction inside a project';

-- ═══════════════════════════════════════════════════════════════════════════
-- DELEGATION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_delegation (
  id                  BIGSERIAL PRIMARY KEY,
  from_user_id        BIGINT NOT NULL,
  to_user_id          BIGINT NOT NULL,
  project_id          BIGINT,             -- NULL = all projects of from_user
  document_types      TEXT,               -- JSON array; NULL = all
  max_amount          NUMERIC(18,2),      -- may be lower than the delegator's own limit
  valid_from          TIMESTAMPTZ NOT NULL,
  valid_to            TIMESTAMPTZ NOT NULL,
  reason              TEXT NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|EXPIRED|REVOKED
  created_by          BIGINT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_by          BIGINT,
  revoked_at          TIMESTAMPTZ,
  CONSTRAINT ck_dx_deleg_dates CHECK (valid_to > valid_from),
  CONSTRAINT ck_dx_deleg_self  CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_deleg_to ON dx_delegation (to_user_id, status, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS ix_dx_deleg_from ON dx_delegation (from_user_id, status);

COMMENT ON TABLE dx_delegation IS
  'Temporary delegation of approval authority';

COMMENT ON COLUMN dx_delegation.document_types IS
  'JSON array of document types; NULL means all types';

-- ═══════════════════════════════════════════════════════════════════════════
-- FIELD RESTRICTION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_field_restriction (
  id              BIGSERIAL PRIMARY KEY,
  assignment_id   BIGINT NOT NULL REFERENCES dx_project_assignment(id) ON DELETE CASCADE,
  entity          VARCHAR(80) NOT NULL,
  field_name      VARCHAR(80) NOT NULL,
  visibility      VARCHAR(20) NOT NULL,  -- VISIBLE | MASKED | HIDDEN
  CONSTRAINT uq_dx_field_restr UNIQUE (assignment_id, entity, field_name)
);

CREATE INDEX IF NOT EXISTS ix_dx_fr_assignment ON dx_field_restriction (assignment_id);

COMMENT ON TABLE dx_field_restriction IS
  'Field-level visibility (hide salary, margin, rates)';

COMMENT ON COLUMN dx_field_restriction.visibility IS
  'VISIBLE = shown, MASKED = shown as ****, HIDDEN = not in response';

-- ═══════════════════════════════════════════════════════════════════════════
-- SEGREGATION OF DUTIES RULES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_sod_rule (
  id                  BIGSERIAL PRIMARY KEY,
  rule_code           VARCHAR(50) NOT NULL UNIQUE,
  rule_name           VARCHAR(200) NOT NULL,
  permission_a_id     BIGINT NOT NULL REFERENCES dx_permission(id),
  permission_b_id     BIGINT NOT NULL REFERENCES dx_permission(id),
  severity            VARCHAR(20) NOT NULL DEFAULT 'WARNING', -- WARNING | BLOCK
  rationale           TEXT NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT ck_dx_sod_diff CHECK (permission_a_id <> permission_b_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_sod_active ON dx_sod_rule (is_active);

COMMENT ON TABLE dx_sod_rule IS
  'Segregation of duties rules: conflicting permission pairs';

COMMENT ON COLUMN dx_sod_rule.severity IS
  'WARNING = requires acknowledgement, BLOCK = prevents saving';

-- ═══════════════════════════════════════════════════════════════════════════
-- ASSIGNMENT AUDIT (IMMUTABLE)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_assignment_audit (
  id                BIGSERIAL PRIMARY KEY,
  assignment_id     BIGINT,
  user_id           BIGINT NOT NULL,
  project_id        BIGINT NOT NULL,
  action            VARCHAR(40) NOT NULL,  -- ASSIGNED|MODIFIED|SUSPENDED|REACTIVATED|REVOKED|EXPIRED|DELEGATED
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
CREATE INDEX IF NOT EXISTS ix_dx_aa_action  ON dx_assignment_audit (action, changed_at DESC);

COMMENT ON TABLE dx_assignment_audit IS
  'Immutable assignment audit trail - REVOKE UPDATE/DELETE from application user';

COMMENT ON COLUMN dx_assignment_audit.action IS
  'ASSIGNED|MODIFIED|SUSPENDED|REACTIVATED|REVOKED|EXPIRED|DELEGATED';

-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY: REVOKE UPDATE/DELETE ON AUDIT TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- In production, execute these as a superuser:
-- REVOKE UPDATE, DELETE ON dx_assignment_audit FROM application_user;
-- REVOKE UPDATE, DELETE ON dx_assignment_audit FROM PUBLIC;

-- For now, we document the requirement:
COMMENT ON TABLE dx_assignment_audit IS
  'Immutable audit trail - UPDATE and DELETE must be revoked from application database user';
