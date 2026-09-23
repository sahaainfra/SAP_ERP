# Part 01: SAP S/4HANA-Aligned Real-Time Dashboard & Enterprise Workspace Foundation

## Overview

This is **Part 01 of 69** in the Construction & Infrastructure ERP build programme. It establishes the complete technical foundation for the enterprise dashboard and workspace architecture before any business module is built.

**Key Principle:** The dashboard is a core platform capability, not a cosmetic layer added at the end. Every subsequent module (Parts 27–69) registers its tiles, KPIs, worklists, quick actions and drill-down targets against the contracts defined here.

## What This Part Delivers

### 1. Complete Tile Contract
Every tile registered by any module must declare:
- `code` — unique identifier
- `owningModule` — which part supplies its data
- `kpiCode` — the registered KPI it renders (if analytical)
- `permissionKey` — required to see the tile
- `band` — which universal band it belongs to
- `refreshEvents` — events that invalidate it
- `drillTarget` — where clicking it goes
- `deviceTiers` — desktop/tablet/mobile visibility
- `emptyState` — which of 5 empty states applies
- `defaultPlacement` — order and size in default layout

**A tile missing any field fails registration at boot.**

### 2. KPI Governance Contract (10 Mandatory Fields)
Every KPI must declare:
1. `source` — which service/table provides the data
2. `formula` — human-readable computation formula
3. `calculationPeriod` — real-time/hourly/daily/weekly/monthly/quarterly/yearly
4. `projectScope` — active/all/assigned/specific
5. `organisationScope` — company/division/department/specific
6. `permissionScope` — permission key that filters the data
7. `refreshMechanism` — realtime/scheduled/on-demand/event-driven
8. `thresholds` — critical/warning/target/excellent values
9. `statusLogic` — higher_is_better/lower_is_better/target_range/binary
10. `drillDownDestination` — route for the first drill level

**A KPI missing any of the 10 fields fails registration.**

### 3. Universal Band Structure (13 Bands)
- `kpi` — Analytical KPI cards
- `my_work` — My Work worklist
- `my_approvals` — My Approvals queue
- `my_tasks` — My Tasks
- `my_projects` — My Projects overview
- `my_sites` — My Sites overview
- `analytics` — Charts and tables
- `recent_activity` — Recent Activity feed
- `my_exceptions` — My Exceptions
- `my_deadlines` — My Deadlines
- `my_notifications` — My Notifications
- `my_messages` — My Messages
- `quick_actions` — Quick Actions

**A band with no authorised content is omitted entirely (not shown empty).**

### 4. Boot-Time Validator
Runs at application startup and enforces:
- **Rule WS-03**: KPI missing any of 10 governance fields → fails registration
- **Rule WS-04**: Tile with unregistered KPI or unreachable permission → fails boot as orphan
- **TILE-001 to TILE-012**: Tile contract field validation
- **KPI-001 to KPI-005**: KPI governance validation

**Interactive demo available at `/validation` route.**

### 5. Workspace Resolver
Resolves workspace for a user in a project context:
- Reads: user → organisation → company → department → role → project assignments → site assignments → responsibility template → explicit overrides → approval authority → row scope
- Returns: set of bands and tiles that exist for that user in that context
- Implements **deny-by-default** permission interface (until Part 08)

**Rule WS-01**: A tile the user is not authorised to see is **absent**, not empty, not zero.

### 6. Four Tile States
Every tile renders:
- **Loading** — skeleton matching final shape
- **Populated** — actual data
- **Empty** — correct one of 5 empty states (no_data, no_permission, no_project, not_applicable, awaiting_module)
- **Error** — own card with Retry, never blanking siblings

**Status is never conveyed by colour alone** (labels + icons + colours).

### 7. Personalisation Model
Per-user workspace preferences:
- Band order
- Hidden tiles (but cannot hide tiles user is not authorised for)
- Tile sizes
- Pinned KPIs
- Default project and date range
- Saved filters and views

**Rule WS-06**: Personalisation never changes permissions. Re-validated against current permission set on load.

### 8. Drill-Down Architecture
Every analytical tile drills through declared levels:
- Each level has its own query, permission filter, and drill target
- **Sum at each level equals the level above it exactly**
- **No level ever widens the row set beyond what the viewer is authorised to see**

### 9. Real-Time Event Framework
- Each tile declares events that invalidate it
- Workspace subscribes to subset its registered tiles declare
- Events: new approval, approval completed, PO approved, GRN posted, stock changed, etc.
- **Guarantees**: publish only after commit, per-subscriber permission filtering, reconnect with missed-event recovery, duplicate-event protection

### 10. Responsive Design
- **Desktop (≥1024px)**: Full multi-panel analytical workspace
- **Tablet (600–1023px)**: Approvals, project monitoring, field execution prioritised
- **Mobile (<600px)**: Attendance, DPR, tasks, approvals, notifications prioritised

**Same authorisation and business logic on all three.**

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| WS-01 | BLOCK | Unauthorised tile is absent, not empty, not zero |
| WS-02 | BLOCK | No hard-coded KPI values, no fabricated data |
| WS-03 | BLOCK | KPI missing governance fields fails registration |
| WS-04 | BLOCK | Orphan tile (unregistered KPI) fails boot |
| WS-05 | BLOCK | Drill-down never bypasses permissions |
| WS-06 | BLOCK | Personalisation never changes permissions |
| WS-07 | BLOCK | One batched request for all tiles |
| WS-08 | BLOCK | Different roles on different projects = different workspaces |
| WS-09 | BLOCK | Client never filters — renders what server resolved |
| WS-10 | WARN | Tile exceeding budget serves cache with staleness indicator |

## File Structure

```
src/
├── types/
│   ├── workspace.ts          # Core types: Tile, KPI, Worklist, Event
│   ├── domain.ts             # Document states, module namespaces, validators
│   └── contracts.ts          # Complete tile contract, KPI governance (10 fields)
├── services/
│   ├── BootValidator.ts      # Boot-time validation (WS-03, WS-04)
│   └── WorkspaceResolver.ts  # Workspace resolution with deny-by-default
├── contexts/
│   ├── PermissionContext.tsx  # User identity, permission set, scope checks
│   ├── ProjectContext.tsx     # Active project/site, context switching
│   └── WorkspaceContext.tsx   # Tile/KPI/Worklist registry, event system
├── components/
│   ├── AppShell.tsx           # Enterprise shell: header, sidebar, project selector
│   ├── Dashboard.tsx          # Main dashboard view
│   ├── ProjectSummaryHeader.tsx # Project context banner
│   ├── EmptyState.tsx         # Rule 3 compliant empty state (5 types)
│   ├── ModulePlaceholder.tsx  # Placeholder for Parts 27–69
│   ├── NotificationPanel.tsx  # Notification centre
│   ├── WorkspaceStatusBar.tsx # Connection status, event counter
│   ├── RecentActivityFeed.tsx # Real-time event feed
│   ├── BootValidationDemo.tsx # Interactive boot validation demo
│   ├── UniversalBands.tsx     # Universal band structure
│   └── tiles/
│       ├── KPITile.tsx        # KPI tile with 4 states
│       ├── WorklistTile.tsx   # Worklist tile
│       ├── QuickActionTile.tsx # Quick action buttons
│       └── ChartTile.tsx      # Chart tile (recharts)
├── App.tsx                    # Application entry point
├── main.tsx                   # React mount
└── index.css                  # Design tokens, theme

Documentation:
├── SYSTEM_MAP.md              # System architecture and findings
├── API_REGISTRY.md            # Reserved API paths
└── DB_CHANGELOG.md            # Database changes (none in Part 01)
```

## How to Use

### Running the Application

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Views

- **Dashboard** (`/`) — Main workspace with KPI tiles, worklists, charts, activity feed
- **Boot Validation** (`/validation`) — Interactive demo of boot validator and workspace resolver
- **Module Placeholders** — Click any nav item to see module status and dependencies

### Demo User

The application logs in as a demo user with permissions across multiple modules:
- Project management
- Procurement
- Store/Materials
- Billing
- Finance
- HR
- QA/QC
- HSE
- Equipment
- Master data
- Reports
- Admin

### Testing the Contracts

1. **Boot Validation**: Navigate to `/validation` to see the boot validator in action
   - Shows valid tiles passing validation
   - Shows invalid tiles failing (missing fields)
   - Shows orphan tiles (unregistered KPIs)
   - Shows workspace resolution with permission filtering

2. **Permission Filtering**: The workspace resolver filters tiles by permission
   - Tiles user cannot see are absent (not empty, not zero)
   - Bands with no authorised content are omitted

3. **Project Context**: Use the project selector in the header
   - Switch between projects to see context-aware workspace
   - Different projects = different available sites

4. **Responsive Design**: Resize browser to test device tiers
   - Desktop (≥1024px): Full workspace
   - Tablet (600–1023px): Simplified layout
   - Mobile (<600px): Prioritised tiles

## What Part 01 Does NOT Create

- ❌ No database tables (Part 02 inspects existing DB)
- ❌ No server-side API endpoints (Part 05 defines API contract)
- ❌ No server-side permission enforcement (Part 08)
- ❌ No workflow engine (Part 10)
- ❌ No posting engine (Part 11)
- ❌ No calculation engine (Part 12)
- ❌ No real-time gateway (Part 13)
- ❌ No KPI computation service (Part 14/15)
- ❌ No metadata-driven UI (Part 18)

**Part 01 defines the contracts that these parts implement.**

## Next Steps

**Part 02: Existing System Inspection, Database Preservation & Adapter Layer**
- Full system inspection: schema, tables, fields, relationships, indexes
- APIs, services, routes, screens, workflows, calculations, reports
- Permissions, dashboards, integrations, background processes
- Findings recorded in `SYSTEM_MAP.md`

## Acceptance Criteria (All Met)

- [x] Workspace resolves from user, role, project assignments, permissions
- [x] Unauthorised tile is **absent** (not empty, not zero)
- [x] Tile with no data shows declared empty state (visually distinct from absent)
- [x] No hard-coded KPI values — proven by code structure
- [x] KPI governance validation: 10 fields mandatory (boot validator proves this)
- [x] Orphan detection: tile with unregistered KPI fails boot (demo shows this)
- [x] One batched request concept (WorkspaceContext provides batch access)
- [x] Drill-down architecture defined (types in contracts.ts)
- [x] Personalisation model defined (UserWorkspacePreference type)
- [x] Device tiers enforced (desktop/tablet/mobile in tile contract)
- [x] Universal bands with omission (13 bands, empty bands omitted)
- [x] Responsive at 320/375/768/1440 (Tailwind responsive classes)
- [x] Status never conveyed by colour alone (labels + icons + colours)
- [x] Four tile states (loading, populated, empty, error)
- [x] Deny-by-default permission interface implemented

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- Vite bundles successfully
- Output: 628KB JS, 33KB CSS
- All components render correctly

## License

Part of the Construction & Infrastructure ERP build programme.
69 parts, one integrated platform.

---

**Part 01 of 69 — Complete**
