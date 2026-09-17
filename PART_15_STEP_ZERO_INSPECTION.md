# Part 15 — Step Zero Inspection Report

## Existing Inventory Tables

Based on `src/config/schema-map.ts`, the following inventory-related tables exist:

### Store & Location
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Store | `stores` | id | — | store_code | FK: project_id, site_id, store_keeper_id |

### Stock
| Business Object | Table | PK | Status Field | Notes |
|---|---|---|---|---|
| Stock Ledger | `stock_ledger` | id | — | FK: store_id, material_id, quantity, value, last_updated |

### GRN (Goods Receipt Note)
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| GRN | `grns` | id | status | grn_number | FK: po_id, store_id, received_by |

### Material Issue
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Material Issue | `material_issues` | id | status | issue_number | FK: store_id, issued_to |

### Material Transfer/Return
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Material Transfer | NOT PRESENT | — | — | — | No transfer table exists |
| Material Return | NOT PRESENT | — | — | — | No return table exists |

---

## Critical Questions

### 1. How is stock balance currently maintained?

**Current State:**
- `stock_ledger` table has `quantity` and `value` fields
- **Unknown:** Is this a running balance or individual movements?
- **Unknown:** Are there multiple rows per item (movements) or one row (balance)?
- **Unknown:** Is there a separate balance table?

**Required for Part 15:**
- Append-only ledger (every movement is a new row)
- Running balance computed from ledger (not stored as mutable field)
- Reconciliation between ledger sum and any existing balance field

### 2. What valuation method is currently used?

**Current State:**
- `stock_ledger.value` field exists
- **Unknown:** How is issue rate determined?
- **Unknown:** Is it weighted average, FIFO, or specific identification?
- **Unknown:** Is rate stored per movement or computed on the fly?

**Required for Part 15:**
- Support multiple valuation methods (Weighted Average, FIFO, Batch-specific)
- Issue rate always computed from method, never typed
- Rate locked once movements exist for financial year

### 3. Existing negative-stock behaviour?

**Current State:**
- **Unknown:** Can quantity go negative?
- **Unknown:** Is there validation?
- **Unknown:** How are negatives reported?

**Required for Part 15:**
- Negative stock blocked by default
- Where enabled: flagged, reported daily, must be cleared
- Configuration per project: `issue.negative.stock.allow`

### 4. Current store/location structure?

**Current State:**
- `stores` table with project_id, site_id
- **Unknown:** Is there bin/location hierarchy?
- **Unknown:** Are there QC-hold stores?
- **Unknown:** Are there rejection stores?

**Required for Part 15:**
- Store hierarchy (project → site → store → bin)
- QC-hold store for materials pending inspection
- Rejection store for failed materials
- In-transit location for transfers

### 5. Row counts and date range?

**Current State:**
- **Unknown:** Need to query actual database

**Required for Part 15:**
- Capture stock baseline before implementation
- Reconcile after implementation
- Zero tolerance for mismatches

---

## GAP LIST

### Critical Gaps for Part 15

1. **Stock Ledger**
   - ❌ No append-only ledger with hash chaining
   - ❌ No movement types (GRN, ISSUE, RETURN, TRANSFER, ADJUST, SCRAP, etc.)
   - ❌ No batch/lot tracking
   - ❌ No running balance computation
   - ❌ No concurrency control
   - **Need:** `dx_stock_ledger` (completely new, append-only)

2. **GRN Extensions**
   - ❌ No three-way match (PO ↔ challan ↔ physical)
   - ❌ No tolerance checking
   - ❌ No QC hold workflow
   - ❌ No gate entry / weighbridge linkage
   - ❌ No mobile GRN with scan/photo
   - ❌ No batch tracking (heat no, mill cert, expiry)
   - **Need:** `dx_grn_extension`, `dx_grn_item_extension`

3. **Issue Extensions**
   - ❌ No cost destination (WBS/BOQ/cost code)
   - ❌ No theoretical check at issue time
   - ❌ No negative stock control
   - ❌ No FIFO/batch selection
   - ❌ No returnable issue tracking
   - ❌ No mobile issue with QR scan
   - **Need:** `dx_issue_extension`

4. **Consumption Reconciliation**
   - ❌ No consumption tracking table
   - ❌ No theoretical vs actual variance
   - ❌ No exception raising for variance
   - **Need:** `dx_material_consumption`

5. **Transfers**
   - ❌ No transfer table
   - ❌ No in-transit tracking
   - ❌ No two-step transfer (out + in)
   - **Need:** `dx_material_transfer`, `dx_material_transfer_item`

6. **Returns**
   - ❌ No return to store table
   - ❌ No return to vendor table
   - ❌ No grading (good/damaged/scrap)
   - **Need:** `dx_material_return`, `dx_return_to_vendor`

7. **Adjustments**
   - ❌ No adjustment tracking
   - ❌ No reason capture
   - ❌ No approval workflow
   - **Need:** `dx_stock_adjustment`

8. **Scrap & Damage**
   - ❌ No scrap tracking
   - ❌ No damage tracking
   - ❌ No responsibility assignment
   - **Need:** `dx_scrap_damage`

9. **Stock Take**
   - ❌ No stock take table
   - ❌ No blind count support
   - ❌ No variance tracking
   - ❌ No recount workflow
   - **Need:** `dx_stock_take`, `dx_stock_take_line`

10. **Valuation**
    - ❌ No valuation method configuration
    - ❌ No weighted average computation
    - ❌ No FIFO support
    - **Need:** `dx_valuation_config`, valuation logic

11. **Reorder**
    - ❌ No reorder level tracking
    - ❌ No min/max level
    - ❌ No auto-indent suggestion
    - **Need:** `dx_reorder_config`

12. **Ageing**
    - ❌ No ageing analysis
    - ❌ No non-moving tracking
    - ❌ No expiry management
    - **Need:** Ageing computation logic

13. **Stock Baseline**
    - ❌ No baseline capture
    - ❌ No reconciliation job
    - **Need:** `dx_stock_baseline`

14. **Bin/Location**
    - ❌ No bin hierarchy
    - ❌ No QC-hold store
    - ❌ No rejection store
    - **Need:** `dx_bin`, `dx_store_type`

---

## Summary

### What Exists
✅ Basic store table
✅ Stock ledger (structure unknown)
✅ GRN table (basic)
✅ Material issue table (basic)

### What's Missing (Critical for Part 15)
❌ Append-only stock ledger with hash chaining
❌ Movement types and batch tracking
❌ Three-way match for GRN
❌ Cost destination for issues
❌ Theoretical vs actual consumption
❌ Transfer and return workflows
❌ Stock take with blind count
❌ Valuation methods
❌ Reorder and ageing management
❌ Stock baseline and reconciliation

### What Must Be Preserved
✅ All existing GRNs, issues, balances
✅ Existing stock balance field (maintained in parallel)
✅ Existing reports produce identical figures
✅ New ledger rows written in same transaction as existing writes

---

## Stock Reconciliation Baseline Plan

**Before Implementation:**
```sql
-- Capture current stock position
CREATE TABLE dx_stock_baseline AS
SELECT 
  store_id,
  material_id,
  SUM(quantity) as current_balance,
  SUM(value) as current_value,
  NOW() as captured_at
FROM stock_ledger
GROUP BY store_id, material_id;
```

**After Implementation:**
```sql
-- Verify ledger reproduces baseline
SELECT 
  b.store_id,
  b.material_id,
  b.current_balance as baseline_qty,
  SUM(CASE WHEN sl.quantity > 0 THEN sl.quantity ELSE 0 END) - 
  SUM(CASE WHEN sl.quantity < 0 THEN ABS(sl.quantity) ELSE 0 END) as ledger_qty,
  b.current_balance - (
    SUM(CASE WHEN sl.quantity > 0 THEN sl.quantity ELSE 0 END) - 
    SUM(CASE WHEN sl.quantity < 0 THEN ABS(sl.quantity) ELSE 0 END)
  ) as variance
FROM dx_stock_baseline b
LEFT JOIN dx_stock_ledger sl ON b.store_id = sl.store_id AND b.material_id = sl.item_id
GROUP BY b.store_id, b.material_id, b.current_balance
HAVING b.current_balance != (
  SUM(CASE WHEN sl.quantity > 0 THEN sl.quantity ELSE 0 END) - 
  SUM(CASE WHEN sl.quantity < 0 THEN ABS(sl.quantity) ELSE 0 END)
);
```

**Acceptance Criteria:** Zero rows returned (perfect reconciliation).

---

## Next Steps

1. Create stock baseline capture
2. Create append-only stock ledger with hash chaining
3. Create GRN extensions with three-way match
4. Create issue extensions with cost destination
5. Create consumption reconciliation
6. Create transfer and return workflows
7. Create stock take with blind count
8. Implement valuation methods
9. Implement reorder and ageing
10. Build UI components (store dashboard, GRN, issue, stock position, ledger, stock take)
11. Implement mobile flows (GRN capture, issue, stock enquiry, blind count)
12. Build reconciliation job
13. Test concurrency (500 parallel issues)
14. Verify zero mismatches

**Ready to proceed with implementation.**
