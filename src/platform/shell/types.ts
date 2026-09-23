/**
 * Part 16 — Global ERP Application Shell Types
 * 
 * Defines types for:
 * - Navigation menu (server-driven, permission-filtered)
 * - Context switcher (company, project, site, FY)
 * - Global search (permission-filtered, multi-type)
 * - User profile and preferences
 * - Page templates (overview, list, object, analytical, wizard)
 * - Badge counts (notifications, approvals, tasks, messages)
 */

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION MENU
// ═══════════════════════════════════════════════════════════════════════════

export interface MenuItem {
  key: string;
  parentKey?: string;
  label: string;
  icon?: string;
  route?: string;
  permissionKey?: string;
  sortOrder: number;
  isActive: boolean;
  moduleGroup?: string;
  badge?: number;
  children?: MenuItem[];
}

export interface NavigationMenu {
  groups: MenuItem[];
  version: string; // Permission version for cache invalidation
}

export type NavigationState = 'expanded' | 'rail' | 'overlay';

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT SWITCHER
// ═══════════════════════════════════════════════════════════════════════════

export interface UserContext {
  companyId?: number;
  branchId?: number;
  projectIds: number[]; // Empty = all assigned
  siteIds: number[]; // Empty = all in selected projects
  financialYear?: string;
}

export interface AvailableContext {
  companies: Array<{ id: number; name: string; code: string }>;
  branches: Array<{ id: number; name: string; code: string; companyId: number }>;
  projects: Array<{ id: number; name: string; code: string; companyId: number }>;
  sites: Array<{ id: number; name: string; code: string; projectId: number }>;
  financialYears: string[];
}

export interface ContextChangeEvent {
  previous: UserContext;
  current: UserContext;
  changedDimensions: Array<'company' | 'branch' | 'project' | 'site' | 'financialYear'>;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL SEARCH
// ═══════════════════════════════════════════════════════════════════════════

export type SearchableObjectType =
  | 'PROJECT'
  | 'SITE'
  | 'PACKAGE'
  | 'WBS'
  | 'CONTRACT'
  | 'TENDER'
  | 'BOQ_ITEM'
  | 'MATERIAL'
  | 'VENDOR'
  | 'CLIENT'
  | 'EMPLOYEE'
  | 'LABOUR'
  | 'MR'
  | 'PR'
  | 'RFQ'
  | 'PO'
  | 'GRN'
  | 'STOCK_ITEM'
  | 'ISSUE'
  | 'DPR'
  | 'MB'
  | 'RA_BILL'
  | 'INVOICE'
  | 'PAYMENT'
  | 'RECEIPT'
  | 'VOUCHER'
  | 'PLANT'
  | 'RMC_BATCH'
  | 'ITP'
  | 'WIR'
  | 'NCR'
  | 'PERMIT'
  | 'INCIDENT'
  | 'DOCUMENT'
  | 'DRAWING'
  | 'RFI'
  | 'TASK'
  | 'APPROVAL'
  | 'USER';

export interface SearchResult {
  objectType: SearchableObjectType;
  objectId: number;
  primaryLine: string; // Number + name
  secondaryLine: string; // Project · site · date
  status?: string;
  route: string;
  permissionKey: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  groups: Array<{
    objectType: SearchableObjectType;
    results: SearchResult[];
    totalCount: number;
  }>;
  queryTime: number; // ms
}

export interface SearchQuery {
  term: string;
  objectType?: SearchableObjectType;
  projectId?: number;
  status?: string;
  dateRange?: { from: string; to: string };
  limit?: number;
}

export interface RecentSearch {
  id: number;
  searchTerm: string;
  resultType?: SearchableObjectType;
  resultId?: number;
  searchedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHELL BAR BADGES
// ═══════════════════════════════════════════════════════════════════════════

export interface ShellBadgeCounts {
  notifications: number;
  approvals: number;
  tasks: number;
  messages: number;
}

export interface ShellNotification {
  id: number;
  title: string;
  subtitle?: string;
  timestamp: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  isRead: boolean;
  route?: string;
}

export interface ShellApproval {
  id: number;
  documentType: string;
  documentNumber: string;
  title: string;
  amount?: number;
  currency?: string;
  submittedBy: string;
  submittedAt: string;
  dueAt?: string;
  route: string;
}

export interface ShellTask {
  id: number;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueAt?: string;
  assignedBy: string;
  route: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════════════════════

export interface UserProfile {
  userId: number;
  fullName: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  reportingManager?: string;
  company: string;
  lastLogin: string;
  activeSessions: number;
  avatar?: string;
}

export interface UserPreferences {
  theme: 'morning-horizon' | 'evening-horizon' | 'hc-black' | 'hc-white' | 'system';
  density: 'cozy' | 'compact' | 'condensed';
  language: string;
  timezone: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    quietHours?: { start: string; end: string };
  };
  landingPage: string;
  navigationState: NavigationState;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

export type PageTemplate = 'overview' | 'list' | 'object' | 'analytical' | 'wizard';

export interface PageHeader {
  breadcrumbs: Array<{ label: string; route?: string }>;
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    color: 'neutral' | 'info' | 'success' | 'warning' | 'error';
  };
  actions: PageAction[];
}

export interface PageAction {
  key: string;
  label: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'danger';
  permissionKey: string;
  disabled?: boolean;
  disabledReason?: string;
  route?: string;
  onClick?: () => void;
}

export interface ListReportConfig {
  entity: string;
  columns: Array<{
    field: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'status' | 'currency' | 'percentage';
    sortable?: boolean;
    filterable?: boolean;
    width?: string;
  }>;
  filters: Array<{
    field: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multi-select';
    options?: Array<{ value: string; label: string }>;
  }>;
  actions: PageAction[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
}

export interface ObjectPageConfig {
  entity: string;
  header: {
    titleField: string;
    subtitleField?: string;
    statusField?: string;
    keyFacts: Array<{ label: string; field: string }>;
  };
  sections: Array<{
    key: string;
    label: string;
    type: 'form' | 'table' | 'chart' | 'timeline';
    fields?: string[];
    visible?: boolean;
  }>;
}

export interface WizardStep {
  key: string;
  label: string;
  description?: string;
  fields: string[];
  validation?: () => Promise<boolean>;
}

export interface WizardConfig {
  title: string;
  steps: WizardStep[];
  onSubmit: () => Promise<void>;
  onSaveDraft?: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTING
// ═══════════════════════════════════════════════════════════════════════════

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  permissionKey?: string;
  title: string;
  template: PageTemplate;
  breadcrumb?: string;
}

export interface RouteContext {
  params: Record<string, string>;
  query: Record<string, string>;
  userContext: UserContext;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE BUDGETS
// ═══════════════════════════════════════════════════════════════════════════

export const SHELL_PERFORMANCE_BUDGETS = {
  firstPaint: 1000, // ms
  navigationMenuLoad: 300, // ms
  routeChange: 200, // ms
  globalSearchResults: 500, // ms
  badgeCountRefresh: 200, // ms
  contextSwitch: 1500, // ms
  popoverOpen: 150, // ms
};
