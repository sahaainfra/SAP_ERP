/**
 * Part 21 — Role Dashboard Configurations
 * 
 * Defines the actual dashboard content for each role as editable configuration.
 * These are data, not code — an administrator can change them without a release.
 * 
 * Key business rules enforced:
 * - ROLE-01: Dashboard is a default, not authority — tiles only appear if user has permission
 * - ROLE-02: Store Keeper sees quantities only, no rates/values
 * - ROLE-03: Site Engineer sees no rate/value/margin/payroll figures
 * - ROLE-04: CFO dashboard is approve-and-review only
 * - ROLE-05: Employee/Labour sees only their own records
 * - ROLE-06: Configuration errors reported at boot
 */

import { RoleDashboardConfig, RoleCode } from './role-dashboard-types';

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export const SUPER_ADMIN_DASHBOARD: RoleDashboardConfig = {
  roleCode: 'super_admin',
  roleName: 'Super Admin',
  description: 'System health, security, and operational monitoring',
  mobileFirst: false,
  desktopFirst: true,
  bands: [
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'sa_system_uptime',
          type: 'kpi_tile',
          kpiCode: 'system.uptime_percent',
          title: 'System Uptime',
          size: 1,
          permissionKey: 'admin.system.view',
          config: { showTrend: true },
        },
        {
          id: 'sa_active_users',
          type: 'kpi_tile',
          kpiCode: 'system.active_users',
          title: 'Active Users Now',
          size: 1,
          permissionKey: 'admin.system.view',
        },
        {
          id: 'sa_api_error_rate',
          type: 'kpi_tile',
          kpiCode: 'system.api_error_rate',
          title: 'API Error Rate',
          size: 1,
          permissionKey: 'admin.system.view',
          config: { showTrend: true },
        },
        {
          id: 'sa_outbox_lag',
          type: 'kpi_tile',
          kpiCode: 'system.outbox_lag_seconds',
          title: 'Outbox Lag',
          size: 1,
          permissionKey: 'admin.system.view',
        },
      ],
    },
    {
      band: 'my_exceptions',
      widgets: [
        {
          id: 'sa_failed_jobs',
          type: 'exception_list',
          title: 'Failed Background Jobs',
          size: 2,
          permissionKey: 'admin.system.view',
          config: { severity: ['CRITICAL', 'P1'] },
        },
        {
          id: 'sa_sod_violations',
          type: 'exception_list',
          title: 'SoD Violations Open',
          size: 2,
          permissionKey: 'admin.system.view',
        },
        {
          id: 'sa_approval_bottlenecks',
          type: 'list',
          title: 'Approval Bottlenecks',
          size: 2,
          permissionKey: 'admin.system.view',
          config: { entity: 'approval_queue', limit: 10 },
        },
        {
          id: 'sa_permission_changes',
          type: 'list',
          title: 'Permission Changes Awaiting Review',
          size: 2,
          permissionKey: 'admin.system.view',
        },
      ],
    },
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'sa_database_health',
          type: 'chart',
          title: 'Database Health Indicators',
          size: 4,
          permissionKey: 'admin.system.view',
          config: { chartType: 'gauge', kpiCodes: ['system.db_connections', 'system.db_query_time'] },
        },
        {
          id: 'sa_storage_consumption',
          type: 'chart',
          title: 'Storage Consumption Trend',
          size: 4,
          permissionKey: 'admin.system.view',
          config: { chartType: 'area', kpiCode: 'system.storage_used_gb' },
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// MANAGEMENT / DIRECTOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export const MANAGEMENT_DASHBOARD: RoleDashboardConfig = {
  roleCode: 'management_director',
  roleName: 'Management / Director',
  description: 'Portfolio overview, financial health, and strategic KPIs',
  mobileFirst: false,
  desktopFirst: true,
  bands: [
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'mgmt_portfolio_value',
          type: 'kpi_tile',
          kpiCode: 'portfolio.total_contract_value',
          title: 'Portfolio Contract Value',
          size: 1,
          permissionKey: 'project.portfolio.view',
          config: { format: 'currency' },
        },
        {
          id: 'mgmt_executed_value',
          type: 'kpi_tile',
          kpiCode: 'portfolio.executed_value',
          title: 'Executed Value',
          size: 1,
          permissionKey: 'project.portfolio.view',
          config: { format: 'currency' },
        },
        {
          id: 'mgmt_revenue_ytd',
          type: 'kpi_tile',
          kpiCode: 'portfolio.revenue_ytd',
          title: 'Revenue YTD',
          size: 1,
          permissionKey: 'finance.revenue.view',
          config: { format: 'currency', showTrend: true },
        },
        {
          id: 'mgmt_cash_position',
          type: 'kpi_tile',
          kpiCode: 'portfolio.cash_position',
          title: 'Cash Position',
          size: 1,
          permissionKey: 'finance.cash.view',
          config: { format: 'currency' },
        },
      ],
    },
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'mgmt_project_health_distribution',
          type: 'chart',
          title: 'Project Health Distribution',
          size: 2,
          permissionKey: 'project.portfolio.view',
          config: { chartType: 'donut', kpiCode: 'portfolio.health_distribution' },
        },
        {
          id: 'mgmt_revenue_vs_target',
          type: 'chart',
          title: 'Revenue vs Target (Monthly)',
          size: 2,
          permissionKey: 'finance.revenue.view',
          config: { chartType: 'bar', kpiCodes: ['portfolio.revenue_actual', 'portfolio.revenue_target'] },
        },
        {
          id: 'mgmt_profitability_by_project',
          type: 'chart',
          title: 'Profitability by Project',
          size: 4,
          permissionKey: 'project.portfolio.view',
          config: { chartType: 'bar', kpiCode: 'project.profitability_margin', sortBy: 'value' },
        },
      ],
    },
    {
      band: 'my_exceptions',
      widgets: [
        {
          id: 'mgmt_critical_alerts',
          type: 'exception_list',
          title: 'Critical Project Exceptions',
          size: 2,
          permissionKey: 'project.portfolio.view',
          config: { severity: ['CRITICAL', 'P1'] },
        },
        {
          id: 'mgmt_overdue_approvals',
          type: 'list',
          title: 'Overdue Approvals at Management Level',
          size: 2,
          permissionKey: 'workflow.approval.view',
          config: { entity: 'approval_queue', filter: 'level = management AND overdue = true' },
        },
        {
          id: 'mgmt_top_projects_by_value',
          type: 'list',
          title: 'Top 5 Projects by Value',
          size: 2,
          permissionKey: 'project.portfolio.view',
          config: { entity: 'project', sortBy: 'contract_value', limit: 5 },
        },
        {
          id: 'mgmt_bottom_projects_by_health',
          type: 'list',
          title: 'Bottom 5 Projects by Health Score',
          size: 2,
          permissionKey: 'project.portfolio.view',
          config: { entity: 'project', sortBy: 'health_score', limit: 5, order: 'asc' },
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CFO DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export const CFO_DASHBOARD: RoleDashboardConfig = {
  roleCode: 'cfo',
  roleName: 'Chief Financial Officer',
  description: 'Financial oversight, cash flow, and risk indicators',
  mobileFirst: false,
  desktopFirst: true,
  bands: [
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'cfo_revenue',
          type: 'kpi_tile',
          kpiCode: 'finance.revenue_mtd',
          title: 'Revenue This Month',
          size: 1,
          permissionKey: 'finance.revenue.view',
          config: { format: 'currency', showTrend: true },
        },
        {
          id: 'cfo_receivables',
          type: 'kpi_tile',
          kpiCode: 'finance.total_receivables',
          title: 'Total Receivables',
          size: 1,
          permissionKey: 'finance.receivable.view',
          config: { format: 'currency' },
        },
        {
          id: 'cfo_payables',
          type: 'kpi_tile',
          kpiCode: 'finance.total_payables',
          title: 'Total Payables',
          size: 1,
          permissionKey: 'finance.payable.view',
          config: { format: 'currency' },
        },
        {
          id: 'cfo_cash_flow',
          type: 'kpi_tile',
          kpiCode: 'finance.cash_flow_mtd',
          title: 'Cash Flow MTD',
          size: 1,
          permissionKey: 'finance.cash.view',
          config: { format: 'currency', showTrend: true },
        },
      ],
    },
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'cfo_receivables_ageing',
          type: 'chart',
          title: 'Receivables Ageing',
          size: 2,
          permissionKey: 'finance.receivable.view',
          config: { chartType: 'bar', kpiCode: 'finance.receivables_by_age_bucket' },
        },
        {
          id: 'cfo_cash_projection',
          type: 'chart',
          title: 'Cash Flow Projection (30/60/90 Days)',
          size: 2,
          permissionKey: 'finance.cash.view',
          config: { chartType: 'line', kpiCode: 'finance.cash_projection' },
        },
        {
          id: 'cfo_project_profitability',
          type: 'chart',
          title: 'Project Profitability',
          size: 4,
          permissionKey: 'project.profitability.view',
          config: { chartType: 'bar', kpiCode: 'project.profitability_margin' },
        },
      ],
    },
    {
      band: 'my_approvals',
      widgets: [
        {
          id: 'cfo_pending_approvals',
          type: 'approval_inbox',
          title: 'Pending Financial Approvals',
          size: 4,
          permissionKey: 'finance.approval.view',
          config: { filter: 'type IN (payment, voucher) AND level = cfo' },
        },
      ],
    },
    {
      band: 'my_exceptions',
      widgets: [
        {
          id: 'cfo_overdue_bills',
          type: 'exception_list',
          title: 'Overdue Bills',
          size: 2,
          permissionKey: 'finance.receivable.view',
          config: { severity: ['CRITICAL'] },
        },
        {
          id: 'cfo_financial_risks',
          type: 'exception_list',
          title: 'Financial Risk Indicators',
          size: 2,
          permissionKey: 'finance.risk.view',
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT MANAGER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export const PROJECT_MANAGER_DASHBOARD: RoleDashboardConfig = {
  roleCode: 'project_manager',
  roleName: 'Project Manager',
  description: 'Project health, progress, cost, and operational KPIs',
  mobileFirst: false,
  desktopFirst: true,
  bands: [
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'pm_health_score',
          type: 'kpi_tile',
          kpiCode: 'project.health_score',
          title: 'Project Health Score',
          size: 1,
          permissionKey: 'project.project.view',
          config: { showBreakdown: true },
        },
        {
          id: 'pm_physical_progress',
          type: 'kpi_tile',
          kpiCode: 'project.physical_progress_percent',
          title: 'Physical Progress',
          size: 1,
          permissionKey: 'project.project.view',
          config: { format: 'percent', showTrend: true },
        },
        {
          id: 'pm_schedule_variance',
          type: 'kpi_tile',
          kpiCode: 'project.schedule_variance_days',
          title: 'Schedule Variance',
          size: 1,
          permissionKey: 'project.project.view',
          config: { format: 'days' },
        },
        {
          id: 'pm_cost_variance',
          type: 'kpi_tile',
          kpiCode: 'project.cost_variance_percent',
          title: 'Cost Variance',
          size: 1,
          permissionKey: 'project.project.view',
          config: { format: 'percent' },
        },
      ],
    },
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'pm_s_curve',
          type: 'chart',
          title: 'Planned vs Actual Progress (S-Curve)',
          size: 4,
          permissionKey: 'project.project.view',
          config: { chartType: 's_curve', kpiCodes: ['project.planned_progress', 'project.actual_progress'] },
        },
        {
          id: 'pm_cash_flow',
          type: 'chart',
          title: 'Project Cash Flow',
          size: 2,
          permissionKey: 'finance.cash.view',
          config: { chartType: 'line', kpiCode: 'project.cash_flow' },
        },
        {
          id: 'pm_billing_status',
          type: 'chart',
          title: 'Billing Status',
          size: 2,
          permissionKey: 'bill.client.view',
          config: { chartType: 'bar', kpiCodes: ['project.billed', 'project.certified', 'project.collected'] },
        },
      ],
    },
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'pm_manpower',
          type: 'kpi_tile',
          kpiCode: 'project.manpower_deployed',
          title: 'Manpower Today',
          size: 1,
          permissionKey: 'hr.manpower.view',
        },
        {
          id: 'pm_plant_utilisation',
          type: 'kpi_tile',
          kpiCode: 'project.plant_utilisation_percent',
          title: 'Plant Utilisation',
          size: 1,
          permissionKey: 'asset.equipment.view',
          config: { format: 'percent' },
        },
        {
          id: 'pm_material_stock_value',
          type: 'kpi_tile',
          kpiCode: 'project.material_stock_value',
          title: 'Material Stock Value',
          size: 1,
          permissionKey: 'store.stock.view',
          config: { format: 'currency' },
        },
        {
          id: 'pm_procurement_pipeline',
          type: 'kpi_tile',
          kpiCode: 'project.procurement_pipeline_value',
          title: 'Procurement Pipeline',
          size: 1,
          permissionKey: 'procure.po.view',
          config: { format: 'currency' },
        },
      ],
    },
    {
      band: 'my_approvals',
      widgets: [
        {
          id: 'pm_pending_approvals',
          type: 'approval_inbox',
          title: 'Pending My Approval',
          size: 2,
          permissionKey: 'workflow.approval.view',
        },
        {
          id: 'pm_waiting_on_others',
          type: 'list',
          title: 'Waiting on Others',
          size: 2,
          permissionKey: 'workflow.approval.view',
          config: { entity: 'approval_queue', filter: 'status = pending AND approver != me' },
        },
      ],
    },
    {
      band: 'my_exceptions',
      widgets: [
        {
          id: 'pm_open_ncrs',
          type: 'exception_list',
          title: 'Open NCRs',
          size: 2,
          permissionKey: 'qa.ncr.view',
        },
        {
          id: 'pm_safety_observations',
          type: 'exception_list',
          title: 'Open Safety Observations',
          size: 2,
          permissionKey: 'hse.observation.view',
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// SITE ENGINEER DASHBOARD (MOBILE-FIRST)
// ═══════════════════════════════════════════════════════════════════════════

export const SITE_ENGINEER_DASHBOARD: RoleDashboardConfig = {
  roleCode: 'site_engineer',
  roleName: 'Site Engineer',
  description: 'Daily site operations, manpower, and field activities',
  mobileFirst: true,
  desktopFirst: false,
  bands: [
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'se_manpower_today',
          type: 'kpi_tile',
          kpiCode: 'site.manpower_deployed_today',
          title: 'Manpower Today',
          size: 1,
          permissionKey: 'hr.attendance.view',
        },
        {
          id: 'se_plant_deployed',
          type: 'kpi_tile',
          kpiCode: 'site.plant_deployed_count',
          title: 'Plant Deployed',
          size: 1,
          permissionKey: 'asset.equipment.view',
        },
        {
          id: 'se_work_fronts_open',
          type: 'kpi_tile',
          kpiCode: 'site.work_fronts_open',
          title: 'Work Fronts Open',
          size: 1,
          permissionKey: 'project.execution.view',
        },
        {
          id: 'se_dpr_status',
          type: 'kpi_tile',
          kpiCode: 'site.dpr_submitted_today',
          title: 'DPR Status',
          size: 1,
          permissionKey: 'project.dpr.view',
          config: { format: 'status' },
        },
      ],
    },
    {
      band: 'my_tasks',
      widgets: [
        {
          id: 'se_mb_pending_certification',
          type: 'list',
          title: 'My MB Entries Pending Certification',
          size: 4,
          permissionKey: 'mb.entry.view',
          config: { entity: 'measurement_book', filter: 'status = submitted AND certifier = me' },
        },
        {
          id: 'se_inspections_due',
          type: 'list',
          title: 'Inspections Due Today',
          size: 4,
          permissionKey: 'qa.inspection.view',
          config: { entity: 'inspection', filter: 'due_date = today' },
        },
      ],
    },
    {
      band: 'quick_actions',
      widgets: [
        {
          id: 'se_submit_dpr',
          type: 'count_tile',
          title: 'Submit DPR',
          size: 1,
          permissionKey: 'project.dpr.create',
          config: { action: 'submit_dpr', icon: 'clipboard' },
        },
        {
          id: 'se_create_mr',
          type: 'count_tile',
          title: 'Create MR',
          size: 1,
          permissionKey: 'procure.mr.create',
          config: { action: 'create_mr', icon: 'request' },
        },
        {
          id: 'se_raise_wir',
          type: 'count_tile',
          title: 'Raise WIR',
          size: 1,
          permissionKey: 'qa.wir.create',
          config: { action: 'raise_wir', icon: 'inspection' },
        },
        {
          id: 'se_record_measurement',
          type: 'count_tile',
          title: 'Record Measurement',
          size: 1,
          permissionKey: 'mb.entry.create',
          config: { action: 'record_measurement', icon: 'ruler' },
        },
      ],
    },
    // NOTE: No rate, value, margin, or payroll figures appear on this dashboard
  ],
  mobileBands: [
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'se_manpower_today_mobile',
          type: 'kpi_tile',
          kpiCode: 'site.manpower_deployed_today',
          title: 'Manpower',
          size: 1,
          permissionKey: 'hr.attendance.view',
        },
        {
          id: 'se_dpr_status_mobile',
          type: 'kpi_tile',
          kpiCode: 'site.dpr_submitted_today',
          title: 'DPR',
          size: 1,
          permissionKey: 'project.dpr.view',
        },
      ],
    },
    {
      band: 'quick_actions',
      widgets: [
        {
          id: 'se_submit_dpr_mobile',
          type: 'count_tile',
          title: 'Submit DPR',
          size: 2,
          permissionKey: 'project.dpr.create',
          config: { action: 'submit_dpr' },
        },
        {
          id: 'se_raise_wir_mobile',
          type: 'count_tile',
          title: 'Raise WIR',
          size: 2,
          permissionKey: 'qa.wir.create',
          config: { action: 'raise_wir' },
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE KEEPER DASHBOARD (MOBILE-FIRST)
// ═══════════════════════════════════════════════════════════════════════════

export const STORE_KEEPER_DASHBOARD: RoleDashboardConfig = {
  roleCode: 'store_keeper',
  roleName: 'Store Keeper',
  description: 'Stock management, receipts, and issues',
  mobileFirst: true,
  desktopFirst: false,
  bands: [
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'sk_grns_pending',
          type: 'kpi_tile',
          kpiCode: 'store.grns_pending_count',
          title: 'GRNs Pending',
          size: 1,
          permissionKey: 'store.grn.view',
        },
        {
          id: 'sk_items_below_reorder',
          type: 'kpi_tile',
          kpiCode: 'store.items_below_reorder_count',
          title: 'Items Below Reorder',
          size: 1,
          permissionKey: 'store.stock.view',
          config: { status: 'warning' },
        },
        {
          id: 'sk_negative_stock',
          type: 'kpi_tile',
          kpiCode: 'store.negative_stock_count',
          title: 'Negative Stock',
          size: 1,
          permissionKey: 'store.stock.view',
          config: { status: 'critical' },
        },
        {
          id: 'sk_issues_pending',
          type: 'kpi_tile',
          kpiCode: 'store.issues_pending_count',
          title: 'Issues Pending',
          size: 1,
          permissionKey: 'store.issue.view',
        },
      ],
    },
    {
      band: 'my_tasks',
      widgets: [
        {
          id: 'sk_todays_receipts',
          type: 'list',
          title: "Today's Receipts",
          size: 2,
          permissionKey: 'store.grn.view',
          config: { entity: 'grn', filter: 'date = today' },
        },
        {
          id: 'sk_todays_issues',
          type: 'list',
          title: "Today's Issues",
          size: 2,
          permissionKey: 'store.issue.view',
          config: { entity: 'material_issue', filter: 'date = today' },
        },
      ],
    },
    {
      band: 'quick_actions',
      widgets: [
        {
          id: 'sk_record_grn',
          type: 'count_tile',
          title: 'Record GRN',
          size: 1,
          permissionKey: 'store.grn.create',
          config: { action: 'record_grn', icon: 'inbox' },
        },
        {
          id: 'sk_issue_material',
          type: 'count_tile',
          title: 'Issue Material',
          size: 1,
          permissionKey: 'store.issue.create',
          config: { action: 'issue_material', icon: 'outbox' },
        },
        {
          id: 'sk_stock_count',
          type: 'count_tile',
          title: 'Stock Count',
          size: 1,
          permissionKey: 'store.stock.count',
          config: { action: 'stock_count', icon: 'clipboard' },
        },
        {
          id: 'sk_record_return',
          type: 'count_tile',
          title: 'Record Return',
          size: 1,
          permissionKey: 'store.return.create',
          config: { action: 'record_return', icon: 'undo' },
        },
      ],
    },
    // NOTE: Quantity tiles only — no rates or values (ROLE-02)
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// EMPLOYEE / LABOUR DASHBOARD (MOBILE-FIRST)
// ═══════════════════════════════════════════════════════════════════════════

export const EMPLOYEE_LABOUR_DASHBOARD: RoleDashboardConfig = {
  roleCode: 'employee_labour',
  roleName: 'Employee / Labour',
  description: 'Personal workspace for attendance, tasks, and documents',
  mobileFirst: true,
  desktopFirst: false,
  bands: [
    {
      band: 'my_kpis',
      widgets: [
        {
          id: 'emp_attendance_this_month',
          type: 'kpi_tile',
          kpiCode: 'employee.attendance_days_this_month',
          title: 'Attendance This Month',
          size: 1,
          permissionKey: 'hr.attendance.view_own',
        },
        {
          id: 'emp_leave_balance',
          type: 'kpi_tile',
          kpiCode: 'employee.leave_balance_days',
          title: 'Leave Balance',
          size: 1,
          permissionKey: 'hr.leave.view_own',
        },
      ],
    },
    {
      band: 'quick_actions',
      widgets: [
        {
          id: 'emp_mark_attendance',
          type: 'count_tile',
          title: 'Mark Attendance',
          size: 2,
          permissionKey: 'hr.attendance.create_own',
          config: { action: 'mark_attendance', icon: 'check' },
        },
        {
          id: 'emp_apply_leave',
          type: 'count_tile',
          title: 'Apply Leave',
          size: 2,
          permissionKey: 'hr.leave.create_own',
          config: { action: 'apply_leave', icon: 'calendar' },
        },
      ],
    },
    {
      band: 'my_tasks',
      widgets: [
        {
          id: 'emp_assigned_work',
          type: 'list',
          title: 'My Assigned Work',
          size: 4,
          permissionKey: 'project.task.view_own',
          config: { entity: 'task', filter: 'assignee = me AND status != completed' },
        },
      ],
    },
    {
      band: 'my_notifications',
      widgets: [
        {
          id: 'emp_notices',
          type: 'list',
          title: 'Notices & Announcements',
          size: 4,
          permissionKey: 'hr.notice.view',
          config: { entity: 'notice', limit: 5 },
        },
      ],
    },
    // NOTE: Own records only (ROLE-05) — no colleague data visible
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// ROLE DASHBOARD REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

export const ROLE_DASHBOARD_CONFIGS: Record<RoleCode, RoleDashboardConfig> = {
  super_admin: SUPER_ADMIN_DASHBOARD,
  management_director: MANAGEMENT_DASHBOARD,
  cfo: CFO_DASHBOARD,
  project_manager: PROJECT_MANAGER_DASHBOARD,
  site_engineer: SITE_ENGINEER_DASHBOARD,
  store_keeper: STORE_KEEPER_DASHBOARD,
  employee_labour: EMPLOYEE_LABOUR_DASHBOARD,
  
  // Additional roles would be defined here...
  // For brevity, showing the pattern for key roles
  
  hr_manager: {
    roleCode: 'hr_manager',
    roleName: 'HR Manager',
    description: 'Workforce management and HR operations',
    mobileFirst: false,
    desktopFirst: true,
    bands: [
      {
        band: 'my_kpis',
        widgets: [
          { id: 'hr_headcount', type: 'kpi_tile', kpiCode: 'hr.total_headcount', title: 'Total Headcount', size: 1, permissionKey: 'hr.employee.view' },
          { id: 'hr_attendance_today', type: 'kpi_tile', kpiCode: 'hr.attendance_percent_today', title: 'Attendance Today', size: 1, permissionKey: 'hr.attendance.view', config: { format: 'percent' } },
          { id: 'hr_absenteeism', type: 'kpi_tile', kpiCode: 'hr.absenteeism_rate', title: 'Absenteeism Rate', size: 1, permissionKey: 'hr.attendance.view', config: { format: 'percent' } },
          { id: 'hr_pending_approvals', type: 'kpi_tile', kpiCode: 'hr.pending_leave_requests', title: 'Pending Leave Requests', size: 1, permissionKey: 'hr.leave.view' },
        ],
      },
    ],
  },
  
  procurement_manager: {
    roleCode: 'procurement_manager',
    roleName: 'Procurement Manager',
    description: 'Procurement pipeline and vendor management',
    mobileFirst: false,
    desktopFirst: true,
    bands: [
      {
        band: 'my_kpis',
        widgets: [
          { id: 'proc_mr_pending', type: 'kpi_tile', kpiCode: 'procure.mr_pending_count', title: 'MRs Pending', size: 1, permissionKey: 'procure.mr.view' },
          { id: 'proc_po_open', type: 'kpi_tile', kpiCode: 'procure.po_open_count', title: 'POs Open', size: 1, permissionKey: 'procure.po.view' },
          { id: 'proc_overdue_deliveries', type: 'kpi_tile', kpiCode: 'procure.overdue_deliveries_count', title: 'Overdue Deliveries', size: 1, permissionKey: 'procure.po.view', config: { status: 'warning' } },
          { id: 'proc_committed_value', type: 'kpi_tile', kpiCode: 'procure.committed_value', title: 'Committed Value', size: 1, permissionKey: 'procure.po.view', config: { format: 'currency' } },
        ],
      },
    ],
  },
  
  // Remaining roles would follow the same pattern...
  accounts_manager: { roleCode: 'accounts_manager', roleName: 'Accounts Manager', description: 'Financial transactions and reconciliations', mobileFirst: false, desktopFirst: true, bands: [] },
  commercial_manager: { roleCode: 'commercial_manager', roleName: 'Commercial Manager', description: 'Billing, claims, and contract management', mobileFirst: false, desktopFirst: true, bands: [] },
  quantity_surveyor: { roleCode: 'quantity_surveyor', roleName: 'Quantity Surveyor', description: 'Measurement and billing', mobileFirst: false, desktopFirst: true, bands: [] },
  plant_operator: { roleCode: 'plant_operator', roleName: 'Plant Operator', description: 'Equipment operation and maintenance', mobileFirst: true, desktopFirst: false, bands: [] },
  qa_qc_engineer: { roleCode: 'qa_qc_engineer', roleName: 'QA/QC Engineer', description: 'Quality inspections and testing', mobileFirst: true, desktopFirst: false, bands: [] },
  hse_officer: { roleCode: 'hse_officer', roleName: 'HSE Officer', description: 'Safety and environmental compliance', mobileFirst: true, desktopFirst: false, bands: [] },
  planning_engineer: { roleCode: 'planning_engineer', roleName: 'Planning Engineer', description: 'Scheduling and progress tracking', mobileFirst: false, desktopFirst: true, bands: [] },
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate role dashboard configuration at boot
 * Rule ROLE-06: Configuration referencing ungranted KPI is an error
 */
export function validateRoleDashboard(config: RoleDashboardConfig, availableKpis: Set<string>): string[] {
  const errors: string[] = [];
  
  for (const band of config.bands) {
    for (const widget of band.widgets) {
      if (widget.kpiCode && !availableKpis.has(widget.kpiCode)) {
        errors.push(`Role ${config.roleCode}: Widget ${widget.id} references unregistered KPI ${widget.kpiCode}`);
      }
    }
  }
  
  return errors;
}

/**
 * Validate role-specific restrictions
 */
export function validateRoleRestrictions(config: RoleDashboardConfig): string[] {
  const errors: string[] = [];
  
  // ROLE-02: Store Keeper sees quantities only, no rates/values
  if (config.roleCode === 'store_keeper') {
    for (const band of config.bands) {
      for (const widget of band.widgets) {
        if (widget.kpiCode?.includes('value') || widget.kpiCode?.includes('rate')) {
          errors.push(`Store Keeper dashboard contains value/rate KPI: ${widget.kpiCode}`);
        }
      }
    }
  }
  
  // ROLE-03: Site Engineer sees no rate/value/margin/payroll
  if (config.roleCode === 'site_engineer') {
    for (const band of config.bands) {
      for (const widget of band.widgets) {
        if (widget.kpiCode?.match(/rate|value|margin|payroll|salary/i)) {
          errors.push(`Site Engineer dashboard contains restricted KPI: ${widget.kpiCode}`);
        }
      }
    }
  }
  
  // ROLE-04: CFO dashboard is approve-and-review only
  if (config.roleCode === 'cfo') {
    for (const band of config.bands) {
      for (const widget of band.widgets) {
        if (widget.type === 'count_tile' && widget.config?.action?.match(/create|post|release|reconcile/i)) {
          errors.push(`CFO dashboard contains transactional action: ${widget.config.action}`);
        }
      }
    }
  }
  
  return errors;
}
