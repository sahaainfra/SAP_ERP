# SYSTEM_MAP.md — Part 01 Update

## Part 01: SAP S/4HANA-Aligned Real-Time Dashboard & Enterprise Workspace Foundation

### What Was Inspected

This is a fresh workspace. No prior ERP code exists. Part 01 establishes the foundation
from which all 68 subsequent parts will build.

### What Part 01 Creates

#### 1. Type System & Contracts (`src/types/`)

| File | Purpose |
|------|---------|
| `workspace.ts` | Tile, KPI, Worklist, QuickAction, Event, Notification, Dashboard Layout contracts |
| `domain.ts` | Document state vocabulary, module namespaces, action verbs, validators |

#### 2. Context Providers (`src/contexts/`)

| File | Purpose |
|------|---------|
| `PermissionContext.tsx` | User identity, permission set, scope checks (Rule 4) |
| `ProjectContext.tsx` | Active project/site, available projects, context switching |
| `WorkspaceContext.tsx` | Tile/KPI/Worklist/QuickAction registry, event system, notifications |

#### 3. UI Components (`src/components/`)

| File | Purpose |
|------|---------|
| `AppShell.tsx` | Enterprise shell: header, sidebar nav, project selector, user menu |
| `Dashboard.tsx` | Main dashboard view — registers tiles, renders grid |
| `ProjectSummaryHeader.tsx` | Project context banner with key metrics |
| `EmptyState.tsx` | Rule 3 compliant empty state (no fabricated data) |
| `ModulePlaceholder.tsx` | Placeholder for Parts 27–69 module views |
| `NotificationPanel.tsx` | Notification centre (Part 25 framework) |
| `WorkspaceStatusBar.tsx` | Connection status, event counter, context display |
| `tiles/KPITile.tsx` | KPI tile with threshold-based status, trend indicators |
| `tiles/WorklistTile.tsx` | Worklist tile with priority-coded items |
| `tiles/QuickActionTile.tsx` | Quick action buttons, permission-filtered |
| `tiles/ChartTile.tsx` | Chart tile (recharts), data-source annotated |

### Contracts Established for Later Parts

#### Tile Registration Contract
```typescript
registerTile(tile: TileDefinition): void
```
Every module from Part 27+ calls this to add workspace tiles.

#### KPI Registration Contract
```typescript
registerKPI(kpi: KPIDefinition): void
updateKPIValue(kpiId: string, value: KPIValue): void
```
KPIs declare: source, formula, format, thresholds, comparison period,
calculation period, refresh mechanism, permission key, drill target.

#### Worklist Registration Contract
```typescript
registerWorklist(worklist: WorklistDefinition): void
updateWorklistItems(worklistId: string, items: WorklistItem[]): void
```

#### Quick Action Registration Contract
```typescript
registerQuickAction(action: QuickAction): void
```

#### Event Subscription Contract
```typescript
subscribe(subscription: EventSubscription): () => void
publishEvent(event: DomainEvent): void
```

### Permission Keys Registered (Demo)

The demo user has permissions across these modules:
- `project.*` — project.view, project.create, project.edit, wbs.view, wbs.edit, dpr.view, dpr.create
- `procure.*` — po.view, po.create, po.edit, po.submit, po.approve, indent.view, indent.create, rfq.view, comparative.view
- `store.*` — grn.view, grn.create, stock.view, issue.view, issue.create
- `bill.*` — client.view, client.create, mb.view, mb.create
- `finance.*` — voucher.view, voucher.create
- `hr.*` — employee.view, attendance.view
- `qa.*` — inspection.view, inspection.create
- `hse.*` — incident.view, incident.create, permit.view
- `asset.*` — equipment.view, equipment.edit
- `master.*` — vendor.view, item.view, rate.view
- `report.*` — mis.view, mis.export
- `admin.*` — user.view, role.view

### Navigation Routes Registered

| Route | Module | Part |
|-------|--------|------|
| `/dashboard` | Workspace | 01 |
| `/projects` | Organization | 27 |
| `/procurement/*` | Procurement | 35 |
| `/execution/*` | Site Execution | 34 |
| `/billing/*` | Billing & QS | 39, 54 |
| `/finance/*` | Finance | 40 |
| `/hr/*` | HR | 43 |
| `/equipment/*` | Equipment | 46 |
| `/quality/*` | QA/QC | 48 |
| `/safety/*` | HSE | 49 |
| `/documents/*` | DMS | 50 |
| `/reports/*` | MIS | 58 |

### Document States Declared

19 states in the canonical vocabulary:
DRAFT · SUBMITTED · PENDING_APPROVAL · PARTIALLY_APPROVED · APPROVED · REJECTED · RETURNED ·
RELEASED · IN_PROGRESS · PARTIALLY_EXECUTED · EXECUTED · CERTIFIED · POSTED ·
PARTIALLY_PAID · PAID · CLOSED · CANCELLED · SUPERSEDED · ON_HOLD

Terminal states (immutable): CERTIFIED, POSTED, PAID, CLOSED, CANCELLED, SUPERSEDED

### Module Namespaces Registered

35 namespaces: admin, asset, audit, bd, bill, chat, config, dms, finance, hr, hse,
integration, knowledge, legal, lifecycle, master, mb, numbering, permission, plan, plant,
portal, procure, project, qa, qs, report, rmc, sc, statutory, store, tax, training, user,
welfare, workflow

### What Part 01 Does NOT Create

- No database tables (Part 02 inspects existing DB first)
- No API endpoints (Part 05 defines the API contract)
- No server-side permission enforcement (Part 08 implements this)
- No workflow engine (Part 10)
- No posting engine (Part 11)
- No calculation engine (Part 12)
- No real-time gateway (Part 13)
- No KPI service (Part 15)
- No metadata-driven UI (Part 18)

Part 01 defines the **contracts** that these parts implement. The workspace is ready
to receive their registrations.

### Regression Checks

- [x] Application builds without errors
- [x] All tile types render correctly
- [x] Permission filtering hides unauthorised tiles
- [x] Project context switching works
- [x] Empty states render where no data exists
- [x] Status is never conveyed by colour alone (labels present)
- [x] Responsive at mobile (375px), tablet (768px), desktop (1440px)
- [x] No fabricated transaction data — demo values are clearly structural
- [x] Navigation routes are defined for all planned modules
- [x] Event subscription framework is operational
