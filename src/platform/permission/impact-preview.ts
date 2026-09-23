/**
 * Part 07 — Impact Preview Service
 * 
 * Previews the impact of assignment changes before they are applied.
 * Checks for orphaned approvals and other consequences.
 */

import { ProjectAssignment, DocumentType } from './types';
import { projectAssignmentService } from './project-assignment.service';
import { enhancedPermissionResolver } from './enhanced-resolver';

export interface ImpactPreview {
  wouldOrphanApprovals: boolean;
  orphanedApprovals: OrphanedApproval[];
  permissionChanges: PermissionChange[];
  screenCount: number;
  recordCount: number;
  warnings: string[];
}

export interface OrphanedApproval {
  documentType: DocumentType;
  pendingCount: number;
  documentIds: string[];
}

export interface PermissionChange {
  permissionKey: string;
  changeType: 'GRANTED' | 'REVOKED';
}

export class ImpactPreviewService {
  /**
   * Preview the impact of revoking or suspending an assignment
   */
  previewAssignmentRevocation(assignmentId: number): ImpactPreview {
    const assignment = projectAssignmentService.getById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const warnings: string[] = [];
    const orphanedApprovals: OrphanedApproval[] = [];

    // Check if this user is the only approver for any document type
    const assignmentDetails = projectAssignmentService.getWithDetails(assignmentId);
    if (assignmentDetails) {
      for (const authority of assignmentDetails.approvalAuthorities) {
        if (!authority.canApprove) continue;

        // Check if there are other approvers for this document type on this project
        const otherApprovers = this.findOtherApprovers(
          assignment.projectId,
          authority.documentType as DocumentType,
          assignment.userId
        );

        if (otherApprovers.length === 0) {
          // This user is the only approver
          // In production, we would count pending documents
          const pendingCount = 0; // Would query pending documents
          orphanedApprovals.push({
            documentType: authority.documentType as DocumentType,
            pendingCount,
            documentIds: [], // Would list document IDs
          });
          warnings.push(
            `This user is the only approver for ${authority.documentType}. ` +
            `${pendingCount} pending documents would become unapprovable.`
          );
        }
      }
    }

    // Calculate permission changes
    const currentPermissions = enhancedPermissionResolver.resolvePermissions(
      assignment.userId,
      assignment.projectId
    );

    const permissionChanges: PermissionChange[] = [];
    for (const permKey of currentPermissions.permissions) {
      permissionChanges.push({
        permissionKey: permKey,
        changeType: 'REVOKED',
      });
    }

    return {
      wouldOrphanApprovals: orphanedApprovals.length > 0,
      orphanedApprovals,
      permissionChanges,
      screenCount: permissionChanges.length, // Simplified
      recordCount: 0, // Would calculate based on scope
      warnings,
    };
  }

  /**
   * Preview the impact of creating a new assignment
   */
  previewAssignmentCreation(
    userId: number,
    projectId: number,
    templateId?: number
  ): ImpactPreview {
    const warnings: string[] = [];
    const permissionChanges: PermissionChange[] = [];

    // Resolve what permissions the user would get
    // This is a dry-run resolution
    const wouldHavePermissions = new Set<string>();

    // In production, this would simulate the resolution
    // For now, return empty preview
    return {
      wouldOrphanApprovals: false,
      orphanedApprovals: [],
      permissionChanges,
      screenCount: wouldHavePermissions.size,
      recordCount: 0,
      warnings,
    };
  }

  /**
   * Find other approvers for a document type on a project
   */
  private findOtherApprovers(
    projectId: number,
    documentType: DocumentType,
    excludeUserId: number
  ): number[] {
    const assignments = projectAssignmentService.getByProjectId(projectId);
    const approvers: number[] = [];

    for (const assignment of assignments) {
      if (assignment.userId === excludeUserId) continue;
      if (assignment.status !== 'ACTIVE') continue;

      const details = projectAssignmentService.getWithDetails(assignment.id);
      if (!details) continue;

      const hasAuthority = details.approvalAuthorities.some(
        auth => auth.documentType === documentType && auth.canApprove && auth.isActive
      );

      if (hasAuthority) {
        approvers.push(assignment.userId);
      }
    }

    return approvers;
  }

  /**
   * Preview the impact of modifying an assignment
   */
  previewAssignmentModification(
    assignmentId: number,
    changes: Partial<ProjectAssignment>
  ): ImpactPreview {
    const assignment = projectAssignmentService.getById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const warnings: string[] = [];
    const permissionChanges: PermissionChange[] = [];

    // Calculate what permissions would change
    const currentPermissions = enhancedPermissionResolver.resolvePermissions(
      assignment.userId,
      assignment.projectId
    );

    // In production, this would simulate the resolution with changes
    // For now, return basic preview
    return {
      wouldOrphanApprovals: false,
      orphanedApprovals: [],
      permissionChanges,
      screenCount: currentPermissions.permissions.size,
      recordCount: 0,
      warnings,
    };
  }
}

export const impactPreviewService = new ImpactPreviewService();
