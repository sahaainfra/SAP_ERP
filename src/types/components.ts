/**
 * Component Library Types - Part 5
 * 
 * Type definitions for all reusable visual components
 */

import type { KpiValue, KpiStatus } from './realtime';

// ─── KPI Card Types ──────────────────────────────────────────────────────────

export type KpiCardVariant = 
  | 'numeric'      // 1×1: Big number, label, target, variance, trend
  | 'comparison'   // 1×1: Actual vs target as a bar
  | 'progress'     // 1×1: Radial or linear progress
  | 'trend'        // 2×1: Number plus sparkline
  | 'breakdown'    // 2×1: Number plus stacked composition
  | 'list'         // 1×2: Top-N list
  | 'chart'        // 2×2: Full chart
  | 'table'        // 2×2: Compact table
  | 'micro';       // ½×1: Label and number only

export interface KpiCardProps {
  kpi: KpiValue;
  variant?: KpiCardVariant;
  module?: string;
  title?: string;
  drillRoute?: string;
  showDefinition?: boolean;
  onRefresh?: () => void;
  onDrillDown?: () => void;
}

// ─── Chart Types ─────────────────────────────────────────────────────────────

export type ChartType =
  | 'line'
  | 'area'
  | 'stacked-area'
  | 'column'
  | 'bar'
  | 'stacked-bar'
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
  | 's-curve';

export interface ChartDataPoint {
  label: string;
  value: number;
  target?: number;
  category?: string;
  series?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

export interface ChartProps {
  type: ChartType;
  data: ChartSeries[] | ChartDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  interactive?: boolean;
  height?: number;
  onPointClick?: (point: ChartDataPoint) => void;
}

// ─── Smart Table Types ───────────────────────────────────────────────────────

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'status' | 'progress' | 'action';

export interface TableColumn {
  key: string;
  label: string;
  type: ColumnType;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  frozen?: boolean;
  formatter?: (value: any) => string | React.ReactNode;
}

export interface TableFilter {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TableView {
  id: string;
  name: string;
  columns: string[];
  filters: TableFilter[];
  sort: TableSort[];
  pageSize: number;
  isDefault?: boolean;
  isShared?: boolean;
}

export interface SmartTableProps {
  columns: TableColumn[];
  data: any[];
  totalCount: number;
  page: number;
  pageSize: number;
  filters: TableFilter[];
  sort: TableSort[];
  views: TableView[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onFilterChange: (filters: TableFilter[]) => void;
  onSortChange: (sort: TableSort[]) => void;
  onViewChange: (view: TableView) => void;
  onViewSave: (view: TableView) => void;
  onExport: (format: 'csv' | 'xlsx' | 'pdf') => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: any[]) => void;
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedIds: any[]) => void;
    permission?: string;
  }>;
}

// ─── Filter Bar Types ────────────────────────────────────────────────────────

export type FilterType = 'text' | 'date' | 'date-range' | 'number' | 'number-range' | 'select' | 'multi-select';

export interface FilterDefinition {
  key: string;
  label: string;
  type: FilterType;
  options?: Array<{ value: any; label: string }>;
  defaultValue?: any;
  alwaysVisible?: boolean;
}

export interface FilterBarProps {
  filters: FilterDefinition[];
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
}

// ─── Launchpad Tile Types ────────────────────────────────────────────────────

export type TileType = 'static' | 'kpi' | 'count' | 'chart' | 'news' | 'action';

export interface TileProps {
  type: TileType;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  kpi?: KpiValue;
  count?: number;
  chartData?: ChartDataPoint[];
  news?: Array<{ title: string; date: string }>;
  action?: string;
}

// ─── Supporting Component Types ──────────────────────────────────────────────

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusChipProps {
  status: string;
  type: StatusType;
  icon?: React.ReactNode;
}

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface PriorityIndicatorProps {
  level: PriorityLevel;
  showLabel?: boolean;
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'linear' | 'radial';
  status?: KpiStatus;
}

export interface AvatarProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  presence?: 'online' | 'offline' | 'busy' | 'away';
}

export interface TimelineItem {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  comment?: string;
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export type WidgetSize = '1x1' | '2x1' | '1x2' | '2x2' | '4x2';

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'list' | 'tile' | 'custom';
  title: string;
  size: WidgetSize;
  x: number;
  y: number;
  config: any;
  isMandatory?: boolean;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  isSystem?: boolean;
  refreshInterval?: number;
}

export interface DashboardBuilderProps {
  dashboard: Dashboard;
  availableWidgets: Array<{
    type: string;
    label: string;
    icon: React.ReactNode;
    defaultSize: WidgetSize;
  }>;
  onWidgetAdd: (widget: DashboardWidget) => void;
  onWidgetUpdate: (id: string, updates: Partial<DashboardWidget>) => void;
  onWidgetRemove: (id: string) => void;
  onWidgetMove: (id: string, x: number, y: number) => void;
  onWidgetResize: (id: string, size: WidgetSize) => void;
  onSave: () => void;
  onReset: () => void;
}
