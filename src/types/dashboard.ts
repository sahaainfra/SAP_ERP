/**
 * Dashboard Types - Part 6
 * 
 * Type definitions for role-based dashboards, Project 360, and object pages
 */

import type { KpiValue } from './realtime';
import type { DashboardWidget } from './components';

// ─── Dashboard Resolution ────────────────────────────────────────────────────

export type DashboardRole = 
  | 'super_admin'
  | 'director'
  | 'project_manager'
  | 'site_engineer'
  | 'procurement_manager'
  | 'store_keeper'
  | 'billing_engineer'
  | 'commercial_manager'
  | 'finance_manager'
  | 'hr_manager'
  | 'attendance_manager'
  | 'plant_manager'
  | 'rmc_manager'
  | 'qa_qc_manager'
  | 'hse_manager'
  | 'project_portfolio';

export interface DashboardResolution {
  dashboardId: string;
  dashboardName: string;
  role: DashboardRole;
  widgets: DashboardWidget[];
  isPortfolio: boolean;
  projectIds: number[];
  resolvedAt: string;
}

// ─── Universal Home ──────────────────────────────────────────────────────────

export interface MyWorkCounts {
  approvalsPending: number;
  tasksDue: number;
  overdueItems: number;
  draftDocuments: number;
}

export interface AttentionAlert {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  entityType: string;
  entityId: number;
  raisedAt: string;
  actionLabel: string;
  actionRoute: string;
}

export interface UniversalHomeData {
  myWork: MyWorkCounts;
  attentionAlerts: AttentionAlert[];
  lastUpdated: string;
}

// ─── Project 360 ─────────────────────────────────────────────────────────────

export interface Project360Header {
  projectId: number;
  projectCode: string;
  projectName: string;
  client: string;
  location: string;
  projectType: string;
  startDate: string;
  endDate: string;
  contractValue: number;
  revisedValue: number;
  projectManager: string;
  status: string;
  healthScore: number;
  healthBand: 'Healthy' | 'Watch' | 'At Risk' | 'Critical';
  daysElapsed: number;
  daysRemaining: number;
}

export interface HealthScoreComponent {
  name: string;
  weight: number;
  score: number;
  status: 'good' | 'warning' | 'critical';
  drillRoute: string;
}

export interface HealthScore {
  overall: number;
  band: 'Healthy' | 'Watch' | 'At Risk' | 'Critical';
  components: HealthScoreComponent[];
  trend: Array<{ period: string; score: number }>;
}

export interface Project360Section {
  key: string;
  title: string;
  icon: string;
  kpis: KpiValue[];
  drillRoute: string;
}

export interface Project360Data {
  header: Project360Header;
  healthScore: HealthScore;
  sections: Project360Section[];
}

// ─── Object Page ─────────────────────────────────────────────────────────────

export type ObjectType = 
  | 'project'
  | 'purchase_order'
  | 'purchase_requisition'
  | 'material_requisition'
  | 'grn'
  | 'measurement_book'
  | 'ra_bill'
  | 'invoice'
  | 'payment'
  | 'vendor'
  | 'employee'
  | 'equipment'
  | 'ncr'
  | 'wir'
  | 'incident';

export interface ObjectHeader {
  objectType: ObjectType;
  objectNumber: string;
  title: string;
  status: string;
  keyFacts: Array<{ label: string; value: string | number }>;
  actions: ObjectAction[];
}

export interface ObjectAction {
  key: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  icon?: string;
  disabled?: boolean;
  disabledReason?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface ObjectSection {
  key: string;
  title: string;
  icon?: string;
  content: any;
  hasPermission: boolean;
}

export interface ObjectPageData {
  header: ObjectHeader;
  sections: ObjectSection[];
  approvalHistory: ApprovalHistoryItem[];
  auditTrail: AuditTrailItem[];
  documentChain: DocumentChainNode[];
}

export interface ApprovalHistoryItem {
  id: number;
  approver: string;
  action: string;
  timestamp: string;
  comment?: string;
  slaMet: boolean;
}

export interface AuditTrailItem {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
}

export interface DocumentChainNode {
  id: number;
  type: ObjectType;
  number: string;
  status: string;
  value?: number;
  date: string;
  route: string;
  hasAccess: boolean;
}

// ─── Drill-Down ──────────────────────────────────────────────────────────────

export interface DrillDownContext {
  level: number;
  kpiKey?: string;
  filters: Record<string, any>;
  breadcrumb: Array<{ label: string; route: string }>;
}

export interface DrillDownData {
  context: DrillDownContext;
  records: any[];
  totalCount: number;
  canDrillFurther: boolean;
}

// ─── Dashboard Widget Data ───────────────────────────────────────────────────

export interface WidgetData {
  widgetId: string;
  type: 'kpi' | 'chart' | 'table' | 'list' | 'custom';
  data: any;
  loading: boolean;
  error?: string;
  lastUpdated: string;
}

export interface DashboardData {
  resolution: DashboardResolution;
  widgets: WidgetData[];
  universalHome?: UniversalHomeData;
}
