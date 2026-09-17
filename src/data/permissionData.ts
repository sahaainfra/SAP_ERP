/**
 * Permission Engine Mock Data - Part 3
 * 
 * Simulates server-side data for the permission system.
 * In production, this comes from the database via API.
 */

import type { 
  Permission, ResponsibilityTemplate, ProjectAssignment, 
  ApprovalAuthority, SoDRule, UserWithPermissions, Delegation,
  AssignmentAudit, FieldRestriction
} from '../types/permissions';

// ─── Permission Catalogue ────────────────────────────────────────────────────

export const permissionCatalogue: Permission[] = [
  // Procurement Module
  { id: 1, permissionKey: 'procurement.purchase_requisition.view', module: 'procurement', entity: 'purchase_requisition', action: 'view', label: 'View Purchase Requisitions', isSensitive: false, requiresLimit: false, sortOrder: 1, isActive: true },
  { id: 2, permissionKey: 'procurement.purchase_requisition.create', module: 'procurement', entity: 'purchase_requisition', action: 'create', label: 'Create Purchase Requisition', isSensitive: false, requiresLimit: false, sortOrder: 2, isActive: true },
  { id: 3, permissionKey: 'procurement.purchase_requisition.approve', module: 'procurement', entity: 'purchase_requisition', action: 'approve', label: 'Approve Purchase Requisition', isSensitive: false, requiresLimit: true, sortOrder: 3, isActive: true },
  { id: 4, permissionKey: 'procurement.purchase_order.view', module: 'procurement', entity: 'purchase_order', action: 'view', label: 'View Purchase Orders', isSensitive: false, requiresLimit: false, sortOrder: 4, isActive: true },
  { id: 5, permissionKey: 'procurement.purchase_order.create', module: 'procurement', entity: 'purchase_order', action: 'create', label: 'Create Purchase Order', isSensitive: false, requiresLimit: false, sortOrder: 5, isActive: true },
  { id: 6, permissionKey: 'procurement.purchase_order.approve', module: 'procurement', entity: 'purchase_order', action: 'approve', label: 'Approve Purchase Order', isSensitive: false, requiresLimit: true, sortOrder: 6, isActive: true },
  { id: 7, permissionKey: 'procurement.vendor.view', module: 'procurement', entity: 'vendor', action: 'view', label: 'View Vendors', isSensitive: false, requiresLimit: false, sortOrder: 7, isActive: true },
  { id: 8, permissionKey: 'procurement.vendor.create', module: 'procurement', entity: 'vendor', action: 'create', label: 'Create Vendor', isSensitive: false, requiresLimit: false, sortOrder: 8, isActive: true },
  { id: 9, permissionKey: 'procurement.quotation.view', module: 'procurement', entity: 'quotation', action: 'view', label: 'View Quotations', isSensitive: false, requiresLimit: false, sortOrder: 9, isActive: true },
  { id: 10, permissionKey: 'procurement.quotation.create', module: 'procurement', entity: 'quotation', action: 'create', label: 'Create Quotation', isSensitive: false, requiresLimit: false, sortOrder: 10, isActive: true },
  
  // Materials Module
  { id: 11, permissionKey: 'materials.stock.view', module: 'materials', entity: 'stock', action: 'view', label: 'View Stock', isSensitive: false, requiresLimit: false, sortOrder: 11, isActive: true },
  { id: 12, permissionKey: 'materials.stock.adjust', module: 'materials', entity: 'stock', action: 'edit', label: 'Adjust Stock', isSensitive: false, requiresLimit: false, sortOrder: 12, isActive: true },
  { id: 13, permissionKey: 'materials.stock.count', module: 'materials', entity: 'stock', action: 'certify', label: 'Stock Count', isSensitive: false, requiresLimit: false, sortOrder: 13, isActive: true },
  { id: 14, permissionKey: 'materials.grn.view', module: 'materials', entity: 'grn', action: 'view', label: 'View GRN', isSensitive: false, requiresLimit: false, sortOrder: 14, isActive: true },
  { id: 15, permissionKey: 'materials.grn.create', module: 'materials', entity: 'grn', action: 'create', label: 'Create GRN', isSensitive: false, requiresLimit: false, sortOrder: 15, isActive: true },
  { id: 16, permissionKey: 'materials.grn.approve', module: 'materials', entity: 'grn', action: 'approve', label: 'Approve GRN', isSensitive: false, requiresLimit: false, sortOrder: 16, isActive: true },
  { id: 17, permissionKey: 'materials.material_issue.create', module: 'materials', entity: 'material_issue', action: 'create', label: 'Create Material Issue', isSensitive: false, requiresLimit: false, sortOrder: 17, isActive: true },
  
  // Execution Module
  { id: 18, permissionKey: 'execution.dpr.view', module: 'execution', entity: 'dpr', action: 'view', label: 'View DPR', isSensitive: false, requiresLimit: false, sortOrder: 18, isActive: true },
  { id: 19, permissionKey: 'execution.dpr.create', module: 'execution', entity: 'dpr', action: 'create', label: 'Create DPR', isSensitive: false, requiresLimit: false, sortOrder: 19, isActive: true },
  { id: 20, permissionKey: 'execution.mb.view', module: 'execution', entity: 'mb', action: 'view', label: 'View Measurement Book', isSensitive: false, requiresLimit: false, sortOrder: 20, isActive: true },
  { id: 21, permissionKey: 'execution.mb.create', module: 'execution', entity: 'mb', action: 'create', label: 'Create Measurement Book', isSensitive: false, requiresLimit: false, sortOrder: 21, isActive: true },
  { id: 22, permissionKey: 'execution.mb.certify', module: 'execution', entity: 'mb', action: 'certify', label: 'Certify Measurement Book', isSensitive: false, requiresLimit: false, sortOrder: 22, isActive: true },
  { id: 23, permissionKey: 'execution.progress.view', module: 'execution', entity: 'progress', action: 'view', label: 'View Progress', isSensitive: false, requiresLimit: false, sortOrder: 23, isActive: true },
  
  // Billing Module
  { id: 24, permissionKey: 'billing.ra_bill.view', module: 'billing', entity: 'ra_bill', action: 'view', label: 'View RA Bills', isSensitive: false, requiresLimit: false, sortOrder: 24, isActive: true },
  { id: 25, permissionKey: 'billing.ra_bill.create', module: 'billing', entity: 'ra_bill', action: 'create', label: 'Create RA Bill', isSensitive: false, requiresLimit: false, sortOrder: 25, isActive: true },
  { id: 26, permissionKey: 'billing.ra_bill.certify', module: 'billing', entity: 'ra_bill', action: 'certify', label: 'Certify RA Bill', isSensitive: false, requiresLimit: true, sortOrder: 26, isActive: true },
  { id: 27, permissionKey: 'billing.invoice.view', module: 'billing', entity: 'invoice', action: 'view', label: 'View Invoices', isSensitive: false, requiresLimit: false, sortOrder: 27, isActive: true },
  { id: 28, permissionKey: 'billing.invoice.create', module: 'billing', entity: 'invoice', action: 'create', label: 'Create Invoice', isSensitive: false, requiresLimit: false, sortOrder: 28, isActive: true },
  
  // Finance Module
  { id: 29, permissionKey: 'finance.payment.view', module: 'finance', entity: 'payment', action: 'view', label: 'View Payments', isSensitive: false, requiresLimit: false, sortOrder: 29, isActive: true },
  { id: 30, permissionKey: 'finance.payment.post', module: 'finance', entity: 'payment', action: 'post', label: 'Post Payment', isSensitive: true, requiresLimit: true, sortOrder: 30, isActive: true },
  { id: 31, permissionKey: 'finance.voucher.view', module: 'finance', entity: 'voucher', action: 'view', label: 'View Vouchers', isSensitive: false, requiresLimit: false, sortOrder: 31, isActive: true },
  { id: 32, permissionKey: 'finance.voucher.create', module: 'finance', entity: 'voucher', action: 'create', label: 'Create Voucher', isSensitive: false, requiresLimit: false, sortOrder: 32, isActive: true },
  { id: 33, permissionKey: 'finance.journal.create', module: 'finance', entity: 'journal', action: 'create', label: 'Create Journal Entry', isSensitive: true, requiresLimit: false, sortOrder: 33, isActive: true },
  { id: 34, permissionKey: 'finance.journal.post', module: 'finance', entity: 'journal', action: 'post', label: 'Post Journal Entry', isSensitive: true, requiresLimit: true, sortOrder: 34, isActive: true },
  { id: 35, permissionKey: 'finance.vendor.create', module: 'finance', entity: 'vendor', action: 'create', label: 'Create Vendor (Finance)', isSensitive: true, requiresLimit: false, sortOrder: 35, isActive: true },
  
  // HR Module
  { id: 36, permissionKey: 'hr.employee.view', module: 'hr', entity: 'employee', action: 'view', label: 'View Employees', isSensitive: false, requiresLimit: false, sortOrder: 36, isActive: true },
  { id: 37, permissionKey: 'hr.employee.create', module: 'hr', entity: 'employee', action: 'create', label: 'Create Employee', isSensitive: true, requiresLimit: false, sortOrder: 37, isActive: true },
  { id: 38, permissionKey: 'hr.payroll.view', module: 'hr', entity: 'payroll', action: 'view', label: 'View Payroll', isSensitive: true, requiresLimit: false, sortOrder: 38, isActive: true },
  { id: 39, permissionKey: 'hr.payroll.view_salary', module: 'hr', entity: 'payroll', action: 'view_rate', label: 'View Salary Details', isSensitive: true, requiresLimit: false, sortOrder: 39, isActive: true },
  { id: 40, permissionKey: 'hr.payroll.approve', module: 'hr', entity: 'payroll', action: 'approve', label: 'Approve Payroll', isSensitive: true, requiresLimit: true, sortOrder: 40, isActive: true },
  
  // Quality & Safety Module
  { id: 41, permissionKey: 'quality.itp.view', module: 'quality', entity: 'itp', action: 'view', label: 'View ITP', isSensitive: false, requiresLimit: false, sortOrder: 41, isActive: true },
  { id: 42, permissionKey: 'quality.wir.create', module: 'quality', entity: 'wir', action: 'create', label: 'Create WIR', isSensitive: false, requiresLimit: false, sortOrder: 42, isActive: true },
  { id: 43, permissionKey: 'quality.ncr.view', module: 'quality', entity: 'ncr', action: 'view', label: 'View NCR', isSensitive: false, requiresLimit: false, sortOrder: 43, isActive: true },
  { id: 44, permissionKey: 'safety.incident.view', module: 'safety', entity: 'incident', action: 'view', label: 'View Incidents', isSensitive: false, requiresLimit: false, sortOrder: 44, isActive: true },
  { id: 45, permissionKey: 'safety.incident.create', module: 'safety', entity: 'incident', action: 'create', label: 'Report Incident', isSensitive: false, requiresLimit: false, sortOrder: 45, isActive: true },
  
  // Projects Module
  { id: 46, permissionKey: 'project.view', module: 'project', entity: 'project', action: 'view', label: 'View Projects', isSensitive: false, requiresLimit: false, sortOrder: 46, isActive: true },
  { id: 47, permissionKey: 'project.create', module: 'project', entity: 'project', action: 'create', label: 'Create Project', isSensitive: false, requiresLimit: false, sortOrder: 47, isActive: true },
  { id: 48, permissionKey: 'project.edit', module: 'project', entity: 'project', action: 'edit', label: 'Edit Project', isSensitive: false, requiresLimit: false, sortOrder: 48, isActive: true },
  
  // Admin Module
  { id: 49, permissionKey: 'admin.responsibility.view', module: 'admin', entity: 'responsibility', action: 'view', label: 'View Responsibilities', isSensitive: false, requiresLimit: false, sortOrder: 49, isActive: true },
  { id: 50, permissionKey: 'admin.responsibility.configure', module: 'admin', entity: 'responsibility', action: 'configure', label: 'Configure Responsibilities', isSensitive: false, requiresLimit: false, sortOrder: 50, isActive: true },
  { id: 51, permissionKey: 'admin.backup.create', module: 'admin', entity: 'backup', action: 'create', label: 'Create Backup', isSensitive: false, requiresLimit: false, sortOrder: 51, isActive: true },
  { id: 52, permissionKey: 'admin.backup.restore', module: 'admin', entity: 'backup', action: 'create', label: 'Restore Backup', isSensitive: false, requiresLimit: false, sortOrder: 52, isActive: true },
  { id: 53, permissionKey: 'admin.audit.view', module: 'admin', entity: 'audit', action: 'view', label: 'View Audit Log', isSensitive: false, requiresLimit: false, sortOrder: 53, isActive: true },
];

// ─── Responsibility Templates ────────────────────────────────────────────────

export const responsibilityTemplates: ResponsibilityTemplate[] = [
  {
    id: 1,
    templateCode: 'PROJECT_DIRECTOR',
    templateName: 'Project Director',
    description: 'Overall project leadership with full approval authority',
    category: 'execution',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [46, 47, 48, 1, 2, 3, 4, 5, 6, 7, 11, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 41, 42, 43, 44, 45],
  },
  {
    id: 2,
    templateCode: 'PROJECT_MANAGER',
    templateName: 'Project Manager',
    description: 'Day-to-day project management with moderate approval limits',
    category: 'execution',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [46, 1, 2, 3, 4, 5, 6, 7, 11, 14, 17, 18, 19, 20, 21, 23, 24, 25, 27, 29, 31, 41, 42, 43, 44, 45],
  },
  {
    id: 3,
    templateCode: 'SITE_ENGINEER',
    templateName: 'Site Engineer',
    description: 'Site-level execution and reporting',
    category: 'execution',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [46, 11, 14, 15, 17, 18, 19, 20, 21, 23, 41, 42, 44, 45],
  },
  {
    id: 4,
    templateCode: 'STORE_KEEPER',
    templateName: 'Store Keeper',
    description: 'Material receipt, issue and stock management',
    category: 'support',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [11, 12, 13, 14, 15, 16, 17],
  },
  {
    id: 5,
    templateCode: 'PROCUREMENT_MANAGER',
    templateName: 'Procurement Manager',
    description: 'Full procurement cycle management',
    category: 'commercial',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    id: 6,
    templateCode: 'ACCOUNTS_MANAGER',
    templateName: 'Accounts Manager',
    description: 'Financial operations and payment processing',
    category: 'finance',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [29, 30, 31, 32, 33, 34, 24, 25, 26, 27, 28],
  },
  {
    id: 7,
    templateCode: 'QA_QC_ENGINEER',
    templateName: 'QA/QC Engineer',
    description: 'Quality inspection and testing',
    category: 'quality',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [41, 42, 43, 20, 21, 22],
  },
  {
    id: 8,
    templateCode: 'SAFETY_OFFICER',
    templateName: 'Safety Officer',
    description: 'HSE monitoring and incident management',
    category: 'safety',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [44, 45, 46, 18],
  },
  {
    id: 9,
    templateCode: 'BILLING_ENGINEER',
    templateName: 'Billing Engineer',
    description: 'Measurement and billing preparation',
    category: 'commercial',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [20, 21, 24, 25, 27, 28, 46],
  },
  {
    id: 10,
    templateCode: 'VIEWER',
    templateName: 'Viewer (Read-Only)',
    description: 'Read-only access to assigned modules',
    category: 'support',
    isSystem: true,
    isActive: true,
    version: 1,
    permissionIds: [46, 1, 4, 7, 11, 14, 18, 20, 23, 24, 27, 29, 31, 41, 43, 44],
  },
];

// ─── Users ───────────────────────────────────────────────────────────────────

export const users: UserWithPermissions[] = [
  {
    id: 1,
    username: 'admin',
    fullName: 'Admin User',
    email: 'admin@construction-erp.com',
    designation: 'Super Administrator',
    department: 'Administration',
    isSuperAdmin: true,
    globalRoles: ['SUPER_ADMIN'],
    assignments: [],
  },
  {
    id: 2,
    username: 'sarah.chen',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@construction-erp.com',
    designation: 'Project Manager',
    department: 'Projects',
    isSuperAdmin: false,
    globalRoles: ['MANAGER'],
    assignments: [],
  },
  {
    id: 3,
    username: 'michael.torres',
    fullName: 'Michael Torres',
    email: 'michael.torres@construction-erp.com',
    designation: 'Site Engineer',
    department: 'Execution',
    isSuperAdmin: false,
    globalRoles: ['ENGINEER'],
    assignments: [],
  },
  {
    id: 4,
    username: 'david.park',
    fullName: 'David Park',
    email: 'david.park@construction-erp.com',
    designation: 'Project Director',
    department: 'Projects',
    isSuperAdmin: false,
    globalRoles: ['DIRECTOR'],
    assignments: [],
  },
  {
    id: 5,
    username: 'lisa.anderson',
    fullName: 'Lisa Anderson',
    email: 'lisa.anderson@construction-erp.com',
    designation: 'Procurement Manager',
    department: 'Procurement',
    isSuperAdmin: false,
    globalRoles: ['MANAGER'],
    assignments: [],
  },
  {
    id: 6,
    username: 'james.wilson',
    fullName: 'James Wilson',
    email: 'james.wilson@construction-erp.com',
    designation: 'Accounts Manager',
    department: 'Finance',
    isSuperAdmin: false,
    globalRoles: ['MANAGER'],
    assignments: [],
  },
  {
    id: 7,
    username: 'emma.rodriguez',
    fullName: 'Emma Rodriguez',
    email: 'emma.rodriguez@construction-erp.com',
    designation: 'Safety Officer',
    department: 'HSE',
    isSuperAdmin: false,
    globalRoles: ['OFFICER'],
    assignments: [],
  },
  {
    id: 8,
    username: 'tom.brown',
    fullName: 'Tom Brown',
    email: 'tom.brown@construction-erp.com',
    designation: 'Store Keeper',
    department: 'Materials',
    isSuperAdmin: false,
    globalRoles: ['STAFF'],
    assignments: [],
  },
  {
    id: 9,
    username: 'john.smith',
    fullName: 'John Smith',
    email: 'john.smith@construction-erp.com',
    designation: 'QA/QC Engineer',
    department: 'Quality',
    isSuperAdmin: false,
    globalRoles: ['ENGINEER'],
    assignments: [],
  },
  {
    id: 10,
    username: 'mike.johnson',
    fullName: 'Mike Johnson',
    email: 'mike.johnson@construction-erp.com',
    designation: 'Billing Engineer',
    department: 'Commercial',
    isSuperAdmin: false,
    globalRoles: ['ENGINEER'],
    assignments: [],
  },
];

// ─── Projects (from existing mock data) ──────────────────────────────────────

export const projectIds = [1, 2, 3, 4, 5, 6];

// ─── Project Assignments ─────────────────────────────────────────────────────

export const projectAssignments: ProjectAssignment[] = [
  // Sarah Chen - Project Manager on Metro Line (PRJ-001) and Airport Terminal (PRJ-005)
  { id: 1, userId: 2, projectId: 1, companyId: 1, templateId: 2, designationLabel: 'Project Manager', isPrimaryProject: true, dataScope: 'PROJECT', validFrom: '2024-03-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-02-28T10:00:00Z', version: 1 },
  { id: 2, userId: 2, projectId: 5, companyId: 1, templateId: 10, designationLabel: 'Viewer', isPrimaryProject: false, dataScope: 'PROJECT', validFrom: '2024-06-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-05-28T10:00:00Z', version: 1 },
  
  // Michael Torres - Site Engineer on Highway Bridge (PRJ-002)
  { id: 3, userId: 3, projectId: 2, companyId: 1, templateId: 3, designationLabel: 'Site Engineer', isPrimaryProject: true, dataScope: 'SITE', validFrom: '2024-08-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-07-28T10:00:00Z', version: 1 },
  
  // David Park - Project Director on Commercial Tower (PRJ-003)
  { id: 4, userId: 4, projectId: 3, companyId: 1, templateId: 1, designationLabel: 'Project Director', isPrimaryProject: true, dataScope: 'ALL_ASSIGNED', validFrom: '2023-06-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2023-05-28T10:00:00Z', version: 1 },
  
  // Lisa Anderson - Procurement Manager on Water Treatment (PRJ-004)
  { id: 5, userId: 5, projectId: 4, companyId: 1, templateId: 5, designationLabel: 'Procurement Manager', isPrimaryProject: true, dataScope: 'PROJECT', validFrom: '2024-01-15', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-01-10T10:00:00Z', version: 1 },
  
  // James Wilson - Accounts Manager on multiple projects
  { id: 6, userId: 6, projectId: 1, companyId: 1, templateId: 6, designationLabel: 'Accounts Manager', isPrimaryProject: false, dataScope: 'PROJECT', validFrom: '2024-03-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-02-28T10:00:00Z', version: 1 },
  { id: 7, userId: 6, projectId: 3, companyId: 1, templateId: 6, designationLabel: 'Accounts Manager', isPrimaryProject: true, dataScope: 'PROJECT', validFrom: '2023-06-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2023-05-28T10:00:00Z', version: 1 },
  { id: 8, userId: 6, projectId: 5, companyId: 1, templateId: 6, designationLabel: 'Accounts Manager', isPrimaryProject: false, dataScope: 'PROJECT', validFrom: '2024-02-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-01-28T10:00:00Z', version: 1 },
  
  // Emma Rodriguez - Safety Officer on all active projects
  { id: 9, userId: 7, projectId: 1, companyId: 1, templateId: 8, designationLabel: 'Safety Officer', isPrimaryProject: false, dataScope: 'PROJECT', validFrom: '2024-03-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-02-28T10:00:00Z', version: 1 },
  { id: 10, userId: 7, projectId: 2, companyId: 1, templateId: 8, designationLabel: 'Safety Officer', isPrimaryProject: false, dataScope: 'PROJECT', validFrom: '2024-08-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-07-28T10:00:00Z', version: 1 },
  { id: 11, userId: 7, projectId: 5, companyId: 1, templateId: 8, designationLabel: 'Safety Officer', isPrimaryProject: true, dataScope: 'PROJECT', validFrom: '2024-02-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-01-28T10:00:00Z', version: 1 },
  
  // Tom Brown - Store Keeper on Commercial Tower
  { id: 12, userId: 8, projectId: 3, companyId: 1, templateId: 4, designationLabel: 'Store Keeper', isPrimaryProject: true, dataScope: 'PROJECT', validFrom: '2023-06-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2023-05-28T10:00:00Z', version: 1 },
  
  // John Smith - QA/QC Engineer on Commercial Tower and Airport Terminal
  { id: 13, userId: 9, projectId: 3, companyId: 1, templateId: 7, designationLabel: 'QA/QC Engineer', isPrimaryProject: true, dataScope: 'PROJECT', validFrom: '2023-06-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2023-05-28T10:00:00Z', version: 1 },
  { id: 14, userId: 9, projectId: 5, companyId: 1, templateId: 7, designationLabel: 'QA/QC Engineer', isPrimaryProject: false, dataScope: 'PROJECT', validFrom: '2024-02-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-01-28T10:00:00Z', version: 1 },
  
  // Mike Johnson - Billing Engineer on Metro Line and Commercial Tower
  { id: 15, userId: 10, projectId: 1, companyId: 1, templateId: 9, designationLabel: 'Billing Engineer', isPrimaryProject: true, dataScope: 'PROJECT', validFrom: '2024-03-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2024-02-28T10:00:00Z', version: 1 },
  { id: 16, userId: 10, projectId: 3, companyId: 1, templateId: 9, designationLabel: 'Billing Engineer', isPrimaryProject: false, dataScope: 'PROJECT', validFrom: '2023-06-01', status: 'ACTIVE', assignedBy: 1, assignedAt: '2023-05-28T10:00:00Z', version: 1 },
];

// ─── Approval Authorities ────────────────────────────────────────────────────

export const approvalAuthorities: ApprovalAuthority[] = [
  // Sarah Chen - PR approval up to ₹50L on Metro Line
  { id: 1, assignmentId: 1, documentType: 'PR', approvalLevel: 1, minAmount: 0, maxAmount: 5000000, currency: 'INR', canApprove: true, canReject: true, canReturn: true, canForward: true, canDelegate: false, canApproveOwn: false, requiresTwoPerson: false, slaHours: 24, isActive: true },
  // Sarah Chen - PO approval up to ₹25L on Metro Line
  { id: 2, assignmentId: 1, documentType: 'PO', approvalLevel: 1, minAmount: 0, maxAmount: 2500000, currency: 'INR', canApprove: true, canReject: true, canReturn: true, canForward: true, canDelegate: false, canApproveOwn: false, requiresTwoPerson: false, slaHours: 24, isActive: true },
  
  // David Park - PO approval up to ₹1Cr on Commercial Tower
  { id: 3, assignmentId: 4, documentType: 'PO', approvalLevel: 1, minAmount: 0, maxAmount: 10000000, currency: 'INR', canApprove: true, canReject: true, canReturn: true, canForward: true, canDelegate: true, canApproveOwn: false, requiresTwoPerson: false, slaHours: 48, isActive: true },
  // David Park - Payment approval up to ₹50L
  { id: 4, assignmentId: 4, documentType: 'PAYMENT', approvalLevel: 1, minAmount: 0, maxAmount: 5000000, currency: 'INR', canApprove: true, canReject: true, canReturn: true, canForward: false, canDelegate: false, canApproveOwn: false, requiresTwoPerson: false, slaHours: 24, isActive: true },
  
  // Lisa Anderson - PO approval up to ₹10L on Water Treatment
  { id: 5, assignmentId: 5, documentType: 'PO', approvalLevel: 1, minAmount: 0, maxAmount: 1000000, currency: 'INR', canApprove: true, canReject: true, canReturn: true, canForward: false, canDelegate: false, canApproveOwn: false, requiresTwoPerson: false, slaHours: 24, isActive: true },
  
  // James Wilson - Payment approval up to ₹25L
  { id: 6, assignmentId: 6, documentType: 'PAYMENT', approvalLevel: 1, minAmount: 0, maxAmount: 2500000, currency: 'INR', canApprove: true, canReject: true, canReturn: true, canForward: false, canDelegate: false, canApproveOwn: false, requiresTwoPerson: true, slaHours: 24, isActive: true },
  { id: 7, assignmentId: 7, documentType: 'PAYMENT', approvalLevel: 1, minAmount: 0, maxAmount: 2500000, currency: 'INR', canApprove: true, canReject: true, canReturn: true, canForward: false, canDelegate: false, canApproveOwn: false, requiresTwoPerson: true, slaHours: 24, isActive: true },
];

// ─── Segregation of Duties Rules ─────────────────────────────────────────────

export const sodRules: SoDRule[] = [
  { id: 1, ruleCode: 'SOD-01', ruleName: 'Self-approval of purchases', permissionAId: 5, permissionBId: 6, severity: 'BLOCK', rationale: 'A user who creates a purchase order should not approve their own order. This prevents unauthorized purchases.', isActive: true },
  { id: 2, ruleCode: 'SOD-02', ruleName: 'Fictitious vendor fraud', permissionAId: 35, permissionBId: 30, severity: 'BLOCK', rationale: 'Creating a vendor and posting payments to them enables fraud through fictitious vendors.', isActive: true },
  { id: 3, ruleCode: 'SOD-03', ruleName: 'Unverified measurement', permissionAId: 21, permissionBId: 22, severity: 'BLOCK', rationale: 'Creating and certifying measurement books enables billing for work not actually done.', isActive: true },
  { id: 4, ruleCode: 'SOD-04', ruleName: 'Unverified billing', permissionAId: 25, permissionBId: 26, severity: 'BLOCK', rationale: 'Creating and certifying RA bills enables billing for work not actually done.', isActive: true },
  { id: 5, ruleCode: 'SOD-05', ruleName: 'Fictitious receipt', permissionAId: 15, permissionBId: 16, severity: 'BLOCK', rationale: 'Creating and approving GRN enables recording receipt of materials not actually received.', isActive: true },
  { id: 6, ruleCode: 'SOD-06', ruleName: 'Ghost employee fraud', permissionAId: 37, permissionBId: 40, severity: 'BLOCK', rationale: 'Creating employees and approving payroll enables salary payments to fictitious employees.', isActive: true },
  { id: 7, ruleCode: 'SOD-07', ruleName: 'Unreviewed accounting entry', permissionAId: 33, permissionBId: 34, severity: 'BLOCK', rationale: 'Creating and posting journal entries without review enables unauthorized accounting changes.', isActive: true },
  { id: 8, ruleCode: 'SOD-08', ruleName: 'Bid manipulation', permissionAId: 8, permissionBId: 10, severity: 'BLOCK', rationale: 'Creating vendors and quotations enables bid rigging and manipulation.', isActive: true },
  { id: 9, ruleCode: 'SOD-09', ruleName: 'Concealed shrinkage', permissionAId: 12, permissionBId: 13, severity: 'WARNING', rationale: 'Adjusting stock and conducting stock counts may conceal inventory shrinkage or theft.', isActive: true },
  { id: 10, ruleCode: 'SOD-10', ruleName: 'Unreviewed data replacement', permissionAId: 51, permissionBId: 52, severity: 'BLOCK', rationale: 'Creating and restoring backups enables unauthorized data replacement without review.', isActive: true },
];

// ─── Delegations ─────────────────────────────────────────────────────────────

export const delegations: Delegation[] = [
  {
    id: 1,
    fromUserId: 4,  // David Park
    toUserId: 2,    // Sarah Chen
    projectId: 3,   // Commercial Tower
    documentTypes: ['PO', 'PAYMENT'],
    maxAmount: 5000000,
    validFrom: '2025-02-01T00:00:00Z',
    validTo: '2025-02-28T23:59:59Z',
    reason: 'David Park on leave - delegating approval authority',
    status: 'ACTIVE',
    createdBy: 4,
    createdAt: '2025-01-30T10:00:00Z',
  },
];

// ─── Field Restrictions ──────────────────────────────────────────────────────

export const fieldRestrictions: FieldRestriction[] = [
  // Viewers cannot see salary details
  { id: 1, assignmentId: 2, entity: 'employee', fieldName: 'salary', visibility: 'HIDDEN' },
  { id: 2, assignmentId: 2, entity: 'payroll', fieldName: 'net_salary', visibility: 'MASKED' },
  
  // Site engineers cannot see vendor rates
  { id: 3, assignmentId: 3, entity: 'purchase_order', fieldName: 'unit_rate', visibility: 'MASKED' },
];

// ─── Assignment Audit Log ────────────────────────────────────────────────────

export const assignmentAudits: AssignmentAudit[] = [
  {
    id: 1,
    assignmentId: 1,
    userId: 2,
    projectId: 1,
    action: 'ASSIGNED',
    beforeValue: null,
    afterValue: { templateId: 2, designationLabel: 'Project Manager', dataScope: 'PROJECT' },
    changedBy: 1,
    changedAt: '2024-02-28T10:00:00Z',
    reason: 'Initial project setup',
  },
  {
    id: 2,
    assignmentId: 4,
    userId: 4,
    projectId: 3,
    action: 'ASSIGNED',
    beforeValue: null,
    afterValue: { templateId: 1, designationLabel: 'Project Director', dataScope: 'ALL_ASSIGNED' },
    changedBy: 1,
    changedAt: '2023-05-28T10:00:00Z',
    reason: 'Project Director appointment',
  },
  {
    id: 3,
    assignmentId: 1,
    userId: 2,
    projectId: 1,
    action: 'MODIFIED',
    beforeValue: { maxAmount: 3000000 },
    afterValue: { maxAmount: 5000000 },
    changedBy: 1,
    changedAt: '2024-06-15T14:30:00Z',
    reason: 'Increased approval limit due to project expansion',
  },
];
