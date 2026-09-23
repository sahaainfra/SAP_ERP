# Part 06: User, Role, Responsibility & Permission Model

## Overview

**Part 06 of 69** in the Construction & Infrastructure ERP build programme.

This part establishes the complete authorization model for the ERP system. It provides project-scoped permissions where the same user can have different roles, responsibilities, and authorities on different projects.

**Key Principle:** A user may hold different roles, responsibilities, authorities and permissions on different projects. A Project Manager on Project A may be a Site Engineer on Project B and have no access at all to Project C.

## What This Part Delivers

### 1. Permission Catalogue (`dx_permission`)

Stores all permission keys in the format `module.entity.action`:
- **Module:** 35 registered namespaces (procure, bill, finance, hr, etc.)
- **Entity:** Business object (po, vendor, payment, etc.)
- **Action:** 24 closed-set verbs (view, create, approve, post, etc.)

**Example permissions:**
- `procure.po.view` - View purchase orders
- `procure.po.approve` - Approve purchase orders (requires limit)
- `finance.payment.post` - Post payments (irreversible)
- `hr.payroll.view_salary` - View salary data (sensitive)

### 2. Responsibility Templates (`dx_responsibility_template`)

Named, reusable bundles of permissions:
- **29 system templates** (Project Manager, Site Engineer, Store Keeper, etc.)
- **Custom templates** for organization-specific roles
- **Categories:** execution, commercial, finance, support
- **Version controlled** - edits don't silently change existing assignments

### 3. Project Assignment (`dx_project_assignment`) - CORE TABLE

The heart of the permission model:
- Assigns users to projects with responsibility templates
- **Validity windows** (valid_from, valid_to)
- **Status:** ACTIVE, SUSPENDED, EXPIRED, REVOKED
- **Data scope:** OWN, SITE, PACKAGE, PROJECT, ALL_ASSIGNED
- **Project-specific reporting lines**
- **Immutable audit trail**

### 4. Approval Authority (`dx_approval_authority`)

Per-assignment approval limits:
- **Per document type** (PO, GRN, MB, RA_BILL, PAYMENT, etc.)
- **Per value band** (min_amount, max_amount)
- **Approval level** in chain
- **Capabilities:** approve, reject, return, forward, delegate
- **Self-approval control** (can_approve_own, usually FALSE)
- **Two-person rules** for high-value transactions

### 5. Assignment Permission Overrides (`dx_assignment_permission`)

Explicit grant or deny for specific permissions:
- **DENY always wins** - overrides any template grant
- **Audit trail** with reason
- **Source tracking** (TEMPLATE vs OVERRIDE)

### 6. Assignment Scope (`dx_assignment_scope`)

Restricts assignment to specific resources:
- **SITE** - Specific construction sites
- **PACKAGE** - Work packages
- **WBS** - Work breakdown structure elements
- **COST_CENTRE** - Cost centres
- **STORE** - Store locations

### 7. Delegation (`dx_delegation`)

Temporary delegation of approval authority:
- **Time-bounded** (valid_from, valid_to)
- **Project-scoped** or all projects
- **Document type restrictions**
- **Amount limits** (cannot exceed delegator's authority)
- **Cannot delegate to self**
- **Automatic expiration**

### 8. Field Restriction (`dx_field_restriction`)

Field-level visibility control:
- **VISIBLE** - Field shown normally
- **MASKED** - Field shown as **** (e.g., salary)
- **HIDDEN** - Field not in response at all
- **Per entity, per field**

### 9. Segregation of Duties (`dx_sod_rule`)

Conflict detection:
- **Permission pairs** that cannot be held together
- **Severity:** WARNING (acknowledgement) or BLOCK (prevents save)
- **Rationale** for audit trail
- **Pre-seeded rules:**
  - Cannot create and approve POs
  - Cannot create and approve vendors
  - Cannot create and post payments
  - Cannot create and certify bills

### 10. Assignment Audit (`dx_assignment_audit`)

Immutable audit trail:
- **Append-only** (UPDATE/DELETE revoked)
- **Before/after values** in JSONB
- **Action types:** ASSIGNED, MODIFIED, SUSPENDED, REACTIVATED, REVOKED, EXPIRED, DELEGATED
- **Changed by, when, why**
- **IP address and user agent**

## Four-Layer Permission Resolution

```
LAYER 1: Global Role (existing system)
   ↓
LAYER 2: Project Assignment (which projects)
   ↓
LAYER 3: Project Responsibility (template on that project)
   ↓
LAYER 4: Explicit Override (grant/deny specific keys)
   ↓
EFFECTIVE PERMISSION SET (user × project × permission)
```

**Resolution Rule:** DENY at any layer always wins. Otherwise, permissions are additive.

## TypeScript Services

### PermissionService
- Permission key validation
- Permission registration
- Module/entity permission queries

### ResponsibilityTemplateService
- Template CRUD
- Permission mapping
- System template seeding
- Version control

### ProjectAssignmentService
- Assignment CRUD
- Permission override management
- Approval authority management
- Scope management
- Field restriction management
- Suspension/revocation
- Immutable audit logging

### PermissionResolver
- Four-layer resolution
- Effective permission calculation
- Approval authority checking
- Field masking
- SoD violation detection

### DelegationService
- Delegation CRUD
- Time-bound validation
- Amount limit enforcement
- Automatic expiration

### SodService
- SoD rule management
- Violation detection
- Pre-save validation
- Common rule seeding

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| PERM-01 | BLOCK | Deny by default - absent assignment means no access |
| PERM-02 | BLOCK | Explicit DENY override always wins |
| PERM-03 | BLOCK | Assignment outside validity window grants nothing |
| PERM-04 | BLOCK | Delegation transfers named permissions only, not global role |
| PERM-05 | BLOCK | Substitute must independently hold permission and authority |
| PERM-06 | BLOCK | Approval authority is per project per document type per value band |
| PERM-07 | WARN | Super Admin bypass grants breadth only, never removes SoD controls |

## File Structure

```
src/platform/permission/
├── types.ts                          # All permission types
├── permission.service.ts             # Permission catalogue
├── responsibility-template.service.ts # Template management
├── project-assignment.service.ts     # Assignment management
├── permission-resolver.ts            # Four-layer resolution
├── delegation.service.ts             # Delegation management
├── sod.service.ts                    # SoD rule management
└── index.ts                          # Module exports

migrations/
└── 006_create_permission_model.sql   # Database migration

Documentation:
├── README_PART_06.md                 # This file
├── DB_CHANGELOG.md                   # Updated with migration 006
└── BUILD_PROGRESS.md                 # Updated with Part 06
```

## Usage Examples

### Creating a Project Assignment

```typescript
import { projectAssignmentService } from './platform/permission';

const assignment = projectAssignmentService.assign({
  userId: 123,
  projectId: 456,
  companyId: 1,
  templateId: 5, // Project Manager template
  designationLabel: 'Project Manager — Package 2',
  isPrimaryProject: true,
  dataScope: 'PROJECT',
  validFrom: '2026-01-01',
  validTo: '2026-12-31',
  assignedBy: 1, // Super Admin
});
```

### Checking Permission

```typescript
import { permissionResolver } from './platform/permission';

const hasPermission = permissionResolver.hasPermission(
  123, // userId
  456, // projectId
  'procure.po.approve'
);
```

### Checking Approval Authority

```typescript
const { canApprove, reason } = permissionResolver.canApprove(
  123, // userId
  456, // projectId
  'PO', // documentType
  500000 // amount
);

if (!canApprove) {
  console.log(`Cannot approve: ${reason}`);
}
```

### Masking Sensitive Fields

```typescript
const maskedData = permissionResolver.maskFields(
  123, // userId
  456, // projectId
  'employee', // entity
  employeeData
);
// Salary field will be masked or hidden based on field restrictions
```

### Checking SoD Violations

```typescript
import { sodService } from './platform/permission';

const violations = sodService.checkViolations(123, 456);

if (violations.length > 0) {
  for (const violation of violations) {
    console.log(`SoD violation: ${violation.rule.ruleName}`);
    console.log(`Severity: ${violation.rule.severity}`);
  }
}
```

### Delegating Authority

```typescript
import { delegationService } from './platform/permission';

const delegation = delegationService.create({
  fromUserId: 123,
  toUserId: 456,
  projectId: 789,
  documentTypes: ['PO', 'GRN'],
  maxAmount: 100000,
  validFrom: '2026-06-01T00:00:00Z',
  validTo: '2026-06-15T23:59:59Z',
  reason: 'Annual leave',
  createdBy: 1,
});
```

## Database Schema

### Core Tables

1. **dx_permission** - Permission catalogue
2. **dx_responsibility_template** - Responsibility templates
3. **dx_responsibility_template_permission** - Template-permission mapping
4. **dx_project_assignment** - User × project assignment (CORE)
5. **dx_assignment_permission** - Permission overrides
6. **dx_approval_authority** - Approval limits
7. **dx_assignment_scope** - Resource restrictions
8. **dx_delegation** - Temporary delegation
9. **dx_field_restriction** - Field visibility
10. **dx_sod_rule** - SoD rules
11. **dx_assignment_audit** - Immutable audit trail

### Key Relationships

```
dx_user (existing)
   ↓
dx_project_assignment (user × project)
   ↓
dx_responsibility_template (permissions bundle)
   ↓
dx_responsibility_template_permission
   ↓
dx_permission (permission catalogue)
   
dx_project_assignment
   ↓
dx_approval_authority (approval limits)
dx_assignment_permission (overrides)
dx_assignment_scope (resource restrictions)
dx_field_restriction (field visibility)
```

## Acceptance Criteria

- [x] 11 database tables created with all constraints
- [x] Permission key format validation (module.entity.action)
- [x] 29 system templates defined
- [x] Four-layer permission resolution implemented
- [x] DENY override precedence enforced
- [x] Approval authority with value limits
- [x] Delegation with time bounds and amount limits
- [x] Field-level masking (VISIBLE/MASKED/HIDDEN)
- [x] SoD rules with WARNING and BLOCK severity
- [x] Immutable audit trail
- [x] All TypeScript services implemented
- [x] Build successful with no errors

## What Part 06 Does NOT Do

- ❌ Does not implement actual permission checks in API endpoints (Part 07)
- ❌ Does not implement the Super Admin console UI (Part 07)
- ❌ Does not implement the permission resolution cache (Part 07)
- ❌ Does not migrate existing users to the new model (Part 07)
- ❌ Does not implement the permission matrix UI (Part 07)

**Part 06 defines the data model and services. Part 07 implements the resolution engine and admin console.**

## Next Steps

**Part 07: Permission Resolution Engine & Super Admin Console**
- Implement the resolution engine with caching
- Build the Super Admin console with three views (Project, User, Matrix)
- Implement the assignment editor with five tabs
- Build bulk assign, copy-project, and CSV import
- Migrate existing users to the new model
- Implement real-time permission updates

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All permission services compile correctly
- Database migration validated

---

**Part 06 of 69 — Complete** ✅  
**Progress: 8.7% of total build**  
**Next: Part 07 — Permission Resolution Engine & Super Admin Console**
