# Part 11: Posting Engines — Stock Ledger, General Ledger & Period Lock

## Overview

Part 11 implements the two append-only ledgers that form the financial backbone of the ERP: the **stock ledger** and the **general ledger**, plus the **period lock** service. These are the single source of truth for all inventory and financial movements in the system.

**Key Principle:** Both ledgers are append-only. A wrong entry is corrected by a reversal that references the original, never by an edit. Account and dimension determination is configuration, so a change to the chart of accounts is not a release.

## What Was Delivered

### 1. Database Schema (`migrations/011_create_posting_engines.sql`)

Created 6 new tables:

- **dx_period_lock** — Financial period locking with status tracking (OPEN, SOFT_CLOSED, CLOSED, REOPENED)
- **dx_posting_rule** — GL posting rule configuration (event→rule→journal determination)
- **dx_stock_ledger** — Append-only stock movements with hash chain for tamper detection
- **dx_voucher** — GL voucher headers (append-only, balance enforced by CHECK constraint)
- **dx_voucher_line** — GL voucher lines with financial dimensions
- **dx_financial_dimension** — Valid dimension combinations

**Database-Level Enforcement:**
- Stock ledger: UPDATE and DELETE blocked by triggers (raises exception)
- Vouchers: Status can only change to REVERSED (trigger enforced)
- Balance check: CHECK constraint ensures total_debit = total_credit

### 2. Period Lock Service (`period-lock-service.ts`)

Manages financial period locking to control posting into closed periods.

**Key Methods:**
- `assertOpen()` — Validates period is open before posting
- `close()` — Closes a period (soft or hard close)
- `reopen()` — Time-boxed reopen with two-person control (max 72 hours)
- `autoRelock()` — Scheduled job to relock expired reopens

**Features:**
- Four period states: OPEN, SOFT_CLOSED, CLOSED, REOPENED
- Module-specific locking (ALL, FINANCE, STOCK, PAYROLL, BILLING)
- Time-boxed reopen with automatic expiry
- Two-person control for reopen (requires special permission)
- Audit trail for all period changes

### 3. Valuation Service (`valuation-service.ts`)

Handles stock valuation methods for issue rate calculation.

**Valuation Methods:**
- **Weighted Average** — Rate = Total Value / Total Quantity, recalculated on every movement
- **FIFO** — First In, First Out, consumes oldest layers first
- **Batch Specific** — Uses the rate of the specific batch

**Features:**
- FIFO layer tracking and consumption
- Fallback to last inbound rate with warning event
- Method locked per item category once movements exist in fiscal year
- Zero/negative stock handling with fallback rate

### 4. Dimension Validator (`dimension-validator.ts`)

Validates financial dimension combinations at posting time.

**Validation Rules:**
- Required dimensions per account type (project, cost code, party)
- Forbidden dimensions (e.g., cost code not allowed on control accounts)
- Referential integrity (cost code must belong to project)
- Combination registration and validation

**Features:**
- D365-style dimension combination validation
- Auto-registration of valid combinations
- Account-specific dimension requirements
- Cost code project belonging checks

### 5. Stock Posting Service (Interface Defined)

Append-only stock movement posting with comprehensive validation.

**Key Features:**
- Idempotent posting by source document + line
- Row-level locking in global lock order (series → party → project → document → ledger)
- Negative stock control (configurable per project)
- Reversal-only correction (cannot reverse a reversal)
- UoM normalization to item's stock UoM
- Cost destination mandatory for consumption movements
- Hash chain for tamper detection
- Legacy balance synchronization in same transaction

**Movement Types:**
- GRN (Goods Receipt Note) — Inbound
- ISSUE — Outbound
- TRANSFER_OUT / TRANSFER_IN — Inter-store transfers
- ADJUSTMENT — Stock adjustments
- REVERSAL — Reversal of previous movement
- OPENING_BALANCE — Initial stock load

### 6. GL Posting Service (Interface Defined)

Event-driven general ledger posting with configuration-driven account determination.

**Key Features:**
- Subscribes to outbox events from document framework
- Configuration-driven posting rules (event → rule → journal lines)
- Balance assertion before insert (debit must equal credit)
- Reversal support with mirror lines
- Idempotent by source event
- Financial dimension validation
- Period lock assertion

**Posting Rule Configuration:**
- Event type mapping (e.g., `store.grn.posted`)
- Account resolvers (10 types: FIXED, ITEM_CATEGORY_ACCOUNT, VENDOR_CONTROL, etc.)
- Condition expressions for conditional posting
- Amount expressions to extract from payload
- Dimension mapping from payload fields
- Effective dating for rule changes

### 7. Accrual Service (Interface Defined)

Period-end accrual automation.

**Features:**
- GRNI (Goods Received Not Invoiced) accruals
- Auto-reversal on invoice booking
- Period-end automation via scheduled jobs
- Prevents duplicate cost recognition

## Key Features

### Append-Only Ledgers

Both stock ledger and GL vouchers are append-only:
- No UPDATE or DELETE operations allowed
- Corrections via reversal rows referencing originals
- Hash chain for tamper detection (each row hashes previous row's hash)
- Database-level enforcement via triggers
- Reversal uses original rate (not current rate)

### Idempotent Posting

Prevents double-posting from outbox retries:
- Unique constraint on source document + line (stock)
- Unique constraint on source event (GL)
- Replayed events return existing result
- No duplicate ledger rows

### Financial Dimensions

D365-style dimension validation:
- Project, Cost Code, WBS, Cost Centre, Equipment, Party
- Validated as combinations, not independently
- Required dimensions per account type
- Forbidden dimensions for control accounts
- Referential integrity (cost code belongs to project)

### Period Lock

Comprehensive period management:
- Four states: OPEN, SOFT_CLOSED, CLOSED, REOPENED
- Time-boxed reopen (max 72 hours)
- Two-person control for reopen
- Auto-relock on expiry
- Module-specific locking
- Audit trail for all changes

### Posting Rules as Configuration

Account determination is configuration, not code:
- Event type → Account resolver → Journal lines
- 10 account resolver types
- Condition expressions for conditional posting
- Amount expressions to extract from payload
- Dimension mapping from payload fields
- Effective dating for rule changes
- Finance controller can read table and understand postings

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| POST-01 | BLOCK | Stock and GL ledgers are append-only |
| POST-02 | BLOCK | Posting is idempotent by source document and event |
| POST-03 | BLOCK | Posting action asserts period is open |
| POST-04 | BLOCK | Every posting line carries full dimension set |
| POST-05 | BLOCK | Stock balance takes row lock in global order |
| POST-06 | BLOCK | GL journal must balance to zero |
| POST-07 | WARN | Valuation fallback recorded as event |

## Error Handling

### Stock Posting Errors

- **INSUFFICIENT_STOCK** — Names item, store, available, requested, shortfall
- **RATE_REQUIRED_FOR_INBOUND** — Inbound movements must specify rate
- **COST_DESTINATION_REQUIRED** — Consumption requires cost code/WBS
- **CANNOT_REVERSE_A_REVERSAL** — Reversals cannot be reversed
- **ALREADY_REVERSED** — Movement already has a reversal
- **REVERSAL_BLOCKED_DOWNSTREAM_CONSUMPTION** — Downstream consumption exists

### GL Posting Errors

- **POSTING_RULE_MISSING** — No rule for event type (P1 alert)
- **VOUCHER_UNBALANCED** — Debit ≠ Credit (configuration bug)
- **DIMENSION_REQUIRED** — Missing required dimension
- **DIMENSION_NOT_ALLOWED** — Forbidden dimension used
- **DIMENSION_COMBINATION_INVALID** — Cost code doesn't belong to project
- **COST_CODE_NOT_POSTABLE** — Cost code not allowed for posting
- **PERIOD_CLOSED** — Posting into closed period

## File Structure

```
src/platform/posting/
├── types.ts                    # All posting types and interfaces
├── period-lock-service.ts      # Period locking management
├── valuation-service.ts        # Stock valuation methods
├── dimension-validator.ts      # Dimension combination validation
└── index.ts                    # Module exports

migrations/
└── 011_create_posting_engines.sql  # Database schema
```

## Integration Points

### Stock Ledger
- Called by GRN posting (inbound)
- Called by Material Issue (outbound)
- Called by Stock Transfer
- Called by Stock Adjustment
- Emits `store.stock.moved` event

### GL Posting
- Subscribes to outbox events from document framework
- `store.grn.posted` → Inventory DR, GRNI CR
- `bill.client.certified` → Receivable DR, Revenue CR, Tax CR
- `finance.payment.posted` → Payable DR, Bank CR
- Emits `finance.voucher.posted` event

### Period Lock
- Called by every posting action
- Called by period-close UI
- Called by scheduled reconciliation jobs

## Testing Requirements

### Stock Ledger
- [ ] 500 parallel issues: final balance correct, no gaps
- [ ] Retried GRN: exactly one ledger row
- [ ] UPDATE/DELETE blocked at database
- [ ] Reversal uses original rate
- [ ] Weighted average verified against hand calculation
- [ ] FIFO layer consumption verified
- [ ] Negative stock blocked by default
- [ ] Missing UoM conversion blocks
- [ ] Reconciliation detects drift

### General Ledger
- [ ] Every posting rule produces balanced voucher
- [ ] Replaying event produces one voucher
- [ ] Unbalanced rules caught before insert
- [ ] Cost posting without project rejected
- [ ] Cost code from another project rejected
- [ ] Closed period rejected
- [ ] Reversal produces mirror lines
- [ ] Project P&L equals trial balance movement
- [ ] GRNI accrual posts and auto-reverses

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All posting services compile correctly
- Output: 695KB JS, 58KB CSS

## What Part 11 Does NOT Do

- ❌ Does not implement actual database persistence (uses in-memory Maps)
- ❌ Does not implement actual hash chain computation
- ❌ Does not implement actual FIFO layer persistence
- ❌ Does not implement actual account resolver functions
- ❌ Does not implement actual reconciliation jobs
- ❌ Does not implement actual accrual automation

**Part 11 defines the posting engine contracts and services. Actual database integration happens in later parts.**

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
