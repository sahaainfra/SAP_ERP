-- Part 05 — Idempotency Table Migration
-- 
-- This table stores idempotency keys for POST requests to ensure
-- that replaying the same request returns the same response without
-- re-executing the business logic.
--
-- Rule API-05: Every write that creates a document or executes a
-- side-effecting action requires an Idempotency-Key.

CREATE TABLE IF NOT EXISTS dx_idempotency (
  -- Idempotency key from request header
  key VARCHAR(120) PRIMARY KEY,
  
  -- Actor who made the request
  actor_user_id BIGINT NOT NULL,
  
  -- Endpoint that was called (e.g., "POST /api/dx/v1/procurement/purchase-orders")
  endpoint VARCHAR(200) NOT NULL,
  
  -- SHA-256 hash of the request body
  -- Used to detect if the same key is used with a different request
  request_hash CHAR(64) NOT NULL,
  
  -- Status of the request
  -- IN_PROGRESS: Request is being processed
  -- COMPLETED: Request completed successfully
  -- FAILED: Request failed with an error
  status VARCHAR(20) NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
  
  -- HTTP status code of the response
  response_status INTEGER,
  
  -- Response body (JSON)
  -- Stored so we can return the exact same response on replay
  response_body JSONB,
  
  -- When the request was created
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- When the request completed (successfully or with error)
  completed_at TIMESTAMPTZ,
  
  -- When this record expires and can be cleaned up
  -- Default: 24 hours for most requests
  -- Extended to 7 days for payments and integration calls
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for cleanup job to find expired records
CREATE INDEX IF NOT EXISTS idx_dx_idempotency_expires 
  ON dx_idempotency(expires_at)
  WHERE status IN ('COMPLETED', 'FAILED');

-- Index for finding in-progress requests (for timeout handling)
CREATE INDEX IF NOT EXISTS idx_dx_idempotency_in_progress 
  ON dx_idempotency(created_at)
  WHERE status = 'IN_PROGRESS';

-- Index for actor-based queries (audit trail)
CREATE INDEX IF NOT EXISTS idx_dx_idempotency_actor 
  ON dx_idempotency(actor_user_id, created_at DESC);

COMMENT ON TABLE dx_idempotency IS
  'Stores idempotency keys for POST requests to prevent duplicate operations';

COMMENT ON COLUMN dx_idempotency.key IS
  'Idempotency key from Idempotency-Key header (UUID recommended)';

COMMENT ON COLUMN dx_idempotency.request_hash IS
  'SHA-256 hash of request body to detect key reuse with different payloads';

COMMENT ON COLUMN dx_idempotency.status IS
  'IN_PROGRESS: request being processed, COMPLETED: success, FAILED: error';

COMMENT ON COLUMN dx_idempotency.response_body IS
  'Cached response for replay - ensures exact same response on retry';

COMMENT ON COLUMN dx_idempotency.expires_at IS
  'Records expire after 24h (7d for payments) to limit table growth';
