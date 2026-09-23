/**
 * Part 24 — Task Management Types
 * 
 * Defines the task model with seven sources, resolution requirements,
 * and reviewer rules.
 */

import { PermissionKey } from '../permission/types';

// ═══════════════════════════════════════════════════════════════════════════
// TASK TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type TaskType = 
  | 'MANUAL'       // User-created
  | 'SYSTEM'       // Event-driven
  | 'WORKFLOW'     // From approval return
  | 'ALERT'        // From exception
  | 'CHAT'         // From message
  | 'RECURRING'    // Scheduled
  | 'CHECKLIST';   // From checklist item

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskView = 'list' | 'board' | 'calendar' | 'timeline';

// ═══════════════════════════════════════════════════════════════════════════
// RESOLUTION REQUIREMENTS (TASK-02)
// ═══════════════════════════════════════════════════════════════════════════

export type ResolutionType = 
  | 'text'              // Free-text explanation
  | 'attachment'        // File attachment required
  | 'linked_document'   // Link to another document
  | 'reviewer_acceptance'; // Reviewer must accept

export interface ResolutionRequirement {
  type: ResolutionType;
  minLength?: number;           // For 'text' type
  pattern?: string;             // For 'text' type (regex)
  entityType?: string;          // For 'linked_document' type
  reviewerRule?: ApproverRule;  // For 'reviewer_acceptance' type
}

// ═══════════════════════════════════════════════════════════════════════════
// REVIEWER RULE (TASK-03)
// ═══════════════════════════════════════════════════════════════════════════

export type ApproverRule =
  | { type: 'RESPONSIBILITY'; templateCode: string }
  | { type: 'SUPERVISOR_HIERARCHY'; levelsUp: number }
  | { type: 'SPECIFIC_USERS'; userIds: number[] }
  | { type: 'DOCUMENT_FIELD'; field: string }
  | { type: 'COST_CODE_OWNER' };

// ═══════════════════════════════════════════════════════════════════════════
// TASK MODEL
// ═══════════════════════════════════════════════════════════════════════════

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
  siteId?: number;
  assignedTo: number;
  assignedBy?: number;
  assignedAt?: string;
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
  resolutionRequires?: ResolutionRequirement;
  reviewerRule?: ApproverRule;
  reviewerId?: number;
  reviewerAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK COMMENT
// ═══════════════════════════════════════════════════════════════════════════

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  comment: string;
  mentions?: number[];
  attachments?: number[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK SUBSCRIPTION (System Task Subscribers)
// ═══════════════════════════════════════════════════════════════════════════

export interface TaskSubscription {
  id: number;
  eventType: string;
  conditionExpr?: string;
  taskTitleTemplate: string;
  taskDescTemplate?: string;
  assigneeRule: ApproverRule;
  priority: TaskPriority;
  dueInHours?: number;
  resolutionRequires?: ResolutionRequirement;
  reviewerRule?: ApproverRule;
  projectIdExpr?: string;
  isActive: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK CREATION REQUEST
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateTaskRequest {
  title: string;
  description?: string;
  taskType: TaskType;
  sourceEntity?: string;
  sourceId?: number;
  companyId?: number;
  projectId?: number;
  siteId?: number;
  assignedTo: number;
  dueAt?: string;
  priority?: TaskPriority;
  parentTaskId?: number;
  recurrenceRule?: string;
  resolutionRequires?: ResolutionRequirement;
  reviewerRule?: ApproverRule;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignedTo?: number;
  dueAt?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progressPercent?: number;
  blockedReason?: string;
  recurrenceRule?: string;
  resolutionRequires?: ResolutionRequirement;
  reviewerRule?: ApproverRule;
}

export interface CompleteTaskRequest {
  completionNote: string;
  attachments?: number[];
  linkedDocumentId?: number;
}

export interface ReassignTaskRequest {
  newAssigneeId: number;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK FILTERS
// ═══════════════════════════════════════════════════════════════════════════

export interface TaskFilters {
  taskType?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: number;
  projectId?: number;
  siteId?: number;
  dueDateRange?: { from?: string; to?: string };
  sourceEntity?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK VIEWS
// ═══════════════════════════════════════════════════════════════════════════

export interface TaskListView {
  groups: Array<{
    label: string;
    tasks: Task[];
  }>;
}

export interface TaskBoardView {
  columns: Array<{
    status: TaskStatus;
    label: string;
    tasks: Task[];
  }>;
}

export interface TaskCalendarView {
  dates: Record<string, Task[]>; // ISO date -> tasks
}

export interface TaskTimelineView {
  tasks: Array<Task & {
    startAt: string;
    duration: number; // days
    dependencies: number[]; // task IDs
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface TaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  byType: Record<TaskType, number>;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number; // percentage
  averageCompletionTime: number; // hours
}
