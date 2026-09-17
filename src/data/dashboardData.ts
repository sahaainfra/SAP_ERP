/**
 * Dashboard Data - Part 6
 * 
 * Mock data for role-based dashboards, Project 360, and object pages
 */

import type { 
  DashboardRole, 
  MyWorkCounts, 
  AttentionAlert,
  Project360Data,
  HealthScore,
  ObjectPageData,
} from '../types/dashboard';
import type { KpiValue, KpiStatus } from '../types/realtime';

// Helper function to create KPI values
function createKpi(
  kpiKey: string,
  value: number,
  options: {
    previousValue?: number;
    target?: number | null;
    variance?: number | null;
    variancePercent?: number | null;
    trend?: 'up' | 'down' | 'stable';
    status?: KpiStatus;
    unit?: string;
  } = {}
): KpiValue {
  return {
    kpiKey,
    value,
    previousValue: options.previousValue ?? value,
    target: options.target ?? null,
    variance: options.variance ?? null,
    variancePercent: options.variancePercent ?? null,
    trend: options.trend ?? 'stable',
    status: options.status ?? 'neutral',
    unit: options.unit ?? '',
    asOf: '2026-02-10T12:00:00Z',
    isPartial: false,
    computeMs: Math.floor(Math.random() * 50) + 30,
    rowCount: 1,
    fromCache: false,
    cacheAgeSeconds: 0,
  };
}

// ─── My Work Counts ──────────────────────────────────────────────────────────

export const myWorkCounts: MyWorkCounts = {
  approvalsPending: 7,
  tasksDue: 12,
  overdueItems: 3,
  draftDocuments: 4,
};

// ─── Attention Alerts ────────────────────────────────────────────────────────

export const attentionAlerts: AttentionAlert[] = [
  {
    id: 1,
    severity: 'critical',
    title: 'Budget Overrun',
    message: 'Project Metro Line Extension is 15% over budget',
    entityType: 'project',
    entityId: 1,
    raisedAt: '2026-02-10T08:30:00Z',
    actionLabel: 'Review',
    actionRoute: '/projects/1/360',
  },
  {
    id: 2,
    severity: 'high',
    title: 'Overdue Deliveries',
    message: '5 purchase orders are overdue for delivery',
    entityType: 'purchase_order',
    entityId: 0,
    raisedAt: '2026-02-10T09:15:00Z',
    actionLabel: 'View POs',
    actionRoute: '/procurement/po?status=overdue',
  },
  {
    id: 3,
    severity: 'high',
    title: 'Safety Incident',
    message: 'Near-miss incident reported at Site B',
    entityType: 'incident',
    entityId: 45,
    raisedAt: '2026-02-10T10:00:00Z',
    actionLabel: 'Investigate',
    actionRoute: '/safety/incidents/45',
  },
  {
    id: 4,
    severity: 'medium',
    title: 'Low Stock Alert',
    message: 'Cement stock below reorder level at Store 1',
    entityType: 'stock',
    entityId: 12,
    raisedAt: '2026-02-10T11:30:00Z',
    actionLabel: 'Check Stock',
    actionRoute: '/materials/stock?below_reorder=true',
  },
  {
    id: 5,
    severity: 'medium',
    title: 'Approval Pending',
    message: '3 purchase requisitions awaiting your approval',
    entityType: 'purchase_requisition',
    entityId: 0,
    raisedAt: '2026-02-10T12:00:00Z',
    actionLabel: 'Approve',
    actionRoute: '/approvals?pending=true',
  },
];

// ─── Health Score ────────────────────────────────────────────────────────────

export const defaultHealthScore: HealthScore = {
  overall: 72,
  band: 'Watch',
  components: [
    { name: 'Schedule Performance', weight: 20, score: 68, status: 'warning', drillRoute: '/projects/1/schedule' },
    { name: 'Cost Performance', weight: 20, score: 65, status: 'warning', drillRoute: '/projects/1/cost' },
    { name: 'Billing Performance', weight: 15, score: 80, status: 'good', drillRoute: '/projects/1/billing' },
    { name: 'Collection Performance', weight: 10, score: 75, status: 'good', drillRoute: '/projects/1/receivables' },
    { name: 'Quality', weight: 10, score: 85, status: 'good', drillRoute: '/projects/1/quality' },
    { name: 'Safety', weight: 10, score: 90, status: 'good', drillRoute: '/projects/1/safety' },
    { name: 'Material Efficiency', weight: 5, score: 70, status: 'warning', drillRoute: '/projects/1/materials' },
    { name: 'Manpower Productivity', weight: 5, score: 78, status: 'good', drillRoute: '/projects/1/manpower' },
    { name: 'Approval Efficiency', weight: 5, score: 82, status: 'good', drillRoute: '/projects/1/approvals' },
  ],
  trend: [
    { period: 'Sep 2025', score: 78 },
    { period: 'Oct 2025', score: 75 },
    { period: 'Nov 2025', score: 73 },
    { period: 'Dec 2025', score: 70 },
    { period: 'Jan 2026', score: 71 },
    { period: 'Feb 2026', score: 72 },
  ],
};

// ─── Project 360 Data ────────────────────────────────────────────────────────

export const project360Data: Project360Data = {
  header: {
    projectId: 1,
    projectCode: 'PRJ-001',
    projectName: 'Metro Line Extension',
    client: 'City Metro Authority',
    location: 'Downtown Corridor',
    projectType: 'Infrastructure',
    startDate: '2024-03-01',
    endDate: '2026-12-31',
    contractValue: 2450000000,
    revisedValue: 2695000000,
    projectManager: 'Sarah Chen',
    status: 'active',
    healthScore: 72,
    healthBand: 'Watch',
    daysElapsed: 710,
    daysRemaining: 325,
  },
  healthScore: defaultHealthScore,
  sections: [
    {
      key: 'contract',
      title: 'Contract',
      icon: 'file-text',
      kpis: [
        createKpi('contract.original_value', 2450000000, { unit: 'INR' }),
        createKpi('contract.revised_value', 2695000000, { previousValue: 2450000000, trend: 'up', unit: 'INR' }),
        createKpi('contract.executed_value', 1650000000, { previousValue: 1600000000, trend: 'up', unit: 'INR' }),
      ],
      drillRoute: '/projects/1/contract',
    },
    {
      key: 'execution',
      title: 'Execution',
      icon: 'hard-hat',
      kpis: [
        createKpi('execution.planned_progress', 75, { target: 100, unit: '%' }),
        createKpi('execution.actual_progress', 68, { target: 100, status: 'warning', unit: '%' }),
        createKpi('execution.schedule_variance', -7, { target: 0, variance: -7, trend: 'down', status: 'warning', unit: 'days' }),
      ],
      drillRoute: '/projects/1/execution',
    },
    {
      key: 'procurement',
      title: 'Procurement',
      icon: 'shopping-cart',
      kpis: [
        createKpi('procurement.po_count', 145, { trend: 'up' }),
        createKpi('procurement.po_value', 1250000000, { trend: 'up', unit: 'INR' }),
        createKpi('procurement.overdue_pos', 5, { target: 0, variance: 5, trend: 'up', status: 'critical' }),
      ],
      drillRoute: '/projects/1/procurement',
    },
    {
      key: 'material',
      title: 'Material',
      icon: 'package',
      kpis: [
        createKpi('material.stock_value', 85000000, { unit: 'INR' }),
        createKpi('material.below_reorder', 8, { target: 0, variance: 8, trend: 'up', status: 'warning' }),
        createKpi('material.negative_stock', 0, { target: 0, variance: 0, status: 'good' }),
      ],
      drillRoute: '/projects/1/materials',
    },
    {
      key: 'manpower',
      title: 'Manpower',
      icon: 'users',
      kpis: [
        createKpi('manpower.deployed_today', 245, { target: 260, variance: -15, variancePercent: -5.8, status: 'warning' }),
        createKpi('manpower.attendance', 94, { target: 100, variance: -6, variancePercent: -6, status: 'good', unit: '%' }),
        createKpi('manpower.overtime_hours', 120, { target: 100, variance: 20, variancePercent: 20, trend: 'up', status: 'warning', unit: 'hrs' }),
      ],
      drillRoute: '/projects/1/manpower',
    },
    {
      key: 'plant',
      title: 'Plant',
      icon: 'truck',
      kpis: [
        createKpi('plant.deployed', 32),
        createKpi('plant.utilization', 78, { target: 85, variance: -7, variancePercent: -8.2, trend: 'down', status: 'warning', unit: '%' }),
        createKpi('plant.breakdown_hours', 24, { target: 10, variance: 14, variancePercent: 140, trend: 'up', status: 'critical', unit: 'hrs' }),
      ],
      drillRoute: '/projects/1/plant',
    },
    {
      key: 'quality',
      title: 'Quality',
      icon: 'check-circle',
      kpis: [
        createKpi('quality.wir_pass_rate', 92, { target: 95, variance: -3, variancePercent: -3.2, status: 'warning', unit: '%' }),
        createKpi('quality.ncr_open', 12, { target: 5, variance: 7, variancePercent: 140, trend: 'up', status: 'critical' }),
        createKpi('quality.test_failure_rate', 3.5, { target: 2, variance: 1.5, variancePercent: 75, trend: 'up', status: 'warning', unit: '%' }),
      ],
      drillRoute: '/projects/1/quality',
    },
    {
      key: 'hse',
      title: 'HSE',
      icon: 'shield',
      kpis: [
        createKpi('hse.days_without_lti', 145, { trend: 'up', status: 'good', unit: 'days' }),
        createKpi('hse.incidents', 2, { target: 0, variance: 2, trend: 'up', status: 'warning' }),
        createKpi('hse.observations_closed', 88, { target: 95, variance: -7, variancePercent: -7.4, trend: 'down', status: 'warning', unit: '%' }),
      ],
      drillRoute: '/projects/1/hse',
    },
    {
      key: 'commercial',
      title: 'Commercial',
      icon: 'dollar-sign',
      kpis: [
        createKpi('commercial.bills_raised', 1450000000, { target: 1650000000, variance: -200000000, variancePercent: -12.1, status: 'warning', unit: 'INR' }),
        createKpi('commercial.bills_certified', 1380000000, { trend: 'up', unit: 'INR' }),
        createKpi('commercial.receivables', 285000000, { target: 200000000, variance: 85000000, variancePercent: 42.5, trend: 'up', status: 'critical', unit: 'INR' }),
      ],
      drillRoute: '/projects/1/commercial',
    },
    {
      key: 'finance',
      title: 'Finance',
      icon: 'landmark',
      kpis: [
        createKpi('finance.budget', 2695000000, { unit: 'INR' }),
        createKpi('finance.actual_cost', 1720000000, { trend: 'up', unit: 'INR' }),
        createKpi('finance.cost_variance', -70000000, { target: 0, variance: -70000000, trend: 'down', status: 'critical', unit: 'INR' }),
      ],
      drillRoute: '/projects/1/finance',
    },
  ],
};

// ─── Object Page Data (Purchase Order Example) ───────────────────────────────

export const purchaseOrderObjectPage: ObjectPageData = {
  header: {
    objectType: 'purchase_order',
    objectNumber: 'PO-2026-00123',
    title: 'Steel Reinforcement Bars - Grade Fe500',
    status: 'approved',
    keyFacts: [
      { label: 'Vendor', value: 'Tata Steel Ltd' },
      { label: 'Amount', value: '₹2,45,00,000' },
      { label: 'Order Date', value: '15-Jan-2026' },
      { label: 'Delivery Date', value: '28-Feb-2026' },
      { label: 'Project', value: 'Metro Line Extension' },
      { label: 'Site', value: 'Site A - Downtown' },
    ],
    actions: [
      { key: 'receive', label: 'Record GRN', variant: 'primary', icon: 'package-check' },
      { key: 'amend', label: 'Amend PO', variant: 'secondary', icon: 'edit' },
      { key: 'cancel', label: 'Cancel PO', variant: 'danger', icon: 'x-circle', requiresConfirmation: true, confirmationMessage: 'Type PO number to confirm cancellation' },
    ],
  },
  sections: [
    {
      key: 'general',
      title: 'General Information',
      icon: 'info',
      content: {
        poNumber: 'PO-2026-00123',
        vendor: 'Tata Steel Ltd',
        vendorCode: 'V-001',
        project: 'Metro Line Extension',
        site: 'Site A - Downtown',
        orderDate: '2026-01-15',
        deliveryDate: '2026-02-28',
        paymentTerms: '30 days from GRN',
        deliveryTerms: 'FOB Destination',
      },
      hasPermission: true,
    },
    {
      key: 'line_items',
      title: 'Line Items',
      icon: 'list',
      content: [
        { item: 'TMT Bar 12mm', quantity: 50, uom: 'MT', rate: 55000, amount: 2750000 },
        { item: 'TMT Bar 16mm', quantity: 80, uom: 'MT', rate: 55000, amount: 4400000 },
        { item: 'TMT Bar 20mm', quantity: 120, uom: 'MT', rate: 55000, amount: 6600000 },
        { item: 'TMT Bar 25mm', quantity: 150, uom: 'MT', rate: 55000, amount: 8250000 },
      ],
      hasPermission: true,
    },
    {
      key: 'financial',
      title: 'Financial Summary',
      icon: 'dollar-sign',
      content: {
        basicValue: 22000000,
        gst: 3960000,
        totalValue: 25960000,
        tdsDeducted: 490000,
        netPayable: 25470000,
      },
      hasPermission: true,
    },
    {
      key: 'schedule',
      title: 'Delivery Schedule',
      icon: 'calendar',
      content: [
        { deliveryDate: '2026-02-15', item: 'TMT Bar 12mm', quantity: 50, status: 'pending' },
        { deliveryDate: '2026-02-20', item: 'TMT Bar 16mm', quantity: 80, status: 'pending' },
        { deliveryDate: '2026-02-25', item: 'TMT Bar 20mm', quantity: 120, status: 'pending' },
        { deliveryDate: '2026-02-28', item: 'TMT Bar 25mm', quantity: 150, status: 'pending' },
      ],
      hasPermission: true,
    },
  ],
  approvalHistory: [
    {
      id: 1,
      approver: 'Lisa Anderson',
      action: 'Approved',
      timestamp: '2026-01-14T15:30:00Z',
      comment: 'Approved within budget allocation',
      slaMet: true,
    },
    {
      id: 2,
      approver: 'Sarah Chen',
      action: 'Recommended',
      timestamp: '2026-01-13T11:20:00Z',
      comment: 'Vendor quoted competitive rates',
      slaMet: true,
    },
    {
      id: 3,
      approver: 'Mike Johnson',
      action: 'Created',
      timestamp: '2026-01-12T09:45:00Z',
      slaMet: true,
    },
  ],
  auditTrail: [
    {
      id: 1,
      user: 'Lisa Anderson',
      action: 'Approved',
      timestamp: '2026-01-14T15:30:00Z',
      field: 'status',
      oldValue: 'pending_approval',
      newValue: 'approved',
    },
    {
      id: 2,
      user: 'Sarah Chen',
      action: 'Recommended',
      timestamp: '2026-01-13T11:20:00Z',
      field: 'status',
      oldValue: 'pending_recommendation',
      newValue: 'pending_approval',
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'Created',
      timestamp: '2026-01-12T09:45:00Z',
      field: undefined,
      oldValue: undefined,
      newValue: 'draft',
    },
  ],
  documentChain: [
    {
      id: 1,
      type: 'material_requisition',
      number: 'MR-2026-00456',
      status: 'approved',
      value: 22000000,
      date: '2026-01-10',
      route: '/materials/mr/456',
      hasAccess: true,
    },
    {
      id: 2,
      type: 'purchase_requisition',
      number: 'PR-2026-00789',
      status: 'approved',
      value: 22000000,
      date: '2026-01-11',
      route: '/procurement/pr/789',
      hasAccess: true,
    },
    {
      id: 3,
      type: 'purchase_order',
      number: 'PO-2026-00123',
      status: 'approved',
      value: 25960000,
      date: '2026-01-15',
      route: '/procurement/po/123',
      hasAccess: true,
    },
    {
      id: 4,
      type: 'grn',
      number: 'GRN-2026-00234',
      status: 'pending',
      value: undefined,
      date: '2026-02-15',
      route: '/materials/grn/234',
      hasAccess: true,
    },
  ],
};

// ─── Role Dashboard Configurations ───────────────────────────────────────────

export const roleDashboardConfigs: Record<DashboardRole, { name: string; widgetCount: number }> = {
  super_admin: { name: 'Super Admin Dashboard', widgetCount: 15 },
  director: { name: 'Director Dashboard', widgetCount: 18 },
  project_manager: { name: 'Project Manager Dashboard', widgetCount: 16 },
  site_engineer: { name: 'Site Engineer Dashboard', widgetCount: 12 },
  procurement_manager: { name: 'Procurement Manager Dashboard', widgetCount: 14 },
  store_keeper: { name: 'Store Keeper Dashboard', widgetCount: 10 },
  billing_engineer: { name: 'Billing Engineer Dashboard', widgetCount: 12 },
  commercial_manager: { name: 'Commercial Manager Dashboard', widgetCount: 13 },
  finance_manager: { name: 'Finance Manager Dashboard', widgetCount: 14 },
  hr_manager: { name: 'HR Manager Dashboard', widgetCount: 11 },
  attendance_manager: { name: 'Attendance Manager Dashboard', widgetCount: 9 },
  plant_manager: { name: 'Plant Manager Dashboard', widgetCount: 12 },
  rmc_manager: { name: 'RMC Manager Dashboard', widgetCount: 10 },
  qa_qc_manager: { name: 'QA/QC Manager Dashboard', widgetCount: 11 },
  hse_manager: { name: 'HSE Manager Dashboard', widgetCount: 12 },
  project_portfolio: { name: 'Project Portfolio Dashboard', widgetCount: 8 },
};
