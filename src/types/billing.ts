/**
 * Part 18 — Client Billing Types
 * Type definitions for RA billing, variations, escalation, claims, and revenue
 */

// ─── Client Bill ─────────────────────────────────────────────────────────────

export type BillType = 
  | 'RA'
  | 'MOBILISATION_ADVANCE'
  | 'MATERIAL_ADVANCE'
  | 'MILESTONE'
  | 'SUPPLEMENTARY'
  | 'FINAL'
  | 'DLP_RELEASE'
  | 'ESCALATION'
  | 'CLAIM';

export type BillStatus = 
  | 'DRAFT'
  | 'PREPARED'
  | 'CHECKED'
  | 'APPROVED'
  | 'SUBMITTED'
  | 'CERTIFIED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'CANCELLED'
  | 'REJECTED';

export interface ClientBill {
  id: number;
  billNo: string;
  legacyBillId?: number;
  projectId: number;
  packageId?: number;
  clientId: number;
  billType: BillType;
  raNumber?: number;
  periodFrom?: string;
  periodTo?: string;
  billDate: string;
  boqVersionId: number;
  mbIds: number[]; // certified MBs included
  grossValue: number;
  previousGross: number;
  currentGross: number;
  escalationAmount: number;
  variationAmount: number;
  materialOnSite: number;
  totalDeductions: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  netReceivable: number;
  status: BillStatus;
  preparedBy?: number;
  checkedBy?: number;
  approvedBy?: number;
  submittedAt?: string;
  submissionRef?: string;
  certifiedValue?: number;
  certifiedAt?: string;
  certificationRef?: string;
  clientDeductions: number;
  clientDeductionNote?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  irn?: string; // e-invoice IRN
  dueDate?: string;
  receivedAmount: number;
  lockHash?: string;
  lockedAt?: string;
  items?: ClientBillItem[];
  deductions?: ClientBillDeduction[];
  // Computed fields
  billingEfficiency?: number; // certified / billed %
  daysToCertify?: number; // days from submission to certification
  shortfallValue?: number; // claimed - certified
}

// ─── Bill Items ──────────────────────────────────────────────────────────────

export type ItemCategory = 
  | 'BOQ'
  | 'EXTRA'
  | 'VARIATION'
  | 'DAYWORK'
  | 'PROVISIONAL'
  | 'MATERIAL_ON_SITE'
  | 'ESCALATION'
  | 'CLAIM';

export interface ClientBillItem {
  id: number;
  billId: number;
  lineNo: number;
  boqItemId: number;
  wbsId?: number;
  itemCategory: ItemCategory;
  uom: string;
  previousQty: number;
  currentQty: number;
  cumulativeQty: number;
  boqQty?: number;
  balanceQty?: number;
  rate: number;
  rateSourceId: number; // from Part 12 rate master
  previousAmount: number;
  currentAmount: number;
  cumulativeAmount: number;
  hsnSac?: string;
  taxRatePct?: number;
  mbLineIds: number[]; // certified MB lines that support this quantity
  // Additional fields for special categories
  variationId?: number;
  dayworkSheetId?: number;
  claimId?: number;
  mosTrackingId?: number;
  // Validation flags
  isExtraItem?: boolean;
  isAtRisk?: boolean; // variation billed before client approval
  rateApprovalPending?: boolean;
}

// ─── Bill Deductions ─────────────────────────────────────────────────────────

export type DeductionType = 
  | 'RETENTION'
  | 'SECURITY_DEPOSIT'
  | 'MOB_ADV_RECOVERY'
  | 'MAT_ADV_RECOVERY'
  | 'LD'
  | 'WATER_CHARGES'
  | 'ELECTRICITY'
  | 'LABOUR_CESS'
  | 'TDS_IT'
  | 'TDS_GST'
  | 'HIRE_CHARGES'
  | 'MATERIAL_SUPPLIED'
  | 'PENALTY'
  | 'OTHER';

export type DeductionBasis = 'PCT_GROSS' | 'PCT_NET' | 'FIXED' | 'QTY_RATE' | 'FORMULA';

export interface ClientBillDeduction {
  id: number;
  billId: number;
  seqNo: number; // sequence order for application
  deductionType: DeductionType;
  basis: DeductionBasis;
  basisValue?: number;
  computedAmount: number; // system-computed
  appliedAmount: number; // actually applied (may differ if overridden)
  overrideBy?: number;
  overrideReason?: string;
  isSystemGenerated: boolean;
  isRefundable: boolean;
  releasedAt?: string;
  remark?: string;
  // For retention
  retentionPct?: number;
  retentionCeiling?: number;
  cumulativeRetention?: number;
  // For advance recovery
  advanceOutstanding?: number;
  recoveryPct?: number;
}

// ─── Variations ──────────────────────────────────────────────────────────────

export type VariationType = 'ADDITION' | 'OMISSION' | 'SUBSTITUTION' | 'RATE_CHANGE' | 'TIME';
export type VariationStatus = 'PROPOSED' | 'SUBMITTED' | 'CLIENT_APPROVED' | 'CLIENT_REJECTED' | 'INCORPORATED';

export interface Variation {
  id: number;
  variationNo: string;
  projectId: number;
  title: string;
  description?: string;
  variationType: VariationType;
  clientInstructionRef?: string;
  instructionDate?: string;
  estimatedValue?: number;
  approvedValue?: number;
  timeImpactDays?: number;
  status: VariationStatus;
  submittedAt?: string;
  clientApprovedAt?: string;
  approvalRef?: string;
  boqVersionId?: number; // new BOQ version if incorporated
  isAtRisk: boolean; // billed before approval
  supportingDocuments?: number[]; // file IDs
  // Computed fields
  billedValue?: number;
  balanceValue?: number;
}

// ─── Escalation ──────────────────────────────────────────────────────────────

export interface EscalationFormula {
  id: number;
  projectId: number;
  formulaName: string;
  expression: string; // e.g., "V × [a + b×(L₁/L₀) + c×(M₁/M₀) + d×(F₁/F₀) + e×(S₁/S₀) − 1]"
  basePeriod: string; // YYYY-MM
  components: EscalationComponent[];
  appliesTo?: string; // specific BOQ items or all
  ceilingPct?: number; // max escalation %
  isActive: boolean;
}

export interface EscalationComponent {
  code: string; // 'a', 'b', 'c', 'd', 'e'
  name: string; // 'Fixed', 'Labour', 'Material', 'Fuel', 'Steel/Cement'
  weight: number; // must sum to 1.0
  indexCode?: string; // reference to price index
  baseValue?: number; // L₀, M₀, F₀, S₀
}

export interface PriceIndex {
  id: number;
  indexCode: string;
  indexName: string;
  period: string; // YYYY-MM
  indexValue: number;
  source: string; // e.g., "CPWD", "Market Survey"
  publishedDate: string;
  enteredBy: number;
  verifiedBy?: number;
  verifiedAt?: string;
}

export interface EscalationComputation {
  billId: number;
  formulaId: number;
  period: string;
  baseValue: number; // V
  componentValues: Array<{
    code: string;
    name: string;
    weight: number;
    baseIndex: number;
    currentIndex: number;
    ratio: number;
    weightedValue: number;
  }>;
  escalationFactor: number;
  escalationAmount: number;
  computedAt: string;
  computedBy: number;
}

// ─── Claims ──────────────────────────────────────────────────────────────────

export type ClaimType = 
  | 'EOT' // Extension of Time
  | 'PROLONGATION_COST'
  | 'IDLING'
  | 'ACCELERATION'
  | 'CHANGE_IN_LAW'
  | 'PRICE_ESCALATION_DISPUTE'
  | 'DISPUTED_QUANTITY'
  | 'DISPUTED_RATE';

export type ClaimStatus = 
  | 'DRAFT'
  | 'NOTICE_ISSUED'
  | 'CLAIM_SUBMITTED'
  | 'UNDER_NEGOTIATION'
  | 'SETTLED'
  | 'REJECTED'
  | 'ADJUDICATION'
  | 'ARBITRATION';

export interface Claim {
  id: number;
  claimNo: string;
  projectId: number;
  claimType: ClaimType;
  title: string;
  description: string;
  contractualClause: string;
  quantum: number; // claimed amount
  supportingEvidence: number[]; // file IDs
  // Notice tracking (critical for claim validity)
  eventDate: string; // date of event giving rise to claim
  noticePeriodDays: number; // contractual notice period
  noticeDueDate: string; // computed: eventDate + noticePeriodDays
  noticeIssuedAt?: string;
  noticeRef?: string;
  // Claim submission
  claimSubmittedAt?: string;
  claimRef?: string;
  // Status tracking
  status: ClaimStatus;
  // Settlement
  settledAmount?: number;
  settledAt?: string;
  settlementRef?: string;
  // Timeline
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
  // Computed fields
  daysToNoticeDeadline?: number;
  noticeOverdue?: boolean;
  daysSinceSubmission?: number;
}

// ─── Retention & DLP ─────────────────────────────────────────────────────────

export interface RetentionLedger {
  id: number;
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
  // Release tracking
  releasedOnCompletion?: number; // typically 50%
  releasedAfterDlp?: number; // remaining 50%
  totalReleased: number;
  balanceRetention: number;
  // DLP
  dlpEndDate?: string;
  dlpReleaseBillId?: number;
}

export interface DlpTracker {
  id: number;
  projectId: number;
  completionCertificateDate: string;
  dlpMonths: number;
  dlpEndDate: string;
  retentionHeld: number;
  releaseDue: boolean;
  releaseBillCreated: boolean;
  releaseBillId?: number;
  releasedAt?: string;
  releasedBy?: number;
}

// ─── Material on Site (MOS) ──────────────────────────────────────────────────

export type MosStatus = 'CLAIMED' | 'REVERSED' | 'EXPIRED';

export interface MosTracking {
  id: number;
  projectId: number;
  billId: number; // bill where MOS was claimed
  itemId: number;
  grnId: number; // evidence of delivery
  quantity: number;
  rate: number;
  value: number;
  claimDate: string;
  contractualPeriodDays: number;
  reversalDueDate: string; // claimDate + contractualPeriodDays
  // Reversal tracking
  reversedInBillId?: number;
  reversedAt?: string;
  reversedQuantity?: number;
  status: MosStatus;
  // Alerts
  isExpired: boolean;
  daysToExpiry?: number;
}

// ─── Certification Tracking ──────────────────────────────────────────────────

export interface CertificationTracking {
  id: number;
  billId: number;
  billNo: string;
  projectId: number;
  // Submission
  submittedAt: string;
  submissionRef: string;
  // Contractual certification period
  contractualCertificationDays: number;
  certificationDueDate: string; // submittedAt + contractualCertificationDays
  // Actual certification
  certifiedAt?: string;
  certificationRef?: string;
  certifiedValue?: number;
  // Shortfall analysis
  shortfallValue?: number;
  shortfallPct?: number;
  shortfallReasons?: CertificationShortfall[];
  // Interest entitlement
  interestApplicable?: boolean;
  interestRate?: number;
  interestAmount?: number;
  interestFrom?: string;
  interestTo?: string;
  // Status
  isOverdue: boolean;
  daysOverdue?: number;
}

export interface CertificationShortfall {
  reason: 'QUANTITY_DISALLOWED' | 'RATE_DISALLOWED' | 'DEDUCTION_APPLIED' | 'UNDER_CERTIFICATION_PENDING';
  itemId?: number;
  amount: number;
  description: string;
  // Resolution tracking
  resolution: 'ACCEPTED' | 'RESUBMITTED' | 'ESCALATED_TO_CLAIM';
  resolvedAt?: string;
  claimId?: number;
}

// ─── Client Deduction Reconciliation ─────────────────────────────────────────

export interface ClientDeductionReconciliation {
  id: number;
  billId: number;
  claimedAmount: number;
  certifiedAmount: number;
  difference: number;
  categorized: boolean;
  categories: ClientDeductionCategory[];
  reconciledAt?: string;
  reconciledBy?: number;
}

export interface ClientDeductionCategory {
  category: 'QUANTITY_DISALLOWED' | 'RATE_DISALLOWED' | 'DEDUCTION_APPLIED' | 'UNDER_CERTIFICATION_PENDING';
  amount: number;
  description: string;
  itemId?: number;
  // Action taken
  action: 'ACCEPTED' | 'RESUBMITTED_IN_NEXT_BILL' | 'ESCALATED_TO_CLAIM';
  actionTakenAt?: string;
  actionTakenBy?: number;
  nextBillId?: number; // if resubmitted
  claimId?: number; // if escalated
}

// ─── Bill Backup Pack ────────────────────────────────────────────────────────

export interface BillBackupPack {
  billId: number;
  generatedAt: string;
  generatedBy: number;
  packHash: string; // SHA-256 of the complete pack
  // Contents
  mbAbstracts: number[]; // MB IDs
  measurementSheets: number[]; // file IDs
  evidencePhotos: number[]; // file IDs
  testCertificates: number[]; // file IDs
  jointMeasurementRecords: number[]; // file IDs
  dayworkSheets: number[]; // file IDs
  variationApprovals: number[]; // variation IDs
  claimNotices: number[]; // claim IDs
  // Output
  pdfFileId: number;
  pdfHash: string;
  indexed: boolean;
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface GenerateBillRequest {
  projectId: number;
  packageId?: number;
  billType: BillType;
  periodFrom: string;
  periodTo: string;
  mbIds?: number[]; // specific MBs to include (optional, defaults to all certified unbilled)
  excludeMbIds?: number[]; // MBs to exclude with reason
}

export interface GenerateBillResponse {
  bill: ClientBill;
  warnings: string[];
  errors: string[];
  unbilledMbCount: number;
  unbilledMbValue: number;
}

export interface ValidateBillRequest {
  billId: number;
}

export interface ValidateBillResponse {
  isValid: boolean;
  validations: Array<{
    check: string;
    passed: boolean;
    message: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
  }>;
}

export interface ComputeEscalationRequest {
  billId: number;
  formulaId: number;
  period: string;
}

export interface ComputeEscalationResponse {
  computation: EscalationComputation;
  missingIndices: string[];
}

export interface SubmitClaimRequest {
  claim: Omit<Claim, 'id' | 'claimNo' | 'status' | 'createdAt' | 'updatedAt'>;
}

export interface ReconcileClientDeductionsRequest {
  billId: number;
  categories: ClientDeductionCategory[];
}

export interface GenerateBackupPackRequest {
  billId: number;
  includeMbAbstracts: boolean;
  includeMeasurementSheets: boolean;
  includeEvidencePhotos: boolean;
  includeTestCertificates: boolean;
  includeJointMeasurementRecords: boolean;
  includeDayworkSheets: boolean;
  includeVariationApprovals: boolean;
  includeClaimNotices: boolean;
}

export interface GetBillingKpisRequest {
  projectId: number;
  periodFrom?: string;
  periodTo?: string;
}

// ─── KPI Types ───────────────────────────────────────────────────────────────

export interface BillingKpis {
  billedThisPeriod: number;
  billedYtd: number;
  certifiedVsBilledPct: number;
  workDoneButUnbilled: number; // WIP - most important commercial number
  billingEfficiency: number; // days from work done to bill submission
  daysSalesOutstanding: number;
  receivablesAgeing: {
    current: number;
    days30To60: number;
    days60To90: number;
    days90Plus: number;
  };
  retentionHeld: number;
  retentionDueForRelease: number;
  advanceOutstanding: number;
  variationValueApproved: number;
  variationValuePending: number;
  claimValueSubmitted: number;
  claimValueSettled: number;
  escalationClaimed: number;
  escalationCertified: number;
  underCertificationValue: number;
  contractValue: number;
  totalBilled: number;
  contractBalance: number;
}

// ─── Report Types ────────────────────────────────────────────────────────────

export interface BillRegisterReport {
  bills: Array<{
    billNo: string;
    billType: BillType;
    billDate: string;
    grossValue: number;
    deductions: number;
    netReceivable: number;
    status: BillStatus;
    certifiedValue?: number;
    receivedAmount: number;
    balanceReceivable: number;
  }>;
}

export interface CertificationStatusReport {
  bills: Array<{
    billNo: string;
    submittedAt: string;
    certificationDueDate: string;
    certifiedAt?: string;
    certifiedValue?: number;
    isOverdue: boolean;
    daysOverdue?: number;
    shortfallValue?: number;
  }>;
}

export interface UnderCertificationAnalysisReport {
  projectId: number;
  totalUnderCertification: number;
  byReason: Array<{
    reason: string;
    amount: number;
    bills: string[];
  }>;
}

export interface WipStatementReport {
  projectId: number;
  certifiedNotBilled: number;
  executedNotCertified: number;
  totalWip: number;
  details: Array<{
    type: 'CERTIFIED_NOT_BILLED' | 'EXECUTED_NOT_CERTIFIED';
    mbNo?: string;
    quantity: number;
    value: number;
    date: string;
  }>;
}

export interface RetentionStatementReport {
  projectId: number;
  totalRetentionAccrued: number;
  totalRetentionReleased: number;
  balanceRetention: number;
  ledger: RetentionLedger[];
}

export interface VariationRegisterReport {
  variations: Array<{
    variationNo: string;
    title: string;
    type: VariationType;
    status: VariationStatus;
    estimatedValue: number;
    approvedValue?: number;
    billedValue: number;
    balanceValue: number;
    isAtRisk: boolean;
  }>;
}

export interface ClaimsRegisterReport {
  claims: Array<{
    claimNo: string;
    type: ClaimType;
    title: string;
    status: ClaimStatus;
    quantum: number;
    settledAmount?: number;
    noticeDueDate: string;
    noticeIssuedAt?: string;
    daysToNoticeDeadline?: number;
    noticeOverdue: boolean;
  }>;
}

export interface ContractPositionReport {
  projectId: number;
  contractValue: number;
  variationsApproved: number;
  revisedContractValue: number;
  totalBilled: number;
  totalCertified: number;
  totalReceived: number;
  retentionHeld: number;
  advanceOutstanding: number;
  contractBalance: number;
  billingProgressPct: number;
  receiptProgressPct: number;
}
