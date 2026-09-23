/**
 * Part 21 — Role Dashboard Types
 * 
 * Defines the structure for role-specific dashboard configurations,
 * object pages, health scores, and document chains.
 */

import { PermissionKey } from '../permission/types';
import { UniversalBand, WidgetDefinition } from '../dashboard/types';

// ═══════════════════════════════════════════════════════════════════════════
// ROLE DASHBOARD CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface RoleDashboardConfig {
  roleCode: string;
  roleName: string;
  description: string;
  mobileFirst: boolean; // True for Site Engineer, Store Keeper, Employee/Labour
  desktopFirst: boolean; // True for Management, CFO, Accounts, Procurement
  bands: RoleBandConfig[];
  mobileBands?: RoleBandConfig[]; // Subset for mobile
}

export interface RoleBandConfig {
  band: UniversalBand;
  widgets: RoleWidgetConfig[];
}

export interface RoleWidgetConfig {
  id: string;
  type: WidgetDefinition['type'];
  kpiCode?: string;
  title: string;
  size: 1 | 2 | 3 | 4;
  permissionKey: PermissionKey;
  config?: Record<string, any>;
  isMandatory?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT PAGE STANDARD
// ═══════════════════════════════════════════════════════════════════════════

export interface ObjectPageConfig {
  entityType: string;
  headerFields: ObjectPageHeaderField[];
  sections: ObjectPageSection[];
  actions: ObjectPageAction[];
}

export interface ObjectPageHeaderField {
  field: string;
  label: string;
  type: 'text' | 'money' | 'date' | 'status' | 'reference';
  permissionKey?: PermissionKey;
}

export type ObjectPageSectionType = 
  | 'general'
  | 'line_items'
  | 'financial_summary'
  | 'schedule_dates'
  | 'attachments'
  | 'approval_history'
  | 'related_documents'
  | 'activity_audit'
  | 'comments';

export interface ObjectPageSection {
  id: string;
  type: ObjectPageSectionType;
  label: string;
  permissionKey?: PermissionKey;
  editable?: boolean;
  config?: Record<string, any>;
}

export interface ObjectPageAction {
  name: string;
  label: string;
  permissionKey: PermissionKey;
  emphasis: 'primary' | 'secondary' | 'danger';
  requiresConfirmation: boolean;
  requiresDocumentNumber: boolean; // For irreversible actions
  stateRestrictions?: string[]; // States where action is available
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT 360 - COMMAND CENTRE
// ═══════════════════════════════════════════════════════════════════════════

export interface Project360Payload {
  projectId: number;
  header: Project360Header;
  healthScore: HealthScore;
  sections: Project360Section[];
}

export interface Project360Header {
  code: string;
  name: string;
  client: string;
  location: string;
  projectType: string;
  startDate: string;
  endDate: string;
  contractValue: number;
  revisedValue: number;
  projectManager: string;
  overallStatus: string;
  daysElapsed: number;
  daysRemaining: number;
}

export interface HealthScore {
  compositeScore: number; // 0-100
  band: 'HEALTHY' | 'WATCH' | 'AT_RISK' | 'CRITICAL';
  components: HealthScoreComponent[];
  trend: Array<{ period: string; score: number }>;
}

export interface HealthScoreComponent {
  name: string;
  weight: number; // Percentage
  score: number; // 0-100
  basis: string; // What it's based on
  drillDownRoute: string;
}

export type Project360SectionType =
  | 'contract'
  | 'execution'
  | 'procurement'
  | 'material'
  | 'manpower'
  | 'plant'
  | 'quality'
  | 'hse'
  | 'commercial'
  | 'finance';

export interface Project360Section {
  type: Project360SectionType;
  label: string;
  collapsible: boolean;
  kpis: Array<{
    code: string;
    label: string;
    value: any;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    status?: 'good' | 'warning' | 'critical';
  }>;
  charts?: Array<{
    type: string;
    title: string;
    kpiCode: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT CHAIN
// ═══════════════════════════════════════════════════════════════════════════

export interface DocumentChain {
  entityType: string;
  entityId: number;
  nodes: DocumentChainNode[];
  edges: DocumentChainEdge[];
}

export interface DocumentChainNode {
  id: string;
  entityType: string;
  entityId: number;
  documentNumber: string;
  status: string;
  value?: number;
  date: string;
  accessible: boolean; // False = show as "Restricted"
  route?: string; // Only if accessible
}

export interface DocumentChainEdge {
  from: string; // Node ID
  to: string; // Node ID
  relationship: string; // e.g., "MR → PR", "PO → GRN"
}

// ═══════════════════════════════════════════════════════════════════════════
// DRILL-DOWN
// ═══════════════════════════════════════════════════════════════════════════

export interface DrillDownRequest {
  kpiCode: string;
  level: number;
  filters: Record<string, any>;
  projectId?: number;
}

export interface DrillDownResponse {
  level: number;
  label: string;
  records: any[];
  total: number;
  breadcrumb: DrillDownBreadcrumbItem[];
  canDrillFurther: boolean;
}

export interface DrillDownBreadcrumbItem {
  level: number;
  label: string;
  filters: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE DASHBOARD CODES
// ═══════════════════════════════════════════════════════════════════════════

export type RoleCode =
  | 'super_admin'
  | 'management_director'
  | 'cfo'
  | 'hr_manager'
  | 'accounts_manager'
  | 'procurement_manager'
  | 'project_manager'
  | 'commercial_manager'
  | 'quantity_surveyor'
  | 'site_engineer'
  | 'store_keeper'
  | 'employee_labour'
  | 'plant_operator'
  | 'qa_qc_engineer'
  | 'hse_officer'
  | 'planning_engineer';

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH SCORE WEIGHTS (Admin-Configurable)
// ═══════════════════════════════════════════════════════════════════════════

export interface HealthScoreWeights {
  schedulePerformance: number; // Default 20%
  costPerformance: number; // Default 20%
  billingPerformance: number; // Default 15%
  collectionPerformance: number; // Default 10%
  quality: number; // Default 10%
  safety: number; // Default 10%
  materialEfficiency: number; // Default 5%
  manpowerProductivity: number; // Default 5%
  approvalEfficiency: number; // Default 5%
}

export const DEFAULT_HEALTH_SCORE_WEIGHTS: HealthScoreWeights = {
  schedulePerformance: 20,
  costPerformance: 20,
  billingPerformance: 15,
  collectionPerformance: 10,
  quality: 10,
  safety: 10,
  materialEfficiency: 5,
  manpowerProductivity: 5,
  approvalEfficiency: 5,
};
