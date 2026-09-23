/**
 * Part 10 — Workflow & Approval Engine Types
 * 
 * Defines the complete workflow framework including:
 * - Workflow definitions with versioning
 * - Workflow steps with approver rules
 * - Workflow instances (running workflows)
 * - Workflow tasks (approver assignments)
 * - Approver resolution rules (9 types)
 * - Decision actions (6 types)
 * - SLA and escalation
 * - Substitution (out-of-office)
 * - ApprovalCard contract
 */

import { PermissionKey } from '../permission/types';
import { DocumentState } from '../document/types';

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export type WorkflowScopeType = 'GLOBAL' | 'COMPANY' | 'PROJECT';

export interface WorkflowDefinition {
  id: number;
  workflowCode: string;
  documentType: string;
  scopeType: WorkflowScopeType;
  scopeId?: number;
  version: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  description?: string;
  createdBy?: number;
  createdAt: string;
  activatedBy?: number;
  activatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW STEP
// ═══════════════════════════════════════════════════════════════════════════

export type StepType = 'APPROVAL' | 'REVIEW' | 'NOTIFY' | 'CONDITION' | 'PARALLEL_GROUP';
export type CompletionRule = 'ALL' | 'ANY' | 'QUORUM';
export type RejectAction = 'RETURN' | 'TERMINATE';

export interface WorkflowStep {
  id: number;
  definitionId: number;
  stepNo: number;
  stepName: string;
  stepType: StepType;
  precondition?: PreconditionExpression;
  approverRule: ApproverRule;
  completionRule: CompletionRule;
  quorumCount?: number;
  slaHours?: number;
  escalationRule?: EscalationRule;
  allowDelegate: boolean;
  allowRejectTo: 'ORIGINATOR' | 'PREVIOUS_STEP' | 'SPECIFIC';
  isFinal: boolean;
  onReject: RejectAction;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRECONDITION EXPRESSION
// ═══════════════════════════════════════════════════════════════════════════

export type PreconditionExpression =
  | { op: 'eq'; field: string; value: any }
  | { op: 'ne'; field: string; value: any }
  | { op: 'gt'; field: string; value: number }
  | { op: 'gte'; field: string; value: number }
  | { op: 'lt'; field: string; value: number }
  | { op: 'lte'; field: string; value: number }
  | { op: 'in'; field: string; values: any[] }
  | { op: 'and'; children: PreconditionExpression[] }
  | { op: 'or'; children: PreconditionExpression[] }
  | { op: 'not'; child: PreconditionExpression };

// ═══════════════════════════════════════════════════════════════════════════
// APPROVER RULES (9 types - AME-style)
// ═══════════════════════════════════════════════════════════════════════════

export type ApproverRule =
  | { type: 'PERMISSION'; key: PermissionKey; scope: 'PROJECT' | 'COMPANY' }
  | { type: 'AUTHORITY_CHAIN'; documentType: string; startLevel: number }
  | { type: 'RESPONSIBILITY'; templateCode: string }
  | { type: 'SUPERVISOR_HIERARCHY'; levelsUp: number; stopAtJobLevel?: number }
  | { type: 'SPECIFIC_USERS'; userIds: number[] }
  | { type: 'APPROVAL_GROUP'; groupCode: string; mode: 'ALL' | 'ANY' | 'QUORUM' }
  | { type: 'DOCUMENT_FIELD'; field: string }
  | { type: 'COST_CODE_OWNER' }
  | { type: 'AUTO_APPROVE'; justification: string };

export interface ResolvedApprover {
  userId: number;
  level?: number;
  limit?: number;
  via?: 'RULE' | 'SUBSTITUTE' | 'DELEGATION' | 'ESCALATION';
  originalUserId?: number;
  auto?: boolean;
  justification?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ESCALATION RULE
// ═══════════════════════════════════════════════════════════════════════════

export type EscalationAction = 'REMIND' | 'NOTIFY_SUPERVISOR' | 'REASSIGN' | 'AUTO_APPROVE';

export interface EscalationStage {
  afterHours: number;
  action: EscalationAction;
  target?: ApproverRule;
}

export interface EscalationRule {
  stages: EscalationStage[];
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

export type WorkflowInstanceStatus = 'RUNNING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'TERMINATED';

export interface WorkflowInstance {
  id: number;
  definitionId: number;
  definitionVersion: number;
  documentType: string;
  documentId: number;
  projectId?: number;
  companyId?: number;
  documentValue?: number;
  currencyCode?: string;
  status: WorkflowInstanceStatus;
  currentStep?: number;
  submittedBy: number;
  submittedAt: string;
  completedAt?: string;
  outcomeNote?: string;
  contextSnapshot: Record<string, any>;
  contentHash?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW TASK
// ═══════════════════════════════════════════════════════════════════════════

export type TaskAssignmentMethod = 'RULE' | 'SUBSTITUTE' | 'DELEGATION' | 'ESCALATION' | 'REASSIGN';
export type TaskStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'SKIPPED' | 'EXPIRED' | 'CANCELLED';

export interface WorkflowTask {
  id: number;
  instanceId: number;
  stepNo: number;
  stepName: string;
  assigneeId: number;
  assignedVia: TaskAssignmentMethod;
  originalAssigneeId?: number;
  assignedAt: string;
  dueAt?: string;
  status: TaskStatus;
  decisionAt?: string;
  decisionNote?: string;
  decidedFromIp?: string;
  decidedDevice?: string;
  escalationLevel: number;
  reminderCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW LOG
// ═══════════════════════════════════════════════════════════════════════════

export type WorkflowEventType =
  | 'SUBMITTED'
  | 'STEP_SKIPPED'
  | 'AUTO_APPROVED'
  | 'TASK_ASSIGNED'
  | 'TASK_APPROVED'
  | 'TASK_REJECTED'
  | 'TASK_RETURNED'
  | 'TASK_DELEGATED'
  | 'TASK_ESCALATED'
  | 'ESCALATION_REMINDER'
  | 'ESCALATION_SUPERVISOR'
  | 'ESCALATION_REASSIGN'
  | 'ESCALATION_AUTO_APPROVE'
  | 'COMPLETED'
  | 'WITHDRAWN'
  | 'TERMINATED';

export interface WorkflowLog {
  id: number;
  instanceId: number;
  eventType: WorkflowEventType;
  stepNo?: number;
  actorId?: number;
  payload?: Record<string, any>;
  loggedAt: string;
  rowHash: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DECISION
// ═══════════════════════════════════════════════════════════════════════════

export type DecisionType = 'APPROVE' | 'REJECT' | 'RETURN' | 'REQUEST_INFO' | 'DELEGATE' | 'APPROVE_WITH_CONDITIONS';

export interface Decision {
  type: DecisionType;
  note?: string;
  delegateTo?: number;
  conditions?: string[];
  targetFields?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSTITUTION (OUT OF OFFICE)
// ═══════════════════════════════════════════════════════════════════════════

export type SubstitutionMode = 'FORWARD' | 'COPY';

export interface Substitution {
  id: number;
  userId: number;
  substituteUserId: number;
  documentTypes?: string[];
  projectIds?: number[];
  validFrom: string;
  validTo: string;
  mode: SubstitutionMode;
  reason?: string;
  createdBy?: number;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKING CALENDAR
// ═══════════════════════════════════════════════════════════════════════════

export interface WorkingCalendar {
  id: number;
  calendarName: string;
  scopeType: WorkflowScopeType;
  scopeId?: number;
  workingDays: number[]; // 1=Monday, 7=Sunday
  workingHours: { start: string; end: string };
  holidays?: Array<{ date: string; name: string }>;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// APPROVAL CARD (for Part 23 Approval Centre)
// ═══════════════════════════════════════════════════════════════════════════

export interface ApprovalCard {
  taskId: number;
  instanceId: number;
  document: {
    type: string;
    id: number;
    number: string;
    title: string;
    url: string;
  };
  project: {
    id: number;
    name: string;
    code: string;
  };
  submittedBy: {
    id: number;
    name: string;
    role: string;
  };
  submittedAt: string;
  dueAt: string | null;
  overdueBy: string | null;
  stepName: string;
  stepNo: number;
  totalSteps: number;
  value: { amount: string; currency: string } | null;

  // Decision context - mandatory, computed server-side
  keyFigures: Array<{
    label: string;
    value: string;
    emphasis?: 'positive' | 'critical' | 'negative';
  }>;
  budgetImpact?: {
    costCode: string;
    budget: string;
    committed: string;
    actual: string;
    available: string;
    afterThis: string;
    status: 'WITHIN' | 'EXCEEDED';
  };
  comparison?: {
    label: string;
    thisValue: string;
    referenceValue: string;
    variancePct: number;
  };
  riskFlags: Array<{
    code: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
  }>;
  overridesApplied: Array<{
    ruleCode: string;
    reason: string;
    by: string;
  }>;
  priorDecisions: Array<{
    step: string;
    by: string;
    at: string;
    decision: string;
    note?: string;
  }>;
  attachments: Array<{
    id: number;
    name: string;
    type: string;
    sizeKb: number;
  }>;
  allowedActions: DecisionType[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTEXT (for workflow evaluation)
// ═══════════════════════════════════════════════════════════════════════════

export interface DocumentContext {
  documentType: string;
  id: number;
  projectId?: number;
  companyId?: number;
  value?: number;
  currency?: string;
  submittedBy: number;
  attributes: Record<string, any>;
  contentHash?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW DEFINITION SEED (for configuration)
// ═══════════════════════════════════════════════════════════════════════════

export interface WorkflowDefinitionSeed {
  workflowCode: string;
  documentType: string;
  scopeType: WorkflowScopeType;
  scopeId?: number;
  version: number;
  description?: string;
  steps: Array<{
    stepNo: number;
    stepName: string;
    stepType: StepType;
    precondition?: PreconditionExpression;
    approverRule: ApproverRule;
    completionRule: CompletionRule;
    quorumCount?: number;
    slaHours?: number;
    escalationRule?: EscalationRule;
    allowDelegate?: boolean;
    allowRejectTo?: 'ORIGINATOR' | 'PREVIOUS_STEP' | 'SPECIFIC';
    isFinal?: boolean;
    onReject?: RejectAction;
  }>;
}
