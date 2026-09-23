/**
 * Part 07 — SoD Evaluator
 * 
 * Evaluates segregation of duties violations against the audit log.
 * Checks what a person actually did, not just what their role allows.
 */

import { SodRule, SodViolation, Permission } from './types';
import { sodService } from './sod.service';
import { permissionService } from './permission.service';

export interface AuditLogEntry {
  id: number;
  userId: number;
  projectId: number;
  action: string;
  permissionKey: string;
  entityId: string;
  entityType: string;
  timestamp: string;
}

export interface SodEvaluationResult {
  hasViolation: boolean;
  violations: SodViolation[];
  evaluatedAt: string;
}

export class SodEvaluator {
  private auditLog: AuditLogEntry[] = [];

  /**
   * Add an audit log entry
   */
  addAuditEntry(entry: AuditLogEntry): void {
    this.auditLog.push(entry);
  }

  /**
   * Evaluate SoD violations for a user on a project
   * 
   * Checks the audit log to see if the user actually performed
   * conflicting actions, not just if they have the permissions.
   */
  evaluate(userId: number, projectId: number): SodEvaluationResult {
    const violations: SodViolation[] = [];
    const evaluatedAt = new Date().toISOString();

    // Get all active SoD rules
    const rules = sodService.getActive();

    // Get user's audit log entries for this project
    const userEntries = this.auditLog.filter(
      entry => entry.userId === userId && entry.projectId === projectId
    );

    // For each rule, check if user performed both actions
    for (const rule of rules) {
      const permA = permissionService.getById(rule.permissionAId);
      const permB = permissionService.getById(rule.permissionBId);

      if (!permA || !permB) continue;

      // Check if user performed action A
      const performedA = userEntries.some(
        entry => entry.permissionKey === permA.permissionKey
      );

      // Check if user performed action B
      const performedB = userEntries.some(
        entry => entry.permissionKey === permB.permissionKey
      );

      // If user performed both, it's a violation
      if (performedA && performedB) {
        violations.push({
          rule,
          permissionA: permA,
          permissionB: permB,
          userId,
          projectId,
        });
      }
    }

    return {
      hasViolation: violations.length > 0,
      violations,
      evaluatedAt,
    };
  }

  /**
   * Check if a specific action would create an SoD violation
   * 
   * This is called before an action is performed to prevent violations.
   */
  wouldCreateViolation(
    userId: number,
    projectId: number,
    permissionKey: string
  ): { wouldViolate: boolean; violations: SodViolation[] } {
    const violations: SodViolation[] = [];
    const rules = sodService.getActive();

    // Get user's audit log entries for this project
    const userEntries = this.auditLog.filter(
      entry => entry.userId === userId && entry.projectId === projectId
    );

    const permission = permissionService.getByKey(permissionKey as any);
    if (!permission) {
      return { wouldViolate: false, violations: [] };
    }

    for (const rule of rules) {
      const permA = permissionService.getById(rule.permissionAId);
      const permB = permissionService.getById(rule.permissionBId);

      if (!permA || !permB) continue;

      // Check if this permission is part of the rule
      const isPermA = permA.permissionKey === permissionKey;
      const isPermB = permB.permissionKey === permissionKey;

      if (!isPermA && !isPermB) continue;

      // Check if user performed the other action
      const otherPerm = isPermA ? permB : permA;
      const performedOther = userEntries.some(
        entry => entry.permissionKey === otherPerm.permissionKey
      );

      if (performedOther) {
        violations.push({
          rule,
          permissionA: permA,
          permissionB: permB,
          userId,
          projectId,
        });
      }
    }

    return {
      wouldViolate: violations.length > 0,
      violations,
    };
  }

  /**
   * Get all SoD violations across all users and projects
   * 
   * Used for the nightly job that re-evaluates all assignments.
   */
  evaluateAll(): Array<{ userId: number; projectId: number; violations: SodViolation[] }> {
    const results: Array<{ userId: number; projectId: number; violations: SodViolation[] }> = [];

    // Get unique user-project combinations from audit log
    const combinations = new Map<string, { userId: number; projectId: number }>();
    for (const entry of this.auditLog) {
      const key = `${entry.userId}:${entry.projectId}`;
      if (!combinations.has(key)) {
        combinations.set(key, { userId: entry.userId, projectId: entry.projectId });
      }
    }

    // Evaluate each combination
    for (const { userId, projectId } of combinations.values()) {
      const result = this.evaluate(userId, projectId);
      if (result.hasViolation) {
        results.push({
          userId,
          projectId,
          violations: result.violations,
        });
      }
    }

    return results;
  }

  /**
   * Clear audit log (for testing)
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Get audit log entries for a user on a project
   */
  getAuditEntries(userId: number, projectId: number): AuditLogEntry[] {
    return this.auditLog.filter(
      entry => entry.userId === userId && entry.projectId === projectId
    );
  }
}

export const sodEvaluator = new SodEvaluator();
