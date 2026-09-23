/**
 * Part 02 — Schema Map Adapter Layer
 * 
 * This is the SINGLE PLACE where physical table and column names appear.
 * Every repository reads names from SCHEMA_MAP. No table name is ever
 * hard-coded in a query.
 * 
 * When a business object is NOT PRESENT, its map entry is null and every
 * feature that depends on it renders the "module not configured" empty
 * state instead of erroring.
 * 
 * This file is populated from SYSTEM_MAP.md inspection results.
 */

export interface TableMapping {
  table: string;
  pk: string;
  [column: string]: string;
}

export interface SchemaMap {
  [businessObject: string]: TableMapping | null;
}

/**
 * SCHEMA_MAP — Logical to Physical Mapping
 * 
 * Current state: Fresh workspace, no existing ERP database.
 * All business objects are NOT PRESENT (null).
 * 
 * When Part 02 inspects a real database, this map is populated with
 * actual table names from SYSTEM_MAP.md.
 */
export const SCHEMA_MAP: SchemaMap = {
  // Organization & Hierarchy
  company: null, // NOT PRESENT
  branch: null, // NOT PRESENT
  department: null, // NOT PRESENT
  
  // User & Security
  user: null, // NOT PRESENT
  role: null, // NOT PRESENT
  permission: null, // NOT PRESENT
  
  // Master Data
  client: null, // NOT PRESENT
  vendor: null, // NOT PRESENT
  employee: null, // NOT PRESENT
  labour: null, // NOT PRESENT
  
  // Project Management
  project: null, // NOT PRESENT
  package: null, // NOT PRESENT
  site: null, // NOT PRESENT
  contract: null, // NOT PRESENT
  tender: null, // NOT PRESENT
  boqHeader: null, // NOT PRESENT
  boqItem: null, // NOT PRESENT
  wbs: null, // NOT PRESENT
  activity: null, // NOT PRESENT
  
  // Procurement
  materialMaster: null, // NOT PRESENT
  materialRequisition: null, // NOT PRESENT
  purchaseRequisition: null, // NOT PRESENT
  rfq: null, // NOT PRESENT
  quotation: null, // NOT PRESENT
  comparativeStatement: null, // NOT PRESENT
  purchaseOrderHeader: null, // NOT PRESENT
  purchaseOrderItem: null, // NOT PRESENT
  
  // Store & Materials
  grn: null, // NOT PRESENT
  store: null, // NOT PRESENT
  stockLedger: null, // NOT PRESENT
  materialIssue: null, // NOT PRESENT
  materialReturn: null, // NOT PRESENT
  materialTransfer: null, // NOT PRESENT
  
  // Execution
  dpr: null, // NOT PRESENT
  measurementBook: null, // NOT PRESENT
  
  // Billing & Finance
  raBill: null, // NOT PRESENT
  clientInvoice: null, // NOT PRESENT
  payment: null, // NOT PRESENT
  receipt: null, // NOT PRESENT
  journalVoucher: null, // NOT PRESENT
  chartOfAccounts: null, // NOT PRESENT
  
  // Equipment
  plantEquipment: null, // NOT PRESENT
  equipmentLogbook: null, // NOT PRESENT
  fuel: null, // NOT PRESENT
  
  // RMC
  rmcBatch: null, // NOT PRESENT
  mixDesign: null, // NOT PRESENT
  
  // HR
  attendance: null, // NOT PRESENT
  payroll: null, // NOT PRESENT
  
  // Quality & Safety
  qaItp: null, // NOT PRESENT
  qaWir: null, // NOT PRESENT
  qaMir: null, // NOT PRESENT
  qaNcr: null, // NOT PRESENT
  hseIncident: null, // NOT PRESENT
  hsePermit: null, // NOT PRESENT
  hseObservation: null, // NOT PRESENT
  
  // Documents & Workflow
  document: null, // NOT PRESENT
  task: null, // NOT PRESENT
  approvalWorkflow: null, // NOT PRESENT
  notification: null, // NOT PRESENT
  auditLog: null, // NOT PRESENT
};

/**
 * Get table mapping for a business object
 * Returns null if the object is NOT PRESENT
 */
export function getTableMapping(businessObject: string): TableMapping | null {
  return SCHEMA_MAP[businessObject] || null;
}

/**
 * Check if a business object exists in the schema
 */
export function isBusinessObjectPresent(businessObject: string): boolean {
  return SCHEMA_MAP[businessObject] !== null;
}

/**
 * Get all business objects that are NOT PRESENT
 */
export function getMissingBusinessObjects(): string[] {
  return Object.entries(SCHEMA_MAP)
    .filter(([_, mapping]) => mapping === null)
    .map(([name, _]) => name);
}

/**
 * Get all business objects that ARE PRESENT
 */
export function getPresentBusinessObjects(): string[] {
  return Object.entries(SCHEMA_MAP)
    .filter(([_, mapping]) => mapping !== null)
    .map(([name, _]) => name);
}
