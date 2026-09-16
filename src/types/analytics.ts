/**
 * Analytics Types - Part 8
 * 
 * Type definitions for EVM, Forecasting, Intelligence, Anomaly Detection, 
 * AI Copilot, Reports, and Print/Export
 */

// ─── Earned Value Management ─────────────────────────────────────────────────

export interface EVMMetrics {
  projectId: number;
  projectName: string;
  bac: number; // Budget at Completion
  pv: number; // Planned Value
  ev: number; // Earned Value
  ac: number; // Actual Cost
  sv: number; // Schedule Variance (EV - PV)
  cv: number; // Cost Variance (EV - AC)
  spi: number; // Schedule Performance Index (EV / PV)
  cpi: number; // Cost Performance Index (EV / AC)
  eacCPI: number; // Estimate at Completion (CPI-based: BAC / CPI)
  eacRemaining: number; // Estimate at Completion (AC + remaining at budget rate)
  etc: number; // Estimate to Complete (EAC - AC)
  vac: number; // Variance at Completion (BAC - EAC)
  tcpi: number; // To-Complete Performance Index
  asOf: string;
  baselineAvailable: boolean;
}

export interface EVMTimeSeries {
  period: string;
  pv: number;
  ev: number;
  ac: number;
  forecast?: number;
}

export interface WBSBreakdown {
  wbsCode: string;
  wbsName: string;
  pv: number;
  ev: number;
  ac: number;
  sv: number;
  cv: number;
  spi: number;
  cpi: number;
  status: 'good' | 'watch' | 'at_risk' | 'critical';
}

// ─── Forecasting ─────────────────────────────────────────────────────────────

export type ForecastType = 
  | 'completion_date'
  | 'cost_at_completion'
  | 'cash_inflow'
  | 'cash_outflow'
  | 'material_requirement'
  | 'manpower_requirement'
  | 'receivable_collection'
  | 'stock_out_risk';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Forecast {
  id: number;
  type: ForecastType;
  scopeId: number;
  scopeType: 'project' | 'portfolio' | 'material';
  methodName: string;
  methodDescription: string;
  inputs: ForecastInput[];
  pointEstimate: number | string;
  rangeLow?: number | string;
  rangeHigh?: number | string;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  horizon: string;
  computedAt: string;
  unit: string;
}

export interface ForecastInput {
  name: string;
  value: string | number;
  source: string;
}

export interface ForecastAccuracy {
  forecastId: number;
  forecastDate: string;
  actualDate: string;
  forecastValue: number;
  actualValue: number;
  variance: number;
  variancePercent: number;
  accuracy: number;
}

// ─── Cross-Module Intelligence ───────────────────────────────────────────────

export type InsightType =
  | 'material_availability'
  | 'procurement_lead_time'
  | 'billing_gap'
  | 'cost_per_unit'
  | 'manpower_productivity'
  | 'plant_idle'
  | 'quality_rework'
  | 'vendor_performance'
  | 'cash_gap'
  | 'approval_delay';

export interface Insight {
  id: number;
  type: InsightType;
  title: string;
  finding: string;
  evidence: InsightEvidence[];
  affectedRecords: AffectedRecord[];
  recommendedAction: string;
  actionRoute: string;
  severity: 'info' | 'warning' | 'critical';
  projectId?: number;
  computedAt: string;
}

export interface InsightEvidence {
  label: string;
  value: string | number;
  unit?: string;
}

export interface AffectedRecord {
  entityType: string;
  entityId: number;
  entityNumber: string;
  route: string;
}

// ─── Anomaly Detection ───────────────────────────────────────────────────────

export type AnomalyCategory = 'transactional' | 'behavioural' | 'operational';
export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface Anomaly {
  id: number;
  category: AnomalyCategory;
  type: string;
  title: string;
  description: string;
  baseline: string;
  actualValue: string | number;
  deviation: string;
  deviationPercent?: number;
  entityType?: string;
  entityId?: number;
  entityNumber?: string;
  projectId?: number;
  detectedAt: string;
  severity: AnomalySeverity;
  status: 'open' | 'dismissed' | 'resolved';
  dismissedBy?: number;
  dismissedAt?: string;
  dismissalReason?: string;
  resolvedAt?: string;
}

// ─── AI Copilot ──────────────────────────────────────────────────────────────

export interface CopilotMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: CopilotSource[];
  query?: string;
  dataScope?: {
    projectId?: number;
    companyName?: string;
  };
}

export interface CopilotSource {
  type: string;
  label: string;
  count?: number;
  route?: string;
}

export interface CopilotSession {
  id: string;
  userId: number;
  startedAt: string;
  messages: CopilotMessage[];
  disclaimerShown: boolean;
}

// ─── Report Builder ──────────────────────────────────────────────────────────

export type ReportDataSource = 
  | 'projects'
  | 'purchase_orders'
  | 'vendors'
  | 'stock'
  | 'ra_bills'
  | 'receivables'
  | 'payables'
  | 'attendance'
  | 'plant'
  | 'quality'
  | 'safety';

export type AggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max';

export interface ReportDefinition {
  id: number;
  name: string;
  description?: string;
  dataSource: ReportDataSource;
  columns: ReportColumn[];
  filters: ReportFilter[];
  groupBy?: string[];
  sortBy?: ReportSort[];
  aggregations?: ReportAggregation[];
  calculatedColumns?: CalculatedColumn[];
  visualization?: 'table' | 'chart' | 'both';
  chartType?: string;
  isShared: boolean;
  sharedWith?: string[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  schedule?: ReportSchedule;
}

export interface ReportColumn {
  field: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'percent';
  width?: number;
  visible: boolean;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  isRuntime: boolean;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportAggregation {
  field: string;
  type: AggregationType;
  label: string;
  showSubtotals: boolean;
}

export interface CalculatedColumn {
  name: string;
  label: string;
  expression: string;
  type: 'number' | 'currency' | 'percent';
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  format: 'pdf' | 'xlsx' | 'csv';
  isActive: boolean;
}

export interface ReportExecution {
  id: number;
  reportId: number;
  executedBy: number;
  executedAt: string;
  parameters?: any;
  rowCount: number;
  durationMs: number;
  status: 'completed' | 'failed' | 'timeout';
  errorMessage?: string;
  isBackground: boolean;
}

// ─── Print & Export ──────────────────────────────────────────────────────────

export type PrintEntityType = 
  | 'purchase_order'
  | 'ra_bill'
  | 'invoice'
  | 'grn'
  | 'measurement_book'
  | 'payment'
  | 'receipt';

export interface PrintTemplate {
  id: number;
  entityType: PrintEntityType;
  name: string;
  description?: string;
  layout: any; // Template layout configuration
  headerConfig: PrintHeaderConfig;
  footerConfig: PrintFooterConfig;
  signatureBlock?: boolean;
  qrCode?: boolean;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrintHeaderConfig {
  showCompanyLogo: boolean;
  showCompanyName: boolean;
  showDocumentNumber: boolean;
  showProjectInfo: boolean;
  showPrintTimestamp: boolean;
  showPrintedBy: boolean;
}

export interface PrintFooterConfig {
  showPageNumbers: boolean;
  showConfidential: boolean;
  customText?: string;
}

export interface PrintJob {
  id: number;
  entityType: PrintEntityType;
  entityId: number;
  templateId: number;
  printedBy: number;
  printedAt: string;
  copies: number;
  format: 'pdf' | 'print';
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

export interface ExportJob {
  id: number;
  reportId?: number;
  entityType?: string;
  filters: any;
  columns: string[];
  format: ExportFormat;
  requestedBy: number;
  requestedAt: string;
  completedAt?: string;
  rowCount?: number;
  fileSize?: number;
  downloadUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  isBackground: boolean;
}
