/**
 * Part 17 — Shared Enterprise UI Component System Types
 * 
 * Defines types for:
 * - KPI cards and tiles (9 variants)
 * - Chart library (17 chart types)
 * - Smart table with virtualization
 * - Filter bar
 * - Dashboard personalization
 * - Saved views
 */

import { KPIValue, KPIStatus } from '../kpi/types';

// ═══════════════════════════════════════════════════════════════════════════
// KPI CARD TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type KPICardVariant = 
  | 'numeric'        // 1×1: Big number, label, target, variance, trend arrow
  | 'comparison'     // 1×1: Actual vs target as a bar
  | 'progress'       // 1×1: Radial or linear progress
  | 'trend'          // 2×1: Number plus sparkline
  | 'breakdown'      // 2×1: Number plus stacked composition bar
  | 'list'           // 1×2: Top-N list
  | 'chart'          // 2×2: Full chart
  | 'table'          // 2×2: Compact table
  | 'micro';         // ½×1: Label and number only

export interface KPICardConfig {
  variant: KPICardVariant;
  kpiKey: string;
  title?: string;
  drillRoute?: string;
  showDefinition?: boolean;
  allowPersonalTarget?: boolean;
  refreshInterval?: number;
}

export interface KPICardData {
  value: KPIValue;
  trend?: Array<{ period: string; value: number }>;
  breakdown?: Array<{ label: string; value: number; color?: string }>;
  listItems?: Array<{ label: string; value: string; route?: string }>;
  chartData?: any;
  tableData?: any;
}

export interface KPICardProps {
  config: KPICardConfig;
  data: KPICardData;
  onDrillDown?: () => void;
  onRefresh?: () => void;
  onViewDefinition?: () => void;
  onSetTarget?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHART TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ChartType = 
  | 'line'
  | 'area'
  | 'stacked_area'
  | 'column'
  | 'bar'
  | 'stacked_bar'
  | 'combination'
  | 'donut'
  | 'gauge'
  | 'bullet'
  | 'waterfall'
  | 'scatter'
  | 'heatmap'
  | 'gantt'
  | 'funnel'
  | 'sankey'
  | 's_curve';

export interface ChartConfig {
  type: ChartType;
  title?: string;
  xAxis?: { label?: string; type?: 'category' | 'time' | 'value' };
  yAxis?: { label?: string; type?: 'value' | 'percentage' };
  series: ChartSeries[];
  legend?: boolean;
  tooltip?: boolean;
  drillDown?: { enabled: boolean; route?: string };
  maxSeries?: number; // Default 8, groups to "Top 7 + Other"
}

export interface ChartSeries {
  name: string;
  data: Array<{ x: any; y: number; label?: string }>;
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

export interface ChartProps {
  config: ChartConfig;
  data?: any;
  onPointClick?: (point: any) => void;
  onBrushSelect?: (range: { start: any; end: any }) => void;
  onViewAsTable?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// SMART TABLE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ColumnType = 'text' | 'number' | 'date' | 'status' | 'currency' | 'percentage' | 'action';

export interface TableColumn {
  key: string;
  label: string;
  type: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  frozen?: boolean;
  format?: (value: any) => string;
  visible?: boolean;
}

export interface TableFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'between';
  value: any;
}

export interface TableSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableGrouping {
  field: string;
  showSubtotals?: boolean;
}

export interface SmartTableConfig {
  entity: string;
  columns: TableColumn[];
  defaultSort?: TableSort;
  defaultFilters?: TableFilter[];
  defaultGrouping?: TableGrouping;
  pageSize?: number;
  virtualScroll?: boolean;
  selectable?: boolean;
  editable?: boolean;
  exportable?: boolean;
  bulkActions?: BulkAction[];
}

export interface BulkAction {
  key: string;
  label: string;
  permission: string;
  icon?: string;
  confirm?: boolean;
  execute: (selectedIds: number[]) => Promise<void>;
}

export interface SmartTableProps {
  config: SmartTableConfig;
  data: any[];
  totalCount: number;
  loading?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
  onSort?: (sort: TableSort) => void;
  onFilter?: (filters: TableFilter[]) => void;
  onGroup?: (grouping: TableGrouping) => void;
  onSelect?: (selectedIds: number[]) => void;
  onSaveView?: (view: SavedView) => void;
  onExport?: (format: 'csv' | 'xlsx' | 'pdf') => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER BAR TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type FilterType = 'text' | 'number' | 'date' | 'date_range' | 'select' | 'multi_select' | 'amount_range';

export interface FilterField {
  key: string;
  label: string;
  type: FilterType;
  options?: Array<{ value: string; label: string }>;
  presets?: string[]; // For date_range: 'today', 'this_week', 'this_month', etc.
  visible?: boolean;
}

export interface FilterBarConfig {
  fields: FilterField[];
  maxVisibleFilters?: number; // Default 4
  showClearAll?: boolean;
  showSaveView?: boolean;
}

export interface FilterBarProps {
  config: FilterBarConfig;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onClear?: () => void;
  onSaveView?: (name: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// SAVED VIEW TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SavedView {
  id?: number;
  viewKey: string;
  screenKey: string;
  viewName: string;
  ownerUserId?: number;
  templateId?: number;
  projectId?: number;
  isShared: boolean;
  isDefault: boolean;
  config: {
    columns?: string[];
    filters?: TableFilter[];
    sort?: TableSort;
    grouping?: TableGrouping;
    pageSize?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Dashboard {
  id?: number;
  dashboardKey: string;
  dashboardName: string;
  ownerUserId?: number;
  templateId?: number;
  projectId?: number;
  companyId?: number;
  isDefault: boolean;
  isSystem: boolean;
  layout: DashboardLayout;
  refreshIntervalSeconds: number;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardLayout {
  grid: {
    columns: number;
    rowHeight: number;
  };
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id?: number;
  dashboardId?: number;
  widgetKey: string;
  widgetType: 'KPI' | 'CHART' | 'TABLE' | 'LIST' | 'TILE' | 'CUSTOM';
  kpiKey?: string;
  titleOverride?: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  config?: any;
  isMandatory: boolean;
  sortOrder: number;
}

export interface DashboardBuilderProps {
  dashboard: Dashboard;
  availableWidgets: WidgetCatalogItem[];
  onSave: (dashboard: Dashboard) => Promise<void>;
  onPreview?: (userId: number) => void;
}

export interface WidgetCatalogItem {
  widgetKey: string;
  widgetType: 'KPI' | 'CHART' | 'TABLE' | 'LIST' | 'TILE' | 'CUSTOM';
  label: string;
  description?: string;
  icon?: string;
  module?: string;
  defaultSize: { w: number; h: number };
  permission?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTING COMPONENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StatusChipProps {
  status: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
}

export interface PriorityIndicatorProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  showLabel?: boolean;
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'linear' | 'radial';
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export interface TimelineItem {
  id: number;
  actor: string;
  action: string;
  timestamp: string;
  comment?: string;
  icon?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  showDate?: boolean;
}

export interface Attachment {
  id: number;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  thumbnailUrl?: string;
  downloadUrl: string;
}

export interface AttachmentListProps {
  attachments: Attachment[];
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onPreview?: (attachment: Attachment) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE BUDGETS
// ═══════════════════════════════════════════════════════════════════════════

export const COMPONENT_PERFORMANCE_BUDGETS = {
  kpiCardFirstRender: 300, // ms
  dashboard20Widgets: 2000, // ms
  chartRender1000Points: 500, // ms
  tableRender50Rows: 300, // ms
  tableSortFilter: 600, // ms
  widgetDragDropFPS: 60, // fps
  liveKPIUpdate: 100, // ms
  themeSwitch: 200, // ms
};

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS RULES
// ═══════════════════════════════════════════════════════════════════════════

export const COMPONENT_BUSINESS_RULES = {
  COMP_01: 'No component file contains a literal colour, spacing value, font size or date format',
  COMP_02: 'Every data component renders all four states: loading, populated, empty, error',
  COMP_03: 'A table above 100 rows on desktop or 40 on mobile virtualises',
  COMP_04: 'A totals row is server-computed across the filtered set',
  COMP_05: 'Status is never conveyed by colour alone',
  COMP_06: 'A component that throws renders its own error card',
  COMP_07: 'A component that needs a permission check does not perform one',
};
