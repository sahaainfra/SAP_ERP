/**
 * Part 04 — Legacy Write Bridge
 * 
 * Controls writes to existing tables through a whitelist of allowed columns.
 * Prevents new modules from writing to columns the existing application
 * treats as authoritative.
 * 
 * Rules:
 * - Only whitelisted columns can be written
 * - All writes go through this bridge
 * - Writes are logged and audited
 * - No direct SQL updates to legacy tables
 */

import { UowContext } from '../uow/UnitOfWork';
import { SCHEMA_MAP, TableMapping } from '../../config/schema-map';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WritableColumns {
  [entityKey: string]: string[];
}

export interface WriteOperation {
  entityKey: string;
  id: number | string;
  data: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// WHITELIST CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Whitelist of columns that can be written to legacy tables
 * 
 * This is a security control, not a convenience.
 * It prevents new modules from writing to columns the existing application
 * treats as authoritative.
 * 
 * In production, this would be populated from SYSTEM_MAP.md inspection results.
 * For now, it's empty since we have no existing database.
 */
export const LEGACY_WRITABLE_COLUMNS: WritableColumns = {
  // Example (when database exists):
  // purchaseOrder: ['status', 'approved_by', 'approved_at', 'notes'],
  // vendor: ['status', 'payment_terms', 'credit_limit'],
  // employee: ['status', 'department_id', 'reports_to'],
};

// ═══════════════════════════════════════════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════════════════════════════════════════

export class ForbiddenWriteError extends Error {
  constructor(
    public entityKey: string,
    public forbiddenColumns: string[]
  ) {
    super(
      `Write to non-whitelisted columns in ${entityKey}: ${forbiddenColumns.join(', ')}. ` +
      `Only these columns can be written: ${(LEGACY_WRITABLE_COLUMNS[entityKey] || []).join(', ') || 'none'}`
    );
    this.name = 'ForbiddenWriteError';
  }
}

export class EntityNotMappedError extends Error {
  constructor(public entityKey: string) {
    super(`No schema mapping found for entity: ${entityKey}`);
    this.name = 'EntityNotMappedError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY WRITE BRIDGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Legacy Write Bridge — controls writes to existing tables
 * 
 * Usage:
 * ```typescript
 * const bridge = new LegacyWriteBridge();
 * 
 * // Validate before writing
 * bridge.assertWritable('purchaseOrder', ['status', 'notes']);
 * 
 * // Execute write within transaction
 * await bridge.write(ctx, {
 *   entityKey: 'purchaseOrder',
 *   id: 123,
 *   data: { status: 'APPROVED', notes: 'Approved by manager' }
 * });
 * ```
 */
export class LegacyWriteBridge {
  /**
   * Assert that all columns in the write operation are whitelisted
   * Throws ForbiddenWriteError if any column is not whitelisted
   */
  assertWritable(entityKey: string, columns: string[]): void {
    const allowed = LEGACY_WRITABLE_COLUMNS[entityKey] || [];
    const forbidden = columns.filter(col => !allowed.includes(col));
    
    if (forbidden.length > 0) {
      throw new ForbiddenWriteError(entityKey, forbidden);
    }
  }

  /**
   * Get the entity map from SCHEMA_MAP
   */
  private getMap(entityKey: string): TableMapping {
    const map = SCHEMA_MAP[entityKey];
    if (!map) {
      throw new EntityNotMappedError(entityKey);
    }
    return map;
  }

  /**
   * Convert logical field names to physical column names
   */
  private toPhysical(entityKey: string, logicalData: Record<string, any>): Record<string, any> {
    const map = this.getMap(entityKey);
    const physical: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(logicalData)) {
      const physicalColumn = map[key];
      if (!physicalColumn || typeof physicalColumn !== 'string') {
        throw new Error(`No column mapping for field: ${key} in entity: ${entityKey}`);
      }
      physical[physicalColumn] = value;
    }
    
    return physical;
  }

  /**
   * Write to a legacy table within a transaction
   * 
   * In production, this would:
   * 1. Validate columns against whitelist
   * 2. Convert logical names to physical names
   * 3. Execute UPDATE statement
   * 4. Record audit entry
   */
  async write(ctx: UowContext, operation: WriteOperation): Promise<void> {
    const { entityKey, id, data } = operation;
    
    // Validate columns against whitelist
    this.assertWritable(entityKey, Object.keys(data));
    
    // Get entity map
    const map = this.getMap(entityKey);
    
    // Convert to physical column names
    const physicalData = this.toPhysical(entityKey, data);
    
    // In production, this would execute the UPDATE
    // For now, log the operation
    console.log(`[LEGACY_WRITE] ${entityKey}:${id}`, {
      table: map.table,
      data: physicalData,
      actor: ctx.actor.userId,
      correlationId: ctx.correlationId,
    });
    
    // Record audit entry
    ctx.audit.record({
      entity: entityKey,
      entityId: id,
      action: 'UPDATE',
      after: data,
      permissionKey: `legacy.${entityKey}.write`,
    });
  }

  /**
   * Batch write multiple operations within a transaction
   */
  async writeBatch(ctx: UowContext, operations: WriteOperation[]): Promise<void> {
    for (const operation of operations) {
      await this.write(ctx, operation);
    }
  }

  /**
   * Check if an entity has any writable columns
   */
  hasWritableColumns(entityKey: string): boolean {
    const allowed = LEGACY_WRITABLE_COLUMNS[entityKey] || [];
    return allowed.length > 0;
  }

  /**
   * Get list of writable columns for an entity
   */
  getWritableColumns(entityKey: string): string[] {
    return LEGACY_WRITABLE_COLUMNS[entityKey] || [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

export const legacyWriteBridge = new LegacyWriteBridge();
