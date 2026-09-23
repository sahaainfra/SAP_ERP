-- Part 19 — Sync Log Table
-- 
-- Tracks offline sync operations with idempotency guarantees.
-- Every offline record gets a client-generated UUID as local_id,
-- which is sent to the server as an idempotency key to prevent duplicates.

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

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS ix_dx_sync_user ON dx_sync_log (user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_sync_status ON dx_sync_log (status, received_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_sync_entity ON dx_sync_log (entity_type, received_at DESC);
CREATE INDEX IF NOT EXISTS ix_dx_sync_device ON dx_sync_log (device_id, received_at DESC);

COMMENT ON TABLE dx_sync_log IS
  'Tracks offline sync operations with idempotency guarantees. Records both device and server clocks to detect skew.';

COMMENT ON COLUMN dx_sync_log.local_id IS
  'Client-generated UUID used as idempotency key. Prevents duplicate document creation on sync.';

COMMENT ON COLUMN dx_sync_log.device_id IS
  'Unique device identifier for tracking sync sources and managing device-specific data.';

COMMENT ON COLUMN dx_sync_log.captured_at IS
  'Timestamp from device clock when record was created offline. Never trusted for financial/compliance purposes.';

COMMENT ON COLUMN dx_sync_log.received_at IS
  'Server clock timestamp when sync was received. Used as authoritative transaction time.';

COMMENT ON COLUMN dx_sync_log.clock_skew_sec IS
  'Difference between device and server clocks in seconds. Flagged if > 5 minutes.';

COMMENT ON COLUMN dx_sync_log.payload_hash IS
  'SHA-256 hash of the payload for integrity verification and duplicate detection.';
