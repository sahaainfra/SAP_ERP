/**
 * Part 23 — Task Centre Service
 * 
 * Manages the unified task queue across all modules:
 * - Fetch and filter tasks
 * - Create tasks (manual and system-generated)
 * - Complete tasks with resolution notes
 * - Reassign tasks
 * - Recurring task generation
 */

import {
  Task,
  TaskType,
  TaskStatus,
  TaskPriority,
  TaskCreateRequest,
  TaskCompletionRequest,
  TaskView,
} from './types';
import { Actor } from '../permission/actor';

export interface TaskFilters {
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  projectId?: number;
  dueDateRange?: { from?: string; to?: string };
}

export class TaskCentreService {
  private tasks: Map<number, Task> = new Map();
  private nextTaskId = 1;

  /**
   * Get task list for current user
   */
  async getTasks(
    actor: Actor,
    filters: TaskFilters = {},
    view: TaskView = 'list'
  ): Promise<Task[]> {
    // In production, would query dx_task with permission filtering
    // For demo, return mock data
    const tasks = await this.mockFetchTasks(actor, filters);
    
    // Sort by priority, then due date
    return this.sortTasks(tasks);
  }

  /**
   * Create a new task
   */
  async createTask(
    request: TaskCreateRequest,
    actor: Actor
  ): Promise<Task> {
    // Validate assignee has permission for the project
    if (request.projectId) {
      const hasAccess = actor.can('project.project.view', request.projectId);
      if (!hasAccess) {
        throw new Error('Assignee does not have access to this project');
      }
    }

    const task: Task = {
      id: this.nextTaskId++,
      type: request.type,
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: 'OPEN',
      assigneeId: request.assigneeId,
      assigneeName: await this.getUserName(request.assigneeId),
      createdBy: actor.userId,
      createdByName: await this.getUserName(actor.userId),
      projectId: request.projectId,
      projectName: request.projectId ? await this.getProjectName(request.projectId) : undefined,
      entityType: request.entityType,
      entityId: request.entityId,
      entityRoute: request.entityId ? this.getEntityRoute(request.entityType!, request.entityId) : undefined,
      createdAt: new Date().toISOString(),
      dueAt: request.dueAt,
      isRecurring: request.isRecurring || false,
      recurrenceRule: request.recurrenceRule,
      resolutionRequires: request.resolutionRequires,
      reviewerRule: request.reviewerRule,
    };

    this.tasks.set(task.id, task);

    // If recurring, schedule next occurrence
    if (task.isRecurring && task.recurrenceRule) {
      this.scheduleNextOccurrence(task);
    }

    return task;
  }

  /**
   * Complete a task with resolution
   */
  async completeTask(
    request: TaskCompletionRequest,
    actor: Actor
  ): Promise<void> {
    const task = this.tasks.get(request.taskId);
    if (!task) {
      throw new Error(`Task not found: ${request.taskId}`);
    }

    // Check permission
    if (task.assigneeId !== actor.userId && !actor.can('task.manage')) {
      throw new Error('Not authorized to complete this task');
    }

    // Validate resolution if required
    if (task.resolutionRequires) {
      const { field, minLength, pattern } = task.resolutionRequires;
      const value = request.resolution;

      if (minLength && value.length < minLength) {
        throw new Error(`Resolution must be at least ${minLength} characters`);
      }

      if (pattern && !new RegExp(pattern).test(value)) {
        throw new Error(`Resolution does not match required pattern`);
      }
    }

    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
    task.completedBy = actor.userId;

    // If recurring, create next occurrence
    if (task.isRecurring && task.recurrenceRule) {
      await this.createNextOccurrence(task, actor);
    }
  }

  /**
   * Reassign a task to another user
   * Rule: Reassignment transfers work but grants no permission
   */
  async reassignTask(
    taskId: number,
    newAssigneeId: number,
    reason: string,
    actor: Actor
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check permission
    if (task.assigneeId !== actor.userId && !actor.can('task.manage')) {
      throw new Error('Not authorized to reassign this task');
    }

    // Validate new assignee has access to the project
    if (task.projectId) {
      const newAssigneeActor = new Actor(newAssigneeId, null);
      const hasAccess = newAssigneeActor.can('project.project.view', task.projectId);
      if (!hasAccess) {
        throw new Error('New assignee does not have access to this project');
      }
    }

    const previousAssignee = task.assigneeId;
    task.assigneeId = newAssigneeId;
    task.assigneeName = await this.getUserName(newAssigneeId);

    // Audit
    console.log(`[Task] Reassigned ${taskId} from ${previousAssignee} to ${newAssigneeId} by ${actor.userId}: ${reason}`);
  }

  /**
   * Update task due date
   */
  async updateDueDate(
    taskId: number,
    newDueDate: string,
    reason: string,
    actor: Actor
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check permission
    if (task.assigneeId !== actor.userId && !actor.can('task.manage')) {
      throw new Error('Not authorized to update this task');
    }

    // Rule: Overdue due-date changes require a reason
    const isOverdue = task.dueAt && new Date(task.dueAt) < new Date();
    if (isOverdue && !reason.trim()) {
      throw new Error('Reason is required for overdue due-date changes');
    }

    task.dueAt = newDueDate;

    // Audit
    console.log(`[Task] Due date updated for ${taskId} to ${newDueDate} by ${actor.userId}: ${reason}`);
  }

  /**
   * Generate recurring tasks
   * Called by batch job framework
   */
  async generateRecurringTasks(): Promise<number> {
    let generated = 0;
    const now = new Date();

    for (const task of this.tasks.values()) {
      if (!task.isRecurring || !task.recurrenceRule) continue;
      if (task.status !== 'OPEN' && task.status !== 'IN_PROGRESS') continue;

      // Check if next occurrence is due
      if (task.nextOccurrence && new Date(task.nextOccurrence) <= now) {
        // Create new occurrence
        const newTask: Task = {
          ...task,
          id: this.nextTaskId++,
          status: 'OPEN',
          createdAt: now.toISOString(),
          dueAt: this.calculateNextDueDate(now, task.recurrenceRule),
          nextOccurrence: this.calculateNextOccurrence(task.nextOccurrence, task.recurrenceRule),
        };

        this.tasks.set(newTask.id, newTask);
        generated++;
      }
    }

    return generated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async mockFetchTasks(actor: Actor, filters: TaskFilters): Promise<Task[]> {
    // Mock data
    const tasks: Task[] = [
      {
        id: 1,
        type: 'EXCEPTION',
        title: 'Explain 15% consumption variance for item CEMENT-OPC-53',
        description: 'Actual consumption exceeds theoretical by 15%',
        priority: 'HIGH',
        status: 'OPEN',
        assigneeId: 205,
        assigneeName: 'Amit Sharma',
        createdBy: 1,
        createdByName: 'System',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        entityType: 'consumption_variance',
        entityId: 123,
        entityRoute: '/projects/7/material/consumption/123',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isRecurring: false,
        resolutionRequires: { field: 'explanation', minLength: 20 },
      },
      {
        id: 2,
        type: 'CONDITION_OF_APPROVAL',
        title: 'Submit test certificate for concrete cube',
        description: 'Approval condition: submit cube test certificate within 7 days',
        priority: 'MEDIUM',
        status: 'OPEN',
        assigneeId: 205,
        assigneeName: 'Amit Sharma',
        createdBy: 1,
        createdByName: 'Priya Mehta',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        entityType: 'mb_entry',
        entityId: 88,
        entityRoute: '/projects/7/mb/88',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dueAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        isRecurring: false,
        resolutionRequires: { field: 'certificate', minLength: 10 },
      },
      {
        id: 3,
        type: 'MANUAL',
        title: 'Review vendor performance for Q3',
        description: 'Quarterly vendor performance review',
        priority: 'LOW',
        status: 'IN_PROGRESS',
        assigneeId: 301,
        assigneeName: 'Priya Mehta',
        createdBy: 1,
        createdByName: 'Rajesh Kumar',
        projectId: 8,
        projectName: 'NH-48 Flyover',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        isRecurring: true,
        recurrenceRule: '0 0 1 */3 *', // First day of every quarter
        nextOccurrence: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        type: 'SYSTEM',
        title: 'Follow up on overdue invoice INV-2026-00156',
        description: 'Invoice overdue by 95 days',
        priority: 'HIGH',
        status: 'OPEN',
        assigneeId: 301,
        assigneeName: 'Priya Mehta',
        createdBy: 1,
        createdByName: 'System',
        projectId: 8,
        projectName: 'NH-48 Flyover',
        entityType: 'invoice',
        entityId: 156,
        entityRoute: '/billing/invoices/156',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isRecurring: false,
      },
    ];

    // Apply filters
    let filtered = tasks;
    
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }
    if (filters.assigneeId) {
      filtered = filtered.filter(t => t.assigneeId === filters.assigneeId);
    }
    if (filters.projectId) {
      filtered = filtered.filter(t => t.projectId === filters.projectId);
    }

    return filtered;
  }

  private sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // Sort by priority
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const prioA = priorityOrder[a.priority];
      const prioB = priorityOrder[b.priority];
      if (prioA !== prioB) {
        return prioA - prioB;
      }

      // Then by due date
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;

      // Then by creation date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  private async getUserName(userId: number): Promise<string> {
    // In production, would query user table
    const names: Record<number, string> = {
      1: 'System',
      101: 'Rajesh Kumar',
      205: 'Amit Sharma',
      301: 'Priya Mehta',
    };
    return names[userId] || `User ${userId}`;
  }

  private async getProjectName(projectId: number): Promise<string> {
    // In production, would query project table
    const names: Record<number, string> = {
      7: 'Metro Corridor IV',
      8: 'NH-48 Flyover',
    };
    return names[projectId] || `Project ${projectId}`;
  }

  private getEntityRoute(entityType: string, entityId: number): string {
    const routes: Record<string, string> = {
      consumption_variance: `/material/consumption/${entityId}`,
      mb_entry: `/projects/mb/${entityId}`,
      invoice: `/billing/invoices/${entityId}`,
    };
    return routes[entityType] || '/';
  }

  private scheduleNextOccurrence(task: Task): void {
    if (!task.recurrenceRule) return;
    task.nextOccurrence = this.calculateNextOccurrence(task.createdAt, task.recurrenceRule);
  }

  private async createNextOccurrence(task: Task, actor: Actor): Promise<void> {
    if (!task.recurrenceRule) return;

    const nextTask: Task = {
      ...task,
      id: this.nextTaskId++,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      dueAt: this.calculateNextDueDate(new Date(), task.recurrenceRule),
      nextOccurrence: this.calculateNextOccurrence(task.nextOccurrence || task.createdAt, task.recurrenceRule),
    };

    this.tasks.set(nextTask.id, nextTask);
  }

  private calculateNextDueDate(from: Date, recurrenceRule: string): string {
    // Simplified - in production, would parse cron expression
    const next = new Date(from);
    next.setDate(next.getDate() + 30); // Default to 30 days
    return next.toISOString();
  }

  private calculateNextOccurrence(current: string, recurrenceRule: string): string {
    // Simplified - in production, would parse cron expression
    const next = new Date(current);
    next.setDate(next.getDate() + 30); // Default to 30 days
    return next.toISOString();
  }
}

export const taskCentreService = new TaskCentreService();
