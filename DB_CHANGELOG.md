# DB_CHANGELOG.md — Part 01 Update

## Part 01: No Database Changes

Part 01 is a front-end workspace foundation. It creates no database tables,
no migrations, no schema changes.

### Why

Per the build order:
- Part 02 (Existing System Inspection) runs next and establishes the database baseline
- Part 04 (Reference Architecture) defines the data layer pattern
- Part 05 (API Contract) defines the data access contract
- Part 06 (User/Role/Permission) creates the first database structures

Part 01 defines the **type contracts** in TypeScript that will map to database
structures in later parts. These are documented here for traceability.

### Type-to-Table Mapping (Future Parts)

| TypeScript Type | Future Table | Owner Part |
|---|---|---|
| `TileDefinition` | `dx_workspace_tile` | Part 20 |
| `KPIDefinition` | `dx_kpi_definition` | Part 14 |
| `KPIValue` | `dx_kpi_value` | Part 15 |
| `WorklistDefinition` | `dx_worklist_definition` | Part 20 |
| `WorklistItem` | Derived from workflow engine | Part 10 |
| `QuickAction` | `dx_workspace_quick_action` | Part 20 |
| `DashboardLayout` | `dx_dashboard_layout` | Part 20 |
| `Notification` | `dx_notification` | Part 25 |
| `DomainEvent` | `dx_event_outbox` | Part 13 |
| `EventSubscription` | `dx_event_subscription` | Part 13 |
| `UserIdentity` | `dx_user` | Part 06 |
| `PermissionSet` | `dx_permission` / `dx_role_permission` | Part 06/08 |
| `Project` | `dx_project` | Part 27 |
| `Site` | `dx_site` | Part 27 |

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

### Rollback

Not applicable — Part 01 makes no database changes.
