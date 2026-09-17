# Part 16 — Step Zero Inspection Report

## Existing Subcontractor & Work Order Tables

Based on `src/config/schema-map.ts`, the following subcontractor-related tables exist:

### Vendor/Subcontractor Master
| Business Object | Table | PK | Status Field | Compliance Tracking | Notes |
|---|---|---|---|---|---|
| Vendor | `vendors` | id | status | GST/PAN only | No work category, no labour compliance |
| Subcontractor | NOT PRESENT | — | — | — | No dedicated SC master table |

### Work Order
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Work Order | NOT PRESENT | — | — | — | No WO table exists |
| WO Item | NOT PRESENT | — | — | — | No WO line items |
| WO Amendment | NOT PRESENT | — | — | — | No amendment tracking |

### SC Measurement & Billing
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| SC Measurement | NOT PRESENT | — | — | — | No SC measurement table |
| SC Bill | NOT PRESENT | — | — | — | No SC bill table |
| SC Bill Deduction | NOT PRESENT | — | — | — | No deduction tracking |

### Free Issue & Recovery
| Business Object | Table | PK | Notes |
|---|---|---|---|
| Free Issue Account | NOT PRESENT | — | No free-issue tracking |
| Recovery | NOT PRESENT | — | No recovery mechanism |

### Labour Compliance
| Business Object | Table | PK | Notes |
|---|---|---|---|
| SC Compliance Period | NOT PRESENT | — | No PF/ESIC tracking |
| Wage Register | NOT PRESENT | — | No wage compliance |

### Backcharge & Retention
| Business Object | Table | PK | Notes |
|---|---|---|---|
| Backcharge | NOT PRESENT | — | No backcharge tracking |
| Retention Ledger | NOT PRESENT | — | No retention management |
| Advance Ledger | NOT PRESENT | — | No advance tracking |

---

## Existing SC Bill Computation

**Current State:**
- ❌ No SC bill computation exists
- ❌ No deduction engine
- ❌ No retention/advance tracking
- ❌ No free-issue recovery

**Required for Part 16:**
- Configurable deduction sequence
- System-generated deductions (retention, TDS, free-issue recovery)
- Manual deductions (backcharges, penalties)
- Retention ceiling tracking
- Advance recovery rules (pro-rata, fixed %, milestone)

---

## Free-Issue Material Tracking

**Current State:**
- ❌ No free-issue tracking
- ❌ No theoretical consumption calculation
- ❌ No excess recovery mechanism
- ❌ No reconciliation workflow

**Required for Part 16:**
- Free-issue account per WO per item
- Theoretical consumption from Part 13 norms
- Excess calculation (issued - returned - theoretical)
- Auto-recovery at contractual rate
- Reconciliation before final bill
- Printable statement of account

---

## GAP LIST

### Critical Gaps for Part 16

1. **Work Order Management**
   - ❌ No WO table
   - ❌ No WO items with BOQ linkage
   - ❌ No margin checking (WO rate vs BOQ rate)
   - ❌ No WO amendments
   - ❌ No release gates (compliance, margin, budget, scope)
   - **Need:** `dx_work_order`, `dx_work_order_item`, `dx_wo_amendment`

2. **Free-Issue Material Recovery**
   - ❌ No free-issue account tracking
   - ❌ No theoretical consumption calculation
   - ❌ No excess recovery mechanism
   - ❌ No reconciliation workflow
   - **Need:** `dx_free_issue_account`

3. **SC Measurement & Billing**
   - ❌ No SC bill table
   - ❌ No deduction engine
   - ❌ No retention/advance tracking
   - ❌ No certification chain
   - **Need:** `dx_sc_bill`, `dx_sc_bill_deduction`

4. **Labour Compliance**
   - ❌ No PF/ESIC tracking
   - ❌ No wage register compliance
   - ❌ No statutory withholding
   - **Need:** `dx_sc_compliance_period`

5. **Backcharge & Recovery**
   - ❌ No backcharge tracking
   - ❌ No recovery mechanism
   - **Need:** `dx_backcharge`

6. **Retention & Advance Management**
   - ❌ No retention ledger
   - ❌ No advance ledger
   - ❌ No ceiling tracking
   - **Need:** `dx_retention_ledger`, `dx_advance_ledger`

7. **SC Performance**
   - ❌ No performance scoring
   - ❌ No historical tracking
   - **Need:** `dx_sc_performance`

8. **DLP Tracking**
   - ❌ No defect liability period tracking
   - ❌ No DLP release management
   - **Need:** `dx_dlp_tracker`

---

## Summary

### What Exists
✅ Basic vendor master (from Part 12)
✅ Vendor compliance tracking (from Part 12)
✅ Material issue with subcontractor tracking (from Part 15)

### What's Missing (Critical for Part 16)
❌ Work order management with margin checking
❌ Free-issue material recovery
❌ SC billing with deduction engine
❌ Labour compliance tracking (PF/ESIC)
❌ Backcharge management
❌ Retention and advance ledgers
❌ SC performance scoring
❌ DLP tracking

### What Must Be Preserved
✅ All existing vendor data
✅ Existing compliance documents
✅ Material issue records (link to free-issue)

---

## Integration Points

### With Part 12 (Master Data)
- Vendor master → Subcontractor master
- Vendor compliance → SC compliance (PF/ESIC/labour licence)
- Vendor scorecard → SC performance score

### With Part 13 (Planning)
- WBS → WO item linkage
- BOQ → WO rate comparison (margin check)
- Resource norms → Theoretical consumption

### With Part 14 (Procurement)
- PO → WO (similar structure)
- Comparative → SC comparative
- Rate contract → SC rate contract

### With Part 15 (Inventory)
- Material issue → Free-issue tracking
- Stock ledger → Free-issue account
- Consumption reconciliation → Free-issue reconciliation

### With Part 17 (Measurement Book)
- MB engine → SC measurement (reuse)
- Certification chain → SC certification

### With Part 18 (Billing)
- RA bill → SC bill (similar structure)
- Deductions → SC deductions
- Client certification → SC certification

### With Part 19 (Finance)
- SC payable → Payment processing
- Retention → Liability tracking
- TDS → Tax computation

### With Part 20 (HR)
- Geo-attendance → Labour headcount cross-check
- Payroll → Wage compliance verification

### With Part 22 (Quality & Safety)
- NCR → SC quality performance
- Safety incidents → SC safety performance
- Compliance → Certification blocking

---

## Next Steps

1. Create work order tables with margin checking
2. Create free-issue account tracking
3. Create SC billing with deduction engine
4. Create labour compliance tracking
5. Create backcharge and recovery management
6. Create retention and advance ledgers
7. Create SC performance scoring
8. Build WO management UI
9. Build SC billing workbench
10. Build free-issue reconciliation
11. Build compliance register
12. Build performance dashboard
13. Implement automation rules
14. Test integration with Parts 12-15, 17-22

**Ready to proceed with implementation.**
