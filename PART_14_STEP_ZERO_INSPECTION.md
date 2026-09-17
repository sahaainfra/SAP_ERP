# Part 14 — Step Zero Inspection Report

## Existing Procurement Tables

Based on `src/config/schema-map.ts`, the following procurement-related tables exist:

### Indent / Purchase Requisition
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Material Requisition (Indent) | `material_requisitions` | id | status | mr_number | FK: project_id, site_id, requested_by |
| Purchase Requisition | `purchase_requisitions` | id | status | pr_number | FK: project_id, mr_id, requested_by |

### RFQ & Quotation
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| RFQ | `rfqs` | id | status | rfq_number | FK: pr_id |
| Quotation | `quotations` | id | status | quotation_number | FK: rfq_id, vendor_id |
| Comparative Statement | `comparative_statements` | id | status | cs_number | FK: rfq_id, prepared_by |

### Purchase Order
| Business Object | Table | PK | Status Field | Numbering | Soft Delete | Notes |
|---|---|---|---|---|---|---|
| Purchase Order | `purchase_orders` | id | status | po_number | deleted_at | FK: project_id, vendor_id |

---

## Existing Workflow Analysis

### Current Indent Flow
1. User creates Material Requisition (MR)
2. MR converts to Purchase Requisition (PR)
3. PR triggers RFQ creation
4. Vendors submit quotations
5. Comparative statement prepared
6. PO created and approved
7. PO released to vendor

### Current Status Fields
- **Indent/PR**: `status` field (values unknown - need to inspect actual data)
- **RFQ**: `status` field (values unknown)
- **Quotation**: `status` field (values unknown)
- **Comparative**: `status` field (values unknown)
- **PO**: `status` field (values unknown)

### Current Numbering
- MR: `mr_number` (format unknown)
- PR: `pr_number` (format unknown)
- RFQ: `rfq_number` (format unknown)
- Quotation: `quotation_number` (format unknown)
- CS: `cs_number` (format unknown)
- PO: `po_number` (format unknown)

---

## PO Value Computation (Current State)

**Unknown - Requires Investigation:**
- How are taxes (GST) currently calculated?
- Are discounts applied at line level or header level?
- How is freight handled?
- Are there other charges (loading, insurance, etc.)?
- What is the current total computation formula?

**Critical:** Must preserve existing computation logic for historical POs.

---

## Existing PO Print Formats

**Unknown - Requires Investigation:**
- What print templates exist?
- What fields are included?
- Are there multiple formats (detailed, summary)?
- What is the current signatory block structure?

---

## Existing Integrations

**Unknown - Requires Investigation:**
- What external systems read PO data?
- Are there API endpoints for PO retrieval?
- What reports consume PO data?
- Are there downstream workflows (GRN, payment)?

---

## GAP LIST

### Critical Gaps for Part 14

1. **Indent Extensions**
   - ❌ No WBS/cost code linkage
   - ❌ No indent type classification (REGULAR/URGENT/EMERGENCY/STOCK_REPLENISH/CAPEX)
   - ❌ No budget check tracking
   - ❌ No stock check tracking
   - ❌ No theoretical requirement check
   - ❌ No duplicate indent detection
   - ❌ No lead time check
   - ❌ No consolidation grouping
   - ❌ No auto-generation flag
   - **Need:** `dx_indent_extension`, `dx_indent_item_extension`

2. **RFQ Enhancements**
   - ❌ No RFQ type (OPEN/LIMITED/SINGLE/RATE_CONTRACT)
   - ❌ No sealed RFQ support
   - ❌ No vendor invitation tracking
   - ❌ No portal token for vendor access
   - ❌ No minimum quotation enforcement
   - ❌ No RFQ-indent mapping
   - **Need:** `dx_rfq` (enhanced), `dx_rfq_indent_map`, `dx_rfq_vendor`

3. **Quotation Enhancements**
   - ❌ No landed rate computation
   - ❌ No freight/loading/other charges breakdown
   - ❌ No discount tracking (amount and percentage)
   - ❌ No technical acceptance flag
   - ❌ No entry mode tracking (MANUAL/PORTAL/EMAIL_OCR)
   - ❌ No deviation notes
   - **Need:** `dx_quotation` (enhanced), `dx_quotation_item`

4. **Comparative Statement Enhancements**
   - ❌ No evaluation basis (L1_ITEMWISE/L1_TOTAL/QCBS/LIFECYCLE)
   - ❌ No technical/commercial weights for QCBS
   - ❌ No recommendation tracking
   - ❌ No deviation reason capture
   - ❌ No saving vs budget/last purchase
   - ❌ No negotiation round tracking
   - **Need:** `dx_comparative` (enhanced), `dx_comparative_recommendation`

5. **PO Extensions**
   - ❌ No comparative/rate contract linkage
   - ❌ No WBS/cost code linkage
   - ❌ No PO type classification
   - ❌ No delivery location
   - ❌ No Incoterm
   - ❌ No tolerance percentages (qty/value)
   - ❌ No advance/retention tracking
   - ❌ No LD clause
   - ❌ No warranty tracking
   - ❌ No budget status/override
   - ❌ No vendor compliance check
   - ❌ No release/acknowledgement tracking
   - ❌ No closure tracking
   - **Need:** `dx_po_extension`

6. **PO Delivery Schedule**
   - ❌ No delivery schedule table
   - ❌ No scheduled vs delivered tracking
   - ❌ No revision tracking
   - **Need:** `dx_po_delivery_schedule`

7. **PO Amendments**
   - ❌ No amendment tracking
   - ❌ No before/after snapshots
   - ❌ No value impact calculation
   - ❌ No amendment type classification
   - **Need:** `dx_po_amendment`

8. **Pre-submission Checks**
   - ❌ No stock check (on-hand, in-transit, already ordered)
   - ❌ No theoretical requirement check
   - ❌ No budget check (WITHIN/EXCEEDED/NO_BUDGET/OVERRIDDEN)
   - ❌ No duplicate indent check
   - ❌ No lead time check
   - **Need:** Application logic + UI components

9. **PO Release Gates**
   - ❌ No comparative/rate contract validation
   - ❌ No vendor compliance check
   - ❌ No budget check
   - ❌ No approval authority check
   - ❌ No rate match check
   - ❌ No delivery schedule check
   - ❌ No procurement ceiling check
   - **Need:** Application logic

10. **Sealed RFQ**
    - ❌ No encryption for sealed quotes
    - ❌ No two-person opening rule
    - ❌ No opening audit trail
    - **Need:** Encryption logic + UI + audit

11. **Landed Rate Computation**
    - ❌ No landed rate calculation
    - ❌ No freight apportionment
    - ❌ No tax handling (creditable vs non-creditable GST)
    - **Need:** Computation logic

12. **Negotiation Tracking**
    - ❌ No negotiation round versioning
    - ❌ No original quote preservation
    - ❌ No negotiation audit trail
    - **Need:** Version control logic

13. **Rate Contract Management**
    - ❌ No rate contract table
    - ❌ No ceiling tracking (value/quantity)
    - ❌ No consumption tracking
    - ❌ No release management
    - **Need:** Rate contract tables + logic

14. **Automation**
    - ❌ No auto-generation from material requirement plan
    - ❌ No auto-suggestion of vendors
    - ❌ No auto-reminders for vendors
    - ❌ No auto-close of RFQ
    - ❌ No auto-computation of landed rates
    - ❌ No auto-alert for delivery breaches
    - ❌ No auto-short-close of POs
    - ❌ No auto-raise of constraints
    - ❌ No price trend tracking
    - **Need:** Automation logic + background jobs

---

## Existing Approval Routing

**Unknown - Requires Investigation:**
- What is the current approval workflow?
- Who approves indents?
- Who approves POs?
- Are there value-based approval levels?
- Is there delegation support?

**Action:** Must preserve existing routing; new routing is configurable, not forced.

---

## Summary

### What Exists
✅ Basic indent (MR/PR) tables
✅ RFQ table
✅ Quotation table
✅ Comparative statement table
✅ PO table
✅ Basic status tracking
✅ Basic numbering

### What's Missing (Critical for Part 14)
❌ Indent extensions (WBS, budget check, stock check, theoretical check)
❌ RFQ enhancements (type, sealed, vendor invitation, portal)
❌ Quotation enhancements (landed rate, charges, technical acceptance)
❌ Comparative enhancements (evaluation basis, recommendation, negotiation)
❌ PO extensions (comparative linkage, delivery schedule, amendments)
❌ Pre-submission checks (5 mandatory checks)
❌ PO release gates (7 mandatory gates)
❌ Sealed RFQ with encryption
❌ Landed rate computation
❌ Negotiation tracking
❌ Rate contract management
❌ Automation (9 auto features)

### What Must Be Preserved
✅ Existing indent/PO numbers
✅ Existing PO values and totals
✅ Existing print formats
✅ Existing approval routing
✅ Existing integrations
✅ All historical data unchanged

---

## PO Value Reconciliation Plan

**Before Implementation:**
```sql
-- Capture current PO totals
SELECT 
  po_number,
  total_amount as current_total,
  -- Add tax/freight/discount breakdown if available
FROM purchase_orders
ORDER BY po_number;
```

**After Implementation:**
```sql
-- Verify new computation matches
SELECT 
  po.po_number,
  po.total_amount as current_total,
  po_ext.computed_total as new_total,
  CASE 
    WHEN po.total_amount = po_ext.computed_total THEN 'MATCH'
    ELSE 'MISMATCH'
  END as reconciliation_status
FROM purchase_orders po
LEFT JOIN dx_po_extension po_ext ON po.id = po_ext.po_id
WHERE po.total_amount != po_ext.computed_total;
```

**Acceptance Criteria:** Zero mismatches allowed.

---

## Next Steps

1. Create extension tables for indent, RFQ, quotation, comparative, PO
2. Build pre-submission check logic (stock, theoretical, budget, duplicate, lead time)
3. Build PO release gate logic (7 gates)
4. Implement sealed RFQ with encryption
5. Implement landed rate computation
6. Build comparative statement auto-generation
7. Implement negotiation round tracking
8. Build rate contract management
9. Implement automation features
10. Build UI components (indent workbench, RFQ builder, comparative screen, PO page)
11. Create reconciliation query for historical POs
12. Test all integrations

**Ready to proceed with implementation.**
