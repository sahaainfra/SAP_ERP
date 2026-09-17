/**
 * Part 12 — Master Data Types
 * Type definitions for enterprise structure, project masters, BOQ, items, vendors, rates, and governance
 */

// ─── Enterprise Hierarchy ────────────────────────────────────────────────────

export type OrgLevelType = 
  | 'COMPANY'
  | 'BU'
  | 'BRANCH'
  | 'DEPT'
  | 'PROJECT'
  | 'PACKAGE'
  | 'SITE'
  | 'AREA'
  | 'WORKFRONT'
  | 'WBS'
  | 'ACTIVITY'
  | 'COSTCODE';

export interface OrgNode {
  id: number;
  levelType: OrgLevelType;
  sourceTable: string;
  sourceId: number;
  parentId: number | null;
  path: string; // materialized path like '/1/7/23/118'
  depth: number;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  syncedAt: string;
  children?: OrgNode[];
  childrenCount?: number;
}

// ─── Project Master ──────────────────────────────────────────────────────────

export type ContractType = 
  | 'ITEM_RATE'
  | 'LUMPSUM'
  | 'EPC'
  | 'PERCENT_RATE'
  | 'COST_PLUS'
  | 'BOT';

export type BillingCycle = 'MONTHLY' | 'MILESTONE' | 'ON_DEMAND';
export type AdvanceRecoveryRule = 'PRORATA' | 'FIXED_PCT' | 'MILESTONE';

export interface ProjectProfile {
  projectId: number;
  contractType: ContractType;
  clientId: number;
  contractValue: number;
  revisedContractValue?: number;
  loaNumber?: string;
  loaDate?: string;
  agreementDate?: string;
  commencementDate?: string;
  originalCompletion?: string;
  revisedCompletion?: string;
  actualCompletion?: string;
  defectLiabilityMonths?: number;
  retentionPercent?: number;
  retentionCeilingPercent?: number;
  mobilisationAdvPercent?: number;
  materialAdvPercent?: number;
  advanceRecoveryRule?: AdvanceRecoveryRule;
  priceEscalationFlag: boolean;
  escalationFormulaId?: number;
  ldPercentPerWeek?: number;
  ldCeilingPercent?: number;
  currencyCode: string;
  gstStateCode?: string;
  projectGstin?: string;
  billingCycle: BillingCycle;
  healthOverride?: string;
  geofencePolygon?: any; // GeoJSON
  geofenceRadiusM?: number;
  workingCalendarId?: number;
  isClosed: boolean;
  closedAt?: string;
  createdBy: number;
  createdAt: string;
  updatedBy?: number;
  updatedAt?: string;
}

export type ConfigValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE';

export interface ProjectConfig {
  id: number;
  projectId: number;
  configKey: string;
  configValue: string;
  valueType: ConfigValueType;
  updatedBy?: number;
  updatedAt: string;
}

// ─── BOQ Master ──────────────────────────────────────────────────────────────

export type BoqVersionType = 'ORIGINAL' | 'VARIATION' | 'REVISION' | 'FINAL';

export interface BoqVersion {
  id: number;
  projectId: number;
  packageId?: number;
  versionNo: number;
  versionType: BoqVersionType;
  referenceNo?: string;
  effectiveFrom: string;
  status: string;
  approvedBy?: number;
  approvedAt?: string;
  totalValue: number;
  items?: BoqItemExtension[];
}

export interface BoqItemExtension {
  id: number;
  boqItemId: number; // FK to existing BOQ item
  boqVersionId: number;
  parentBoqItemId?: number; // for sub-head grouping
  costCodeId?: number;
  wbsId?: number;
  isProvisional: boolean;
  isDaywork: boolean;
  isNonTendered: boolean;
  qtyCeilingPercent?: number;
  measurementMethod?: string;
  deductionRuleId?: number;
  isLocked: boolean;
}

// ─── Item Master Extensions ──────────────────────────────────────────────────

export interface ItemCategory {
  id: number;
  parentId?: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  path: string;
  isActive: boolean;
  children?: ItemCategory[];
  childrenCount?: number;
}

export interface ItemSpecAttribute {
  id: number;
  categoryId: number;
  attributeName: string;
  attributeType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  isRequired: boolean;
  defaultValue?: string;
  options?: string[]; // for SELECT type
  unit?: string;
}

export interface ItemExtension {
  itemId: number; // FK to existing material_master
  categoryId?: number;
  hsnCode?: string;
  sacCode?: string;
  brand?: string;
  make?: string;
  shelfLifeDays?: number;
  isHazardous: boolean;
  storageConditions?: string;
  reorderLevel?: number;
  reorderQty?: number;
  leadTimeDays?: number;
  standardRate?: number;
  standardRateEffectiveFrom?: string;
  specifications?: Record<string, any>; // JSONB
  alternateItems?: number[]; // item IDs
}

// ─── UoM Master ──────────────────────────────────────────────────────────────

export interface UoM {
  id: number;
  code: string;
  name: string;
  category: 'LENGTH' | 'AREA' | 'VOLUME' | 'WEIGHT' | 'COUNT' | 'TIME' | 'OTHER';
  baseUomId?: number; // for conversion to base unit
  conversionFactor?: number;
  isActive: boolean;
}

export interface UoMConversion {
  id: number;
  fromUom: string;
  toUom: string;
  factor: number;
  itemId?: number; // NULL = global conversion
  isActive: boolean;
}

// ─── Vendor/Client Compliance ────────────────────────────────────────────────

export type PartyType = 'VENDOR' | 'SUBCONTRACTOR' | 'CLIENT';

export type ComplianceDocumentType = 
  | 'GST'
  | 'PAN'
  | 'MSME'
  | 'PF'
  | 'ESIC'
  | 'LABOUR_LICENCE'
  | 'INSURANCE'
  | 'ISO'
  | 'TRADE_LICENCE'
  | 'BANK_PROOF';

export type VerificationSource = 'MANUAL' | 'GSTN_API' | 'PAN_API';

export interface PartyCompliance {
  id: number;
  partyType: PartyType;
  sourceTable: string;
  partyId: number;
  documentType: ComplianceDocumentType;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileId?: number;
  verifiedBy?: number;
  verifiedAt?: string;
  verificationSource?: VerificationSource;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
}

export interface VendorScorecard {
  vendorId: number;
  onTimeDeliveryPercent: number;
  quantityAccuracyPercent: number;
  qcRejectionPercent: number;
  rateCompetitivenessIndex: number;
  documentCompliancePercent: number;
  disputeCount: number;
  avgResponseTimeHours: number;
  overallScore: number; // 0-100
  transactionCount: number;
  lastUpdated: string;
}

export interface VendorCategory {
  id: number;
  code: string;
  name: string;
  description?: string;
  parentId?: number;
  isActive: boolean;
}

export interface ProjectApprovedVendor {
  id: number;
  projectId: number;
  vendorId: number;
  approvedDate: string;
  approvedBy: number;
  validUntil?: string;
  remarks?: string;
}

// ─── Client Master ───────────────────────────────────────────────────────────

export interface Client {
  id: number;
  companyId: number;
  code: string;
  name: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Cost Code Master ────────────────────────────────────────────────────────

export interface CostCode {
  id: number;
  projectId: number;
  code: string;
  name: string;
  description?: string;
  parentId: number | null;
  level: number;
  path: string;
  budgetAmount?: number;
  isActive: boolean;
  children?: CostCode[];
  childrenCount?: number;
}

// ─── Rate Master ─────────────────────────────────────────────────────────────

export type RateType = 
  | 'ITEM'
  | 'LABOUR'
  | 'EQUIPMENT_HIRE'
  | 'SUBCONTRACT'
  | 'TRANSPORT'
  | 'OVERHEAD';

export type RateScopeType = 'GLOBAL' | 'COMPANY' | 'PROJECT' | 'VENDOR' | 'RATE_CONTRACT';

export type RateReferenceType = 'ITEM' | 'BOQ_ITEM' | 'TRADE' | 'EQUIPMENT_TYPE';

export interface RateMaster {
  id: number;
  rateType: RateType;
  scopeType: RateScopeType;
  scopeId?: number;
  referenceType: RateReferenceType;
  referenceId: number;
  uom: string;
  rate: number;
  currencyCode: string;
  effectiveFrom: string;
  effectiveTo?: string;
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
  approvedAt?: string;
  sourceDocument?: string;
  createdBy: number;
  createdAt: string;
}

export interface RateContract {
  id: number;
  contractNumber: string;
  vendorId: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
  rates: RateMaster[];
}

// ─── Numbering Series ────────────────────────────────────────────────────────

export type NumberingScopeType = 'GLOBAL' | 'COMPANY' | 'PROJECT' | 'SITE' | 'FY';
export type ResetRule = 'NEVER' | 'FY' | 'MONTH';

export interface NumberSeries {
  id: number;
  documentType: string;
  scopeType: NumberingScopeType;
  scopeId?: number;
  fiscalYear?: string;
  prefix?: string;
  suffix?: string;
  pattern: string; // e.g. '{PRJ}/PO/{FY}/{####}'
  currentValue: number;
  padding: number;
  resetRule: ResetRule;
  isActive: boolean;
  lastGenerated?: string;
}

export interface NumberGap {
  id: number;
  seriesId: number;
  gapNumber: number;
  reason: string;
  createdAt: string;
}

// ─── Master Data Governance ──────────────────────────────────────────────────

export type MasterType = 
  | 'VENDOR'
  | 'ITEM'
  | 'BOQ'
  | 'COST_CODE'
  | 'RATE'
  | 'CLIENT'
  | 'EQUIPMENT'
  | 'EMPLOYEE'
  | 'PROJECT';

export type ChangeType = 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'REACTIVATE';
export type ChangeRequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'CANCELLED';

export interface MasterGovernance {
  id: number;
  masterType: MasterType;
  sourceTable: string;
  approvalOnCreate: boolean;
  approvalOnUpdate: boolean;
  approvalOnDeactivate: boolean;
  controlledFields: string[]; // JSONB
  duplicateRules: any; // JSONB
  requiredDocuments: string[]; // JSONB
  isEnabled: boolean;
}

export interface MasterChangeRequest {
  id: number;
  requestNo: string;
  masterType: MasterType;
  sourceTable: string;
  sourceId?: number; // NULL for create
  changeType: ChangeType;
  proposedData: any; // JSONB
  currentData?: any; // JSONB
  reason: string;
  status: ChangeRequestStatus;
  requestedBy: number;
  requestedAt: string;
  decidedBy?: number;
  decidedAt?: string;
  decisionNote?: string;
  appliedAt?: string;
  appliedRecordId?: number;
}

export interface MasterAudit {
  id: number;
  masterType: MasterType;
  sourceTable: string;
  sourceId: number;
  action: 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'MERGE_LINK';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeRequestId?: number;
  changedBy: number;
  changedAt: string;
  ipAddress?: string;
  rowHash: string; // chained hash
}

export interface MasterMerge {
  id: number;
  masterType: MasterType;
  sourceTable: string;
  survivingId: number;
  mergedId: number;
  mergedBy: number;
  mergedAt: string;
  reason: string;
  transactionCount: number;
}

// ─── Data Quality ────────────────────────────────────────────────────────────

export interface MasterQualityMetric {
  masterType: MasterType;
  totalRecords: number;
  completeRecords: number;
  completenessPercent: number;
  duplicateCandidates: number;
  expiredDocuments: number;
  orphanReferences: number;
  inactiveWithTransactions: number;
  notUsedIn24Months: number;
  lastComputed: string;
}

export interface DuplicateCandidate {
  id: number;
  masterType: MasterType;
  sourceTable: string;
  recordId1: number;
  recordId2: number;
  matchScore: number; // 0-100
  matchFields: string[];
  status: 'PENDING' | 'REVIEWED' | 'MERGED' | 'DISMISSED';
  detectedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface ResolveRateRequest {
  rateType: RateType;
  referenceType: RateReferenceType;
  referenceId: number;
  scopeType?: RateScopeType;
  scopeId?: number;
  transactionDate: string;
}

export interface ResolveRateResponse {
  rateId: number;
  rate: number;
  uom: string;
  currencyCode: string;
  effectiveFrom: string;
  source: string; // which rate was used (rate contract, project, vendor, company, global)
}

export interface AllocateNumberRequest {
  documentType: string;
  scopeType: NumberingScopeType;
  scopeId?: number;
  fiscalYear?: string;
}

export interface AllocateNumberResponse {
  number: string;
  seriesId: number;
  allocatedAt: string;
}

export interface CheckDuplicateRequest {
  masterType: MasterType;
  data: any;
}

export interface CheckDuplicateResponse {
  isDuplicate: boolean;
  matchType: 'HARD_BLOCK' | 'SOFT_WARN' | 'NO_MATCH';
  candidates: Array<{
    id: number;
    code: string;
    name: string;
    matchScore: number;
    matchFields: string[];
  }>;
}

export interface VendorComplianceCheckResponse {
  isCompliant: boolean;
  expiredDocuments: ComplianceDocumentType[];
  missingDocuments: ComplianceDocumentType[];
  expiringSoon: Array<{
    documentType: ComplianceDocumentType;
    expiryDate: string;
    daysUntilExpiry: number;
  }>;
}
