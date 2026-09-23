# Part 08 Completion Summary

## Part 08: Permission Engine — Server-Side Implementation

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Progress:** 8 of 69 parts (11.6%)

---

## What Was Delivered

### 1. Permission Guard (`permission-guard.ts`)

**Route-level permission enforcement**

- `@RequiresPermission` decorator for endpoints
- Fails closed: endpoints without metadata rejected at boot
- Dynamic permission keys based on request
- Project-scoped permission checks
- Audit logging of denied attempts
- Boot-time assertion: `assertAllEndpointsHavePermissions()`

**Key Features:**
- WeakMap-based metadata storage (no Reflect dependency)
- Support for body/query/param/resource project resolution
- PermissionGuardError with detailed context

### 2. Query Filter (`query-filter.ts`)

**Query-level permission enforcement**

- Entity scope specifications registry
- 15+ entities registered with row-level security
- Project/site/package/store-level filtering
- Owner-level filtering (own records only)
- OR-of-AND grouping for complex scopes
- Applies to COUNT, SUM, AVG aggregates

**Registered Entities:**
- Procurement: purchase_order, purchase_requisition, vendor
- Store: stock_item, grn
- Finance: payment, receipt, voucher
- Billing: client_bill, subcontractor_bill
- HR: employee, attendance
- Quality: inspection
- Safety: incident
- Equipment: equipment

### 3. Field Masker (`field-masker.ts`)

**Field-level permission enforcement**

- HIDE/MASK/REDACT/VISIBLE modes
- Standard field restrictions for sensitive data
- Applied to JSON, CSV, PDF, charts, aggregates
- Aggregate leak prevention
- Pattern-based masking (e.g., "****1234")

**Standard Restrictions:**
- Financial data (rates, values, margins) — HIDE
- HR data (salary, bank accounts) — HIDE/MASK
- Vendor data (bank accounts) — MASK
- Sealed quotations (rates) — REDACT

### 4. Action Policy (`action-policy.ts`)

**Action-level permission enforcement**

- Record/value/time-level checks
- Authority limit validation
- Self-approval prevention
- Segregation of duties (against audit log)
- Impersonation restrictions
- State transition validation
- Policy registry with boot-time assertion

**Registered Policies:**
- `po.release` — Purchase order release
- `payment.post` — Payment posting

### 5. Menu Service (`menu-service.ts`)

**Server-driven, permission-filtered navigation**

- Permission-filtered menu items
- Recursive child filtering
- Empty parent pruning
- Context projects list
- Version tracking for cache invalidation
- Default menu structure with 10+ sections

**Default Menu:**
- Dashboard
- Projects
- Procurement (PO, Indents, Vendors)
- Store & Inventory (Stock, GRN, Issue)
- Finance (Vouchers, Payments, Receipts)
- Billing (Client Bills, SC Bills)
- HR & Payroll (Employees, Attendance, Payroll)
- Quality (Inspections)
- Safety (Incidents)
- Equipment
- Administration (Responsibilities, Audit Log)

---

## Four Enforcement Points

```
1. ROUTE GUARD      — may this actor invoke this operation at all?
2. QUERY FILTER     — which rows may this actor see?
3. FIELD MASKING    — which columns of those rows?
4. ACTION VALIDATION— may this actor do this to THIS record, at THIS value, now?
```

---

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| ENF-01 | BLOCK | Endpoint with no declared permission key fails boot |
| ENF-02 | BLOCK | Repository methods accept only CompiledWhere from QueryFilter |
| ENF-03 | BLOCK | Aggregates use same filter as lists |
| ENF-04 | BLOCK | Masked field is masked everywhere (JSON, CSV, PDF, charts) |
| ENF-05 | BLOCK | Out-of-scope record fetched by id returns 404, not 403 |
| ENF-06 | BLOCK | Action with no policy fails boot |

---

## Security Features

### Impersonation Protection
- Impersonated actors cannot approve, post, pay, certify, or restore
- Every audit row records both identities
- Checked in action policies

### Field Masking Everywhere
- JSON responses
- CSV/Excel exports
- PDF prints
- Chart series and aggregates
- `$filter` and `$orderby`
- Public API and portals

### Aggregate Leak Prevention
- Aggregates use same filter as lists
- If any field in aggregate is restricted, entire aggregate is suppressed
- No approximation or rounding

### Out-of-Scope Handling
- Record fetched by id that user cannot see returns 404
- Deliberately indistinguishable from missing record
- Does not confirm existence

---

## File Structure

```
src/platform/permission/
├── permission-guard.ts      # Route-level enforcement
├── query-filter.ts          # Query-level enforcement
├── field-masker.ts          # Field-level enforcement
├── action-policy.ts         # Action-level enforcement
├── menu-service.ts          # Server-driven menu
└── index.ts                 # Module exports (updated)
```

---

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All permission engine components compile correctly
- Output: 695KB JS, 58KB CSS

---

## What Part 08 Does NOT Do

- ❌ Does not implement actual database queries (uses in-memory data)
- ❌ Does not implement actual Redis cache (uses in-memory Map)
- ❌ Does not implement actual real-time event pushing
- ❌ Does not implement actual audit logging to database
- ❌ Does not implement actual menu items from database

**Part 08 defines the enforcement framework. Actual database integration happens in later parts.**

---

## Next Steps

**Part 09: Document Framework**
- Draft handling
- State machine
- Numbering
- Audit hash chain
- Outbox

---

## Acceptance Criteria

- [x] Permission Guard with @RequiresPermission decorator
- [x] Query Filter with entity scope registry (15+ entities)
- [x] Field Masker with HIDE/MASK/REDACT modes
- [x] Action Policy with record/value/time checks
- [x] Menu Service with permission filtering
- [x] Boot-time assertions for endpoints and actions
- [x] Standard field restrictions configured
- [x] Build successful with no errors

---

**Part 08 of 69 — Complete** ✅  
**Progress: 11.6% of total build**  
**Next: Part 09 — Document Framework**
