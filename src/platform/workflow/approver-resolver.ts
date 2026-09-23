/**
 * Part 10 — Approver Resolver
 * 
 * Resolves approver rules to concrete user lists.
 * Implements 9 approver rule types (AME-style action types).
 * Applies sanitization rules to ensure valid approver lists.
 */

import {
  ApproverRule,
  ResolvedApprover,
  DocumentContext,
  WorkflowStep,
} from './types';
import { PermissionKey } from '../permission/types';

// ═══════════════════════════════════════════════════════════════════════════
// APPROVER RESOLVER
// ═══════════════════════════════════════════════════════════════════════════

export class ApproverResolver {
  /**
   * Resolve an approver rule to a list of concrete approvers
   */
  async resolve(
    rule: ApproverRule,
    doc: DocumentContext,
    step?: WorkflowStep
  ): Promise<ResolvedApprover[]> {
    switch (rule.type) {
      case 'AUTHORITY_CHAIN':
        return this.resolveAuthorityChain(rule, doc);
      case 'PERMISSION':
        return this.resolvePermission(rule, doc);
      case 'RESPONSIBILITY':
        return this.resolveResponsibility(rule, doc);
      case 'SUPERVISOR_HIERARCHY':
        return this.resolveSupervisorHierarchy(rule, doc);
      case 'SPECIFIC_USERS':
        return this.resolveSpecificUsers(rule, doc);
      case 'APPROVAL_GROUP':
        return this.resolveApprovalGroup(rule, doc);
      case 'DOCUMENT_FIELD':
        return this.resolveDocumentField(rule, doc);
      case 'COST_CODE_OWNER':
        return this.resolveCostCodeOwner(rule, doc);
      case 'AUTO_APPROVE':
        return this.resolveAutoApprove(rule, doc);
      default:
        throw new Error(`Unknown approver rule type: ${(rule as any).type}`);
    }
  }

  /**
   * AUTHORITY_CHAIN: Walk up the approval authority chain based on document value
   * Most used rule type - reads dx_approval_authority and walks upward
   */
  private async resolveAuthorityChain(
    rule: { type: 'AUTHORITY_CHAIN'; documentType: string; startLevel: number },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    // In production, this would query dx_approval_authority
    // For demo, return mock data
    const holders = await this.getAuthorityHolders(doc.projectId, rule.documentType);
    
    // Sort by limit ascending (null/unlimited last)
    const sorted = holders.sort((a, b) => {
      if (a.maxValue === null) return 1;
      if (b.maxValue === null) return -1;
      return a.maxValue - b.maxValue;
    });

    const chain: ResolvedApprover[] = [];
    for (const h of sorted) {
      if (h.level < rule.startLevel) continue;
      
      chain.push({
        userId: h.userId,
        level: h.level,
        limit: h.maxValue ?? undefined,
      });

      // Stop when we find someone whose limit covers the document value
      if (h.maxValue === null || (doc.value && h.maxValue >= doc.value)) {
        break;
      }
    }

    if (chain.length === 0) {
      throw new Error(
        `NO_APPROVER_WITH_SUFFICIENT_AUTHORITY: ${rule.documentType} ` +
        `value ${doc.value} exceeds all configured limits in project ${doc.projectId}`
      );
    }

    return chain;
  }

  /**
   * PERMISSION: Users with a specific permission
   */
  private async resolvePermission(
    rule: { type: 'PERMISSION'; key: PermissionKey; scope: 'PROJECT' | 'COMPANY' },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    // In production, this would query users with the permission
    const users = await this.getUsersWithPermission(
      rule.key,
      rule.scope === 'PROJECT' ? doc.projectId : undefined
    );

    if (users.length === 0) {
      throw new Error(`NO_APPROVER_FOUND: No users with permission ${rule.key}`);
    }

    return users.map(u => ({ userId: u.id }));
  }

  /**
   * RESPONSIBILITY: Users with a specific responsibility template
   */
  private async resolveResponsibility(
    rule: { type: 'RESPONSIBILITY'; templateCode: string },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    // In production, this would query users with the template on this project
    const users = await this.getUsersWithResponsibility(rule.templateCode, doc.projectId);
    
    if (users.length === 0) {
      throw new Error(
        `NO_APPROVER_FOUND: No users with responsibility ${rule.templateCode} ` +
        `on project ${doc.projectId}`
      );
    }

    return users.map(u => ({ userId: u.id }));
  }

  /**
   * SUPERVISOR_HIERARCHY: Walk up the supervisor hierarchy
   */
  private async resolveSupervisorHierarchy(
    rule: { type: 'SUPERVISOR_HIERARCHY'; levelsUp: number; stopAtJobLevel?: number },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    const out: ResolvedApprover[] = [];
    let currentUserId = doc.submittedBy;

    for (let i = 0; i < rule.levelsUp; i++) {
      const supervisor = await this.getSupervisorOf(currentUserId);
      if (!supervisor) break;

      out.push({ userId: supervisor.id });

      // Stop if we've reached the job level threshold
      if (rule.stopAtJobLevel && supervisor.jobLevel >= rule.stopAtJobLevel) {
        break;
      }

      currentUserId = supervisor.id;
    }

    if (out.length === 0) {
      throw new Error(`NO_SUPERVISOR_FOUND: No supervisor hierarchy for user ${doc.submittedBy}`);
    }

    return out;
  }

  /**
   * SPECIFIC_USERS: Explicit list of user IDs
   */
  private async resolveSpecificUsers(
    rule: { type: 'SPECIFIC_USERS'; userIds: number[] },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    return rule.userIds.map(userId => ({ userId }));
  }

  /**
   * APPROVAL_GROUP: Users in an approval group
   */
  private async resolveApprovalGroup(
    rule: { type: 'APPROVAL_GROUP'; groupCode: string; mode: 'ALL' | 'ANY' | 'QUORUM' },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    // In production, this would query the approval group members
    const users = await this.getApprovalGroupMembers(rule.groupCode);
    
    if (users.length === 0) {
      throw new Error(`NO_APPROVER_FOUND: Approval group ${rule.groupCode} has no members`);
    }

    return users.map(u => ({ userId: u.id }));
  }

  /**
   * DOCUMENT_FIELD: User ID from a document field
   */
  private async resolveDocumentField(
    rule: { type: 'DOCUMENT_FIELD'; field: string },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    const userId = doc.attributes[rule.field];
    
    if (!userId) {
      throw new Error(`NO_APPROVER_FOUND: Document field ${rule.field} is not set`);
    }

    return [{ userId }];
  }

  /**
   * COST_CODE_OWNER: Owner of the cost code
   */
  private async resolveCostCodeOwner(
    rule: { type: 'COST_CODE_OWNER' },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    const costCode = doc.attributes.costCode;
    if (!costCode) {
      throw new Error('NO_APPROVER_FOUND: Document has no cost code');
    }

    const owner = await this.getCostCodeOwner(costCode, doc.projectId);
    if (!owner) {
      throw new Error(`NO_APPROVER_FOUND: No owner for cost code ${costCode}`);
    }

    return [{ userId: owner.id }];
  }

  /**
   * AUTO_APPROVE: System auto-approval (explicit, logged)
   */
  private async resolveAutoApprove(
    rule: { type: 'AUTO_APPROVE'; justification: string },
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    // SYSTEM_USER_ID would be a constant
    const SYSTEM_USER_ID = 0;
    
    return [{
      userId: SYSTEM_USER_ID,
      auto: true,
      justification: rule.justification,
    }];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SANITIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sanitize the resolved approver list
   * Applies hard rules to every resolved list
   */
  async sanitize(
    list: ResolvedApprover[],
    doc: DocumentContext,
    step: WorkflowStep
  ): Promise<ResolvedApprover[]> {
    let out = this.dedupeByUser(list);

    // 1. Remove self-approval (unless explicitly allowed)
    if (!step.allowDelegate) {
      out = out.filter(a => a.userId !== doc.submittedBy);
    }

    // 2. Remove SoD conflicts (anyone who performed conflicting action on this document)
    out = await this.removeSoDConflicts(out, doc);

    // 3. Apply substitutions (inactive users, users on leave)
    out = await this.applySubstitutions(out, doc);

    if (out.length === 0) {
      throw new Error(`NO_ELIGIBLE_APPROVER: Step "${step.stepName}" has no eligible approvers`);
    }

    return out;
  }

  /**
   * Remove duplicate users from the list
   */
  private dedupeByUser(list: ResolvedApprover[]): ResolvedApprover[] {
    const seen = new Set<number>();
    return list.filter(a => {
      if (seen.has(a.userId)) return false;
      seen.add(a.userId);
      return true;
    });
  }

  /**
   * Remove users who have SoD conflicts with this document
   */
  private async removeSoDConflicts(
    list: ResolvedApprover[],
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    // In production, this would check the audit log for conflicting actions
    // For demo, return the list unchanged
    return list;
  }

  /**
   * Apply substitutions for inactive users or users on leave
   */
  private async applySubstitutions(
    list: ResolvedApprover[],
    doc: DocumentContext
  ): Promise<ResolvedApprover[]> {
    const out: ResolvedApprover[] = [];

    for (const approver of list) {
      // Check if user is active and not on leave
      const isActive = await this.isUserActive(approver.userId);
      const substitution = await this.getActiveSubstitution(approver.userId);

      if (!isActive && substitution) {
        // User is inactive and has a substitute
        out.push({
          ...substitution,
          via: 'SUBSTITUTE',
          originalUserId: approver.userId,
        });
      } else if (!isActive) {
        // User is inactive and has no substitute - report gap
        console.warn(
          `APPROVER_GAP: User ${approver.userId} is inactive with no substitute`
        );
        // Don't add to list - this will cause NO_ELIGIBLE_APPROVER if all approvers are gaps
      } else {
        out.push(approver);
      }
    }

    return out;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOCK DATA METHODS (for demo)
  // ═══════════════════════════════════════════════════════════════════════════

  private async getAuthorityHolders(
    projectId: number | undefined,
    documentType: string
  ): Promise<Array<{ userId: number; level: number; maxValue: number | null }>> {
    // Mock data - in production would query dx_approval_authority
    return [
      { userId: 101, level: 1, maxValue: 100000 },
      { userId: 102, level: 2, maxValue: 500000 },
      { userId: 103, level: 3, maxValue: null }, // unlimited
    ];
  }

  private async getUsersWithPermission(
    permissionKey: PermissionKey,
    projectId?: number
  ): Promise<Array<{ id: number }>> {
    // Mock data
    return [{ id: 201 }, { id: 202 }];
  }

  private async getUsersWithResponsibility(
    templateCode: string,
    projectId?: number
  ): Promise<Array<{ id: number }>> {
    // Mock data
    return [{ id: 301 }];
  }

  private async getSupervisorOf(userId: number): Promise<{ id: number; jobLevel: number } | null> {
    // Mock data
    const supervisors: Record<number, { id: number; jobLevel: number }> = {
      1: { id: 2, jobLevel: 2 },
      2: { id: 3, jobLevel: 3 },
    };
    return supervisors[userId] || null;
  }

  private async getApprovalGroupMembers(groupCode: string): Promise<Array<{ id: number }>> {
    // Mock data
    return [{ id: 401 }, { id: 402 }, { id: 403 }];
  }

  private async getCostCodeOwner(
    costCode: string,
    projectId?: number
  ): Promise<{ id: number } | null> {
    // Mock data
    return { id: 501 };
  }

  private async isUserActive(userId: number): Promise<boolean> {
    // Mock data - all users active
    return true;
  }

  private async getActiveSubstitution(userId: number): Promise<ResolvedApprover | null> {
    // Mock data - no substitutions
    return null;
  }
}

export const approverResolver = new ApproverResolver();
