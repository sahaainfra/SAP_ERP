/**
 * Part 08 — Action Policy
 * 
 * Action-level permission enforcement. Validates that an actor can perform
 * a specific action on a specific record at a specific time.
 * 
 * Checks:
 * - Permission (route-level)
 * - Authority limit (value-level)
 * - Self-approval prevention
 * - Segregation of duties
 * - Device restrictions
 * - Impersonation restrictions
 * - State transitions
 */

import { Actor } from './actor';
import { PermissionKey } from './types';
import { sodEvaluator } from './sod-evaluator';

// ─── Policy Context ───────────────────────────────────────────────────────────

export interface PolicyContext {
  documentType?: string;
  documentId?: number | string;
  projectId?: number;
  amount?: number;
  [key: string]: any;
}

// ─── Policy Result ────────────────────────────────────────────────────────────

export interface PolicyResult {
  allowed: boolean;
  reasons: string[];
}

// ─── Action Policy Interface ──────────────────────────────────────────────────

export interface ActionPolicy<TRecord> {
  action: string; // e.g., 'po.release'
  permission: PermissionKey;
  evaluate(record: TRecord, actor: Actor, ctx: PolicyContext): Promise<PolicyResult>;
}

// ─── Policy Registry ──────────────────────────────────────────────────────────

export class ActionPolicyRegistry {
  private policies: Map<string, ActionPolicy<any>> = new Map();

  /**
   * Register an action policy
   */
  register<TRecord>(policy: ActionPolicy<TRecord>): void {
    this.policies.set(policy.action, policy);
  }

  /**
   * Get a policy by action name
   */
  get(action: string): ActionPolicy<any> | undefined {
    return this.policies.get(action);
  }

  /**
   * Check if a policy exists for an action
   */
  has(action: string): boolean {
    return this.policies.has(action);
  }

  /**
   * Evaluate a policy for a record
   */
  async evaluate<TRecord>(
    action: string,
    record: TRecord,
    actor: Actor,
    ctx: PolicyContext
  ): Promise<PolicyResult> {
    const policy = this.policies.get(action);
    if (!policy) {
      // No policy registered - fail closed
      return {
        allowed: false,
        reasons: [`NO_POLICY_REGISTERED:${action}`],
      };
    }

    return policy.evaluate(record, actor, ctx);
  }

  /**
   * Get all registered policies
   */
  getAll(): ActionPolicy<any>[] {
    return Array.from(this.policies.values());
  }
}

export const actionPolicyRegistry = new ActionPolicyRegistry();

// ─── Base Action Policy ───────────────────────────────────────────────────────

/**
 * Base action policy with common checks
 */
export abstract class BaseActionPolicy<TRecord> implements ActionPolicy<TRecord> {
  abstract action: string;
  abstract permission: PermissionKey;

  async evaluate(record: TRecord, actor: Actor, ctx: PolicyContext): Promise<PolicyResult> {
    const reasons: string[] = [];

    // 1. Check permission
    if (!actor.can(this.permission, ctx.projectId)) {
      reasons.push('PERMISSION_DENIED');
    }

    // 2. Check impersonation
    if (actor.isImpersonating) {
      const restrictedActions = ['approve', 'post', 'pay', 'certify', 'restore'];
      if (restrictedActions.some(a => this.action.includes(a))) {
        reasons.push('IMPERSONATION_CANNOT_APPROVE');
      }
    }

    // 3. Apply specific policy checks
    const specificReasons = await this.evaluateSpecific(record, actor, ctx);
    reasons.push(...specificReasons);

    return {
      allowed: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Override this to add specific policy checks
   */
  protected abstract evaluateSpecific(
    record: TRecord,
    actor: Actor,
    ctx: PolicyContext
  ): Promise<string[]>;
}

// ─── Purchase Order Release Policy ────────────────────────────────────────────

export interface PurchaseOrder {
  id: number;
  projectId: number;
  totalValue: number;
  createdBy: number;
  status: string;
}

export class PoReleasePolicy extends BaseActionPolicy<PurchaseOrder> {
  action = 'po.release';
  permission = 'procure.po.release' as PermissionKey;

  protected async evaluateSpecific(
    po: PurchaseOrder,
    actor: Actor,
    ctx: PolicyContext
  ): Promise<string[]> {
    const reasons: string[] = [];

    // Check approval authority
    const authority = actor.authorityFor('PO', po.totalValue);
    if (!authority) {
      reasons.push('NO_APPROVAL_AUTHORITY');
    } else if (authority.maxAmount !== undefined && po.totalValue > authority.maxAmount) {
      reasons.push(`AUTHORITY_EXCEEDED:${authority.maxAmount}`);
    }

    // Check self-approval
    if (po.createdBy === actor.userId && !authority?.canApproveOwn) {
      reasons.push('SELF_APPROVAL_NOT_PERMITTED');
    }

    // Check segregation of duties
    const sodResult = await sodEvaluator.wouldCreateViolation(
      actor.userId,
      po.projectId,
      this.permission
    );
    if (sodResult.wouldViolate) {
      reasons.push(`SOD_CONFLICT:${sodResult.violations[0]?.rule.ruleCode}`);
    }

    // Check state
    if (po.status !== 'APPROVED') {
      reasons.push('STATE_TRANSITION_INVALID');
    }

    return reasons;
  }
}

// ─── Payment Post Policy ──────────────────────────────────────────────────────

export interface Payment {
  id: number;
  projectId: number;
  amount: number;
  createdBy: number;
  status: string;
}

export class PaymentPostPolicy extends BaseActionPolicy<Payment> {
  action = 'payment.post';
  permission = 'finance.payment.post' as PermissionKey;

  protected async evaluateSpecific(
    payment: Payment,
    actor: Actor,
    ctx: PolicyContext
  ): Promise<string[]> {
    const reasons: string[] = [];

    // Check approval authority
    const authority = actor.authorityFor('PAYMENT', payment.amount);
    if (!authority) {
      reasons.push('NO_APPROVAL_AUTHORITY');
    } else if (authority.maxAmount !== undefined && payment.amount > authority.maxAmount) {
      reasons.push(`AUTHORITY_EXCEEDED:${authority.maxAmount}`);
    }

    // Check self-approval
    if (payment.createdBy === actor.userId && !authority?.canApproveOwn) {
      reasons.push('SELF_APPROVAL_NOT_PERMITTED');
    }

    // Check segregation of duties
    const sodResult = await sodEvaluator.wouldCreateViolation(
      actor.userId,
      payment.projectId,
      this.permission
    );
    if (sodResult.wouldViolate) {
      reasons.push(`SOD_CONFLICT:${sodResult.violations[0]?.rule.ruleCode}`);
    }

    // Check state
    if (payment.status !== 'APPROVED') {
      reasons.push('STATE_TRANSITION_INVALID');
    }

    return reasons;
  }
}

// ─── Register Default Policies ────────────────────────────────────────────────

// Register standard policies
actionPolicyRegistry.register(new PoReleasePolicy());
actionPolicyRegistry.register(new PaymentPostPolicy());

// ─── Boot-Time Assertion ──────────────────────────────────────────────────────

/**
 * Assert that all state-changing actions have policies registered
 * 
 * Call this at application startup to fail fast if any action
 * is missing a policy.
 */
export function assertAllActionsHavePolicies(actions: string[]): void {
  const missing: string[] = [];

  for (const action of actions) {
    if (!actionPolicyRegistry.has(action)) {
      missing.push(action);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `The following actions are missing policy declarations:\n${missing.join('\n')}`
    );
  }
}
