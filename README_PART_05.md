# Part 05: API Contract, Validation & Error Framework

## Overview

Part 05 establishes the standardized API contract that all subsequent modules will use. This includes response envelopes, query filtering, pagination, concurrency control, idempotency, validation framework, and error handling.

**Build Order:** Part 04 → **Part 05** → Part 06  
**Status:** ✅ Complete

## What Was Implemented

### 1. API Response Envelope (`src/shared/api/envelope.ts`)

Standardized response format for all API endpoints:

**Success Response:**
```typescript
{
  ok: true,
  data: T,
  meta?: {
    page?: { skip, top, total, hasMore, cursor? },
    totals?: Record<string, string | number>,
    masked?: string[],
    warnings?: ApiIssue[],
    generatedAt: string,
    correlationId: string
  }
}
```

**Failure Response:**
```typescript
{
  ok: false,
  error: {
    code: string,
    message: string,
    severity: 'ERROR' | 'WARNING',
    target?: string,
    details?: ApiIssue[],
    remediation?: string,
    correlationId: string
  }
}
```

**Key Features:**
- Consistent structure across all endpoints
- Pagination metadata with cursor support
- Server-computed totals (not from returned page)
- Field masking indicators for permission-restricted fields
- Warning support for non-blocking validation issues
- Correlation ID for tracing

### 2. Error Catalogue (`src/shared/errors/catalogue.ts`)

Comprehensive error code system with 40+ error codes:

**Error Categories:**
- **400 - Shape Validation:** VALIDATION_FAILED, FILTER_UNKNOWN_FIELD, FILTER_OP_NOT_ALLOWED
- **401/403 - Authentication & Authorization:** UNAUTHENTICATED, PERMISSION_DENIED, SOD_CONFLICT
- **404/409 - Resource State:** NOT_FOUND, CONCURRENT_MODIFICATION, STATE_TRANSITION_INVALID
- **422 - Business Rules:** BUSINESS_RULE_VIOLATION, BUDGET_EXCEEDED, INSUFFICIENT_STOCK
- **429/5xx - System:** RATE_LIMITED, INTERNAL_ERROR, INTEGRATION_UNAVAILABLE

**Error Classes:**
- `ApiError` - Base error class
- `ValidationError` - Multiple validation issues
- `ConcurrencyError` - ETag mismatch
- `ForbiddenError` - Permission denied
- `NotFoundError` - Resource not found
- `IdempotencyError` - Idempotency conflicts

**Key Features:**
- Stable error codes (never change)
- Localized messages (can change)
- Context data for UI rendering
- Remediation guidance
- HTTP status mapping

### 3. Filter Grammar Parser & Compiler (`src/shared/api/filter/compiler.ts`)

Safe, whitelisted filter expression language:

**Grammar:**
```
expr    := or
or      := and ( 'or' and )*
and     := cmp ( 'and' cmp )*
cmp     := field op value | field 'in' '(' value(,value)* ')' | 'not' '(' expr ')' | '(' expr ')'
op      := 'eq'|'ne'|'gt'|'ge'|'lt'|'le'|'contains'|'startswith'|'between'|'isnull'
```

**Example Filters:**
```
status eq 'APPROVED' and totalValue gt 100000
vendorId in (1, 2, 3)
poDate between '2024-01-01' and '2024-12-31'
description contains 'cement' and not (status eq 'CANCELLED')
```

**Key Features:**
- Tokenizer → Parser → AST → SQL compiler
- Field whitelisting (only allowed fields can be filtered)
- Operator whitelisting (only allowed operators per field)
- Permission-based field filtering
- Type coercion and validation
- Parameterized SQL (no SQL injection)

### 4. Pagination Utilities (`src/shared/api/pagination.ts`)

Two pagination strategies:

**Offset Pagination:**
- `$skip` and `$top` parameters
- Default: skip=0, top=50
- Max: top=200
- Suitable for small datasets (<10,000 rows)

**Keyset Pagination:**
- `$cursor` parameter (base64-encoded)
- Mandatory for large datasets (>10,000 rows)
- Entities requiring keyset: stock_ledger, attendance, voucher_line, mb_line, audit_log, notification, event_outbox
- More efficient for deep pagination
- Stable results even with concurrent inserts

**Key Features:**
- Cursor encoding/decoding (base64url)
- Tuple comparison for multi-field ordering
- Automatic detection of entities requiring keyset
- Page metadata with hasMore flag

### 5. Concurrency Control (`src/shared/api/concurrency.ts`)

Optimistic concurrency with ETags:

**ETag Generation:**
- `dx_` tables: Use `row_version` column
- Existing tables: SHA-256 hash of all mapped columns
- Format: `"version"` or `"hash"`

**ConcurrencyGuard:**
- Validates `If-Match` header against current version
- Throws `ConcurrencyError` on mismatch
- Returns current server state for merge UI

**Edit Lock (Advisory):**
- For long-running edits (e.g., 400-line MB)
- Visible indicator: "Being edited by X since HH:MM"
- Request-takeover action
- Advisory only (not a substitute for ETag)
- Auto-expires after 30 minutes
- Heartbeat mechanism to extend

**Key Features:**
- No last-write-wins for financial documents
- Field-level diff for merge UI
- Advisory locks with takeover
- Heartbeat extension

### 6. Idempotency (`src/shared/api/idempotency.ts`)

Ensures POST requests are idempotent:

**Idempotency Flow:**
1. Client generates UUID as `Idempotency-Key` header
2. Server hashes request body (SHA-256)
3. Server checks `dx_idempotency` table:
   - Key not found: Create IN_PROGRESS record, execute request
   - Key found, COMPLETED: Return cached response
   - Key found, IN_PROGRESS: Return 409 REQUEST_IN_PROGRESS
   - Key found, different hash: Return 422 IDEMPOTENCY_KEY_REUSED
4. On completion: Store response, mark COMPLETED
5. On failure: Mark FAILED

**Database Table:** `dx_idempotency`
- Primary key: `key` (VARCHAR(120))
- Stores: actor, endpoint, request_hash, status, response
- TTL: 24 hours (7 days for payments)
- Indexes: expires_at, status, actor_user_id

**Key Features:**
- Prevents duplicate document creation
- Mobile offline sync support (client-generated local_id)
- Request hash validation
- Automatic cleanup of expired records
- In-progress request detection

### 7. Validation Framework (`src/shared/api/validation.ts`)

Three-tier validation system:

**Tier 1: Shape Validation**
- Type checking (string, number, boolean, date, array, object)
- Required field validation
- Min/max length and value
- Pattern matching (regex)
- Enum validation
- Custom validators
- Returns: 400 with per-field issues

**Tier 2: Reference Validation**
- Foreign key existence
- Active status check
- Scope validation (project, company)
- Permission check
- Returns: 422 with reference issues

**Tier 3: Business Rule Validation**
- Domain-specific rules
- RuleEngine with override support
- Severity levels: BLOCK, WARN, INFO
- Override recording (never silent)
- Returns: 422 with business rule issues

**Key Features:**
- All failures returned at once (not one at a time)
- Dry-run endpoint: `POST /:id/validate`
- Override support with permission check
- Override reason required
- Override recorded in audit log
- Context data for UI rendering

### 8. Base CRUD Controller (`src/shared/api/base-controller.ts`)

Abstract base class for all entity controllers:

**Standard Operations:**
- `list(query, actor)` - GET / with filtering, pagination
- `getOne(id, actor)` - GET /:id with ETag
- `create(dto, actor, idempotencyKey?)` - POST / with validation, idempotency
- `update(id, dto, actor, ifMatch)` - PATCH /:id with concurrency, validation
- `delete(id, actor, ifMatch)` - DELETE /:id with concurrency
- `validateDryRun(id, dto, actor, overrides?)` - POST /:id/validate

**Integrated Features:**
- Permission checks (view, create, update, delete)
- Filter compilation with whitelisting
- Pagination (offset or keyset)
- Concurrency control (ETag)
- Idempotency (POST only)
- Three-tier validation
- Error handling with proper HTTP codes
- Response envelope

**Usage Example:**
```typescript
class PurchaseOrderController extends BaseCrudController<PurchaseOrder, CreatePoDto, UpdatePoDto> {
  protected readonly entity = 'purchase_order';
  protected readonly fields = PO_FIELDS;
  protected readonly permissions = {
    view: 'procure.po.view',
    create: 'procure.po.create',
    update: 'procure.po.update',
    delete: 'procure.po.delete'
  };
  protected readonly shapeRules = PO_SHAPE_RULES;
  protected readonly businessRules = PO_BUSINESS_RULES;
  
  constructor(
    private repo: PurchaseOrderRepository,
    private service: PurchaseOrderService
  ) {
    super();
    this.concurrencyGuard = new ConcurrencyGuard(
      (entity, id) => repo.getVersion(id)
    );
  }
}
```

### 9. Database Migration (`migrations/005_create_idempotency_table.sql`)

Created `dx_idempotency` table:

**Columns:**
- `key` (VARCHAR(120), PK): Idempotency key
- `actor_user_id` (BIGINT): User ID
- `endpoint` (VARCHAR(200)): API endpoint
- `request_hash` (CHAR(64)): SHA-256 hash
- `status` (VARCHAR(20)): IN_PROGRESS, COMPLETED, FAILED
- `response_status` (INTEGER): HTTP status
- `response_body` (JSONB): Cached response
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `completed_at` (TIMESTAMPTZ): Completion timestamp
- `expires_at` (TIMESTAMPTZ): Expiration timestamp

**Indexes:**
- `idx_dx_idempotency_expires`: Cleanup job
- `idx_dx_idempotency_in_progress`: Timeout handling
- `idx_dx_idempotency_actor`: Audit trail

### 10. Documentation Updates

**DB_CHANGELOG.md:**
- Documented migration 005
- Added rollback instructions
- Updated migration checklist
- Documented database conventions

**API_REGISTRY.md:**
- Documented response envelope
- Documented query parameters
- Documented error codes
- Documented idempotency requirements
- Documented concurrency control

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| API-01 | BLOCK | Status field never directly writable (use named actions) |
| API-02 | BLOCK | Every query wrapped by permission filter |
| API-03 | BLOCK | Totals computed server-side across full filtered set |
| API-04 | BLOCK | Keyset pagination mandatory for >10,000 rows |
| API-05 | BLOCK | Idempotency-Key required for all POST requests |
| API-06 | BLOCK | All validation failures returned at once |
| API-07 | BLOCK | Overrides never silent (recorded in audit log) |

## File Structure

```
src/shared/
├── api/
│   ├── envelope.ts              # Response envelope types
│   ├── pagination.ts            # Offset and keyset pagination
│   ├── concurrency.ts           # ETag and ConcurrencyGuard
│   ├── idempotency.ts           # Idempotency service and middleware
│   ├── validation.ts            # Three-tier validation framework
│   ├── base-controller.ts       # Abstract CRUD controller
│   └── filter/
│       └── compiler.ts          # Filter grammar parser & compiler
├── errors/
│   └── catalogue.ts             # Error codes and classes
migrations/
└── 005_create_idempotency_table.sql
```

## Acceptance Criteria

- [x] Response envelope implemented with all metadata fields
- [x] Error catalogue with 40+ error codes
- [x] Filter grammar parser and compiler with whitelisting
- [x] Offset and keyset pagination
- [x] Concurrency control with ETag
- [x] Advisory edit locks with takeover
- [x] Idempotency service and middleware
- [x] Three-tier validation framework
- [x] RuleEngine with override support
- [x] BaseCrudController with all CRUD operations
- [x] Database migration for dx_idempotency
- [x] Documentation updated (DB_CHANGELOG.md, API_REGISTRY.md)
- [x] Build successful with no TypeScript errors

## What Part 05 Does NOT Do

- ❌ Does not implement actual permission checks (Part 06)
- ❌ Does not implement actual database queries (Part 07+)
- ❌ Does not implement actual business rules (Part 26+)
- ❌ Does not implement actual document workflows (Part 07)
- ❌ Does not implement actual posting engines (Part 09)

Part 05 provides the **framework** that all subsequent parts will use.

## Next Steps

**Part 06: User, Role & Permission Model**
- Implement actual permission resolution
- Implement permission guards
- Implement field masking
- Implement segregation of duties
- Create dx_user, dx_role, dx_permission tables

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- Vite bundles successfully
- Output: 663KB JS, 57KB CSS
- All API components compile correctly

---

**Part 05 of 69 — Complete** ✅  
**Progress: 7.2% of total build**  
**Next: Part 06 — User, Role & Permission Model**
