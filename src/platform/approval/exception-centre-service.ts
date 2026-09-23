/**
 * Part 23 — Exception Centre Service
 * 
 * Manages the unified exception queue across all modules:
 * - Fetch and filter exceptions
 * - Assign owners and target dates
 * - Resolve with notes
 * - Accept as known exception with expiry
 * - Trend analysis
 */

import {
  Exception,
  ExceptionCategory,
  ExceptionStatus,
  ExceptionTrend,
  QueueCounts,
} from './types';
import { situationEngine } from '../analytical/situation-engine';
import { Actor } from '../permission/actor';

export interface ExceptionFilters {
  category?: ExceptionCategory;
  status?: ExceptionStatus;
  severity?: string;
  projectId?: number;
  ownerUserId?: number;
  dateRange?: { from?: string; to?: string };
}

export class ExceptionCentreService {
  /**
   * Get exception list for current user's scope
   */
  async getExceptions(
    actor: Actor,
    filters: ExceptionFilters = {}
  ): Promise<Exception[]> {
    // In production, would query dx_situation with permission filtering
    // For demo, return mock data
    const exceptions = await this.mockFetchExceptions(actor, filters);
    
    // Sort by impact value, then severity, then age
    return this.sortExceptions(exceptions);
  }

  /**
   * Assign owner and target resolution date
   */
  async assignException(
    exceptionId: number,
    ownerUserId: number,
    targetDate: string,
    actor: Actor
  ): Promise<void> {
    // In production, would update dx_situation
    console.log(`[Exception] Assigned ${exceptionId} to user ${ownerUserId}, target ${targetDate}`);
  }

  /**
   * Resolve exception with note
   * Rule EXC-01: Closed by human with explanation, never auto-closed by time
   */
  async resolveException(
    exceptionId: number,
    resolutionNote: string,
    actor: Actor
  ): Promise<void> {
    if (!resolutionNote.trim()) {
      throw new Error('Resolution note is required');
    }

    // In production, would update dx_situation
    console.log(`[Exception] Resolved ${exceptionId} by ${actor.userId}: ${resolutionNote}`);
  }

  /**
   * Accept as known exception with justification and expiry
   */
  async acceptException(
    exceptionId: number,
    justification: string,
    expiresAt: string,
    actor: Actor
  ): Promise<void> {
    if (!justification.trim()) {
      throw new Error('Justification is required');
    }

    // In production, would update dx_situation
    console.log(`[Exception] Accepted ${exceptionId} by ${actor.userId}, expires ${expiresAt}`);
  }

  /**
   * Get exception trend (raised vs resolved over time)
   */
  async getExceptionTrend(
    actor: Actor,
    periods: number = 6
  ): Promise<ExceptionTrend[]> {
    // In production, would query historical data
    // For demo, return mock trend
    return this.mockFetchTrend(periods);
  }

  /**
   * Get queue counts for shell bar badges
   */
  async getQueueCounts(actor: Actor): Promise<QueueCounts> {
    // In production, would query counts from database
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

  private async mockFetchExceptions(
    actor: Actor,
    filters: ExceptionFilters
  ): Promise<Exception[]> {
    // Mock data representing all four exception categories
    const exceptions: Exception[] = [
      // Financial exceptions
      {
        id: 1,
        category: 'FINANCIAL',
        code: 'BUDGET_EXCEEDED',
        title: 'Budget exceeded for cost head CIV-CONC-01',
        description: 'Project Metro Corridor IV has exceeded budget by 3%',
        severity: 'CRITICAL',
        status: 'OPEN',
        impactValue: 1500000,
        impactDescription: '₹15 lakh over budget',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        raisedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        entityType: 'project',
        entityId: 7,
        entityRoute: '/projects/7',
        proposedActions: [
          { code: 'REQUEST_REVISION', label: 'Request Budget Revision', permission: 'finance.budget.revise', route: '/finance/budget/7/revise' },
          { code: 'REVIEW_EXPENSES', label: 'Review Expenses', permission: 'finance.budget.view', route: '/projects/7/costs' },
        ],
        occurrenceCount: 1,
        lastOccurredAt: new Date().toISOString(),
      },
      {
        id: 2,
        category: 'FINANCIAL',
        code: 'RECEIVABLE_90_PLUS',
        title: 'Receivable in 90+ day bucket',
        description: 'Client ABC Corp has outstanding invoice of ₹45 lakh for 95 days',
        severity: 'HIGH',
        status: 'ASSIGNED',
        impactValue: 4500000,
        impactDescription: '₹45 lakh at risk',
        projectId: 8,
        projectName: 'NH-48 Flyover',
        ownerUserId: 301,
        ownerName: 'Priya Mehta',
        raisedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        targetResolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        entityType: 'invoice',
        entityId: 156,
        entityRoute: '/billing/invoices/156',
        proposedActions: [
          { code: 'FOLLOW_UP', label: 'Send Follow-up', permission: 'billing.invoice.view', route: '/billing/invoices/156' },
          { code: 'ESCALATE', label: 'Escalate to Management', permission: 'billing.invoice.view' },
        ],
        occurrenceCount: 1,
        lastOccurredAt: new Date().toISOString(),
      },

      // Operational exceptions
      {
        id: 3,
        category: 'OPERATIONAL',
        code: 'NEGATIVE_STOCK',
        title: 'Negative stock for item STEEL-TMT-12MM',
        description: 'Store Reach 2 has -50 units of TMT 12mm steel',
        severity: 'CRITICAL',
        status: 'OPEN',
        impactDescription: 'Work front may be stalled',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        raisedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        entityType: 'stock_item',
        entityId: 4521,
        entityRoute: '/store/stock/4521',
        proposedActions: [
          { code: 'RAISE_MR', label: 'Raise Material Requisition', permission: 'procure.mr.create', route: '/procurement/mr/new' },
          { code: 'INVESTIGATE', label: 'Investigate Variance', permission: 'store.stock.view', route: '/store/stock/4521/ledger' },
        ],
        occurrenceCount: 1,
        lastOccurredAt: new Date().toISOString(),
      },
      {
        id: 4,
        category: 'OPERATIONAL',
        code: 'BOQ_QUANTITY_EXCEEDED',
        title: 'BOQ quantity exceeded without approved variation',
        description: 'Item CONC-M25 executed 12% more than BOQ quantity',
        severity: 'HIGH',
        status: 'OPEN',
        impactValue: 850000,
        impactDescription: '₹8.5 lakh unbilled',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        raisedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        entityType: 'boq_item',
        entityId: 234,
        entityRoute: '/projects/7/boq/234',
        proposedActions: [
          { code: 'RAISE_VARIATION', label: 'Raise Variation Order', permission: 'contract.variation.create', route: '/projects/7/variations/new' },
          { code: 'REVIEW_MEASUREMENT', label: 'Review Measurement', permission: 'mb.entry.view', route: '/projects/7/mb' },
        ],
        occurrenceCount: 1,
        lastOccurredAt: new Date().toISOString(),
      },

      // Compliance exceptions
      {
        id: 5,
        category: 'COMPLIANCE',
        code: 'SOD_VIOLATION',
        title: 'Segregation of duties violation detected',
        description: 'User 205 has both procure.po.create and procure.po.approve on Project 7',
        severity: 'HIGH',
        status: 'OPEN',
        impactDescription: 'Financial control weakness',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        raisedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        entityType: 'user',
        entityId: 205,
        entityRoute: '/admin/users/205',
        proposedActions: [
          { code: 'REVIEW_PERMISSIONS', label: 'Review Permissions', permission: 'admin.responsibility.configure', route: '/admin/responsibilities' },
          { code: 'GRANT_EXEMPTION', label: 'Grant Exemption', permission: 'admin.sod.exempt' },
        ],
        occurrenceCount: 1,
        lastOccurredAt: new Date().toISOString(),
      },

      // Process exceptions
      {
        id: 6,
        category: 'PROCESS',
        code: 'APPROVAL_SLA_BREACH',
        title: 'Approval pending beyond SLA',
        description: 'PO-2026-000412 pending for 48 hours (SLA: 24 hours)',
        severity: 'MEDIUM',
        status: 'OPEN',
        impactDescription: 'Delivery delayed',
        projectId: 7,
        projectName: 'Metro Corridor IV',
        raisedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        entityType: 'purchase_order',
        entityId: 412,
        entityRoute: '/procurement/po/412',
        proposedActions: [
          { code: 'ESCALATE', label: 'Escalate to Approver', permission: 'workflow.approval.view', route: '/approvals' },
          { code: 'REASSIGN', label: 'Reassign Approval', permission: 'workflow.approval.reassign' },
        ],
        occurrenceCount: 1,
        lastOccurredAt: new Date().toISOString(),
      },
    ];

    // Apply filters
    let filtered = exceptions;
    
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }
    if (filters.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }
    if (filters.projectId) {
      filtered = filtered.filter(e => e.projectId === filters.projectId);
    }
    if (filters.ownerUserId) {
      filtered = filtered.filter(e => e.ownerUserId === filters.ownerUserId);
    }

    return filtered;
  }

  private sortExceptions(exceptions: Exception[]): Exception[] {
    return [...exceptions].sort((a, b) => {
      // Sort by impact value (descending)
      const impactA = a.impactValue || 0;
      const impactB = b.impactValue || 0;
      if (impactA !== impactB) {
        return impactB - impactA;
      }

      // Then by severity
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const sevA = severityOrder[a.severity];
      const sevB = severityOrder[b.severity];
      if (sevA !== sevB) {
        return sevA - sevB;
      }

      // Then by age (oldest first)
      return new Date(a.raisedAt).getTime() - new Date(b.raisedAt).getTime();
    });
  }

  private async mockFetchTrend(periods: number): Promise<ExceptionTrend[]> {
    const trend: ExceptionTrend[] = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      trend.push({
        period: date.toISOString().substring(0, 7), // YYYY-MM
        raised: Math.floor(Math.random() * 20) + 5,
        resolved: Math.floor(Math.random() * 15) + 3,
        byCategory: {
          FINANCIAL: { raised: Math.floor(Math.random() * 5), resolved: Math.floor(Math.random() * 4) },
          OPERATIONAL: { raised: Math.floor(Math.random() * 8), resolved: Math.floor(Math.random() * 6) },
          COMPLIANCE: { raised: Math.floor(Math.random() * 3), resolved: Math.floor(Math.random() * 2) },
          PROCESS: { raised: Math.floor(Math.random() * 4), resolved: Math.floor(Math.random() * 3) },
        },
      });
    }

    return trend;
  }
}

export const exceptionCentreService = new ExceptionCentreService();
