/**
 * Analytics Mock Data - Part 8
 * 
 * Mock data for EVM, Forecasting, Intelligence, Anomaly Detection, 
 * Reports, and Print/Export
 */

import type { 
  EVMMetrics, 
  EVMTimeSeries, 
  WBSBreakdown,
  Forecast,
  Insight,
  Anomaly,
  ReportDefinition,
  PrintTemplate
} from '../types/analytics';

// ─── EVM Data ────────────────────────────────────────────────────────────────

export const evmMetrics: EVMMetrics = {
  projectId: 1,
  projectName: 'Metro Line Extension',
  bac: 2450000000,
  pv: 1650000000,
  ev: 1580000000,
  ac: 1720000000,
  sv: -70000000,
  cv: -140000000,
  spi: 0.958,
  cpi: 0.919,
  eacCPI: 2666666667,
  eacRemaining: 2590000000,
  etc: 870000000,
  vac: -216666667,
  tcpi: 1.087,
  asOf: '2026-02-10T00:00:00Z',
  baselineAvailable: true
};

export const evmTimeSeries: EVMTimeSeries[] = [
  { period: '2025-04', pv: 200000000, ev: 195000000, ac: 210000000 },
  { period: '2025-05', pv: 420000000, ev: 400000000, ac: 435000000 },
  { period: '2025-06', pv: 650000000, ev: 620000000, ac: 680000000 },
  { period: '2025-07', pv: 880000000, ev: 840000000, ac: 920000000 },
  { period: '2025-08', pv: 1100000000, ev: 1050000000, ac: 1150000000 },
  { period: '2025-09', pv: 1300000000, ev: 1240000000, ac: 1360000000 },
  { period: '2025-10', pv: 1480000000, ev: 1410000000, ac: 1540000000 },
  { period: '2025-11', pv: 1650000000, ev: 1580000000, ac: 1720000000 },
  { period: '2025-12', pv: 1650000000, ev: 1580000000, ac: 1720000000, forecast: 1800000000 },
  { period: '2026-01', pv: 1650000000, ev: 1580000000, ac: 1720000000, forecast: 1950000000 },
  { period: '2026-02', pv: 1650000000, ev: 1580000000, ac: 1720000000, forecast: 2100000000 },
];

export const wbsBreakdown: WBSBreakdown[] = [
  {
    wbsCode: '1.1',
    wbsName: 'Foundation Work',
    pv: 450000000,
    ev: 445000000,
    ac: 460000000,
    sv: -5000000,
    cv: -15000000,
    spi: 0.989,
    cpi: 0.967,
    status: 'watch'
  },
  {
    wbsCode: '1.2',
    wbsName: 'Structural Work',
    pv: 680000000,
    ev: 650000000,
    ac: 720000000,
    sv: -30000000,
    cv: -70000000,
    spi: 0.956,
    cpi: 0.903,
    status: 'critical'
  },
  {
    wbsCode: '1.3',
    wbsName: 'Finishing Work',
    pv: 320000000,
    ev: 300000000,
    ac: 340000000,
    sv: -20000000,
    cv: -40000000,
    spi: 0.938,
    cpi: 0.882,
    status: 'critical'
  },
  {
    wbsCode: '2.1',
    wbsName: 'Electrical Works',
    pv: 120000000,
    ev: 115000000,
    ac: 125000000,
    sv: -5000000,
    cv: -10000000,
    spi: 0.958,
    cpi: 0.920,
    status: 'at_risk'
  },
  {
    wbsCode: '2.2',
    wbsName: 'Plumbing Works',
    pv: 80000000,
    ev: 75000000,
    ac: 75000000,
    sv: -5000000,
    cv: 0,
    spi: 0.938,
    cpi: 1.000,
    status: 'watch'
  }
];

// ─── Forecast Data ───────────────────────────────────────────────────────────

export const forecasts: Forecast[] = [
  {
    id: 1,
    type: 'completion_date',
    scopeId: 1,
    scopeType: 'project',
    methodName: 'SPI-Based Projection',
    methodDescription: 'Current Schedule Performance Index (0.958) applied to remaining work, adjusted for critical path constraints',
    inputs: [
      { name: 'Current SPI', value: 0.958, source: 'EVM Calculation' },
      { name: 'Remaining Work', value: '35%', source: 'WBS Analysis' },
      { name: 'Critical Path Slack', value: '12 days', source: 'Schedule Analysis' }
    ],
    pointEstimate: '2026-04-15',
    rangeLow: '2026-03-20',
    rangeHigh: '2026-05-10',
    confidence: 'medium',
    confidenceReason: 'Based on 8 months of historical performance data with stable SPI trend',
    horizon: 'To Completion',
    computedAt: '2026-02-10T00:00:00Z',
    unit: 'date'
  },
  {
    id: 2,
    type: 'cost_at_completion',
    scopeId: 1,
    scopeType: 'project',
    methodName: 'CPI-Based EAC',
    methodDescription: 'Budget at Completion divided by current Cost Performance Index',
    inputs: [
      { name: 'BAC', value: 2450000000, source: 'Approved Budget' },
      { name: 'Current CPI', value: 0.919, source: 'EVM Calculation' },
      { name: 'AC to Date', value: 1720000000, source: 'Cost Postings' }
    ],
    pointEstimate: 2666666667,
    rangeLow: 2590000000,
    rangeHigh: 2750000000,
    confidence: 'medium',
    confidenceReason: 'Based on 8 months of cost performance with moderate variance stability',
    horizon: 'To Completion',
    computedAt: '2026-02-10T00:00:00Z',
    unit: 'INR'
  },
  {
    id: 3,
    type: 'cash_inflow',
    scopeId: 1,
    scopeType: 'project',
    methodName: 'Billing & Collection Lag Analysis',
    methodDescription: 'Billing plan multiplied by historical certification lag (avg 15 days) and collection lag (avg 45 days)',
    inputs: [
      { name: 'Billing Plan (90 days)', value: 450000000, source: 'Billing Schedule' },
      { name: 'Avg Certification Lag', value: '15 days', source: 'Historical Data' },
      { name: 'Avg Collection Lag', value: '45 days', source: 'Receivables History' }
    ],
    pointEstimate: 320000000,
    rangeLow: 280000000,
    rangeHigh: 360000000,
    confidence: 'high',
    confidenceReason: 'Based on 12 months of consistent billing and collection patterns',
    horizon: '90 Days',
    computedAt: '2026-02-10T00:00:00Z',
    unit: 'INR'
  },
  {
    id: 4,
    type: 'material_requirement',
    scopeId: 1,
    scopeType: 'material',
    methodName: 'BOQ Consumption Norm Analysis',
    methodDescription: 'Remaining BOQ quantities multiplied by consumption norms, net of current stock and incoming POs',
    inputs: [
      { name: 'Material', value: 'TMT 16mm', source: 'BOQ' },
      { name: 'Remaining Quantity', value: '180 MT', source: 'BOQ Analysis' },
      { name: 'Current Stock', value: '45 MT', source: 'Stock Ledger' },
      { name: 'Incoming POs', value: '60 MT', source: 'Purchase Orders' }
    ],
    pointEstimate: 75,
    rangeLow: 70,
    rangeHigh: 80,
    confidence: 'high',
    confidenceReason: 'Based on detailed BOQ quantities and confirmed PO deliveries',
    horizon: '60 Days',
    computedAt: '2026-02-10T00:00:00Z',
    unit: 'MT'
  }
];

// ─── Cross-Module Intelligence ───────────────────────────────────────────────

export const insights: Insight[] = [
  {
    id: 1,
    type: 'material_availability',
    title: 'Material Shortage Risk',
    finding: 'Work front B will stall in 6 days — TMT 16mm stock insufficient for planned work',
    evidence: [
      { label: 'Current Stock', value: 45, unit: 'MT' },
      { label: 'Daily Consumption', value: 12, unit: 'MT/day' },
      { label: 'Days of Cover', value: 3.75, unit: 'days' },
      { label: 'Incoming PO', value: 60, unit: 'MT (due in 8 days)' }
    ],
    affectedRecords: [
      { entityType: 'stock', entityId: 123, entityNumber: 'STK-TMT16-001', route: '/materials/stock/123' },
      { entityType: 'purchase_order', entityId: 456, entityNumber: 'PO-2026-00456', route: '/procurement/po/456' }
    ],
    recommendedAction: 'Expedite PO-2026-00456 delivery or arrange emergency procurement',
    actionRoute: '/procurement/po/456',
    severity: 'critical',
    projectId: 1,
    computedAt: '2026-02-10T12:00:00Z'
  },
  {
    id: 2,
    type: 'billing_gap',
    title: 'Certified Work Unbilled',
    finding: '₹1.4 Cr of certified work is unbilled for over 45 days',
    evidence: [
      { label: 'Certified Value', value: 14000000, unit: 'INR' },
      { label: 'Days Since Certification', value: 47, unit: 'days' },
      { label: 'MB Entries', value: 12, unit: 'entries' }
    ],
    affectedRecords: [
      { entityType: 'measurement_book', entityId: 789, entityNumber: 'MB-2026-00789', route: '/execution/mb/789' },
      { entityType: 'measurement_book', entityId: 790, entityNumber: 'MB-2026-00790', route: '/execution/mb/790' }
    ],
    recommendedAction: 'Prepare RA bill for certified MB entries to improve cash flow',
    actionRoute: '/billing/ra-bills/new',
    severity: 'warning',
    projectId: 1,
    computedAt: '2026-02-10T12:00:00Z'
  },
  {
    id: 3,
    type: 'cost_per_unit',
    title: 'Excavation Cost Overrun',
    finding: 'Excavation is running 18% above estimated rate',
    evidence: [
      { label: 'BOQ Rate', value: 450, unit: 'INR/CUM' },
      { label: 'Actual Rate', value: 531, unit: 'INR/CUM' },
      { label: 'Variance', value: 18, unit: '%' },
      { label: 'Quantity Executed', value: 12500, unit: 'CUM' }
    ],
    affectedRecords: [
      { entityType: 'activity', entityId: 101, entityNumber: 'ACT-EXC-001', route: '/execution/activities/101' }
    ],
    recommendedAction: 'Review excavation methodology and equipment utilization',
    actionRoute: '/execution/activities/101',
    severity: 'warning',
    projectId: 1,
    computedAt: '2026-02-10T12:00:00Z'
  },
  {
    id: 4,
    type: 'manpower_productivity',
    title: 'Productivity Decline',
    finding: 'Manpower up 12%, progress flat — productivity falling',
    evidence: [
      { label: 'Manpower Increase', value: 12, unit: '%' },
      { label: 'Progress This Month', value: 2.1, unit: '%' },
      { label: 'Progress Last Month', value: 2.3, unit: '%' },
      { label: 'Output per Manday', value: 0.85, unit: 'CUM' }
    ],
    affectedRecords: [
      { entityType: 'attendance', entityId: 201, entityNumber: 'ATT-FEB-2026', route: '/hr/attendance/201' }
    ],
    recommendedAction: 'Investigate work front efficiency and supervision quality',
    actionRoute: '/hr/attendance/201',
    severity: 'warning',
    projectId: 1,
    computedAt: '2026-02-10T12:00:00Z'
  },
  {
    id: 5,
    type: 'vendor_performance',
    title: 'Vendor Quality Issue',
    finding: 'Cheapest vendor has 22% rejection rate — true cost is higher',
    evidence: [
      { label: 'Vendor', value: 'ABC Steel Ltd', unit: '' },
      { label: 'Quoted Rate', value: 52000, unit: 'INR/MT' },
      { label: 'Rejection Rate', value: 22, unit: '%' },
      { label: 'Effective Cost', value: 66667, unit: 'INR/MT (adjusted)' }
    ],
    affectedRecords: [
      { entityType: 'vendor', entityId: 301, entityNumber: 'V-ABC-001', route: '/vendors/301' },
      { entityType: 'grn', entityId: 401, entityNumber: 'GRN-2026-00401', route: '/materials/grn/401' }
    ],
    recommendedAction: 'Consider alternative vendors despite higher quoted rates',
    actionRoute: '/vendors/301',
    severity: 'warning',
    projectId: 1,
    computedAt: '2026-02-10T12:00:00Z'
  },
  {
    id: 6,
    type: 'cash_gap',
    title: 'Projected Cash Shortfall',
    finding: 'Projected shortfall of ₹2.1 Cr in week 6',
    evidence: [
      { label: 'Expected Inflow', value: 32000000, unit: 'INR' },
      { label: 'Expected Outflow', value: 53000000, unit: 'INR' },
      { label: 'Net Position', value: -21000000, unit: 'INR' },
      { label: 'Current Balance', value: 45000000, unit: 'INR' }
    ],
    affectedRecords: [
      { entityType: 'payment', entityId: 501, entityNumber: 'PAY-FEB-W6', route: '/finance/payments/501' }
    ],
    recommendedAction: 'Accelerate receivables collection or arrange short-term financing',
    actionRoute: '/finance/cash-flow',
    severity: 'critical',
    projectId: 1,
    computedAt: '2026-02-10T12:00:00Z'
  }
];

// ─── Anomaly Detection ───────────────────────────────────────────────────────

export const anomalies: Anomaly[] = [
  {
    id: 1,
    category: 'transactional',
    type: 'rate_variance',
    title: 'PO Rate Significantly Above Historical',
    description: 'Purchase order rate for TMT 25mm is 34% above the last 5 purchases of the same material',
    baseline: 'Avg rate last 5 POs: ₹58,500/MT',
    actualValue: 78400,
    deviation: '+34%',
    deviationPercent: 34,
    entityType: 'purchase_order',
    entityId: 601,
    entityNumber: 'PO-2026-00601',
    projectId: 1,
    detectedAt: '2026-02-10T08:30:00Z',
    severity: 'high',
    status: 'open'
  },
  {
    id: 2,
    category: 'operational',
    type: 'consumption_deviation',
    title: 'Cement Consumption Above Norm',
    description: 'Cement consumption for M25 concrete is 18% above standard consumption norm',
    baseline: 'Standard norm: 6.5 bags/CUM',
    actualValue: 7.67,
    deviation: '+18%',
    deviationPercent: 18,
    entityType: 'rmc_batch',
    entityId: 701,
    entityNumber: 'BATCH-2026-00701',
    projectId: 1,
    detectedAt: '2026-02-10T09:15:00Z',
    severity: 'medium',
    status: 'open'
  },
  {
    id: 3,
    category: 'transactional',
    type: 'round_number_pattern',
    title: 'Suspicious Round Number in Measurement',
    description: 'MB entry shows exact round number (100.00 CUM) suggesting estimation rather than measurement',
    baseline: 'Typical measurements vary by ±15%',
    actualValue: '100.00 CUM (exact)',
    deviation: 'Exact round number',
    entityType: 'measurement_book',
    entityId: 801,
    entityNumber: 'MB-2026-00801',
    projectId: 1,
    detectedAt: '2026-02-10T10:00:00Z',
    severity: 'medium',
    status: 'open'
  },
  {
    id: 4,
    category: 'operational',
    type: 'fuel_consumption_anomaly',
    title: 'Excavator Fuel Consumption High',
    description: 'Excavator EX-001 fuel consumption is 28% above normal for operating hours',
    baseline: 'Normal: 12 L/hr',
    actualValue: 15.36,
    deviation: '+28%',
    deviationPercent: 28,
    entityType: 'equipment',
    entityId: 901,
    entityNumber: 'EX-001',
    projectId: 1,
    detectedAt: '2026-02-10T11:30:00Z',
    severity: 'low',
    status: 'open'
  },
  {
    id: 5,
    category: 'transactional',
    type: 'duplicate_document',
    title: 'Potential Duplicate GRN',
    description: 'GRN has same vendor, amount, and date as GRN-2026-00501',
    baseline: 'No duplicate expected',
    actualValue: 'GRN-2026-00502',
    deviation: 'Duplicate detected',
    entityType: 'grn',
    entityId: 1002,
    entityNumber: 'GRN-2026-00502',
    projectId: 1,
    detectedAt: '2026-02-10T12:00:00Z',
    severity: 'high',
    status: 'open'
  }
];

// ─── Standard Reports ────────────────────────────────────────────────────────

export const standardReports: ReportDefinition[] = [
  {
    id: 1,
    name: 'Project Status Report',
    description: 'Comprehensive project status with progress, cost, and schedule metrics',
    dataSource: 'projects',
    columns: [
      { field: 'projectCode', label: 'Project Code', type: 'text', visible: true },
      { field: 'projectName', label: 'Project Name', type: 'text', visible: true },
      { field: 'progressPercent', label: 'Progress %', type: 'percent', visible: true },
      { field: 'budget', label: 'Budget', type: 'currency', visible: true },
      { field: 'actualCost', label: 'Actual Cost', type: 'currency', visible: true },
      { field: 'variance', label: 'Variance', type: 'currency', visible: true },
      { field: 'status', label: 'Status', type: 'text', visible: true }
    ],
    filters: [
      { field: 'status', operator: 'in', value: ['active', 'on_hold'], isRuntime: true }
    ],
    sortBy: [{ field: 'projectCode', direction: 'asc' }],
    visualization: 'both',
    chartType: 'bar',
    isShared: true,
    createdBy: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Procurement Register',
    description: 'All purchase orders with status and delivery tracking',
    dataSource: 'purchase_orders',
    columns: [
      { field: 'poNumber', label: 'PO Number', type: 'text', visible: true },
      { field: 'vendor', label: 'Vendor', type: 'text', visible: true },
      { field: 'orderDate', label: 'Order Date', type: 'date', visible: true },
      { field: 'deliveryDate', label: 'Delivery Date', type: 'date', visible: true },
      { field: 'amount', label: 'Amount', type: 'currency', visible: true },
      { field: 'status', label: 'Status', type: 'text', visible: true },
      { field: 'grnReceived', label: 'GRN Received', type: 'text', visible: true }
    ],
    filters: [
      { field: 'orderDate', operator: 'between', value: ['2026-01-01', '2026-12-31'], isRuntime: true }
    ],
    sortBy: [{ field: 'orderDate', direction: 'desc' }],
    visualization: 'table',
    isShared: true,
    createdBy: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Stock Ledger',
    description: 'Current stock position for all materials',
    dataSource: 'stock',
    columns: [
      { field: 'materialCode', label: 'Material Code', type: 'text', visible: true },
      { field: 'materialName', label: 'Material Name', type: 'text', visible: true },
      { field: 'store', label: 'Store', type: 'text', visible: true },
      { field: 'quantity', label: 'Quantity', type: 'number', visible: true },
      { field: 'uom', label: 'UOM', type: 'text', visible: true },
      { field: 'value', label: 'Value', type: 'currency', visible: true },
      { field: 'reorderLevel', label: 'Reorder Level', type: 'number', visible: true }
    ],
    filters: [
      { field: 'quantity', operator: 'greater_than', value: 0, isRuntime: false }
    ],
    aggregations: [
      { field: 'value', type: 'sum', label: 'Total Stock Value', showSubtotals: true }
    ],
    visualization: 'table',
    isShared: true,
    createdBy: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  }
];

// ─── Print Templates ─────────────────────────────────────────────────────────

export const printTemplates: PrintTemplate[] = [
  {
    id: 1,
    entityType: 'purchase_order',
    name: 'Standard PO Template',
    description: 'Standard purchase order format with company letterhead',
    layout: {},
    headerConfig: {
      showCompanyLogo: true,
      showCompanyName: true,
      showDocumentNumber: true,
      showProjectInfo: true,
      showPrintTimestamp: true,
      showPrintedBy: true
    },
    footerConfig: {
      showPageNumbers: true,
      showConfidential: true,
      customText: 'This is a system-generated document'
    },
    signatureBlock: true,
    qrCode: true,
    isActive: true,
    createdBy: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 2,
    entityType: 'ra_bill',
    name: 'RA Bill Template',
    description: 'Running account bill format with measurement details',
    layout: {},
    headerConfig: {
      showCompanyLogo: true,
      showCompanyName: true,
      showDocumentNumber: true,
      showProjectInfo: true,
      showPrintTimestamp: true,
      showPrintedBy: true
    },
    footerConfig: {
      showPageNumbers: true,
      showConfidential: true
    },
    signatureBlock: true,
    qrCode: true,
    isActive: true,
    createdBy: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];
