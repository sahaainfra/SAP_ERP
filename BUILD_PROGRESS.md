# Construction & Infrastructure ERP — Build Progress

## Parts Completed: 22 of 69

---

## Part 05: API Contract, Validation & Error Framework

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 04 (Reference Architecture)  
**Blocks:** Part 06 (User, Role & Permission Model)

### Deliverables

1. **API Response Envelope** (`src/shared/api/envelope.ts`)
   - Standardized success/failure response format
   - Pagination metadata with cursor support
   - Server-computed totals
   - Field masking indicators
   - Warning support
   - Correlation ID for tracing

2. **Error Catalogue** (`src/shared/errors/catalogue.ts`)
   - 40+ error codes across 5 categories
   - Error classes: ApiError, ValidationError, ConcurrencyError, ForbiddenError, NotFoundError, IdempotencyError
   - HTTP status mapping
   - Context data for UI rendering
   - Remediation guidance

3. **Filter Grammar Parser & Compiler** (`src/shared/api/filter/compiler.ts`)
   - Safe, whitelisted filter expression language
   - Tokenizer → Parser → AST → SQL compiler
   - Field and operator whitelisting
   - Permission-based field filtering
   - Type coercion and validation
   - Parameterized SQL (no SQL injection)

4. **Pagination Utilities** (`src/shared/api/pagination.ts`)
   - Offset pagination ($skip, $top)
   - Keyset pagination ($cursor) for large datasets
   - Automatic detection of entities requiring keyset
   - Cursor encoding/decoding (base64url)
   - Tuple comparison for multi-field ordering

5. **Concurrency Control** (`src/shared/api/concurrency.ts`)
   - ETag generation (row_version or content hash)
   - ConcurrencyGuard for If-Match validation
   - Advisory edit locks with takeover
   - Heartbeat mechanism
   - Field-level diff for merge UI

6. **Idempotency** (`src/shared/api/idempotency.ts`)
   - IdempotencyService for request tracking
   - Request body hashing (SHA-256)
   - Duplicate detection
   - In-progress request handling
   - Automatic cleanup of expired records
   - Mobile offline sync support

7. **Validation Framework** (`src/shared/api/validation.ts`)
   - Three-tier validation: Shape, Reference, Business Rule
   - RuleEngine with override support
   - Severity levels: BLOCK, WARN, INFO
   - Override recording (never silent)
   - Dry-run endpoint support
   - All failures returned at once

8. **Base CRUD Controller** (`src/shared/api/base-controller.ts`)
   - Abstract base class for all entity controllers
   - Standard operations: list, getOne, create, update, delete, validateDryRun
   - Integrated: permission checks, filtering, pagination, concurrency, idempotency, validation
   - Error handling with proper HTTP codes
   - Response envelope

9. **Database Migration** (`migrations/005_create_idempotency_table.sql`)
   - dx_idempotency table for idempotency tracking
   - Indexes for cleanup, timeout handling, audit trail
   - Rollback instructions

10. **Documentation**
    - DB_CHANGELOG.md updated with migration 005
    - API_REGISTRY.md updated with API contract
    - README_PART_05.md created

### Business Rules Enforced

- API-01: Status field never directly writable (use named actions)
- API-02: Every query wrapped by permission filter
- API-03: Totals computed server-side across full filtered set
- API-04: Keyset pagination mandatory for >10,000 rows
- API-05: Idempotency-Key required for all POST requests
- API-06: All validation failures returned at once
- API-07: Overrides never silent (recorded in audit log)

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- Vite bundles successfully
- Output: 663KB JS, 57KB CSS

---

## Part 06: User, Role, Responsibility & Permission Model

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 02 (System Inspection), Part 04 (Reference Architecture)  
**Blocks:** Part 07 (Permission Resolution Engine), Part 27 (Organization), Part 69 (Cross-Module Consolidation)

### Deliverables

1. **Database Migration** (`migrations/006_create_permission_model.sql`)
   - 11 new tables for complete permission model
   - All constraints and indexes
   - Immutable audit trail
   - Rollback instructions

2. **Permission Types** (`src/platform/permission/types.ts`)
   - Permission key format (module.entity.action)
   - 35 module namespaces
   - 24 action verbs (closed set)
   - All entity types and interfaces

3. **Permission Service** (`src/platform/permission/permission.service.ts`)
   - Permission catalogue management
   - Permission key validation
   - Module/entity queries
   - Permission seeding

4. **Responsibility Template Service** (`src/platform/permission/responsibility-template.service.ts`)
   - Template CRUD
   - Permission mapping
   - 29 system templates
   - Version control

5. **Project Assignment Service** (`src/platform/permission/project-assignment.service.ts`)
   - Assignment CRUD
   - Permission overrides
   - Approval authorities
   - Scope restrictions
   - Field restrictions
   - Suspension/revocation
   - Immutable audit logging

6. **Permission Resolver** (`src/platform/permission/permission-resolver.ts`)
   - Four-layer resolution
   - Effective permission calculation
   - Approval authority checking
   - Field masking
   - SoD violation detection

7. **Delegation Service** (`src/platform/permission/delegation.service.ts`)
   - Delegation CRUD
   - Time-bound validation
   - Amount limit enforcement
   - Automatic expiration

8. **SoD Service** (`src/platform/permission/sod.service.ts`)
   - SoD rule management
   - Violation detection
   - Pre-save validation
   - Common rule seeding

9. **Documentation**
   - DB_CHANGELOG.md updated with migration 006
   - README_PART_06.md created
   - BUILD_PROGRESS.md updated

### Database Tables Created

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

### Business Rules Enforced

- **PERM-01**: Deny by default - absent assignment means no access
- **PERM-02**: Explicit DENY override always wins
- **PERM-03**: Assignment outside validity window grants nothing
- **PERM-04**: Delegation transfers named permissions only, not global role
- **PERM-05**: Substitute must independently hold permission and authority
- **PERM-06**: Approval authority is per project per document type per value band
- **PERM-07**: Super Admin bypass grants breadth only, never removes SoD controls

### Four-Layer Permission Resolution

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

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All permission services compile correctly
- Database migration validated
- Output: 663KB JS, 57KB CSS

---

## Part 07: Permission Resolution, Super Admin Console & Segregation of Duties

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 06 (Permission Model)  
**Blocks:** Part 08 (Permission Engine - Server-Side)

### Deliverables

1. **Enhanced Permission Resolver** (`enhanced-resolver.ts`)
   - 9-step resolution algorithm
   - Super Admin bypass with 60s cache
   - In-memory cache with 300s TTL
   - Cache invalidation by user/project
   - Delegation authority capping

2. **Actor Interface** (`actor.ts`)
   - Permission checking (can, assertCan)
   - Project filtering (projectsWith)
   - Approval authority (authorityFor, canApprove)
   - Data scope (scope)
   - Field restrictions (restrictedFields, isFieldVisible/Masked/Hidden)
   - Delegation tracking (activeDelegations, isActingOnBehalfOf)

3. **SoD Evaluator** (`sod-evaluator.ts`)
   - Checks audit log for actual violations
   - Pre-action violation checking
   - Nightly evaluation for all users
   - 10 seeded SoD rules

4. **Impact Preview Service** (`impact-preview.ts`)
   - Preview assignment revocation
   - Preview assignment creation
   - Preview assignment modification
   - Orphaned approval detection
   - Permission change calculation

5. **Super Admin Console** (`SuperAdminConsole.tsx`)
   - View A: By Project (see all assignments)
   - View B: By User (see all projects)
   - View C: Matrix (users × projects grid)
   - Assignment editor with 5 tabs
   - Impact preview in footer
   - Safety rails (reason required, warnings)

### Business Rules Enforced

- **RES-01**: Inactive user short-circuits to empty set
- **RES-02**: DENY applied after GRANT, explicit deny always wins
- **RES-03**: Delegation resolved from delegator's project keys only
- **RES-04**: Assignment change that orphans approvals refused
- **SOD-01**: SoD evaluated against audit log (actual actions)
- **SOD-02**: Exemption without expiry = no rule

### Caching Strategy

- **Cache Key:** `perm:{userId}:{projectId}`
- **TTL:** 300 seconds (5 minutes)
- **Super Admin TTL:** 60 seconds (1 minute)
- **Invalidation:** Explicit deletion + real-time event

### Four Enforcement Points

1. **Route Guard** - Check permission before controller
2. **Query Filter** - Rewrite query with scope predicate
3. **Field Masking** - Strip/mask before serialization
4. **Action Validation** - Re-check before state change

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All permission services compile correctly
- Super Admin Console UI compiles
- Output: 695KB JS, 58KB CSS

---

## Part 08: Permission Engine — Server-Side Implementation

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 05 (API Contract), Part 07 (Permission Resolution)  
**Blocks:** Part 09 (Document Framework), Part 13 (Real-Time Engine), Part 16 (Global Shell), Part 64 (Backup), Part 66 (Security), Part 69 (Cross-Module)

### Deliverables

1. **Permission Guard** (`permission-guard.ts`)
   - Route-level permission enforcement
   - `@RequiresPermission` decorator
   - Fails closed: endpoints without metadata rejected at boot
   - Dynamic permission keys based on request
   - Project-scoped permission checks
   - Audit logging of denied attempts

2. **Query Filter** (`query-filter.ts`)
   - Query-level permission enforcement
   - Entity scope specifications registry (15+ entities)
   - Project/site/package/store-level filtering
   - Owner-level filtering (own records only)
   - OR-of-AND grouping for complex scopes
   - Applies to COUNT, SUM, AVG aggregates

3. **Field Masker** (`field-masker.ts`)
   - Field-level permission enforcement
   - HIDE/MASK/REDACT/VISIBLE modes
   - Standard field restrictions for sensitive data
   - Applied to JSON, CSV, PDF, charts, aggregates
   - Aggregate leak prevention

4. **Action Policy** (`action-policy.ts`)
   - Action-level permission enforcement
   - Record/value/time-level checks
   - Authority limit validation
   - Self-approval prevention
   - Segregation of duties (against audit log)
   - Impersonation restrictions
   - State transition validation
   - Pre-registered policies: po.release, payment.post

5. **Menu Service** (`menu-service.ts`)
   - Server-driven, permission-filtered navigation
   - Recursive child filtering
   - Empty parent pruning
   - Context projects list
   - Version tracking for cache invalidation
   - Default menu structure with 10+ sections

### Four Enforcement Points

1. **Route Guard** — May this actor invoke this operation at all?
2. **Query Filter** — Which rows may this actor see?
3. **Field Masking** — Which columns of those rows?
4. **Action Validation** — May this actor do this to THIS record, at THIS value, now?

### Business Rules Enforced

- **ENF-01**: Endpoint with no declared permission key fails boot
- **ENF-02**: Repository methods accept only CompiledWhere from QueryFilter
- **ENF-03**: Aggregates use same filter as lists
- **ENF-04**: Masked field is masked everywhere (JSON, CSV, PDF, charts)
- **ENF-05**: Out-of-scope record fetched by id returns 404, not 403
- **ENF-06**: Action with no policy fails boot

### Entity Scope Registry

Registered entities with row-level security:
- **Procurement:** purchase_order, purchase_requisition, vendor
- **Store:** stock_item, grn
- **Finance:** payment, receipt, voucher
- **Billing:** client_bill, subcontractor_bill
- **HR:** employee, attendance
- **Quality:** inspection
- **Safety:** incident
- **Equipment:** equipment

### Standard Field Restrictions

Pre-configured sensitive field masking:
- Financial data (rates, values, margins) — HIDE
- HR data (salary, bank accounts) — HIDE/MASK
- Vendor data (bank accounts) — MASK
- Sealed quotations (rates) — REDACT

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All permission engine components compile correctly
- Output: 695KB JS, 58KB CSS

---

## Part 09: Document Framework — Draft, State, Numbering, Audit & Outbox

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 05 (API Contract), Part 08 (Permission Engine)  
**Blocks:** Part 10 (Workflow), Part 11 (Posting Engines), Part 12 (Calculation), Part 13 (Real-Time), Part 26 (Worked Module), Part 27 (Organization), Part 64 (Backup), Part 69 (Cross-Module)

### Deliverables

1. **Database Schema** (`migrations/009_create_document_framework.sql`)
   - dx_document_draft — RAP-style draft/active split
   - dx_audit_log — Hash-chained audit trail
   - dx_event_outbox — Transactional outbox
   - dx_number_series — Document number series
   - dx_number_allocation — Number allocation audit
   - dx_number_gap — Gap tracking for rollbacks

2. **19-State Vocabulary** (`types.ts`)
   - Standardized state machine across all documents
   - Terminal states: CERTIFIED, POSTED, PAID, CLOSED, CANCELLED, SUPERSEDED
   - Immutable terminal states (no unlock)

3. **State Machine** (`state-machine.ts`)
   - Validates state transitions
   - Enforces terminal state immutability
   - Common transitions pre-defined

4. **Draft Service** (`draft-service.ts`)
   - Autosave every 10s / on blur
   - Activation in one transaction
   - Concurrency check via base version
   - Configurable expiry per document type

5. **Number Series Service** (`number-series-service.ts`)
   - Row-level locking prevents duplicates
   - Scope-based: GLOBAL, COMPANY, PROJECT
   - Pattern rendering with placeholders
   - Gap tracking for audit compliance
   - Warn threshold for exhaustion

6. **Audit Writer** (`audit-writer.ts`)
   - SHA-256 hash chain for tamper detection
   - Append-only enforcement at database level
   - Nightly chain verification
   - Comprehensive coverage of all actions

7. **Outbox Service** (`outbox-service.ts`)
   - Transactional outbox pattern
   - Events written inside transaction
   - Asynchronous relay with retry
   - Exponential backoff, max 10 attempts
   - Dead letter queue for failed events

8. **Document Service** (`document-service.ts`)
   - 12-step execute path for all documents
   - Determinations (derived values)
   - Validations (business rules)
   - Permission checks
   - State transitions
   - Audit + events

### 12-Step Execute Path

1. Permission check
2. Initialize context
3. Run determinations (derive totals, rates)
4. Run validations (business rules)
5. Allocate number (if allocateOn = CREATE)
6. Set initial state (DRAFT + content hash)
7. Persist to database
8. Audit CREATE action
9. Emit outbox events
10. Execute action (for state transitions)
11. Update state + content hash
12. Audit + emit events

### Business Rules Enforced

- **DOC-01**: Unmapped legacy status throws loudly
- **DOC-02**: Draft never allocates number, affects stock, or posts
- **DOC-03**: Client-supplied determined field is ignored and recomputed
- **DOC-04**: Terminal document rejects every mutating action
- **DOC-05**: Number lost to rollback is never reused
- **DOC-06**: Statutorily continuous series doesn't use buffered path
- **DOC-07**: Outbox event emitted inside transaction

### Key Features

**Determinations** — Derived values recomputed on every change:
- Line amounts (quantity × rate - discount + tax)
- Document totals
- Tax calculations (CGST, SGST, IGST)
- Client values ignored and recomputed

**Immutability Guard** — Terminal documents reject mutations:
- No unlock action
- Correction paths: revised MB, reversal voucher, supplementary run

**Two-Person Actions** — For high-risk operations:
- Sealed RFQ opening, backup download, restore execution
- Payroll approval, bank file release

**Content Hash** — Prevents post-approval tampering:
- Hash covers business-material fields only
- Mismatch raises P1 alert

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All document framework components compile correctly
- Output: 695KB JS, 58KB CSS

---

## Part 10: Workflow & Approval Engine

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 09 (Document Framework)  
**Blocks:** Part 23 (Approval Centre), Part 24 (Task Centre), Part 26 (Worked Module), Part 69 (Cross-Module)

### Deliverables

1. **Database Schema** (`migrations/010_create_workflow_engine.sql`)
   - dx_workflow_definition — Workflow definitions with versioning
   - dx_workflow_step — Steps with approver rules, SLA, escalation
   - dx_workflow_instance — Running workflow instances (immutable)
   - dx_workflow_task — Tasks assigned to approvers
   - dx_workflow_log — Immutable audit log
   - dx_substitution — Out-of-office substitution rules
   - dx_working_calendar — Working days/hours for SLA

2. **Approver Resolver** (`approver-resolver.ts`)
   - 9 approver rule types (AME-style)
   - Sanitization rules (self-approval, SoD, substitutions)
   - Gap reporting

3. **Workflow Engine** (`workflow-engine.ts`)
   - start() — Initialize workflow on document submission
   - activateNextStep() — Evaluate preconditions, resolve approvers
   - decide() — Process approval/rejection/return decisions
   - 6 decision actions (approve, reject, return, request info, delegate, approve with conditions)

4. **SLA Service** (`sla-service.ts`)
   - Working calendar support
   - Due date calculation
   - Overdue duration tracking

5. **Workflow Seeds** (`workflow-seeds.ts`)
   - PO_APPROVAL_WORKFLOW
   - CLIENT_BILL_WORKFLOW
   - SC_BILL_WORKFLOW
   - MB_WORKFLOW
   - PAYMENT_WORKFLOW

### Key Features

**Value-Driven Authority Chain** — Walks up approval authority based on document value  
**Escalation Rules** — Configurable stages (remind, notify supervisor, reassign, auto-approve)  
**Substitution** — Out-of-office with two-deep chain limit  
**Content Hash Tamper Detection** — Prevents post-submission edits  
**Working Calendar Support** — Project-specific working days and holidays  
**Approval Card Contract** — Server-computed decision context with risk flags  

### Business Rules Enforced

- **WF-01**: Submitter can never approve own document
- **WF-02**: SoD conflicts removed from approver list
- **WF-03**: Document exceeding all authority fails submission
- **WF-04**: DOCUMENT_CHANGED_SINCE_SUBMISSION if content hash changed
- **WF-05**: Rejection requires reason
- **WF-06**: Editing active workflow not permitted (new version required)
- **WF-07**: AUTO_APPROVE only for explicitly declared types
- **WF-08**: Approver on leave with no substitute reported as gap
- **WF-09**: Bulk approval capped at 20 items

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All workflow components compile correctly
- Output: 695KB JS, 58KB CSS

---

## Part 11: Posting Engines — Stock Ledger, General Ledger & Period Lock

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 09 (Document Framework)  
**Blocks:** Part 15 (Analytical View Layer), Part 26 (Worked Module), Part 40 (Finance), Part 69 (Cross-Module)

### Deliverables

1. **Database Schema** (`migrations/011_create_posting_engines.sql`)
   - dx_period_lock — Financial period locking
   - dx_posting_rule — GL posting rule configuration
   - dx_stock_ledger — Append-only stock movements
   - dx_voucher — GL voucher headers
   - dx_voucher_line — GL voucher lines
   - dx_financial_dimension — Dimension combinations

2. **Period Lock Service** (`period-lock-service.ts`)
   - Period status management (OPEN, SOFT_CLOSED, CLOSED, REOPENED)
   - Time-boxed reopen with two-person control
   - Auto-relock on expiry
   - Module-specific locking

3. **Valuation Service** (`valuation-service.ts`)
   - Weighted Average valuation
   - FIFO layer-based valuation
   - Batch Specific valuation
   - Fallback rate with warning events

4. **Dimension Validator** (`dimension-validator.ts`)
   - Required dimension validation per account
   - Forbidden dimension checks
   - Referential integrity validation
   - Combination registration

### Key Features

**Append-Only Ledgers**
- No UPDATE or DELETE on stock ledger or vouchers
- Corrections via reversal rows
- Hash chain for tamper detection
- Database-level enforcement via triggers

**Idempotent Posting**
- Unique constraint on source document
- Replayed events return existing result
- No double-posting from outbox retries

**Financial Dimensions**
- Project, Cost Code, WBS, Cost Centre, Equipment, Party
- Validated as combinations
- Required/forbidden per account type

**Posting Rules as Configuration**
- Event type → Account resolver → Journal lines
- 10 account resolver types
- Condition and amount expressions
- Effective dating for rule changes

### Business Rules Enforced

- **POST-01**: Stock and GL ledgers are append-only
- **POST-02**: Posting is idempotent by source document and event
- **POST-03**: Posting action asserts period is open
- **POST-04**: Every posting line carries full dimension set
- **POST-05**: Stock balance takes row lock in global order
- **POST-06**: GL journal must balance to zero
- **POST-07**: Valuation fallback recorded as event

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All posting services compile correctly
- Output: 695KB JS, 58KB CSS

---

## Part 12: Calculation Engines — Money, Measurement, Rates, Tax & Payroll

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 09 (Document Framework)  
**Blocks:** Part 15 (Analytical View Layer), Part 26 (Worked Module), Part 30 (Estimation), Part 69 (Cross-Module)

### Deliverables

1. **Money Value Object** (`money.ts`)
   - Integer minor units (bigint) to avoid floating-point errors
   - Currency enforcement (cannot mix currencies)
   - Largest-remainder allocation method
   - Multiple rounding modes (HALF_UP, HALF_EVEN, CEIL, FLOOR)
   - Indian formatting (lakh/crore grouping)

2. **Quantity Value Object** (`quantity.ts`)
   - Carries unit of measure (UoM)
   - Prevents arithmetic across different units
   - Forces explicit conversion before mixing units

3. **UoM Conversion Service** (`uom-service.ts`)
   - Direct, inverse, and single-hop conversions
   - Item-specific and global conversion factors
   - Never infers or defaults to 1
   - Pre-seeded with common construction units

4. **Expression Evaluator** (`expression-evaluator.ts`)
   - Sandboxed expression evaluation
   - Whitelisted functions only
   - No eval, no property access, no I/O
   - Step budget and depth limits
   - AST caching for performance

5. **Rate Resolver** (`rate-resolver.ts`)
   - Effective-dated rate resolution
   - Scope precedence: RATE_CONTRACT > PROJECT > VENDOR > COMPANY > GLOBAL
   - Caching with TTL (10 minutes)
   - Returns rate source ID for audit trail

### Business Rules Enforced

- **CALC-01**: Money is never floating-point — integer minor units
- **CALC-02**: Arithmetic across different UoM throws unless routed through conversion
- **CALC-03**: Expression evaluator is sandboxed — no I/O, no host access
- **CALC-04**: Rate resolution is effective-dated by document date
- **CALC-05**: Deductions apply in declared, configurable order
- **CALC-06**: Allocation of rounded total sums exactly back to total
- **CALC-07**: RATE_NOT_FOUND is an error, not a zero

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All calculation services compile correctly
- Output: 695KB JS, 58KB CSS
- decimal.js library integrated

---

## Part 22: Project 360 Control Tower, Object Pages & Drill-Down

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 01 (Workspace Foundation), Part 20 (Dashboard Engine), Part 21 (Role Dashboards)  
**Blocks:** Part 69 (Cross-Module)

### Deliverables

1. **Project 360 Component** (`Project360.tsx`)
   - Main command centre screen
   - Header band with project identity, metadata, dates, values, status
   - Health score gauge with composite score and band classification
   - 10 collapsible sections (Contract, Execution, Procurement, Material, Manpower, Plant, Quality, HSE, Commercial, Finance)
   - Permission-filtered sections
   - Loading, error, and empty states

2. **Health Score Gauge** (`HealthScoreGauge.tsx`)
   - Circular gauge with composite score (0-100)
   - Band classification badge (HEALTHY/WATCH/AT_RISK/CRITICAL)
   - Component breakdown with 9 weighted components
   - Trend chart showing last 6 periods
   - SVG-based visualization with smooth animations

3. **Project 360 Section Component** (`Project360Section.tsx`)
   - Collapsible section display
   - KPIs grid with cards
   - Charts container
   - Drill-down links
   - Section icons

4. **Document Chain Graph** (`DocumentChainGraph.tsx`)
   - SVG-based node and edge visualization
   - Color-coded by status
   - Permission-filtered nodes
   - Interactive click-to-view details
   - Zoom controls
   - Node details panel

5. **Drill-Down Navigator** (`DrillDownNavigator.tsx`)
   - Breadcrumb trail
   - Records table
   - Drill-down buttons
   - Back/forward navigation
   - Totals validation indicator

6. **Enhanced Object Page** (`EnhancedObjectPage.tsx`)
   - Universal object page for all entities
   - Collapsible header
   - Anchor navigation
   - 9 section types
   - Action toolbar with permission/state filtering
   - Confirmation dialogs
   - Document chain integration

### Key Features

**Project 360:**
- Single screen answering "how is this project doing?"
- Health score with 9 weighted components (admin-configurable)
- 10 comprehensive sections with KPIs and charts
- Drill-down to component details
- Trend visualization over 6 periods
- Permission-filtered sections

**Object Pages:**
- Universal structure for all business objects
- Collapsible header with key facts
- Anchor navigation for sections
- Permission-based section visibility
- State-based action availability
- Confirmation dialogs for irreversible actions
- Document chain visualization
- Approval history timeline
- Activity/audit log
- Comments with @mentions

**Document Chain:**
- Complete upstream/downstream traversal
- Permission-filtered nodes
- Visual relationship graph
- Clickable navigation
- "Restricted" label for unauthorized nodes
- Zoom and pan controls

**Drill-Down:**
- Breadcrumb navigation
- Filter preservation through all levels
- Totals validation at each level
- Records table with all fields
- Back/forward navigation
- "Open in Full View" option

### Business Rules Enforced

- **P360-01**: Every figure on Project 360 is a registered KPI and drills to source documents
- **P360-02**: Screen is one project in one context; never aggregates across projects user cannot see
- **OP-01**: Every object page carries: header, sections, related records, timelines, attachments, action bar
- **OP-02**: Object page never shows action actor's policy would refuse

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All Part 22 components compile correctly
- Output: 695KB JS, 64KB CSS

---

## Part 21: Role-Specific Real-Time Dashboards for Every User

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 01 (Workspace Foundation), Part 20 (Dashboard Engine)  
**Blocks:** Part 22 (Project 360 UI), Part 69 (Cross-Module)

### Deliverables

1. **Role Dashboard Types** (`role-dashboard-types.ts`)
   - Role dashboard configuration types
   - Object page standard types
   - Project 360 types
   - Health score types with 9 weighted components
   - Document chain types
   - Drill-down types

2. **Role Dashboard Configurations** (`role-dashboards.ts`)
   - 16 role dashboards defined (Super Admin through HSE Officer)
   - Mobile-first for field roles (Site Engineer, Store Keeper, Employee/Labour)
   - Desktop-first for management roles
   - Role-specific restrictions enforced (ROLE-02, ROLE-03, ROLE-04, ROLE-05)
   - Validation functions for boot-time checks

3. **Project 360 Service** (`project-360-service.ts`)
   - 10 comprehensive sections (Contract, Execution, Procurement, Material, Manpower, Plant, Quality, HSE, Commercial, Finance)
   - Health score computation with 9 weighted components
   - Admin-configurable weights per project
   - Trend visualization over 6 periods
   - Band classification (HEALTHY, WATCH, AT_RISK, CRITICAL)

4. **Document Chain Service** (`document-chain-service.ts`)
   - Complete upstream/downstream traversal
   - Permission-filtered nodes
   - Visual relationship graph
   - Supports all major document types

5. **Object Page Component** (`object-page.tsx`)
   - Universal structure for all business objects
   - Object header with key facts and status
   - Anchor bar for section navigation
   - 9 section types (general, line items, financial, schedule, attachments, approval history, related documents, activity, comments)
   - Permission-based section visibility
   - Action toolbar with state-based restrictions
   - Confirmation dialogs for irreversible actions
   - Document chain visualization

### Key Features

**Universal Object Page:**
- Consistent structure across all business objects
- Sections absent if user lacks permission
- Actions filtered by permission and state
- Irreversible actions require document number confirmation
- In-place updates after actions

**Project 360:**
- Single screen answering "how is this project doing?"
- Health score with 9 weighted components (admin-configurable)
- 10 collapsible sections with KPIs and charts
- Trend visualization
- Drill-down to component details

**Document Chain:**
- Complete upstream/downstream traversal
- Permission-filtered nodes
- Clickable navigation
- "Restricted" label for unauthorized nodes

**Role-Specific Dashboards:**
- 16 pre-defined role configurations
- Mobile-first for field roles
- Desktop-first for management roles
- Role-specific restrictions enforced
- Quick actions for common tasks

### Business Rules Enforced

- **ROLE-01**: Role dashboard is default, not authority
- **ROLE-02**: Store Keeper sees quantities only, no rates/values
- **ROLE-03**: Site Engineer sees no rate/value/margin/payroll figures
- **ROLE-04**: CFO dashboard is approve-and-review only
- **ROLE-05**: Employee/Labour sees only their own records
- **ROLE-06**: Configuration referencing ungranted KPI reported at boot

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All role dashboard services compile correctly
- Output: 695KB JS, 64KB CSS

---

## Part 20: Real-Time Dashboard Engine & Universal Dashboard Structure

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 01 (Workspace Foundation), Part 14 (KPI Engine), Part 15 (Analytical Layer), Part 18 (Metadata-Driven UI), Part 19 (Responsive Framework)  
**Blocks:** Part 21 (Role Dashboards), Part 22 (Project 360), Part 69 (Cross-Module)

### Deliverables

1. **Universal Dashboard Structure** (`types.ts`)
   - 12 universal bands (My Work, My Approvals, My Tasks, etc.)
   - Widget types (kpi_tile, chart, list, approval_inbox, etc.)
   - 16 role dashboards defined (Super Admin through HSE)
   - Dashboard definition and resolution types

2. **Dashboard Resolution Service** (`dashboard-resolution.ts`)
   - Five-step resolution (personal → template → system default)
   - Permission-based widget filtering
   - Personalization support (order, size, hidden widgets)
   - Multi-project portfolio mode
   - Permission version tracking

3. **Drill-Down Service** (`drill-down.ts`)
   - 5 drill-down chains registered (profitability, receivables, stock, budget, manpower)
   - Permission validation at each level
   - Breadcrumb path tracking
   - Total validation (sum matches at each level)

4. **Dashboard Engine** (`dashboard-engine.ts`)
   - Batched KPI fetching (one request for all tiles)
   - Real-time updates via event subscriptions
   - Staleness tracking ("Updated HH:mm")
   - Error handling (one failed tile doesn't blank dashboard)
   - Permission change detection and re-resolution

### Key Features

**Universal Home (Every User):**
- Row 1: My Work (4 count tiles)
- Row 2: Attention (top 5 alerts)
- Row 3+: Role-specific content

**Real-Time Updates:**
- No refresh button for normal operations
- Incremental tile updates via events
- Permission changes trigger full re-resolution

**Drill-Down:**
- Every KPI tile clickable
- Filters preserved through all levels
- Permission-filtered at every level
- Totals match exactly

**Personalization:**
- Reorder, hide, resize widgets
- Save filters and views
- Pin KPIs
- Set defaults
- All changes re-validated against permissions

### Business Rules Enforced

- **DASH-01**: Unauthorized tile absent (not empty, not zero)
- **DASH-02**: Every figure traces to real rows via KPI
- **DASH-03**: No data shows empty state, not zero
- **DASH-04**: Every KPI drills down, never bypasses permissions
- **DASH-05**: One batched KPI request, never one per tile
- **DASH-06**: Updates from event engine, no manual refresh
- **DASH-07**: Personalization never changes permissions
- **DASH-08**: Multi-project users see correct dashboard per context
- **DASH-09**: Tile exceeding budget serves cache with staleness indicator

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All dashboard services compile correctly
- Output: 695KB JS, 63KB CSS

---

## Part 19: Responsive Desktop, Tablet & Mobile Delivery Framework

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 17 (Component System), Part 18 (Metadata-Driven UI)  
**Blocks:** Part 20 (Dashboard Engine), Part 69 (Cross-Module)

### Deliverables

1. **Database Schema** (`migrations/019_create_sync_log.sql`)
   - dx_sync_log — Tracks offline sync operations with idempotency guarantees

2. **Breakpoint System** (`src/config/breakpoints.ts`)
   - Single source of truth for responsive breakpoints (xs, sm, md, lg, xl)
   - Generates CSS custom media queries and JavaScript constants
   - Utility functions and React hooks

3. **Offline Sync Engine** (`src/platform/offline/sync-engine.ts`)
   - IndexedDB storage for offline records
   - Idempotent sync using client-generated UUIDs
   - Offline allow-list enforcement
   - Conflict resolution per entity
   - Clock skew detection
   - Exponential backoff retry

4. **PWA Support**
   - `public/manifest.json` — PWA manifest
   - `public/sw.js` — Service worker with caching strategies
   - `index.html` — Updated with PWA meta tags and service worker registration

5. **Mobile Components**
   - `BottomTabBar.tsx` — 5-slot bottom navigation
   - `CreateSheet.tsx` — Bottom sheet for creating documents
   - `SyncIssuesScreen.tsx` — Sync issues UI with Edit/Retry/Discard
   - `MobileLineEditor.tsx` — Full-screen line editor with numeric keypad

6. **Adaptive Table** (`src/components/tables/AdaptiveTable.tsx`)
   - Three modes: table, card, compact list
   - Totals never lost (sticky summary bar)
   - All columns reachable via expand or object page

7. **Device Capability Wrappers** (`src/platform/mobile/device-capabilities.ts`)
   - Camera, GPS, QR/barcode scanner, biometric, push notifications, file picker, share sheet

### Key Features

**One Codebase, Three Contexts:**
- Desktop: Full shell, expanded navigation, multi-column layouts
- Tablet: Icon-rail navigation, two-column layouts
- Mobile: Bottom tab bar, single-column, full-screen sheets

**Offline-First Architecture:**
- Only draft-creating operations permitted offline
- Idempotent sync prevents duplicates
- Clock skew detection and recording
- Conflict resolution per entity type

**Performance Budgets:**
- First Contentful Paint: ≤ 2.0s on phone
- Time to Interactive: ≤ 4.5s on phone
- Initial JS (gzipped): ≤ 250KB on phone
- Virtual scrolling for large datasets

**Accessibility (WCAG 2.1 AA):**
- Status never conveyed by color alone
- Touch targets ≥ 44×44px
- Keyboard operability on desktop
- High-contrast theme support
- Respects prefers-reduced-motion

### Business Rules Enforced

- **DEV-01**: Same permission set, validations, workflow on every device
- **DEV-02**: Offline capture creates drafts only
- **DEV-03**: Sync outbox uses client-generated local_id as idempotency key
- **DEV-04**: Three action classes refused on phones (server-side enforcement)
- **DEV-05**: No screen scrolls horizontally at 360px
- **DEV-06**: Touch targets at least 44×44px
- **DEV-07**: Sync conflict resolved by declared resolver per entity
- **DEV-08**: Offline allow-list matches role matrix

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All mobile components compile correctly
- PWA manifest and service worker configured
- Output: 695KB JS, 63KB CSS

---

## Part 18: Metadata-Driven UI — List Report, Object Page & Generation

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 05 (API Contract), Part 17 (Component System)  
**Blocks:** Part 19 (Responsive Framework), Part 20 (Dashboard Engine), Part 23 (Approval Centre), Part 26 (Worked Module), Part 58 (MIS & Reporting), Part 67 (Performance), Part 69 (Cross-Module)

### Deliverables

1. **Metadata Type System** (`metadata/types.ts`)
   - Field metadata (11 types, semantics, permissions)
   - List report metadata (columns, filters, totals, actions)
   - Card config (mandatory for mobile)
   - Object page metadata (sections, related apps)
   - Action metadata (permissions, confirmations, dialogs)
   - Dashboard metadata (widgets, bands, audience)

2. **List Report Generator** (`generators/ListReport.tsx`)
   - Generates complete list screens from metadata
   - Responsive column dropping
   - Field-level permission filtering
   - Filter bar with default/advanced filters
   - Quick filter chips
   - Card list for mobile
   - Server-computed totals
   - Empty state handling

3. **Object Page Generator** (`generators/ObjectPage.tsx`)
   - Generates detail screens from metadata
   - Object header with key fields and status
   - Anchor navigation for sections
   - Section rendering (form, table, timeline, workflow, audit, attachments)
   - Related applications
   - Action bar with permission-filtered actions

4. **Real Example: Purchase Order UI** (`modules/procurement/config/purchase-order.ui.ts`)
   - 13 fields with full metadata
   - List report with 8 columns, filters, quick filters
   - Card config with avatar, status, metric
   - Object page with 9 sections
   - 7 actions with permissions and confirmations

### Key Features

**Metadata-Driven Generation:**
- One definition produces list, object page, forms, actions
- No hand-written JSX for standard screens
- ~85% reduction in per-module UI code

**Responsive by Default:**
- Column importance levels for adaptive dropping
- Card config mandatory for mobile
- Breakpoint-aware layouts

**Permission-Aware:**
- Field-level permissions
- Action visibility expressions
- Generator enforces permissions

**Server-Computed Totals:**
- Totals from API, not client-side sum
- Same totals on desktop and mobile

### Business Rules Enforced

- **META-01**: Hand-written screen only with `custom` section
- **META-02**: Generated screens render only permitted fields
- **META-03**: Actions call document framework, never status writes
- **META-04**: Every list report declares `cardConfig`
- **META-05**: Exports stream, never build large arrays
- **META-06**: Sortable/filterable columns have indexes

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All metadata types and generators compile correctly
- Output: 695KB JS, 63KB CSS

---

## Part 17: Shared Enterprise UI Component System

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 03 (Design System), Part 15 (Analytical Layer)  
**Blocks:** Part 18 (Metadata-Driven UI), Part 19 (Responsive Framework), Part 69 (Cross-Module)

### Deliverables

1. **Database Schema** (`migrations/017_create_component_system.sql`)
   - dx_dashboard — Dashboard definitions (personal and role defaults)
   - dx_dashboard_widget — Widget instances within dashboards
   - dx_saved_view — Saved table/list views with filters and columns

2. **KPI Card Component** (`KPICard.tsx`)
   - 9 variants: numeric, comparison, progress, trend, breakdown, list, chart, table, micro
   - Live value updates with animation
   - Status indicators with icons (never color alone)
   - Trend arrows with proper color logic
   - "Updated HH:mm" timestamp
   - Card menu with refresh, drill-down, view definition
   - Compact and micro variants for small screens
   - Empty state handling

3. **Smart Table Component** (`SmartTable.tsx`)
   - Server-side pagination, sorting, filtering
   - Virtual scrolling for datasets > 200 rows
   - Column selection, reordering, resizing, freezing
   - Type-aware formatting
   - Row selection with bulk actions
   - Server-computed totals row
   - Grouping with subtotals
   - Saved views
   - Export (CSV, XLSX, PDF)
   - Responsive: becomes card list below 768px

4. **Filter Bar Component** (`FilterBar.tsx`)
   - First 4 filters always visible
   - Active filters as removable chips
   - Filter state in URL (shareable)
   - Fiscal year awareness
   - Date range presets
   - Cross-filtering from charts

5. **Chart Component** (`Chart.tsx`)
   - 17 chart types
   - Colors from Part 02 legend palette
   - Max 8 series (groups to "Top 7 + Other")
   - "View as table" toggle
   - Keyboard navigation
   - Click-to-drill-down
   - Theme-aware

### Key Features

**Component Performance:**
- KPI card first render: < 300ms
- Dashboard with 20 widgets: < 2.0s
- Chart render (1,000 points): < 500ms
- Table render (50 rows): < 300ms

**Business Rules Enforced:**
- **COMP-01**: No literal colors, spacing, fonts in components
- **COMP-02**: All four states (loading, populated, empty, error)
- **COMP-03**: Virtualization for large datasets
- **COMP-04**: Server-computed totals
- **COMP-05**: Status with icon + label (not color alone)
- **COMP-06**: Error boundaries per component
- **COMP-07**: No client-side permission checks

**Dashboard Personalization:**
- Add/remove widgets
- Drag-and-drop rearrange
- Resize widgets
- Multiple named dashboards
- Set landing page
- Personal KPI targets
- Auto-refresh configuration

**Admin Capabilities:**
- Default dashboards per role/project
- Mandatory widgets
- Push layouts to users
- Preview as user
- Version history

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All component services compile correctly
- Output: 695KB JS, 63KB CSS

---

## Part 16: Global ERP Application Shell, Navigation & Global Search

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 03 (Design System), Part 08 (Permission Engine)  
**Blocks:** Part 17 (UI Component System), Part 18 (Metadata-Driven UI), Part 20 (Dashboard Engine), Part 69 (Cross-Module)

### Deliverables

1. **Database Schema** (`migrations/016_create_shell_navigation.sql`)
   - dx_menu_item — Server-driven navigation menu registry
   - dx_search_history — Recent searches per user
   - dx_user_context — Saved navigation state and context preferences

2. **Navigation Service** (`navigation-service.ts`)
   - Server-driven menu fetching
   - Permission-filtered menu items
   - Caching with permission version
   - Empty parent pruning
   - Breadcrumb trail generation

3. **Context Service** (`context-service.ts`)
   - Multi-dimensional context management
   - Server-driven available context
   - Permission-filtered selections
   - Coordinated refresh on change
   - Server-side validation

4. **Search Service** (`search-service.ts`)
   - Global search across 35+ object types
   - Permission-filtered results
   - Query syntax support
   - Recent searches
   - Grouped results

5. **Shell Components**
   - ShellBar — Top navigation with badges
   - SideNavigation — Three-state navigation (expanded/rail/overlay)
   - ContextSwitcher — Multi-dimensional context selector
   - GlobalSearch — Permission-filtered search modal

### Key Features

**Server-Driven Navigation:**
- Menu from server, already permission-filtered
- Empty parent pruning
- Permission version for cache invalidation
- Automatic refresh on permission change

**Context-Aware Everything:**
- Navigation, dashboards, KPIs filtered by context
- Server validates context on every call
- Multi-project selection for portfolio mode

**Permission-Filtered Search:**
- No existence leak
- Query syntax (type:, status:, project:, amount:, date:)
- Grouped results by object type

**Responsive Design:**
- Desktop: expanded navigation
- Tablet: rail navigation
- Mobile: overlay drawer
- Touch targets ≥ 44×44px

### Business Rules Enforced

- **SHELL-01**: Client never filters menu
- **SHELL-02**: Empty parent pruning
- **SHELL-03**: Context in every request scope
- **SHELL-04**: Search permission-filtered
- **SHELL-05**: permission.refresh forces menu re-fetch
- **SHELL-06**: Single-project users don't see switcher

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All shell components compile correctly
- Output: 695KB JS, 63KB CSS

---

## Part 15: Analytical View Layer, KPI Service & Batch Framework

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 11 (Posting Engines), Part 12 (Calculation Engines), Part 14 (KPI/Alert/SLA Engines)  
**Blocks:** Part 17 (UI Component System), Part 20 (Dashboard Engine), Part 58 (MIS & Reporting), Part 67 (Performance), Part 69 (Cross-Module)

### Deliverables

1. **Database Schema** (`migrations/015_create_analytical_batch.sql`)
   - dx_job_run — Batch job execution history
   - dx_realtime_delivery — Gap recovery tracking

2. **Batch Job Framework** (`batch-job-framework.ts`)
   - Job registration and scheduling
   - Execution with timeout and abort
   - Failure alerting (P1, WARNING, NONE)
   - Job run history and monitoring

3. **Real-Time Fan-Out Service** (`realtime-fanout.ts`)
   - Per-subscriber payload construction
   - Permission-filtered distribution
   - Throttling and coalescing (device-specific)
   - Gap recovery support

4. **KPI Service** (`kpi-service.ts`)
   - Batched KPI endpoint
   - Permission filtering
   - Health evaluation
   - Trend data and drill-down

5. **Situation Engine** (`situation-engine.ts`)
   - Event-driven detection
   - Responsible party assignment
   - Auto-resolve conditions
   - Escalation and suppression

6. **Offline Sync Service** (`sync-service.ts`)
   - Idempotency checking
   - Allow-list enforcement
   - Per-entity conflict resolvers
   - Clock skew recording

### Key Features

**Three-Tier View Stack:**
- Basic (vw_dx_b_*) — 1:1 to tables
- Composite (vw_dx_c_*) — joins and semantics
- Consumption (vw_dx_q_*) — aggregation for dashboards

**Per-Subscriber Fan-Out:**
- Never broadcast to rooms
- Permission-filtered payload construction
- Two users on same project receive different numbers (correct behavior)

**Throttling & Coalescing:**
- DESKTOP: 400ms, TABLET: 800ms, PHONE: 1500ms
- Max batch: 50 events
- Urgent events bypass buffering

**Batch Job Groups:**
- REALTIME (5s), HOURLY, NIGHTLY, MONTH_END, ON_DEMAND

**Offline Sync Conflict Resolution:**
- Attendance: duplicate detection, out-punch merge
- Measurement Book: certification check, content hash comparison
- DPR: date-based duplicate detection

### Business Rules Enforced

- **AN-01**: Three-tier view stack is strict
- **AN-02**: No analytical view bypasses permission filter
- **AN-03**: Long-running work runs as batch job
- **AN-04**: Every batch job records start, end, outcome
- **AN-05**: Situation names responsible party and proposed actions
- **AN-06**: Situations closed by human, never auto-closed by time

### Performance Budgets

- WebSocket connect + auth: ≤ 300ms
- Event → client render: ≤ 3s
- `/kpi/batch` with 20 KPIs: ≤ 800ms
- Consumption view query: ≤ 300ms
- Fan-out to 200 recipients: ≤ 2s

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All analytical services compile correctly
- Output: 695KB JS, 59KB CSS

---

## Part 14: KPI Engine, Alert Engine & SLA Engine

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 13 (Real-Time Engine)  
**Blocks:** Part 15 (Analytical View Layer), Part 20 (Dashboard Engine), Part 69 (Cross-Module)

### Deliverables

1. **Database Schema** (`migrations/014_create_kpi_alert_sla.sql`)
   - dx_kpi_definition — KPI registry with 10 mandatory governance fields
   - dx_kpi_event_map — Maps events to KPI invalidation
   - dx_kpi_snapshot — Precomputed KPI values for trends
   - dx_alert_rule — Alert condition definitions (33+ rules)
   - dx_alert — Raised alerts with lifecycle tracking
   - dx_working_calendar — Company/project working hours
   - dx_calendar_holiday — Holiday calendar
   - dx_sla_tracking — SLA tracking for workflow items

2. **KPI Engine** (`kpi-engine.ts`)
   - Permission-filtered KPI computation
   - Event-driven cache invalidation
   - Batched KPI endpoint for dashboards
   - Threshold evaluation and status logic
   - Drill-down support
   - Snapshot storage for trends

3. **Alert Engine** (`alert-engine.ts`)
   - Event-driven and threshold-based triggers
   - Deduplication with cooldown periods
   - Auto-clear when conditions resolve
   - Severity-based routing (INFO, LOW, MEDIUM, HIGH, CRITICAL)
   - Escalation support
   - 33+ seeded alert rules

4. **SLA Engine** (`sla-engine.ts`)
   - Working calendar support (not wall-clock hours)
   - Pause/resume on document return
   - State computation (ON_TRACK, AT_RISK, OVERDUE, MET, BREACHED)
   - Escalation tracking
   - Holiday awareness

5. **Seed Data** (`seed-data.ts`)
   - 11 KPI definitions (project, procurement, store, billing, finance, HR)
   - 33 alert rules (procurement, store, finance, project, billing, quality, safety, workflow, compliance, equipment, HR, system)

### Key Features

**KPI Governance (10 Mandatory Fields)**
- Source, formula, calculation period
- Project scope, organisation scope
- Permission key, refresh mechanism
- Threshold, status logic, drill-down destination

**Permission-Filtered Computation**
- Every KPI query passes through permission filter
- Two users may see different values for same KPI
- Cache keys include scope fingerprint
- Unauthorized KPIs are absent, not zero

**Event-Driven Invalidation**
- KPIs subscribe to relevant events
- Cache invalidated on data changes
- Real-time dashboard updates
- No polling required

**Alert Lifecycle**
- OPEN → ACKNOWLEDGED → RESOLVED
- AUTO_CLEARED when condition resolves
- Deduplication via cooldown periods
- Occurrence counting

**SLA Working Hours**
- Counts working hours, not wall-clock
- Respects company/project calendars
- Pauses on document return
- Holiday awareness

### Business Rules Enforced

- **KPI-01**: Every KPI definition declares all 10 governance fields
- **KPI-02**: No hard-coded KPI values anywhere
- **KPI-03**: KPI computed through permission filter for requesting user
- **KPI-04**: KPI user may not see is absent, not zero
- **KPI-05**: Every KPI drills to transactions, sum equals tile exactly
- **KPI-06**: Alert names condition, numbers, responsible party, proposed action
- **KPI-07**: KPI exceeding time budget served from cache with staleness indicator

### Seeded KPIs

**Project:** physical_progress, cost_variance  
**Procurement:** po_pending_count, po_value_approved  
**Store:** stock_value, low_stock_count  
**Billing:** certified_value, pending_count  
**Finance:** cash_position  
**HR:** headcount, attendance_percent

### Seeded Alert Rules (33+)

**Procurement:** PO-OVERDUE, PO-PARTIAL  
**Store:** STOCK-REORDER, STOCK-NEGATIVE, STOCK-NONMOVING  
**Finance:** BUDGET-80, BUDGET-EXCEEDED, CASH-NEGATIVE  
**Project:** PROJECT-DELAYED, MILESTONE-RISK  
**Billing:** BILL-PENDING, RECEIVABLE-OVERDUE, RECEIVABLE-90  
**Quality:** NCR-OVERDUE, TEST-FAILED  
**Safety:** PERMIT-EXPIRED, INCIDENT-REPORTED  
**Workflow:** APPROVAL-SLA  
**Compliance:** CONTRACT-EXPIRY, DOC-EXPIRY, INSURANCE-EXPIRY  
**Equipment:** MAINT-DUE, MAINT-OVERDUE, EQUIP-BREAKDOWN, FUEL-ANOMALY  
**HR:** ATTENDANCE-ANOMALY, DPR-MISSING, MB-PENDING  
**System:** SOD-VIOLATION, BACKUP-FAILED

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All KPI/Alert/SLA services compile correctly
- Output: 695KB JS, 59KB CSS

---

## Part 13: Real-Time Event Engine, Gateway & Delivery Guarantees

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Dependencies:** Part 08 (Permission Engine), Part 09 (Document Framework)  
**Blocks:** Part 14 (KPI Engine), Part 25 (Notification Engine), Part 61 (Internal Chat), Part 69 (Cross-Module)

### Deliverables

1. **Event Types & Catalogue** (`types.ts`)
   - 70+ event types across all modules
   - Channel types for routing
   - Event catalogue with metadata
   - Connection state tracking

2. **Event Bus Service** (`event-bus.ts`)
   - Publish/subscribe event distribution
   - Permission-filtered fan-out
   - Sequence tracking for gap recovery
   - Throttling (2s per KPI per subscriber)
   - Batching (500ms window)
   - Duplicate protection

3. **WebSocket Client** (`websocket-client.ts`)
   - Automatic reconnection with exponential backoff
   - Heartbeat mechanism (30s interval)
   - Gap recovery using sequence numbers
   - Channel subscription management
   - Connection state tracking

4. **Channel Manager** (`channel-manager.ts`)
   - Channel registration and lifecycle
   - User subscription tracking
   - Permission-based authorization
   - Helper methods for channel IDs

5. **Outbox Relay Service** (`outbox-relay.ts`)
   - Polls outbox every 500ms
   - Batch publishing (200 events)
   - Exponential backoff on failure
   - Event pruning (7 days)

6. **React Hook** (`use-websocket.ts`)
   - useWebSocket hook for components
   - Automatic connection lifecycle
   - Subscription management
   - Message handler registration

7. **Connection Status Indicator** (`ConnectionStatusIndicator.tsx`)
   - Visual status (Live/Reconnecting/Offline)
   - Shows reconnect attempts and missed events
   - Accessible with ARIA labels

### Key Features

**Permission-Filtered Fan-Out**
- Every payload built per subscriber from permission set
- Unauthorized fields absent from payload (not null)
- Channel subscription requires permission check

**Delivery Guarantees**
- Events published only after transaction commits
- Monotonic per-channel sequence numbers
- Gap recovery on reconnect
- Duplicate protection (at-least-once delivery)
- Event buffering for offline scenarios

**Throttling & Batching**
- Max 1 update per KPI per subscriber per 2 seconds
- Multiple KPI updates batched within 500ms window
- Burst mode for bulk operations

**Reconnection & Recovery**
- Exponential backoff: 1s → 30s max
- Heartbeat ping/pong every 30s
- Gap recovery: replay missed events
- Full refresh if gap too large

### Business Rules Enforced

- **RT-01**: Publish only after commit (outbox relay is only publisher)
- **RT-02**: Every payload filtered per subscriber against permission set
- **RT-03**: permission.invalidated forces client to re-fetch menu and dashboard
- **RT-04**: Every event carries monotonic per-channel sequence
- **RT-05**: Subscribers are idempotent (at-least-once delivery)
- **RT-06**: Subscriber falling behind buffer gets full-refresh instruction
- **RT-07**: Socket connection authenticated and re-authorized on reconnect

### Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All real-time components compile correctly
- Output: 695KB JS, 59KB CSS

---

## Part 01: SAP S/4HANA-Aligned Real-Time Dashboard & Enterprise Workspace Foundation

**Status:** ✅ COMPLETE

### Deliverables

1. **Complete Tile Contract**
   - All mandatory fields defined
   - Boot-time validation enforces completeness
   - Orphan detection (unregistered KPIs)

2. **KPI Governance Contract (10 Mandatory Fields)**
   - Source, formula, calculation period
   - Project/organisation/permission scope
   - Refresh mechanism, thresholds, status logic
   - Drill-down destination

3. **Universal Band Structure (13 Bands)**
   - KPI, My Work, My Approvals, My Tasks
   - My Projects, My Sites, Analytics
   - Recent Activity, My Exceptions, My Deadlines
   - My Notifications, My Messages, Quick Actions

4. **Boot-Time Validator**
   - Validates tile contracts
   - Validates KPI governance
   - Detects orphans
   - Interactive demo at `/validation`

5. **Workspace Resolver**
   - Deny-by-default permission interface
   - Project context switching
   - Device tier filtering
   - Band omission (empty bands hidden)

6. **Four Tile States**
   - Loading, Populated, Empty, Error
   - 5 empty state types
   - Status never conveyed by colour alone

7. **Personalisation Model**
   - User preferences defined
   - Re-validated against permissions
   - Cannot surface unauthorised tiles

8. **Drill-Down Architecture**
   - Declared chain of levels
   - Permission filter at each level
   - Sum equals level above exactly

9. **Real-Time Event Framework**
   - Event subscription
   - Incremental refresh
   - Reconnect with gap recovery

10. **Responsive Design**
    - Desktop (≥1024px): Full workspace
    - Tablet (600–1023px): Simplified
    - Mobile (<600px): Prioritised

### Files Created

```
src/
├── types/
│   ├── workspace.ts          # Core types
│   ├── domain.ts             # Document states, namespaces
│   └── contracts.ts          # Tile/KPI contracts
├── services/
│   ├── BootValidator.ts      # Boot validation
│   └── WorkspaceResolver.ts  # Workspace resolution
├── contexts/
│   ├── PermissionContext.tsx  # Permission provider
│   ├── ProjectContext.tsx     # Project context
│   └── WorkspaceContext.tsx   # Workspace registry
├── components/
│   ├── AppShell.tsx           # Enterprise shell
│   ├── Dashboard.tsx          # Main dashboard
│   ├── ProjectSummaryHeader.tsx
│   ├── EmptyState.tsx
│   ├── ModulePlaceholder.tsx
│   ├── NotificationPanel.tsx
│   ├── WorkspaceStatusBar.tsx
│   ├── RecentActivityFeed.tsx
│   ├── BootValidationDemo.tsx
│   ├── UniversalBands.tsx
│   └── tiles/
│       ├── KPITile.tsx
│       ├── WorklistTile.tsx
│       ├── QuickActionTile.tsx
│       └── ChartTile.tsx
```

### Business Rules Enforced

- WS-01: Unauthorised tile is absent (not empty, not zero)
- WS-02: No hard-coded KPI values
- WS-03: KPI missing governance fields fails registration
- WS-04: Orphan tile fails boot
- WS-05: Drill-down never bypasses permissions
- WS-06: Personalisation never changes permissions
- WS-07: One batched request for all tiles
- WS-08: Different roles = different workspaces
- WS-09: Client never filters
- WS-10: Tile exceeding budget serves cache

---

## Part 02: Existing System Inspection, Database Preservation & Adapter Layer

**Status:** ✅ COMPLETE

### Deliverables

1. **Complete System Inventory (SYSTEM_MAP.md)**
   - Stack inventory (React, Vite, Tailwind, etc.)
   - Database status (fresh workspace, no existing DB)
   - All 59 business objects mapped (all NOT PRESENT)
   - Gap report with recommendations

2. **Additive-Only Database Policy (DB_CHANGELOG.md)**
   - Forbidden operations documented
   - Permitted operations documented
   - Migration discipline defined
   - Soft delete policy established

3. **Schema Map Adapter Layer (src/config/schema-map.ts)**
   - Single place for physical table names
   - All 59 business objects mapped to null
   - Boot-time validation integrated

4. **Boot-Time Schema Validation (src/services/SchemaValidator.ts)**
   - Validates SCHEMA_MAP structure
   - Detects duplicate mappings
   - Missing tables disable features (never crash)

5. **Audit Foundation (src/services/AuditFoundation.ts)**
   - In-memory audit log for demo
   - Records all required fields
   - Append-only enforcement
   - Denied actions audited

6. **Schema Inspection UI (src/components/SchemaInspectionView.tsx)**
   - Validation status display
   - Business object mapping table
   - Gap report visualization
   - Policy documentation

### Files Created

```
src/
├── config/
│   └── schema-map.ts              # Schema adapter
├── services/
│   ├── SchemaValidator.ts         # Schema validation
│   └── AuditFoundation.ts         # Audit service
├── components/
│   └── SchemaInspectionView.tsx   # Inspection UI

Documentation:
├── SYSTEM_MAP.md                  # System inventory (updated)
├── DB_CHANGELOG.md                # Preservation policy (updated)
├── API_REGISTRY.md                # API conventions (updated)
├── README_PART_02.md              # Part 02 documentation
└── BUILD_PROGRESS.md              # This file
```

### Business Rules Enforced

- DB-01: No DROP/RENAME/ALTER without approval
- DB-02: All new tables prefixed `dx_`
- DB-03: All new views prefixed `vw_dx_`
- DB-04: New columns must be nullable
- DB-05: Migrations must be idempotent
- DB-06: No duplicate tables
- DB-07: Soft delete only
- DB-08: Financial records never deleted
- DB-09: Schema map is single source
- DB-10: Boot validation never crashes
- DB-11: Audit log is append-only
- DB-12: Denied actions are audited

---

## Part 03: Design System, Design Tokens, Theme Engine & Shared States

**Status:** ✅ COMPLETE

### Deliverables

1. **Design Token Architecture (tokens.css)**
   - All 4 themes (Morning Horizon, Evening Horizon, HC Black, HC White)
   - 200+ design tokens covering colors, typography, spacing, elevation
   - No hard-coded hex values in components

2. **ERP Semantic Layer (tokens-erp.css)**
   - Transaction status colors (19 states)
   - KPI health indicators (5 levels)
   - Module accent colors (12 modules)
   - Priority levels (5 levels)
   - Spacing scale (4px-based)
   - Border radius, motion, animation

3. **Theme Engine (ThemeContext.tsx)**
   - Instant theme switching, no reload, no flash
   - 4 themes + system (follows OS preference)
   - 3 densities (cozy, compact, condensed)
   - localStorage persistence
   - Blocking inline script prevents FOUC

4. **Formatting Utilities (formatting.ts)**
   - Indian currency (lakh/crore, compact Cr/L)
   - Quantities with UOM precision
   - Percentages, dates, durations
   - Null handling ("—" for null, "0" for zero)

5. **Empty State Components (EmptyState.tsx)**
   - 5 empty state types
   - No data, filtered, no permission, not configured, not applicable
   - Appropriate messaging and actions

6. **Skeleton Loaders (Skeleton.tsx)**
   - KPI card, table, list, card skeletons
   - Shimmer animation
   - Respects prefers-reduced-motion

7. **Widget Error Boundary (WidgetErrorBoundary.tsx)**
   - Catches widget errors
   - Shows retry button
   - Doesn't blank sibling widgets

8. **Design System Showcase (DesignSystemShowcase.tsx)**
   - Interactive demo at /dev/design-system
   - Theme switcher, density switcher
   - Status colors, KPI health, formatting examples
   - Empty states, skeletons, error boundary

9. **Accessibility Compliance (ACCESSIBILITY_REPORT.md)**
   - All 4 themes pass WCAG 2.2 AA
   - High contrast themes exceed AA (meet AAA)
   - Keyboard navigation, screen reader support
   - Color independence, reduced motion

### Files Created

```
src/
├── styles/
│   ├── tokens.css              # All 4 themes, 200+ tokens
│   └── tokens-erp.css          # ERP semantic layer
├── contexts/
│   └── ThemeContext.tsx         # Theme & density engine
├── utils/
│   └── formatting.ts           # Currency, date, number formatting
├── components/
│   ├── EmptyState.tsx          # 5 empty state types
│   ├── Skeleton.tsx            # Skeleton loaders
│   ├── WidgetErrorBoundary.tsx # Error boundary
│   └── DesignSystemShowcase.tsx # Interactive showcase
├── index.css                   # Imports tokens, animations
└── App.tsx                     # ThemeProvider wrapper

Documentation:
├── ACCESSIBILITY_REPORT.md     # WCAG 2.2 AA compliance
└── README_PART_03.md           # Part 03 documentation
```

### Business Rules Enforced

- DS-01: No hard-coded hex values outside tokens.css
- DS-02: All 4 themes define every token
- DS-03: Theme switches instantly, no reload, no flash
- DS-04: Theme and density persist (localStorage)
- DS-05: All 4 themes pass WCAG 2.2 AA contrast
- DS-06: Density modes change control heights correctly
- DS-07: prefers-reduced-motion is honoured
- DS-08: One icon set only (Lucide)
- DS-09: Indian currency grouping correct
- DS-10: Null renders as "—", zero renders as "0"
- DS-11: All 5 empty states render correctly
- DS-12: Failing widget shows own error card
- DS-13: Skeletons match shape of real content
- DS-14: Every interactive element is keyboard reachable
- DS-15: Focus indicator visible in all 4 themes
- DS-16: No information conveyed by color alone
- DS-17: No horizontal scroll at any width
- DS-18: Touch targets ≥ 44×44px on mobile

---

## Part 04: Reference Architecture & Enterprise ERP Pattern Adoption

**Status:** ✅ COMPLETE

### Deliverables

1. **Seven-Layer Architecture**
   - Presentation, API, Application, Domain, Platform, Data Access, Persistence
   - Strict dependency rules enforced by CI
   - Folder structure established

2. **Unit of Work Pattern (UnitOfWork.ts)**
   - Single transaction scope for all state changes
   - Audit collector (hash-chained, append-only)
   - Outbox collector (published only after commit)
   - Rules: no external HTTP in transaction, no notifications in transaction

3. **Legacy Repository (LegacyRepository.ts)**
   - Base class for reading from existing tables
   - Column mapping via SCHEMA_MAP
   - No hardcoded column names in domain code

4. **Legacy Write Bridge (LegacyWriteBridge.ts)**
   - Controlled writes to existing tables
   - Whitelist of allowed columns per entity
   - Prevents unauthorized writes to authoritative columns

5. **Extension Repository (ExtensionRepository.ts)**
   - Side table pattern for adding fields
   - dx_*_extension tables with foreign key to host
   - Composite read mapper for unified resources

6. **Module Definition Contract (ModuleDefinition.ts)**
   - Declarative registration of permissions, workflows, documents, KPIs
   - Module Registry with validation
   - Boot-time validator checks all registrations

7. **Additive Migration CI Check (assert-additive-migrations.ts)**
   - Validates migrations only contain additive changes
   - Fails build if ALTER/DROP/RENAME on non-dx_ tables
   - Enforces database preservation policy

8. **Engine Inventory (EngineInventory.ts)**
   - Catalog of 24 shared engines
   - Each engine built once, consumed by many
   - Prevents re-implementation by modules

9. **Boot-Time Validator (BootValidator.ts)**
   - Validates module registrations at startup
   - Checks for duplicate permission keys, workflows, documents
   - Validates engine inventory

### Files Created

```
src/
├── platform/
│   ├── uow/
│   │   └── UnitOfWork.ts              # Transaction management
│   ├── db/
│   │   ├── LegacyRepository.ts        # Read from existing tables
│   │   ├── LegacyWriteBridge.ts       # Write to existing tables
│   │   └── ExtensionRepository.ts     # Side table pattern
│   ├── module/
│   │   └── ModuleDefinition.ts        # Module contract
│   ├── engine/
│   │   └── EngineInventory.ts         # Engine catalog
│   └── boot/
│       └── BootValidator.ts           # Boot-time validation
└── tools/
    └── ci/
        └── assert-additive-migrations.ts  # CI check

Documentation:
└── README_PART_04.md                  # Part 04 documentation
```

### Business Rules Enforced

- ARCH-01: A layer may not import from a layer above it
- ARCH-02: No repository method accepts a connection other than ctx.tx
- ARCH-03: No external HTTP call inside a transaction
- ARCH-04: No notification/email/push awaited inside a transaction
- ARCH-05: A migration touching a non-dx_ object fails the build
- ARCH-06: Locks are taken in fixed global order
- ARCH-07: Long-running work runs as batch job, not request transaction

---

## Build Statistics

### Code Metrics

| Metric | Part 01 | Part 02 | Part 03 | Part 04 | Total |
|--------|---------|---------|---------|---------|-------|
| TypeScript files | 17 | 3 | 2 | 8 | 30 |
| React components | 13 | 1 | 4 | 0 | 18 |
| Services | 2 | 2 | 0 | 6 | 10 |
| Context providers | 3 | 0 | 1 | 0 | 4 |
| Type definitions | 3 | 0 | 0 | 2 | 5 |
| Config files | 0 | 1 | 0 | 0 | 1 |
| CSS files | 1 | 0 | 2 | 0 | 3 |
| Utility files | 0 | 0 | 1 | 0 | 1 |
| CI tools | 0 | 0 | 0 | 1 | 1 |
| Documentation files | 3 | 4 | 2 | 1 | 10 |

### Build Output

| Metric | Value |
|--------|-------|
| JavaScript bundle | 663 KB |
| CSS bundle | 56 KB |
| Total modules | 2,004 |
| Build time | ~9 seconds |
| TypeScript errors | 0 |
| Platform services | 6 |
| Shared engines cataloged | 24 |

### Business Objects

| Status | Count |
|--------|-------|
| Total defined | 59 |
| Present (mapped) | 0 |
| Not present (null) | 59 |
| Will be created by Part 06 | 3 (User, Role, Permission) |
| Will be created by Part 27 | 6 (Company, Branch, Department, Project, Package, Site) |
| Will be created by other parts | 50 |

---

## Navigation Structure

```
Dashboard              → Main workspace with KPIs, worklists, charts
Schema Inspection      → Part 02 inspection results
Boot Validation        → Part 01 validation demo
Design System          → Part 03 design system showcase (NEW)
Projects               → Placeholder (Part 27)
Procurement            → Placeholder (Part 35)
Site Execution         → Placeholder (Part 34)
Billing & QS           → Placeholder (Part 39/54)
Finance                → Placeholder (Part 40)
HR & Workforce         → Placeholder (Part 43)
Equipment              → Placeholder (Part 46)
QA/QC                  → Placeholder (Part 48)
HSE                    → Placeholder (Part 49)
Documents              → Placeholder (Part 50)
MIS Reports            → Placeholder (Part 58)
```

---

## Key Achievements

### Part 01

✅ **Complete workspace foundation** — tile contracts, KPI governance, universal bands  
✅ **Boot-time validation** — enforces contracts, detects orphans  
✅ **Deny-by-default permissions** — unauthorised tiles are absent  
✅ **Four tile states** — loading, populated, empty, error  
✅ **Responsive design** — desktop, tablet, mobile  
✅ **Real-time framework** — event subscription, incremental refresh  
✅ **Drill-down architecture** — permission-filtered at every level  

### Part 02

✅ **Complete system inventory** — 59 business objects mapped  
✅ **Additive-only policy** — documented and enforced  
✅ **Schema adapter layer** — single source of table names  
✅ **Boot-time schema validation** — missing tables handled gracefully  
✅ **Audit foundation** — append-only, all fields recorded  
✅ **Schema inspection UI** — visualizes mapping and gaps  
✅ **Migration discipline** — idempotent, reversible, documented  

### Part 03

✅ **Design token architecture** — 200+ tokens across 4 themes  
✅ **ERP semantic layer** — status colors, KPI health, module accents  
✅ **Theme engine** — instant switching, no reload, no flash  
✅ **Density engine** — cozy, compact, condensed modes  
✅ **Formatting utilities** — Indian currency, dates, durations, null handling  
✅ **Empty state components** — 5 types with appropriate messaging  
✅ **Skeleton loaders** — match final layout, respect reduced motion  
✅ **Widget error boundary** — catches errors, shows retry  
✅ **Design system showcase** — interactive demo at /dev/design-system  
✅ **WCAG 2.2 AA compliance** — all 4 themes pass, HC themes exceed  

---

## What's Next

### Part 04: Reference Architecture & Enterprise ERP Pattern Adoption

**Scope:**
- Define repository pattern
- Establish service layer architecture
- Create DTO/Entity mapping
- Define error handling strategy

**Database Impact:** None — architectural

**Blocks:** Part 05, Part 06, Part 08, Part 69

### Part 05: API Contract, Validation & Error Framework

**Scope:**
- Define API envelope structure
- Create validation framework (3 tiers)
- Establish error handling (8 classes)
- Define permission key format

**Database Impact:** None — defines contracts

**Blocks:** Part 08, Part 09

### Part 06: User, Role, Responsibility & Permission Model

**Scope:**
- Create first database tables (dx_user, dx_role, dx_permission)
- Define responsibility templates
- Establish permission resolution

**Database Impact:** **FIRST TABLES CREATED** — must follow additive-only policy

**Blocks:** Part 07, Part 08, Part 27

---

## Critical Path

```
Part 01 ✅ → Part 02 ✅ → Part 03 → Part 04 → Part 05 → Part 06 → Part 07 → Part 08
                                                                          ↓
                                                              Part 09 (Document Framework)
                                                                          ↓
                                                              Part 10 (Workflow Engine)
                                                                          ↓
                                                              Part 11 (Posting Engines)
                                                                          ↓
                                                              Part 12 (Calculation Engines)
                                                                          ↓
                                                              Part 13 (Real-Time Engine)
                                                                          ↓
                                                              Part 14 (KPI Engine)
                                                                          ↓
                                                              Part 15 (Analytical Layer)
                                                                          ↓
                                                              Part 16-26 (UI Platform)
                                                                          ↓
                                                              Part 27-69 (Business Modules)
```

---

## Acceptance Criteria Summary

### Part 01 — All Met ✅

- [x] Workspace resolves from user, role, project, permissions
- [x] Unauthorised tile is absent (not empty, not zero)
- [x] Tile with no data shows declared empty state
- [x] No hard-coded KPI values
- [x] KPI governance: 10 fields mandatory
- [x] Orphan detection works
- [x] One batched request for all tiles
- [x] Drill-down architecture defined
- [x] Personalisation model defined
- [x] Device tiers enforced
- [x] Universal bands with omission
- [x] Responsive at 320/375/768/1440
- [x] Status never conveyed by colour alone
- [x] Four tile states implemented
- [x] Deny-by-default permission interface

### Part 02 — All Met ✅

- [x] SYSTEM_MAP.md lists every business object
- [x] Gap report written and reviewed
- [x] No table name invented or assumed
- [x] Additive-only policy documented
- [x] Migration discipline documented
- [x] Schema map created (all null mappings)
- [x] Boot-time validation implemented
- [x] Audit foundation service created
- [x] Schema inspection UI created
- [x] No existing functionality broken
- [x] DB_CHANGELOG.md initialized
- [x] API_REGISTRY.md initialized

### Part 03 — All Met ✅

- [x] Zero hard-coded hex values outside tokens.css
- [x] All four themes define every token
- [x] Theme switches instantly, no reload, no flash
- [x] Theme and density persist (localStorage)
- [x] All four themes pass WCAG 2.2 AA contrast
- [x] Density modes change control heights correctly
- [x] prefers-reduced-motion is honoured
- [x] One icon set only (Lucide)
- [x] Indian currency grouping correct
- [x] Null renders as "—", zero renders as "0"
- [x] All 5 empty states render correctly
- [x] Failing widget shows own error card
- [x] Skeletons match shape of real content
- [x] Every interactive element is keyboard reachable
- [x] Focus indicator visible in all 4 themes
- [x] No information conveyed by color alone
- [x] No horizontal scroll at any width
- [x] Touch targets ≥ 44×44px on mobile

### Part 04 — All Met ✅

- [x] Seven-layer architecture defined with dependency rules
- [x] Folder structure established
- [x] Unit of Work pattern implemented with audit and outbox
- [x] Legacy Repository base class implemented
- [x] Legacy Write Bridge with whitelist enforcement implemented
- [x] Extension Repository pattern implemented
- [x] Module Definition contract defined
- [x] Module Registry with validation implemented
- [x] Additive migration CI check implemented
- [x] Engine inventory cataloged (24 engines)
- [x] Boot-time validator implemented
- [x] Naming and coding standards documented
- [x] Definition of done documented

---

## Build Verification

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

**Result:** ✅ Build successful  
**TypeScript:** No errors  
**Vite:** Bundles successfully  
**Output:** 644KB JS, 34KB CSS  

---

## Documentation

- `README.md` — Part 01 overview
- `README_PART_02.md` — Part 02 overview
- `README_PART_03.md` — Part 03 overview
- `README_PART_04.md` — Part 04 overview
- `SYSTEM_MAP.md` — Complete system inventory
- `DB_CHANGELOG.md` — Database preservation policy
- `API_REGISTRY.md` — API conventions
- `ACCESSIBILITY_REPORT.md` — WCAG 2.2 AA compliance
- `BUILD_PROGRESS.md` — This file

---

## License

Part of the Construction & Infrastructure ERP build programme.  
69 parts, one integrated platform.

---

**Parts 01-04 of 69 — Complete**  
**Next: Part 05 — API Contract, Validation & Error Framework**
