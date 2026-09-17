# Part 18 — Step Zero Inspection Report

## Existing Billing Tables

Based on `src/config/schema-map.ts`, the following billing-related tables exist:

### Client Billing
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Client Invoice | `client_invoices` | id | status | invoice_number | FK: project_id |
| RA Bill | `ra_bills` | id | status | bill_number | FK: project_id |

### Payment & Receipt
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Payment | `payments` | id | status | payment_number | FK: project_id, vendor_id |
| Receipt | `receipts` | id | status | receipt_number | FK: project_id |

---

## Critical Questions

### 1. How are bills currently computed?

**Current State:**
- ❌ No bill computation logic exists
- ❌ No deduction engine
- ❌ No escalation formula
- ❌ No variation tracking
- ❌ No claim register
- ❌ No certification tracking

**Required for Part 18:**
- Bill generation from certified MBs (Part 17)
- Automated deduction computation
- Escalation formula engine with price indices
- Variation management with approval workflow
- Claims register with notice deadline tracking
- Certification tracking with contractual deadlines

### 2. What is the existing bill structure?

**Current State:**
- Basic invoice and RA bill tables exist
- No bill item detail
- No deduction tracking
- No tax computation
- No certification workflow

**Required for Part 18:**
- Client bill with type (RA, mobilization, milestone, supplementary, final, DLP, escalation, claim)
- Bill items with categories (BOQ, extra, variation, daywork, provisional, MOS, escalation, claim)
- Bill deductions with sequence and computation
- Tax computation (CGST, SGST, IGST, cess)
- Certification workflow (prepared → checked → approved → submitted → certified)

### 3. Existing retention handling?

**Current State:**
- ❌ No retention tracking
- ❌ No retention ledger
- ❌ No DLP management

**Required for Part 18:**
- Retention accrual per bill
- Retention ceiling tracking
- Retention release (50% on completion, 50% after DLP)
- DLP release bill generation

### 4. Existing escalation handling?

**Current State:**
- ❌ No escalation formula
- ❌ No price index tracking
- ❌ No escalation computation

**Required for Part 18:**
- Escalation formula storage (weighted index formula)
- Price index entry and verification
- Escalation computation per bill period
- Two-person verification for indices

### 5. Existing variation handling?

**Current State:**
- ❌ No variation tracking
- ❌ No variation approval workflow
- ❌ No variation billing

**Required for Part 18:**
- Variation register with status tracking
- Variation approval workflow
- Variation billing (only when client-approved)
- At-risk billing flag

---

## GAP LIST

### Critical Gaps for Part 18

1. **Client Bill Structure**
   - ❌ No client bill table with full structure
   - ❌ No bill item table with categories
   - ❌ No bill deduction table with sequence
   - ❌ No tax computation
   - ❌ No certification tracking
   - **Need:** `dx_client_bill`, `dx_client_bill_item`, `dx_client_bill_deduction`

2. **Variation Management**
   - ❌ No variation table
   - ❌ No variation approval workflow
   - ❌ No variation billing integration
   - **Need:** `dx_variation`

3. **Escalation Engine**
   - ❌ No escalation formula table
   - ❌ No price index table
   - ❌ No escalation computation logic
   - **Need:** `dx_escalation_formula`, `dx_price_index`

4. **Claims Management**
   - ❌ No claims register
   - ❌ No notice deadline tracking
   - ❌ No claim settlement workflow
   - **Need:** `dx_claim`

5. **Retention & DLP**
   - ❌ No retention ledger
   - ❌ No DLP tracking
   - ❌ No retention release workflow
   - **Need:** `dx_retention_ledger`, `dx_dlp_tracker`

6. **Certification Tracking**
   - ❌ No certification workflow
   - ❌ No contractual deadline tracking
   - ❌ No shortfall analysis
   - **Need:** `dx_certification_tracking`

7. **Material on Site (MOS)**
   - ❌ No MOS tracking
   - ❌ No automatic reversal
   - **Need:** `dx_mos_tracking`

8. **Bill Generation**
   - ❌ No auto-assembly from certified MBs
   - ❌ No validation logic
   - ❌ No backup pack generation
   - **Need:** Bill generation engine

9. **Client Deduction Reconciliation**
   - ❌ No reconciliation workflow
   - ❌ No categorization of differences
   - **Need:** Reconciliation workbench

10. **Final Bill**
    - ❌ No final bill preconditions
    - ❌ No statement of account
    - **Need:** Final bill logic

---

## Summary

### What Exists
✅ Basic invoice table
✅ Basic RA bill table
✅ Payment and receipt tables

### What's Missing (Critical for Part 18)
❌ Client bill with full structure and workflow
❌ Bill items with categories (BOQ, extra, variation, daywork, etc.)
❌ Bill deductions with sequence and computation
❌ Variation management with approval workflow
❌ Escalation engine with price indices
❌ Claims register with notice deadline tracking
❌ Retention ledger with release workflow
❌ Certification tracking with contractual deadlines
❌ Material on site tracking with automatic reversal
❌ Bill generation from certified MBs
❌ Client deduction reconciliation
❌ Final bill with preconditions

### What Must Be Preserved
✅ All existing invoices and bills
✅ Existing bill numbers and values
✅ Existing print formats
✅ Existing payment and receipt records

---

## Next Steps

1. Create client bill structure tables
2. Create variation management tables
3. Create escalation engine tables
4. Create claims register table
5. Create retention and DLP tables
6. Create certification tracking table
7. Create MOS tracking table
8. Build bill generation engine
9. Build bill workbench UI
10. Build variation register UI
11. Build claims register UI
12. Build escalation working screen
13. Build retention ledger UI
14. Build certification tracker UI
15. Build client deduction reconciliation UI
16. Implement automation features
17. Test bill generation from MBs
18. Verify historical bill recomputation

**Ready to proceed with implementation.**
