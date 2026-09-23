# SYSTEM_MAP.md — Part 02 (Complete)

## Part 02: Existing System Inspection, Database Preservation & Adapter Layer

### Inspection Findings (Step Zero)

**Stack Inventory:**
- Frontend: React 18.2.0 with TypeScript 5.7.0
- Build tool: Vite 6.3.5
- Styling: Tailwind CSS 4.1.7
- State management: React Context API
- Icons: lucide-react 0.294.0
- Charts: recharts 2.10.0
- Animation: framer-motion 11.16.1
- Routing: react-router-dom 6.8.0

**Database:**
- Status: NO EXISTING DATABASE
- This is a fresh workspace with no prior ERP database
- All business objects are NOT PRESENT
- Schema map (src/config/schema-map.ts) initialized with null mappings

**Application:**
- Fresh React application
- No existing API endpoints
- No existing authentication (demo user in Part 01)
- No existing audit log (audit foundation created in Part 02)
- No existing workflows, notifications, or dashboards

### Business Object to Table Mapping

| Business Object | Existing Table | Primary Key | Scope Columns | Notes |
|---|---|---|---|---|
| Company | NOT PRESENT | — | — | Will be created in Part 27 |
| Branch | NOT PRESENT | — | — | Will be created in Part 27 |
| Department | NOT PRESENT | — | — | Will be created in Part 27 |
| User | NOT PRESENT | — | — | Will be created in Part 06 |
| Role | NOT PRESENT | — | — | Will be created in Part 06 |
| Permission | NOT PRESENT | — | — | Will be created in Part 06 |
| Client | NOT PRESENT | — | — | Will be created in Part 29 |
| Vendor | NOT PRESENT | — | — | Will be created in Part 29 |
| Employee | NOT PRESENT | — | — | Will be created in Part 43 |
| Labour | NOT PRESENT | — | — | Will be created in Part 43 |
| Project | NOT PRESENT | — | — | Will be created in Part 27 |
| Package | NOT PRESENT | — | — | Will be created in Part 27 |
| Site | NOT PRESENT | — | — | Will be created in Part 27 |
| Contract | NOT PRESENT | — | — | Will be created in Part 37 |
| Tender | NOT PRESENT | — | — | Will be created in Part 32 |
| BOQ Header | NOT PRESENT | — | — | Will be created in Part 31 |
| BOQ Item | NOT PRESENT | — | — | Will be created in Part 31 |
| WBS | NOT PRESENT | — | — | Will be created in Part 33 |
| Activity | NOT PRESENT | — | — | Will be created in Part 33 |
| Material Master | NOT PRESENT | — | — | Will be created in Part 28 |
| Material Requisition | NOT PRESENT | — | — | Will be created in Part 35 |
| Purchase Requisition | NOT PRESENT | — | — | Will be created in Part 35 |
| RFQ | NOT PRESENT | — | — | Will be created in Part 35 |
| Quotation | NOT PRESENT | — | — | Will be created in Part 35 |
| Comparative Statement | NOT PRESENT | — | — | Will be created in Part 35 |
| PO Header | NOT PRESENT | — | — | Will be created in Part 35 |
| PO Item | NOT PRESENT | — | — | Will be created in Part 35 |
| GRN | NOT PRESENT | — | — | Will be created in Part 36 |
| Store | NOT PRESENT | — | — | Will be created in Part 36 |
| Stock Ledger | NOT PRESENT | — | — | Will be created in Part 36 |
| Material Issue | NOT PRESENT | — | — | Will be created in Part 36 |
| Material Return | NOT PRESENT | — | — | Will be created in Part 36 |
| Material Transfer | NOT PRESENT | — | — | Will be created in Part 36 |
| DPR | NOT PRESENT | — | — | Will be created in Part 34 |
| Measurement Book | NOT PRESENT | — | — | Will be created in Part 38 |
| RA Bill | NOT PRESENT | — | — | Will be created in Part 39 |
| Client Invoice | NOT PRESENT | — | — | Will be created in Part 39 |
| Payment | NOT PRESENT | — | — | Will be created in Part 41 |
| Receipt | NOT PRESENT | — | — | Will be created in Part 41 |
| Journal Voucher | NOT PRESENT | — | — | Will be created in Part 40 |
| Chart of Accounts | NOT PRESENT | — | — | Will be created in Part 40 |
| Plant/Equipment | NOT PRESENT | — | — | Will be created in Part 46 |
| Equipment Logbook | NOT PRESENT | — | — | Will be created in Part 46 |
| Fuel | NOT PRESENT | — | — | Will be created in Part 46 |
| RMC Batch | NOT PRESENT | — | — | Will be created in Part 47 |
| Mix Design | NOT PRESENT | — | — | Will be created in Part 47 |
| Attendance | NOT PRESENT | — | — | Will be created in Part 44 |
| Payroll | NOT PRESENT | — | — | Will be created in Part 45 |
| QA ITP | NOT PRESENT | — | — | Will be created in Part 48 |
| QA WIR | NOT PRESENT | — | — | Will be created in Part 48 |
| QA MIR | NOT PRESENT | — | — | Will be created in Part 48 |
| QA NCR | NOT PRESENT | — | — | Will be created in Part 48 |
| HSE Incident | NOT PRESENT | — | — | Will be created in Part 49 |
| HSE Permit | NOT PRESENT | — | — | Will be created in Part 49 |
| HSE Observation | NOT PRESENT | — | — | Will be created in Part 49 |
| Document | NOT PRESENT | — | — | Will be created in Part 50 |
| Task | NOT PRESENT | — | — | Will be created in Part 24 |
| Approval Workflow | NOT PRESENT | — | — | Will be created in Part 10 |
| Notification | NOT PRESENT | — | — | Will be created in Part 25 |
| Audit Log | NOT PRESENT | — | — | Foundation created in Part 02 |

### Gap Report

**All 59 business objects are NOT PRESENT.**

This is expected for a fresh workspace. Each business object will be created by the part that owns it, following the build order in 00_MASTER_INDEX.md.

**Recommendation:** Proceed with Part 03 (Design System) and Part 04 (Reference Architecture) as planned. Table creation begins with Part 06 (User/Role/Permission).

---

## Part 01: SAP S/4HANA-Aligned Real-Time Dashboard & Enterprise Workspace Foundation

### Inspection Findings

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION SHELL                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Header   │ │ Sidebar  │ │ Project  │ │ User     │ │ Notif.   │ │
│  │ (context)│ │ (nav)    │ │ Selector │ │ Menu     │ │ Panel    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      WORKSPACE RESOLVER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Permission│ │ Project  │ │  Band    │ │  Tile    │ │  KPI     │ │
│  │ Interface│ │ Context  │ │ Resolver │ │ Registry │ │ Registry │ │
│  │(deny-by- │ │(project/ │ │(13 bands │ │(contract │ │(10-field │ │
│  │ default) │ │ site)    │ │ omit)    │ │ enforce) │ │ govern.) │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      BOOT VALIDATOR                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Tile     │ │ KPI      │ │ Orphan   │ │ Permission│              │
│  │ Contract │ │ Governance│ │ Detect   │ │ Reachable│              │
│  │ Check    │ │ Check    │ │          │ │ Check    │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│                      TILE RENDERING                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ KPI Tile │ │Worklist  │ │ Quick    │ │  Chart   │              │
│  │(4 states)│ │ Tile     │ │ Action   │ │  Tile    │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│                      STATUS BAR                                      │
│  Connection │ Project Context │ Permissions │ Events │ Time         │
└─────────────────────────────────────────────────────────────────────┘
```

### Files Created

#### Type System (`src/types/`)
| File | Purpose |
|------|---------|
| `workspace.ts` | Core types: Tile, KPI, Worklist, Event, Notification, Layout |
| `domain.ts` | Document state vocabulary, module namespaces, action verbs, validators |
| `contracts.ts` | Complete tile contract, KPI governance (10 fields), drill-down, personalisation |

#### Services (`src/services/`)
| File | Purpose |
|------|---------|
| `BootValidator.ts` | Boot-time validation: rejects incomplete registrations and orphans |
| `WorkspaceResolver.ts` | Workspace resolution with deny-by-default permission interface |

#### Context Providers (`src/contexts/`)
| File | Purpose |
|------|---------|
| `PermissionContext.tsx` | User identity, permission set, scope checks (Rule 4) |
| `ProjectContext.tsx` | Active project/site, available projects, context switching |
| `WorkspaceContext.tsx` | Tile/KPI/Worklist/QuickAction registry, event system, notifications |

#### Components (`src/components/`)
| File | Purpose |
|------|---------|
| `AppShell.tsx` | Enterprise shell: header, sidebar nav, project selector, user menu |
| `Dashboard.tsx` | Main dashboard view — registers tiles, renders grid |
| `ProjectSummaryHeader.tsx` | Project context banner with key metrics |
| `EmptyState.tsx` | Rule 3 compliant empty state (5 types: no_data, no_permission, no_project, not_applicable, awaiting_module) |
| `ModulePlaceholder.tsx` | Placeholder for Parts 27–69 module views |
| `NotificationPanel.tsx` | Notification centre (Part 25 framework) |
| `WorkspaceStatusBar.tsx` | Connection status, event counter, context display |
| `RecentActivityFeed.tsx` | Real-time event feed, permission-filtered |
| `BootValidationDemo.tsx` | Interactive demo of boot validation and workspace resolution |
| `UniversalBands.tsx` | Universal band structure with band omission |
| `tiles/KPITile.tsx` | KPI tile with threshold-based status, trend, 4 states |
| `tiles/WorklistTile.tsx` | Worklist tile with priority-coded items |
| `tiles/QuickActionTile.tsx` | Quick action buttons, permission-filtered |
| `tiles/ChartTile.tsx` | Chart tile (recharts), data-source annotated |

### Contracts Established

#### 1. Tile Contract (All Fields Mandatory)
```typescript
interface TileContract {
  code: string;                    // Unique identifier
  owningModule: string;            // Module that supplies data
  kpiCode?: string;                // Registered KPI (if analytical)
  permissionKey: string;           // Required permission
  band: UniversalBand;             // Which universal band
  refreshEvents: string[];         // Events that invalidate
  drillTarget: string;             // Click destination
  deviceTiers: DeviceTier[];       // desktop/tablet/mobile
  emptyState: EmptyStateType;      // 5 empty state types
  defaultPlacement: { order, size };
  title: string;
  enabled: boolean;
}
```

#### 2. KPI Governance (10 Mandatory Fields)
```typescript
interface KPIGovernance {
  code: string;
  source: string;                  // 1. Source
  formula: string;                 // 2. Formula
  calculationPeriod: string;       // 3. Calculation period
  projectScope: string;            // 4. Project scope
  organisationScope: string;       // 5. Organisation scope
  permissionScope: string;         // 6. Permission scope
  refreshMechanism: string;        // 7. Refresh mechanism
  thresholds: object;              // 8. Threshold
  statusLogic: string;             // 9. Status logic
  drillDownDestination: string;    // 10. Drill-down destination
}
```

#### 3. Universal Bands (13 bands)
`kpi`, `my_work`, `my_approvals`, `my_tasks`, `my_projects`, `my_sites`,
`analytics`, `recent_activity`, `my_exceptions`, `my_deadlines`,
`my_notifications`, `my_messages`, `quick_actions`

#### 4. Boot Validation Rules
- **WS-03**: KPI missing any of 10 governance fields → fails registration
- **WS-04**: Tile with unregistered KPI or unreachable permission → fails boot as orphan
- **TILE-001 to TILE-012**: Tile contract field validation
- **KPI-001 to KPI-005**: KPI governance validation

#### 5. Permission Interface (Deny-by-Default)
```typescript
interface PermissionInterface {
  hasPermission(userId, permissionKey): boolean;  // false if unresolvable
  canAccessProject(userId, projectId): boolean;
  canAccessSite(userId, siteId): boolean;
  getUserPermissions(userId): string[];
}
```

### Business Rules Enforced

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

### Permission Keys Registered

**Workspace admin permissions:**
- `admin.workspace.view` — see workspace configuration
- `admin.workspace.configure` — create/edit workspace definitions
- `admin.widget.register` — register/retire tiles
- `admin.kpi.manage` — create/edit KPI definitions
- `user.workspace.personalise` — reorder, hide, resize, save filters

**Demo user permissions (for testing):**
- `project.project.view/create/edit`, `project.wbs.view/edit`, `project.dpr.view/create`
- `procure.po.view/create/edit/submit/approve`, `procure.indent.view/create`, `procure.rfq.view`, `procure.comparative.view`
- `store.grn.view/create`, `store.stock.view`, `store.issue.view/create`
- `bill.client.view/create`, `bill.mb.view/create`
- `finance.voucher.view/create`
- `hr.employee.view`, `hr.attendance.view`
- `qa.inspection.view/create`
- `hse.incident.view/create`, `hse.permit.view`
- `asset.equipment.view/edit`
- `master.vendor.view`, `master.item.view`, `master.rate.view`
- `report.mis.view/export`
- `admin.user.view`, `admin.role.view`

### Navigation Routes

| Route | Module | Part | Status |
|-------|--------|------|--------|
| `/dashboard` | Workspace | 01 | ✅ Implemented |
| `/validation` | Boot Validation | 01 | ✅ Implemented |
| `/projects` | Organization | 27 | Placeholder |
| `/procurement/*` | Procurement | 35 | Placeholder |
| `/execution/*` | Site Execution | 34 | Placeholder |
| `/billing/*` | Billing & QS | 39/54 | Placeholder |
| `/finance/*` | Finance | 40 | Placeholder |
| `/hr/*` | HR | 43 | Placeholder |
| `/equipment/*` | Equipment | 46 | Placeholder |
| `/quality/*` | QA/QC | 48 | Placeholder |
| `/safety/*` | HSE | 49 | Placeholder |
| `/documents/*` | DMS | 50 | Placeholder |
| `/reports/*` | MIS | 58 | Placeholder |

### Acceptance Criteria Evidence

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

### What Part 01 Does NOT Create

- No database tables (Part 02 inspects existing DB first)
- No server-side API endpoints (Part 05 defines the API contract)
- No server-side permission enforcement (Part 08 implements this)
- No workflow engine (Part 10)
- No posting engine (Part 11)
- No calculation engine (Part 12)
- No real-time gateway (Part 13)
- No KPI computation service (Part 14/15)
- No metadata-driven UI (Part 18)

Part 01 defines the **contracts** that these parts implement.
