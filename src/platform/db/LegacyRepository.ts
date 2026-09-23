/**
 * Part 04 — Legacy Repository
 * 
 * Base class for reading from existing tables through the schema map.
 * No domain code references a legacy column name directly.
 * Everything goes through an adapter configured from config/schema-map.ts.
 * 
 * Rules:
 * - All reads go through LegacyRepository
 * - Column names are mapped via SCHEMA_MAP
 * - No direct SQL with hardcoded column names
 */

import { SCHEMA_MAP, TableMapping } from '../../config/schema-map';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY REPOSITORY BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base class for legacy table repositories
 * 
 * Usage:
 * ```typescript
 * class PurchaseOrderRepository extends LegacyRepository<PurchaseOrder> {
 *   protected readonly entityKey = 'purchaseOrder';
 *   
 *   async findById(id: number): Promise<PurchaseOrder | null> {
 *     const sql = `SELECT ${this.selectColumns()} FROM ${this.getTableName()} WHERE ${this.map.pk} = $1`;
 *     const row = await this.executeQuery(sql, [id]);
 *     return row ? this.mapRow(row) : null;
 *   }
 * }
 * ```
 */
export abstract class LegacyRepository<T> {
  /**
   * Key in SCHEMA_MAP for this entity
   */
  protected abstract readonly entityKey: keyof typeof SCHEMA_MAP;

  /**
   * Get the entity map from SCHEMA_MAP
   */
  protected get map(): TableMapping {
    const map = SCHEMA_MAP[this.entityKey as string];
    if (!map) {
      throw new Error(`No schema mapping found for entity: ${this.entityKey}`);
    }
    return map;
  }

  /**
   * Get the physical table name
   */
  protected getTableName(): string {
    return this.map.table;
  }

  /**
   * Get SELECT clause with column mapping
   * Maps logical names to physical column names
   */
  protected selectColumns(alias: string = 't'): string {
    return Object.entries(this.map.columns)
      .map(([logical, physical]) => `${alias}.${physical} AS "${logical}"`)
      .join(', ');
  }

  /**
   * Convert logical field names to physical column names
   * Used for INSERT/UPDATE operations
   */
  protected toPhysical(logicalData: Partial<T>): Record<string, any> {
    const physical: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(logicalData)) {
      const physicalColumn = this.map[key];
      if (!physicalColumn || typeof physicalColumn !== 'string') {
        throw new Error(`No column mapping for field: ${key} in entity: ${this.entityKey}`);
      }
      physical[physicalColumn] = value;
    }
    
    return physical;
  }

  /**
   * Convert physical row to logical entity
   * Used for SELECT operations
   */
  protected mapRow(row: Record<string, any>): T {
    const logical: Record<string, any> = {};
    
    for (const [logicalName, physicalColumn] of Object.entries(this.map.columns)) {
      if (physicalColumn in row) {
        logical[logicalName] = row[physicalColumn];
      }
    }
    
    return logical as T;
  }

  /**
   * Build WHERE clause from conditions
   */
  protected buildWhereClause(
    conditions: Record<string, any>,
    startParamIndex: number = 1
  ): { clause: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];
    let paramIndex = startParamIndex;

    for (const [field, value] of Object.entries(conditions)) {
      const physicalColumn = this.map[field];
      if (!physicalColumn || typeof physicalColumn !== 'string') {
        throw new Error(`No column mapping for field: ${field}`);
      }

      if (value === null) {
        clauses.push(`${physicalColumn} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        clauses.push(`${physicalColumn} IN (${placeholders})`);
        params.push(...value);
      } else {
        clauses.push(`${physicalColumn} = $${paramIndex++}`);
        params.push(value);
      }
    }

    return {
      clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      params,
    };
  }

  /**
   * Execute a query (to be implemented by concrete repository)
   * In production, this would use the actual database connection
   */
  protected abstract executeQuery(sql: string, params?: any[]): Promise<any>;

  /**
   * Find entity by primary key
   */
  async findById(id: number | string): Promise<T | null> {
    const pk = this.map.pk;
    const sql = `SELECT ${this.selectColumns()} FROM ${this.getTableName()} WHERE ${pk} = $1`;
    const row = await this.executeQuery(sql, [id]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Find all entities matching conditions
   */
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    const { where = {}, orderBy, limit, offset } = options;
    
    let sql = `SELECT ${this.selectColumns()} FROM ${this.getTableName()}`;
    
    const { clause, params } = this.buildWhereClause(where);
    sql += ` ${clause}`;
    
    if (orderBy) {
      const physicalColumn = (this.map[orderBy] as string) || orderBy;
      sql += ` ORDER BY ${physicalColumn}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    if (offset) {
      sql += ` OFFSET ${offset}`;
    }

    const rows = await this.executeQuery(sql, params);
    return rows.map((row: any) => this.mapRow(row));
  }

  /**
   * Count entities matching conditions
   */
  async count(where: Record<string, any> = {}): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.getTableName()}`;
    
    const { clause, params } = this.buildWhereClause(where);
    sql += ` ${clause}`;

    const result = await this.executeQuery(sql, params);
    return parseInt(result[0]?.count || '0', 10);
  }

  /**
   * Check if entity exists
   */
  async exists(id: number | string): Promise<boolean> {
    const pk = this.map.pk;
    const sql = `SELECT 1 FROM ${this.getTableName()} WHERE ${pk} = $1 LIMIT 1`;
    const row = await this.executeQuery(sql, [id]);
    return !!row;
  }
}
