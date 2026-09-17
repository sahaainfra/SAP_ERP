/**
 * Schema Map Configuration
 * 
 * Maps logical business object names to physical database table/column names.
 * This is the ONLY place where real table names appear.
 * 
 * Rules:
 * - Every repository reads names from SCHEMA_MAP
 * - No table name is ever hard-coded in a query
 * - On boot, validate against information_schema
 * - Missing tables disable only their feature, never crash the app
 */

export interface SchemaMapping {
  table: string;
  pk: string;
  [key: string]: string;
}

export const SCHEMA_MAP = {
  // ── Core Business Objects ──────────────────────────────────────────────────
  
  company: {
    table: 'companies',
    pk: 'id',
    name: 'company_name',
    code: 'company_code',
    address: 'address',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  branch: {
    table: 'branches',
    pk: 'id',
    companyId: 'company_id',
    name: 'branch_name',
    code: 'branch_code',
    address: 'address',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  department: {
    table: 'departments',
    pk: 'id',
    companyId: 'company_id',
    branchId: 'branch_id',
    name: 'department_name',
    code: 'department_code',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  user: {
    table: 'users',
    pk: 'id',
    companyId: 'company_id',
    branchId: 'branch_id',
    departmentId: 'department_id',
    username: 'username',
    email: 'email',
    fullName: 'full_name',
    role: 'role',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    lastLogin: 'last_login',
  },
  
  role: {
    table: 'roles',
    pk: 'id',
    companyId: 'company_id',
    name: 'role_name',
    code: 'role_code',
    description: 'description',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  permission: {
    table: 'permissions',
    pk: 'id',
    name: 'permission_name',
    code: 'permission_code',
    module: 'module',
    description: 'description',
    createdAt: 'created_at',
  },
  
  // ── Project Management ─────────────────────────────────────────────────────
  
  project: {
    table: 'projects',
    pk: 'id',
    companyId: 'company_id',
    branchId: 'branch_id',
    code: 'project_code',
    name: 'project_name',
    clientId: 'client_id',
    location: 'location',
    status: 'status',
    startDate: 'start_date',
    endDate: 'end_date',
    contractValue: 'contract_value',
    budget: 'budget',
    progress: 'progress_percentage',
    managerId: 'project_manager_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
  
  package: {
    table: 'packages',
    pk: 'id',
    projectId: 'project_id',
    code: 'package_code',
    name: 'package_name',
    status: 'status',
    startDate: 'start_date',
    endDate: 'end_date',
    budget: 'budget',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  site: {
    table: 'sites',
    pk: 'id',
    projectId: 'project_id',
    packageId: 'package_id',
    name: 'site_name',
    code: 'site_code',
    location: 'location',
    supervisorId: 'supervisor_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  contract: {
    table: 'contracts',
    pk: 'id',
    projectId: 'project_id',
    clientId: 'client_id',
    contractNumber: 'contract_number',
    contractDate: 'contract_date',
    contractValue: 'contract_value',
    status: 'status',
    startDate: 'start_date',
    endDate: 'end_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  // ── Procurement ────────────────────────────────────────────────────────────
  
  vendor: {
    table: 'vendors',
    pk: 'id',
    companyId: 'company_id',
    name: 'vendor_name',
    code: 'vendor_code',
    gstNumber: 'gst_number',
    panNumber: 'pan_number',
    address: 'address',
    contactPerson: 'contact_person',
    contactPhone: 'contact_phone',
    contactEmail: 'contact_email',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  materialRequisition: {
    table: 'material_requisitions',
    pk: 'id',
    projectId: 'project_id',
    siteId: 'site_id',
    mrNumber: 'mr_number',
    mrDate: 'mr_date',
    requiredDate: 'required_date',
    requestedBy: 'requested_by',
    status: 'status',
    remarks: 'remarks',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  purchaseRequisition: {
    table: 'purchase_requisitions',
    pk: 'id',
    projectId: 'project_id',
    mrId: 'mr_id',
    prNumber: 'pr_number',
    prDate: 'pr_date',
    requestedBy: 'requested_by',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  rfq: {
    table: 'rfqs',
    pk: 'id',
    prId: 'pr_id',
    rfqNumber: 'rfq_number',
    rfqDate: 'rfq_date',
    lastDate: 'last_date',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  quotation: {
    table: 'quotations',
    pk: 'id',
    rfqId: 'rfq_id',
    vendorId: 'vendor_id',
    quotationNumber: 'quotation_number',
    quotationDate: 'quotation_date',
    validity: 'validity',
    totalAmount: 'total_amount',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  comparativeStatement: {
    table: 'comparative_statements',
    pk: 'id',
    rfqId: 'rfq_id',
    csNumber: 'cs_number',
    csDate: 'cs_date',
    preparedBy: 'prepared_by',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  purchaseOrder: {
    table: 'purchase_orders',
    pk: 'id',
    projectId: 'project_id',
    vendorId: 'vendor_id',
    poNumber: 'po_number',
    poDate: 'po_date',
    totalAmount: 'total_amount',
    status: 'status',
    deliveryDate: 'delivery_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
  
  // ── Materials & Inventory ──────────────────────────────────────────────────
  
  materialMaster: {
    table: 'material_master',
    pk: 'id',
    companyId: 'company_id',
    code: 'material_code',
    name: 'material_name',
    description: 'description',
    uom: 'unit_of_measure',
    category: 'category',
    decimalPlaces: 'decimal_places',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  store: {
    table: 'stores',
    pk: 'id',
    projectId: 'project_id',
    siteId: 'site_id',
    name: 'store_name',
    code: 'store_code',
    location: 'location',
    storeKeeperId: 'store_keeper_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  stockLedger: {
    table: 'stock_ledger',
    pk: 'id',
    storeId: 'store_id',
    materialId: 'material_id',
    quantity: 'quantity',
    value: 'value',
    lastUpdated: 'last_updated',
  },
  
  grn: {
    table: 'grns',
    pk: 'id',
    poId: 'po_id',
    storeId: 'store_id',
    grnNumber: 'grn_number',
    grnDate: 'grn_date',
    receivedBy: 'received_by',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  materialIssue: {
    table: 'material_issues',
    pk: 'id',
    storeId: 'store_id',
    issueNumber: 'issue_number',
    issueDate: 'issue_date',
    issuedTo: 'issued_to',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  // ── Finance & Billing ──────────────────────────────────────────────────────
  
  measurementBook: {
    table: 'measurement_books',
    pk: 'id',
    projectId: 'project_id',
    mbNumber: 'mb_number',
    mbDate: 'mb_date',
    measuredBy: 'measured_by',
    checkedBy: 'checked_by',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  raBill: {
    table: 'ra_bills',
    pk: 'id',
    projectId: 'project_id',
    billNumber: 'bill_number',
    billDate: 'bill_date',
    billAmount: 'bill_amount',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  clientInvoice: {
    table: 'client_invoices',
    pk: 'id',
    projectId: 'project_id',
    invoiceNumber: 'invoice_number',
    invoiceDate: 'invoice_date',
    invoiceAmount: 'invoice_amount',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  payment: {
    table: 'payments',
    pk: 'id',
    projectId: 'project_id',
    vendorId: 'vendor_id',
    paymentNumber: 'payment_number',
    paymentDate: 'payment_date',
    amount: 'amount',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  receipt: {
    table: 'receipts',
    pk: 'id',
    projectId: 'project_id',
    receiptNumber: 'receipt_number',
    receiptDate: 'receipt_date',
    amount: 'amount',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  journalVoucher: {
    table: 'journal_vouchers',
    pk: 'id',
    companyId: 'company_id',
    voucherNumber: 'voucher_number',
    voucherDate: 'voucher_date',
    amount: 'amount',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  chartOfAccounts: {
    table: 'chart_of_accounts',
    pk: 'id',
    companyId: 'company_id',
    accountCode: 'account_code',
    accountName: 'account_name',
    accountType: 'account_type',
    parentAccountId: 'parent_account_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  // ── HR & Labour ────────────────────────────────────────────────────────────
  
  employee: {
    table: 'employees',
    pk: 'id',
    companyId: 'company_id',
    branchId: 'branch_id',
    departmentId: 'department_id',
    employeeCode: 'employee_code',
    fullName: 'full_name',
    designation: 'designation',
    dateOfJoining: 'date_of_joining',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  labour: {
    table: 'labour',
    pk: 'id',
    projectId: 'project_id',
    siteId: 'site_id',
    labourCode: 'labour_code',
    fullName: 'full_name',
    trade: 'trade',
    dailyWage: 'daily_wage',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  attendance: {
    table: 'attendance',
    pk: 'id',
    employeeId: 'employee_id',
    date: 'date',
    status: 'status',
    hoursWorked: 'hours_worked',
    createdAt: 'created_at',
  },
  
  payroll: {
    table: 'payroll',
    pk: 'id',
    employeeId: 'employee_id',
    month: 'month',
    year: 'year',
    basicSalary: 'basic_salary',
    allowances: 'allowances',
    deductions: 'deductions',
    netSalary: 'net_salary',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  // ── Quality & Safety ───────────────────────────────────────────────────────
  
  inspectionTestPlan: {
    table: 'inspection_test_plans',
    pk: 'id',
    projectId: 'project_id',
    itpNumber: 'itp_number',
    activity: 'activity',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  workInspectionRequest: {
    table: 'work_inspection_requests',
    pk: 'id',
    projectId: 'project_id',
    wirNumber: 'wir_number',
    wirDate: 'wir_date',
    requestedBy: 'requested_by',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  nonConformanceReport: {
    table: 'non_conformance_reports',
    pk: 'id',
    projectId: 'project_id',
    ncrNumber: 'ncr_number',
    ncrDate: 'ncr_date',
    description: 'description',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  hseIncident: {
    table: 'hse_incidents',
    pk: 'id',
    projectId: 'project_id',
    siteId: 'site_id',
    incidentNumber: 'incident_number',
    incidentDate: 'incident_date',
    incidentType: 'incident_type',
    severity: 'severity',
    description: 'description',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  // ── Plant & Equipment ──────────────────────────────────────────────────────
  
  plantEquipment: {
    table: 'plant_equipment',
    pk: 'id',
    companyId: 'company_id',
    equipmentCode: 'equipment_code',
    equipmentName: 'equipment_name',
    category: 'category',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  equipmentLogbook: {
    table: 'equipment_logbooks',
    pk: 'id',
    equipmentId: 'equipment_id',
    projectId: 'project_id',
    date: 'date',
    hoursUsed: 'hours_used',
    operatorId: 'operator_id',
    remarks: 'remarks',
    createdAt: 'created_at',
  },
  
  fuelConsumption: {
    table: 'fuel_consumption',
    pk: 'id',
    equipmentId: 'equipment_id',
    date: 'date',
    quantity: 'quantity',
    cost: 'cost',
    createdAt: 'created_at',
  },
  
  // ── Documents & Workflow ───────────────────────────────────────────────────
  
  document: {
    table: 'documents',
    pk: 'id',
    projectId: 'project_id',
    documentType: 'document_type',
    documentNumber: 'document_number',
    title: 'title',
    filePath: 'file_path',
    uploadedBy: 'uploaded_by',
    uploadedAt: 'uploaded_at',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  task: {
    table: 'tasks',
    pk: 'id',
    projectId: 'project_id',
    assignedTo: 'assigned_to',
    title: 'title',
    description: 'description',
    dueDate: 'due_date',
    priority: 'priority',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  approvalWorkflow: {
    table: 'approval_workflows',
    pk: 'id',
    entityType: 'entity_type',
    entityId: 'entity_id',
    requestedBy: 'requested_by',
    approvedBy: 'approved_by',
    status: 'status',
    requestedAt: 'requested_at',
    approvedAt: 'approved_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  notification: {
    table: 'notifications',
    pk: 'id',
    userId: 'user_id',
    type: 'type',
    title: 'title',
    message: 'message',
    isRead: 'is_read',
    createdAt: 'created_at',
  },
  
  auditLog: {
    table: 'audit_logs',
    pk: 'id',
    userId: 'user_id',
    action: 'action',
    entityType: 'entity_type',
    entityId: 'entity_id',
    oldValue: 'old_value',
    newValue: 'new_value',
    ipAddress: 'ip_address',
    userAgent: 'user_agent',
    createdAt: 'created_at',
  },
  
  // ── Dashboard Extension Tables (additive) ──────────────────────────────────
  
  userPreference: {
    table: 'dx_user_preference',
    pk: 'id',
    userId: 'user_id',
    prefKey: 'pref_key',
    prefValue: 'pref_value',
    companyId: 'company_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  kpiDefinition: {
    table: 'dx_kpi_definition',
    pk: 'id',
    name: 'name',
    code: 'code',
    description: 'description',
    formula: 'formula',
    unit: 'unit',
    module: 'module',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  
  dashboardLayout: {
    table: 'dx_dashboard_layout',
    pk: 'id',
    userId: 'user_id',
    layoutName: 'layout_name',
    layoutConfig: 'layout_config',
    isDefault: 'is_default',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
} as const;

/**
 * Validate schema map against database
 * Returns list of missing tables/columns
 */
export async function validateSchemaMap(): Promise<{
  valid: boolean;
  missing: Array<{ entity: string; table: string; column?: string }>;
}> {
  // In a real implementation, this would query information_schema
  // For now, we'll return a mock validation result
  
  const missing: Array<{ entity: string; table: string; column?: string }> = [];
  
  // Mock validation - in production, this would check actual database
  // For each entity in SCHEMA_MAP, verify table and columns exist
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get schema mapping for an entity
 * Returns null if entity is not configured
 */
export function getSchemaMapping(entity: keyof typeof SCHEMA_MAP): SchemaMapping | null {
  return SCHEMA_MAP[entity] || null;
}

/**
 * Check if an entity is configured
 */
export function isEntityConfigured(entity: keyof typeof SCHEMA_MAP): boolean {
  return entity in SCHEMA_MAP;
}
