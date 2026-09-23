/**
 * Part 06 — Delegation Service
 * 
 * Manages temporary delegation of approval authority.
 */

import { Delegation, DelegationStatus, DocumentType } from './types';
import { projectAssignmentService } from './project-assignment.service';

export class DelegationService {
  private delegations: Map<number, Delegation> = new Map();
  private nextId = 1;

  /**
   * Create a new delegation
   */
  create(data: {
    fromUserId: number;
    toUserId: number;
    projectId?: number;
    documentTypes?: DocumentType[];
    maxAmount?: number;
    validFrom: string;
    validTo: string;
    reason: string;
    createdBy: number;
  }): Delegation {
    // Validate users are different
    if (data.fromUserId === data.toUserId) {
      throw new Error('Cannot delegate to yourself');
    }

    // Validate dates
    const validFrom = new Date(data.validFrom);
    const validTo = new Date(data.validTo);
    if (validTo <= validFrom) {
      throw new Error('validTo must be after validFrom');
    }

    // Validate from user has assignments
    const fromAssignments = projectAssignmentService.getActiveAssignments(data.fromUserId);
    if (fromAssignments.length === 0) {
      throw new Error('Delegator has no active assignments');
    }

    // If projectId specified, validate from user has assignment on that project
    if (data.projectId) {
      const hasProject = fromAssignments.some(a => a.projectId === data.projectId);
      if (!hasProject) {
        throw new Error('Delegator does not have assignment on specified project');
      }
    }

    const delegation: Delegation = {
      id: this.nextId++,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      projectId: data.projectId,
      documentTypes: data.documentTypes,
      maxAmount: data.maxAmount,
      validFrom: data.validFrom,
      validTo: data.validTo,
      reason: data.reason,
      status: 'ACTIVE',
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
    };

    this.delegations.set(delegation.id, delegation);
    return delegation;
  }

  /**
   * Get delegation by ID
   */
  getById(id: number): Delegation | undefined {
    return this.delegations.get(id);
  }

  /**
   * Get all delegations
   */
  getAll(): Delegation[] {
    return Array.from(this.delegations.values());
  }

  /**
   * Get delegations from a user
   */
  getFromUser(userId: number): Delegation[] {
    return this.getAll().filter(d => d.fromUserId === userId);
  }

  /**
   * Get delegations to a user
   */
  getToUser(userId: number): Delegation[] {
    return this.getAll().filter(d => d.toUserId === userId);
  }

  /**
   * Get active delegations to a user at a specific time
   */
  getActiveDelegations(userId: number, at: string = new Date().toISOString()): Delegation[] {
    const checkTime = new Date(at);
    return this.getToUser(userId).filter(d => {
      if (d.status !== 'ACTIVE') return false;
      const validFrom = new Date(d.validFrom);
      const validTo = new Date(d.validTo);
      return checkTime >= validFrom && checkTime <= validTo;
    });
  }

  /**
   * Revoke a delegation
   */
  revoke(id: number, revokedBy: number): void {
    const delegation = this.delegations.get(id);
    if (!delegation) {
      throw new Error(`Delegation not found: ${id}`);
    }

    delegation.status = 'REVOKED';
    delegation.revokedBy = revokedBy;
    delegation.revokedAt = new Date().toISOString();
  }

  /**
   * Expire delegations past their validTo date
   */
  expirePastDelegations(): number {
    const now = new Date();
    let count = 0;

    for (const delegation of this.delegations.values()) {
      if (delegation.status === 'ACTIVE') {
        const validTo = new Date(delegation.validTo);
        if (now > validTo) {
          delegation.status = 'EXPIRED';
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Check if a user can approve on behalf of another user
   */
  canApproveOnBehalfOf(
    delegateUserId: number,
    delegatorUserId: number,
    projectId: number,
    documentType: DocumentType,
    amount: number,
    at: string = new Date().toISOString()
  ): { canApprove: boolean; reason?: string } {
    const delegations = this.getActiveDelegations(delegateUserId, at);

    for (const delegation of delegations) {
      // Check if delegation is from the correct user
      if (delegation.fromUserId !== delegatorUserId) continue;

      // Check if delegation covers this project
      if (delegation.projectId !== null && delegation.projectId !== projectId) continue;

      // Check if delegation covers this document type
      if (delegation.documentTypes !== null && delegation.documentTypes !== undefined && !delegation.documentTypes.includes(documentType)) continue;

      // Check amount limit
      if (delegation.maxAmount !== null && delegation.maxAmount !== undefined && amount > delegation.maxAmount) {
        return {
          canApprove: false,
          reason: `Amount ${amount} exceeds delegation limit ${delegation.maxAmount}`,
        };
      }

      return { canApprove: true };
    }

    return {
      canApprove: false,
      reason: 'No active delegation found',
    };
  }
}

export const delegationService = new DelegationService();
