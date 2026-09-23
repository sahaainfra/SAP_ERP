-- Part 24 — Task & Work Management Tables
-- 
-- Creates the task management infrastructure:
-- 1. dx_task - Core task table with seven sources
-- 2. dx_task_comment - Task comments and activity log
--
-- All tables follow additive-only policy with dx_ prefix.

-- ═══════════════════════════════════════════════════════════════════════════
-- TASK
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_task (
  id                BIGSERIAL PRIMARY KEY,
  task_number       VARCHAR(40) NOT NULL UNIQUE,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  task_type         VARCHAR(40) NOT NULL,   -- MANUAL|SYSTEM|WORKFLOW|ALERT|CHAT|RECURRING|CHECKLIST
  source_entity     VARCHAR(80),            -- Entity that created this task (e.g., 'consumption_variance')
  source_id         BIGINT,                 -- ID of source entity
  company_id        BIGINT,
  project_id        BIGINT,
  site_id           BIGINT,
  assigned_to       BIGINT NOT NULL,        -- Owner (TASK-04: cannot be blank)
  assigned_by       BIGINT,
  assigned_at       TIMESTAMPTZ,
  due_at            TIMESTAMPTZ,
  priority          VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW|MEDIUM|HIGH|CRITICAL
  status            VARCHAR(20) NOT NULL DEFAULT 'OPEN',
                     -- OPEN|IN_PROGRESS|BLOCKED|COMPLETED|CANCELLED
  progress_percent  INT NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed_at      TIMESTAMPTZ,
  completed_by      BIGINT,
  completion_note   TEXT,                   -- TASK-02: Resolution requirement
  blocked_reason    TEXT,                   -- Required when status = BLOCKED
  parent_task_id    BIGINT REFERENCES dx_task(id),
  recurrence_rule   VARCHAR(100),           -- Cron expression for RECURRING tasks
  resolution_requires JSONB,                -- TASK-02: What's needed to close
                     -- e.g., {"type": "text", "minLength": 20}
                     -- e.g., {"type": "attachment"}
                     -- e.g., {"type": "linked_document", "entityType": "NCR"}
                     -- e.g., {"type": "reviewer_acceptance", "reviewerRule": {...}}
  reviewer_rule     JSONB,                  -- TASK-03: Who must review (if any)
  reviewer_id       BIGINT,                 -- Assigned reviewer
  reviewer_accepted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_task_assignee ON dx_task (assigned_to, status, due_at);
CREATE INDEX IF NOT EXISTS ix_dx_task_project  ON dx_task (project_id, status);
CREATE INDEX IF NOT EXISTS ix_dx_task_due      ON dx_task (due_at, status) WHERE status IN ('OPEN', 'IN_PROGRESS');
CREATE INDEX IF NOT EXISTS ix_dx_task_type     ON dx_task (task_type, status);
CREATE INDEX IF NOT EXISTS ix_dx_task_source   ON dx_task (source_entity, source_id);
CREATE INDEX IF NOT EXISTS ix_dx_task_parent   ON dx_task (parent_task_id);

COMMENT ON TABLE dx_task IS
  'Task management with seven sources: Manual, System, Workflow, Alert, Chat, Recurring, Checklist';

COMMENT ON COLUMN dx_task.task_type IS
  'MANUAL: User-created, SYSTEM: Event-driven, WORKFLOW: From approval return, ALERT: From exception, CHAT: From message, RECURRING: Scheduled, CHECKLIST: From checklist item';

COMMENT ON COLUMN dx_task.resolution_requires IS
  'TASK-02: Declares what closing the task requires (text, attachment, linked document, reviewer acceptance)';

COMMENT ON COLUMN dx_task.reviewer_rule IS
  'TASK-03: Rule for determining reviewer (e.g., responsibility template, cost code owner)';

-- ═══════════════════════════════════════════════════════════════════════════
-- TASK COMMENT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_task_comment (
  id          BIGSERIAL PRIMARY KEY,
  task_id     BIGINT NOT NULL REFERENCES dx_task(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL,
  comment     TEXT NOT NULL,
  mentions    JSONB,              -- Array of user IDs mentioned with @
  attachments JSONB,              -- Array of attachment IDs
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_task_comment_task ON dx_task_comment (task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_task_comment_user ON dx_task_comment (user_id, created_at DESC);

COMMENT ON TABLE dx_task_comment IS
  'Task comments and activity log with @mentions and attachments';

-- ═══════════════════════════════════════════════════════════════════════════
-- TASK SUBSCRIPTION (System Task Subscribers)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_task_subscription (
  id              BIGSERIAL PRIMARY KEY,
  event_type      VARCHAR(100) NOT NULL,  -- e.g., 'store.consumption.variance_detected'
  condition_expr  TEXT,                   -- Sandboxed expression over event payload
  task_title_tpl  VARCHAR(255) NOT NULL,  -- Template for task title
  task_desc_tpl   TEXT,                   -- Template for task description
  assignee_rule   JSONB NOT NULL,         -- ApproverRule from Part 10
  priority        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  due_in_hours    INT,                    -- Relative due date
  resolution_requires JSONB,
  reviewer_rule   JSONB,
  project_id_expr TEXT,                   -- Expression to extract project ID from payload
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_task_sub_event ON dx_task_subscription (event_type, is_active);

COMMENT ON TABLE dx_task_subscription IS
  'TASK-01: System tasks created by subscribers to outbox events, never by inline code';

COMMENT ON COLUMN dx_task_subscription.assignee_rule IS
  'ApproverRule determining task owner (e.g., RESPONSIBILITY template, SPECIFIC_USERS, DOCUMENT_FIELD)';

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Task Subscriptions)
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert system task subscriptions for common scenarios
INSERT INTO dx_task_subscription (event_type, condition_expr, task_title_tpl, task_desc_tpl, assignee_rule, priority, due_in_hours, resolution_requires, project_id_expr) VALUES
-- Consumption variance
('store.consumption.variance_detected', 'payload.variancePct > 10',
 'Explain {{payload.variancePct}}% consumption variance — {{payload.itemName}}',
 'Actual consumption of {{payload.itemName}} exceeds theoretical by {{payload.variancePct}}%. BOQ item: {{payload.boqItemCode}}. Theoretical: {{payload.theoreticalQty}}, Actual: {{payload.actualQty}}.',
 '{"type": "RESPONSIBILITY", "templateCode": "SITE_ENGINEER"}',
 'HIGH', 48,
 '{"type": "text", "minLength": 20}',
 'payload.projectId'),

-- Negative stock
('store.stock.negative', NULL,
 'Investigate negative stock: {{payload.itemCode}} at Store {{payload.storeId}}',
 'Item {{payload.itemCode}} has negative stock of {{payload.quantity}} {{payload.uom}} at Store {{payload.storeId}}. Immediate investigation required.',
 '{"type": "RESPONSIBILITY", "templateCode": "STORE_KEEPER"}',
 'CRITICAL', 24,
 '{"type": "text", "minLength": 10}',
 'payload.projectId'),

-- Approval SLA breach
('workflow.task.overdue', 'payload.daysOverdue > 1',
 'Follow up on overdue approval: {{payload.documentType}} {{payload.documentNumber}}',
 'Approval for {{payload.documentType}} {{payload.documentNumber}} is {{payload.daysOverdue}} days overdue. Assigned to: {{payload.assigneeName}}. Value: {{payload.value}}.',
 '{"type": "SUPERVISOR_HIERARCHY", "levelsUp": 1}',
 'HIGH', 24,
 '{"type": "text", "minLength": 10}',
 'payload.projectId'),

-- NCR overdue
('qa.ncr.overdue', NULL,
 'Close overdue NCR: {{payload.ncrNumber}}',
 'NCR {{payload.ncrNumber}} is past its closure date. Severity: {{payload.severity}}. Raised: {{payload.raisedAt}}. Days overdue: {{payload.daysOverdue}}.',
 '{"type": "RESPONSIBILITY", "templateCode": "QAQC_ENGINEER"}',
 'HIGH', 48,
 '{"type": "linked_document", "entityType": "NCR"}',
 'payload.projectId'),

-- Safety observation
('hse.observation.raised', NULL,
 'Address safety observation: {{payload.observationType}}',
 'Safety observation raised: {{payload.description}}. Location: {{payload.location}}. Severity: {{payload.severity}}.',
 '{"type": "RESPONSIBILITY", "templateCode": "SAFETY_OFFICER"}',
 'MEDIUM', 72,
 '{"type": "text", "minLength": 20}',
 'payload.projectId'),

-- Equipment maintenance due
('equipment.maintenance.due', NULL,
 'Schedule maintenance: {{payload.equipmentCode}}',
 'Equipment {{payload.equipmentCode}} ({{payload.equipmentName}}) is due for maintenance. Type: {{payload.maintenanceType}}. Due date: {{payload.dueDate}}.',
 '{"type": "RESPONSIBILITY", "templateCode": "PLANT_IN_CHARGE"}',
 'MEDIUM', 168,
 '{"type": "linked_document", "entityType": "MAINTENANCE_ORDER"}',
 'payload.projectId'),

-- Document expiry
('dms.document.expiring', 'payload.daysToExpiry <= 30',
 'Renew expiring document: {{payload.documentType}} {{payload.documentNumber}}',
 'Document {{payload.documentType}} {{payload.documentNumber}} expires in {{payload.daysToExpiry}} days. Renewal required before {{payload.expiryDate}}.',
 '{"type": "DOCUMENT_FIELD", "field": "ownerUserId"}',
 'MEDIUM', 720,
 '{"type": "linked_document", "entityType": "DOCUMENT"}',
 'payload.projectId');
