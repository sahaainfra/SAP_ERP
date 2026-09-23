# API_REGISTRY.md — Part 02 Update

## Part 02: No API Endpoints Created

Part 02 is an inspection and adapter layer part. It does not create API endpoints.
API contracts are defined by Part 05 (API Contract, Validation & Error Framework).

### Part 02 Contributions

Part 02 establishes:

1. **Schema Map Adapter Layer** (`src/config/schema-map.ts`)
   - Single place where physical table names appear
   - All repositories read from SCHEMA_MAP
   - No hard-coded table names in queries

2. **Boot-Time Schema Validation** (`src/services/SchemaValidator.ts`)
   - Validates SCHEMA_MAP against information_schema
   - Missing tables disable only affected features
   - Never crashes the application

3. **Audit Foundation** (`src/services/AuditFoundation.ts`)
   - In-memory audit log for demo
   - Will be backed by `dx_audit_log` table in Part 09
   - Append-only, enforced at database level

4. **Schema Inspection UI** (`src/components/SchemaInspectionView.tsx`)
   - Visualizes business object mapping
   - Shows validation status
   - Displays gap report

### API Conventions (Established for Part 05)

When Part 05 creates the API framework, all endpoints will follow:

**Base Path:** `/api/dx/v1/`

**Standard Envelope:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 0,
    "generatedAt": "2026-01-01T00:00:00Z",
    "scope": {
      "companyId": 1,
      "projectIds": [4, 7],
      "siteIds": []
    },
    "fromCache": false,
    "cacheAgeSeconds": 0
  },
  "errors": []
}
```

**Error Envelope:**
```json
{
  "success": false,
  "data": null,
  "meta": {},
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Field 'name' is required",
      "field": "name",
      "severity": "error"
    }
  ]
}
```

**Query Parameters:**
- `page` — page number (default: 1)
- `pageSize` — items per page (max: 200, default: 50)
- `sort` — sort field and direction (e.g., `name:asc`)
- `filter` — filter expression (e.g., `status:active`)
- `search` — full-text search query

**HTTP Methods:**
- `GET` — retrieve data (idempotent)
- `POST` — create new resource
- `PUT` — update existing resource (full replacement)
- `PATCH` — partial update
- `DELETE` — soft-delete (sets `deleted_at`)

**State Changes:**
- State changes happen only through named actions
- Example: `POST /api/dx/v1/procure/po/123/actions/approve`
- Never by writing a status field directly

**Headers:**
- `Authorization: Bearer <token>` — authentication
- `If-None-Match: <etag>` — conditional GET
- `Idempotency-Key: <uuid>` — for POST/PUT/PATCH

**Permission Keys:**
- Every endpoint declares a permission key
- Checked server-side before any query runs
- Format: `module.entity.action`
- Example: `procure.po.view`, `procure.po.approve`

### Reserved API Paths

The following API paths are reserved for later parts. No part may create a
conflicting path:

| Path Pattern | Module | Part | Purpose |
|---|---|---|---|
| `/api/dx/v1/workspace/*` | workspace | 01/20 | Dashboard layout, tile preferences |
| `/api/dx/v1/project/*` | project | 27 | Project CRUD, hierarchy |
| `/api/dx/v1/procure/indent/*` | procure | 35 | Material indents |
| `/api/dx/v1/procure/rfq/*` | procure | 35 | Request for quotation |
| `/api/dx/v1/procure/comparative/*` | procure | 35 | Bid comparison |
| `/api/dx/v1/procure/po/*` | procure | 35 | Purchase orders |
| `/api/dx/v1/store/grn/*` | store | 36 | Goods receipt notes |
| `/api/dx/v1/store/issue/*` | store | 36 | Material issues |
| `/api/dx/v1/store/stock/*` | store | 36 | Stock ledger |
| `/api/dx/v1/sc/work-order/*` | sc | 37 | Subcontractor work orders |
| `/api/dx/v1/sc/bill/*` | sc | 37 | Subcontractor billing |
| `/api/dx/v1/mb/entry/*` | mb | 38 | Measurement book entries |
| `/api/dx/v1/bill/client/*` | bill | 39 | Client RA bills |
| `/api/dx/v1/finance/voucher/*` | finance | 40 | Journal vouchers |
| `/api/dx/v1/finance/payment/*` | finance | 41 | Payments |
| `/api/dx/v1/finance/receipt/*` | finance | 41 | Receipts |
| `/api/dx/v1/hr/employee/*` | hr | 43 | Employee records |
| `/api/dx/v1/hr/attendance/*` | hr | 44 | Attendance |
| `/api/dx/v1/qa/inspection/*` | qa | 48 | Work inspection requests |
| `/api/dx/v1/hse/incident/*` | hse | 49 | Safety incidents |
| `/api/dx/v1/hse/permit/*` | hse | 49 | Work permits |
| `/api/dx/v1/asset/equipment/*` | asset | 46 | Equipment register |
| `/api/dx/v1/master/vendor/*` | master | 29 | Vendor master |
| `/api/dx/v1/master/item/*` | master | 28 | Item master |
| `/api/dx/v1/master/rate/*` | master | 28 | Rate master |
| `/api/dx/v1/report/mis/*` | report | 58 | MIS reports |
| `/api/dx/v1/admin/user/*` | admin | 06 | User management |
| `/api/dx/v1/admin/role/*` | admin | 06 | Role management |
| `/api/dx/v1/permission/*` | permission | 08 | Permission resolution |
| `/api/dx/v1/workflow/*` | workflow | 10 | Approval workflows |
| `/api/dx/v1/notification/*` | notification | 25 | Notification preferences |
| `/api/dx/v1/kpi/*` | kpi | 15 | KPI definitions & values |
| `/api/dx/v1/events/*` | events | 13 | Real-time event stream |

### API Convention (Part 05)

All endpoints follow: `/api/dx/v1/{module}/{resource}`

State changes happen only through named actions:
`POST /api/dx/v1/{module}/{resource}/{id}/actions/{action}`

Never by writing a status field directly.

### Error Contract (Part 05)

Eight error classes will be defined:
1. `VALIDATION_ERROR` (400) — shape validation
2. `REFERENCE_NOT_FOUND` (422) — foreign key violation
3. `BUSINESS_RULE_VIOLATION` (422) — business logic
4. `PERMISSION_DENIED` (403) — authorisation failure
5. `NOT_FOUND` (404) — record not found or out of scope
6. `CONFLICT` (409) — concurrent modification
7. `STATE_TRANSITION_INVALID` (422) — illegal state change
8. `INTERNAL_ERROR` (500) — unexpected failure

Every error response carries: `code`, `message` (with real numbers), `correlationId`,
`details[]`.
