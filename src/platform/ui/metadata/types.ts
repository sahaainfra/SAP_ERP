/**
 * Part 18 — Metadata Types
 * 
 * Defines the annotation model that drives all generated UI.
 * Each entity declares its UI once; the generators produce the rest.
 */

import { PermissionKey } from '../../permission/types';
import { ChartType } from '../../components/types';

// ═══════════════════════════════════════════════════════════════════════════
// FIELD METADATA
// ═══════════════════════════════════════════════════════════════════════════

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'money' 
  | 'quantity' 
  | 'date' 
  | 'datetime' 
  | 'boolean' 
  | 'enum' 
  | 'reference' 
  | 'status' 
  | 'percent';

export type FieldSemantic = 
  | 'documentNumber' 
  | 'title' 
  | 'amount' 
  | 'status' 
  | 'progress' 
  | 'criticality' 
  | 'contact' 
  | 'url';

export type SemanticState = 'NEUTRAL' | 'GOOD' | 'WARNING' | 'CRITICAL';

export interface FieldMetadata {
  label: string;
  shortLabel?: string; // Used on phone
  type: FieldType;
  semantic?: FieldSemantic;
  uomField?: string; // Paired display for quantity
  currencyField?: string; // Paired display for money
  precision?: number;
  reference?: {
    entity: string;
    displayField: string;
    searchApi: string;
  };
  enumValues?: Array<{
    value: string;
    label: string;
    state?: SemanticState;
    icon?: string;
  }>;
  required?: boolean | string; // Expression
  readOnly?: boolean | string; // Expression
  visible?: boolean | string; // Expression
  permission?: PermissionKey; // Field-level gate
  filterable?: boolean;
  sortable?: boolean;
  searchable?: boolean;
  aggregate?: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT';
  criticality?: string; // Expression -> NEUTRAL|GOOD|WARNING|CRITICAL
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email';
  helpText?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST REPORT METADATA
// ═══════════════════════════════════════════════════════════════════════════

export interface ListReportMetadata {
  defaultFilters: string[]; // Shown expanded in filter bar
  advancedFilters: string[]; // Behind "More filters"
  columns: Array<{
    field: string;
    width?: number;
    importance: 1 | 2 | 3; // 1 = never drop
  }>;
  defaultSort: Array<{
    field: string;
    dir: 'asc' | 'desc';
  }>;
  totals?: string[]; // Fields summed in totals row
  kpiHeader?: string[]; // KPI codes shown above list
  variants: boolean; // Saved views enabled
  massActions?: string[];
  quickFilters?: Array<{
    label: string;
    filter: string;
    badge?: string;
  }>;
  emptyState: {
    title: string;
    body: string;
    action?: string;
  };
  rowNavigation: 'objectPage' | 'inlineExpand' | 'none';
  exportable: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD CONFIG (MANDATORY FOR MOBILE)
// ═══════════════════════════════════════════════════════════════════════════

export interface CardConfig {
  primary: string; // Identity line
  secondary: string[]; // Up to 3
  metric?: {
    field: string;
    label?: string;
  };
  status: string;
  actions: string[]; // Up to 2 inline
  expand: string[]; // Revealed on tap
  avatar?: {
    field: string;
    type: 'initials' | 'icon' | 'image';
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT PAGE METADATA
// ═══════════════════════════════════════════════════════════════════════════

export type SectionType = 
  | 'form' 
  | 'table' 
  | 'timeline' 
  | 'workflow' 
  | 'audit' 
  | 'attachments' 
  | 'chart' 
  | 'map' 
  | 'custom';

export interface ObjectPageSection {
  id: string;
  label: string;
  type: SectionType;
  entity?: string; // For related tables
  fields?: string[]; // For form sections
  filter?: string; // For related tables
  permission?: PermissionKey;
  editable?: string; // Expression
  totals?: string[];
  component?: string; // For custom sections
}

export interface ObjectPageMetadata {
  headerFields: string[];
  headerKpis?: string[];
  sections: ObjectPageSection[];
  relatedApps?: Array<{
    label: string;
    route: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICAL LIST METADATA
// ═══════════════════════════════════════════════════════════════════════════

export interface AnalyticalListMetadata {
  chartType: ChartType;
  dimensions: string[];
  measures: string[];
  filters?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION METADATA
// ═══════════════════════════════════════════════════════════════════════════

export interface ActionMetadata {
  name: string;
  label: string;
  permission: PermissionKey;
  visible?: string; // Expression
  emphasis?: 'primary' | 'secondary' | 'negative';
  confirm?: {
    title: string;
    body: string;
  };
  requiresReason?: boolean;
  dialog?: string;
  templates?: string[]; // For print actions
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY UI METADATA
// ═══════════════════════════════════════════════════════════════════════════

export interface EntityUiMetadata {
  entity: string;
  label: {
    singular: string;
    plural: string;
  };
  route: string;
  api: string;
  permissionPrefix: string;
  documentType?: string; // Links to Part 09 definition

  fields: Record<string, FieldMetadata>;
  listReport: ListReportMetadata;
  objectPage?: ObjectPageMetadata;
  analyticalPage?: AnalyticalListMetadata;
  cardConfig: CardConfig; // MANDATORY
  actions: ActionMetadata[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD METADATA
// ═══════════════════════════════════════════════════════════════════════════

export type WidgetDefinition =
  | { kind: 'KPI_TILE'; kpiCode: string; size: 1 | 2; showTrend?: boolean }
  | { kind: 'CHART'; chartType: ChartType; view: string; dimensions: string[]; measures: string[]; size: 2 | 3 | 4 }
  | { kind: 'LIST'; entity: string; filter: string; columns: string[]; limit: number; size: 2 | 3 | 4 }
  | { kind: 'APPROVAL_INBOX'; size: 2 | 3 }
  | { kind: 'EXCEPTION_LIST'; severity?: string[]; size: 2 | 3 }
  | { kind: 'CUSTOM'; component: string; size: 1 | 2 | 3 | 4 };

export interface DashboardBand {
  id: string;
  label: string;
  collapsible?: boolean;
  widgets: WidgetDefinition[];
}

export interface DashboardDefinition {
  code: string;
  label: string;
  audience: {
    responsibilityTemplates?: string[];
    permission?: PermissionKey;
  };
  bands: DashboardBand[];
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT REQUEST
// ═══════════════════════════════════════════════════════════════════════════

export interface ExportRequest {
  entity: string;
  format: 'csv' | 'xlsx' | 'pdf';
  filter?: any;
  columns?: string[];
  projectId?: number;
}

export interface ExportJob {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileId?: string;
  url?: string;
  rowCount?: number;
  error?: string;
}
