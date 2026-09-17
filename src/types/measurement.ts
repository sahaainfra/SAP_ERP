/**
 * Part 17 — Measurement Book Types
 * Type definitions for e-MB, dimension calculation, deductions, and certification
 */

// ─── Measurement Book ────────────────────────────────────────────────────────

export type MeasurementContext = 'CLIENT' | 'SUBCONTRACT' | 'INTERNAL';
export type MbType = 'RUNNING' | 'FINAL' | 'SUPPLEMENTARY' | 'REVISED' | 'ADVANCE';
export type MbStatus = 
  | 'DRAFT'
  | 'MEASURED'
  | 'CHECKED'
  | 'CERTIFIED'
  | 'DISPUTED'
  | 'SUPERSEDED'
  | 'REVISED'
  | 'CANCELLED';

export interface MeasurementBook {
  id: number;
  mbNo: string;
  legacyMbId?: number;
  measurementContext: MeasurementContext;
  projectId: number;
  packageId?: number;
  workOrderId?: number; // SUBCONTRACT context
  boqVersionId: number;
  mbType: MbType;
  periodFrom?: string;
  periodTo?: string;
  measurementDate: string;
  siteId?: number;
  areaId?: number;
  workFrontId?: number;
  pageFrom?: number;
  pageTo?: number;
  status: MbStatus;
  measuredBy: number;
  measuredAt: string;
  checkedBy?: number;
  checkedAt?: string;
  certifiedBy?: number;
  certifiedAt?: string;
  clientRepName?: string;
  clientSignedAt?: string;
  clientSignatureFileId?: number;
  isJointMeasurement: boolean;
  revisionOfId?: number;
  revisionNo: number;
  totalValue: number;
  lockedAt?: string;
  lockHash?: string;
  weather?: string;
  remarks?: string;
  lines?: MbLine[];
  // Computed fields
  totalQuantity?: number;
  previousTotalValue?: number;
  cumulativeTotalValue?: number;
}

// ─── MB Line ─────────────────────────────────────────────────────────────────

export interface MbLine {
  id: number;
  mbId: number;
  lineNo: number;
  boqItemId: number;
  woItemId?: number;
  wbsId?: number;
  description?: string;
  measurementMethod: string; // from dx_boq_item_extension
  locationDesc?: string;
  chainageFrom?: number;
  chainageTo?: number;
  levelRlFrom?: number;
  levelRlTo?: number;
  grossQty: number;
  deductionQty: number;
  netQty: number;
  uom: string;
  rate: number;
  rateSourceId: number; // dx_rate_master row
  amount: number;
  previousQty: number;
  cumulativeQty: number;
  isDisputed: boolean;
  disputedQty?: number;
  wirId?: number;
  testReportIds?: number[];
  calcHash: string; // SHA-256 of inputs + formula + result
  dimensions?: MbDimension[];
  // Additional fields
  boqItemCode?: string;
  boqItemDescription?: string;
  boqQty?: number;
  balanceQty?: number;
  ceilingHeadroom?: number;
}

// ─── MB Dimension ────────────────────────────────────────────────────────────

export type DimType = 'ADD' | 'DEDUCT';

export interface MbDimension {
  id: number;
  mbLineId: number;
  seqNo: number;
  dimType: DimType;
  description?: string;
  nos?: number;
  length?: number;
  breadth?: number;
  height?: number;
  diameter?: number;
  radius?: number;
  areaDirect?: number;
  volumeDirect?: number;
  barDiaMm?: number;
  barCount?: number;
  barLength?: number;
  unitWeight?: number;
  formulaCode: FormulaCode;
  computedQty: number;
  remark?: string;
}

// ─── Formula Catalogue ───────────────────────────────────────────────────────

export type FormulaCode = 
  | 'LINEAR'
  | 'AREA_LB'
  | 'VOLUME_LBH'
  | 'AREA_CIRCLE'
  | 'VOLUME_CYL'
  | 'VOLUME_CONE'
  | 'TRAPEZOID_AREA'
  | 'PRISMOIDAL'
  | 'MEAN_AREA'
  | 'STEEL_WEIGHT'
  | 'STEEL_TABLE'
  | 'SIMPSON'
  | 'TRAPEZOIDAL_RULE'
  | 'WEIGHT_DENSITY'
  | 'COUNT'
  | 'DIRECT';

export interface FormulaDefinition {
  code: FormulaCode;
  name: string;
  description: string;
  formula: string;
  requiredInputs: string[];
  optionalInputs: string[];
  typicalUse: string[];
  example: {
    inputs: Record<string, number | number[]>;
    result: number;
  };
}

export const FORMULA_CATALOGUE: FormulaDefinition[] = [
  {
    code: 'LINEAR',
    name: 'Linear Measurement',
    description: 'nos × L',
    formula: 'nos * length',
    requiredInputs: ['length'],
    optionalInputs: ['nos'],
    typicalUse: ['Skirting', 'Kerb', 'Pipe'],
    example: { inputs: { nos: 1, length: 10.5 }, result: 10.5 },
  },
  {
    code: 'AREA_LB',
    name: 'Area (Length × Breadth)',
    description: 'nos × L × B',
    formula: 'nos * length * breadth',
    requiredInputs: ['length', 'breadth'],
    optionalInputs: ['nos'],
    typicalUse: ['Plaster', 'Flooring', 'Shuttering'],
    example: { inputs: { nos: 1, length: 5.0, breadth: 3.0 }, result: 15.0 },
  },
  {
    code: 'VOLUME_LBH',
    name: 'Volume (Length × Breadth × Height)',
    description: 'nos × L × B × H',
    formula: 'nos * length * breadth * height',
    requiredInputs: ['length', 'breadth', 'height'],
    optionalInputs: ['nos'],
    typicalUse: ['Concrete', 'Excavation', 'Masonry'],
    example: { inputs: { nos: 1, length: 5.0, breadth: 3.0, height: 0.15 }, result: 2.25 },
  },
  {
    code: 'AREA_CIRCLE',
    name: 'Circular Area',
    description: 'nos × π × r²',
    formula: 'nos * Math.PI * Math.pow(radius, 2)',
    requiredInputs: ['radius'],
    optionalInputs: ['nos'],
    typicalUse: ['Circular slab'],
    example: { inputs: { nos: 1, radius: 2.0 }, result: 12.566 },
  },
  {
    code: 'VOLUME_CYL',
    name: 'Cylindrical Volume',
    description: 'nos × π × r² × H',
    formula: 'nos * Math.PI * Math.pow(radius, 2) * height',
    requiredInputs: ['radius', 'height'],
    optionalInputs: ['nos'],
    typicalUse: ['Pile', 'Circular column'],
    example: { inputs: { nos: 1, radius: 0.3, height: 10.0 }, result: 2.827 },
  },
  {
    code: 'VOLUME_CONE',
    name: 'Conical Volume',
    description: 'nos × ⅓ × π × r² × H',
    formula: 'nos * (1/3) * Math.PI * Math.pow(radius, 2) * height',
    requiredInputs: ['radius', 'height'],
    optionalInputs: ['nos'],
    typicalUse: ['Pile bulb'],
    example: { inputs: { nos: 1, radius: 0.5, height: 1.0 }, result: 0.262 },
  },
  {
    code: 'TRAPEZOID_AREA',
    name: 'Trapezoid Area',
    description: 'nos × ½ × (a+b) × h',
    formula: 'nos * 0.5 * (side_a + side_b) * height',
    requiredInputs: ['side_a', 'side_b', 'height'],
    optionalInputs: ['nos'],
    typicalUse: ['Irregular section'],
    example: { inputs: { nos: 1, side_a: 3.0, side_b: 5.0, height: 2.0 }, result: 8.0 },
  },
  {
    code: 'PRISMOIDAL',
    name: 'Prismoidal Volume',
    description: 'nos × L/6 × (A₁ + 4Aₘ + A₂)',
    formula: 'nos * (length / 6) * (area_1 + 4 * area_mid + area_2)',
    requiredInputs: ['length', 'area_1', 'area_mid', 'area_2'],
    optionalInputs: ['nos'],
    typicalUse: ['Earthwork between cross-sections'],
    example: { inputs: { nos: 1, length: 10.0, area_1: 20.0, area_mid: 25.0, area_2: 30.0 }, result: 250.0 },
  },
  {
    code: 'MEAN_AREA',
    name: 'Mean Area Volume',
    description: 'nos × L × (A₁+A₂)/2',
    formula: 'nos * length * (area_1 + area_2) / 2',
    requiredInputs: ['length', 'area_1', 'area_2'],
    optionalInputs: ['nos'],
    typicalUse: ['Earthwork, simple method'],
    example: { inputs: { nos: 1, length: 10.0, area_1: 20.0, area_2: 30.0 }, result: 250.0 },
  },
  {
    code: 'STEEL_WEIGHT',
    name: 'Steel Weight (Indian Standard)',
    description: 'nos × count × length × (d²/162.0)',
    formula: 'nos * bar_count * bar_length * (Math.pow(bar_dia_mm, 2) / 162.0)',
    requiredInputs: ['bar_dia_mm', 'bar_length'],
    optionalInputs: ['nos', 'bar_count'],
    typicalUse: ['Reinforcement in kg'],
    example: { inputs: { nos: 1, bar_count: 10, bar_length: 5.0, bar_dia_mm: 16 }, result: 79.012 },
  },
  {
    code: 'STEEL_TABLE',
    name: 'Steel Weight (from Table)',
    description: 'nos × count × length × unit_weight',
    formula: 'nos * bar_count * bar_length * unit_weight',
    requiredInputs: ['bar_length', 'unit_weight'],
    optionalInputs: ['nos', 'bar_count'],
    typicalUse: ['Structural steel sections'],
    example: { inputs: { nos: 1, bar_count: 5, bar_length: 6.0, unit_weight: 12.0 }, result: 360.0 },
  },
  {
    code: 'SIMPSON',
    name: "Simpson's Rule",
    description: 'h/3 × (y₀ + 4Σodd + 2Σeven + yₙ)',
    formula: 'Complex - requires offset array',
    requiredInputs: ['interval_h', 'offsets'],
    optionalInputs: [],
    typicalUse: ['Irregular area from offsets'],
    example: { inputs: { interval_h: 1.0, offsets: [0, 2, 4, 6, 8] }, result: 10.667 },
  },
  {
    code: 'TRAPEZOIDAL_RULE',
    name: 'Trapezoidal Rule',
    description: 'h × (½y₀ + Σy + ½yₙ)',
    formula: 'Complex - requires offset array',
    requiredInputs: ['interval_h', 'offsets'],
    optionalInputs: [],
    typicalUse: ['Irregular area from offsets'],
    example: { inputs: { interval_h: 1.0, offsets: [0, 2, 4, 6, 8] }, result: 12.0 },
  },
  {
    code: 'WEIGHT_DENSITY',
    name: 'Weight from Density',
    description: 'volume × density',
    formula: 'volume * density',
    requiredInputs: ['volume', 'density'],
    optionalInputs: [],
    typicalUse: ['Bituminous', 'RCC by weight'],
    example: { inputs: { volume: 10.0, density: 2400 }, result: 24000 },
  },
  {
    code: 'COUNT',
    name: 'Count',
    description: 'nos',
    formula: 'nos',
    requiredInputs: [],
    optionalInputs: ['nos'],
    typicalUse: ['Fixtures', 'Fittings'],
    example: { inputs: { nos: 25 }, result: 25 },
  },
  {
    code: 'DIRECT',
    name: 'Direct Entry',
    description: 'entered value',
    formula: 'direct_quantity',
    requiredInputs: ['direct_quantity'],
    optionalInputs: [],
    typicalUse: ['Where drawing gives quantity'],
    example: { inputs: { direct_quantity: 150.5 }, result: 150.5 },
  },
];

// ─── Deduction Rules ─────────────────────────────────────────────────────────

export type DeductionRuleType = 
  | 'OPENING_AREA'
  | 'CONCRETE_VOLUME'
  | 'OVERLAP_JUNCTION'
  | 'EXCAVATION_STRUCTURE'
  | 'MANUAL';

export interface DeductionRule {
  id: number;
  ruleCode: string;
  ruleType: DeductionRuleType;
  boqItemType: string;
  description: string;
  threshold?: number; // e.g., 0.5 m² for opening area
  singleFace: boolean;
  bothFaces: boolean;
  contractualClause?: string;
  isActive: boolean;
}

export interface AppliedDeduction {
  ruleId: number;
  ruleCode: string;
  description: string;
  quantity: number;
  contractualClause?: string;
}

// ─── Certification ───────────────────────────────────────────────────────────

export interface CertificationStage {
  stage: 'MEASURED' | 'CHECKED' | 'CERTIFIED';
  userId: number;
  userName: string;
  timestamp: string;
  remarks?: string;
}

export interface JointMeasurement {
  clientRepName: string;
  clientRepDesignation?: string;
  clientRepOrganisation?: string;
  measurementDate: string;
  signatureFileId?: number;
  remarks?: string;
}

// ─── Dispute ─────────────────────────────────────────────────────────────────

export type DisputeStatus = 'RAISED' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface MbDispute {
  id: number;
  mbLineId: number;
  raisedBy: number;
  raisedByType: 'CLIENT' | 'SUBCONTRACTOR';
  raisedAt: string;
  disputedQty: number;
  reason: string;
  status: DisputeStatus;
  resolvedAt?: string;
  resolvedBy?: number;
  resolution?: string;
  claimRegisterId?: number; // Part 18 claim
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export interface MbEvidence {
  mbLineId: number;
  photoFileIds: number[];
  sketchFileIds: number[];
  levelSurveyData?: any;
  wirIds: number[];
  testReportIds: number[];
}

// ─── Lock & Hash ─────────────────────────────────────────────────────────────

export interface MbLock {
  mbId: number;
  lockedAt: string;
  lockHash: string; // SHA-256 of full MB content
  previousMbHash?: string; // Chain to previous certified MB
  pdfHash?: string; // Hash of rendered PDF
}

// ─── Abnormal Measurement Detection ──────────────────────────────────────────

export interface AbnormalMeasurementAlert {
  mbLineId: number;
  alertType: 'QUANTITY_OUTLIER' | 'RATE_DIFFERENCE' | 'NON_WORKING_DAY' | 'NO_ATTENDANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  details: any;
  detectedAt: string;
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface CreateMbRequest {
  projectId: number;
  measurementContext: MeasurementContext;
  workOrderId?: number;
  boqVersionId: number;
  mbType: MbType;
  periodFrom?: string;
  periodTo?: string;
  measurementDate: string;
  siteId?: number;
  isJointMeasurement: boolean;
  lines: CreateMbLineRequest[];
}

export interface CreateMbLineRequest {
  boqItemId: number;
  woItemId?: number;
  wbsId?: number;
  description?: string;
  locationDesc?: string;
  dimensions: CreateMbDimensionRequest[];
  wirId?: number;
  testReportIds?: number[];
}

export interface CreateMbDimensionRequest {
  dimType: DimType;
  description?: string;
  nos?: number;
  length?: number;
  breadth?: number;
  height?: number;
  diameter?: number;
  radius?: number;
  areaDirect?: number;
  volumeDirect?: number;
  barDiaMm?: number;
  barCount?: number;
  barLength?: number;
  unitWeight?: number;
  formulaCode: FormulaCode;
  remark?: string;
}

export interface ComputeQuantityRequest {
  formulaCode: FormulaCode;
  inputs: Record<string, number>;
}

export interface ComputeQuantityResponse {
  quantity: number;
  formula: string;
  calcHash: string;
}

export interface CertifyMbRequest {
  mbId: number;
  stage: 'CHECKED' | 'CERTIFIED';
  remarks?: string;
  jointMeasurement?: JointMeasurement;
}

export interface RaiseDisputeRequest {
  mbLineId: number;
  disputedQty: number;
  reason: string;
}

export interface GetPreviousQuantityRequest {
  projectId: number;
  boqItemId: number;
  context: MeasurementContext;
  asOfDate: string;
}

export interface GetPreviousQuantityResponse {
  previousQty: number;
  certifiedMbCount: number;
  lastCertifiedMbId?: number;
  lastCertifiedDate?: string;
}

export interface VerifyMbChainRequest {
  projectId: number;
}

export interface VerifyMbChainResponse {
  isValid: boolean;
  brokenLinks: number[];
  tamperedMbIds: number[];
}

// ─── KPI Types ───────────────────────────────────────────────────────────────

export interface MbKpis {
  quantityCertifiedThisPeriod: number;
  valueCertifiedThisPeriod: number;
  mbsPendingCheck: number;
  mbsPendingCertification: number;
  measuredButUnbilledQty: number;
  measuredButUnbilledValue: number;
  boqItemsNearingCeiling: number;
  disputedQuantityValue: number;
  mbsWithoutWir: number;
  jointMeasurementCompliancePct: number;
  measurementToCertificationCycleDays: number;
  abnormalMeasurementCount: number;
}

// ─── Report Types ────────────────────────────────────────────────────────────

export interface MbRegisterReport {
  mbs: Array<{
    mbNo: string;
    measurementDate: string;
    context: MeasurementContext;
    status: MbStatus;
    totalQuantity: number;
    totalValue: number;
    measuredBy: string;
    certifiedBy?: string;
  }>;
}

export interface AbstractOfQuantitiesReport {
  projectId: number;
  boqItems: Array<{
    boqItemId: number;
    boqItemCode: string;
    description: string;
    uom: string;
    boqQty: number;
    certifiedQty: number;
    billedQty: number;
    balanceQty: number;
    certifiedValue: number;
  }>;
}

export interface QuantityReconciliationReport {
  projectId: number;
  boqItems: Array<{
    boqItemId: number;
    description: string;
    boqQty: number;
    measuredQty: number;
    certifiedQty: number;
    billedQty: number;
    variance: number;
    variancePct: number;
  }>;
}
