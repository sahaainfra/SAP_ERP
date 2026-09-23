/**
 * Part 24 — Task Service
 * 
 * Core task management with seven sources:
 * 1. Manual - User-created tasks
 * 2. System - Event-driven tasks (TASK-01)
 * 3. Workflow - From approval returns
 * 4. Alert - From exceptions
 * 5. Chat - From messages
 * 6. Recurring - Scheduled tasks
 * 7. Checklist - From checklist items
 * 
 * Implements TASK-01 through TASK-04 business rules.
 */

import {
  Task,
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskComment,
  TaskSubscription,
  CreateTaskRequest,
  UpdateTaskRequest,
  CompleteTaskRequest,
  ReassignTaskRequest,
  TaskFilters,
  ResolutionRequirement,
  ApproverRule,
} from './types';
import { Actor } from '../permission/actor';
import { DomainEvent } from '../realtime/types';

export class TaskService {
  private tasks: Map<number, Task> = new Map();
  private comments: Map<number, TaskComment[]> = new Map();
  private subscriptions: TaskSubscription[] = [];
  private nextTaskId = 1;
  private nextCommentId = 1;
  private taskNumberSequence = 1;

  constructor() {
    // Initialize with seed subscriptions
    this.initializeSubscriptions();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK CREATION (Seven Sources)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a manual task (user-initiated)
   */
  async createManualTask(request: CreateTaskRequest, actor: Actor): Promise<Task> {
    return this.createTask({
      ...request,
      taskType: 'MANUAL',
      assignedBy: actor.userId,
    });
  }

  /**
   * TASK-01: Create system task from event subscription
   * System tasks are created by subscribers to outbox events, never by inline code
   */
  async createSystemTaskFromEvent(event: DomainEvent): Promise<Task[]> {
    const createdTasks: Task[] = [];

    // Find matching subscriptions
    const matchingSubs = this.subscriptions.filter(sub => 
      sub.eventType === event.eventType && sub.isActive
    );

    for (const sub of matchingSubs) {
      // Evaluate condition if present
      if (sub.conditionExpr) {
        const conditionMet = this.evaluateCondition(sub.conditionExpr, event.payload);
        if (!conditionMet) continue;
      }

      // Resolve assignee using ApproverRule
      const assigneeId = await this.resolveAssignee(sub.assigneeRule, event);
      if (!assigneeId) {
        console.warn(`TASK-04: Could not resolve assignee for task from event ${event.eventType}`);
        continue;
      }

      // Resolve project ID
      const projectId = sub.projectIdExpr 
        ? this.evaluateExpression(sub.projectIdExpr, event.payload)
        : event.scope?.projectId;

      // Render templates
      const title = this.renderTemplate(sub.taskTitleTemplate, event.payload);
      const description = sub.taskDescTemplate 
        ? this.renderTemplate(sub.taskDescTemplate, event.payload)
        : undefined;

      // Calculate due date
      const dueAt = sub.dueInHours 
        ? new Date(Date.now() + sub.dueInHours * 60 * 60 * 1000).toISOString()
        : undefined;

      // Create task
      const task = await this.createTask({
        title,
        description,
        taskType: 'SYSTEM',
        sourceEntity: event.entityType,
        sourceId: event.entityId,
        projectId,
        assignedTo: assigneeId,
        dueAt,
        priority: sub.priority,
        resolutionRequires: sub.resolutionRequires,
        reviewerRule: sub.reviewerRule,
      });

      createdTasks.push(task);
    }

    return createdTasks;
  }

  /**
   * Create workflow task (from approval return)
   */
  async createWorkflowTask(
    documentType: string,
    documentId: number,
    returnReason: string,
    assigneeId: number,
    projectId: number
  ): Promise<Task> {
    return this.createTask({
      title: `Correct and resubmit ${documentType} #${documentId}`,
      description: returnReason,
      taskType: 'WORKFLOW',
      sourceEntity: documentType,
      sourceId: documentId,
      projectId,
      assignedTo: assigneeId,
      priority: 'HIGH',
      resolutionRequires: { type: 'linked_document', entityType: documentType },
    });
  }

  /**
   * Create alert-derived task (from exception)
   */
  async createAlertTask(
    exceptionCode: string,
    exceptionId: number,
    title: string,
    description: string,
    assigneeId: number,
    projectId: number,
    priority: TaskPriority = 'MEDIUM'
  ): Promise<Task> {
    return this.createTask({
      title,
      description,
      taskType: 'ALERT',
      sourceEntity: 'exception',
      sourceId: exceptionId,
      projectId,
      assignedTo: assigneeId,
      priority,
      resolutionRequires: { type: 'text', minLength: 20 },
    });
  }

  /**
   * Create chat-derived task (from message)
   */
  async createChatTask(
    messageId: number,
    title: string,
    assigneeId: number,
    projectId: number
  ): Promise<Task> {
    return this.createTask({
      title,
      taskType: 'CHAT',
      sourceEntity: 'chat_message',
      sourceId: messageId,
      projectId,
      assignedTo: assigneeId,
      priority: 'MEDIUM',
    });
  }

  /**
   * Create recurring task (scheduled)
   */
  async createRecurringTask(
    title: string,
    description: string,
    recurrenceRule: string,
    assigneeId: number,
    projectId: number
  ): Promise<Task> {
    return this.createTask({
      title,
      description,
      taskType: 'RECURRING',
      projectId,
      assignedTo: assigneeId,
      priority: 'MEDIUM',
      recurrenceRule,
    });
  }

  /**
   * Create checklist task (from checklist item)
   */
  async createChecklistTask(
    checklistId: number,
    itemTitle: string,
    assigneeId: number,
    projectId: number
  ): Promise<Task> {
    return this.createTask({
      title: itemTitle,
      taskType: 'CHECKLIST',
      sourceEntity: 'checklist',
      sourceId: checklistId,
      projectId,
      assignedTo: assigneeId,
      priority: 'MEDIUM',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start a task (change status to IN_PROGRESS)
   */
  async startTask(taskId: number, actor: Actor): Promise<Task> {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    if (task.status !== 'OPEN') {
      throw new Error(`Cannot start task with status ${task.status}`);
    }

    task.status = 'IN_PROGRESS';
    task.updatedAt = new Date().toISOString();

    return task;
  }

  /**
   * Complete a task (TASK-02: Validate resolution requirement)
   */
  async completeTask(taskId: number, request: CompleteTaskRequest, actor: Actor): Promise<Task> {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new Error(`Cannot complete task with status ${task.status}`);
    }

    // TASK-02: Validate resolution requirement
    if (task.resolutionRequires) {
      this.validateResolution(task.resolutionRequires, request);
    }

    // TASK-03: Check if reviewer acceptance is required
    if (task.reviewerRule && !task.reviewerId) {
      const reviewerId = await this.resolveReviewer(task.reviewerRule, task);
      if (reviewerId) {
        task.reviewerId = reviewerId;
        // Don't complete yet - wait for reviewer acceptance
        task.status = 'IN_PROGRESS';
        task.updatedAt = new Date().toISOString();
        return task;
      }
    }

    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
    task.completedBy = actor.userId;
    task.completionNote = request.completionNote;
    task.progressPercent = 100;
    task.updatedAt = new Date().toISOString();

    return task;
  }

  /**
   * Accept task as reviewer (TASK-03)
   */
  async acceptTaskAsReviewer(taskId: number, actor: Actor): Promise<Task> {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    if (task.reviewerId !== actor.userId) {
      throw new Error('You are not the assigned reviewer for this task');
    }

    task.reviewerAcceptedAt = new Date().toISOString();
    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
    task.completedBy = task.assignedTo;
    task.progressPercent = 100;
    task.updatedAt = new Date().toISOString();

    return task;
  }

  /**
   * Block a task (reason required)
   */
  async blockTask(taskId: number, reason: string, actor: Actor): Promise<Task> {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    if (!reason || reason.trim().length === 0) {
      throw new Error('Blocked reason is required');
    }

    task.status = 'BLOCKED';
    task.blockedReason = reason;
    task.updatedAt = new Date().toISOString();

    return task;
  }

  /**
   * Reassign a task (transfers work, not permission)
   */
  async reassignTask(taskId: number, request: ReassignTaskRequest, actor: Actor): Promise<Task> {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    if (!request.reason || request.reason.trim().length === 0) {
      throw new Error('Reassignment reason is required');
    }

    const previousAssignee = task.assignedTo;
    task.assignedTo = request.newAssigneeId;
    task.assignedBy = actor.userId;
    task.assignedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    // Add comment documenting reassignment
    await this.addComment(taskId, actor.userId, 
      `Reassigned from user ${previousAssignee} to user ${request.newAssigneeId}. Reason: ${request.reason}`
    );

    return task;
  }

  /**
   * Change due date (reason required if overdue)
   */
  async changeDueDate(taskId: number, newDueDate: string, reason: string, actor: Actor): Promise<Task> {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    // Check if task is overdue
    const isOverdue = task.dueAt && new Date(task.dueAt) < new Date();
    if (isOverdue && (!reason || reason.trim().length === 0)) {
      throw new Error('Reason is required for changing due date of overdue task');
    }

    task.dueAt = newDueDate;
    task.updatedAt = new Date().toISOString();

    if (reason) {
      await this.addComment(taskId, actor.userId, `Due date changed to ${newDueDate}. Reason: ${reason}`);
    }

    return task;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: number, reason: string, actor: Actor): Promise<Task> {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    task.status = 'CANCELLED';
    task.updatedAt = new Date().toISOString();

    if (reason) {
      await this.addComment(taskId, actor.userId, `Task cancelled. Reason: ${reason}`);
    }

    return task;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a comment to a task
   */
  async addComment(taskId: number, userId: number, comment: string, mentions?: number[]): Promise<TaskComment> {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    const taskComment: TaskComment = {
      id: this.nextCommentId++,
      taskId,
      userId,
      comment,
      mentions,
      createdAt: new Date().toISOString(),
    };

    if (!this.comments.has(taskId)) {
      this.comments.set(taskId, []);
    }
    this.comments.get(taskId)!.push(taskComment);

    return taskComment;
  }

  /**
   * Get comments for a task
   */
  async getComments(taskId: number): Promise<TaskComment[]> {
    return this.comments.get(taskId) || [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get task by ID
   */
  getTask(taskId: number): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get tasks with filters
   */
  async getTasks(actor: Actor, filters: TaskFilters = {}): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());

    // Apply filters
    if (filters.taskType) {
      tasks = tasks.filter(t => t.taskType === filters.taskType);
    }
    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }
    if (filters.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === filters.assignedTo);
    }
    if (filters.projectId) {
      tasks = tasks.filter(t => t.projectId === filters.projectId);
    }
    if (filters.siteId) {
      tasks = tasks.filter(t => t.siteId === filters.siteId);
    }
    if (filters.dueDateRange) {
      tasks = tasks.filter(t => {
        if (!t.dueAt) return false;
        const dueDate = new Date(t.dueAt);
        if (filters.dueDateRange!.from && dueDate < new Date(filters.dueDateRange!.from)) return false;
        if (filters.dueDateRange!.to && dueDate > new Date(filters.dueDateRange!.to)) return false;
        return true;
      });
    }

    // Sort by priority, then due date
    tasks.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      return 0;
    });

    return tasks;
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(actor: Actor): Promise<Task[]> {
    const now = new Date();
    const tasks = await this.getTasks(actor, { status: 'OPEN' });
    return tasks.filter(t => t.dueAt && new Date(t.dueAt) < now);
  }

  /**
   * Get tasks due today
   */
  async getTasksDueToday(actor: Actor): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await this.getTasks(actor, { status: 'OPEN' });
    return tasks.filter(t => {
      if (!t.dueAt) return false;
      const dueDate = new Date(t.dueAt);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  /**
   * Get tasks due this week
   */
  async getTasksDueThisWeek(actor: Actor): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const tasks = await this.getTasks(actor, { status: 'OPEN' });
    return tasks.filter(t => {
      if (!t.dueAt) return false;
      const dueDate = new Date(t.dueAt);
      return dueDate >= today && dueDate < nextWeek;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a task (internal method)
   */
  private async createTask(request: CreateTaskRequest & { assignedBy?: number }): Promise<Task> {
    // TASK-04: Validate assignee is not blank
    if (!request.assignedTo) {
      throw new Error('TASK-04: Task must have an owner (assignedTo cannot be blank)');
    }

    const task: Task = {
      id: this.nextTaskId++,
      taskNumber: this.generateTaskNumber(),
      title: request.title,
      description: request.description,
      taskType: request.taskType,
      sourceEntity: request.sourceEntity,
      sourceId: request.sourceId,
      companyId: request.companyId,
      projectId: request.projectId,
      siteId: request.siteId,
      assignedTo: request.assignedTo,
      assignedBy: request.assignedBy,
      assignedAt: new Date().toISOString(),
      dueAt: request.dueAt,
      priority: request.priority || 'MEDIUM',
      status: 'OPEN',
      progressPercent: 0,
      parentTaskId: request.parentTaskId,
      recurrenceRule: request.recurrenceRule,
      resolutionRequires: request.resolutionRequires,
      reviewerRule: request.reviewerRule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(task.id, task);
    return task;
  }

  /**
   * Generate task number
   */
  private generateTaskNumber(): string {
    const number = this.taskNumberSequence++;
    return `TASK-${new Date().getFullYear()}-${String(number).padStart(5, '0')}`;
  }

  /**
   * Validate resolution requirement (TASK-02)
   */
  private validateResolution(requirement: ResolutionRequirement, request: CompleteTaskRequest): void {
    switch (requirement.type) {
      case 'text':
        if (!request.completionNote || request.completionNote.trim().length === 0) {
          throw new Error('Completion note is required');
        }
        if (requirement.minLength && request.completionNote.length < requirement.minLength) {
          throw new Error(`Completion note must be at least ${requirement.minLength} characters`);
        }
        if (requirement.pattern && !new RegExp(requirement.pattern).test(request.completionNote)) {
          throw new Error('Completion note does not match required pattern');
        }
        break;

      case 'attachment':
        if (!request.attachments || request.attachments.length === 0) {
          throw new Error('At least one attachment is required');
        }
        break;

      case 'linked_document':
        if (!request.linkedDocumentId) {
          throw new Error(`Linked ${requirement.entityType} document is required`);
        }
        break;

      case 'reviewer_acceptance':
        // Handled separately in completeTask
        break;
    }
  }

  /**
   * Resolve assignee from ApproverRule
   */
  private async resolveAssignee(rule: ApproverRule, event: DomainEvent): Promise<number | null> {
    switch (rule.type) {
      case 'RESPONSIBILITY':
        // In production, would query users with this responsibility template
        return 101; // Mock
      case 'SUPERVISOR_HIERARCHY':
        // In production, would walk up supervisor hierarchy
        return 102; // Mock
      case 'SPECIFIC_USERS':
        return rule.userIds[0] || null;
      case 'DOCUMENT_FIELD':
        return event.payload[rule.field] || null;
      case 'COST_CODE_OWNER':
        // In production, would look up cost code owner
        return 103; // Mock
      default:
        return null;
    }
  }

  /**
   * Resolve reviewer from ApproverRule (TASK-03)
   */
  private async resolveReviewer(rule: ApproverRule, task: Task): Promise<number | null> {
    // Similar to resolveAssignee but for reviewer
    // Create a mock event for resolution
    const mockEvent: any = {
      eventId: 'reviewer-resolution',
      eventType: 'task.reviewer.resolution',
      occurredAt: new Date().toISOString(),
      actorUserId: task.assignedTo,
      entityType: task.sourceEntity || 'task',
      entityId: task.sourceId || task.id,
      scope: { projectId: task.projectId },
      payload: { taskId: task.id, taskType: task.taskType },
      version: 1,
    };
    return this.resolveAssignee(rule, mockEvent);
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(expr: string, payload: any): boolean {
    try {
      // Simple expression evaluation (in production, would use sandboxed evaluator)
      const func = new Function('payload', `return ${expr}`);
      return func(payload);
    } catch {
      return false;
    }
  }

  /**
   * Evaluate expression to extract value
   */
  private evaluateExpression(expr: string, payload: any): any {
    try {
      const func = new Function('payload', `return ${expr}`);
      return func(payload);
    } catch {
      return null;
    }
  }

  /**
   * Render template with payload values
   */
  private renderTemplate(template: string, payload: any): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], payload);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Initialize task subscriptions (seed data)
   */
  private initializeSubscriptions(): void {
    this.subscriptions = [
      {
        id: 1,
        eventType: 'store.consumption.variance_detected',
        conditionExpr: 'payload.variancePct > 10',
        taskTitleTemplate: 'Explain {{payload.variancePct}}% consumption variance — {{payload.itemName}}',
        taskDescTemplate: 'Actual consumption of {{payload.itemName}} exceeds theoretical by {{payload.variancePct}}%.',
        assigneeRule: { type: 'RESPONSIBILITY', templateCode: 'SITE_ENGINEER' },
        priority: 'HIGH',
        dueInHours: 48,
        resolutionRequires: { type: 'text', minLength: 20 },
        projectIdExpr: 'payload.projectId',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        eventType: 'store.stock.negative',
        taskTitleTemplate: 'Investigate negative stock: {{payload.itemCode}} at Store {{payload.storeId}}',
        taskDescTemplate: 'Item {{payload.itemCode}} has negative stock of {{payload.quantity}} {{payload.uom}}.',
        assigneeRule: { type: 'RESPONSIBILITY', templateCode: 'STORE_KEEPER' },
        priority: 'CRITICAL',
        dueInHours: 24,
        resolutionRequires: { type: 'text', minLength: 10 },
        projectIdExpr: 'payload.projectId',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        eventType: 'workflow.task.overdue',
        conditionExpr: 'payload.daysOverdue > 1',
        taskTitleTemplate: 'Follow up on overdue approval: {{payload.documentType}} {{payload.documentNumber}}',
        assigneeRule: { type: 'SUPERVISOR_HIERARCHY', levelsUp: 1 },
        priority: 'HIGH',
        dueInHours: 24,
        resolutionRequires: { type: 'text', minLength: 10 },
        projectIdExpr: 'payload.projectId',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export const taskService = new TaskService();
