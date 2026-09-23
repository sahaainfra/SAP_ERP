/**
 * Part 23 — Approval Centre Service
 * 
 * Manages the unified approval queue across all modules:
 * - Fetch and filter approval queue
 * - Get full approval detail with decision context
 * - Process decisions (approve, reject, return, forward, etc.)
 * - Bulk approval with safeguards
 * - Out-of-office management
 */

import {
  ApprovalQueueItem,
  ApprovalDetail,
  ApprovalDecision,
  BulkApprovalRequest,
  BulkApprovalResult,
  OutOfOfficeRequest,
  ApprovalGroupBy,
  ApprovalSortBy,
  QueueCounts,
} from './types';
import { workflowEngine } from '../workflow/workflow-engine';
import { Actor } from '../permission/actor';

export interface ApprovalQueueFilters {
  documentType?: string;
  projectId?: number;
  siteId?: number;
  amountRange?: { min?: number; max?: number };
  requesterId?: number;
  dateRange?: { from?: string; to?: string };
  slaState?: string;
  status?: string;
}

export class ApprovalCentreService {
  /**
   * Get approval queue for current user
   */
  async getApprovalQueue(
    actor: Actor,
    filters: ApprovalQueueFilters = {},
    groupBy: ApprovalGroupBy = 'urgency',
    sortBy: ApprovalSortBy = 'sla_state'
  ): Promise<ApprovalQueueItem[]> {
    // In production, would query dx_workflow_task with permission filtering
    // For demo, return mock data
    const queue = await this.mockFetchQueue(actor, filters);
    
    // Apply grouping
    const grouped = this.groupQueue(queue, groupBy);
    
    // Apply sorting
    const sorted = this.sortQueue(grouped, sortBy);
    
    return sorted;
  }

  /**
   * Get full approval detail with decision context
   * Rule APR-01: Centre shows full decision context server-side
   */
  async getApprovalDetail(taskId: number, actor: Actor): Promise<ApprovalDetail> {
    // In production, would:
    // 1. Load task from dx_workflow_task
    // 2. Load document with permission filtering
    // 3. Compute budget impact
    // 4. Load comparison context
    // 5. Load approval history
    // 6. Compute risk flags
    // 7. Determine allowed actions
    
    const task = await this.mockFetchTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check permission
    if (task.assigneeId !== actor.userId) {
      throw new Error('Task not assigned to current user');
    }

    // Build detail
    const detail: ApprovalDetail = {
      ...task,
      documentData: await this.loadDocumentData(task.documentType, task.documentId, actor),
      budgetImpact: await this.computeBudgetImpact(task, actor),
      comparison: await this.loadComparisonContext(task, actor),
      overridesApplied: await this.loadOverridesApplied(task),
      priorDecisions: await this.loadPriorDecisions(task.instanceId),
      attachments: await this.loadAttachments(task.documentType, task.documentId),
      allowedActions: await this.computeAllowedActions(task, actor),
      requesterNote: await this.loadRequesterNote(task),
    };

    return detail;
  }

  /**
   * Process an approval decision
   */
  async decide(
    taskId: number,
    decision: ApprovalDecision,
    actor: Actor
  ): Promise<void> {
    const task = await this.mockFetchTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check permission
    if (task.assigneeId !== actor.userId) {
      throw new Error('Task not assigned to current user');
    }

    // Validate decision type is allowed
    const allowedActions = await this.computeAllowedActions(task, actor);
    if (!allowedActions.includes(decision.type)) {
      throw new Error(`Decision type ${decision.type} not allowed for this task`);
    }

    // Rule APR-03: Authority re-validated against DB amount, not request
    if (decision.type === 'APPROVE' || decision.type === 'APPROVE_WITH_CONDITIONS') {
      const documentValue = await this.getDocumentValueFromDB(task.documentType, task.documentId);
      const authority = actor.authorityFor(task.documentType as any, task.projectId);
      
      if (!authority) {
        throw new Error('No approval authority for this document type and value');
      }
      
      if (authority.maxAmount && documentValue > authority.maxAmount) {
        throw new Error(`Document value ${documentValue} exceeds authority limit ${authority.maxAmount}`);
      }
    }

    // Validate negative decisions require comment
    if ((decision.type === 'REJECT' || decision.type === 'RETURN') && !decision.note?.trim()) {
      throw new Error(`${decision.type} requires a comment`);
    }

    // Process decision through workflow engine
    // In production, would create UowContext and call workflowEngine.decide
    // For demo, just log the decision
    console.log(`[Workflow] Decision ${decision.type} on task ${taskId} by ${actor.userId}`);

    // Audit
    console.log(`[Approval] ${decision.type} by ${actor.userId} on task ${taskId}`);
  }

  /**
   * Bulk approve multiple items
   * Rule APR-03: Maximum 20 items (5 on phones), each evaluated individually
   */
  async bulkDecide(
    request: BulkApprovalRequest,
    actor: Actor
  ): Promise<BulkApprovalResult> {
    const results: BulkApprovalResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;

    // Validate batch size
    const isMobile = (actor as any).deviceClass === 'PHONE';
    const maxBatch = isMobile ? 5 : 20;
    
    if (request.taskIds.length > maxBatch) {
      throw new Error(`Bulk approval limited to ${maxBatch} items`);
    }

    // Process each item individually
    for (const taskId of request.taskIds) {
      try {
        const task = await this.mockFetchTask(taskId);
        if (!task) {
          results.push({ taskId, status: 'EXCLUDED', reason: 'Task not found' });
          failureCount++;
          continue;
        }

        // Check authority limit
        const documentValue = await this.getDocumentValueFromDB(task.documentType, task.documentId);
        const authority = actor.authorityFor(task.documentType as any, task.projectId);
        
        if (!authority || (authority.maxAmount && documentValue > authority.maxAmount)) {
          results.push({ 
            taskId, 
            status: 'EXCLUDED', 
            reason: `Value ${documentValue} exceeds authority limit` 
          });
          failureCount++;
          continue;
        }

        // Check risk flags
        if (task.riskFlags.some(f => f.severity === 'CRITICAL')) {
          results.push({ 
            taskId, 
            status: 'EXCLUDED', 
            reason: 'Critical risk flag requires individual review' 
          });
          failureCount++;
          continue;
        }

        // Process decision
        await this.decide(taskId, request.decision, actor);
        results.push({ taskId, status: 'SUCCESS' });
        successCount++;
      } catch (error) {
        results.push({ 
          taskId, 
          status: 'FAILED', 
          reason: error instanceof Error ? error.message : 'Unknown error' 
        });
        failureCount++;
      }
    }

    // Audit bulk action
    console.log(`[Bulk Approval] ${successCount} succeeded, ${failureCount} failed by ${actor.userId}`);

    return { successCount, failureCount, results };
  }

  /**
   * Set out-of-office with substitute
   */
  async setOutOfOffice(request: OutOfOfficeRequest, actor: Actor): Promise<void> {
    // Validate substitute has required permissions
    const substituteActor = new Actor(request.substituteUserId, null);
    
    // In production, would validate substitute's authority
    // For now, just record the delegation
    console.log(`[OOO] ${actor.userId} delegated to ${request.substituteUserId} from ${request.validFrom} to ${request.validTo}`);
  }

  /**
   * Get queue counts for shell bar badges
   */
  async getQueueCounts(actor: Actor): Promise<QueueCounts> {
    // In production, would query counts from database
    // For demo, return mock counts
    return {
      approvalsPending: 14,
      approvalsOverdue: 2,
      tasksOpen: 7,
      tasksOverdue: 1,
      exceptionsOpen: 5,
      exceptionsCritical: 1,
      notificationsUnread: 12,
      notificationsCritical: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async mockFetchQueue(actor: Actor, filters: ApprovalQueueFilters): Promise<ApprovalQueueItem[]> {
    // Mock data
    const queue: ApprovalQueueItem[] = [
      {
        taskId: 1,
        instanceId: 101,
        documentType: 'PO',
        documentId: 412,
        documentNumber: 'PO-2026-000412',
        documentTitle: 'Steel Reinforcement - Acme Steel',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        siteId: 22,
        siteName: 'Reach 2',
        value: 2450000,
        currency: 'INR',
        submittedBy: 101,
        submittedByName: 'Rajesh Kumar',
        submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        slaState: 'AT_RISK',
        age: '4h',
        priority: 'HIGH',
        stepName: 'Commercial Review',
        stepNo: 2,
        totalSteps: 3,
        assigneeId: 1, // Current user
        riskFlags: [
          { code: 'BUDGET_EXCEEDED', severity: 'CRITICAL', message: 'Cost head CIV-CONC-01 at 103% of budget' },
        ],
      },
      {
        taskId: 2,
        instanceId: 102,
        documentType: 'MB',
        documentId: 88,
        documentNumber: 'MB-2026-000088',
        documentTitle: 'Foundation Work - Grid A-3',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        value: 1250000,
        currency: 'INR',
        submittedBy: 205,
        submittedByName: 'Amit Sharma',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        slaState: 'OVERDUE',
        age: '2d',
        priority: 'CRITICAL',
        stepName: 'Project Manager Certification',
        stepNo: 2,
        totalSteps: 2,
        assigneeId: 1, // Current user
        riskFlags: [
          { code: 'BOQ_EXCEEDED', severity: 'WARNING', message: 'Quantity exceeds BOQ by 12%' },
        ],
      },
      {
        taskId: 3,
        instanceId: 103,
        documentType: 'CLIENT_BILL',
        documentId: 156,
        documentNumber: 'BILL-2026-000156',
        documentTitle: 'RA Bill #15 - September 2026',
        projectId: 8,
        projectName: 'NH-48 Flyover',
        value: 8500000,
        currency: 'INR',
        submittedBy: 301,
        submittedByName: 'Priya Mehta',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        slaState: 'ON_TRACK',
        age: '1d',
        priority: 'MEDIUM',
        stepName: 'Commercial Head Approval',
        stepNo: 3,
        totalSteps: 3,
        assigneeId: 1, // Current user
        riskFlags: [],
      },
    ];

    // Apply filters
    let filtered = queue;
    
    if (filters.documentType) {
      filtered = filtered.filter(item => item.documentType === filters.documentType);
    }
    if (filters.projectId) {
      filtered = filtered.filter(item => item.projectId === filters.projectId);
    }
    if (filters.slaState) {
      filtered = filtered.filter(item => item.slaState === filters.slaState);
    }
    if (filters.amountRange?.min) {
      filtered = filtered.filter(item => item.value && item.value >= filters.amountRange!.min!);
    }
    if (filters.amountRange?.max) {
      filtered = filtered.filter(item => item.value && item.value <= filters.amountRange!.max!);
    }

    return filtered;
  }

  private async mockFetchTask(taskId: number): Promise<ApprovalQueueItem | null> {
    const queue = await this.mockFetchQueue({} as Actor, {});
    return queue.find(t => t.taskId === taskId) || null;
  }

  private groupQueue(queue: ApprovalQueueItem[], groupBy: ApprovalGroupBy): ApprovalQueueItem[] {
    // In production, would group and return structured data
    // For now, just return the queue
    return queue;
  }

  private sortQueue(queue: ApprovalQueueItem[], sortBy: ApprovalSortBy): ApprovalQueueItem[] {
    return [...queue].sort((a, b) => {
      switch (sortBy) {
        case 'sla_state':
          const slaOrder = { OVERDUE: 0, AT_RISK: 1, ON_TRACK: 2 };
          return slaOrder[a.slaState] - slaOrder[b.slaState];
        case 'value':
          return (b.value || 0) - (a.value || 0);
        case 'age':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case 'priority':
          const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        default:
          return 0;
      }
    });
  }

  private async loadDocumentData(documentType: string, documentId: number, actor: Actor): Promise<Record<string, any>> {
    // In production, would load document with permission filtering
    return { id: documentId, type: documentType };
  }

  private async computeBudgetImpact(task: ApprovalQueueItem, actor: Actor): Promise<ApprovalDetail['budgetImpact']> {
    // In production, would compute budget impact
    if (task.value && task.projectId) {
      return {
        costCode: 'CIV-CONC-01',
        budget: 50000000,
        committed: 48000000,
        actual: 1000000,
        available: 1000000,
        afterThis: 1000000 - (task.value || 0),
        status: (1000000 - (task.value || 0)) < 0 ? 'EXCEEDED' : 'WITHIN',
      };
    }
    return undefined;
  }

  private async loadComparisonContext(task: ApprovalQueueItem, actor: Actor): Promise<ApprovalDetail['comparison']> {
    // In production, would load comparison data
    return undefined;
  }

  private async loadOverridesApplied(task: ApprovalQueueItem): Promise<ApprovalDetail['overridesApplied']> {
    // In production, would load from dx_rule_override
    return [];
  }

  private async loadPriorDecisions(instanceId: number): Promise<ApprovalDetail['priorDecisions']> {
    // In production, would load from dx_workflow_log
    return [];
  }

  private async loadAttachments(documentType: string, documentId: number): Promise<ApprovalDetail['attachments']> {
    // In production, would load from document management system
    return [];
  }

  private async computeAllowedActions(task: ApprovalQueueItem, actor: Actor): Promise<ApprovalDetail['allowedActions']> {
    // In production, would check workflow configuration and actor permissions
    return ['APPROVE', 'REJECT', 'RETURN', 'REQUEST_INFO'];
  }

  private async loadRequesterNote(task: ApprovalQueueItem): Promise<string | undefined> {
    // In production, would load from document
    return undefined;
  }

  private async getDocumentValueFromDB(documentType: string, documentId: number): Promise<number> {
    // Rule: Authority validated against DB amount, not request
    // In production, would query document table
    return 2450000; // Mock value
  }
}

export const approvalCentreService = new ApprovalCentreService();
