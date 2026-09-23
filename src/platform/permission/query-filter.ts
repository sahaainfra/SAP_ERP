/**
 * Part 08 — Query Filter
 * 
 * Query-level permission enforcement. Injects row-level security into every SELECT.
 * Ensures users only see records they are authorized to access based on:
 * - Project scope
 * - Site/package/store scope
 * - Owner scope (own records only)
 */

import { Actor } from './actor';
import { PermissionKey } from './types';

// ─── Entity Scope Specification ───────────────────────────────────────────────

export interface EntityScopeSpec {
  /** Column holding project ID */
  projectColumn?: string;
  /** Permission key required to view this entity */
  viewKey: PermissionKey;
  /** Column for site-level scoping */
  siteColumn?: string;
  /** Column for package-level scoping */
  packageColumn?: string;
  /** Column for store-level scoping */
  storeColumn?: string;
  /** Column for owner-level scoping (e.g., created_by) */
  ownerColumn?: string;
  /** Permission key that bypasses owner restriction */
  ownerBypassKey?: PermissionKey;
}

// ─── Compiled Where Clause ────────────────────────────────────────────────────

export interface CompiledWhere {
  sql: string;
  params: unknown[];
}

// ─── Entity Scope Registry ────────────────────────────────────────────────────

/**
 * Registry of entity scope specifications
 * 
 * Each entity that requires row-level security must be registered here.
 */
export const ENTITY_SCOPES: Record<string, EntityScopeSpec> = {
  // Procurement
  'purchase_order': {
    projectColumn: 'project_id',
    viewKey: 'procure.po.view',
    siteColumn: 'site_id',
    ownerColumn: 'created_by',
    ownerBypassKey: 'procure.po.view_all',
  },
  'purchase_requisition': {
    projectColumn: 'project_id',
    viewKey: 'procure.pr.view',
    ownerColumn: 'created_by',
    ownerBypassKey: 'procure.pr.view_all',
  },
  'vendor': {
    viewKey: 'master.vendor.view',
  },
  
  // Store
  'stock_item': {
    projectColumn: 'project_id',
    viewKey: 'store.stock.view',
    storeColumn: 'store_id',
  },
  'grn': {
    projectColumn: 'project_id',
    viewKey: 'store.grn.view',
    storeColumn: 'store_id',
  },
  
  // Finance
  'payment': {
    projectColumn: 'project_id',
    viewKey: 'finance.payment.view',
  },
  'receipt': {
    projectColumn: 'project_id',
    viewKey: 'finance.receipt.view',
  },
  'voucher': {
    projectColumn: 'project_id',
    viewKey: 'finance.voucher.view',
  },
  
  // Billing
  'client_bill': {
    projectColumn: 'project_id',
    viewKey: 'bill.client.view',
  },
  'subcontractor_bill': {
    projectColumn: 'project_id',
    viewKey: 'bill.sc.view',
  },
  
  // HR
  'employee': {
    projectColumn: 'project_id',
    viewKey: 'hr.employee.view',
    ownerColumn: 'user_id',
    ownerBypassKey: 'hr.employee.view_all',
  },
  'attendance': {
    projectColumn: 'project_id',
    viewKey: 'hr.attendance.view',
    ownerColumn: 'employee_id',
    ownerBypassKey: 'hr.attendance.view_all',
  },
  
  // Quality
  'inspection': {
    projectColumn: 'project_id',
    viewKey: 'qa.inspection.view',
  },
  
  // Safety
  'incident': {
    projectColumn: 'project_id',
    viewKey: 'hse.incident.view',
  },
  
  // Equipment
  'equipment': {
    projectColumn: 'project_id',
    viewKey: 'asset.equipment.view',
  },
};

// ─── Query Filter Service ─────────────────────────────────────────────────────

export class QueryFilter {
  /**
   * Apply row-level security to a query
   * 
   * @param entity - Entity name (e.g., 'purchase_order')
   * @param baseWhere - Base WHERE clause (can be empty)
   * @param actor - Actor performing the query
   * @returns Compiled WHERE clause with security predicates
   */
  apply(entity: string, baseWhere: CompiledWhere, actor: Actor): CompiledWhere {
    const spec = ENTITY_SCOPES[entity];
    if (!spec) {
      // Entity not registered - return base where unchanged
      // In production, this might throw an error to enforce registration
      return baseWhere;
    }

    const clauses: string[] = [];
    const params: unknown[] = [...baseWhere.params];

    // Add base WHERE clause if present
    if (baseWhere.sql.trim()) {
      clauses.push(`(${baseWhere.sql})`);
    }

    // Check if actor has the view permission
    const allowedProjects = actor.projectsWith(spec.viewKey);
    
    if (allowedProjects.length === 0 && !actor.hasGlobal(spec.viewKey)) {
      // Actor has no access - return impossible condition
      return {
        sql: '1 = 0',
        params: [],
      };
    }

    // Project scope
    if (spec.projectColumn && allowedProjects.length > 0 && !actor.hasGlobal(spec.viewKey)) {
      const placeholders = allowedProjects.map(() => '?').join(', ');
      clauses.push(`${spec.projectColumn} IN (${placeholders})`);
      params.push(...allowedProjects);
    }

    // Site/package/store scope (OR of AND groups)
    const scopeGroups: string[] = [];
    
    for (const projectId of allowedProjects) {
      const scope = actor.scope;
      const groupClauses: string[] = [];

      // Project condition
      if (spec.projectColumn) {
        groupClauses.push(`${spec.projectColumn} = ?`);
        params.push(projectId);
      }

      // Site scope
      if (spec.siteColumn && scope.allowedSiteIds !== 'ALL' && scope.allowedSiteIds.length > 0) {
        const placeholders = scope.allowedSiteIds.map(() => '?').join(', ');
        groupClauses.push(`${spec.siteColumn} IN (${placeholders})`);
        params.push(...scope.allowedSiteIds);
      }

      // Package scope
      if (spec.packageColumn && scope.allowedPackageIds !== 'ALL' && scope.allowedPackageIds.length > 0) {
        const placeholders = scope.allowedPackageIds.map(() => '?').join(', ');
        groupClauses.push(`${spec.packageColumn} IN (${placeholders})`);
        params.push(...scope.allowedPackageIds);
      }

      // Store scope
      if (spec.storeColumn && scope.allowedStoreIds !== 'ALL' && scope.allowedStoreIds.length > 0) {
        const placeholders = scope.allowedStoreIds.map(() => '?').join(', ');
        groupClauses.push(`${spec.storeColumn} IN (${placeholders})`);
        params.push(...scope.allowedStoreIds);
      }

      if (groupClauses.length > 0) {
        scopeGroups.push(`(${groupClauses.join(' AND ')})`);
      }
    }

    if (scopeGroups.length > 0) {
      clauses.push(`(${scopeGroups.join(' OR ')})`);
    }

    // Owner scope (only see own records unless bypass key is held)
    if (spec.ownerColumn && spec.ownerBypassKey && !actor.can(spec.ownerBypassKey)) {
      clauses.push(`${spec.ownerColumn} = ?`);
      params.push(actor.userId);
    }

    return {
      sql: clauses.join(' AND '),
      params,
    };
  }

  /**
   * Apply scope to a COUNT query
   */
  applyCount(entity: string, baseWhere: CompiledWhere, actor: Actor): CompiledWhere {
    return this.apply(entity, baseWhere, actor);
  }

  /**
   * Apply scope to a SUM/AVG query
   */
  applyAggregate(entity: string, baseWhere: CompiledWhere, actor: Actor): CompiledWhere {
    return this.apply(entity, baseWhere, actor);
  }

  /**
   * Check if an entity requires row-level security
   */
  requiresScope(entity: string): boolean {
    return entity in ENTITY_SCOPES;
  }

  /**
   * Register a new entity scope specification
   */
  register(entity: string, spec: EntityScopeSpec): void {
    ENTITY_SCOPES[entity] = spec;
  }
}

export const queryFilter = new QueryFilter();
