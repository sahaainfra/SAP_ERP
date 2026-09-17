/**
 * Workflow Types - Part 7
 * 
 * Type definitions for Approval Centre, Task Centre, Exception Centre, and Notifications
 */

import type { ObjectType } from './dashboard';

// ─── Approval Centre ─────────────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'forwarded' | 'cancelled';
export type SlaState = 'on_track' | 'at_risk' | 'overdue';
export type DecisionAction = 'approve' | 'reject' | 'return' | 'forward' | 'approve_with_conditions' | 'request_info';

export interface ApprovalItem {
  id: number;
  entityType: ObjectType;
  entityNumber: string;
  entityTitle: string;
  requester: string;
  requesterId: number;
  project: string;
  projectId: number;
  site?: string;
  siteId?: number;
  amount: number;
  currency: string;
  submittedAt: string;
  dueAt: string;
  slaState: SlaState;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: ApprovalStatus;
  riskFlags: RiskFlag[];
  budgetImpact?: BudgetImpact;
  comparisonContext?: ComparisonContext;
}

export interface RiskFlag {
  type: 'budget_exceeded' | 'boq_exceeded' | 'rate_variance' | 'vendor_hold' | 'duplicate' | 'sod_concern' | 'unusual_amount';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: string;
}

export interface BudgetImpact {
  costHead: string;
  currentSpend: number;
  budget: number;
  afterApproval: number;
  percentageAfter: number;
  isOverBudget: boolean;
}

export interface ComparisonContext {
  type: 'po' | 'bill' | 'mb';
  alternatives?: Array<{
    vendor: string;
    amount: number;
    selected: boolean;
    reason?: string;
  }>;
  previousValue?: number;
  cumulativeValue?: number;
}

export interface ApprovalDecision {
  action: DecisionAction;
  comment: string;
  conditions?: string[];
  forwardTo?: number;
  forwardReason?: string;
  informationRequest?: string;
}

export interface ApprovalHistoryItem {
  id: number;
  approver: string;
  approverId: number;
  action: DecisionAction;
  timestamp: string;
  comment?: string;
  timeTaken: number; // in minutes
  slaMet: boolean;
  onBehalfOf?: string;
}

export interface OutOfOffice {
  userId: number;
  startDate: string;
  endDate: string;
  substituteId: number;
  substituteName: string;
  reason: string;
}

// ─── Task Centre ─────────────────────────────────────────────────────────────

export type TaskType = 'manual' | 'system' | 'workflow' | 'alert' | 'recurring' | 'checklist';
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskView = 'list' | 'board' | 'calendar' | 'timeline';

export interface Task {
  id: number;
  taskNumber: string;
  title: string;
  description?: string;
  taskType: TaskType;
  sourceEntity?: string;
  sourceId?: number;
  companyId?: number;
  projectId?: number;
  projectName?: string;
  siteId?: number;
  assignedTo: number;
  assignedToName: string;
  assignedBy: number;
  assignedByName: string;
  assignedAt: string;
  dueAt?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progressPercent: number;
  completedAt?: string;
  completedBy?: number;
  completionNote?: string;
  blockedReason?: string;
  parentTaskId?: number;
  recurrenceRule?: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  subtasks: Task[];
}

export interface TaskComment {
  id: number;
  userId: number;
  userName: string;
  comment: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: number;
  uploadedAt: string;
  downloadUrl: string;
}

// ─── Exception Centre ────────────────────────────────────────────────────────

export type ExceptionCategory = 'financial' | 'operational' | 'compliance' | 'process';
export type ExceptionStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'accepted';

export interface Exception {
  id: number;
  category: ExceptionCategory;
  type: string;
  title: string;
  description: string;
  impact?: number; // monetary or operational impact
  impactUnit?: string;
  entityType?: string;
  entityId?: number;
  entityNumber?: string;
  projectId?: number;
  projectName?: string;
  ownerId?: number;
  ownerName?: string;
  raisedAt: string;
  status: ExceptionStatus;
  targetResolutionDate?: string;
  resolutionNote?: string;
  acceptanceJustification?: string;
  acceptanceExpiry?: string;
  age: number; // in days
}

export interface ExceptionTrend {
  period: string;
  raised: number;
  resolved: number;
  byCategory: Record<ExceptionCategory, { raised: number; resolved: number }>;
}

// ─── Notification Engine ─────────────────────────────────────────────────────

export type NotificationCategory = 'approval' | 'task' | 'alert' | 'mention' | 'system' | 'digest';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';
export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms' | 'whatsapp';
export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

export interface Notification {
  id: number;
  userId: number;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: number;
  actionRoute?: string;
  projectId?: number;
  isRead: boolean;
  readAt?: string;
  isActioned: boolean;
  createdAt: string;
  expiresAt?: string;
  groupKey?: string;
  deliveries: NotificationDelivery[];
}

export interface NotificationDelivery {
  id: number;
  notificationId: number;
  channel: NotificationChannel;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  attempts: number;
  sentAt?: string;
  error?: string;
}

export interface NotificationPreference {
  userId: number;
  category: NotificationCategory;
  inApp: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
  frequency: NotificationFrequency;
  quietStart?: string;
  quietEnd?: string;
}

export interface NotificationTemplate {
  id: number;
  category: NotificationCategory;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface ApprovalQueueFilters {
  entityType?: ObjectType[];
  projectId?: number[];
  siteId?: number[];
  amountMin?: number;
  amountMax?: number;
  requesterId?: number;
  dateFrom?: string;
  dateTo?: string;
  slaState?: SlaState[];
  priority?: TaskPriority[];
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  projectId?: number[];
  assignedTo?: number[];
  dueFrom?: string;
  dueTo?: string;
  taskType?: TaskType[];
}

export interface ExceptionFilters {
  category?: ExceptionCategory[];
  status?: ExceptionStatus[];
  projectId?: number[];
  ownerId?: number[];
  impactMin?: number;
  impactMax?: number;
}
