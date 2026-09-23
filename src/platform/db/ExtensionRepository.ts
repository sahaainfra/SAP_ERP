/**
 * Part 04 — Extension Repository
 * 
 * Pattern for adding fields to existing entities without modifying their tables.
 * Uses side tables (dx_*_extension) that reference the primary key of the host entity.
 * 
 * Rules:
 * - Extension tables are prefixed dx_*_extension
 * - Foreign key references the host entity's primary key
 * - Extension data is merged with host data in composite reads
 * - API returns unified resource, not separate objects
 */

import { UowContext } from '../uow/UnitOfWork';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExtensionConfig {
  tableName: string;
  foreignKeyColumn: string;
  hostEntityKey: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION REPOSITORY BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base class for extension repositories
 * 
 * Usage:
 * ```typescript
 * interface PurchaseOrderExtension {
 *   poId: number;
 *   poType: 'REGULAR' | 'BLANKET' | 'CONTRACT';
 *   qtyTolerancePct: number;
 *   valueTolerancePct: number;
 *   budgetStatus: 'OK' | 'WARNING' | 'OVERRUN';
 * }
 * 
 * class PurchaseOrderExtensionRepository extends ExtensionRepository<PurchaseOrderExtension> {
 *   protected readonly config: ExtensionConfig = {
 *     tableName: 'dx_po_extension',
 *     foreignKeyColumn: 'po_id',
 *     hostEntityKey: 'purchaseOrder',
 *   };
 * }
 * ```
 */
export abstract class ExtensionRepository<T extends Record<string, any>> {
  /**
   * Configuration for this extension table
   */
  protected abstract readonly config: ExtensionConfig;

  /**
   * Get extension data for a host entity
   * Returns null if no extension exists
   */
  async get(ctx: UowContext, hostId: number | string): Promise<T | null> {
    const { tableName, foreignKeyColumn } = this.config;
    
    // In production, this would execute:
    // SELECT * FROM {tableName} WHERE {foreignKeyColumn} = $1
    const sql = `SELECT * FROM ${tableName} WHERE ${foreignKeyColumn} = $1`;
    
    console.log(`[EXTENSION] Reading ${tableName} for host ${hostId}`);
    
    // Simulated result
    return null;
  }

  /**
   * Create or update extension data
   * Uses UPSERT pattern (INSERT ... ON CONFLICT DO UPDATE)
   */
  async upsert(
    ctx: UowContext,
    hostId: number | string,
    data: Partial<T>
  ): Promise<T> {
    const { tableName, foreignKeyColumn } = this.config;
    
    // Get existing data for audit
    const existing = await this.get(ctx, hostId);
    
    // Merge with existing data
    const merged = { ...existing, ...data, [foreignKeyColumn]: hostId } as T;
    
    // In production, this would execute UPSERT
    console.log(`[EXTENSION] Upserting ${tableName} for host ${hostId}`, data);
    
    // Record audit entry
    ctx.audit.record({
      entity: tableName,
      entityId: hostId,
      action: existing ? 'UPDATE' : 'CREATE',
      before: existing,
      after: merged,
    });
    
    return merged;
  }

  /**
   * Delete extension data
   */
  async delete(ctx: UowContext, hostId: number | string): Promise<void> {
    const { tableName, foreignKeyColumn } = this.config;
    
    // Get existing data for audit
    const existing = await this.get(ctx, hostId);
    
    if (!existing) {
      return; // Nothing to delete
    }
    
    // In production, this would execute DELETE
    console.log(`[EXTENSION] Deleting ${tableName} for host ${hostId}`);
    
    // Record audit entry
    ctx.audit.record({
      entity: tableName,
      entityId: hostId,
      action: 'DELETE',
      before: existing,
      after: null,
    });
  }

  /**
   * Check if extension exists for a host entity
   */
  async exists(ctx: UowContext, hostId: number | string): Promise<boolean> {
    const extension = await this.get(ctx, hostId);
    return extension !== null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITE READ MAPPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merges host entity data with extension data into a unified resource
 * 
 * Usage:
 * ```typescript
 * class PurchaseOrderMapper {
 *   static toResource(
 *     host: PurchaseOrder,
 *     extension: PurchaseOrderExtension | null
 *   ): PurchaseOrderResource {
 *     return {
 *       id: host.id,
 *       number: host.number,
 *       date: host.date,
 *       vendorId: host.vendorId,
 *       // Extension fields (with defaults)
 *       poType: extension?.poType || 'REGULAR',
 *       qtyTolerancePct: extension?.qtyTolerancePct || 0,
 *       valueTolerancePct: extension?.valueTolerancePct || 0,
 *       budgetStatus: extension?.budgetStatus || 'OK',
 *     };
 *   }
 * }
 * ```
 */
export interface CompositeMapper<THost, TExtension, TResource> {
  toResource(host: THost, extension: TExtension | null): TResource;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Example: Purchase Order Extension
 * 
 * When the database exists, this would be implemented as:
 * 
 * ```typescript
 * export interface PurchaseOrderExtension {
 *   poId: number;
 *   poType: 'REGULAR' | 'BLANKET' | 'CONTRACT';
 *   qtyTolerancePct: number;
 *   valueTolerancePct: number;
 *   budgetStatus: 'OK' | 'WARNING' | 'OVERRUN';
 *   budgetOverrideBy: string | null;
 * }
 * 
 * export class PurchaseOrderExtensionRepository 
 *   extends ExtensionRepository<PurchaseOrderExtension> 
 * {
 *   protected readonly config: ExtensionConfig = {
 *     tableName: 'dx_po_extension',
 *     foreignKeyColumn: 'po_id',
 *     hostEntityKey: 'purchaseOrder',
 *   };
 * }
 * ```
 */
