/**
 * Part 16 — Subcontractor & Work Order Types
 * Type definitions for work orders, SC billing, free-issue, compliance, and performance
 */

// ─── Work Order ──────────────────────────────────────────────────────────────

export type WoType = 'ITEM_RATE' | 'LUMPSUM' | 'LABOUR_ONLY' | 'LABOUR_MATERIAL' | 'PIECE_RATE' | 'HIRE';
export type WoStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'TERMINATED';
export type WoClosureType = 'COMPLETED' | 'TERMINATED' | 'MUTUAL_CLOSE';
export type FreeIssuePolicy = 'NONE' | 'RECOVERABLE' | 'NON_RECOVERABLE' | 'WASTAGE_LIMITED';
export type AdvRecoveryRule = 'PRORATA' | 'FIXED_PCT' | 'MILESTONE';

export interface WorkOrder {
  id: number;
  woNo: string;
  legacyWoId?: number;
  projectId: number;
  packageId?: number;
  subcontractorId: number;
  woType: WoType;
  workCategoryId?: number;
  title: string;
  scopeOfWork?: string;
  woDate: string;
  startDate?: string;
  completionDate?: string;
  revisedCompletionDate?: string;
  woValue: number;
  revisedWoValue?: number;
  currencyCode: string;
  securityDepositPct?: number;
  retentionPct?: number;
  retentionCeilingPct?: number;
  mobilisationAdvPct?: number;
  advRecoveryRule?: AdvRecoveryRule;
  defectLiabilityMonths?: number;
  ldPerDayPct?: number;
  ldCeilingPct?: number;
  freeIssuePolicy?: FreeIssuePolicy;
  wastageAllowancePct?: number;
  labourComplianceRequired: boolean;
  status: WoStatus;
  approvedBy?: number;
  approvedAt?: string;
  releasedAt?: string;
  closedAt?: string;
  closureType?: WoClosureType;
  items?: WorkOrderItem[];
  amendments?: WoAmendment[];
  // Computed fields
  aggregateMarginPct?: number;
  executedValue?: number;
  certifiedValue?: number;
  billedValue?: number;
}

export interface WorkOrderItem {
  id: number;
  workOrderId: number;
  lineNo: number;
  boqItemId?: number;
  wbsId?: number;
  costCodeId?: number;
  description: string;
  uom: string;
  woQty: number;
  woRate: number;
  amount: number;
  boqRate?: number; // client rate for margin comparison
  marginPct?: number; // computed: (woRate - boqRate) / boqRate * 100
  qtyCeilingPct?: number;
  executedQty: number;
  certifiedQty: number;
  billedQty: number;
  isExtraItem: boolean;
}

export type WoAmendmentType = 'QTY' | 'RATE' | 'SCOPE' | 'TIME_EXTENSION' | 'EXTRA_ITEM' | 'TERMINATION';

export interface WoAmendment {
  id: number;
  workOrderId: number;
  amendmentNo: number;
  amendmentType: WoAmendmentType;
  reason: string;
  beforeSnapshot: any; // JSONB
  afterSnapshot: any; // JSONB
  valueImpact?: number;
  timeImpactDays?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
  approvedAt?: string;
}

export interface WoReleaseGate {
  gateName: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

export interface WoReleaseValidation {
  canRelease: boolean;
  gates: WoReleaseGate[];
  failedGates: string[];
  aggregateMarginPct: number;
}

// ─── Free Issue Material ─────────────────────────────────────────────────────

export type RecoveryRateBasis = 'WAC' | 'PO_RATE' | 'PENAL' | 'CONTRACT';

export interface FreeIssueAccount {
  id: number;
  workOrderId: number;
  subcontractorId: number;
  projectId: number;
  itemId: number;
  issuedQty: number;
  returnedQty: number;
  theoreticalConsumption: number;
  allowedWastage: number;
  excessQty: number;
  recoveryRate?: number;
  recoveryRateBasis?: RecoveryRateBasis;
  recoveredQty: number;
  recoveredValue: number;
  balanceQty: number;
  lastReconciledAt?: string;
  // Additional computed fields
  itemName?: string;
  itemCode?: string;
  uom?: string;
  recoveryAmount?: number;
}

export interface FreeIssueReconciliation {
  workOrderId: number;
  itemId: number;
  reconciliationDate: string;
  issuedQty: number;
  returnedQty: number;
  theoreticalConsumption: number;
  allowedWastage: number;
  excessQty: number;
  recoveryRate: number;
  recoveryAmount: number;
  reconciledBy: number;
  status: 'PENDING' | 'RECONCILED' | 'DISPUTED';
  disputeReason?: string;
}

// ─── SC Bill ─────────────────────────────────────────────────────────────────

export type ScBillType = 'RA' | 'ADVANCE' | 'FINAL' | 'SUPPLEMENTARY' | 'DLP_RELEASE';
export type ScBillStatus = 'DRAFT' | 'MEASURED' | 'CHECKED' | 'CERTIFIED' | 'APPROVED_FOR_PAYMENT' | 'PAID' | 'REJECTED';

export interface ScBill {
  id: number;
  billNo: string;
  legacyBillId?: number;
  workOrderId: number;
  subcontractorId: number;
  projectId: number;
  billType: ScBillType;
  raNumber?: number;
  periodFrom?: string;
  periodTo?: string;
  grossValue: number;
  previousGross: number;
  currentGross: number;
  totalDeductions: number;
  netPayable: number;
  status: ScBillStatus;
  measuredBy?: number;
  checkedBy?: number;
  certifiedBy?: number;
  certifiedAt?: string;
  scInvoiceNo?: string;
  scInvoiceDate?: string;
  gstApplicable: boolean;
  isRcm: boolean;
  paymentDueDate?: string;
  items?: ScBillItem[];
  deductions?: ScBillDeduction[];
  // Validation flags
  exceedsClientCertifiedQty?: boolean;
  hasOpenCriticalNcr?: boolean;
  hasSafetyViolation?: boolean;
  freeIssueUnreconciled?: boolean;
}

export interface ScBillItem {
  id: number;
  scBillId: number;
  woItemId: number;
  description: string;
  uom: string;
  previousQty: number;
  currentQty: number;
  totalQty: number;
  rate: number;
  amount: number;
  remarks?: string;
  isExtraItem?: boolean;
}

export type DeductionType = 
  | 'RETENTION'
  | 'SECURITY_DEPOSIT'
  | 'MOB_ADV_RECOVERY'
  | 'MAT_ADV_RECOVERY'
  | 'FREE_ISSUE_RECOVERY'
  | 'TDS_IT'
  | 'TDS_GST'
  | 'LABOUR_CESS'
  | 'PF_NON_COMPLIANCE'
  | 'ESIC'
  | 'LD'
  | 'BACKCHARGE'
  | 'ELECTRICITY'
  | 'WATER'
  | 'ACCOMMODATION'
  | 'EQUIPMENT_HIRE'
  | 'SAFETY_PENALTY'
  | 'QUALITY_PENALTY'
  | 'DEBIT_NOTE'
  | 'OTHER';

export type DeductionBasis = 'PCT_GROSS' | 'PCT_NET' | 'FIXED' | 'QTY_RATE' | 'FORMULA';

export interface ScBillDeduction {
  id: number;
  scBillId: number;
  deductionType: DeductionType;
  basis: DeductionBasis;
  basisValue?: number;
  amount: number;
  isSystemGenerated: boolean;
  referenceType?: string;
  referenceId?: number;
  remark?: string;
  isRefundable: boolean;
  releasedAt?: string;
  // For system-generated deductions
  originalAmount?: number; // if overridden
  overrideReason?: string;
  overriddenBy?: number;
}

export interface DeductionSequence {
  id: number;
  companyId: number;
  deductionType: DeductionType;
  sequenceOrder: number;
  isActive: boolean;
}

// ─── Labour Compliance ───────────────────────────────────────────────────────

export type ComplianceStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'NON_COMPLIANT';

export interface ScCompliancePeriod {
  id: number;
  subcontractorId: number;
  projectId: number;
  periodMonth: string; // YYYY-MM
  labourCount?: number;
  wageRegisterFileId?: number;
  pfChallanNo?: string;
  pfAmount?: number;
  pfFileId?: number;
  esicChallanNo?: string;
  esicAmount?: number;
  esicFileId?: number;
  wagePaymentProofFileId?: number;
  minimumWageCompliant?: boolean;
  status: ComplianceStatus;
  verifiedBy?: number;
  verifiedAt?: string;
  withheldAmount: number;
  // Additional fields
  subcontractorName?: string;
  projectName?: string;
  geoAttendanceCount?: number; // from Part 20
  attendanceVariance?: number; // geo vs declared
}

// ─── Backcharge ──────────────────────────────────────────────────────────────

export type BackchargeStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'RECOVERED';
export type BackchargeType = 'WORK_DONE' | 'DAMAGE' | 'RECTIFICATION' | 'SAFETY_VIOLATION' | 'QUALITY_ISSUE' | 'OTHER';

export interface Backcharge {
  id: number;
  backchargeNo: string;
  workOrderId: number;
  subcontractorId: number;
  projectId: number;
  backchargeType: BackchargeType;
  description: string;
  amount: number;
  evidenceFileIds: number[];
  raisedBy: number;
  raisedAt: string;
  approvedBy?: number;
  approvedAt?: string;
  status: BackchargeStatus;
  recoveredInBillId?: number;
  remarks?: string;
}

// ─── Retention & Advance Ledgers ─────────────────────────────────────────────

export interface RetentionLedger {
  id: number;
  workOrderId: number;
  subcontractorId: number;
  projectId: number;
  billId: number;
  billNo: string;
  billDate: string;
  grossValue: number;
  retentionPct: number;
  retentionAmount: number;
  cumulativeRetention: number;
  retentionCeiling: number;
  ceilingReached: boolean;
  releasedAmount: number;
  balanceRetention: number;
}

export interface AdvanceLedger {
  id: number;
  workOrderId: number;
  subcontractorId: number;
  projectId: number;
  advanceType: 'MOBILISATION' | 'MATERIAL';
  advanceAmount: number;
  billId?: number;
  billNo?: string;
  billDate?: string;
  recoveryAmount: number;
  cumulativeRecovery: number;
  balanceAdvance: number;
  fullyRecovered: boolean;
}

// ─── SC Performance ──────────────────────────────────────────────────────────

export interface ScPerformance {
  subcontractorId: number;
  subcontractorName: string;
  projectId: number;
  totalMeasurements: number;
  quantityAchievedPct: number;
  qualityScore: number; // 0-100
  safetyScore: number; // 0-100
  complianceScore: number; // 0-100
  billingDisputeCount: number;
  freeIssueExcessPct: number;
  timePerformancePct: number;
  overallScore: number; // 0-100 weighted
  lastUpdated: string;
  insufficientData: boolean;
}

// ─── DLP Tracking ────────────────────────────────────────────────────────────

export type DlpStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RELEASED';

export interface DlpTracker {
  id: number;
  workOrderId: number;
  subcontractorId: number;
  projectId: number;
  woCompletionDate: string;
  dlpEndDate: string;
  defectLiabilityMonths: number;
  retentionAmount: number;
  status: DlpStatus;
  releaseTaskCreated: boolean;
  releaseTaskId?: number;
  releasedAt?: string;
  releasedBy?: number;
  daysRemaining?: number;
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface CreateWorkOrderRequest {
  projectId: number;
  subcontractorId: number;
  woType: WoType;
  title: string;
  scopeOfWork?: string;
  woDate: string;
  startDate?: string;
  completionDate?: string;
  woValue: number;
  retentionPct?: number;
  retentionCeilingPct?: number;
  mobilisationAdvPct?: number;
  items: Array<{
    boqItemId?: number;
    wbsId?: number;
    costCodeId?: number;
    description: string;
    uom: string;
    woQty: number;
    woRate: number;
    boqRate?: number;
    isExtraItem?: boolean;
  }>;
}

export interface ValidateWoReleaseResponse {
  validation: WoReleaseValidation;
  canRelease: boolean;
  blockedBy: string[];
}

export interface ReconcileFreeIssueRequest {
  workOrderId: number;
  itemId: number;
  reconciliationDate: string;
  disputeReason?: string;
}

export interface CreateScBillRequest {
  workOrderId: number;
  billType: ScBillType;
  raNumber?: number;
  periodFrom?: string;
  periodTo?: string;
  items: Array<{
    woItemId: number;
    previousQty: number;
    currentQty: number;
    rate: number;
    remarks?: string;
  }>;
}

export interface CreateBackchargeRequest {
  workOrderId: number;
  backchargeType: BackchargeType;
  description: string;
  amount: number;
  evidenceFileIds: number[];
  remarks?: string;
}

export interface VerifyComplianceRequest {
  complianceId: number;
  status: ComplianceStatus;
  withheldAmount: number;
  remarks?: string;
}

export interface GetScPerformanceRequest {
  subcontractorId: number;
  projectId?: number;
  fromDate?: string;
  toDate?: string;
}

// ─── KPI Types ───────────────────────────────────────────────────────────────

export interface ScKpis {
  woValueAwarded: number;
  woValueOpen: number;
  woValueCompleted: number;
  avgMarginPct: number;
  negativeMarginWoCount: number;
  scBillsPendingCertification: number;
  scBillsPendingCertificationValue: number;
  scPayable: number;
  retentionHeld: number;
  advanceOutstanding: number;
  freeIssueExcessValue: number;
  labourCompliancePct: number;
  backchargeValue: number;
  ldExposure: number;
  scPerformanceAvg: number;
  wosPastCompletionDate: number;
}

// ─── Report Types ────────────────────────────────────────────────────────────

export interface WoRegisterReport {
  workOrders: Array<{
    woNo: string;
    subcontractorName: string;
    woType: WoType;
    woValue: number;
    executedValue: number;
    certifiedValue: number;
    billedValue: number;
    marginPct: number;
    status: WoStatus;
    startDate: string;
    completionDate: string;
  }>;
}

export interface ScBillRegisterReport {
  bills: Array<{
    billNo: string;
    woNo: string;
    subcontractorName: string;
    billType: ScBillType;
    grossValue: number;
    deductions: number;
    netPayable: number;
    status: ScBillStatus;
    certifiedAt: string;
    ageDays: number;
  }>;
}

export interface FreeIssueReconciliationReport {
  workOrderId: number;
  woNo: string;
  subcontractorName: string;
  items: Array<{
    itemName: string;
    issuedQty: number;
    returnedQty: number;
    theoreticalConsumption: number;
    excessQty: number;
    recoveryRate: number;
    recoveryAmount: number;
    status: string;
  }>;
  totalRecoveryAmount: number;
}

export interface ScPerformanceReport {
  subcontractors: Array<{
    subcontractorName: string;
    totalWoCount: number;
    totalWoValue: number;
    avgMarginPct: number;
    qualityScore: number;
    safetyScore: number;
    complianceScore: number;
    overallScore: number;
    ranking: number;
  }>;
}
