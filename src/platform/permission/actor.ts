/**
 * Part 07 & 08 — Actor Interface
 * 
 * The Actor represents the authenticated user with their resolved permissions.
 * Provides methods for permission checks, scope filtering, and authority validation.
 */

import { EffectivePermissionSet, AuthorityRule, DocumentType } from './types';
import { enhancedPermissionResolver } from './enhanced-resolver';

export class Actor {
  private permissionSet: EffectivePermissionSet;

  constructor(
    public readonly userId: number,
    public readonly projectId: number | null,
    public readonly isImpersonating: boolean = false,
    public readonly impersonatedBy?: number
  ) {
    this.permissionSet = enhancedPermissionResolver.resolvePermissions(userId, projectId);
  }

  /**
   * Check if actor has a specific permission
   * Supports project-scoped permissions
   */
  can(permissionKey: string, projectId?: number): boolean {
    if (this.permissionSet.isSuperAdmin) {
      return true;
    }
    return this.permissionSet.permissions.has(permissionKey);
  }

  /**
   * Assert that actor has a permission, throw if not
   */
  assertCan(permissionKey: string, projectId?: number): void {
    if (!this.can(permissionKey, projectId)) {
      throw new Error(`Permission denied: ${permissionKey}`);
    }
  }

  /**
   * Get all projects this actor has access to
   */
  projectsWith(permissionKey: string): number[] {
    // In production, this would query all projects where user has this permission
    // For now, return empty array
    return [];
  }

  /**
   * Check if actor has a global permission (not project-scoped)
   */
  hasGlobal(permissionKey: string): boolean {
    // Super admins have all permissions globally
    if (this.permissionSet.isSuperAdmin) {
      return true;
    }
    // In production, this would check if the permission is granted globally
    // For now, return false
    return false;
  }

  /**
   * Get approval authority for a document type and amount
   */
  authorityFor(documentType: DocumentType, amount: number): AuthorityRule | null {
    const authorities = this.permissionSet.approvalAuthority[documentType];
    if (!authorities) return null;

    // Find matching authority level
    for (const auth of authorities) {
      if (amount >= auth.minAmount && (auth.maxAmount === undefined || amount <= auth.maxAmount)) {
        return auth;
      }
    }

    return null;
  }

  /**
   * Check if actor can approve a document
   */
  canApprove(documentType: DocumentType, amount: number, isOwnDocument: boolean = false): boolean {
    const authority = this.authorityFor(documentType, amount);
    if (!authority) return false;
    if (!authority.canApprove) return false;
    if (isOwnDocument && !authority.canApproveOwn) return false;
    return true;
  }

  /**
   * Get data scope for this actor
   */
  get scope() {
    return {
      dataScope: this.permissionSet.dataScope,
      allowedSiteIds: this.permissionSet.allowedSiteIds,
      allowedPackageIds: this.permissionSet.allowedPackageIds,
      allowedStoreIds: this.permissionSet.allowedStoreIds,
    };
  }

  /**
   * Get field restrictions for an entity
   */
  restrictedFields(entity: string): Record<string, 'VISIBLE' | 'MASKED' | 'HIDDEN'> {
    return this.permissionSet.fieldRestrictions[entity] || {};
  }

  /**
   * Check if a field is visible
   */
  isFieldVisible(entity: string, fieldName: string): boolean {
    const restrictions = this.restrictedFields(entity);
    const visibility = restrictions[fieldName];
    return visibility === undefined || visibility === 'VISIBLE';
  }

  /**
   * Check if a field is masked
   */
  isFieldMasked(entity: string, fieldName: string): boolean {
    const restrictions = this.restrictedFields(entity);
    return restrictions[fieldName] === 'MASKED';
  }

  /**
   * Check if a field is hidden
   */
  isFieldHidden(entity: string, fieldName: string): boolean {
    const restrictions = this.restrictedFields(entity);
    return restrictions[fieldName] === 'HIDDEN';
  }

  /**
   * Get active delegations received by this actor
   */
  get activeDelegations() {
    return this.permissionSet.activeDelegationsReceived;
  }

  /**
   * Check if actor is acting on behalf of another user (delegation)
   */
  isActingOnBehalfOf(): number | null {
    // Check if any active delegation applies
    const now = new Date();
    for (const delegation of this.permissionSet.activeDelegationsReceived) {
      const validFrom = new Date(delegation.validFrom);
      const validTo = new Date(delegation.validTo);
      if (now >= validFrom && now <= validTo) {
        return delegation.fromUserId;
      }
    }
    return null;
  }

  /**
   * Get the effective permission set (for debugging/audit)
   */
  getEffectivePermissionSet(): EffectivePermissionSet {
    return this.permissionSet;
  }

  /**
   * Get permission version (for cache invalidation)
   */
  get permVersion(): string {
    return this.permissionSet.resolvedAt;
  }

  /**
   * Refresh permissions (after cache invalidation)
   */
  refresh(): void {
    this.permissionSet = enhancedPermissionResolver.resolvePermissions(this.userId, this.projectId);
  }
}

/**
 * Create an actor for the authenticated user
 */
export function createActor(
  userId: number,
  projectId: number | null,
  isImpersonating: boolean = false,
  impersonatedBy?: number
): Actor {
  return new Actor(userId, projectId, isImpersonating, impersonatedBy);
}
