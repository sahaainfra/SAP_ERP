/**
 * Part 06 — Project Assignment Service
 * 
 * Manages user-project assignments with responsibility templates,
 * approval authorities, scopes, and field restrictions.
 */

import {
  ProjectAssignment,
  ProjectAssignmentWithDetails,
  AssignmentPermission,
  ApprovalAuthority,
  AssignmentScope,
  FieldRestriction,
  AssignmentAudit,
  DataScope,
  AssignmentStatus,
  DocumentType,
  ScopeType,
  FieldVisibility,
  AssignmentAction,
} from './types';
import { responsibilityTemplateService } from './responsibility-template.service';
import { permissionService } from './permission.service';

export class ProjectAssignmentService {
  private assignments: Map<number, ProjectAssignment> = new Map();
  private assignmentPermissions: Map<number, AssignmentPermission[]> = new Map();
  private approvalAuthorities: Map<number, ApprovalAuthority[]> = new Map();
  private assignmentScopes: Map<number, AssignmentScope[]> = new Map();
  private fieldRestrictions: Map<number, FieldRestriction[]> = new Map();
  private auditLog: AssignmentAudit[] = [];
  private nextId = 1;
  private nextSubId = 1;

  /**
   * Create a new project assignment
   */
  assign(data: {
    userId: number;
    projectId: number;
    companyId: number;
    templateId?: number;
    designationLabel?: string;
    isPrimaryProject?: boolean;
    reportsToUserId?: number;
    dataScope?: DataScope;
    validFrom: string;
    validTo?: string;
    assignedBy: number;
    notes?: string;
  }): ProjectAssignment {
    // Validate template exists if provided
    if (data.templateId) {
      const template = responsibilityTemplateService.getById(data.templateId);
      if (!template) {
        throw new Error(`Template not found: ${data.templateId}`);
      }
      if (!template.isActive) {
        throw new Error(`Template is not active: ${data.templateId}`);
      }
    }

    // Validate dates
    const validFrom = new Date(data.validFrom);
    const validTo = data.validTo ? new Date(data.validTo) : null;
    if (validTo && validTo <= validFrom) {
      throw new Error('validTo must be after validFrom');
    }

    const assignment: ProjectAssignment = {
      id: this.nextId++,
      userId: data.userId,
      projectId: data.projectId,
      companyId: data.companyId,
      templateId: data.templateId,
      designationLabel: data.designationLabel,
      isPrimaryProject: data.isPrimaryProject ?? false,
      reportsToUserId: data.reportsToUserId,
      dataScope: data.dataScope ?? 'PROJECT',
      validFrom: data.validFrom,
      validTo: data.validTo,
      status: 'ACTIVE',
      assignedBy: data.assignedBy,
      assignedAt: new Date().toISOString(),
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    this.assignments.set(assignment.id, assignment);
    this.assignmentPermissions.set(assignment.id, []);
    this.approvalAuthorities.set(assignment.id, []);
    this.assignmentScopes.set(assignment.id, []);
    this.fieldRestrictions.set(assignment.id, []);

    // Audit
    this.recordAudit({
      assignmentId: assignment.id,
      userId: assignment.userId,
      projectId: assignment.projectId,
      action: 'ASSIGNED',
      afterValue: assignment,
      changedBy: data.assignedBy,
    });

    return assignment;
  }

  /**
   * Get assignment by ID
   */
  getById(id: number): ProjectAssignment | undefined {
    return this.assignments.get(id);
  }

  /**
   * Get assignment with full details
   */
  getWithDetails(id: number): ProjectAssignmentWithDetails | undefined {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;

    const template = assignment.templateId 
      ? responsibilityTemplateService.getById(assignment.templateId)
      : undefined;

    const permissions = this.getEffectivePermissions(id);
    const approvalAuthorities = this.approvalAuthorities.get(id) || [];
    const scopes = this.assignmentScopes.get(id) || [];
    const fieldRestrictions = this.fieldRestrictions.get(id) || [];

    return {
      ...assignment,
      template,
      permissions,
      approvalAuthorities,
      scopes,
      fieldRestrictions,
    };
  }

  /**
   * Get all assignments for a user
   */
  getByUserId(userId: number): ProjectAssignment[] {
    return Array.from(this.assignments.values())
      .filter(a => a.userId === userId);
  }

  /**
   * Get all assignments for a project
   */
  getByProjectId(projectId: number): ProjectAssignment[] {
    return Array.from(this.assignments.values())
      .filter(a => a.projectId === projectId);
  }

  /**
   * Get active assignments for user on a specific date
   */
  getActiveAssignments(userId: number, date: string = new Date().toISOString().split('T')[0]): ProjectAssignment[] {
    return this.getByUserId(userId).filter(a => {
      if (a.status !== 'ACTIVE') return false;
      const validFrom = new Date(a.validFrom);
      const validTo = a.validTo ? new Date(a.validTo) : null;
      const checkDate = new Date(date);
      
      return checkDate >= validFrom && (!validTo || checkDate <= validTo);
    });
  }

  /**
   * Get effective permissions for an assignment
   */
  getEffectivePermissions(assignmentId: number): any[] {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return [];

    const permissions: any[] = [];

    // Start with template permissions
    if (assignment.templateId) {
      const template = responsibilityTemplateService.getWithPermissions(assignment.templateId);
      if (template) {
        for (const tp of template.permissions) {
          if (tp.isGranted) {
            permissions.push({
              ...tp.permission,
              source: 'TEMPLATE',
              isGranted: true,
            });
          }
        }
      }
    }

    // Apply overrides
    const overrides = this.assignmentPermissions.get(assignmentId) || [];
    for (const override of overrides) {
      const permission = permissionService.getById(override.permissionId);
      if (!permission) continue;

      const existingIndex = permissions.findIndex(p => p.id === permission.id);
      
      if (override.isGranted) {
        // Explicit grant
        if (existingIndex >= 0) {
          permissions[existingIndex].source = 'OVERRIDE';
        } else {
          permissions.push({ ...permission, source: 'OVERRIDE', isGranted: true });
        }
      } else {
        // Explicit DENY - always wins
        if (existingIndex >= 0) {
          permissions[existingIndex].isGranted = false;
          permissions[existingIndex].source = 'OVERRIDE';
        } else {
          permissions.push({ ...permission, source: 'OVERRIDE', isGranted: false });
        }
      }
    }

    return permissions.filter(p => p.isGranted);
  }

  /**
   * Add permission override to assignment
   */
  addPermissionOverride(
    assignmentId: number,
    permissionId: number,
    isGranted: boolean,
    grantedBy: number,
    reason?: string
  ): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const permission = permissionService.getById(permissionId);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionId}`);
    }

    const overrides = this.assignmentPermissions.get(assignmentId) || [];
    const existing = overrides.find(o => o.permissionId === permissionId);

    if (existing) {
      existing.isGranted = isGranted;
      existing.grantedBy = grantedBy;
      existing.grantedAt = new Date().toISOString();
      existing.reason = reason;
    } else {
      overrides.push({
        id: this.nextSubId++,
        assignmentId,
        permissionId,
        isGranted,
        source: 'OVERRIDE',
        grantedBy,
        grantedAt: new Date().toISOString(),
        reason,
      });
      this.assignmentPermissions.set(assignmentId, overrides);
    }

    // Audit
    this.recordAudit({
      assignmentId,
      userId: assignment.userId,
      projectId: assignment.projectId,
      action: 'MODIFIED',
      beforeValue: { permissions: overrides },
      afterValue: { permissions: overrides },
      changedBy: grantedBy,
      reason,
    });
  }

  /**
   * Add approval authority to assignment
   */
  addApprovalAuthority(data: {
    assignmentId: number;
    documentType: DocumentType;
    approvalLevel: number;
    minAmount: number;
    maxAmount?: number;
    currency?: string;
    canApprove?: boolean;
    canReject?: boolean;
    canReturn?: boolean;
    canForward?: boolean;
    canDelegate?: boolean;
    canApproveOwn?: boolean;
    requiresTwoPerson?: boolean;
    slaHours?: number;
  }): ApprovalAuthority {
    const assignment = this.assignments.get(data.assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${data.assignmentId}`);
    }

    const authorities = this.approvalAuthorities.get(data.assignmentId) || [];
    
    // Check for duplicate
    const existing = authorities.find(a => 
      a.documentType === data.documentType && 
      a.approvalLevel === data.approvalLevel
    );
    if (existing) {
      throw new Error(`Approval authority already exists for ${data.documentType} level ${data.approvalLevel}`);
    }

    const authority: ApprovalAuthority = {
      id: this.nextSubId++,
      assignmentId: data.assignmentId,
      documentType: data.documentType,
      approvalLevel: data.approvalLevel,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      currency: data.currency ?? 'INR',
      canApprove: data.canApprove ?? true,
      canReject: data.canReject ?? true,
      canReturn: data.canReturn ?? true,
      canForward: data.canForward ?? false,
      canDelegate: data.canDelegate ?? false,
      canApproveOwn: data.canApproveOwn ?? false,
      requiresTwoPerson: data.requiresTwoPerson ?? false,
      slaHours: data.slaHours,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    authorities.push(authority);
    this.approvalAuthorities.set(data.assignmentId, authorities);

    return authority;
  }

  /**
   * Add scope restriction to assignment
   */
  addScope(assignmentId: number, scopeType: ScopeType, scopeId: number, isIncluded: boolean = true): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const scopes = this.assignmentScopes.get(assignmentId) || [];
    const existing = scopes.find(s => s.scopeType === scopeType && s.scopeId === scopeId);

    if (existing) {
      existing.isIncluded = isIncluded;
    } else {
      scopes.push({
        id: this.nextSubId++,
        assignmentId,
        scopeType,
        scopeId,
        isIncluded,
      });
      this.assignmentScopes.set(assignmentId, scopes);
    }
  }

  /**
   * Add field restriction to assignment
   */
  addFieldRestriction(assignmentId: number, entity: string, fieldName: string, visibility: FieldVisibility): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const restrictions = this.fieldRestrictions.get(assignmentId) || [];
    const existing = restrictions.find(r => r.entity === entity && r.fieldName === fieldName);

    if (existing) {
      existing.visibility = visibility;
    } else {
      restrictions.push({
        id: this.nextSubId++,
        assignmentId,
        entity,
        fieldName,
        visibility,
      });
      this.fieldRestrictions.set(assignmentId, restrictions);
    }
  }

  /**
   * Suspend assignment
   */
  suspend(assignmentId: number, reason: string, changedBy: number): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const before = { ...assignment };
    assignment.status = 'SUSPENDED';
    assignment.suspensionReason = reason;
    assignment.updatedAt = new Date().toISOString();

    this.recordAudit({
      assignmentId,
      userId: assignment.userId,
      projectId: assignment.projectId,
      action: 'SUSPENDED',
      beforeValue: before,
      afterValue: assignment,
      changedBy,
      reason,
    });
  }

  /**
   * Reactivate assignment
   */
  reactivate(assignmentId: number, changedBy: number, reason?: string): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const before = { ...assignment };
    assignment.status = 'ACTIVE';
    assignment.suspensionReason = undefined;
    assignment.updatedAt = new Date().toISOString();

    this.recordAudit({
      assignmentId,
      userId: assignment.userId,
      projectId: assignment.projectId,
      action: 'REACTIVATED',
      beforeValue: before,
      afterValue: assignment,
      changedBy,
      reason,
    });
  }

  /**
   * Revoke assignment
   */
  revoke(assignmentId: number, revokedBy: number, reason: string): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const before = { ...assignment };
    assignment.status = 'REVOKED';
    assignment.revokedBy = revokedBy;
    assignment.revokedAt = new Date().toISOString();
    assignment.revocationReason = reason;
    assignment.updatedAt = new Date().toISOString();

    this.recordAudit({
      assignmentId,
      userId: assignment.userId,
      projectId: assignment.projectId,
      action: 'REVOKED',
      beforeValue: before,
      afterValue: assignment,
      changedBy: revokedBy,
      reason,
    });
  }

  /**
   * Record audit entry
   */
  private recordAudit(data: {
    assignmentId?: number;
    userId: number;
    projectId: number;
    action: AssignmentAction;
    beforeValue?: any;
    afterValue?: any;
    changedBy: number;
    reason?: string;
  }): void {
    this.auditLog.push({
      id: this.nextSubId++,
      assignmentId: data.assignmentId,
      userId: data.userId,
      projectId: data.projectId,
      action: data.action,
      beforeValue: data.beforeValue,
      afterValue: data.afterValue,
      changedBy: data.changedBy,
      changedAt: new Date().toISOString(),
      reason: data.reason,
    });
  }

  /**
   * Get audit log for assignment
   */
  getAuditLog(assignmentId?: number, userId?: number, projectId?: number): AssignmentAudit[] {
    return this.auditLog.filter(a => {
      if (assignmentId && a.assignmentId !== assignmentId) return false;
      if (userId && a.userId !== userId) return false;
      if (projectId && a.projectId !== projectId) return false;
      return true;
    });
  }
}

export const projectAssignmentService = new ProjectAssignmentService();
