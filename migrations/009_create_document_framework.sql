-- Part 09 — Document Framework Tables
-- 
-- Creates the three core tables for the document framework:
-- 1. dx_document_draft - RAP-style draft/active split
-- 2. dx_audit_log - Hash-chained audit trail
-- 3. dx_event_outbox - Transactional outbox for events
--
-- All tables are additive and follow the dx_ prefix convention.

-- ═══════════════════════════════════════════════════════════════════════════
-- DOCUMENT DRAFT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_document_draft (
  id             BIGSERIAL PRIMARY KEY,
  document_type  VARCHAR(40) NOT NULL,
  active_id      BIGINT,                       -- NULL = new document
  owner_user_id  BIGINT NOT NULL,
  project_id     BIGINT,
  payload        JSONB NOT NULL,               -- full header + lines
  base_version   VARCHAR(80),                  -- ETag of the active record when draft began
  device_id      VARCHAR(100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,
  CONSTRAINT uq_dx_draft UNIQUE (document_type, active_id, owner_user_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_draft_owner ON dx_document_draft (owner_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_draft_expires ON dx_document_draft (expires_at) WHERE expires_at < NOW();

COMMENT ON TABLE dx_document_draft IS
  'RAP-style draft/active split for partially entered documents';

COMMENT ON COLUMN dx_document_draft.active_id IS
  'NULL for new documents, document ID for edits';

COMMENT ON COLUMN dx_document_draft.payload IS
  'Full document content (header + lines) as JSON';

COMMENT ON COLUMN dx_document_draft.base_version IS
  'ETag of active record when draft began, for concurrency check';

-- ═══════════════════════════════════════════════════════════════════════════
-- AUDIT LOG (HASH-CHAINED)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_audit_log (
  id              BIGSERIAL PRIMARY KEY,
  entity          VARCHAR(80) NOT NULL,
  entity_id       BIGINT NOT NULL,
  action          VARCHAR(40) NOT NULL,
  field_name      VARCHAR(80),
  old_value       TEXT,
  new_value       TEXT,
  document_type   VARCHAR(40),
  project_id      BIGINT,
  company_id      BIGINT,
  actor_user_id   BIGINT NOT NULL,
  impersonated_by BIGINT,
  correlation_id  UUID NOT NULL,
  ip_address      VARCHAR(45),
  user_agent      VARCHAR(300),
  device_class    VARCHAR(20),
  reason          TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prev_hash       CHAR(64) NOT NULL,
  row_hash        CHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_dx_audit_entity ON dx_audit_log (entity, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_audit_actor ON dx_audit_log (actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_audit_corr ON dx_audit_log (correlation_id);
CREATE INDEX IF NOT EXISTS ix_dx_audit_doc ON dx_audit_log (document_type, entity_id);

-- Immutability enforced at the database, not by convention
-- These rules prevent UPDATE and DELETE at the database level
-- Note: PostgreSQL-specific syntax
-- CREATE RULE dx_audit_no_update AS ON UPDATE TO dx_audit_log DO INSTEAD NOTHING;
-- CREATE RULE dx_audit_no_delete AS ON DELETE TO dx_audit_log DO INSTEAD NOTHING;

COMMENT ON TABLE dx_audit_log IS
  'Hash-chained audit trail - UPDATE and DELETE must be revoked from application user';

COMMENT ON COLUMN dx_audit_log.prev_hash IS
  'Hash of previous row for chain verification';

COMMENT ON COLUMN dx_audit_log.row_hash IS
  'SHA-256 hash of this row for tamper detection';

-- ═══════════════════════════════════════════════════════════════════════════
-- EVENT OUTBOX
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_event_outbox (
  id              BIGSERIAL PRIMARY KEY,
  event_type      VARCHAR(80) NOT NULL,
  aggregate_type  VARCHAR(40) NOT NULL,
  aggregate_id    BIGINT NOT NULL,
  project_id      BIGINT,
  company_id      BIGINT,
  payload         JSONB NOT NULL,
  correlation_id  UUID NOT NULL,
  causation_id    UUID,
  actor_user_id   BIGINT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING|PROCESSING|DONE|FAILED|DEAD
  attempts        SMALLINT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  last_error      TEXT,
  processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_dx_outbox_pending ON dx_event_outbox (status, next_attempt_at)
  WHERE status IN ('PENDING', 'FAILED');

CREATE INDEX IF NOT EXISTS ix_dx_outbox_aggregate ON dx_event_outbox (aggregate_type, aggregate_id);

COMMENT ON TABLE dx_event_outbox IS
  'Transactional outbox for domain events - ensures at-least-once delivery';

COMMENT ON COLUMN dx_event_outbox.status IS
  'PENDING: awaiting processing, PROCESSING: being handled, DONE: completed, FAILED: retry pending, DEAD: max retries exceeded';

-- ═══════════════════════════════════════════════════════════════════════════
-- NUMBER SERIES (for document numbering)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_number_series (
  id              BIGSERIAL PRIMARY KEY,
  series_code     VARCHAR(50) NOT NULL,
  document_type   VARCHAR(40) NOT NULL,
  scope_type      VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',  -- GLOBAL|COMPANY|PROJECT
  scope_id        BIGINT,
  fiscal_year     VARCHAR(10),
  pattern         VARCHAR(200) NOT NULL,  -- e.g., 'PO/{PRJ}/{FY}/{SEQ}'
  current_value   BIGINT NOT NULL DEFAULT 0,
  max_value       BIGINT,
  padding         INT NOT NULL DEFAULT 4,
  warn_threshold  BIGINT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_number_series UNIQUE (series_code, scope_type, scope_id, fiscal_year)
);

CREATE INDEX IF NOT EXISTS ix_dx_number_series_lookup ON dx_number_series (document_type, is_active);

COMMENT ON TABLE dx_number_series IS
  'Number series definitions for document numbering';

COMMENT ON COLUMN dx_number_series.pattern IS
  'Pattern with placeholders: {PRJ}, {CO}, {SITE}, {FY}, {YY}, {MM}, {SEQ}';

-- ═══════════════════════════════════════════════════════════════════════════
-- NUMBER ALLOCATION (audit trail for issued numbers)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_number_allocation (
  id              BIGSERIAL PRIMARY KEY,
  series_id       BIGINT NOT NULL REFERENCES dx_number_series(id),
  allocated_value BIGINT NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  document_type   VARCHAR(40) NOT NULL,
  allocated_by    BIGINT NOT NULL,
  allocated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id  UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_dx_number_alloc_series ON dx_number_allocation (series_id, allocated_value);
CREATE INDEX IF NOT EXISTS ix_dx_number_alloc_doc ON dx_number_allocation (document_type, document_number);

COMMENT ON TABLE dx_number_allocation IS
  'Audit trail for issued document numbers';

-- ═══════════════════════════════════════════════════════════════════════════
-- NUMBER GAP (for tracking lost numbers due to rollbacks)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_number_gap (
  id              BIGSERIAL PRIMARY KEY,
  series_id       BIGINT NOT NULL REFERENCES dx_number_series(id),
  gap_value       BIGINT NOT NULL,
  correlation_id  UUID NOT NULL,
  reason          TEXT,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_number_gap_series ON dx_number_gap (series_id, gap_value);

COMMENT ON TABLE dx_number_gap IS
  'Tracks numbers lost to transaction rollbacks for audit purposes';
