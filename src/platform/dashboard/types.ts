/**
 * Part 20 — Dashboard Types
 * 
 * Defines the universal dashboard structure, bands, widgets, and resolution model.
 */

import { PermissionKey } from '../permission/types';

// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL BANDS
// ═══════════════════════════════════════════════════════════════════════════

export type UniversalBand =
  | 'my_work'
  | 'my_approvals'
  | 'my_tasks'
  | 'my_projects'
  | 'my_sites'
  | 'my_kpis'
  | 'my_notifications'
  | 'my_messages'
  | 'my_deadlines'
  | 'my_exceptions'
  | 'recent_activity'
  | 'quick_actions';

export interface BandDefinition {
  id: UniversalBand;
  label: string;
  order: number;
  collapsible: boolean;
  source: string; // Which part provides this band's data
}

export const UNIVERSAL_BANDS: BandDefinition[] = [
  { id: 'my_work', label: 'My Work', order: 1, collapsible: false, source: 'Part 24' },
  { id: 'my_approvals', label: 'My Approvals', order: 2, collapsible: true, source: 'Parts 10, 23' },
  { id: 'my_tasks', label: 'My Tasks', order: 3, collapsible: true, source: 'Part 24' },
  { id: 'my_projects', label: 'My Projects', order: 4, collapsible: true, source: 'Part 27' },
  { id: 'my_sites', label: 'My Sites', order: 5, collapsible: true, source: 'Part 27' },
  { id: 'my_kpis', label: 'My KPIs', order: 6, collapsible: true, source: 'Part 14' },
  { id: 'my_notifications', label: 'My Notifications', order: 7, collapsible: true, source: 'Part 25' },
  { id: 'my_messages', label: 'My Messages', order: 8, collapsible: true, source: 'Part 61' },
  { id: 'my_deadlines', label: 'My Deadlines', order: 9, collapsible: true, source: 'Parts 10, 24, 56' },
  { id: 'my_exceptions', label: 'My Exceptions', order: 10, collapsible: true, source: 'Parts 15, 23' },
  { id: 'recent_activity', label: 'Recent Activity', order: 11, collapsible: true, source: 'Part 09' },
  { id: 'quick_actions', label: 'Quick Actions', order: 12, collapsible: true, source: 'Part 16' },
];

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type WidgetType =
  | 'kpi_tile'
  | 'chart'
  | 'list'
  | 'approval_inbox'
  | 'exception_list'
  | 'count_tile'
  | 'custom';

export interface WidgetDefinition {
  id: string;
  type: WidgetType;
  band: UniversalBand;
  kpiCode?: string; // For kpi_tile widgets
  title: string;
  size: 1 | 2 | 3 | 4; // Grid units
  permissionKey: PermissionKey;
  config?: Record<string, any>;
  isMandatory?: boolean; // Cannot be removed by user
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardDefinition {
  code: string;
  label: string;
  audience: {
    responsibilityTemplates?: string[];
    permission?: PermissionKey;
  };
  bands: DashboardBand[];
}

export interface DashboardBand {
  id: UniversalBand;
  label: string;
  collapsible?: boolean;
  widgets: WidgetDefinition[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardResolutionContext {
  userId: number;
  companyId?: number;
  projectIds: number[];
  siteIds?: number[];
  financialYear?: string;
  responsibilityTemplate?: string;
}

export interface ResolvedDashboard {
  context: DashboardResolutionContext;
  bands: ResolvedBand[];
  resolvedAt: string;
  permissionVersion: string;
}

export interface ResolvedBand {
  id: UniversalBand;
  label: string;
  collapsible: boolean;
  widgets: ResolvedWidget[];
}

export interface ResolvedWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: 1 | 2 | 3 | 4;
  kpiCode?: string;
  config?: Record<string, any>;
  isMandatory: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DRILL-DOWN
// ═══════════════════════════════════════════════════════════════════════════

export interface DrillDownLevel {
  level: number;
  label: string;
  route: string;
  filter?: Record<string, any>;
  permissionKey: PermissionKey;
}

export interface DrillDownChain {
  kpiCode: string;
  levels: DrillDownLevel[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONALIZATION
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardPersonalization {
  userId: number;
  dashboardCode: string;
  projectId?: number;
  widgetOrder: string[]; // Widget IDs in user's preferred order
  hiddenWidgets: string[]; // Widget IDs user has hidden
  widgetSizes: Record<string, 1 | 2 | 3 | 4>; // User-resized widgets
  pinnedKpis: string[]; // KPI codes pinned to top
  defaultProjectId?: number;
  defaultDateRange?: { from: string; to: string };
  savedFilters: Record<string, Record<string, any>>;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE DASHBOARDS
// ═══════════════════════════════════════════════════════════════════════════

export type RoleDashboardCode =
  | 'super_admin'
  | 'management_director'
  | 'project_portfolio'
  | 'project_manager'
  | 'site_engineer'
  | 'procurement_manager'
  | 'store_keeper'
  | 'billing_qs'
  | 'commercial_receivables'
  | 'finance_accounts'
  | 'hr_manpower'
  | 'attendance_site_manpower'
  | 'plant_equipment'
  | 'rmc_plant'
  | 'qa_qc'
  | 'hse';

export const ROLE_DASHBOARDS: Partial<Record<RoleDashboardCode, DashboardDefinition>> = {
  super_admin: {
    code: 'super_admin',
    label: 'Super Admin Dashboard',
    audience: { permission: 'admin.system.view' },
    bands: [
      {
        id: 'my_kpis',
        label: 'System Health',
        widgets: [
          { id: 'sa_uptime', type: 'kpi_tile', band: 'my_kpis', kpiCode: 'system.uptime', title: 'System Uptime', size: 1, permissionKey: 'admin.system.view' },
          { id: 'sa_queue_depth', type: 'kpi_tile', band: 'my_kpis', kpiCode: 'system.queue_depth', title: 'Queue Depth', size: 1, permissionKey: 'admin.system.view' },
          { id: 'sa_job_status', type: 'kpi_tile', band: 'my_kpis', kpiCode: 'system.job_status', title: 'Job Status', size: 1, permissionKey: 'admin.system.view' },
          { id: 'sa_error_rate', type: 'kpi_tile', band: 'my_kpis', kpiCode: 'system.error_rate', title: 'Error Rate', size: 1, permissionKey: 'admin.system.view' },
        ],
      },
      {
        id: 'my_exceptions',
        label: 'Exceptions',
        widgets: [
          { id: 'sa_sod_violations', type: 'exception_list', band: 'my_exceptions', title: 'SoD Violations', size: 2, permissionKey: 'admin.system.view' },
          { id: 'sa_approval_bottlenecks', type: 'list', band: 'my_exceptions', title: 'Approval Bottlenecks', size: 2, permissionKey: 'admin.system.view' },
        ],
      },
    ],
  },
  
  project_manager: {
    code: 'project_manager',
    label: 'Project Manager Dashboard',
    audience: { responsibilityTemplates: ['PROJECT_MANAGER'] },
    bands: [
      {
        id: 'my_work',
        label: 'My Work',
        widgets: [
          { id: 'pm_health_score', type: 'kpi_tile', band: 'my_work', kpiCode: 'project.health_score', title: 'Project Health', size: 1, permissionKey: 'project.project.view' },
          { id: 'pm_progress', type: 'kpi_tile', band: 'my_work', kpiCode: 'project.physical_progress', title: 'Physical Progress', size: 1, permissionKey: 'project.project.view' },
          { id: 'pm_schedule_variance', type: 'kpi_tile', band: 'my_work', kpiCode: 'project.schedule_variance', title: 'Schedule Variance', size: 1, permissionKey: 'project.project.view' },
          { id: 'pm_cost_variance', type: 'kpi_tile', band: 'my_work', kpiCode: 'project.cost_variance', title: 'Cost Variance', size: 1, permissionKey: 'project.project.view' },
        ],
      },
      {
        id: 'my_kpis',
        label: 'Project KPIs',
        widgets: [
          { id: 'pm_s_curve', type: 'chart', band: 'my_kpis', title: 'Planned vs Actual (S-Curve)', size: 4, permissionKey: 'project.project.view', config: { chartType: 's_curve' } },
          { id: 'pm_cash_flow', type: 'chart', band: 'my_kpis', title: 'Cash Flow', size: 2, permissionKey: 'finance.cash_flow.view', config: { chartType: 'line' } },
          { id: 'pm_billing', type: 'chart', band: 'my_kpis', title: 'Billing Status', size: 2, permissionKey: 'bill.client.view', config: { chartType: 'bar' } },
        ],
      },
      {
        id: 'my_approvals',
        label: 'Approvals',
        widgets: [
          { id: 'pm_pending_approvals', type: 'approval_inbox', band: 'my_approvals', title: 'Pending My Approval', size: 2, permissionKey: 'workflow.approval.view' },
          { id: 'pm_waiting_on', type: 'list', band: 'my_approvals', title: 'Waiting on Others', size: 2, permissionKey: 'workflow.approval.view' },
        ],
      },
    ],
  },
  
  site_engineer: {
    code: 'site_engineer',
    label: 'Site Engineer Dashboard',
    audience: { responsibilityTemplates: ['SITE_ENGINEER'] },
    bands: [
      {
        id: 'my_work',
        label: 'Today',
        widgets: [
          { id: 'se_manpower', type: 'kpi_tile', band: 'my_work', kpiCode: 'site.manpower_today', title: 'Manpower Today', size: 1, permissionKey: 'hr.attendance.view' },
          { id: 'se_plant', type: 'kpi_tile', band: 'my_work', kpiCode: 'site.plant_deployed', title: 'Plant Deployed', size: 1, permissionKey: 'asset.equipment.view' },
          { id: 'se_work_fronts', type: 'kpi_tile', band: 'my_work', kpiCode: 'site.work_fronts_open', title: 'Work Fronts', size: 1, permissionKey: 'project.execution.view' },
          { id: 'se_dpr_status', type: 'kpi_tile', band: 'my_work', kpiCode: 'site.dpr_status', title: 'DPR Status', size: 1, permissionKey: 'project.dpr.view' },
        ],
      },
      {
        id: 'quick_actions',
        label: 'Quick Actions',
        widgets: [
          { id: 'se_submit_dpr', type: 'count_tile', band: 'quick_actions', title: 'Submit DPR', size: 1, permissionKey: 'project.dpr.create', config: { action: 'submit_dpr' } },
          { id: 'se_create_mr', type: 'count_tile', band: 'quick_actions', title: 'Create MR', size: 1, permissionKey: 'procure.mr.create', config: { action: 'create_mr' } },
          { id: 'se_raise_wir', type: 'count_tile', band: 'quick_actions', title: 'Raise WIR', size: 1, permissionKey: 'qa.wir.create', config: { action: 'raise_wir' } },
          { id: 'se_record_measurement', type: 'count_tile', band: 'quick_actions', title: 'Record Measurement', size: 1, permissionKey: 'mb.entry.create', config: { action: 'record_measurement' } },
        ],
      },
    ],
  },
  
  // Additional role dashboards would be defined here...
  // For brevity, showing the pattern for 3 key roles
};

// ═══════════════════════════════════════════════════════════════════════════
// BATCHED DASHBOARD REQUEST/RESPONSE
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardBatchRequest {
  dashboardCode: string;
  context: DashboardResolutionContext;
  widgetIds: string[];
}

export interface DashboardBatchResponse {
  widgets: Record<string, WidgetData>;
  resolvedAt: string;
  permissionVersion: string;
}

export interface WidgetData {
  widgetId: string;
  type: WidgetType;
  kpiValue?: any; // For kpi_tile
  chartData?: any; // For chart
  listData?: any[]; // For list
  count?: number; // For count_tile
  asOf: string;
  isPartial: boolean;
  error?: string;
}
