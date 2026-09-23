/**
 * Part 14 — KPI, Alert & SLA Engine Types
 * 
 * Core types for KPI governance, alert management, and SLA tracking.
 */

// ═══════════════════════════════════════════════════════════════════════════
// KPI TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type KPICalculationType = 'SUM' | 'COUNT' | 'AVG' | 'RATIO' | 'VARIANCE' | 'CUSTOM';
export type KPIValueType = 'CURRENCY' | 'QUANTITY' | 'PERCENT' | 'COUNT' | 'DAYS' | 'RATIO';
export type KPIAggregationLevel = 'COMPANY' | 'PROJECT' | 'SITE' | 'PACKAGE' | 'WBS' | 'USER';
export type KPITargetSource = 'BUDGET' | 'CONTRACT' | 'PLAN' | 'MANUAL' | 'NONE';
export type KPIGoodDirection = 'UP' | 'DOWN' | 'TARGET';
export type KPIRefreshStrategy = 'EVENT' | 'INTERVAL' | 'ON_DEMAND';
export type KPIStatus = 'good' | 'warning' | 'critical' | 'neutral';

export interface KPISourceDefinition {
  tables: string[];
  joins?: Array<{
    type: 'INNER' | 'LEFT' | 'RIGHT';
    table: string;
    on: string;
  }>;
  filters?: Array<{
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'BETWEEN';
    value: any;
  }>;
  groupBy?: string[];
  aggregate: {
    field: string;
    function: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  };
}

export interface KPIDefinition {
  id: number;
  kpiKey: string;
  kpiName: string;
  module: string;
  description?: string;
  calculationType: KPICalculationType;
  valueType: KPIValueType;
  unit?: string;
  aggregationLevel: KPIAggregationLevel;
  sourceDefinition: KPISourceDefinition;
  targetSource?: KPITargetSource;
  goodDirection: KPIGoodDirection;
  thresholdGreen?: number;
  thresholdAmber?: number;
  thresholdRed?: number;
  thresholdType: string;
  refreshStrategy: KPIRefreshStrategy;
  refreshIntervalSeconds?: number;
  cacheTtlSeconds: number;
  requiredPermission: string;
  drillRoute?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KPIValue {
  kpiKey: string;
  value: number | null;
  targetValue?: number;
  status: KPIStatus;
  unit?: string;
  asOf: string;
  isPartial: boolean;
  rowCount: number;
  computeMs: number;
  drillRoute?: string;
}

export interface KPIBatchRequest {
  kpiKeys: string[];
  scope: {
    companyId?: number;
    projectId?: number;
    siteId?: number;
  };
}

export interface KPIBatchResponse {
  values: Record<string, KPIValue>;
  computedAt: string;
}

export interface KPISnapshot {
  id: number;
  kpiKey: string;
  companyId?: number;
  projectId?: number;
  siteId?: number;
  periodStart?: string;
  periodEnd?: string;
  value: number | null;
  targetValue?: number;
  computedAt: string;
  computeMs: number;
  rowCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AlertTriggerType = 'EVENT' | 'THRESHOLD' | 'SCHEDULE';
export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertTargetRule = 'ROLE' | 'RESPONSIBILITY' | 'OWNER' | 'MANAGER' | 'CUSTOM';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'AUTO_CLEARED';

export interface AlertCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'BETWEEN';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AlertRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  module: string;
  triggerType: AlertTriggerType;
  triggerEvent?: string;
  condition: AlertCondition[];
  severity: AlertSeverity;
  messageTemplate: string;
  targetRule: AlertTargetRule;
  targetConfig?: any;
  projectId?: number;
  cooldownMinutes: number;
  autoClear: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Alert {
  id: number;
  ruleId: number;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  companyId?: number;
  projectId?: number;
  siteId?: number;
  status: AlertStatus;
  raisedAt: string;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  resolutionNote?: string;
  occurrenceCount: number;
  lastOccurredAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SLA TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SLAState = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' | 'MET' | 'BREACHED';

export interface WorkingCalendar {
  id: number;
  companyId: number;
  projectId?: number;
  calendarName: string;
  workingDays: number[]; // 1=Mon, 7=Sun
  dayStart: string; // HH:MM
  dayEnd: string; // HH:MM
  timezone: string;
  isActive: boolean;
  createdAt: string;
}

export interface CalendarHoliday {
  id: number;
  calendarId: number;
  holidayDate: string;
  description?: string;
}

export interface SLATracking {
  id: number;
  entityType: string;
  entityId: number;
  workflowStep?: string;
  assignedTo?: number;
  projectId?: number;
  startedAt: string;
  dueAt: string;
  pausedAt?: string;
  totalPausedMinutes: number;
  completedAt?: string;
  state: SLAState;
  escalationLevel: number;
  escalatedTo?: number;
  escalatedAt?: string;
}

export interface SLASummary {
  onTrack: number;
  atRisk: number;
  overdue: number;
  met: number;
  breached: number;
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface KPISeedData {
  kpiKey: string;
  kpiName: string;
  module: string;
  description?: string;
  calculationType: KPICalculationType;
  valueType: KPIValueType;
  unit?: string;
  aggregationLevel: KPIAggregationLevel;
  sourceDefinition: KPISourceDefinition;
  targetSource?: KPITargetSource;
  goodDirection: KPIGoodDirection;
  thresholdGreen?: number;
  thresholdAmber?: number;
  thresholdRed?: number;
  refreshStrategy: KPIRefreshStrategy;
  requiredPermission: string;
  drillRoute?: string;
}

export interface AlertRuleSeedData {
  ruleCode: string;
  ruleName: string;
  module: string;
  triggerType: AlertTriggerType;
  triggerEvent?: string;
  condition: AlertCondition[];
  severity: AlertSeverity;
  messageTemplate: string;
  targetRule: AlertTargetRule;
  cooldownMinutes?: number;
  autoClear?: boolean;
}
