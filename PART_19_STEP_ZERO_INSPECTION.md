# Part 19 — Step Zero Inspection Report

## Existing Finance Tables

Based on `src/config/schema-map.ts`, the following finance-related tables exist:

### Chart of Accounts
| Business Object | Table | PK | Status Field | Notes |
|---|---|---|---|---|
| Chart of Accounts | `chart_of_accounts` | id | — | FK: company_id, parent_account_id (hierarchy) |

### Vouchers & Journals
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Journal Voucher | `journal_vouchers` | id | status | voucher_number | FK: company_id |

### Payments & Receipts
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Payment | `payments` | id | status | payment_number | FK: project_id, vendor_id |
| Receipt | `receipts` | id | status | receipt_number | FK: project_id |

### Budget
| Business Object | Table | PK | Status Field | Notes |
|---|---|---|---|---|
| Budget | NOT PRESENT | — | — | No budget table exists |

### Cost Control
| Business Object | Table | PK | Notes |
|---|---|---|---|
| Cost Code | `dx_cost_code` (Part 12) | id | Cost code hierarchy from Part 12 |
| Project Cost | NOT PRESENT | — | No project costing table |

---

## Critical Questions

### 1. Does the existing system post double-entry?

**Current State:**
- ❌ Journal vouchers exist but posting method unknown
- ❌ No voucher line items table
- ❌ No debit/credit tracking
- ❌ No trial balance computation
- ❌ No posting rules

**Required for Part 19:**
- Double-entry posting engine with debit/credit balance enforcement
- Voucher line items with account, party, project, cost code
- Trial balance computation
- Event-driven posting from operational modules
- Configurable posting rules

### 2. What is the existing trial balance?

**Current State:**
- ❌ No trial balance table
- ❌ No period-end closing
- ❌ No financial year tracking

**Required for Part 19:**
- Capture existing trial balance as `dx_finance_baseline`
- New engine must reproduce it exactly
- Written switchover plan for sign-off

### 3. Existing payables/receivables?

**Current State:**
- Payment and receipt tables exist
- No payable tracking (GRN → invoice → payment)
- No receivable tracking (bill → receipt)
- No ageing computation
- No three-way match

**Required for Part 19:**
- Payable ledger with invoice tracking
- Receivable ledger with bill tracking
- Ageing buckets (0-30, 31-60, 61-90, 91-180, >180 days)
- Three-way match (PO ↔ GRN ↔ invoice)
- Payment blocks and holds
- MSME 45-day rule compliance

### 4. Existing budget control?

**Current State:**
- ❌ No budget table
- ❌ No budget vs actual tracking
- ❌ No committed cost tracking
- ❌ No available budget computation

**Required for Part 19:**
- Budget master with versions (original, revised, forecast)
- Budget lines by cost code and period
- Control equation: Available = Budget − Committed − Actual − Accrued
- Three modes: BLOCK, WARN, OFF
- Budget revision workflow

### 5. Existing project costing?

**Current State:**
- ❌ No project P&L
- ❌ No cost capture by cost code
- ❌ No margin computation
- ❌ No loss-making item detection

**Required for Part 19:**
- Project P&L (revenue vs cost)
- Cost by category and cost code
- Margin at project/package/WBS/BOQ item level
- Loss-making item report
- Overhead allocation with visible basis

### 6. Existing cash flow?

**Current State:**
- ❌ No cash flow tracking
- ❌ No projection
- ❌ No funding gap analysis

**Required for Part 19:**
- Actual cash flow (receipts and payments)
- Projected cash flow (receivables, payables, commitments)
- Scenario view (best/likely/worst case)
- Funding gap highlighting

### 7. Existing bank reconciliation?

**Current State:**
- ❌ No bank statement import
- ❌ No auto-match
- ❌ No reconciliation statement

**Required for Part 19:**
- Statement import (CSV/MT940/Excel)
- Auto-match on amount + date + reference
- Manual match for remainder
- Unreconciled ageing
- Reconciliation statement

### 8. Existing period close?

**Current State:**
- ❌ No period close checklist
- ❌ No period locking
- ❌ No reopen workflow

**Required for Part 19:**
- Period close checklist (GRNs invoiced, bills posted, stock reconciled, etc.)
- Period locking (no postings to closed period)
- Reopen workflow (authorised, time-boxed, reported)

---

## GAP LIST

### Critical Gaps for Part 19

1. **Posting Engine**
   - ❌ No voucher table with double-entry
   - ❌ No voucher line items
   - ❌ No posting rules
   - ❌ No event-driven posting
   - **Need:** `dx_voucher`, `dx_voucher_line`, `dx_posting_rule`

2. **Payables**
   - ❌ No payable ledger
   - ❌ No three-way match
   - ❌ No payment blocks
   - ❌ No MSME tracking
   - **Need:** `dx_payable`

3. **Receivables**
   - ❌ No receivable ledger (beyond basic receipts)
   - ❌ No ageing computation
   - ❌ No collection follow-up
   - **Need:** `dx_receivable`, `dx_collection_followup`

4. **Budget Control**
   - ❌ No budget master
   - ❌ No budget lines
   - ❌ No control equation
   - **Need:** `dx_budget`, `dx_budget_line`

5. **Project Costing**
   - ❌ No project P&L
   - ❌ No cost capture
   - ❌ No margin computation
   - **Need:** `dx_project_cost`, `dx_project_revenue`

6. **Cash Flow**
   - ❌ No cash flow tracking
   - ❌ No projection
   - **Need:** `dx_cash_flow`

7. **Bank Reconciliation**
   - ❌ No statement import
   - ❌ No auto-match
   - **Need:** `dx_bank_statement`, `dx_bank_reconciliation`

8. **Period Close**
   - ❌ No checklist
   - ❌ No locking
   - **Need:** `dx_period_close`, `dx_period_close_item`

9. **Finance Baseline**
   - ❌ No existing trial balance capture
   - **Need:** `dx_finance_baseline`

10. **Advance Ledger**
    - ❌ No advance tracking
    - ❌ No adjustment against payables
    - **Need:** `dx_advance_ledger` (extends Part 16)

---

## Summary

### What Exists
✅ Chart of accounts with hierarchy
✅ Basic journal vouchers
✅ Payment and receipt tables
✅ Cost codes (from Part 12)

### What's Missing (Critical for Part 19)
❌ Double-entry posting engine
❌ Voucher line items with account/party/project/cost code
❌ Posting rules (event-driven)
❌ Payable ledger with three-way match
❌ Receivable ledger with ageing
❌ Budget master and lines
❌ Budget control equation
❌ Project P&L
❌ Cost capture by cost code
❌ Margin computation
❌ Loss-making item detection
❌ Cash flow tracking and projection
❌ Bank reconciliation
❌ Period close checklist and locking
❌ Finance baseline capture
❌ Advance ledger

### What Must Be Preserved
✅ All existing vouchers
✅ All existing payments and receipts
✅ All existing balances
✅ All existing financial reports
✅ Historical data never restated

---

## Integration Points

### With Part 14 (Procurement)
- GRN → Payable creation
- PO → Committed cost
- Payment → Payable settlement

### With Part 15 (Inventory)
- Material issue → Cost posting
- Stock valuation → Balance sheet
- Received-not-invoiced → Accrual

### With Part 16 (Subcontractor)
- SC bill → Payable creation
- SC payment → Payable settlement
- Retention → Liability tracking
- Advance → Advance ledger

### With Part 18 (Client Billing)
- Client bill → Receivable creation
- Client receipt → Receivable settlement
- Retention held → Liability tracking
- WIP → Revenue recognition input

### With Part 8 (Analytics)
- Project cost → EVM actual cost
- Project revenue → EVM earned value
- Cash flow → Cash position KPI

### With Part 23 (Statutory)
- Tax liability → GST/TDS returns
- MSME disclosure → Statutory reporting
- TDS register → Tax compliance

---

## Next Steps

1. Create voucher and voucher line tables
2. Create posting rules table
3. Create payable ledger table
4. Create receivable ledger table
5. Create budget and budget line tables
6. Create project cost and revenue tables
7. Create cash flow table
8. Create bank statement and reconciliation tables
9. Create period close tables
10. Create finance baseline table
11. Build posting engine with event-driven posting
12. Build voucher management UI
13. Build payable workbench with three-way match
14. Build payment console
15. Build receipt allocation screen
16. Build budget control UI
17. Build project P&L UI
18. Build cash flow UI
19. Build bank reconciliation UI
20. Build period close checklist UI
21. Implement automation (auto-post, auto-accrue, auto-match)
22. Test double-entry balance enforcement
23. Test period locking
24. Capture finance baseline
25. Verify switchover plan

**Ready to proceed with implementation.**
