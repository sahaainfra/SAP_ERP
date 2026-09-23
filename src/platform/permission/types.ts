/**
 * Part 06 — Permission Model Types
 * 
 * Defines the complete permission model including:
 * - Permission keys and namespaces
 * - Responsibility templates
 * - Project assignments
 * - Approval authorities
 * - Delegation
 * - Field restrictions
 * - Segregation of duties
 */

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION KEY FORMAT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Permission key format: module.entity.action
 * Example: procure.po.approve
 */
export type PermissionKey = `${string}.${string}.${string}`;

/**
 * Registered module namespaces (closed set)
 */
export const MODULE_NAMESPACES = [
  'admin', 'asset', 'audit', 'bd', 'bill', 'chat', 'config', 'dms',
  'finance', 'hr', 'hse', 'integration', 'knowledge', 'legal', 'lifecycle',
  'master', 'mb', 'numbering', 'permission', 'plan', 'plant', 'portal',
  'procure', 'project', 'qa', 'qs', 'report', 'rmc', 'sc', 'statutory',
  'store', 'tax', 'training', 'user', 'welfare', 'workflow',
] as const;

export type ModuleNamespace = typeof MODULE_NAMESPACES[number];

/**
 * Action verbs (closed set)
 */
export const ACTION_VERBS = [
  'view', 'view_all', 'create', 'edit', 'edit_any', 'delete_draft',
  'submit', 'approve', 'reject', 'return', 'forward', 'delegate',
  'certify', 'sign', 'post', 'cancel', 'revise', 'reopen',
  'print', 'export', 'view_rate', 'view_amount', 'view_margin', 'configure',
] as const;

export type ActionVerb = typeof ACTION_VERBS[number];

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION
// ═══════════════════════════════════════════════════════════════════════════

export interface Permission {
  id: number;
  permissionKey: PermissionKey;
  module: ModuleNamespace;
  entity: string;
  action: ActionVerb;
  label: string;
  description?: string;
  isSensitive: boolean;
  requiresLimit: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIBILITY TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

export type TemplateCategory = 'execution' | 'commercial' | 'finance' | 'support';

export interface ResponsibilityTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  description?: string;
  category?: TemplateCategory;
  isSystem: boolean;
  isActive: boolean;
  companyId?: number;
  createdBy: number;
  createdAt: string;
  updatedBy?: number;
  updatedAt: string;
  version: number;
}

export interface ResponsibilityTemplatePermission {
  id: number;
  templateId: number;
  permissionId: number;
  isGranted: boolean;
}

export interface ResponsibilityTemplateWithPermissions extends ResponsibilityTemplate {
  permissions: Array<{
    permission: Permission;
    isGranted: boolean;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════

export type DataScope = 'OWN' | 'SITE' | 'PACKAGE' | 'PROJECT' | 'ALL_ASSIGNED';
export type AssignmentStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

export interface ProjectAssignment {
  id: number;
  userId: number;
  projectId: number;
  companyId: number;
  templateId?: number;
  designationLabel?: string;
  isPrimaryProject: boolean;
  reportsToUserId?: number;
  dataScope: DataScope;
  validFrom: string; // ISO date
  validTo?: string; // ISO date, null = open-ended
  status: AssignmentStatus;
  suspensionReason?: string;
  assignedBy: number;
  assignedAt: string;
  revokedBy?: number;
  revokedAt?: string;
  revocationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ProjectAssignmentWithDetails extends ProjectAssignment {
  template?: ResponsibilityTemplate;
  permissions: Permission[];
  approvalAuthorities: ApprovalAuthority[];
  scopes: AssignmentScope[];
  fieldRestrictions: FieldRestriction[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGNMENT PERMISSION OVERRIDE
// ═══════════════════════════════════════════════════════════════════════════

export type PermissionSource = 'TEMPLATE' | 'OVERRIDE';

export interface AssignmentPermission {
  id: number;
  assignmentId: number;
  permissionId: number;
  isGranted: boolean; // TRUE = grant, FALSE = DENY (DENY always wins)
  source: PermissionSource;
  grantedBy: number;
  grantedAt: string;
  reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// APPROVAL AUTHORITY
// ═══════════════════════════════════════════════════════════════════════════

export type DocumentType = 'PR' | 'PO' | 'MR' | 'GRN' | 'MB' | 'RA_BILL' | 'PAYMENT' | 'JV';

export interface ApprovalAuthority {
  id: number;
  assignmentId: number;
  documentType: DocumentType;
  approvalLevel: number;
  minAmount: number;
  maxAmount?: number; // null = unlimited
  currency: string;
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
  canForward: boolean;
  canDelegate: boolean;
  canApproveOwn: boolean;
  requiresTwoPerson: boolean;
  slaHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGNMENT SCOPE
// ═══════════════════════════════════════════════════════════════════════════

export type ScopeType = 'SITE' | 'PACKAGE' | 'WBS' | 'COST_CENTRE' | 'STORE';

export interface AssignmentScope {
  id: number;
  assignmentId: number;
  scopeType: ScopeType;
  scopeId: number;
  isIncluded: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DELEGATION
// ═══════════════════════════════════════════════════════════════════════════

export type DelegationStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface Delegation {
  id: number;
  fromUserId: number;
  toUserId: number;
  projectId?: number; // null = all projects
  documentTypes?: DocumentType[]; // null = all
  maxAmount?: number;
  validFrom: string;
  validTo: string;
  reason: string;
  status: DelegationStatus;
  createdBy: number;
  createdAt: string;
  revokedBy?: number;
  revokedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD RESTRICTION
// ═══════════════════════════════════════════════════════════════════════════

export type FieldVisibility = 'VISIBLE' | 'MASKED' | 'HIDDEN';

export interface FieldRestriction {
  id: number;
  assignmentId: number;
  entity: string;
  fieldName: string;
  visibility: FieldVisibility;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEGREGATION OF DUTIES
// ═══════════════════════════════════════════════════════════════════════════

export type SodSeverity = 'WARNING' | 'BLOCK';

export interface SodRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  permissionAId: number;
  permissionBId: number;
  severity: SodSeverity;
  rationale: string;
  isActive: boolean;
}

export interface SodViolation {
  rule: SodRule;
  permissionA: Permission;
  permissionB: Permission;
  userId: number;
  projectId: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGNMENT AUDIT
// ═══════════════════════════════════════════════════════════════════════════

export type AssignmentAction = 
  | 'ASSIGNED' 
  | 'MODIFIED' 
  | 'SUSPENDED' 
  | 'REACTIVATED' 
  | 'REVOKED' 
  | 'EXPIRED' 
  | 'DELEGATED';

export interface AssignmentAudit {
  id: number;
  assignmentId?: number;
  userId: number;
  projectId: number;
  action: AssignmentAction;
  beforeValue?: any;
  afterValue?: any;
  changedBy: number;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Four-layer permission resolution:
 * 1. Global Role (existing system)
 * 2. Project Assignment (which projects)
 * 3. Project Responsibility (what on that project)
 * 4. Explicit Override (grant/deny specific keys)
 */
export interface EffectivePermission {
  permissionKey: PermissionKey;
  isGranted: boolean;
  source: 'GLOBAL_ROLE' | 'PROJECT_ASSIGNMENT' | 'RESPONSIBILITY_TEMPLATE' | 'EXPLICIT_OVERRIDE';
  assignmentId?: number;
  projectId?: number;
}

export interface ResolvedPermissions {
  userId: number;
  projectId: number;
  permissions: EffectivePermission[];
  approvalAuthorities: ApprovalAuthority[];
  fieldRestrictions: FieldRestriction[];
  sodViolations: SodViolation[];
  resolvedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

export const SYSTEM_TEMPLATE_CODES = [
  'PROJECT_DIRECTOR',
  'PROJECT_MANAGER',
  'PLANNING_ENGINEER',
  'BILLING_ENGINEER',
  'QUANTITY_SURVEYOR',
  'SITE_ENGINEER',
  'SITE_SUPERVISOR',
  'STORE_KEEPER',
  'STORE_MANAGER',
  'PROCUREMENT_EXECUTIVE',
  'PROCUREMENT_MANAGER',
  'ACCOUNTS_EXECUTIVE',
  'ACCOUNTS_MANAGER',
  'HR_EXECUTIVE',
  'PAYROLL_OFFICER',
  'PLANT_IN_CHARGE',
  'PLANT_OPERATOR',
  'RMC_IN_CHARGE',
  'BATCHING_OPERATOR',
  'QAQC_ENGINEER',
  'QAQC_MANAGER',
  'SAFETY_OFFICER',
  'SAFETY_MANAGER',
  'DOCUMENT_CONTROLLER',
  'COMMERCIAL_MANAGER',
  'CONTRACTS_MANAGER',
  'CLIENT_REPRESENTATIVE',
  'AUDITOR',
  'VIEWER',
] as const;

export type SystemTemplateCode = typeof SYSTEM_TEMPLATE_CODES[number];
