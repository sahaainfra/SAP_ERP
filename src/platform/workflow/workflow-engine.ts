/**
 * Part 10 — Workflow Engine
 * 
 * Core workflow execution engine that manages:
 * - Starting workflows when documents are submitted
 * - Activating steps and assigning tasks
 * - Processing decisions (approve, reject, return, etc.)
 * - Handling escalation and SLA
 * - Maintaining immutable workflow history
 */

import {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowInstance,
  WorkflowTask,
  WorkflowLog,
  DocumentContext,
  Decision,
  DecisionType,
  WorkflowInstanceStatus,
  TaskStatus,
  WorkflowEventType,
} from './types';
import { ApproverResolver } from './approver-resolver';
import { UowContext } from '../uow/UnitOfWork';

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class WorkflowEngine {
  private definitions: Map<number, WorkflowDefinition> = new Map();
  private steps: Map<number, WorkflowStep[]> = new Map();
  private instances: Map<number, WorkflowInstance> = new Map();
  private tasks: Map<number, WorkflowTask> = new Map();
  private logs: WorkflowLog[] = [];
  private nextDefinitionId = 1;
  private nextInstanceId = 1;
  private nextTaskId = 1;
  private nextLogId = 1;

  constructor(private approverResolver: ApproverResolver) {}

  /**
   * Register a workflow definition
   */
  registerDefinition(definition: WorkflowDefinition, steps: WorkflowStep[]): void {
    this.definitions.set(definition.id, definition);
    this.steps.set(definition.id, steps.sort((a, b) => a.stepNo - b.stepNo));
  }

  /**
   * Start a workflow when a document is submitted
   * Called by the document framework on submit
   */
  async start(ctx: UowContext, doc: DocumentContext): Promise<WorkflowInstance> {
    // Find active workflow definition for this document type
    const def = await this.findActiveDefinition(doc.documentType, doc.projectId, doc.companyId);
    if (!def) {
      throw new Error(`NO_WORKFLOW_DEFINED: No active workflow for ${doc.documentType}`);
    }

    // Create workflow instance
    const instance: WorkflowInstance = {
      id: this.nextInstanceId++,
      definitionId: def.id,
      definitionVersion: def.version,
      documentType: doc.documentType,
      documentId: doc.id,
      projectId: doc.projectId,
      companyId: doc.companyId,
      documentValue: doc.value,
      currencyCode: doc.currency,
      status: 'RUNNING',
      submittedBy: doc.submittedBy,
      submittedAt: ctx.now.toISOString(),
      contextSnapshot: doc.attributes,
      contentHash: doc.contentHash,
    };

    this.instances.set(instance.id, instance);

    // Log submission
    await this.log(ctx, instance.id, 'SUBMITTED', {
      attributes: doc.attributes,
    });

    // Activate first step
    await this.activateNextStep(ctx, instance, doc, 0);

    return instance;
  }

  /**
   * Activate the next step in the workflow
   */
  private async activateNextStep(
    ctx: UowContext,
    instance: WorkflowInstance,
    doc: DocumentContext,
    afterStep: number
  ): Promise<void> {
    const steps = this.steps.get(instance.definitionId) || [];
    
    for (const step of steps.filter(s => s.stepNo > afterStep)) {
      // Check precondition
      if (step.precondition && !this.evaluatePrecondition(step.precondition, doc.attributes)) {
        await this.log(ctx, instance.id, 'STEP_SKIPPED', {
          stepNo: step.stepNo,
          reason: 'PRECONDITION_FALSE',
        });
        continue;
      }

      // Resolve approvers
      const resolvedApprovers = await this.approverResolver.resolve(step.approverRule, doc, step);
      
      // Sanitize approver list (remove self-approval, SoD conflicts, apply substitutions)
      const approvers = await this.approverResolver.sanitize(resolvedApprovers, doc, step);

      // Check if all approvers are auto-approve
      if (approvers.every(a => a.auto)) {
        await this.log(ctx, instance.id, 'AUTO_APPROVED', {
          stepNo: step.stepNo,
          justification: approvers[0].justification,
        });
        continue;
      }

      // Calculate due date based on SLA
      const dueAt = step.slaHours
        ? this.calculateDueDate(ctx.now, step.slaHours, instance.projectId).toISOString()
        : undefined;

      // Create tasks for each approver
      for (const approver of approvers) {
        const task: WorkflowTask = {
          id: this.nextTaskId++,
          instanceId: instance.id,
          stepNo: step.stepNo,
          stepName: step.stepName,
          assigneeId: approver.userId,
          assignedVia: approver.via || 'RULE',
          originalAssigneeId: approver.originalUserId,
          assignedAt: ctx.now.toISOString(),
          dueAt,
          status: 'PENDING',
          escalationLevel: 0,
          reminderCount: 0,
        };

        this.tasks.set(task.id, task);

        // Emit task assigned event
        ctx.outbox.publish({
          eventType: 'workflow.task.assigned',
          aggregateId: task.id,
          payload: {
            instanceId: instance.id,
            stepNo: step.stepNo,
            assigneeId: approver.userId,
            documentType: doc.documentType,
            documentId: doc.id,
            dueAt,
          },
          occurredAt: ctx.now,
        });
      }

      // Update instance current step
      instance.currentStep = step.stepNo;

      // Log step activation
      await this.log(ctx, instance.id, 'TASK_ASSIGNED', {
        stepNo: step.stepNo,
        assignees: approvers.map(a => a.userId),
      });

      // Stop here - this step is now pending
      return;
    }

    // No more steps - workflow is complete
    await this.complete(ctx, instance, 'APPROVED');
  }

  /**
   * Process a decision on a task
   */
  async decide(ctx: UowContext, taskId: number, decision: Decision): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`TASK_NOT_FOUND: Task ${taskId} does not exist`);
    }

    if (task.status !== 'PENDING') {
      throw new Error(`TASK_ALREADY_DECIDED: Task ${taskId} is already ${task.status}`);
    }

    if (task.assigneeId !== Number(ctx.actor.userId)) {
      throw new Error(`TASK_NOT_ASSIGNED_TO_ACTOR: Task ${taskId} is not assigned to you`);
    }

    const instance = this.instances.get(task.instanceId);
    if (!instance) {
      throw new Error(`INSTANCE_NOT_FOUND: Instance ${task.instanceId} does not exist`);
    }

    // Re-validate permissions at decision time
    // In production, this would call the permission engine
    // For demo, we skip this check

    // Check document hasn't changed since submission
    // In production, this would compare content hashes
    // For demo, we skip this check

    // Validate rejection requires a reason
    if (decision.type === 'REJECT' && !decision.note?.trim()) {
      throw new Error('REJECTION_REASON_REQUIRED: Rejection must include a reason');
    }

    // Update task
    task.status = this.decisionToTaskStatus(decision.type);
    task.decisionAt = ctx.now.toISOString();
    task.decisionNote = decision.note;
    task.decidedFromIp = (ctx.actor as any).ipAddress;
    task.decidedDevice = (ctx.actor as any).deviceClass;

    // Log decision
    await this.log(ctx, instance.id, `TASK_${decision.type}` as WorkflowEventType, {
      taskId,
      note: decision.note,
    });

    // Handle negative decisions (reject, return)
    if (decision.type !== 'APPROVE' && decision.type !== 'APPROVE_WITH_CONDITIONS') {
      await this.handleNegative(ctx, instance, task, decision);
      return;
    }

    // Check step completion rule
    const step = this.getStep(instance.definitionId, task.stepNo);
    if (!step) {
      throw new Error(`STEP_NOT_FOUND: Step ${task.stepNo} not found`);
    }

    const siblings = Array.from(this.tasks.values()).filter(
      t => t.instanceId === instance.id && t.stepNo === task.stepNo
    );

    const isComplete = this.checkStepCompletion(step.completionRule, step.quorumCount, siblings);

    if (!isComplete) {
      // Step not yet complete - wait for more decisions
      return;
    }

    // Cancel any remaining pending tasks for this step (for ANY/QUORUM)
    if (step.completionRule !== 'ALL') {
      for (const sibling of siblings) {
        if (sibling.status === 'PENDING') {
          sibling.status = 'SKIPPED';
        }
      }
    }

    // Activate next step
    const doc = await this.getDocumentContext(instance);
    await this.activateNextStep(ctx, instance, doc, task.stepNo);
  }

  /**
   * Handle negative decisions (reject, return)
   */
  private async handleNegative(
    ctx: UowContext,
    instance: WorkflowInstance,
    task: WorkflowTask,
    decision: Decision
  ): Promise<void> {
    const step = this.getStep(instance.definitionId, task.stepNo);
    if (!step) {
      throw new Error(`STEP_NOT_FOUND: Step ${task.stepNo} not found`);
    }

    if (decision.type === 'REJECT') {
      if (step.onReject === 'TERMINATE') {
        instance.status = 'TERMINATED';
        instance.completedAt = ctx.now.toISOString();
        instance.outcomeNote = decision.note;
        await this.log(ctx, instance.id, 'TERMINATED', { note: decision.note });
      } else {
        // RETURN - document goes back to draft
        instance.status = 'WITHDRAWN';
        instance.completedAt = ctx.now.toISOString();
        instance.outcomeNote = decision.note;
        await this.log(ctx, instance.id, 'WITHDRAWN', { note: decision.note });
      }
    } else if (decision.type === 'RETURN') {
      // Return for correction - document goes back to draft
      instance.status = 'WITHDRAWN';
      instance.completedAt = ctx.now.toISOString();
      instance.outcomeNote = decision.note;
      await this.log(ctx, instance.id, 'WITHDRAWN', {
        note: decision.note,
        targetFields: decision.targetFields,
      });
    }
  }

  /**
   * Complete the workflow
   */
  private async complete(
    ctx: UowContext,
    instance: WorkflowInstance,
    status: WorkflowInstanceStatus
  ): Promise<void> {
    instance.status = status;
    instance.completedAt = ctx.now.toISOString();
    await this.log(ctx, instance.id, 'COMPLETED', { status });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async findActiveDefinition(
    documentType: string,
    projectId?: number,
    companyId?: number
  ): Promise<WorkflowDefinition | null> {
    // In production, this would query the database
    // For demo, return the first matching definition
    for (const def of this.definitions.values()) {
      if (def.documentType === documentType && def.isActive) {
        if (def.scopeType === 'GLOBAL') return def;
        if (def.scopeType === 'PROJECT' && def.scopeId === projectId) return def;
        if (def.scopeType === 'COMPANY' && def.scopeId === companyId) return def;
      }
    }
    return null;
  }

  private getStep(definitionId: number, stepNo: number): WorkflowStep | null {
    const steps = this.steps.get(definitionId) || [];
    return steps.find(s => s.stepNo === stepNo) || null;
  }

  private evaluatePrecondition(
    precondition: any,
    attributes: Record<string, any>
  ): boolean {
    // Simplified precondition evaluation
    // In production, this would be a full expression evaluator
    if (precondition.op === 'eq') {
      return attributes[precondition.field] === precondition.value;
    }
    if (precondition.op === 'gte') {
      return attributes[precondition.field] >= precondition.value;
    }
    if (precondition.op === 'or') {
      return precondition.children.some((c: any) => this.evaluatePrecondition(c, attributes));
    }
    return true;
  }

  private calculateDueDate(from: Date, slaHours: number, projectId?: number): Date {
    // Simplified SLA calculation
    // In production, this would use the SlaService with working calendars
    const due = new Date(from);
    due.setHours(due.getHours() + slaHours);
    return due;
  }

  private async getDocumentContext(instance: WorkflowInstance): Promise<DocumentContext> {
    // In production, this would load the document
    // For demo, return a mock context
    return {
      documentType: instance.documentType,
      id: instance.documentId,
      projectId: instance.projectId,
      companyId: instance.companyId,
      value: instance.documentValue,
      currency: instance.currencyCode,
      submittedBy: instance.submittedBy,
      attributes: instance.contextSnapshot,
      contentHash: instance.contentHash,
    };
  }

  private checkStepCompletion(
    completionRule: 'ALL' | 'ANY' | 'QUORUM',
    quorumCount: number | undefined,
    tasks: WorkflowTask[]
  ): boolean {
    const approved = tasks.filter(t => t.status === 'APPROVED').length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;

    switch (completionRule) {
      case 'ALL':
        return pending === 0;
      case 'ANY':
        return approved > 0;
      case 'QUORUM':
        return approved >= (quorumCount || 1);
      default:
        return false;
    }
  }

  private decisionToTaskStatus(decision: DecisionType): TaskStatus {
    switch (decision) {
      case 'APPROVE':
      case 'APPROVE_WITH_CONDITIONS':
        return 'APPROVED';
      case 'REJECT':
        return 'REJECTED';
      case 'RETURN':
        return 'RETURNED';
      default:
        return 'PENDING';
    }
  }

  private async log(
    ctx: UowContext,
    instanceId: number,
    eventType: WorkflowEventType,
    payload?: Record<string, any>
  ): Promise<void> {
    const log: WorkflowLog = {
      id: this.nextLogId++,
      instanceId,
      eventType,
      actorId: Number(ctx.actor.userId),
      payload,
      loggedAt: ctx.now.toISOString(),
      rowHash: '', // In production, this would be a hash
    };

    this.logs.push(log);

    // Audit
    ctx.audit.record({
      entity: 'workflow_log',
      entityId: log.id,
      action: 'CREATE',
      after: { instanceId, eventType, payload },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  getInstance(id: number): WorkflowInstance | undefined {
    return this.instances.get(id);
  }

  getTask(id: number): WorkflowTask | undefined {
    return this.tasks.get(id);
  }

  getTasksForUser(userId: number, status?: TaskStatus): WorkflowTask[] {
    return Array.from(this.tasks.values()).filter(t => {
      if (t.assigneeId !== userId) return false;
      if (status && t.status !== status) return false;
      return true;
    });
  }

  getLogsForInstance(instanceId: number): WorkflowLog[] {
    return this.logs.filter(l => l.instanceId === instanceId);
  }
}

// Create singleton instance
export const workflowEngine = new WorkflowEngine(new ApproverResolver());
