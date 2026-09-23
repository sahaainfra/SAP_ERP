-- Part 25 — Notification & Automation Engine Tables
-- 
-- Creates the notification infrastructure:
-- 1. dx_notification - Core notification table
-- 2. dx_notification_delivery - Delivery tracking per channel
-- 3. dx_notification_preference - Per-user channel preferences
-- 4. dx_notification_template - Template-driven content
-- 5. dx_automation_rule - Automation rules for reminders/escalations
--
-- All tables follow additive-only policy with dx_ prefix.

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_notification (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  category        VARCHAR(50) NOT NULL,   -- APPROVAL|TASK|ALERT|MENTION|SYSTEM|DIGEST
  priority        VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- LOW|NORMAL|HIGH|CRITICAL
  title           VARCHAR(255) NOT NULL,
  body            TEXT,
  entity_type     VARCHAR(80),
  entity_id       BIGINT,
  action_route    VARCHAR(255),           -- Deep link with project context
  project_id      BIGINT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  is_actioned     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  group_key       VARCHAR(120),           -- For collapsing similar notifications
  group_count     INT NOT NULL DEFAULT 1, -- Number of notifications in group
  template_code   VARCHAR(100),           -- Template used for rendering
  template_vars   JSONB                   -- Variables passed to template
);

CREATE INDEX IF NOT EXISTS ix_dx_notif_user
  ON dx_notification (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_notif_category
  ON dx_notification (category, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_notif_entity
  ON dx_notification (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ix_dx_notif_group
  ON dx_notification (group_key, user_id);
CREATE INDEX IF NOT EXISTS ix_dx_notif_expires
  ON dx_notification (expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE dx_notification IS
  'Core notification table with grouping, templating, and deep links';

COMMENT ON COLUMN dx_notification.group_key IS
  'Groups similar notifications (e.g., 5 POs awaiting approval become 1 notification)';

COMMENT ON COLUMN dx_notification.action_route IS
  'Deep link that lands on the record with the right project context already applied';

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATION DELIVERY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_notification_delivery (
  id              BIGSERIAL PRIMARY KEY,
  notification_id BIGINT NOT NULL REFERENCES dx_notification(id) ON DELETE CASCADE,
  channel         VARCHAR(20) NOT NULL,   -- IN_APP|PUSH|EMAIL|SMS|WHATSAPP
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING|SENT|FAILED|SKIPPED
  attempts        INT NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ,
  error           TEXT,
  external_id     VARCHAR(255),           -- External message ID (e.g., email message ID)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_notif_del_notif
  ON dx_notification_delivery (notification_id);
CREATE INDEX IF NOT EXISTS ix_dx_notif_del_status
  ON dx_notification_delivery (status, created_at DESC);

COMMENT ON TABLE dx_notification_delivery IS
  'Delivery tracking per channel with retry and error logging';

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATION PREFERENCE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_notification_preference (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  category        VARCHAR(50) NOT NULL,
  in_app          BOOLEAN NOT NULL DEFAULT TRUE,
  push            BOOLEAN NOT NULL DEFAULT TRUE,
  email           BOOLEAN NOT NULL DEFAULT FALSE,
  sms             BOOLEAN NOT NULL DEFAULT FALSE,
  frequency       VARCHAR(20) NOT NULL DEFAULT 'IMMEDIATE', -- IMMEDIATE|HOURLY|DAILY|WEEKLY
  quiet_start     TIME,
  quiet_end       TIME,
  quiet_timezone  VARCHAR(60) DEFAULT 'Asia/Kolkata',
  project_mute    JSONB,                    -- Array of project IDs to mute
  critical_only   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_notif_pref UNIQUE (user_id, category)
);

CREATE INDEX IF NOT EXISTS ix_dx_notif_pref_user
  ON dx_notification_preference (user_id);

COMMENT ON TABLE dx_notification_preference IS
  'Per-user channel preferences with quiet hours and project muting';

COMMENT ON COLUMN dx_notification_preference.frequency IS
  'IMMEDIATE: real-time, HOURLY/DAILY/WEEKLY: digest batching';

COMMENT ON COLUMN dx_notification_preference.project_mute IS
  'JSON array of project IDs where notifications are muted for this category';

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATION TEMPLATE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_notification_template (
  id              BIGSERIAL PRIMARY KEY,
  template_code   VARCHAR(100) NOT NULL UNIQUE,
  category        VARCHAR(50) NOT NULL,
  channel         VARCHAR(20) NOT NULL,     -- IN_APP|PUSH|EMAIL|SMS
  subject         VARCHAR(255),             -- For email
  title_template  TEXT NOT NULL,            -- Supports {{variables}}
  body_template   TEXT,                     -- Supports {{variables}}
  language        VARCHAR(10) NOT NULL DEFAULT 'en',
  version         INT NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_notif_tmpl_code
  ON dx_notification_template (template_code, channel, language);

COMMENT ON TABLE dx_notification_template IS
  'Template-driven notification content with variable substitution and localization';

-- ═══════════════════════════════════════════════════════════════════════════
-- AUTOMATION RULE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_automation_rule (
  id              BIGSERIAL PRIMARY KEY,
  rule_code       VARCHAR(100) NOT NULL UNIQUE,
  rule_name       VARCHAR(200) NOT NULL,
  trigger_type    VARCHAR(50) NOT NULL,     -- REMINDER|ESCALATION|DEADLINE|AUTO_ACTION
  trigger_event   VARCHAR(100),             -- Event type that triggers this rule
  condition_expr  TEXT,                     -- Sandboxed expression over event payload
  action_type     VARCHAR(50) NOT NULL,     -- NOTIFY|ESCALATE|AUTO_APPROVE|AUTO_CLOSE|AUTO_REASSIGN
  action_config   JSONB NOT NULL,           -- Configuration for the action
  target_rule     JSONB,                    -- ApproverRule for determining target
  schedule_expr   VARCHAR(100),             -- Cron expression for scheduled rules
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_auto_rule_trigger
  ON dx_automation_rule (trigger_type, is_active);
CREATE INDEX IF NOT EXISTS ix_dx_auto_rule_event
  ON dx_automation_rule (trigger_event) WHERE trigger_event IS NOT NULL;

COMMENT ON TABLE dx_automation_rule IS
  'Automation rules for reminders, escalations, deadline monitoring, and auto-actions';

COMMENT ON COLUMN dx_automation_rule.action_config IS
  'JSON configuration for the action (e.g., notification template, escalation levels, auto-approval conditions)';

COMMENT ON COLUMN dx_automation_rule.target_rule IS
  'ApproverRule for determining who receives the notification or escalation';

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Notification Templates)
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert notification templates for common scenarios
INSERT INTO dx_notification_template (template_code, category, channel, subject, title_template, body_template) VALUES
-- Approval notifications
('approval.requested', 'APPROVAL', 'IN_APP', NULL,
 'Approval Required: {{documentType}} {{documentNumber}}',
 '{{requesterName}} has submitted {{documentType}} {{documentNumber}} for your approval. Value: {{amount}}. Due: {{dueIn}}.'),

('approval.requested', 'APPROVAL', 'EMAIL',
 'Approval Required: {{documentType}} {{documentNumber}}',
 'Approval Required',
 'Dear {{approverName}},\n\n{{requesterName}} has submitted {{documentType}} {{documentNumber}} for your approval.\n\nDocument Details:\n- Type: {{documentType}}\n- Number: {{documentNumber}}\n- Value: {{amount}}\n- Project: {{projectName}}\n- Due: {{dueIn}}\n\nPlease review and take action at your earliest convenience.\n\nView Document: {{actionRoute}}'),

('approval.requested', 'APPROVAL', 'PUSH', NULL,
 'Approval Required',
 '{{documentType}} {{documentNumber}} awaits your approval'),

('approval.approved', 'APPROVAL', 'IN_APP', NULL,
 'Approved: {{documentType}} {{documentNumber}}',
 '{{approverName}} has approved {{documentType}} {{documentNumber}}.'),

('approval.rejected', 'APPROVAL', 'IN_APP', NULL,
 'Rejected: {{documentType}} {{documentNumber}}',
 '{{approverName}} has rejected {{documentType}} {{documentNumber}}. Reason: {{reason}}'),

-- Task notifications
('task.assigned', 'TASK', 'IN_APP', NULL,
 'Task Assigned: {{taskTitle}}',
 'You have been assigned a new task: {{taskTitle}}. Due: {{dueDate}}. Priority: {{priority}}.'),

('task.overdue', 'TASK', 'IN_APP', NULL,
 'Task Overdue: {{taskTitle}}',
 'Task {{taskTitle}} is now {{daysOverdue}} days overdue. Please complete or reassign.'),

('task.completed', 'TASK', 'IN_APP', NULL,
 'Task Completed: {{taskTitle}}',
 '{{assigneeName}} has completed task {{taskTitle}}.'),

-- Alert notifications
('alert.raised', 'ALERT', 'IN_APP', NULL,
 'Alert: {{alertTitle}}',
 '{{alertTitle}}: {{alertMessage}}. Severity: {{severity}}. Project: {{projectName}}.'),

('alert.raised', 'ALERT', 'PUSH', NULL,
 'Critical Alert',
 '{{alertTitle}}'),

('alert.escalated', 'ALERT', 'IN_APP', NULL,
 'Alert Escalated: {{alertTitle}}',
 'Alert {{alertTitle}} has been escalated to you. Original assignee: {{originalAssignee}}.'),

-- System notifications
('permission.changed', 'SYSTEM', 'IN_APP', NULL,
 'Permissions Updated',
 'Your permissions have been updated. Please refresh your dashboard.'),

('system.maintenance', 'SYSTEM', 'IN_APP', NULL,
 'Scheduled Maintenance',
 'System maintenance scheduled for {{maintenanceDate}}. Duration: {{duration}}.'),

-- Digest notifications
('digest.approvals', 'DIGEST', 'EMAIL',
 'Pending Approvals Digest',
 'Pending Approvals Digest',
 'You have {{count}} pending approvals:\n\n{{#each approvals}}\n- {{documentType}} {{documentNumber}} ({{amount}}) - Due: {{dueIn}}\n{{/each}}\n\nView All: {{actionRoute}}'),

('digest.tasks', 'DIGEST', 'EMAIL',
 'Task Digest',
 'Task Digest',
 'You have {{count}} tasks:\n\nOverdue: {{overdueCount}}\nDue Today: {{todayCount}}\nDue This Week: {{weekCount}}\n\nView All: {{actionRoute}}');

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Automation Rules)
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert automation rules for common scenarios
INSERT INTO dx_automation_rule (rule_code, rule_name, trigger_type, trigger_event, condition_expr, action_type, action_config, target_rule) VALUES
-- Approval reminders
('approval.reminder.24h', 'Approval Reminder (24h)', 'REMINDER', 'approval.requested',
 'payload.hoursSinceAssignment >= 24 AND payload.hoursSinceAssignment < 48',
 'NOTIFY',
 '{"templateCode": "approval.reminder", "channel": "IN_APP"}',
 '{"type": "SPECIFIC_USERS", "userIds": [{"field": "assigneeId"}]}'),

('approval.reminder.48h', 'Approval Reminder (48h)', 'REMINDER', 'approval.requested',
 'payload.hoursSinceAssignment >= 48',
 'NOTIFY',
 '{"templateCode": "approval.urgent", "channel": "PUSH"}',
 '{"type": "SPECIFIC_USERS", "userIds": [{"field": "assigneeId"}]}'),

-- Approval escalation
('approval.escalation.72h', 'Approval Escalation (72h)', 'ESCALATION', 'approval.requested',
 'payload.hoursSinceAssignment >= 72',
 'ESCALATE',
 '{"templateCode": "approval.escalated", "levels": 1}',
 '{"type": "SUPERVISOR_HIERARCHY", "levelsUp": 1}'),

-- Task reminders
('task.reminder.due', 'Task Due Reminder', 'REMINDER', 'task.assigned',
 'payload.hoursUntilDue <= 24 AND payload.hoursUntilDue > 0',
 'NOTIFY',
 '{"templateCode": "task.due.soon", "channel": "IN_APP"}',
 '{"type": "SPECIFIC_USERS", "userIds": [{"field": "assigneeId"}]}'),

('task.escalation.overdue', 'Task Overdue Escalation', 'ESCALATION', 'task.assigned',
 'payload.daysOverdue >= 3',
 'ESCALATE',
 '{"templateCode": "task.overdue.escalated", "levels": 1}',
 '{"type": "SUPERVISOR_HIERARCHY", "levelsUp": 1}'),

-- Deadline monitoring
('deadline.approaching', 'Deadline Approaching', 'DEADLINE', NULL,
 'payload.daysUntilDeadline <= 7 AND payload.daysUntilDeadline > 0',
 'NOTIFY',
 '{"templateCode": "deadline.approaching", "channel": "EMAIL"}',
 '{"type": "DOCUMENT_FIELD", "field": "ownerUserId"}'),

('deadline.overdue', 'Deadline Overdue', 'DEADLINE', NULL,
 'payload.daysUntilDeadline < 0',
 'NOTIFY',
 '{"templateCode": "deadline.overdue", "channel": "PUSH"}',
 '{"type": "DOCUMENT_FIELD", "field": "ownerUserId"}');

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Default User Preferences)
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: In production, default preferences would be created per user on first login
-- For now, we document the expected defaults:
-- APPROVAL category: in_app=TRUE, push=TRUE, email=TRUE, frequency=IMMEDIATE
-- TASK category: in_app=TRUE, push=TRUE, email=FALSE, frequency=IMMEDIATE
-- ALERT category: in_app=TRUE, push=TRUE, email=TRUE, frequency=IMMEDIATE
-- SYSTEM category: in_app=TRUE, push=FALSE, email=FALSE, frequency=IMMEDIATE
-- DIGEST category: in_app=FALSE, push=FALSE, email=TRUE, frequency=DAILY
