/**
 * Real-time Engine Types - Part 4
 * 
 * Event model, KPI definitions, alert rules, SLA tracking
 */

// ─── Event System ────────────────────────────────────────────────────────────

export type EventType = 
  // Projects
  | 'project.created' | 'project.status_changed' | 'project.progress_updated'
  | 'project.budget_revised' | 'project.milestone_reached' | 'project.milestone_missed'
  // Procurement
  | 'purchase_order.created' | 'purchase_order.approved' | 'purchase_order.rejected'
  | 'purchase_order.delivery_overdue' | 'purchase_requisition.submitted'
  // Materials
  | 'grn.created' | 'grn.approved' | 'stock.received' | 'stock.issued'
  | 'stock.below_reorder' | 'stock.negative'
  // Execution
  | 'dpr.submitted' | 'measurement_book.certified' | 'progress.updated'
  // Billing
  | 'ra_bill.created' | 'ra_bill.certified' | 'ra_bill.approved' | 'invoice.overdue'
  // Finance
  | 'payment.made' | 'receipt.received' | 'budget.exceeded' | 'budget.threshold_breached'
  // Quality & Safety
  | 'wir.raised' | 'ncr.raised' | 'ncr.overdue' | 'incident.reported'
  // Workflow
  | 'approval.requested' | 'approval.granted' | 'approval.rejected'
  | 'task.assigned' | 'task.completed' | 'task.overdue'
  | 'sla.at_risk' | 'sla.breached'
  // Admin
  | 'permission.changed' | 'assignment.changed';

export interface EventEnvelope {
  eventId: string;
  eventType: EventType;
  occurredAt: string;
  actorUserId: number;
  entityType: string;
  entityId: number;
  scope: {
    companyId: number;
    projectId: number;
    siteId?: number;
    financialYear: string;
  };
  changes: Record<string, { from: any; to: any }>;
  affectedKpis: string[];
  version: number;
}

// ─── KPI Engine ──────────────────────────────────────────────────────────────

export type KpiCalculationType = 'SUM' | 'COUNT' | 'AVG' | 'RATIO' | 'VARIANCE' | 'CUSTOM';
export type KpiValueType = 'CURRENCY' | 'QUANTITY' | 'PERCENT' | 'COUNT' | 'DAYS' | 'RATIO';
export type KpiAggregationLevel = 'COMPANY' | 'PROJECT' | 'SITE' | 'PACKAGE' | 'WBS' | 'USER';
export type KpiGoodDirection = 'UP' | 'DOWN' | 'TARGET';
export type KpiRefreshStrategy = 'EVENT' | 'INTERVAL' | 'ON_DEMAND';
export type KpiStatus = 'good' | 'warning' | 'critical' | 'neutral';

export interface KpiDefinition {
  id: number;
  kpiKey: string;
  kpiName: string;
  module: string;
  description?: string;
  calculationType: KpiCalculationType;
  valueType: KpiValueType;
  unit?: string;
  aggregationLevel: KpiAggregationLevel;
  goodDirection: KpiGoodDirection;
  thresholdGreen?: number;
  thresholdAmber?: number;
  thresholdRed?: number;
  thresholdType: 'PERCENT_OF_TARGET' | 'ABSOLUTE';
  refreshStrategy: KpiRefreshStrategy;
  refreshIntervalS?: number;
  cacheTtlS: number;
  requiredPermission: string;
  drillRoute?: string;
  isActive: boolean;
}

export interface KpiValue {
  kpiKey: string;
  value: number | null;
  previousValue: number | null;
  target: number | null;
  variance: number | null;
  variancePercent: number | null;
  trend: 'up' | 'down' | 'stable';
  status: KpiStatus;
  unit: string;
  asOf: string;
  isPartial: boolean;
  computeMs: number;
  rowCount: number;
  fromCache: boolean;
  cacheAgeSeconds: number;
}

export interface KpiSnapshot {
  id: number;
  kpiKey: string;
  companyId?: number;
  projectId?: number;
  siteId?: number;
  periodStart?: string;
  periodEnd?: string;
  value: number;
  targetValue?: number;
  computedAt: string;
  computeMs: number;
  rowCount: number;
}

// ─── Alert Engine ────────────────────────────────────────────────────────────

export type AlertTriggerType = 'EVENT' | 'THRESHOLD' | 'SCHEDULE';
export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertTargetRule = 'ROLE' | 'RESPONSIBILITY' | 'OWNER' | 'MANAGER' | 'CUSTOM';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'AUTO_CLEARED';

export interface AlertRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  module: string;
  triggerType: AlertTriggerType;
  triggerEvent?: EventType;
  conditionJson: any;
  severity: AlertSeverity;
  messageTemplate: string;
  targetRule: AlertTargetRule;
  targetConfig?: any;
  projectId?: number;
  cooldownMinutes: number;
  autoClear: boolean;
  isActive: boolean;
}

export interface Alert {
  id: number;
  ruleId: number;
  ruleCode: string;
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

// ─── SLA Engine ──────────────────────────────────────────────────────────────

export type SlaState = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' | 'MET' | 'BREACHED';

export interface SlaTracking {
  id: number;
  entityType: string;
  entityId: number;
  workflowStep: string;
  assignedTo: number;
  projectId: number;
  startedAt: string;
  dueAt: string;
  pausedAt?: string;
  totalPausedMinutes: number;
  completedAt?: string;
  state: SlaState;
  escalationLevel: number;
  escalatedTo?: number;
  escalatedAt?: string;
}

export interface WorkingCalendar {
  id: number;
  companyId: number;
  projectId?: number;
  workingDays: string; // '1,2,3,4,5,6'
  dayStart: string; // '09:00'
  dayEnd: string; // '18:00'
  timezone: string;
  isActive: boolean;
}

// ─── WebSocket ───────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export type WebSocketMessageType =
  | 'kpi.update'
  | 'alert.raised'
  | 'alert.cleared'
  | 'notification.new'
  | 'approval.pending'
  | 'approval.resolved'
  | 'task.assigned'
  | 'task.updated'
  | 'activity.new'
  | 'sla.warning'
  | 'sla.breached'
  | 'presence.changed'
  | 'permission.changed'
  | 'system.message'
  | 'connection.status';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  channel: string;
  timestamp: string;
  sequence: number;
  data: any;
}

// ─── Event Outbox ────────────────────────────────────────────────────────────

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface EventOutbox {
  id: number;
  eventId: string;
  eventType: EventType;
  entityType: string;
  entityId: number;
  actorUserId?: number;
  companyId?: number;
  projectId?: number;
  siteId?: number;
  payload: any;
  occurredAt: string;
  publishedAt?: string;
  publishAttempts: number;
  lastError?: string;
  status: OutboxStatus;
}
