/**
 * Part 15 — Inventory & Material Management Types
 * Type definitions for stock ledger, GRN, issue, consumption, transfers, returns, and stock take
 */

// ─── Stock Ledger ────────────────────────────────────────────────────────────

export type MovementType = 
  | 'GRN'
  | 'ISSUE'
  | 'RETURN_TO_STORE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUST_PLUS'
  | 'ADJUST_MINUS'
  | 'SCRAP'
  | 'DAMAGE'
  | 'OPENING'
  | 'RETURN_TO_VENDOR'
  | 'CONSUMPTION'
  | 'REVERSAL';

export interface StockLedgerEntry {
  id: number;
  projectId: number;
  storeId: number;
  binId?: number;
  itemId: number;
  batchId?: number;
  movementType: MovementType;
  movementDate: string;
  postedAt: string;
  quantity: number; // signed: + in, - out
  uom: string;
  rate: number;
  value: number;
  balanceQty: number; // running balance after this movement
  balanceValue: number;
  sourceType: string; // existing table name
  sourceId: number;
  sourceLineId?: number;
  reversalOfId?: number;
  costCodeId?: number;
  wbsId?: number;
  boqItemId?: number;
  createdBy: number;
  rowHash: string; // chained hash for tamper evidence
}

export interface StockPosition {
  projectId: number;
  storeId: number;
  itemId: number;
  batchId?: number;
  balanceQty: number;
  balanceValue: number;
  avgRate: number;
  lastMovementDate: string;
}

// ─── GRN (Goods Receipt Note) ────────────────────────────────────────────────

export type GrnType = 'AGAINST_PO' | 'WITHOUT_PO' | 'TRANSFER_IN' | 'RETURN_FROM_SITE' | 'FREE_ISSUE';
export type QcStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'NOT_REQUIRED';
export type ToleranceStatus = 'WITHIN' | 'EXCESS' | 'SHORT' | 'BLOCKED';
export type WeighbridgeSource = 'MANUAL' | 'IOT';

export interface GrnExtension {
  grnId: number;
  poId?: number;
  poItemRef?: any; // JSONB
  grnType: GrnType;
  vehicleNo?: string;
  driverName?: string;
  challanNo?: string;
  challanDate?: string;
  ewayBillNo?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceValue?: number;
  gateEntryNo?: string;
  gateEntryAt?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  weighbridgeSlip?: string;
  weighbridgeSource?: WeighbridgeSource;
  qcRequired: boolean;
  qcStatus?: QcStatus;
  unloadingCharges: number;
  freightCharges: number;
  landedRateBasis?: string;
  photoFileIds?: number[]; // JSONB
  receivedBy: number;
  receivedAt: string;
  isShortReceipt: boolean;
  isExcessReceipt: boolean;
}

export interface GrnItemExtension {
  grnItemId: number;
  poItemId?: number;
  challanQty: number;
  receivedQty: number;
  acceptedQty?: number;
  rejectedQty: number;
  shortageQty: number;
  damageQty: number;
  rejectionReason?: string;
  batchId?: number;
  heatNo?: string;
  millCertFileId?: number;
  manufactureDate?: string;
  expiryDate?: string;
  binId?: number;
  basicRate: number;
  landedRate: number;
  toleranceStatus: ToleranceStatus;
}

export interface ThreeWayMatch {
  poQty: number;
  challanQty: number;
  physicalQty: number;
  poRate: number;
  invoiceRate: number;
  qtyVariance: number;
  rateVariance: number;
  isMatched: boolean;
  blockedReasons: string[];
}

// ─── Material Issue ──────────────────────────────────────────────────────────

export type IssueType = 'WORK' | 'SUBCONTRACTOR' | 'EQUIPMENT' | 'CONSUMABLE' | 'CAPEX' | 'SAMPLE';
export type IssuedToType = 'EMPLOYEE' | 'SUBCONTRACTOR' | 'EQUIPMENT' | 'GANG';

export interface IssueExtension {
  issueId: number;
  issueType: IssueType;
  projectId: number;
  storeId: number;
  wbsId?: number;
  boqItemId?: number;
  costCodeId?: number;
  activityId?: number;
  locationDesc?: string;
  issuedToType?: IssuedToType;
  issuedToId?: number;
  requestedBy: number;
  approvedBy?: number;
  isReturnable: boolean;
  expectedReturnDate?: string;
  theoreticalQty: number;
  variancePct?: number;
  varianceReason?: string;
}

// ─── Material Consumption ────────────────────────────────────────────────────

export type ConsumptionStatus = 'WITHIN' | 'EXCESS' | 'INVESTIGATE' | 'EXPLAINED';

export interface MaterialConsumption {
  id: number;
  projectId: number;
  wbsId?: number;
  boqItemId: number;
  itemId: number;
  consumptionDate: string;
  executedQty: number; // from certified MB
  theoreticalQty: number; // executed × norm × (1+wastage)
  issuedQty: number;
  returnedQty: number;
  actualConsumed: number;
  varianceQty: number;
  variancePct: number;
  varianceValue: number;
  status: ConsumptionStatus;
  explanation?: string;
  reviewedBy?: number;
  reviewedAt?: string;
}

// ─── Material Transfer ───────────────────────────────────────────────────────

export type TransferStatus = 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'SHORT_RECEIVED' | 'REJECTED';

export interface MaterialTransfer {
  id: number;
  transferNo: string;
  fromProjectId: number;
  fromStoreId: number;
  toProjectId: number;
  toStoreId: number;
  dispatchedAt: string;
  dispatchedBy: number;
  receivedAt?: string;
  receivedBy?: number;
  status: TransferStatus;
  inTransitAgeingDays?: number;
  items: MaterialTransferItem[];
}

export interface MaterialTransferItem {
  id: number;
  transferId: number;
  itemId: number;
  batchId?: number;
  dispatchedQty: number;
  receivedQty?: number;
  shortageQty?: number;
  damageQty?: number;
  rate: number; // source weighted average rate
  value: number;
}

// ─── Material Return ─────────────────────────────────────────────────────────

export type ReturnGrade = 'GOOD' | 'DAMAGED' | 'SCRAP';
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface MaterialReturn {
  id: number;
  returnNo: string;
  projectId: number;
  storeId: number;
  returnFrom: string; // site location / subcontractor
  returnedBy: number;
  returnedAt: string;
  status: ReturnStatus;
  approvedBy?: number;
  items: MaterialReturnItem[];
}

export interface MaterialReturnItem {
  id: number;
  returnId: number;
  itemId: number;
  batchId?: number;
  returnedQty: number;
  grade: ReturnGrade;
  acceptedQty: number;
  rejectedQty: number;
  reissueRate: number; // original issue rate for good material
  rejectionReason?: string;
}

// ─── Return to Vendor ────────────────────────────────────────────────────────

export interface ReturnToVendor {
  id: number;
  rtnNo: string;
  projectId: number;
  storeId: number;
  vendorId: number;
  grnId?: number; // original GRN if post-acceptance defect
  poId?: number;
  returnedAt: string;
  returnedBy: number;
  debitNoteNo?: string; // for Part 19
  ewayBillNo?: string; // for Part 23
  items: ReturnToVendorItem[];
}

export interface ReturnToVendorItem {
  id: number;
  rtnId: number;
  itemId: number;
  batchId?: number;
  returnedQty: number;
  rate: number;
  value: number;
  reason: string;
}

// ─── Stock Adjustment ────────────────────────────────────────────────────────

export type AdjustmentType = 'PLUS' | 'MINUS';
export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StockAdjustment {
  id: number;
  adjustmentNo: string;
  projectId: number;
  storeId: number;
  adjustmentType: AdjustmentType;
  reason: string;
  requestedBy: number;
  requestedAt: string;
  approvedBy?: number;
  approvedAt?: string;
  status: AdjustmentStatus;
  valueThreshold: number;
  requiresSecondApproval: boolean;
  items: StockAdjustmentItem[];
}

export interface StockAdjustmentItem {
  id: number;
  adjustmentId: number;
  itemId: number;
  batchId?: number;
  quantity: number;
  rate: number;
  value: number;
}

// ─── Scrap & Damage ──────────────────────────────────────────────────────────

export type ScrapDamageType = 'SCRAP' | 'DAMAGE';
export type ResponsibilityType = 'NORMAL_WEAR' | 'NEGLIGENCE' | 'ACCIDENT' | 'UNKNOWN';

export interface ScrapDamage {
  id: number;
  scrapNo: string;
  projectId: number;
  storeId: number;
  type: ScrapDamageType;
  reportedBy: number;
  reportedAt: string;
  approvedBy?: number;
  approvedAt?: string;
  responsibility?: ResponsibilityType;
  responsiblePersonId?: number;
  photoFileIds: number[];
  items: ScrapDamageItem[];
}

export interface ScrapDamageItem {
  id: number;
  scrapId: number;
  itemId: number;
  batchId?: number;
  quantity: number;
  rate: number;
  value: number;
  reason: string;
}

// ─── Stock Take ──────────────────────────────────────────────────────────────

export type StockTakeType = 'FULL' | 'CYCLE' | 'SPOT' | 'CLOSURE';
export type StockTakeStatus = 'PLANNED' | 'IN_PROGRESS' | 'COUNTING' | 'RECOUNTING' | 'APPROVED' | 'POSTED';

export interface StockTake {
  id: number;
  stockTakeNo: string;
  projectId: number;
  storeId: number;
  takeType: StockTakeType;
  cutoffDatetime: string;
  freezeMovements: boolean;
  status: StockTakeStatus;
  countedBy: number[]; // JSONB
  verifiedBy?: number;
  approvedBy?: number;
  approvedAt?: string;
  totalVarianceValue: number;
  lines: StockTakeLine[];
}

export interface StockTakeLine {
  id: number;
  stockTakeId: number;
  itemId: number;
  batchId?: number;
  binId?: number;
  systemQty: number; // snapshot at cutoff, locked
  countedQty?: number;
  recountQty?: number;
  varianceQty?: number;
  varianceValue?: number;
  reason?: string;
  adjustmentLedgerId?: number;
}

// ─── Valuation ───────────────────────────────────────────────────────────────

export type ValuationMethod = 'WEIGHTED_AVERAGE' | 'FIFO' | 'BATCH_SPECIFIC';

export interface ValuationConfig {
  id: number;
  itemCategoryId: number;
  method: ValuationMethod;
  effectiveFrom: string;
  lockedForFinancialYear: boolean;
}

// ─── Reorder ─────────────────────────────────────────────────────────────────

export interface ReorderConfig {
  id: number;
  projectId: number;
  storeId: number;
  itemId: number;
  minLevel: number;
  maxLevel: number;
  reorderQty: number;
  leadTimeDays: number;
  safetyFactor: number;
  autoCompute: boolean;
  avgDailyConsumption?: number;
  suggestedReorderQty?: number;
}

export interface ReorderSuggestion {
  projectId: number;
  storeId: number;
  itemId: number;
  itemName: string;
  currentStock: number;
  minLevel: number;
  suggestedQty: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  daysOfCover: number;
}

// ─── Ageing Analysis ─────────────────────────────────────────────────────────

export interface StockAgeing {
  projectId: number;
  storeId: number;
  itemId: number;
  itemName: string;
  batchId?: number;
  quantity: number;
  value: number;
  ageDays: number;
  ageBucket: '0-30' | '31-90' | '91-180' | '181-365' | '365+';
  lastIssueDate?: string;
  isNonMoving: boolean;
  suggestedAction: 'HOLD' | 'TRANSFER' | 'RETURN' | 'SCRAP';
}

export interface ExpiryAlert {
  itemId: number;
  itemName: string;
  batchId: number;
  expiryDate: string;
  daysToExpiry: number;
  quantity: number;
  value: number;
  storeId: number;
  alertLevel: '60_DAYS' | '30_DAYS' | '15_DAYS' | 'EXPIRED';
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface PostStockMovementRequest {
  projectId: number;
  storeId: number;
  itemId: number;
  batchId?: number;
  movementType: MovementType;
  quantity: number;
  rate: number;
  sourceType: string;
  sourceId: number;
  sourceLineId?: number;
  costCodeId?: number;
  wbsId?: number;
  boqItemId?: number;
}

export interface PostStockMovementResponse {
  ledgerId: number;
  balanceQty: number;
  balanceValue: number;
  rowHash: string;
}

export interface GetStockPositionRequest {
  projectId: number;
  storeId?: number;
  itemId?: number;
  batchId?: number;
  asOfDate?: string;
}

export interface ThreeWayMatchRequest {
  grnId: number;
}

export interface ThreeWayMatchResponse {
  matches: ThreeWayMatch[];
  isFullyMatched: boolean;
  blockedItems: number[];
  warnings: string[];
}

export interface ComputeConsumptionVarianceRequest {
  projectId: number;
  boqItemId: number;
  fromDate: string;
  toDate: string;
}

export interface ComputeConsumptionVarianceResponse {
  consumptions: MaterialConsumption[];
  totalVarianceValue: number;
  itemsRequiringInvestigation: number[];
}

export interface GetReorderSuggestionsRequest {
  projectId: number;
  storeId: number;
}

export interface GetStockAgeingRequest {
  projectId: number;
  storeId?: number;
  nonMovingDays?: number;
}

// ─── KPI Types ───────────────────────────────────────────────────────────────

export interface InventoryKpis {
  totalStockValue: number;
  stockTurnoverRatio: number;
  avgDaysOfCover: number;
  consumptionVariancePct: number;
  nonMovingStockValue: number;
  inTransitValue: number;
  inTransitOverdueCount: number;
  grnPendingQc: number;
  grnToInvoicePending: number;
  shortageDamageValue: number;
  adjustmentValueThisMonth: number;
  stockTakeAccuracyPct: number;
  itemsBelowReorder: number;
  expiringWithin30Days: number;
  cementConsumptionPerUnitWork: number;
  steelConsumptionPerUnitWork: number;
}

// ─── Report Types ────────────────────────────────────────────────────────────

export interface StockLedgerReport {
  entries: StockLedgerEntry[];
  openingBalance: number;
  closingBalance: number;
  totalIn: number;
  totalOut: number;
}

export interface ConsumptionStatement {
  boqItemId: number;
  boqItemName: string;
  executedQty: number;
  materials: Array<{
    itemId: number;
    itemName: string;
    theoreticalQty: number;
    issuedQty: number;
    actualConsumed: number;
    varianceQty: number;
    variancePct: number;
    varianceValue: number;
    status: ConsumptionStatus;
  }>;
}

export interface MaterialCostPerUnitWork {
  projectId: number;
  boqItemId: number;
  boqItemName: string;
  executedQty: number;
  materialCost: number;
  costPerUnit: number;
  budgetedCostPerUnit: number;
  variance: number;
  variancePct: number;
}
