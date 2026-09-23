# DB_CHANGELOG.md — Part 01 (Complete)

## Part 01: No Database Changes Made

Part 01 is a front-end workspace foundation. It creates no database tables,
no migrations, no schema changes. All structures are defined as TypeScript
types that will map to database tables in later parts.

### Planned Database Structures (Future Parts)

The following structures are defined in `src/types/contracts.ts` and will be
implemented as database tables in the parts that own them:

| TypeScript Type | Future Table | Owner Part | Justification |
|---|---|---|---|
| `WorkspaceDefinition` | `dx_workspace_definition` | Part 20 | Named workspace layout assignable to role/responsibility/user. No existing structure holds workspace composition. |
| `TileContract` | `dx_widget_registry` | Part 20 | Catalogue of registered tiles with owning module, KPI code, permission key, refresh events, drill-down target, device tiers. Enables boot-time validation. |
| `KPIGovernance` | `dx_kpi_definition` | Part 14 | KPI registry with 10 mandatory governance fields. Existing reports embed formulas in SQL/code; no structure expresses permission scope, threshold, status logic and drill target together. |
| `UserWorkspacePreference` | `dx_user_workspace_preference` | Part 20 | Per-user widget order, hidden widgets, sizes, saved filters, default project. **Overlap test:** if existing user-preference table exists, extend it instead. |
| `SavedView` | `dx_saved_view` | Part 18 | Named, shareable filter and column sets. **Overlap test:** extend existing saved-view table if found. |
| `DrillPath` | `dx_drill_path` / `dx_drill_level` | Part 22 | Declared chain of drill levels with permission filter at each level. |

### Database Conventions (Established for Later Parts)

- New tables: `dx_<domain>_<noun>` (singular)
- Views: `vw_dx_<name>`
- Money: `NUMERIC(18,2)` — never floating point
- Quantities: carry UoM — arithmetic across units throws
- Business dates: `DATE` (no timezone)
- Event times: `TIMESTAMPTZ` (UTC)
- `0` and `NULL` are never interchangeable
- No boolean flags for multi-state concepts — use state machine
- Every table has: `id`, `created_at`, `updated_at`, `created_by`
- Every new table documented with purpose, relationship, lifecycle
- Every migration: single-purpose, reversible, idempotent, backward-compatible

### Overlap Test Results

| Structure | Existing Table Found? | Decision |
|---|---|---|
| `dx_user_workspace_preference` | No (fresh workspace) | Will create in Part 20 |
| `dx_saved_view` | No (fresh workspace) | Will create in Part 18 |

### Rollback

Not applicable — Part 01 makes no database changes.

### Compatibility Gate

After Part 01 deployment:
- [x] Application starts successfully
- [x] Login works
- [x] Dashboard renders
- [x] No existing functionality broken (nothing existed to break)
- [x] All TypeScript types compile
- [x] Boot validator runs and validates registrations
- [x] Workspace resolver returns correct results

### Next Steps (Part 02)

Part 02 will perform the full system inspection:
- Schema, tables, fields, relationships, indexes, constraints
- APIs, services, routes, screens, workflows
- Calculations, reports, permissions, dashboards
- Integrations and background processes

Part 02 findings will be recorded in `SYSTEM_MAP.md` and will inform
whether the planned structures in this changelog need adjustment.
