-- Part 11 — Posting Engines Tables
-- 
-- Creates the core financial posting infrastructure:
-- 1. dx_period_lock - Financial period locking
-- 2. dx_posting_rule - GL posting rule configuration
-- 3. dx_stock_ledger - Append-only stock movements
-- 4. dx_voucher - GL voucher headers
-- 5. dx_voucher_line - GL voucher lines
-- 6. dx_financial_dimension - Dimension combinations
--
-- All ledger tables are append-only with database-level enforcement.

-- ═══════════════════════════════════════════════════════════════════════════
-- PERIOD LOCK
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_period_lock (
  id                  BIGSERIAL PRIMARY KEY,
  company_id          BIGINT NOT NULL,
  period_month        CHAR(7) NOT NULL,           -- 'YYYY-MM' format
  module              VARCHAR(30) NOT NULL DEFAULT 'ALL',  -- ALL|FINANCE|STOCK|PAYROLL|BILLING
  status              VARCHAR(20) NOT NULL,       -- OPEN|SOFT_CLOSED|CLOSED|REOPENED
  closed_by           BIGINT,
  closed_at           TIMESTAMPTZ,
  reopened_by         BIGINT,
  reopened_at         TIMESTAMPTZ,
  reopen_reason       TEXT,
  reopen_expires_at   TIMESTAMPTZ,
  CONSTRAINT uq_dx_period UNIQUE (company_id, period_month, module)
);

CREATE INDEX IF NOT EXISTS ix_dx_period_status ON dx_period_lock (company_id, status);

COMMENT ON TABLE dx_period_lock IS
  'Financial period locking - controls posting into closed periods';

COMMENT ON COLUMN dx_period_lock.status IS
  'OPEN: posting allowed, SOFT_CLOSED: posting with special permission, CLOSED: no posting, REOPENED: time-boxed posting allowed';

-- ═══════════════════════════════════════════════════════════════════════════
-- POSTING RULE (GL Account Determination)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_posting_rule (
  id                BIGSERIAL PRIMARY KEY,
  rule_code         VARCHAR(80) NOT NULL,
  event_type        VARCHAR(80) NOT NULL,         -- 'store.grn.posted', 'bill.client.certified', etc.
  company_id        BIGINT,                       -- NULL = all companies
  condition_expr    TEXT,                         -- Sandboxed expression over event payload
  line_no           SMALLINT NOT NULL,
  account_resolver  VARCHAR(80) NOT NULL,         -- FIXED, ITEM_CATEGORY_ACCOUNT, VENDOR_CONTROL, etc.
  resolver_args     JSONB,                        -- Arguments for the resolver
  side              CHAR(1) NOT NULL,             -- D (debit) | C (credit)
  amount_expr       VARCHAR(200) NOT NULL,        -- Expression to extract amount from payload
  dimension_map     JSONB NOT NULL,               -- Maps payload fields to financial dimensions
  narration_tpl     VARCHAR(300),                 -- Template for voucher narration
  effective_from    DATE NOT NULL,
  effective_to      DATE,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_dx_prule UNIQUE (rule_code, company_id, line_no, effective_from)
);

CREATE INDEX IF NOT EXISTS ix_dx_prule_event ON dx_posting_rule (event_type, is_active, effective_from);

COMMENT ON TABLE dx_posting_rule IS
  'GL posting rules - configuration-driven account determination';

COMMENT ON COLUMN dx_posting_rule.account_resolver IS
  'Named resolver function: FIXED, ITEM_CATEGORY_ACCOUNT, VENDOR_CONTROL, CLIENT_CONTROL, COST_CODE_ACCOUNT, TAX_ACCOUNT, PROJECT_WIP, EQUIPMENT_ACCOUNT, PAYROLL_COMPONENT, GRNI';

-- ═══════════════════════════════════════════════════════════════════════════
-- STOCK LEDGER (Append-Only)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_stock_ledger (
  id                BIGSERIAL PRIMARY KEY,
  project_id        BIGINT NOT NULL,
  store_id          BIGINT NOT NULL,
  bin_id            BIGINT,
  item_id           BIGINT NOT NULL,
  batch_id          BIGINT,
  movement_type     VARCHAR(30) NOT NULL,         -- GRN, ISSUE, TRANSFER_OUT, REVERSAL, etc.
  movement_date     DATE NOT NULL,
  quantity          NUMERIC(18,4) NOT NULL,       -- Signed: +inbound, -outbound
  uom               VARCHAR(20) NOT NULL,
  rate              NUMERIC(18,4) NOT NULL,
  value             NUMERIC(18,2) NOT NULL,       -- Signed: +inbound value, -outbound value
  balance_qty       NUMERIC(18,4) NOT NULL,
  balance_value     NUMERIC(18,2) NOT NULL,
  source_type       VARCHAR(40) NOT NULL,         -- 'GRN', 'ISSUE', 'TRANSFER', etc.
  source_id         BIGINT NOT NULL,
  source_line_id    BIGINT,
  reversal_of_id    BIGINT,                       -- References original if this is a reversal
  cost_code_id      BIGINT,
  wbs_id            BIGINT,
  boq_item_id       BIGINT,
  equipment_id      BIGINT,
  created_by        BIGINT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  prev_hash         CHAR(64) NOT NULL,
  row_hash          CHAR(64) NOT NULL,
  CONSTRAINT uq_dx_sl_src_line UNIQUE (source_type, source_id, source_line_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_sl_balance ON dx_stock_ledger (project_id, store_id, item_id, batch_id, movement_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS ix_dx_sl_item_date ON dx_stock_ledger (item_id, movement_date);
CREATE INDEX IF NOT EXISTS ix_dx_sl_project ON dx_stock_ledger (project_id, movement_date);

-- Append-only enforcement
CREATE OR REPLACE FUNCTION dx_stock_ledger_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'dx_stock_ledger is append-only (attempted % on id %)', TG_OP, OLD.id
    USING ERRCODE = '0A000';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dx_sl_no_update BEFORE UPDATE ON dx_stock_ledger
  FOR EACH ROW EXECUTE FUNCTION dx_stock_ledger_immutable();

CREATE TRIGGER trg_dx_sl_no_delete BEFORE DELETE ON dx_stock_ledger
  FOR EACH ROW EXECUTE FUNCTION dx_stock_ledger_immutable();

COMMENT ON TABLE dx_stock_ledger IS
  'Append-only stock ledger - UPDATE and DELETE are blocked at database level';

COMMENT ON COLUMN dx_stock_ledger.balance_qty IS
  'Running balance quantity after this movement';

COMMENT ON COLUMN dx_stock_ledger.row_hash IS
  'SHA-256 hash for tamper detection, chained to previous row';

-- ═══════════════════════════════════════════════════════════════════════════
-- GL VOUCHER (Append-Only)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_voucher (
  id                BIGSERIAL PRIMARY KEY,
  voucher_no        VARCHAR(50) NOT NULL,
  voucher_type      VARCHAR(30) NOT NULL,         -- JV, PAYMENT, RECEIPT, CONTRA, SALES, PURCHASE, PROVISION
  voucher_date      DATE NOT NULL,
  company_id        BIGINT NOT NULL,
  project_id        BIGINT,
  fiscal_year       VARCHAR(10) NOT NULL,
  period_month      CHAR(7) NOT NULL,
  source_type       VARCHAR(40),                  -- 'GRN', 'BILL', 'PAYMENT', etc.
  source_id         BIGINT,
  total_debit       NUMERIC(18,2) NOT NULL,
  total_credit      NUMERIC(18,2) NOT NULL,
  status            VARCHAR(20) NOT NULL,         -- POSTED, REVERSED, CANCELLED
  reversal_of_id    BIGINT,                       -- References original if this is a reversal
  reversal_reason   TEXT,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  narration         TEXT,
  posted_by         BIGINT NOT NULL,
  posted_at         TIMESTAMPTZ DEFAULT NOW(),
  row_hash          CHAR(64) NOT NULL,
  CONSTRAINT uq_dx_voucher_no UNIQUE (voucher_no),
  CONSTRAINT chk_dx_voucher_balance CHECK (total_debit = total_credit)
);

CREATE INDEX IF NOT EXISTS ix_dx_voucher_date ON dx_voucher (company_id, voucher_date);
CREATE INDEX IF NOT EXISTS ix_dx_voucher_source ON dx_voucher (source_type, source_id);
CREATE INDEX IF NOT EXISTS ix_dx_voucher_project ON dx_voucher (project_id, voucher_date);

-- Append-only enforcement
CREATE OR REPLACE FUNCTION dx_voucher_immutable() RETURNS trigger AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status != 'REVERSED' THEN
    RAISE EXCEPTION 'dx_voucher can only be marked as REVERSED (attempted % on id %)', NEW.status, OLD.id
      USING ERRCODE = '0A000';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dx_voucher_status BEFORE UPDATE ON dx_voucher
  FOR EACH ROW EXECUTE FUNCTION dx_voucher_immutable();

COMMENT ON TABLE dx_voucher IS
  'Append-only GL vouchers - status can only change to REVERSED';

COMMENT ON COLUMN dx_voucher.total_debit IS
  'Total debit amount - must equal total_credit (enforced by CHECK constraint)';

-- ═══════════════════════════════════════════════════════════════════════════
-- GL VOUCHER LINE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_voucher_line (
  id                BIGSERIAL PRIMARY KEY,
  voucher_id        BIGINT NOT NULL REFERENCES dx_voucher(id),
  line_no           SMALLINT NOT NULL,
  account_id        BIGINT NOT NULL,
  account_code      VARCHAR(50) NOT NULL,
  side              CHAR(1) NOT NULL,             -- D | C
  amount            NUMERIC(18,2) NOT NULL,
  project_id        BIGINT,
  cost_code_id      BIGINT,
  wbs_id            BIGINT,
  cost_centre_id    BIGINT,
  equipment_id      BIGINT,
  party_type        VARCHAR(20),                  -- VENDOR, CLIENT, EMPLOYEE
  party_id          BIGINT,
  narration         TEXT,
  reference_type    VARCHAR(40),
  reference_id      BIGINT,
  CONSTRAINT uq_dx_vline UNIQUE (voucher_id, line_no)
);

CREATE INDEX IF NOT EXISTS ix_dx_vline_account ON dx_voucher_line (account_id, voucher_id);
CREATE INDEX IF NOT EXISTS ix_dx_vline_project ON dx_voucher_line (project_id, voucher_id);

COMMENT ON TABLE dx_voucher_line IS
  'GL voucher lines - one row per account entry';

-- ═══════════════════════════════════════════════════════════════════════════
-- FINANCIAL DIMENSION COMBINATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_financial_dimension (
  id                BIGSERIAL PRIMARY KEY,
  account_id        BIGINT NOT NULL,
  project_id        BIGINT,
  cost_code_id      BIGINT,
  wbs_id            BIGINT,
  cost_centre_id    BIGINT,
  equipment_id      BIGINT,
  party_type        VARCHAR(20),
  party_id          BIGINT,
  is_valid          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_dx_fdim UNIQUE (account_id, project_id, cost_code_id, wbs_id, cost_centre_id, equipment_id, party_type, party_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_fdim_account ON dx_financial_dimension (account_id, is_valid);

COMMENT ON TABLE dx_financial_dimension IS
  'Valid financial dimension combinations - validated at posting time';
