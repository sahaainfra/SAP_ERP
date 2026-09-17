/**
 * Part 13 — Planning & Scheduling Types
 * Type definitions for WBS, schedule, baseline, progress, look-ahead, constraints, and resources
 */

// ─── WBS (Work Breakdown Structure) ──────────────────────────────────────────

export type WbsType = 'PHASE' | 'DELIVERABLE' | 'WORK_PACKAGE' | 'ACTIVITY';
export type WeightBasis = 'VALUE' | 'QUANTITY' | 'DURATION' | 'MANUAL';

export interface WbsNode {
  id: number;
  projectId: number;
  packageId?: number;
  parentId?: number;
  wbsCode: string;
  path: string; // materialized path like '/1/7/23'
  depth: number;
  name: string;
  wbsType: WbsType;
  siteId?: number;
  areaId?: number;
  costCodeId?: number;
  responsibleUserId?: number;
  weightage: number; // within parent, sums to 100
  weightBasis: WeightBasis;
  budgetCost?: number;
  budgetRevenue?: number;
  isBillable: boolean;
  isActive: boolean;
  sortOrder: number;
  children?: WbsNode[];
  progressPercent?: number; // rolled up from children
  plannedPercent?: number; // from baseline
  variancePercent?: number; // actual - planned
}

export interface WbsBoqMap {
  id: number;
  wbsId: number;
  boqItemId: number;
  mappedQty: number; // portion of BOQ qty allocated to this WBS
}

// ─── Schedule Activity ───────────────────────────────────────────────────────

export type ActivityType = 'TASK' | 'MILESTONE' | 'HAMMOCK' | 'LOE'; // Level of Effort
export type ActivityStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED';
export type ConstraintType = 'SNET' | 'FNLT' | 'MSO' | 'MFO' | 'ALAP';
// SNET = Start No Earlier Than
// FNLT = Finish No Later Than
// MSO = Must Start On
// MFO = Must Finish On
// ALAP = As Late As Possible

export interface ScheduleActivity {
  id: number;
  projectId: number;
  wbsId: number;
  activityCode: string;
  name: string;
  activityType: ActivityType;
  plannedStart?: string; // ISO date
  plannedFinish?: string;
  actualStart?: string;
  actualFinish?: string;
  forecastStart?: string;
  forecastFinish?: string;
  durationDays?: number;
  remainingDays?: number;
  calendarId?: number; // working calendar from Part 4
  totalFloat?: number;
  freeFloat?: number;
  isCritical: boolean;
  progressPercent: number;
  constraintType?: ConstraintType;
  constraintDate?: string;
  status: ActivityStatus;
  predecessors?: ActivityRelation[];
  successors?: ActivityRelation[];
}

export type RelationType = 'FS' | 'SS' | 'FF' | 'SF';
// FS = Finish to Start (most common)
// SS = Start to Start
// FF = Finish to Finish
// SF = Start to Finish (rare)

export interface ActivityRelation {
  id: number;
  predecessorId: number;
  successorId: number;
  relationType: RelationType;
  lagDays: number;
}

// ─── Baseline ────────────────────────────────────────────────────────────────

export type BaselineType = 'ORIGINAL' | 'REVISED' | 'CLIENT_APPROVED' | 'INTERNAL';

export interface Baseline {
  id: number;
  projectId: number;
  baselineNo: number;
  baselineType: BaselineType;
  reason: string;
  referenceNo?: string; // EOT letter, variation order
  snapshotAt: string;
  approvedBy?: number;
  approvedAt?: string;
  status: string;
  isCurrent: boolean;
  activities?: BaselineActivity[];
}

export interface BaselineActivity {
  id: number;
  baselineId: number;
  activityId: number;
  wbsId: number;
  plannedStart: string;
  plannedFinish: string;
  durationDays: number;
  budgetCost?: number;
  budgetValue?: number;
  weightage: number;
}

// ─── Physical Progress ───────────────────────────────────────────────────────

export type ProgressMethod = 'QUANTITY' | 'MILESTONE' | 'STEP' | 'DURATION' | 'UNITS' | 'MANUAL';
export type ProgressSourceType = 'MB_CERTIFIED' | 'MILESTONE' | 'STEP' | 'MANUAL' | 'UNITS' | 'DURATION';
export type ProgressStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProgressEntry {
  id: number;
  projectId: number;
  wbsId: number;
  activityId?: number;
  cutoffDate: string; // progress as of this date
  method: ProgressMethod;
  previousPercent: number;
  currentPercent: number;
  sourceType: ProgressSourceType;
  sourceRefId?: number; // MB id, milestone id, etc.
  executedQty?: number;
  remark?: string;
  enteredBy: number;
  enteredAt: string;
  approvedBy?: number;
  approvedAt?: string;
  status: ProgressStatus;
  isDecrease: boolean;
  decreaseReason?: string;
}

export interface ProgressSnapshot {
  id: number;
  projectId: number;
  wbsId: number;
  snapshotDate: string;
  plannedPercent: number;
  actualPercent: number;
  earnedValue?: number;
  actualCost?: number;
  variancePercent: number;
  varianceDays?: number;
}

// ─── Look-ahead Planning ─────────────────────────────────────────────────────

export type PeriodType = 'WEEK_1' | 'WEEK_2' | 'WEEK_3' | 'WEEK_4' | 'WEEK_6';

export interface Lookahead {
  id: number;
  projectId: number;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  preparedBy?: number;
  preparedAt?: string;
  status: string;
  ppcPercent?: number; // Percent Plan Complete
  tasks?: LookaheadTask[];
}

export interface LookaheadTask {
  id: number;
  lookaheadId: number;
  activityId?: number;
  wbsId: number;
  description: string;
  plannedQty?: number;
  uom?: string;
  plannedStart?: string;
  plannedFinish?: string;
  achievedQty?: number;
  isCompleted: boolean;
  varianceReason?: string; // from controlled reason list
  responsibleId?: number;
  isConstrained: boolean;
  constraints?: Constraint[];
}

// ─── Constraints & Obstructions ──────────────────────────────────────────────

export type ConstraintCategory = 
  | 'DRAWING'
  | 'MATERIAL'
  | 'LABOUR'
  | 'EQUIPMENT'
  | 'APPROVAL'
  | 'ACCESS'
  | 'CLIENT'
  | 'WEATHER'
  | 'STATUTORY'
  | 'DESIGN'
  | 'FUNDS';

export type ConstraintSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConstraintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'ACCEPTED';

export interface Constraint {
  id: number;
  projectId: number;
  wbsId?: number;
  activityId?: number;
  constraintType: ConstraintCategory;
  title: string;
  description?: string;
  raisedBy: number;
  raisedAt: string;
  ownerId: number;
  requiredBy: string;
  severity: ConstraintSeverity;
  status: ConstraintStatus;
  resolvedAt?: string;
  resolution?: string;
  delayDays?: number;
  costImpact?: number;
  linkedDocumentType?: string;
  linkedDocumentId?: number;
}

// ─── Resource Planning ───────────────────────────────────────────────────────

export type ResourceType = 'MANPOWER' | 'MATERIAL' | 'EQUIPMENT' | 'SUBCONTRACT';
export type ResourceSource = 'NORM' | 'MANUAL' | 'IMPORT';

export interface ResourcePlan {
  id: number;
  projectId: number;
  wbsId?: number;
  activityId?: number;
  resourceType: ResourceType;
  resourceRefId: number; // trade / item / equipment type / work category
  uom: string;
  plannedQty: number;
  periodStart: string;
  periodEnd: string;
  rate?: number;
  plannedCost?: number;
  source: ResourceSource;
  normId?: number;
}

export interface ResourceNorm {
  id: number;
  boqItemId?: number;
  itemCategoryId?: number;
  resourceType: ResourceType;
  resourceRefId: number;
  qtyPerUnit: number; // e.g. 6.4 bags cement per cum M25
  uom: string;
  wastagePercent: number;
  isActive: boolean;
}

// ─── CPM Calculation Results ─────────────────────────────────────────────────

export interface CpmResult {
  projectId: number;
  calculatedAt: string;
  projectDuration: number;
  criticalPath: number[]; // activity IDs
  totalActivities: number;
  criticalActivities: number;
  nearCriticalActivities: number; // float <= threshold
  hasCycle: boolean;
  cyclePath?: number[]; // activity IDs forming cycle
  errors: string[];
}

// ─── Schedule Import ─────────────────────────────────────────────────────────

export type ImportFormat = 'MS_PROJECT_XML' | 'PRIMAVERA_XER' | 'EXCEL';

export interface ScheduleImport {
  format: ImportFormat;
  file: File;
  mapping: ImportMapping;
  validationReport: ImportValidationReport;
}

export interface ImportMapping {
  activityCode: string;
  activityName: string;
  plannedStart: string;
  plannedFinish: string;
  duration: string;
  predecessor: string;
  wbsCode?: string;
}

export interface ImportValidationReport {
  totalActivities: number;
  validActivities: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  conflicts: ImportConflict[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportWarning {
  row: number;
  message: string;
}

export interface ImportConflict {
  activityCode: string;
  existingActualStart?: string;
  importedPlannedStart?: string;
  message: string;
}

// ─── DPR (Daily Progress Report) ─────────────────────────────────────────────

export interface DailyProgressReport {
  id: number;
  projectId: number;
  reportDate: string;
  weather: string;
  manpower: DprManpower[];
  equipment: DprEquipment[];
  workDone: DprWorkDone[];
  issues: DprIssue[];
  preparedBy: number;
  preparedAt: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}

export interface DprManpower {
  trade: string;
  planned: number;
  actual: number;
  variance: number;
}

export interface DprEquipment {
  equipmentType: string;
  planned: number;
  actual: number;
  hoursWorked: number;
}

export interface DprWorkDone {
  wbsId: number;
  activityId: number;
  description: string;
  plannedQty: number;
  actualQty: number;
  uom: string;
}

export interface DprIssue {
  id: number;
  category: string;
  description: string;
  impact: string;
  actionRequired: string;
  responsible: string;
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface CalculateCpmRequest {
  projectId: number;
  baselineId?: number; // if not provided, use current baseline
}

export interface CalculateCpmResponse {
  result: CpmResult;
  updatedActivities: ScheduleActivity[];
}

export interface RollupProgressRequest {
  projectId: number;
  asOfDate: string;
}

export interface RollupProgressResponse {
  wbsProgress: Array<{
    wbsId: number;
    plannedPercent: number;
    actualPercent: number;
    variancePercent: number;
  }>;
  projectProgress: {
    plannedPercent: number;
    actualPercent: number;
    variancePercent: number;
  };
}

export interface GetMaterialRequirementRequest {
  projectId: number;
  fromDate: string;
  toDate: string;
}

export interface GetMaterialRequirementResponse {
  requirements: Array<{
    itemId: number;
    itemName: string;
    uom: string;
    periodStart: string;
    periodEnd: string;
    requiredQty: number;
    availableStock: number;
    netRequirement: number;
  }>;
}

export interface GetManpowerPlanRequest {
  projectId: number;
  period: string; // 'week' | 'month'
  startDate: string;
}

export interface GetManpowerPlanResponse {
  plan: Array<{
    trade: string;
    periodStart: string;
    periodEnd: string;
    planned: number;
    deployed?: number;
    variance?: number;
  }>;
}
