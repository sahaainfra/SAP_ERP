/**
 * Part 01 — Workspace Contracts
 * 
 * These types define the registration interfaces that every subsequent module
 * must implement to contribute tiles, KPIs, worklists and quick actions to
 * the enterprise workspace. No module may bypass these contracts.
 */

// ─── Permission System ───────────────────────────────────────────────────────

export type PermissionKey = string; // Format: module.entity.action

export interface PermissionSet {
  keys: PermissionKey[];
  projectScope: string[]; // project IDs user has access to
  orgScope: string[]; // org units user has access to
  siteScope: string[]; // sites user has access to
}

export interface UserIdentity {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
  permissions: PermissionSet;
  defaultProjectId?: string;
  defaultSiteId?: string;
}

// ─── Project Context ─────────────────────────────────────────────────────────

export interface Project {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'mobilisation' | 'completed' | 'on_hold' | 'closed';
  companyId: string;
  siteIds: string[];
}

export interface Site {
  id: string;
  code: string;
  name: string;
  projectId: string;
  location?: string;
}

export interface ProjectContext {
  activeProject: Project | null;
  activeSite: Site | null;
  availableProjects: Project[];
  availableSites: Site[];
  setProject: (id: string) => void;
  setSite: (id: string) => void;
}

// ─── Tile System ─────────────────────────────────────────────────────────────

export type TileSize = 'small' | 'medium' | 'large' | 'wide' | 'full';

export type TileType = 'kpi' | 'worklist' | 'quick-action' | 'chart' | 'custom';

export interface TilePosition {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface TileDefinition {
  id: string;
  type: TileType;
  title: string;
  subtitle?: string;
  module: string; // which module registered this tile
  permissionKey: PermissionKey; // required permission to view
  size: TileSize;
  position?: TilePosition;
  drillTarget?: string; // route to navigate on click
  refreshInterval?: number; // seconds
  tags?: string[];
  enabled: boolean;
}

// ─── KPI System ──────────────────────────────────────────────────────────────

export type KPIStatus = 'critical' | 'warning' | 'normal' | 'excellent' | 'neutral';

export type KPIFormat = 'number' | 'currency' | 'percentage' | 'duration' | 'ratio';

export interface KPIDefinition {
  id: string;
  tileId: string;
  label: string;
  source: string; // which service provides the data
  formula: string; // human-readable formula
  format: KPIFormat;
  unit?: string;
  thresholds: {
    critical?: number;
    warning?: number;
    target?: number;
    excellent?: number;
  };
  comparisonPeriod?: 'previous' | 'ytd' | 'rolling';
  drillTarget?: string;
  permissionKey: PermissionKey;
  calculationPeriod: string;
  refreshMechanism: 'realtime' | 'scheduled' | 'on-demand';
}

export interface KPIValue {
  definitionId: string;
  value: number | null;
  previousValue?: number | null;
  status: KPIStatus;
  calculatedAt: string; // ISO timestamp
  scope: {
    projectId?: string;
    siteId?: string;
    orgId?: string;
  };
}

// ─── Worklist System ─────────────────────────────────────────────────────────

export type WorklistPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WorklistItem {
  id: string;
  title: string;
  subtitle?: string;
  entity: string; // e.g., 'procure.po', 'bill.client'
  entityId: string;
  status: string;
  priority: WorklistPriority;
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  drillTarget: string;
  permissionKey: PermissionKey;
}

export interface WorklistDefinition {
  id: string;
  tileId: string;
  label: string;
  module: string;
  source: string;
  maxItems: number;
  permissionKey: PermissionKey;
  drillTarget: string;
  filters?: Record<string, string>;
}

// ─── Quick Action System ─────────────────────────────────────────────────────

export interface QuickAction {
  id: string;
  tileId: string;
  label: string;
  icon: string;
  action: string; // route or action identifier
  permissionKey: PermissionKey;
  module: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

// ─── Real-Time Event System ──────────────────────────────────────────────────

export type EventType = string; // Format: module.entity.pastTenseVerb

export interface DomainEvent {
  id: string;
  type: EventType;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: string; // ISO timestamp
  actor: string;
  correlationId: string;
  sequence: number;
}

export interface EventSubscription {
  id: string;
  eventTypes: EventType[];
  handler: (event: DomainEvent) => void;
  filter?: (event: DomainEvent) => boolean;
}

// ─── Dashboard Layout ────────────────────────────────────────────────────────

export interface DashboardLayout {
  id: string;
  userId: string;
  role: string;
  tiles: Array<{
    tileId: string;
    position: TilePosition;
    visible: boolean;
  }>;
  lastModified: string;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  drillTarget?: string;
  eventId?: string;
}

// ─── Workspace State ─────────────────────────────────────────────────────────

export interface WorkspaceState {
  layout: DashboardLayout | null;
  registeredTiles: Map<string, TileDefinition>;
  registeredKPIs: Map<string, KPIDefinition>;
  registeredWorklists: Map<string, WorklistDefinition>;
  registeredQuickActions: Map<string, QuickAction>;
  kpiValues: Map<string, KPIValue>;
  worklistItems: Map<string, WorklistItem[]>;
  notifications: Notification[];
  isLoading: boolean;
  lastRefresh: string | null;
}
