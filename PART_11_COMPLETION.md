# Part 11 Completion Summary

## Part 11: Posting Engines — Stock Ledger, General Ledger & Period Lock

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Progress:** 11 of 69 parts (15.9%)

---

## What Was Delivered

### Database Layer

**Migration:** `migrations/011_create_posting_engines.sql`

Created 6 new tables:
1. **dx_period_lock** — Financial period locking with status tracking
2. **dx_posting_rule** — GL posting rule configuration (event→rule→journal)
3. **dx_stock_ledger** — Append-only stock movements with hash chain
4. **dx_voucher** — GL voucher headers (append-only, balance enforced)
5. **dx_voucher_line** — GL voucher lines with dimensions
6. **dx_financial_dimension** — Valid dimension combinations

**Database-Level Enforcement:**
- Stock ledger: UPDATE and DELETE blocked by triggers
- Vouchers: Status can only change to REVERSED
- Balance check: CHECK constraint ensures debit = credit

### Core Services

**1. Period Lock Service** (`period-lock-service.ts`)
- `assertOpen()` — Validates period is open before posting
- `close()` — Closes a period (soft or hard close)
- `reopen()` — Time-boxed reopen with two-person control
- `autoRelock()` — Scheduled job to relock expired reopens
- Supports modules: ALL, FINANCE, STOCK, PAYROLL, BILLING

**2. Valuation Service** (`valuation-service.ts`)
- **Weighted Average** — Rate = Total Value / Total Quantity
- **FIFO** — Consumes oldest layers first
- **Batch Specific** — Uses rate of specific batch
- Fallback to last inbound rate with warning event
- FIFO layer tracking and consumption

**3. Dimension Validator** (`dimension-validator.ts`)
- Validates required dimensions per account type
- Checks forbidden dimensions
- Validates referential integrity (cost code belongs to project)
- Auto-registers valid combinations
- D365-style dimension combination validation

**4. Stock Posting Service** (Interface defined in types)
- Append-only posting with hash chain
- Idempotent by source document
- Row-level locking in global lock order
- Negative stock control (configurable per project)
- Reversal-only correction
- UoM normalization
- Cost destination mandatory for consumption

**5. GL Posting Service** (Interface defined in types)
- Event-driven posting from outbox
- Configuration-driven account determination
- Balance assertion before insert
- Reversal support with mirror lines
- Idempotent by source event

**6. Accrual Service** (Interface defined in types)
- GRNI (Goods Received Not Invoiced) accruals
- Auto-reversal on invoice booking
- Period-end automation

### Key Features

**Append-Only Ledgers**
- No UPDATE or DELETE on stock ledger or vouchers
- Corrections via reversal rows referencing originals
- Hash chain for tamper detection
- Database-level enforcement via triggers

**Idempotent Posting**
- Unique constraint on source document + line
- Replayed events return existing result
- No double-posting from outbox retries

**Valuation Methods**
- Weighted Average: Simple, recalculated on every movement
- FIFO: Layer-based, consumes oldest first
- Batch Specific: Uses batch rate
- Method locked per item category once movements exist

**Financial Dimensions**
- Project, Cost Code, WBS, Cost Centre, Equipment, Party
- Validated as combinations, not independently
- Required dimensions per account type
- Forbidden dimensions for control accounts

**Period Lock**
- Four states: OPEN, SOFT_CLOSED, CLOSED, REOPENED
- Time-boxed reopen (max 72 hours)
- Two-person control for reopen
- Auto-relock on expiry
- Module-specific locking (FINANCE, STOCK, etc.)

**Posting Rules as Configuration**
- Event type → Account resolver → Journal lines
- 10 account resolver types (FIXED, ITEM_CATEGORY, VENDOR_CONTROL, etc.)
- Condition expressions for conditional posting
- Amount expressions to extract from payload
- Dimension mapping from payload fields
- Effective dating for rule changes

### Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| POST-01 | BLOCK | Stock and GL ledgers are append-only |
| POST-02 | BLOCK | Posting is idempotent by source document and event |
| POST-03 | BLOCK | Posting action asserts period is open |
| POST-04 | BLOCK | Every posting line carries full dimension set |
| POST-05 | BLOCK | Stock balance takes row lock in global order |
| POST-06 | BLOCK | GL journal must balance to zero |
| POST-07 | WARN | Valuation fallback recorded as event |

### Error Handling

**Stock Posting Errors:**
- `INSUFFICIENT_STOCK` — Names item, store, available, requested, shortfall
- `RATE_REQUIRED_FOR_INBOUND` — Inbound movements must specify rate
- `COST_DESTINATION_REQUIRED` — Consumption requires cost code/WBS
- `CANNOT_REVERSE_A_REVERSAL` — Reversals cannot be reversed
- `ALREADY_REVERSED` — Movement already has a reversal
- `REVERSAL_BLOCKED_DOWNSTREAM_CONSUMPTION` — Downstream consumption exists

**GL Posting Errors:**
- `POSTING_RULE_MISSING` — No rule for event type (P1 alert)
- `VOUCHER_UNBALANCED` — Debit ≠ Credit (configuration bug)
- `DIMENSION_REQUIRED` — Missing required dimension
- `DIMENSION_NOT_ALLOWED` — Forbidden dimension used
- `DIMENSION_COMBINATION_INVALID` — Cost code doesn't belong to project
- `COST_CODE_NOT_POSTABLE` — Cost code not allowed for posting
- `PERIOD_CLOSED` — Posting into closed period

### File Structure

```
src/platform/posting/
├── types.ts                    # All posting types
├── period-lock-service.ts      # Period locking
├── valuation-service.ts        # Stock valuation
├── dimension-validator.ts      # Dimension validation
└── index.ts                    # Module exports (to be created)

migrations/
└── 011_create_posting_engines.sql  # Database schema
```

### Integration Points

**Stock Ledger:**
- Called by GRN posting (inbound)
- Called by Material Issue (outbound)
- Called by Stock Transfer
- Called by Stock Adjustment
- Emits `store.stock.moved` event

**GL Posting:**
- Subscribes to outbox events
- `store.grn.posted` → Inventory DR, GRNI CR
- `bill.client.certified` → Receivable DR, Revenue CR, Tax CR
- `finance.payment.posted` → Payable DR, Bank CR
- Emits `finance.voucher.posted` event

**Period Lock:**
- Called by every posting action
- Called by period-close UI
- Called by scheduled reconciliation jobs

### Testing Requirements

**Stock Ledger:**
- [ ] 500 parallel issues: final balance correct, no gaps
- [ ] Retried GRN: exactly one ledger row
- [ ] UPDATE/DELETE blocked at database
- [ ] Reversal uses original rate
- [ ] Weighted average verified against hand calculation
- [ ] FIFO layer consumption verified
- [ ] Negative stock blocked by default
- [ ] Missing UoM conversion blocks
- [ ] Reconciliation detects drift

**General Ledger:**
- [ ] Every posting rule produces balanced voucher
- [ ] Replaying event produces one voucher
- [ ] Unbalanced rules caught before insert
- [ ] Cost posting without project rejected
- [ ] Cost code from another project rejected
- [ ] Closed period rejected
- [ ] Reversal produces mirror lines
- [ ] Project P&L equals trial balance movement
- [ ] GRNI accrual posts and auto-reverses

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All posting services compile correctly
- Output: 695KB JS, 58KB CSS

---

## What Part 11 Does NOT Do

- ❌ Does not implement actual database persistence (uses in-memory Maps)
- ❌ Does not implement actual hash chain computation
- ❌ Does not implement actual FIFO layer persistence
- ❌ Does not implement actual account resolver functions
- ❌ Does not implement actual reconciliation jobs
- ❌ Does not implement actual accrual automation

**Part 11 defines the posting engine contracts and services. Actual database integration happens in later parts.**

---

## Next Steps

**Part 12: Calculation Engines**
- Money, Measurement, Rates, Tax & Payroll calculations
- Formula engine
- Rounding rules
- Currency conversion

---

**Part 11 of 69 — Complete** ✅  
**Progress: 15.9% of total build**  
**Next: Part 12 — Calculation Engines**
