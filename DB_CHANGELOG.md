# DB_CHANGELOG.md — Part 02 (Complete)

## Part 02: Existing System Inspection, Database Preservation & Adapter Layer

### Date: 2026
### Inspection Performed By: System Inspector
### Database Snapshot: Fresh workspace (no existing database)

---

## DATABASE PRESERVATION POLICY

### Forbidden Without Written Approval

The following operations are **FORBIDDEN** without explicit written approval from the database governance committee:

1. `DROP TABLE`
2. `DROP COLUMN`
3. `RENAME TABLE`
4. `RENAME COLUMN`
5. Changing a column's data type
6. Changing a column's nullability
7. Changing a column's default value
8. Changing, dropping, or re-pointing an existing primary key
9. Changing, dropping, or re-pointing an existing foreign key
10. Deleting rows from any business table
11. Truncating any table
12. Modifying any historical transaction row
13. Creating a second table that duplicates an existing master (no `projects_new`, no `vendor_master_v2`)

### Permitted — Additive Only

The following operations are **PERMITTED** without special approval:

1. **Creating NEW tables** — always prefixed `dx_` (dashboard/extension)
   - Example: `dx_kpi_definition`, `dx_workspace_tile`
   - Must follow existing naming conventions
   - Must reference existing tables by their existing primary keys
   - Must not duplicate existing master data

2. **Adding NEW nullable columns** to existing tables
   - Only where no new table can serve the requirement
   - Must be nullable with a safe default
   - Must be justified in this changelog
   - Existing inserts must keep working

3. **Adding read-only database views** — prefixed `vw_dx_`
   - Example: `vw_dx_project_summary`
   - Must not modify underlying data
   - Must respect permission boundaries

4. **Adding indexes** to existing tables
   - For dashboard query performance
   - Must be justified by a named slow query
   - Indexes are additive and reversible

### Migration Discipline

Every migration must follow these rules:

1. **One migration file per logical change**
   - Forward and reversible
   - Single purpose

2. **Idempotent migrations**
   - Use `CREATE TABLE IF NOT EXISTS`
   - Use guarded `ADD COLUMN` (check if exists first)
   - Safe to run multiple times

3. **No destructive SQL**
   - A migration that would drop something must FAIL instead
   - No `DROP`, `RENAME`, or destructive `ALTER`

4. **Test against restored production copy**
   - Test forward migration
   - Test rollback
   - Verify existing functionality unchanged

5. **Record in DB_CHANGELOG.md**
   - Date
   - Migration file name
   - Tables touched
   - Reason for change
   - Rollback procedure
   - Compatibility impact

### Soft Delete Only

Where deletion is needed:

1. Set `deleted_at`, `deleted_by`, `deletion_reason`
2. Every dashboard query excludes soft-deleted rows
3. Archive view requires explicit permission
4. **Approved financial records can NEVER be soft-deleted**
   - They are cancelled or reversed, never removed
   - Enforced at database level

---

## MIGRATION LOG

### Migration 001 — Initial Schema (Part 02)

**Date:** 2026  
**File:** N/A (no migration — fresh workspace)  
**Tables Touched:** None  
**Reason:** Fresh workspace inspection — no existing database to migrate  
**Rollback:** N/A  
**Compatibility:** No existing functionality affected

**Notes:**
- This is a fresh workspace with no existing ERP database
- All business objects are NOT PRESENT
- Schema map initialized with null mappings
- No tables created in Part 02
- Table creation begins with Part 06 (User/Role/Permission)

---

### Future Migrations

When tables are created in subsequent parts, each migration will be documented here with:

- **Migration number** (sequential)
- **Date** (ISO 8601)
- **File** (migration file path)
- **Tables touched** (list of tables created/modified)
- **Reason** (why this change is needed)
- **Additive justification** (why existing structure cannot support it)
- **Rollback procedure** (how to reverse if needed)
- **Compatibility impact** (what existing functionality is affected)
- **Test results** (forward and rollback verified)

---

## AUDIT FOUNDATION

### Audit Table (Future)

When Part 09 implements the hash-chained audit writer, the audit table will be:

**Table:** `dx_audit_log`  
**Owner:** Part 09  
**Purpose:** Append-only audit trail for all system changes

**Columns:**
- `id` (UUID, primary key)
- `timestamp` (TIMESTAMPTZ, UTC)
- `user_id` (UUID, foreign key to dx_user)
- `impersonated_by` (UUID, nullable)
- `session_id` (VARCHAR)
- `ip_address` (VARCHAR)
- `user_agent` (TEXT)
- `module` (VARCHAR)
- `entity_type` (VARCHAR)
- `entity_id` (VARCHAR)
- `action` (VARCHAR)
- `before_value` (JSONB, nullable)
- `after_value` (JSONB, nullable)
- `company_id` (UUID, nullable)
- `project_id` (UUID, nullable)
- `site_id` (UUID, nullable)
- `permission_key` (VARCHAR)
- `result` (VARCHAR: 'allowed' | 'denied')
- `reason` (TEXT, nullable)
- `correlation_id` (UUID, nullable)
- `hash` (VARCHAR) — for tamper detection

**Constraints:**
- Append-only: No UPDATE or DELETE permissions for application user
- Enforced at database level, not by convention
- Hash-chained for tamper detection

**Current Status:** Foundation service created in Part 02 (in-memory for demo). Database table will be created in Part 09.

---

## SCHEMA MAP VALIDATION

### Boot-Time Validation

The schema map (`src/config/schema-map.ts`) is validated at application boot:

1. **Check SCHEMA_MAP is defined**
   - If undefined, log critical error

2. **Validate each business object mapping**
   - If mapping is null, log info (NOT PRESENT is valid)
   - If mapping exists, validate structure:
     - Must have `table` name
     - Must have `pk` (primary key)

3. **Check for duplicate table names**
   - If same table mapped to multiple business objects, log error

4. **Query information_schema** (when database exists)
   - Verify each mapped table exists
   - Verify each mapped column exists
   - If missing, disable only affected feature (never crash)

### Current Validation Status

**Status:** DEGRADED (expected for fresh workspace)

- Total business objects: 59
- Present: 0
- Not present: 59
- Errors: 0
- Warnings: 59 (all business objects NOT PRESENT)

**Action Required:** None — this is the expected state for a fresh workspace. Business objects will be created by their owning parts following the build order.

---

## ADDITIVE-MIGRATION CI CHECK

### CI Rule

The CI pipeline must enforce the additive-only policy:

1. **Scan all migration files**
2. **Check for forbidden operations:**
   - `DROP TABLE` (except on `dx_` tables)
   - `DROP COLUMN`
   - `RENAME TABLE`
   - `RENAME COLUMN`
   - `ALTER TABLE ... ALTER COLUMN` (changing type/nullability)
   - `DELETE FROM` (on business tables)
   - `TRUNCATE TABLE`

3. **Fail the build** if any forbidden operation is found
4. **Pass the build** if only additive operations are found

### Implementation

When migrations are added in subsequent parts, the CI check will:

1. Parse migration SQL files
2. Apply regex patterns to detect forbidden operations
3. Report violations with file name and line number
4. Block the build until violations are fixed

**Current Status:** CI check not yet implemented (no migrations exist). Will be implemented in Part 03.

---

## COMPATIBILITY GATE

### Before Each Release

Before accepting any release, verify:

1. ✅ Every existing screen opens and behaves as before
2. ✅ Every existing API returns its previous response shape
3. ✅ Existing records are readable and editable
4. ✅ `information_schema` diff shows only additive `dx_`/`vw_dx_` objects
5. ✅ Existing reports return identical figures
6. ✅ Existing permissions still grant and deny exactly as before
7. ✅ No duplicate service or business logic introduced
8. ✅ No dummy, sample, or placeholder data remains

### Current Status

**Status:** PASS (fresh workspace — no existing functionality to break)

All checks pass vacuously because there is no existing functionality.

---

## NEXT STEPS

### Part 03: Design System — SAP Horizon Aligned Tokens

Part 03 will:
1. Define design tokens (colors, spacing, typography, shadows)
2. Create theme engine (light/dark mode)
3. Build component library foundation
4. Establish accessibility standards

**Database Impact:** None — Part 03 is purely front-end.

### Part 04: Reference Architecture & Enterprise ERP Pattern Adoption

Part 04 will:
1. Define repository pattern
2. Establish service layer architecture
3. Create DTO/Entity mapping
4. Define error handling strategy

**Database Impact:** None — Part 04 is architectural, not structural.

### Part 06: User, Role, Responsibility & Permission Model

Part 06 will create the first database tables:
- `dx_user`
- `dx_role`
- `dx_permission`
- `dx_user_role`
- `dx_role_permission`

**Database Impact:** First tables created. Must follow additive-only policy.

---

## ROLLBACK PROCEDURES

### If Part 02 Needs to Be Rolled Back

**Impact:** None — Part 02 creates no database objects.

**Procedure:**
1. Remove Part 02 code files:
   - `src/config/schema-map.ts`
   - `src/services/SchemaValidator.ts`
   - `src/services/AuditFoundation.ts`
   - `src/components/SchemaInspectionView.tsx`
2. Revert `SYSTEM_MAP.md` to Part 01 state
3. Revert `DB_CHANGELOG.md` to Part 01 state
4. Revert `API_REGISTRY.md` to Part 01 state
5. Rebuild application

**Data Loss:** None — no data was created or modified.

---

## SIGN-OFF

**Part 02 completed and reviewed:**

- [x] SYSTEM_MAP.md lists every business object (all NOT PRESENT)
- [x] Gap report written and reviewed
- [x] No table name invented or assumed
- [x] Additive-only policy documented
- [x] Migration discipline documented
- [x] Schema map created (all null mappings)
- [x] Boot-time validation implemented
- [x] Audit foundation service created
- [x] Schema inspection UI created
- [x] No existing functionality broken (none existed)
- [x] DB_CHANGELOG.md initialized with preservation policy
- [x] API_REGISTRY.md initialized

**Ready for Part 03.**
