/**
 * Part 06 — Segregation of Duties Service
 * 
 * Manages SoD rules and checks for violations.
 */

import { SodRule, SodSeverity, SodViolation, Permission } from './types';
import { permissionService } from './permission.service';
import { permissionResolver } from './permission-resolver';

export class SodService {
  private rules: Map<number, SodRule> = new Map();
  private nextId = 1;

  /**
   * Create a new SoD rule
   */
  create(data: {
    ruleCode: string;
    ruleName: string;
    permissionAKey: string;
    permissionBKey: string;
    severity: SodSeverity;
    rationale: string;
  }): SodRule {
    const permA = permissionService.getByKey(data.permissionAKey as any);
    const permB = permissionService.getByKey(data.permissionBKey as any);

    if (!permA) {
      throw new Error(`Permission not found: ${data.permissionAKey}`);
    }
    if (!permB) {
      throw new Error(`Permission not found: ${data.permissionBKey}`);
    }
    if (permA.id === permB.id) {
      throw new Error('SoD rule cannot have the same permission on both sides');
    }

    const rule: SodRule = {
      id: this.nextId++,
      ruleCode: data.ruleCode,
      ruleName: data.ruleName,
      permissionAId: permA.id,
      permissionBId: permB.id,
      severity: data.severity,
      rationale: data.rationale,
      isActive: true,
    };

    this.rules.set(rule.id, rule);
    permissionResolver.addSodRule(rule);

    return rule;
  }

  /**
   * Get rule by ID
   */
  getById(id: number): SodRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get rule by code
   */
  getByCode(code: string): SodRule | undefined {
    return Array.from(this.rules.values()).find(r => r.ruleCode === code);
  }

  /**
   * Get all rules
   */
  getAll(): SodRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get active rules
   */
  getActive(): SodRule[] {
    return this.getAll().filter(r => r.isActive);
  }

  /**
   * Deactivate a rule
   */
  deactivate(id: number): void {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error(`Rule not found: ${id}`);
    }
    rule.isActive = false;
  }

  /**
   * Activate a rule
   */
  activate(id: number): void {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error(`Rule not found: ${id}`);
    }
    rule.isActive = true;
  }

  /**
   * Check for SoD violations for a user on a project
   */
  checkViolations(userId: number, projectId: number): SodViolation[] {
    const resolved = permissionResolver.resolve(userId, projectId);
    return resolved.sodViolations;
  }

  /**
   * Check if a specific action would cause an SoD violation
   */
  wouldCauseViolation(
    userId: number,
    projectId: number,
    permissionKey: string
  ): { wouldViolate: boolean; violations: SodViolation[] } {
    // Temporarily add the permission and check
    const resolved = permissionResolver.resolve(userId, projectId);
    
    // Check if adding this permission would violate any rules
    const permission = permissionService.getByKey(permissionKey as any);
    if (!permission) {
      return { wouldViolate: false, violations: [] };
    }

    const violations: SodViolation[] = [];
    const currentPermissionIds = resolved.permissions.map(p => 
      permissionService.getByKey(p.permissionKey)?.id
    ).filter((id): id is number => id !== undefined);

    for (const rule of this.getActive()) {
      const hasA = currentPermissionIds.includes(rule.permissionAId) || permission.id === rule.permissionAId;
      const hasB = currentPermissionIds.includes(rule.permissionBId) || permission.id === rule.permissionBId;

      if (hasA && hasB && !(currentPermissionIds.includes(rule.permissionAId) && currentPermissionIds.includes(rule.permissionBId))) {
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

    return {
      wouldViolate: violations.length > 0,
      violations,
    };
  }

  /**
   * Seed common SoD rules
   */
  seedCommonRules(): void {
    const rules = [
      {
        ruleCode: 'PO_CREATE_APPROVE',
        ruleName: 'Cannot create and approve purchase orders',
        permissionAKey: 'procure.po.create',
        permissionBKey: 'procure.po.approve',
        severity: 'BLOCK' as SodSeverity,
        rationale: 'Prevents self-approval of purchase orders',
      },
      {
        ruleCode: 'VENDOR_CREATE_APPROVE',
        ruleName: 'Cannot create and approve vendors',
        permissionAKey: 'master.vendor.create',
        permissionBKey: 'master.vendor.approve',
        severity: 'BLOCK' as SodSeverity,
        rationale: 'Prevents self-approval of vendor master data',
      },
      {
        ruleCode: 'PAYMENT_CREATE_POST',
        ruleName: 'Cannot create and post payments',
        permissionAKey: 'finance.payment.create',
        permissionBKey: 'finance.payment.post',
        severity: 'BLOCK' as SodSeverity,
        rationale: 'Prevents self-posting of payments',
      },
      {
        ruleCode: 'BILL_CREATE_CERTIFY',
        ruleName: 'Cannot create and certify bills',
        permissionAKey: 'bill.client.create',
        permissionBKey: 'bill.client.certify',
        severity: 'BLOCK' as SodSeverity,
        rationale: 'Prevents self-certification of client bills',
      },
      {
        ruleCode: 'GRN_CREATE_APPROVE',
        ruleName: 'Cannot create and approve GRN',
        permissionAKey: 'store.grn.create',
        permissionBKey: 'store.grn.approve',
        severity: 'WARNING' as SodSeverity,
        rationale: 'Warning for self-approval of goods receipt',
      },
    ];

    for (const ruleData of rules) {
      try {
        this.create(ruleData);
      } catch (error) {
        // Rule may already exist or permissions may not be registered yet
        console.warn(`Could not seed SoD rule ${ruleData.ruleCode}:`, error);
      }
    }
  }
}

export const sodService = new SodService();
