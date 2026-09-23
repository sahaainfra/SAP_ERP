/**
 * Part 15 — Analytical View Layer & Batch Framework Types
 * 
 * Defines types for:
 * - Batch job framework (definitions, runs, monitoring)
 * - Real-time fan-out (per-subscriber payloads, throttling)
 * - KPI service (batched queries, consumption views)
 * - Situation/exception engine (detection, ownership, actions)
 * - Offline sync (conflict resolution, allow-lists)
 */

// ═══════════════════════════════════════════════════════════════════════════
// BATCH JOB FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════════

export type JobStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'SKIPPED';
export type JobGroup = 'REALTIME' | 'HOURLY' | 'NIGHTLY' | 'MONTH_END' | 'ON_DEMAND';
export type AlertLevel = 'P1' | 'WARNING' | 'NONE';

export interface BatchJobDefinition {
  code: string;
  label: string;
  schedule: string;  // cron expression
  group: JobGroup;
  timeoutMinutes: number;
  maxRetries: number;
  singleton: boolean;  // cluster-wide lock
  alertOnFailure: AlertLevel;
  alertOnSkip: boolean;
  run: (ctx: JobContext) => Promise<JobResult>;
}

export interface JobContext {
  jobId: number;
  jobCode: string;
  startedAt: Date;
  logger: JobLogger;
  abortSignal: AbortSignal;
}

export interface JobResult {
  recordsProcessed: number;
  recordsFailed: number;
  output?: Record<string, any>;
  errors?: Array<{ recordId: any; error: string }>;
}

export interface JobRun {
  id: number;
  jobCode: string;
  startedAt: string;
  finishedAt?: string;
  status: JobStatus;
  nodeId?: string;
  recordsProcessed?: number;
  recordsFailed?: number;
  durationMs?: number;
  error?: string;
  output?: Record<string, any>;
  createdAt: string;
}

export interface JobLogger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// REAL-TIME FAN-OUT
// ═══════════════════════════════════════════════════════════════════════════

export type DeviceClass = 'DESKTOP' | 'TABLET' | 'PHONE';

export interface RealtimeEnvelope {
  id: number;  // outbox event ID for ordering
  type: string;
  at: string;  // ISO timestamp
  projectId?: number;
  payload: Record<string, any>;
  affects: RealtimeAffects;
}

export interface RealtimeAffects {
  kpis?: string[];  // KPI codes that became stale
  lists?: string[];  // list identifiers that need refresh
  badges?: string[];  // badge counters to update
  documents?: Array<{ type: string; id: number }>;  // specific documents changed
}

export interface RealtimeSession {
  userId: number;
  socketId: string;
  deviceClass: DeviceClass;
  permVersion: string;
  subscriptions: Set<string>;
  connectedAt: Date;
  lastEventId?: number;
}

export interface EventSpec {
  realtime: boolean;
  recipients: (event: any) => Promise<number[]>;  // candidate user IDs
  isVisibleTo: (event: any, perms: any) => boolean;
  buildPayload: (event: any, perms: any) => Record<string, any>;
  affects: (event: any) => RealtimeAffects;
}

export interface TopicSpec {
  canSubscribe: (userId: number, params: any) => Promise<boolean>;
}

export const COALESCE_MS: Record<DeviceClass, number> = {
  DESKTOP: 400,
  TABLET: 800,
  PHONE: 1500,
};

export const MAX_BATCH = 50;

export const URGENT_EVENTS = new Set([
  'approval.requested',
  'alert.raised',
  'sla.breached',
  'incident.reported',
]);

// ═══════════════════════════════════════════════════════════════════════════
// KPI SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export type KpiScope = 'GLOBAL' | 'COMPANY' | 'PROJECT' | 'USER';
export type KpiValueType = 'MONEY' | 'QUANTITY' | 'PERCENT' | 'COUNT' | 'DAYS' | 'RATIO';
export type KpiRefresh = 'LIVE' | 'NEAR_LIVE' | 'PERIODIC' | 'DAILY';
export type KpiHealth = 'NEUTRAL' | 'GOOD' | 'WARNING' | 'CRITICAL';
export type TrendGrain = 'DAY' | 'WEEK' | 'MONTH';

export type KpiSource =
  | { kind: 'VIEW'; view: string; column: string; filter?: string }
  | { kind: 'READ_MODEL'; table: string; column: string }
  | { kind: 'EXPRESSION'; expr: string; dependsOn: string[] };

export interface KpiDefinition {
  code: string;
  label: string;
  module: string;
  permission: string;
  scope: KpiScope;
  valueType: KpiValueType;
  source: KpiSource;
  refresh: KpiRefresh;
  invalidatedBy: string[];  // event types
  target?: { expr: string; direction: 'HIGHER_BETTER' | 'LOWER_BETTER' };
  thresholds?: { critical: string; warning: string };
  drillTo?: { route: string; params: Record<string, string> };
  trendGrain?: TrendGrain;
}

export interface KpiRequest {
  code: string;
  projectId?: number;
  companyId?: number;
  includeTrend?: boolean;
  context?: Record<string, any>;
}

export interface KpiResult {
  code: string;
  label: string;
  value: number | null;
  formatted: string;
  target?: number;
  variance?: { value: number; percent: number };
  health: KpiHealth;
  trend?: Array<{ period: string; value: number }>;
  asOf: string;
  drillTo?: { route: string; params: Record<string, string> };
  source: { view: string; rowCount: number; refresh: KpiRefresh };
}

// ═══════════════════════════════════════════════════════════════════════════
// SITUATION / EXCEPTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export type SituationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'P1';

export type SituationDetection =
  | { kind: 'EVENT'; eventType: string; condition: string }
  | { kind: 'SCHEDULED'; cron: string; query: string };

export interface SituationAction {
  code: string;
  label: string;
  permission: string;
  route?: string;
}

export interface SituationDefinition {
  code: string;
  label: string;
  severity: SituationSeverity;
  detection: SituationDetection;
  responsibleRule: any;  // ApproverRule from Part 10
  contextBuilder: string;
  proposedActions: SituationAction[];
  autoResolveWhen?: string;  // condition expression
  escalation?: any;  // EscalationRule from Part 10
  suppressDuplicateHours?: number;
}

export type SituationStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';

export interface Situation {
  id: number;
  definitionCode: string;
  status: SituationStatus;
  severity: SituationSeverity;
  title: string;
  message: string;
  context: Record<string, any>;
  responsibleUserId: number;
  projectId?: number;
  entityType?: string;
  entityId?: number;
  raisedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: number;
  resolvedAt?: string;
  resolvedBy?: number;
  resolutionNote?: string;
  escalatedAt?: string;
  escalatedTo?: number;
  occurrenceCount: number;
  lastOccurredAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// OFFLINE SYNC
// ═══════════════════════════════════════════════════════════════════════════

export type SyncStatus = 'ACCEPTED' | 'REJECTED' | 'CONFLICT' | 'DUPLICATE';

export interface OfflineRecord {
  localId: string;
  entityType: string;
  projectId: number;
  capturedAt: string;
  payload: Record<string, any>;
}

export interface OfflineBatch {
  records: OfflineRecord[];
  deviceId: string;
  userId: number;
}

export interface SyncResult {
  localId: string;
  status: SyncStatus;
  serverId?: number;
  documentNumber?: string;
  error?: string;
  message?: string;
  serverState?: Record<string, any>;
  resolutionOptions?: string[];
}

export type ResolutionKind = 'ACCEPT' | 'CONFLICT' | 'REJECT';

export interface SyncResolution {
  kind: ResolutionKind;
  code?: string;
  message?: string;
  reason?: string;
  serverState?: Record<string, any>;
  options?: string[];
  documentNumber?: string;
  mode?: string;  // e.g., 'MERGE_OUT_PUNCH'
}

export interface SyncResolver {
  resolve: (ctx: any, record: OfflineRecord) => Promise<SyncResolution>;
}

export const OFFLINE_ALLOWED = new Set([
  'attendance',
  'dpr',
  'measurement_book',
  'inspection',
  'incident',
  'observation',
]);

export const OFFLINE_PERMISSION: Record<string, string> = {
  attendance: 'hr.attendance.mark',
  dpr: 'project.dpr.create',
  measurement_book: 'mb.entry.create',
  inspection: 'qa.inspection.create',
  incident: 'hse.incident.create',
  observation: 'hse.observation.create',
};

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICAL VIEW LAYER
// ═══════════════════════════════════════════════════════════════════════════

export type ViewTier = 'BASIC' | 'COMPOSITE' | 'CONSUMPTION';

export interface ViewDefinition {
  name: string;
  tier: ViewTier;
  description: string;
  sourceTables: string[];
  exposesProjectId: boolean;  // consumption views must expose this
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE BUDGETS
// ═══════════════════════════════════════════════════════════════════════════

export const PERFORMANCE_BUDGETS = {
  websocketConnect: 300,  // ms
  eventToRender: 3000,  // ms
  kpiBatch20: 800,  // ms
  consumptionViewQuery: 300,  // ms
  fanout200Recipients: 2000,  // ms
  replay500Events: 2000,  // ms
  offlineBatch50Records: 5000,  // ms
};

export const LOAD_PROFILE = {
  concurrentSockets: 200,
  attendancePunches60s: 1000,
  concurrentMBSaves: 50,
  monthEndProjects: 30,
};
