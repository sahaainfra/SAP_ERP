/**
 * Permission Engine Types - Part 3
 * 
 * The complete permission model with 4-layer resolution:
 * Layer 1: Global Role (existing system)
 * Layer 2: Project Assignment (which projects)
 * Layer 3: Project Responsibility (what they do)
 * Layer 4: Explicit Override (specific grants/denies)
 */

// ─── Permission Key Format ───────────────────────────────────────────────────
// Format: module.entity.action
// Example: procurement.purchase_order.approve

export type PermissionAction = 
  | 'view' | 'view_all' | 'create' | 'edit' | 'edit_any'
  | 'delete_draft' | 'submit' | 'approve' | 'reject' | 'return'
  | 'forward' | 'delegate' | 'certify' | 'sign' | 'post'
  | 'cancel' | 'revise' | 'reopen' | 'print' | 'export'
  | 'view_rate' | 'view_amount' | 'view_margin' | 'configure';

export interface Permission {
  id: number;
  permissionKey: string;  // 'procurement.purchase_order.approve'
  module: string;
  entity: string;
  action: PermissionAction;
  label: string;
  description?: string;
  isSensitive: boolean;
  requiresLimit: boolean;
  sortOrder: number;
  isActive: boolean;
}

// ─── Responsibility Templates ────────────────────────────────────────────────

export type TemplateCategory = 'execution' | 'commercial' | 'finance' | 'support' | 'quality' | 'safety';

export interface ResponsibilityTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  description?: string;
  category: TemplateCategory;
  isSystem: boolean;
  isActive: boolean;
  companyId?: number;
  version: number;
  permissionIds: number[];  // IDs of granted permissions
}

// ─── Project Assignment (THE CORE) ───────────────────────────────────────────

export type DataScope = 'OWN' | 'SITE' | 'PACKAGE' | 'PROJECT' | 'ALL_ASSIGNED';
export type AssignmentStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

export interface ProjectAssignment {
  id: number;
  userId: number;
  projectId: number;
  companyId: number;
  templateId: number;
  designationLabel?: string;
  isPrimaryProject: boolean;
  reportsToUserId?: number;
  dataScope: DataScope;
  validFrom: string;  // ISO date
  validTo?: string;   // ISO date, null = open-ended
  status: AssignmentStatus;
  suspensionReason?: string;
  assignedBy: number;
  assignedAt: string;
  revokedBy?: number;
  revokedAt?: string;
  revocationReason?: string;
  notes?: string;
  version: number;
}

// ─── Permission Override ─────────────────────────────────────────────────────

export interface AssignmentPermission {
  id: number;
  assignmentId: number;
  permissionId: number;
  isGranted: boolean;  // TRUE = grant, FALSE = DENY
  source: 'TEMPLATE' | 'OVERRIDE';
  grantedBy: number;
  grantedAt: string;
  reason?: string;
}

// ─── Approval Authority ──────────────────────────────────────────────────────

export type DocumentType = 'PR' | 'PO' | 'MR' | 'GRN' | 'MB' | 'RA_BILL' | 'PAYMENT' | 'JV' | 'VOUCHER';

export interface ApprovalAuthority {
  id: number;
  assignmentId: number;
  documentType: DocumentType;
  approvalLevel: number;
  minAmount: number;
  maxAmount?: number;  // null = unlimited
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
}

// ─── Data Scope Restrictions ─────────────────────────────────────────────────

export type ScopeType = 'SITE' | 'PACKAGE' | 'WBS' | 'COST_CENTRE' | 'STORE';

export interface AssignmentScope {
  id: number;
  assignmentId: number;
  scopeType: ScopeType;
  scopeId: number;
  isIncluded: boolean;
}

// ─── Delegation ──────────────────────────────────────────────────────────────

export interface Delegation {
  id: number;
  fromUserId: number;
  toUserId: number;
  projectId?: number;  // null = all projects
  documentTypes?: DocumentType[];  // null = all
  maxAmount?: number;
  validFrom: string;
  validTo: string;
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  createdBy: number;
  createdAt: string;
  revokedBy?: number;
  revokedAt?: string;
}

// ─── Field Restrictions ──────────────────────────────────────────────────────

export type FieldVisibility = 'VISIBLE' | 'MASKED' | 'HIDDEN';

export interface FieldRestriction {
  id: number;
  assignmentId: number;
  entity: string;
  fieldName: string;
  visibility: FieldVisibility;
}

// ─── Segregation of Duties ───────────────────────────────────────────────────

export type SoDSeverity = 'WARNING' | 'BLOCK';

export interface SoDRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  permissionAId: number;
  permissionBId: number;
  severity: SoDSeverity;
  rationale: string;
  isActive: boolean;
}

// ─── Effective Permission Set (Output of Resolver) ───────────────────────────

export interface EffectivePermissionSet {
  userId: number;
  projectId: number | null;
  isSuperAdmin: boolean;
  permissions: Set<string>;
  deniedPermissions: Set<string>;
  dataScope: DataScope;
  allowedSiteIds: number[] | 'ALL';
  allowedPackageIds: number[] | 'ALL';
  allowedStoreIds: number[] | 'ALL';
  approvalAuthority: Partial<Record<DocumentType, ApprovalAuthority[]>>;
  fieldRestrictions: Record<string, Record<string, FieldVisibility>>;
  activeDelegationsReceived: Delegation[];
  resolvedAt: string;
  ttlSeconds: number;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export type AssignmentAction = 'ASSIGNED' | 'MODIFIED' | 'SUSPENDED' | 'REACTIVATED' | 'REVOKED' | 'EXPIRED' | 'DELEGATED';

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

// ─── User with Permissions (for UI) ──────────────────────────────────────────

export interface UserWithPermissions {
  id: number;
  username: string;
  fullName: string;
  email: string;
  designation: string;
  department: string;
  isSuperAdmin: boolean;
  globalRoles: string[];
  assignments: ProjectAssignment[];
}
