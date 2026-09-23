/**
 * Part 06 — Permission Resolver
 * 
 * Resolves effective permissions for a user on a specific project.
 * Implements the four-layer resolution model:
 * 1. Global Role (existing system)
 * 2. Project Assignment (which projects)
 * 3. Project Responsibility (what on that project)
 * 4. Explicit Override (grant/deny specific keys)
 */

import {
  Permission,
  PermissionKey,
  ResolvedPermissions,
  EffectivePermission,
  ApprovalAuthority,
  FieldRestriction,
  SodViolation,
  SodRule,
} from './types';
import { projectAssignmentService } from './project-assignment.service';
import { permissionService } from './permission.service';

export class PermissionResolver {
  private sodRules: SodRule[] = [];

  /**
   * Resolve effective permissions for a user on a specific project
   */
  resolve(userId: number, projectId: number): ResolvedPermissions {
    const resolvedAt = new Date().toISOString();
    const permissions: EffectivePermission[] = [];
    const approvalAuthorities: ApprovalAuthority[] = [];
    const fieldRestrictions: FieldRestriction[] = [];

    // Get active assignments for this user on this project
    const assignments = projectAssignmentService.getActiveAssignments(userId)
      .filter(a => a.projectId === projectId);

    if (assignments.length === 0) {
      // No assignment = no access (deny by default)
      return {
        userId,
        projectId,
        permissions: [],
        approvalAuthorities: [],
        fieldRestrictions: [],
        sodViolations: [],
        resolvedAt,
      };
    }

    // For each assignment, resolve permissions
    for (const assignment of assignments) {
      const details = projectAssignmentService.getWithDetails(assignment.id);
      if (!details) continue;

      // Add permissions from this assignment
      for (const permission of details.permissions) {
        const existingIndex = permissions.findIndex(
          p => p.permissionKey === permission.permissionKey
        );

        // Check if this is a DENY override (isGranted = false)
        const isGranted = (permission as any).isGranted !== false;

        if (existingIndex >= 0) {
          // Permission already exists - check if this is a DENY override
          if (!isGranted) {
            // DENY always wins
            permissions[existingIndex].isGranted = false;
            permissions[existingIndex].source = 'EXPLICIT_OVERRIDE';
            permissions[existingIndex].assignmentId = assignment.id;
          }
        } else {
          // New permission
          permissions.push({
            permissionKey: permission.permissionKey,
            isGranted,
            source: 'PROJECT_ASSIGNMENT',
            assignmentId: assignment.id,
            projectId: assignment.projectId,
          });
        }
      }

      // Add approval authorities
      approvalAuthorities.push(...details.approvalAuthorities);

      // Add field restrictions
      fieldRestrictions.push(...details.fieldRestrictions);
    }

    // Check for SoD violations
    const sodViolations = this.checkSodViolations(userId, projectId, permissions);

    return {
      userId,
      projectId,
      permissions: permissions.filter(p => p.isGranted),
      approvalAuthorities,
      fieldRestrictions,
      sodViolations,
      resolvedAt,
    };
  }

  /**
   * Check if user has a specific permission on a project
   */
  hasPermission(userId: number, projectId: number, permissionKey: PermissionKey): boolean {
    const resolved = this.resolve(userId, projectId);
    return resolved.permissions.some(p => p.permissionKey === permissionKey);
  }

  /**
   * Get all projects a user has access to
   */
  getAccessibleProjects(userId: number): number[] {
    const assignments = projectAssignmentService.getActiveAssignments(userId);
    return [...new Set(assignments.map(a => a.projectId))];
  }

  /**
   * Check if user can approve a document of a specific type and amount
   */
  canApprove(
    userId: number,
    projectId: number,
    documentType: string,
    amount: number
  ): { canApprove: boolean; reason?: string } {
    const resolved = this.resolve(userId, projectId);

    // Find approval authority for this document type
    const authority = resolved.approvalAuthorities.find(
      a => a.documentType === documentType && a.isActive
    );

    if (!authority) {
      return {
        canApprove: false,
        reason: `No approval authority for ${documentType}`,
      };
    }

    if (!authority.canApprove) {
      return {
        canApprove: false,
        reason: 'Approval not allowed for this authority',
      };
    }

    if (amount < authority.minAmount) {
      return {
        canApprove: false,
        reason: `Amount ${amount} is below minimum ${authority.minAmount}`,
      };
    }

    if (authority.maxAmount !== undefined && authority.maxAmount !== null && amount > authority.maxAmount) {
      return {
        canApprove: false,
        reason: `Amount ${amount} exceeds maximum ${authority.maxAmount}`,
      };
    }

    return { canApprove: true };
  }

  /**
   * Check if a field should be visible, masked, or hidden
   */
  getFieldVisibility(
    userId: number,
    projectId: number,
    entity: string,
    fieldName: string
  ): 'VISIBLE' | 'MASKED' | 'HIDDEN' {
    const resolved = this.resolve(userId, projectId);
    const restriction = resolved.fieldRestrictions.find(
      r => r.entity === entity && r.fieldName === fieldName
    );

    return restriction?.visibility ?? 'VISIBLE';
  }

  /**
   * Mask fields in a response object based on field restrictions
   */
  maskFields<T extends Record<string, any>>(
    userId: number,
    projectId: number,
    entity: string,
    data: T
  ): T {
    const masked: any = { ...data };

    for (const key of Object.keys(masked)) {
      const visibility = this.getFieldVisibility(userId, projectId, entity, key);
      
      if (visibility === 'HIDDEN') {
        delete masked[key];
      } else if (visibility === 'MASKED') {
        if (typeof masked[key] === 'string') {
          masked[key] = '****';
        } else if (typeof masked[key] === 'number') {
          masked[key] = 0;
        } else {
          masked[key] = null;
        }
      }
    }

    return masked as T;
  }

  /**
   * Add a segregation of duties rule
   */
  addSodRule(rule: SodRule): void {
    if (rule.permissionAId === rule.permissionBId) {
      throw new Error('SoD rule cannot have the same permission on both sides');
    }
    this.sodRules.push(rule);
  }

  /**
   * Check for SoD violations
   */
  private checkSodViolations(
    userId: number,
    projectId: number,
    permissions: EffectivePermission[]
  ): SodViolation[] {
    const violations: SodViolation[] = [];
    const permissionIds = permissions
      .filter(p => p.isGranted)
      .map(p => permissionService.getByKey(p.permissionKey)?.id)
      .filter((id): id is number => id !== undefined);

    for (const rule of this.sodRules.filter(r => r.isActive)) {
      const hasA = permissionIds.includes(rule.permissionAId);
      const hasB = permissionIds.includes(rule.permissionBId);

      if (hasA && hasB) {
        const permA = permissionService.getById(rule.permissionAId);
        const permB = permissionService.getById(rule.permissionBId);

        if (permA && permB) {
          violations.push({
            rule,
            permissionA: permA,
            permissionB: permB,
            userId,
            projectId,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Get all SoD rules
   */
  getSodRules(): SodRule[] {
    return [...this.sodRules];
  }
}

export const permissionResolver = new PermissionResolver();
