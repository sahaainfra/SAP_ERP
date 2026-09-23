/**
 * Part 05 — Validation Framework
 * 
 * Three-tier validation:
 * 1. Shape validation (types, required, ranges) — returns 400
 * 2. Reference validation (FK existence, scope) — returns 422
 * 3. Business rule validation — returns 422
 * 
 * All failures are returned at once, never one at a time.
 * Every document exposes POST .../validate for dry-run validation.
 */

import { ApiIssue } from './envelope';
import { ValidationError } from '../errors/catalogue';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Severity = 'BLOCK' | 'WARN' | 'INFO';

export interface RuleResult {
  passed: boolean;
  code: string;
  message: string;
  target?: string;
  context?: Record<string, unknown>;
  overridable?: {
    permission: string;
    requiresReason: boolean;
  };
}

export interface BusinessRule<TContext> {
  code: string;
  severity: Severity;
  appliesWhen?(context: TContext): boolean | Promise<boolean>;
  evaluate(context: TContext): Promise<RuleResult> | RuleResult;
}

export interface Override {
  code: string;
  reason: string;
}

export interface RuleReport {
  issues: ApiIssue[];
  blocked: boolean;
}

export interface Actor {
  userId: string;
  can(permission: string): boolean;
}

// ─── Rule Engine ──────────────────────────────────────────────────────────────

/**
 * RuleEngine — executes business rules and collects all issues
 * 
 * Usage:
 * ```typescript
 * const engine = new RuleEngine([
 *   new BudgetCheckRule(),
 *   new VendorComplianceRule(),
 * ]);
 * 
 * const report = await engine.run(context, { actor, overrides });
 * if (report.blocked) {
 *   throw new ValidationError(report.issues);
 * }
 * ```
 */
export class RuleEngine<TContext> {
  constructor(private rules: BusinessRule<TContext>[]) {}

  /**
   * Run all rules and collect issues
   */
  async run(
    context: TContext,
    options: {
      actor: Actor;
      overrides?: Override[];
    }
  ): Promise<RuleReport> {
    const issues: ApiIssue[] = [];

    for (const rule of this.rules) {
      // Check if rule applies
      if (rule.appliesWhen) {
        const applies = await rule.appliesWhen(context);
        if (!applies) continue;
      }

      // Evaluate rule
      const result = await rule.evaluate(context);

      if (result.passed) continue;

      // Check for override
      const override = options.overrides?.find((o) => o.code === result.code);

      if (result.overridable && override) {
        // Check if actor has permission to override
        if (!options.actor.can(result.overridable.permission)) {
          throw new Error(
            `OVERRIDE_NOT_PERMITTED: ${result.code} requires ${result.overridable.permission}`
          );
        }

        // Check if reason is required and provided
        if (result.overridable.requiresReason && !override.reason?.trim()) {
          throw new Error(`OVERRIDE_REASON_REQUIRED: ${result.code}`);
        }

        // Record override as INFO issue (not blocking)
        issues.push({
          code: result.code,
          message: `Overridden: ${result.message}`,
          severity: 'INFO',
          target: result.target,
          context: {
            ...result.context,
            overrideReason: override.reason,
            overriddenBy: options.actor.userId,
          },
        });

        continue;
      }

      // No override, add as blocking or warning issue
      issues.push({
        code: result.code,
        message: result.message,
        severity: rule.severity === 'BLOCK' ? 'ERROR' : 'WARNING',
        target: result.target,
        context: result.context,
      });
    }

    return {
      issues,
      blocked: issues.some((i) => i.severity === 'ERROR'),
    };
  }
}

// ─── Shape Validation ─────────────────────────────────────────────────────────

export interface ShapeValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: unknown[];
  custom?: (value: unknown) => string | null;
}

/**
 * Validate shape of request body (Tier 1)
 */
export function validateShape(
  data: Record<string, unknown>,
  rules: ShapeValidationRule[]
): ApiIssue[] {
  const issues: ApiIssue[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      issues.push({
        code: 'REQUIRED',
        message: `${rule.field} is required`,
        severity: 'ERROR',
        target: `/${rule.field}`,
      });
      continue;
    }

    // Skip further checks if value is not present
    if (value === undefined || value === null) {
      continue;
    }

    // Type check
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rule.type) {
      issues.push({
        code: 'INVALID_TYPE',
        message: `${rule.field} must be of type ${rule.type}`,
        severity: 'ERROR',
        target: `/${rule.field}`,
        context: { expected: rule.type, actual: actualType },
      });
      continue;
    }

    // String-specific checks
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        issues.push({
          code: 'TOO_SHORT',
          message: `${rule.field} must be at least ${rule.min} characters`,
          severity: 'ERROR',
          target: `/${rule.field}`,
          context: { min: rule.min, actual: value.length },
        });
      }

      if (rule.max !== undefined && value.length > rule.max) {
        issues.push({
          code: 'TOO_LONG',
          message: `${rule.field} must be at most ${rule.max} characters`,
          severity: 'ERROR',
          target: `/${rule.field}`,
          context: { max: rule.max, actual: value.length },
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        issues.push({
          code: 'INVALID_FORMAT',
          message: `${rule.field} has invalid format`,
          severity: 'ERROR',
          target: `/${rule.field}`,
        });
      }
    }

    // Number-specific checks
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        issues.push({
          code: 'TOO_SMALL',
          message: `${rule.field} must be at least ${rule.min}`,
          severity: 'ERROR',
          target: `/${rule.field}`,
          context: { min: rule.min, actual: value },
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        issues.push({
          code: 'TOO_LARGE',
          message: `${rule.field} must be at most ${rule.max}`,
          severity: 'ERROR',
          target: `/${rule.field}`,
          context: { max: rule.max, actual: value },
        });
      }
    }

    // Enum check
    if (rule.enum && !rule.enum.includes(value)) {
      issues.push({
        code: 'INVALID_ENUM',
        message: `${rule.field} must be one of: ${rule.enum.join(', ')}`,
        severity: 'ERROR',
        target: `/${rule.field}`,
        context: { allowed: rule.enum, actual: value },
      });
    }

    // Custom validation
    if (rule.custom) {
      const error = rule.custom(value);
      if (error) {
        issues.push({
          code: 'CUSTOM_VALIDATION',
          message: error,
          severity: 'ERROR',
          target: `/${rule.field}`,
        });
      }
    }
  }

  return issues;
}

// ─── Reference Validation ─────────────────────────────────────────────────────

export interface ReferenceCheck {
  field: string;
  entity: string;
  id: string | number;
  scope?: {
    projectId?: string;
    companyId?: string;
  };
}

/**
 * Validate references exist and are in scope (Tier 2)
 * 
 * This is a placeholder — in production, this would query the database
 * to verify that referenced entities exist and are accessible.
 */
export async function validateReferences(
  checks: ReferenceCheck[],
  actor: Actor
): Promise<ApiIssue[]> {
  const issues: ApiIssue[] = [];

  for (const check of checks) {
    // In production, this would:
    // 1. Query the entity by ID
    // 2. Check if it exists
    // 3. Check if it's active (not deleted)
    // 4. Check if it's in scope (project, company, etc.)
    // 5. Check if actor has permission to access it

    // Placeholder implementation
    const exists = true; // Would be: await repo.exists(check.entity, check.id)
    const inScope = true; // Would be: await repo.inScope(check.entity, check.id, check.scope)

    if (!exists) {
      issues.push({
        code: 'REFERENCE_NOT_FOUND',
        message: `${check.field}: referenced ${check.entity} ${check.id} does not exist`,
        severity: 'ERROR',
        target: `/${check.field}`,
        context: { entity: check.entity, id: check.id },
      });
    } else if (!inScope) {
      issues.push({
        code: 'REFERENCE_OUT_OF_SCOPE',
        message: `${check.field}: referenced ${check.entity} ${check.id} is not in your scope`,
        severity: 'ERROR',
        target: `/${check.field}`,
        context: { entity: check.entity, id: check.id, scope: check.scope },
      });
    }
  }

  return issues;
}

// ─── Validation Orchestrator ──────────────────────────────────────────────────

/**
 * Run all three validation tiers and return all issues at once
 */
export async function validate<TContext>(
  data: Record<string, unknown>,
  shapeRules: ShapeValidationRule[],
  referenceChecks: ReferenceCheck[],
  businessRules: BusinessRule<TContext>[],
  context: TContext,
  actor: Actor,
  overrides?: Override[]
): Promise<RuleReport> {
  const allIssues: ApiIssue[] = [];

  // Tier 1: Shape validation
  const shapeIssues = validateShape(data, shapeRules);
  allIssues.push(...shapeIssues);

  // If shape validation fails, don't proceed to tier 2 and 3
  if (shapeIssues.length > 0) {
    return {
      issues: allIssues,
      blocked: true,
    };
  }

  // Tier 2: Reference validation
  const referenceIssues = await validateReferences(referenceChecks, actor);
  allIssues.push(...referenceIssues);

  // If reference validation fails, don't proceed to tier 3
  if (referenceIssues.length > 0) {
    return {
      issues: allIssues,
      blocked: true,
    };
  }

  // Tier 3: Business rule validation
  const engine = new RuleEngine(businessRules);
  const ruleReport = await engine.run(context, { actor, overrides });
  allIssues.push(...ruleReport.issues);

  return {
    issues: allIssues,
    blocked: ruleReport.blocked,
  };
}
