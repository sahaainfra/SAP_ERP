/**
 * Part 08 — Field Masker
 * 
 * Field-level permission enforcement. Masks or hides fields based on actor's permissions.
 * Applied in the serializer so it cannot be bypassed by controllers.
 * 
 * Modes:
 * - HIDE: Remove field from response entirely
 * - MASK: Replace value with placeholder (e.g., "****")
 * - VISIBLE: No restriction
 */

import { Actor } from './actor';

// ─── Field Masking Rule ───────────────────────────────────────────────────────

export type FieldMaskMode = 'HIDE' | 'MASK' | 'REDACT' | 'VISIBLE';

export interface FieldMaskRule {
  mode: FieldMaskMode;
  pattern?: string; // for MASK mode, e.g., '****1234'
}

// ─── Standard Field Restrictions ──────────────────────────────────────────────

/**
 * Standard field restrictions for common sensitive fields
 */
export const STANDARD_FIELD_RESTRICTIONS: Record<string, FieldMaskRule> = {
  // Financial data
  'po.totalValue': { mode: 'HIDE' },
  'poItem.rate': { mode: 'HIDE' },
  'workOrderItem.marginPct': { mode: 'HIDE' },
  'project.margin': { mode: 'HIDE' },
  
  // Stock/Inventory
  'stockItem.rate': { mode: 'HIDE' },
  'stockItem.value': { mode: 'HIDE' },
  
  // HR/Payroll
  'workforce.salary': { mode: 'HIDE' },
  'payrollLine.amount': { mode: 'HIDE' },
  'workforce.aadhaarLast4': { mode: 'MASK', pattern: 'XXXX' },
  'workforce.bankAccount': { mode: 'MASK', pattern: '****' },
  
  // Vendor
  'vendor.bankAccount': { mode: 'MASK', pattern: '****' },
  
  // Sealed quotations
  'quotationItem.rate': { mode: 'REDACT' },
};

// ─── Field Masker Service ─────────────────────────────────────────────────────

export class FieldMasker {
  private lastMasked: string[] = [];

  /**
   * Apply field masking to a record
   * 
   * @param entity - Entity name (e.g., 'purchase_order')
   * @param record - Record to mask
   * @param actor - Actor requesting the record
   * @returns Masked record
   */
  apply<T extends Record<string, any>>(entity: string, record: T, actor: Actor): T {
    this.lastMasked = [];
    
    const restricted = actor.restrictedFields(entity);
    if (Object.keys(restricted).length === 0) {
      return record;
    }

    const masked: any = { ...record };

    for (const [field, visibility] of Object.entries(restricted)) {
      const fullField = `${entity}.${field}`;
      const rule = STANDARD_FIELD_RESTRICTIONS[fullField] ?? { mode: visibility };

      switch (rule.mode) {
        case 'HIDE':
          delete masked[field];
          this.lastMasked.push(fullField);
          break;
        
        case 'MASK':
          masked[field] = this.maskValue(masked[field], rule.pattern);
          this.lastMasked.push(fullField);
          break;
        
        case 'REDACT':
          masked[field] = null;
          this.lastMasked.push(fullField);
          break;
        
        case 'VISIBLE':
          // No action needed
          break;
      }
    }

    return masked;
  }

  /**
   * Apply field masking to an array of records
   */
  applyMany<T extends Record<string, any>>(entity: string, records: T[], actor: Actor): T[] {
    return records.map(record => this.apply(entity, record, actor));
  }

  /**
   * Mask a value based on pattern
   */
  private maskValue(value: any, pattern?: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      if (pattern) {
        // Use pattern to mask (e.g., "****1234" for last 4 digits)
        if (pattern.startsWith('****')) {
          const suffix = value.slice(-4);
          return `****${suffix}`;
        }
        if (pattern.startsWith('XXXX')) {
          const suffix = value.slice(-4);
          return `XXXX${suffix}`;
        }
      }
      // Default mask
      return '••••••';
    }

    if (typeof value === 'number') {
      return 0;
    }

    return null;
  }

  /**
   * Get list of fields that were masked in the last apply() call
   */
  getLastMasked(): string[] {
    return [...this.lastMasked];
  }

  /**
   * Check if a field should be masked for an actor
   */
  shouldMask(entity: string, field: string, actor: Actor): boolean {
    const restricted = actor.restrictedFields(entity);
    const visibility = restricted[field];
    return visibility === 'HIDDEN' || visibility === 'MASKED';
  }

  /**
   * Apply masking to aggregate values (SUM, AVG, etc.)
   * 
   * If any field in the aggregate is restricted, the entire aggregate is suppressed
   * to prevent information leakage through approximation.
   */
  applyAggregate(entity: string, field: string, value: any, actor: Actor): any {
    if (this.shouldMask(entity, field, actor)) {
      return null; // Suppress aggregate entirely
    }
    return value;
  }

  /**
   * Apply masking to chart series data
   */
  applyChartSeries(entity: string, field: string, data: any[], actor: Actor): any[] {
    if (this.shouldMask(entity, field, actor)) {
      return []; // Suppress chart series entirely
    }
    return data;
  }
}

export const fieldMasker = new FieldMasker();
