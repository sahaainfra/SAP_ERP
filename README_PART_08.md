# Part 08: Permission Engine — Server-Side Implementation

## Overview

Part 08 implements server-side permission enforcement at four critical points:
1. **Route Guard** — May this actor invoke this operation at all?
2. **Query Filter** — Which rows may this actor see?
3. **Field Masking** — Which columns of those rows?
4. **Action Validation** — May this actor do this to THIS record, at THIS value, now?

This ensures no module, API, report, dashboard, export, print, chat message, scheduled job or AI answer can return a row or figure the requesting user is not authorized to see.

## Key Principle

**Point 4 is the one most systems miss.** "Can approve purchase orders" is not the same as "can approve *this* ₹47 lakh purchase order on *this* project, today, having not raised it themselves".

## Implementation

### 1. Permission Guard (`permission-guard.ts`)

Route-level permission enforcement using decorators.

**Features:**
- `@RequiresPermission` decorator for endpoints
- Fails closed: endpoints without permission metadata are rejected at boot
- Supports dynamic permission keys based on request
- Project-scoped permission checks
- Audit logging of denied attempts

**Usage:**
```typescript
@RequiresPermission('procure.po.view')
async list() { ... }

@RequiresPermission('procure.po.view', { 
  projectFrom: 'param', 
  projectField: 'projectId' 
})
async get(@Param('projectId') projectId: number) { ... }
```

**Boot-Time Assertion:**
```typescript
assertAllEndpointsHavePermissions(controllers);
```

### 2. Query Filter (`query-filter.ts`)

Query-level permission enforcement. Injects row-level security into every SELECT.

**Features:**
- Entity scope specifications registry
- Project-level filtering
- Site/package/store-level filtering
- Owner-level filtering (own records only)
- OR-of-AND grouping for complex scopes
- Applies to COUNT, SUM, AVG aggregates

**Entity Scope Specification:**
```typescript
export const ENTITY_SCOPES: Record<string, EntityScopeSpec> = {
  'purchase_order': {
    projectColumn: 'project_id',
    viewKey: 'procure.po.view',
    siteColumn: 'site_id',
    ownerColumn: 'created_by',
    ownerBypassKey: 'procure.po.view_all',
  },
  // ... more entities
};
```

**Usage:**
```typescript
const where = queryFilter.apply('purchase_order', baseWhere, actor);
// Returns: { sql: 'project_id IN (?) AND site_id IN (?)', params: [...] }
```

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

Field-level permission enforcement. Masks or hides fields based on actor's permissions.

**Modes:**
- **HIDE** — Remove field from response entirely
- **MASK** — Replace value with placeholder (e.g., "****")
- **REDACT** — Set to null
- **VISIBLE** — No restriction

**Standard Field Restrictions:**
```typescript
export const STANDARD_FIELD_RESTRICTIONS: Record<string, FieldMaskRule> = {
  'po.totalValue': { mode: 'HIDE' },
  'poItem.rate': { mode: 'HIDE' },
  'workforce.salary': { mode: 'HIDE' },
  'workforce.bankAccount': { mode: 'MASK', pattern: '****' },
  'quotationItem.rate': { mode: 'REDACT' },
  // ... more fields
};
```

**Usage:**
```typescript
const masked = fieldMasker.apply('purchase_order', record, actor);
// Returns record with restricted fields masked/hidden
```

**Applied Everywhere:**
- JSON responses
- CSV/Excel exports
- PDF prints
- Chart series and aggregates
- `$filter` and `$orderby`
- Public API and portals

### 4. Action Policy (`action-policy.ts`)

Action-level permission enforcement. Validates record-level, value-level, and time-level checks.

**Checks Performed:**
1. Permission (route-level)
2. Authority limit (value-level)
3. Self-approval prevention
4. Segregation of duties (against audit log)
5. Device restrictions
6. Impersonation restrictions
7. State transitions

**Policy Interface:**
```typescript
export interface ActionPolicy<TRecord> {
  action: string;
  permission: PermissionKey;
  evaluate(record: TRecord, actor: Actor, ctx: PolicyContext): Promise<PolicyResult>;
}
```

**Example Policy:**
```typescript
export class PoReleasePolicy extends BaseActionPolicy<PurchaseOrder> {
  action = 'po.release';
  permission = 'procure.po.release';

  protected async evaluateSpecific(po, actor, ctx) {
    const reasons = [];

    // Check approval authority
    const authority = actor.authorityFor('PO', po.totalValue);
    if (!authority) reasons.push('NO_APPROVAL_AUTHORITY');
    else if (authority.maxAmount && po.totalValue > authority.maxAmount) {
      reasons.push(`AUTHORITY_EXCEEDED:${authority.maxAmount}`);
    }

    // Check self-approval
    if (po.createdBy === actor.userId && !authority?.canApproveOwn) {
      reasons.push('SELF_APPROVAL_NOT_PERMITTED');
    }

    // Check segregation of duties
    const sodResult = await sodEvaluator.wouldCreateViolation(
      actor.userId, po.projectId, this.permission
    );
    if (sodResult.wouldViolate) {
      reasons.push(`SOD_CONFLICT:${sodResult.violations[0]?.rule.ruleCode}`);
    }

    return reasons;
  }
}
```

**Registered Policies:**
- `po.release` — Purchase order release
- `payment.post` — Payment posting

### 5. Menu Service (`menu-service.ts`)

Server-driven, permission-filtered navigation menu.

**Features:**
- Permission-filtered menu items
- Recursive child filtering
- Empty parent pruning
- Context projects list
- Version tracking for cache invalidation

**Usage:**
```typescript
const menu = menuService.getMenu(actor, projectId);
// Returns: { items: [...], contextProjects: [...], version: '...' }
```

**Default Menu Structure:**
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

## Four Enforcement Points

```
1. ROUTE GUARD      — may this actor invoke this operation at all?
2. QUERY FILTER     — which rows may this actor see?
3. FIELD MASKING    — which columns of those rows?
4. ACTION VALIDATION— may this actor do this to THIS record, at THIS value, now?
```

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| ENF-01 | BLOCK | Endpoint with no declared permission key fails boot |
| ENF-02 | BLOCK | Repository methods accept only CompiledWhere from QueryFilter |
| ENF-03 | BLOCK | Aggregates use same filter as lists |
| ENF-04 | BLOCK | Masked field is masked everywhere (JSON, CSV, PDF, charts) |
| ENF-05 | BLOCK | Out-of-scope record fetched by id returns 404, not 403 |
| ENF-06 | BLOCK | Action with no policy fails boot |

## Caching & Invalidation

**Cache Key:** `perm:{userId}:{projectId}`  
**TTL:** 300 seconds (5 minutes)  
**Super Admin TTL:** 60 seconds (1 minute)

**Invalidation Events:**
1. Assignment created/modified/suspended/revoked
2. Template propagated to assignments
3. Delegation created/revoked/expired
4. Global role changed
5. Project status changed

**Real-Time Event:** `permission.refresh` pushed to user's session  
**UI Response:** Re-fetch menu and re-render within 5 seconds

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

## File Structure

```
src/platform/permission/
├── permission-guard.ts      # Route-level enforcement
├── query-filter.ts          # Query-level enforcement
├── field-masker.ts          # Field-level enforcement
├── action-policy.ts         # Action-level enforcement
├── menu-service.ts          # Server-driven menu
└── index.ts                 # Module exports
```

## Testing Requirements

1. **Endpoint permission matrix test** — every route × actor lacking key → 403
2. **Cross-project isolation test** — actor assigned to Project A queries Project B record → 404
3. **Masking test** — restricted field absent in JSON, CSV, XLSX, PDF, aggregates
4. **Aggregate leak test** — scoped user's SUM equals SUM over visible rows only
5. **SoD test** — user performs action A on document X, attempts action B → blocked
6. **Authority test** — approve at limit passes, limit + ₹1 fails
7. **Cache invalidation test** — revoke permission, next request within TTL is denied
8. **Impersonation test** — impersonated actor denied approve/post/pay/certify

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All permission engine components compile correctly
- Output: 695KB JS, 58KB CSS

## What Part 08 Delivers

✅ **Permission Guard** — Route-level enforcement with decorators  
✅ **Query Filter** — Query-level enforcement with entity scope specs  
✅ **Field Masker** — Field-level enforcement with HIDE/MASK/REDACT modes  
✅ **Action Policy** — Action-level enforcement with record/value/time checks  
✅ **Menu Service** — Server-driven, permission-filtered navigation  
✅ **Boot-Time Assertions** — Fail fast if endpoints/actions missing declarations  
✅ **Standard Field Restrictions** — Pre-configured sensitive field masking  
✅ **Entity Scope Registry** — 15+ entities with row-level security specs  

## Next Steps

**Part 09: Document Framework**
- Draft handling
- State machine
- Numbering
- Audit hash chain
- Outbox

---

**Part 08 of 69 — Complete** ✅  
**Progress: 11.6% of total build**  
**Next: Part 09 — Document Framework**
