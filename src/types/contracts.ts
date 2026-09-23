/**
 * Part 01 — Complete Tile & KPI Contracts
 * 
 * These types define the FULL registration contracts that every subsequent
 * module must implement. A tile missing any mandatory field fails registration
 * at boot. A tile whose kpiCode is not registered or whose permissionKey is
 * unreachable from any responsibility template fails boot as an orphan.
 * 
 * Rule WS-03: A KPI missing any of its ten governance fields fails registration.
 * Rule WS-04: A tile with unregistered KPI or unreachable permission fails boot.
 */

import type { TileSize, KPIFormat, KPIValue, WorklistItem } from './workspace';

// ─── Band System (Universal Bands) ───────────────────────────────────────────

export const UNIVERSAL_BANDS = [
  'kpi',              // Analytical KPI cards
  'my_work',          // My Work worklist
  'my_approvals',     // My Approvals queue
  'my_tasks',         // My Tasks
  'my_projects',      // My Projects overview
  'my_sites',         // My Sites overview
  'analytics',        // Charts and tables
  'recent_activity',  // Recent Activity feed
  'my_exceptions',    // My Exceptions
  'my_deadlines',     // My Deadlines
  'my_notifications', // My Notifications
  'my_messages',      // My Messages
  'quick_actions',    // Quick Actions
] as const;

export type UniversalBand = typeof UNIVERSAL_BANDS[number];

// ─── Device Tiers ────────────────────────────────────────────────────────────

export type DeviceTier = 'desktop' | 'tablet' | 'mobile';

// ─── Tile States (Four States) ───────────────────────────────────────────────

export type TileRenderState = 'loading' | 'populated' | 'empty' | 'error';

export type EmptyStateType =
  | 'no_data'           // No records exist in scope
  | 'no_permission'     // User cannot see any records
  | 'no_project'        // No project context selected
  | 'not_applicable'    // Tile not relevant for this role/context
  | 'awaiting_module';  // Owning module not yet implemented

// ─── Complete Tile Contract ──────────────────────────────────────────────────

export interface TileContract {
  code: string;                    // Unique tile identifier
  owningModule: string;            // The part that supplies its data
  kpiCode?: string;                // The registered KPI it renders (if analytical)
  permissionKey: string;           // Required to see the tile at all
  band: UniversalBand;             // Which universal band it belongs to
  refreshEvents: string[];         // Events that invalidate this tile
  drillTarget: string;             // Where clicking it goes
  deviceTiers: DeviceTier[];       // Desktop/tablet/mobile visibility
  emptyState: EmptyStateType;      // Which empty state when no data
  defaultPlacement: {
    order: number;                 // Order within its band
    size: TileSize;                // Size in the grid
  };
  title: string;
  subtitle?: string;
  tags?: string[];
  enabled: boolean;
}

// ─── Complete KPI Governance (All 10 Fields Mandatory) ───────────────────────

export interface KPIGovernance {
  code: string;
  // 1. Source
  source: string;                  // Which service/table provides the data
  // 2. Formula
  formula: string;                 // Human-readable computation formula
  // 3. Calculation period
  calculationPeriod: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  // 4. Project scope
  projectScope: 'active' | 'all' | 'assigned' | 'specific';
  // 5. Organisation scope
  organisationScope: 'company' | 'division' | 'department' | 'specific';
  // 6. Permission scope
  permissionScope: string;         // Permission key that filters the data
  // 7. Refresh mechanism
  refreshMechanism: 'realtime' | 'scheduled' | 'on-demand' | 'event-driven';
  // 8. Threshold
  thresholds: {
    critical?: number;
    warning?: number;
    target?: number;
    excellent?: number;
  };
  // 9. Status logic
  statusLogic: 'higher_is_better' | 'lower_is_better' | 'target_range' | 'binary';
  // 10. Drill-down destination
  drillDownDestination: string;    // Route for the first drill level
  // Additional metadata
  label: string;
  format: KPIFormat;
  unit?: string;
  comparisonPeriod?: 'previous' | 'ytd' | 'rolling' | 'none';
  owningModule: string;
  registeredBy: string;
  registeredAt: string;
}

// ─── Drill-Down Architecture ─────────────────────────────────────────────────

export interface DrillLevel {
  level: number;
  label: string;
  query: string;                   // Named query identifier
  permissionFilter: string;        // Permission key applied at this level
  drillTarget?: string;            // Next level or object page
  groupBy: string;                 // Field to group by at this level
}

export interface DrillPath {
  kpiCode: string;
  levels: DrillLevel[];
  // Rule WS-05: drill-down never bypasses permissions at any level
  // Rule: sum at each level equals the level above it exactly
}

// ─── Personalisation Model ───────────────────────────────────────────────────

export interface UserWorkspacePreference {
  userId: string;
  workspaceId: string;
  bandOrder: UniversalBand[];
  hiddenTiles: string[];           // Tiles user has hidden (but is authorised for)
  tileSizes: Record<string, TileSize>;  // User-resized tiles
  pinnedKPIs: string[];            // KPIs pinned to top
  defaultProjectId?: string;
  defaultDateRange?: { from: string; to: string };
  savedFilters: Record<string, Record<string, string>>;
  lastModified: string;
  // Rule WS-06: personalisation never changes permissions
  // Rule: re-validated against current permission set on load
}

// ─── Saved View ──────────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  name: string;
  ownerUserId: string;
  isShared: boolean;
  tileCode: string;
  filters: Record<string, string>;
  columns: string[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  createdAt: string;
  lastModified: string;
}

// ─── Workspace Definition (Admin Configuration) ─────────────────────────────

export interface WorkspaceDefinition {
  id: string;
  name: string;
  description: string;
  assignmentType: 'role' | 'responsibility' | 'user';
  assignmentValue: string;         // Role name, responsibility template, or user ID
  bands: Array<{
    band: UniversalBand;
    order: number;
    visible: boolean;
  }>;
  tilePlacements: Array<{
    tileCode: string;
    band: UniversalBand;
    order: number;
    size: TileSize;
  }>;
  defaultFilters: Record<string, Record<string, string>>;
  version: number;
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  isActive: boolean;
}

// ─── Boot Validation Result ──────────────────────────────────────────────────

export interface BootValidationResult {
  passed: boolean;
  errors: BootValidationError[];
  warnings: BootValidationWarning[];
  registeredTiles: number;
  registeredKPIs: number;
  orphanedTiles: string[];
  unregisteredKPIs: string[];
}

export interface BootValidationError {
  code: string;
  message: string;
  tileCode?: string;
  kpiCode?: string;
}

export interface BootValidationWarning {
  code: string;
  message: string;
  tileCode?: string;
}

// ─── Workspace Resolution Result ─────────────────────────────────────────────

export interface WorkspaceResolution {
  userId: string;
  projectId: string | null;
  siteId: string | null;
  resolvedAt: string;
  bands: Array<{
    band: UniversalBand;
    visible: boolean;
    tiles: TileContract[];
  }>;
  totalTiles: number;
  permissionFilteredCount: number; // Tiles removed by permission
}

// ─── Batch Tile Response ─────────────────────────────────────────────────────

export interface BatchTileResponse {
  workspaceId: string;
  resolvedAt: string;
  tiles: Array<{
    code: string;
    state: TileRenderState;
    value?: KPIValue;
    worklistItems?: WorklistItem[];
    error?: { code: string; message: string; correlationId: string };
    asOf: string;
    stalenessIndicator?: boolean;  // Rule WS-10
  }>;
  // Rule WS-07: one batched request for all tiles
  totalRequests: 1;
}
