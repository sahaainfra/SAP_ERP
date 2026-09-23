/**
 * Part 23 — Approval, Exception, Task & Notification Types
 * 
 * Defines the data structures for:
 * - Approval Centre (unified approval queue and decision interface)
 * - Exception Centre (management view of all issues)
 * - Task Centre (unified task management)
 * - Notification Centre (unified notification system)
 */

import { PermissionKey } from '../permission/types';

// ═══════════════════════════════════════════════════════════════════════════
// APPROVAL CENTRE
// ═══════════════════════════════════════════════════════════════════════════

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'FORWARDED' | 'CANCELLED';
export type SLAState = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
export type DecisionType = 'APPROVE' | 'REJECT' | 'RETURN' | 'FORWARD' | 'APPROVE_WITH_CONDITIONS' | 'REQUEST_INFO';

export interface ApprovalQueueItem {
  taskId: number;
  instanceId: number;
  documentType: string;
  documentId: number;
  documentNumber: string;
  documentTitle: string;
  projectId: number;
  projectName: string;
  siteId?: number;
  siteName?: string;
  value?: number;
  currency: string;
  submittedBy: number;
  submittedByName: string;
  submittedAt: string;
  dueAt?: string;
  slaState: SLAState;
  age: string; // e.g., "2d 4h"
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  stepName: string;
  stepNo: number;
  totalSteps: number;
  riskFlags: RiskFlag[];
  assigneeId: number; // Added for approval centre
}

export interface RiskFlag {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
}

export interface ApprovalDetail extends ApprovalQueueItem {
  // Full document preview
  documentData: Record<string, any>;
  
  // Financial summary
  budgetImpact?: {
    costCode: string;
    budget: number;
    committed: number;
    actual: number;
    available: number;
    afterThis: number;
    status: 'WITHIN' | 'EXCEEDED';
  };
  
  // Comparison context
  comparison?: {
    label: string;
    thisValue: string;
    referenceValue: string;
    variancePct: number;
  };
  
  // Overrides applied
  overridesApplied: Array<{
    ruleCode: string;
    reason: string;
    by: string;
  }>;
  
  // Prior decisions
  priorDecisions: Array<{
    step: string;
    by: string;
    at: string;
    decision: string;
    note?: string;
  }>;
  
  // Attachments
  attachments: Array<{
    id: number;
    name: string;
    type: string;
    sizeKb: number;
    previewUrl?: string;
  }>;
  
  // Allowed actions for current user
  allowedActions: DecisionType[];
  
  // Requester's note
  requesterNote?: string;
}

export interface ApprovalDecision {
  type: DecisionType;
  note?: string;
  conditions?: string[]; // For APPROVE_WITH_CONDITIONS
  forwardTo?: number; // For FORWARD
  targetFields?: string[]; // For RETURN
}

export interface BulkApprovalRequest {
  taskIds: number[];
  decision: ApprovalDecision;
  batchComment: string;
}

export interface BulkApprovalResult {
  successCount: number;
  failureCount: number;
  results: Array<{
    taskId: number;
    status: 'SUCCESS' | 'FAILED' | 'EXCLUDED';
    reason?: string;
  }>;
}

export interface OutOfOfficeRequest {
  userId: number;
  substituteUserId: number;
  validFrom: string;
  validTo: string;
  documentTypes?: string[]; // null = all
  projectIds?: number[]; // null = all
  reason: string;
}

export type ApprovalGroupBy = 'document_type' | 'project' | 'urgency' | 'value' | 'requester';
export type ApprovalSortBy = 'sla_state' | 'value' | 'age' | 'priority';

// ═══════════════════════════════════════════════════════════════════════════
// EXCEPTION CENTRE
// ═══════════════════════════════════════════════════════════════════════════

export type ExceptionCategory = 'FINANCIAL' | 'OPERATIONAL' | 'COMPLIANCE' | 'PROCESS';
export type ExceptionStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED' | 'ESCALATED';

export interface Exception {
  id: number;
  category: ExceptionCategory;
  code: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ExceptionStatus;
  
  // Impact
  impactValue?: number;
  impactDescription: string;
  
  // Ownership
  ownerUserId?: number;
  ownerName?: string;
  projectId?: number;
  projectName?: string;
  
  // Timeline
  raisedAt: string;
  targetResolutionDate?: string;
  resolvedAt?: string;
  resolvedBy?: number;
  resolutionNote?: string;
  
  // Acceptance (for known exceptions)
  acceptedAt?: string;
  acceptedBy?: number;
  acceptanceJustification?: string;
  acceptanceExpiresAt?: string;
  
  // Related entity
  entityType?: string;
  entityId?: number;
  entityRoute?: string;
  
  // Proposed actions
  proposedActions: Array<{
    code: string;
    label: string;
    permission: PermissionKey;
    route?: string;
  }>;
  
  occurrenceCount: number;
  lastOccurredAt: string;
}

export interface ExceptionTrend {
  period: string;
  raised: number;
  resolved: number;
  byCategory: Record<ExceptionCategory, { raised: number; resolved: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK CENTRE
// ═══════════════════════════════════════════════════════════════════════════

export type TaskType = 'MANUAL' | 'SYSTEM' | 'FOLLOW_UP' | 'EXCEPTION' | 'CONDITION_OF_APPROVAL';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type TaskView = 'list' | 'board' | 'calendar' | 'timeline';

export interface Task {
  id: number;
  type: TaskType;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  
  // Assignment
  assigneeId: number;
  assigneeName: string;
  createdBy: number;
  createdByName: string;
  
  // Context
  projectId?: number;
  projectName?: string;
  entityType?: string;
  entityId?: number;
  entityRoute?: string;
  
  // Timeline
  createdAt: string;
  dueAt?: string;
  completedAt?: string;
  completedBy?: number;
  
  // Recurrence
  isRecurring: boolean;
  recurrenceRule?: string; // cron expression
  nextOccurrence?: string;
  
  // Resolution
  resolutionRequires?: {
    field: string;
    minLength?: number;
    pattern?: string;
  };
  
  // Reviewer (for exceptions)
  reviewerRule?: any; // ApproverRule from Part 10
  reviewerId?: number;
  reviewerName?: string;
}

export interface TaskCreateRequest {
  type: TaskType;
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeId: number;
  projectId?: number;
  entityType?: string;
  entityId?: number;
  dueAt?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  resolutionRequires?: Task['resolutionRequires'];
  reviewerRule?: any;
}

export interface TaskCompletionRequest {
  taskId: number;
  resolution: string;
  attachments?: number[];
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION CENTRE
// ═══════════════════════════════════════════════════════════════════════════

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface Notification {
  id: number;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  
  // Content
  title: string;
  message: string;
  templateCode?: string;
  summary?: string; // For grouped notifications
  
  // Context
  userId: number;
  entityType?: string;
  entityId?: number;
  entityRoute?: string;
  projectId?: number;
  
  // Grouping
  groupId?: string; // For digesting similar notifications
  groupCount?: number;
  
  // Timeline
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  
  // Actions
  actions?: Array<{
    label: string;
    route: string;
    primary: boolean;
  }>;
}

export interface NotificationPreferences {
  userId: number;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  quietHours?: {
    start: string; // HH:MM
    end: string; // HH:MM
    timezone: string;
  };
  digestThreshold: number; // Group after N similar notifications
  escalationNotify: boolean;
}

export interface NotificationGroup {
  groupId: string;
  templateCode: string;
  count: number;
  latestAt: string;
  summary: string;
  notifications: Notification[];
}

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE COUNTS (for shell bar badges)
// ═══════════════════════════════════════════════════════════════════════════

export interface QueueCounts {
  approvalsPending: number;
  approvalsOverdue: number;
  tasksOpen: number;
  tasksOverdue: number;
  exceptionsOpen: number;
  exceptionsCritical: number;
  notificationsUnread: number;
  notificationsCritical: number;
}
