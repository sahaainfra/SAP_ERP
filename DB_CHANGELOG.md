# Database Changelog

This document tracks all database migrations in chronological order.

## Migration Policy

- All migrations must be additive (CREATE TABLE, ADD COLUMN, CREATE INDEX)
- No destructive operations (DROP, ALTER COLUMN TYPE, RENAME) on existing tables
- All new tables must be prefixed with `dx_`
- All new views must be prefixed with `vw_dx_`
- Migrations must be reversible where possible
- Each migration must include rollback instructions

---

## Migration 006: Create Permission Model

**Date:** 2026-01-XX  
**Part:** 06 - User, Role, Responsibility & Permission Model  
**File:** `migrations/006_create_permission_model.sql`

### Purpose

Creates the complete permission model that layers on top of the existing roles and permissions system. This provides project-scoped authorization with responsibility templates, approval authorities, delegation, field restrictions, and segregation of duties.

**Key Principle:** A user may hold different roles, responsibilities, authorities and permissions on different projects.

### Changes

**New Tables (11 tables):**

1. **dx_permission** - Permission catalogue
   - Stores all permission keys in format: module.entity.action
   - Example: procure.po.approve, bill.client.certify
   - Tracks sensitivity and limit requirements

2. **dx_responsibility_template** - Responsibility templates
   - Named, reusable bundles of permissions
   - System templates (cannot be deleted) and custom templates
   - Categories: execution, commercial, finance, support

3. **dx_responsibility_template_permission** - Template-permission mapping
   - Maps permissions to templates
   - Supports grant/deny per permission

4. **dx_project_assignment** - User × project assignment (CORE TABLE)
   - Assigns users to projects with responsibility templates
   - Supports validity windows (valid_from, valid_to)
   - Status: ACTIVE, SUSPENDED, EXPIRED, REVOKED
   - Data scope: OWN, SITE, PACKAGE, PROJECT, ALL_ASSIGNED

5. **dx_assignment_permission** - Per-assignment permission overrides
   - Explicit grant or deny for specific permissions
   - DENY always wins over any grant

6. **dx_approval_authority** - Approval authority per assignment
   - Per document type, per value band
   - Approval level in chain
   - Min/max amounts, currency
   - Capabilities: approve, reject, return, forward, delegate

7. **dx_assignment_scope** - Site/package restriction
   - Restricts assignment to specific sites, packages, WBS, cost centres, stores

8. **dx_delegation** - Temporary delegation
   - Delegates approval authority to another user
   - Time-bounded (valid_from, valid_to)
   - Optional project and document type restrictions
   - Cannot delegate to self

9. **dx_field_restriction** - Field-level visibility
   - VISIBLE, MASKED, or HIDDEN per field per entity
   - Used for sensitive data (salary, margin, rates)

10. **dx_sod_rule** - Segregation of duties rules
    - Conflicting permission pairs
    - Severity: WARNING or BLOCK
    - Rationale for audit trail

11. **dx_assignment_audit** - Immutable assignment audit
    - Tracks all assignment changes
    - Before/after values in JSONB
    - Append-only (UPDATE/DELETE revoked from application user)

**New Indexes:**
- Multiple indexes for performance on user, project, status lookups
- Indexes for audit trail queries
- Indexes for delegation validity checks

### Business Rules

- **PERM-01**: Deny by default - absent assignment means no access
- **PERM-02**: Explicit DENY override always wins
- **PERM-03**: Assignment outside validity window grants nothing
- **PERM-04**: Delegation transfers named permissions only, not global role
- **PERM-05**: Substitute must independently hold permission and authority
- **PERM-06**: Approval authority is per project per document type per value band
- **PERM-07**: Super Admin bypass grants breadth only, never removes SoD controls

### Four-Layer Permission Resolution

1. **Global Role** - What the user is, organisation-wide (existing system)
2. **Project Assignment** - Which projects the user is on
3. **Project Responsibility** - What the user does on THAT project (template)
4. **Explicit Override** - Specific grant or deny for this user on this project

**Resolution Rule:** DENY at any layer always wins. Otherwise, permissions are additive.

### Rollback

```sql
DROP TABLE IF EXISTS dx_assignment_audit;
DROP TABLE IF EXISTS dx_sod_rule;
DROP TABLE IF EXISTS dx_field_restriction;
DROP TABLE IF EXISTS dx_delegation;
DROP TABLE IF EXISTS dx_assignment_scope;
DROP TABLE IF EXISTS dx_approval_authority;
DROP TABLE IF EXISTS dx_assignment_permission;
DROP TABLE IF EXISTS dx_project_assignment;
DROP TABLE IF EXISTS dx_responsibility_template_permission;
DROP TABLE IF EXISTS dx_responsibility_template;
DROP TABLE IF EXISTS dx_permission;
```

### Testing

- [ ] All 11 tables created successfully
- [ ] All indexes created successfully
- [ ] All constraints validated
- [ ] Foreign key relationships verified
- [ ] Permission key format validation tested
- [ ] Four-layer resolution tested
- [ ] DENY override precedence tested
- [ ] Approval authority limits tested
- [ ] Delegation time-bounds tested
- [ ] Field masking tested
- [ ] SoD rule violations detected
- [ ] Audit trail immutability verified

### Security

- `dx_assignment_audit` must have UPDATE/DELETE revoked from application user
- Assignment changes require `admin.responsibility.configure` permission
- Self-elevation blocked at service layer

---

## Migration 005: Create Idempotency Table

**Date:** 2026-01-XX  
**Part:** 05 - API Contract, Validation & Error Framework  
**File:** `migrations/005_create_idempotency_table.sql`

### Purpose

Creates the `dx_idempotency` table to support idempotent POST requests. This ensures that replaying the same request with the same Idempotency-Key returns the same response without re-executing the business logic.

### Changes

**New Table:** `dx_idempotency`

Stores idempotency keys for POST requests with the following structure:
- `key` (VARCHAR(120), PK): Idempotency key from request header
- `actor_user_id` (BIGINT): User who made the request
- `endpoint` (VARCHAR(200)): API endpoint that was called
- `request_hash` (CHAR(64)): SHA-256 hash of request body
- `status` (VARCHAR(20)): IN_PROGRESS, COMPLETED, or FAILED
- `response_status` (INTEGER): HTTP status code of response
- `response_body` (JSONB): Cached response for replay
- `created_at` (TIMESTAMPTZ): When request was created
- `completed_at` (TIMESTAMPTZ): When request completed
- `expires_at` (TIMESTAMPTZ): When record expires (default 24h)

**New Indexes:**
- `idx_dx_idempotency_expires`: For cleanup job to find expired records
- `idx_dx_idempotency_in_progress`: For timeout handling
- `idx_dx_idempotency_actor`: For audit trail queries

### Business Rules

- **API-05**: Every write that creates a document or executes a side-effecting action requires an Idempotency-Key
- Records expire after 24 hours (7 days for payments and integration calls)
- Same key with different request_hash returns 422 IDEMPOTENCY_KEY_REUSED
- Concurrent requests with same key return 409 REQUEST_IN_PROGRESS

### Rollback

```sql
DROP TABLE IF EXISTS dx_idempotency;
```

### Testing

- [ ] Table created successfully
- [ ] Indexes created successfully
- [ ] Constraints validated
- [ ] Idempotency middleware tested with duplicate requests
- [ ] Expiration cleanup tested

---

## Migration 004: Reference Architecture Foundation

**Date:** 2026-01-XX  
**Part:** 04 - Reference Architecture & Enterprise ERP Pattern Adoption  
**File:** `migrations/004_create_platform_tables.sql`

### Purpose

Creates the foundational platform tables for the reference architecture including Unit of Work tracking, audit logging, and module registry.

### Changes

**New Tables:**
- `dx_uow_tracking`: Tracks Unit of Work transactions
- `dx_audit_log`: Hash-chained audit trail (append-only)
- `dx_module_registry`: Registered modules and their metadata
- `dx_edit_lock`: Advisory locks for long-running edits

### Rollback

```sql
DROP TABLE IF EXISTS dx_edit_lock;
DROP TABLE IF EXISTS dx_module_registry;
DROP TABLE IF EXISTS dx_audit_log;
DROP TABLE IF EXISTS dx_uow_tracking;
```

---

## Migration 003: Design System User Preferences

**Date:** 2026-01-XX  
**Part:** 03 - Design System, Design Tokens, Theme Engine  
**File:** `migrations/003_create_user_preferences.sql`

### Purpose

Creates the `dx_user_preference` table to store user-specific design system preferences (theme, density, locale, etc.).

### Changes

**New Table:** `dx_user_preference`

Stores user preferences with the following structure:
- `id` (BIGSERIAL, PK): Auto-incrementing ID
- `user_id` (BIGINT, FK): Reference to user
- `preference_key` (VARCHAR(100)): Preference name (e.g., 'theme', 'density')
- `preference_value` (TEXT): Preference value
- `created_at` (TIMESTAMPTZ): When preference was created
- `updated_at` (TIMESTAMPTZ): When preference was last updated

**Unique Constraint:** `(user_id, preference_key)` - one value per user per preference

### Rollback

```sql
DROP TABLE IF EXISTS dx_user_preference;
```

---

## Migration 002: Schema Inspection Documentation

**Date:** 2026-01-XX  
**Part:** 02 - Existing System Inspection, Database Preservation & Adapter Layer  
**File:** N/A (Documentation only)

### Purpose

Documented the existing database schema and established the additive-only migration policy.

### Changes

- Created `SYSTEM_MAP.md` with complete schema inventory
- Created `DB_CHANGELOG.md` (this file)
- Established migration policy and naming conventions
- Created `src/config/schema-map.ts` adapter layer

### Rollback

N/A - No database changes

---

## Migration 001: Initial Workspace Foundation

**Date:** 2026-01-XX  
**Part:** 01 - SAP S/4HANA-Aligned Real-Time Dashboard & Enterprise Workspace Foundation  
**File:** N/A (No database changes)

### Purpose

Established the workspace foundation including tile contracts, KPI governance, and permission framework.

### Changes

- No database tables created
- Defined contracts for future parts to implement
- Created type definitions and validation framework

### Rollback

N/A - No database changes

---

## Future Migrations

The following migrations are planned for subsequent parts:

### Part 06: User, Role & Permission Model
- `dx_user`: User accounts
- `dx_role`: Role definitions
- `dx_permission`: Permission definitions
- `dx_user_role`: User-role assignments
- `dx_role_permission`: Role-permission assignments
- `dx_responsibility_template`: Predefined role templates
- `dx_sod_rule`: Segregation of duties rules

### Part 07: Document Framework
- `dx_document_type`: Document type definitions
- `dx_document_state`: State machine definitions
- `dx_number_series`: Number sequence definitions
- `dx_document_draft`: Draft document storage
- `dx_event_outbox`: Transactional outbox for events

### Part 08: Workflow & Approval Engine
- `dx_workflow_definition`: Workflow definitions
- `dx_workflow_step`: Workflow step definitions
- `dx_approval_instance`: Active approval instances
- `dx_approval_history`: Approval history

### Part 09: Posting Engines
- `dx_stock_ledger`: Stock movement ledger
- `dx_gl_entry`: General ledger entries
- `dx_account`: Chart of accounts
- `dx_period`: Accounting periods
- `dx_posting_rule`: Posting rule definitions

### Part 10: Calculation Engines
- `dx_rate_master`: Rate definitions (materials, labour, equipment)
- `dx_tax_master`: Tax rate definitions
- `dx_deduction_rule`: Deduction rule definitions
- `dx_uom_conversion`: Unit of measure conversions

---

## Migration Checklist

Before submitting a migration:

- [ ] Migration file follows naming convention: `NNN_description.sql`
- [ ] All new tables prefixed with `dx_`
- [ ] All new views prefixed with `vw_dx_`
- [ ] Migration is additive only (no DROP, ALTER COLUMN TYPE, RENAME)
- [ ] Rollback instructions provided
- [ ] Indexes justified by query patterns
- [ ] Constraints validated
- [ ] Tested against restored production copy
- [ ] `DB_CHANGELOG.md` updated
- [ ] `SYSTEM_MAP.md` updated if schema changed
- [ ] Additive migration CI check passes

---

## Additive Migration CI Check

The CI pipeline enforces the additive-only policy using `src/tools/ci/assert-additive-migrations.ts`.

**Forbidden operations:**
- `DROP TABLE`
- `DROP COLUMN`
- `ALTER TABLE ... ALTER COLUMN` (changing type)
- `RENAME TABLE`
- `RENAME COLUMN`
- `TRUNCATE TABLE`

**Allowed operations:**
- `CREATE TABLE dx_*`
- `CREATE VIEW vw_dx_*`
- `CREATE INDEX`
- `ALTER TABLE dx_* ADD COLUMN` (nullable only)
- `ALTER TABLE dx_* ADD CONSTRAINT`

**Enforcement:**
The CI check parses all migration files and fails the build if any forbidden operations are detected on non-`dx_` objects.

---

## Database Conventions

### Naming

- Tables: `dx_<domain>_<noun>` (singular, snake_case)
- Views: `vw_dx_<name>`
- Indexes: `idx_<table>_<columns>`
- Constraints: `chk_<table>_<description>`, `fk_<table>_<reference>`, `uq_<table>_<columns>`

### Columns

- Primary keys: `id` (BIGSERIAL) or composite keys
- Foreign keys: `<entity>_id` (BIGINT)
- Timestamps: `created_at`, `updated_at` (TIMESTAMPTZ)
- Soft delete: `deleted_at` (TIMESTAMPTZ, nullable)
- Audit: `created_by`, `updated_by` (BIGINT, nullable)
- Row version: `row_version` (BIGINT, default 1) for optimistic concurrency

### Data Types

- Money: `NUMERIC(18,2)` (never floating point)
- Quantities: `NUMERIC(18,4)` with UoM column
- Dates: `DATE` for business dates, `TIMESTAMPTZ` for timestamps
- Enums: `VARCHAR(50)` with CHECK constraint
- JSON: `JSONB` for flexible structures

### Indexes

- All foreign keys indexed
- Frequently filtered columns indexed
- Composite indexes for multi-column filters
- Partial indexes for filtered queries (e.g., `WHERE deleted_at IS NULL`)

---

## Rollback Procedures

### General Rollback Steps

1. Stop the application
2. Run rollback SQL from `DB_CHANGELOG.md`
3. Verify schema matches pre-migration state
4. Restart application
5. Run regression tests

### Rollback Safety

- All migrations are designed to be reversible
- Data migrations include backup procedures
- Rollback scripts tested against production copy
- Rollback window: 24 hours after deployment

---

## Contact

For questions about database migrations:
- Architecture team: architecture@construction-erp.com
- DBA team: dba@construction-erp.com
- Emergency rollback: +1-XXX-XXX-XXXX

---

**Last Updated:** 2026-01-XX  
**Total Migrations:** 5  
**Current Version:** 005
