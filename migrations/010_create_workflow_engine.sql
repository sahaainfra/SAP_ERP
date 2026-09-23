-- Part 10 — Workflow & Approval Engine Tables
-- 
-- Creates the workflow framework tables:
-- 1. dx_workflow_definition - Workflow definitions with versioning
-- 2. dx_workflow_step - Steps within a workflow
-- 3. dx_workflow_instance - Running workflow instances
-- 4. dx_workflow_task - Tasks assigned to approvers
-- 5. dx_workflow_log - Immutable audit log for workflow events
-- 6. dx_substitution - Out-of-office substitution rules
-- 7. dx_working_calendar - Working days/hours for SLA calculation
--
-- All tables are additive and follow the dx_ prefix convention.

-- ═══════════════════════════════════════════════════════════════════════════
-- WORKFLOW DEFINITION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_workflow_definition (
  id              BIGSERIAL PRIMARY KEY,
  workflow_code   VARCHAR(60) NOT NULL,
  document_type   VARCHAR(40) NOT NULL,          -- PO|INDENT|CLIENT_BILL|SC_BILL|MB|PAYMENT|...
  scope_type      VARCHAR(20) NOT NULL,          -- GLOBAL|COMPANY|PROJECT
  scope_id        BIGINT,
  version         INTEGER NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  description     TEXT,
  created_by      BIGINT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  activated_by    BIGINT,
  activated_at    TIMESTAMPTZ,
  CONSTRAINT uq_dx_wfdef UNIQUE (workflow_code, scope_type, scope_id, version)
);

CREATE INDEX IF NOT EXISTS ix_dx_wfdef_active ON dx_workflow_definition (document_type, scope_type, scope_id, is_active);

COMMENT ON TABLE dx_workflow_definition IS
  'Workflow definitions with versioning - editing creates new version';

COMMENT ON COLUMN dx_workflow_definition.is_active IS
  'Only one active version per (workflow_code, scope_type, scope_id)';

-- ═══════════════════════════════════════════════════════════════════════════
-- WORKFLOW STEP
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_workflow_step (
  id                BIGSERIAL PRIMARY KEY,
  definition_id     BIGINT NOT NULL REFERENCES dx_workflow_definition(id),
  step_no           SMALLINT NOT NULL,
  step_name         VARCHAR(120) NOT NULL,
  step_type         VARCHAR(20) NOT NULL,         -- APPROVAL|REVIEW|NOTIFY|CONDITION|PARALLEL_GROUP
  precondition      JSONB,                        -- expression; step skipped when false
  approver_rule     JSONB NOT NULL,               -- discriminated union of approver rules
  completion_rule   VARCHAR(20) NOT NULL DEFAULT 'ALL',  -- ALL|ANY|QUORUM
  quorum_count      SMALLINT,
  sla_hours         NUMERIC(8,2),
  escalation_rule   JSONB,
  allow_delegate    BOOLEAN DEFAULT TRUE,
  allow_reject_to   VARCHAR(20) DEFAULT 'ORIGINATOR', -- ORIGINATOR|PREVIOUS_STEP|SPECIFIC
  is_final          BOOLEAN DEFAULT FALSE,
  on_reject         VARCHAR(20) DEFAULT 'RETURN',  -- RETURN|TERMINATE
  CONSTRAINT uq_dx_wfstep UNIQUE (definition_id, step_no)
);

CREATE INDEX IF NOT EXISTS ix_dx_wfstep_def ON dx_workflow_step (definition_id, step_no);

COMMENT ON TABLE dx_workflow_step IS
  'Steps within a workflow definition - immutable once instance starts';

COMMENT ON COLUMN dx_workflow_step.approver_rule IS
  'JSON discriminated union: PERMISSION, AUTHORITY_CHAIN, RESPONSIBILITY, SUPERVISOR_HIERARCHY, SPECIFIC_USERS, APPROVAL_GROUP, DOCUMENT_FIELD, COST_CODE_OWNER, AUTO_APPROVE';

COMMENT ON COLUMN dx_workflow_step.completion_rule IS
  'ALL: all approvers must approve, ANY: first approval completes, QUORUM: N approvals required';

-- ═══════════════════════════════════════════════════════════════════════════
-- WORKFLOW INSTANCE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_workflow_instance (
  id                  BIGSERIAL PRIMARY KEY,
  definition_id       BIGINT NOT NULL REFERENCES dx_workflow_definition(id),
  definition_version  INTEGER NOT NULL,          -- frozen: version at submission time
  document_type       VARCHAR(40) NOT NULL,
  document_id         BIGINT NOT NULL,
  project_id          BIGINT,
  company_id          BIGINT,
  document_value      NUMERIC(18,2),
  currency_code       CHAR(3),
  status              VARCHAR(20) NOT NULL,      -- RUNNING|APPROVED|REJECTED|WITHDRAWN|TERMINATED
  current_step        SMALLINT,
  submitted_by        BIGINT NOT NULL,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  outcome_note        TEXT,
  context_snapshot    JSONB NOT NULL,            -- frozen attributes for auditability
  content_hash        VARCHAR(64),               -- document content hash for tamper detection
  CONSTRAINT uq_dx_wfinst UNIQUE (document_type, document_id, submitted_at)
);

CREATE INDEX IF NOT EXISTS ix_dx_wfinst_doc ON dx_workflow_instance (document_type, document_id);
CREATE INDEX IF NOT EXISTS ix_dx_wfinst_status ON dx_workflow_instance (status, submitted_at);
CREATE INDEX IF NOT EXISTS ix_dx_wfinst_project ON dx_workflow_instance (project_id, status);

COMMENT ON TABLE dx_workflow_instance IS
  'Running workflow instances - immutable history';

COMMENT ON COLUMN dx_workflow_instance.definition_version IS
  'Frozen at submission - running instances continue on their version even after new version activated';

COMMENT ON COLUMN dx_workflow_instance.context_snapshot IS
  'Document attributes at submission time - used for precondition evaluation and audit';

-- ═══════════════════════════════════════════════════════════════════════════
-- WORKFLOW TASK
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_workflow_task (
  id                    BIGSERIAL PRIMARY KEY,
  instance_id           BIGINT NOT NULL REFERENCES dx_workflow_instance(id),
  step_no               SMALLINT NOT NULL,
  step_name             VARCHAR(120) NOT NULL,
  assignee_id           BIGINT NOT NULL,
  assigned_via          VARCHAR(30) NOT NULL,    -- RULE|SUBSTITUTE|DELEGATION|ESCALATION|REASSIGN
  original_assignee_id  BIGINT,
  assigned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at                TIMESTAMPTZ,
  status                VARCHAR(20) NOT NULL,    -- PENDING|APPROVED|REJECTED|RETURNED|SKIPPED|EXPIRED|CANCELLED
  decision_at           TIMESTAMPTZ,
  decision_note         TEXT,
  decided_from_ip       VARCHAR(45),
  decided_device        VARCHAR(40),
  escalation_level      SMALLINT DEFAULT 0,
  reminder_count        SMALLINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_dx_wftask_inbox ON dx_workflow_task (assignee_id, status, due_at);
CREATE INDEX IF NOT EXISTS ix_dx_wftask_instance ON dx_workflow_task (instance_id, step_no);
CREATE INDEX IF NOT EXISTS ix_dx_wftask_due ON dx_workflow_task (due_at, status) WHERE status = 'PENDING';

COMMENT ON TABLE dx_workflow_task IS
  'Tasks assigned to approvers - one row per assignee per step';

COMMENT ON COLUMN dx_workflow_task.assigned_via IS
  'How this assignment was made: RULE (normal), SUBSTITUTE (out-of-office), DELEGATION, ESCALATION, REASSIGN';

COMMENT ON COLUMN dx_workflow_task.escalation_level IS
  'How many times this task has been escalated (0 = not escalated)';

-- ═══════════════════════════════════════════════════════════════════════════
-- WORKFLOW LOG
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_workflow_log (
  id            BIGSERIAL PRIMARY KEY,
  instance_id   BIGINT NOT NULL REFERENCES dx_workflow_instance(id),
  event_type    VARCHAR(40) NOT NULL,            -- SUBMITTED|STEP_SKIPPED|AUTO_APPROVED|TASK_APPROVED|TASK_REJECTED|TASK_RETURNED|ESCALATED|etc.
  step_no       SMALLINT,
  actor_id      BIGINT,
  payload       JSONB,
  logged_at     TIMESTAMPTZ DEFAULT NOW(),
  row_hash      CHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_dx_wflog_instance ON dx_workflow_log (instance_id, logged_at);
CREATE INDEX IF NOT EXISTS ix_dx_wflog_event ON dx_workflow_log (event_type, logged_at);

COMMENT ON TABLE dx_workflow_log IS
  'Immutable audit log for workflow events - hash-chained for tamper detection';

-- ═══════════════════════════════════════════════════════════════════════════
-- SUBSTITUTION (OUT OF OFFICE)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_substitution (
  id                    BIGSERIAL PRIMARY KEY,
  user_id               BIGINT NOT NULL,
  substitute_user_id    BIGINT NOT NULL,
  document_types        JSONB,                   -- null = all document types
  project_ids           JSONB,                   -- null = all user''s projects
  valid_from            TIMESTAMPTZ NOT NULL,
  valid_to              TIMESTAMPTZ NOT NULL,
  mode                  VARCHAR(20) NOT NULL,    -- FORWARD (reassign) | COPY (both see it)
  reason                VARCHAR(200),
  created_by            BIGINT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ck_dx_sub_self CHECK (user_id <> substitute_user_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_sub_user ON dx_substitution (user_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS ix_dx_sub_substitute ON dx_substitution (substitute_user_id, valid_from, valid_to);

COMMENT ON TABLE dx_substitution IS
  'Out-of-office substitution rules - substitute must independently hold permission and authority';

COMMENT ON COLUMN dx_substitution.mode IS
  'FORWARD: task reassigned to substitute, COPY: both user and substitute see task';

-- ═══════════════════════════════════════════════════════════════════════════
-- WORKING CALENDAR (for SLA calculation)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_working_calendar (
  id              BIGSERIAL PRIMARY KEY,
  calendar_name   VARCHAR(100) NOT NULL,
  scope_type      VARCHAR(20) NOT NULL,          -- GLOBAL|COMPANY|PROJECT
  scope_id        BIGINT,
  working_days    INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',  -- 1=Monday, 7=Sunday
  working_hours   JSONB NOT NULL,                -- { "start": "09:00", "end": "18:00" }
  holidays        JSONB,                         -- array of { date, name }
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_dx_calendar UNIQUE (scope_type, scope_id)
);

COMMENT ON TABLE dx_working_calendar IS
  'Working days/hours for SLA calculation - used by SlaService';

COMMENT ON COLUMN dx_working_calendar.working_days IS
  'Array of working day numbers: 1=Monday, 2=Tuesday, ..., 7=Sunday';

COMMENT ON COLUMN dx_working_calendar.working_hours IS
  'JSON object with start and end times for each working day';
