/**
 * Part 04 — Module Definition
 * 
 * Contract that every module must implement to register itself with the platform.
 * Declares permissions, workflows, documents, posting rules, KPIs, and UI metadata.
 * 
 * Rules:
 * - Every module must have a ModuleDefinition
 * - All permission keys must be declared
 * - All workflows must be registered
 * - All documents must be defined
 * - Boot-time validator checks all registrations
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PermissionKeyDefinition {
  key: string;
  description: string;
  category: 'read' | 'write' | 'admin' | 'approval';
}

export interface WorkflowDefinition {
  code: string;
  name: string;
  documentType: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  sequence: number;
  name: string;
  approverRule: string;
  escalationHours?: number;
}

export interface DocumentDefinition {
  code: string;
  name: string;
  numberSeries: string;
  states: string[];
  transitions: DocumentTransition[];
}

export interface DocumentTransition {
  from: string;
  to: string;
  action: string;
  permission: string;
}

export interface PostingRuleDefinition {
  code: string;
  name: string;
  event: string;
  debitAccount: string;
  creditAccount: string;
  amountField: string;
}

export interface KPIDefinition {
  code: string;
  name: string;
  description: string;
  source: string;
  formula: string;
  calculationPeriod: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  projectScope: 'active' | 'all' | 'assigned' | 'specific';
  organisationScope: 'company' | 'division' | 'department' | 'specific';
  permissionScope: string;
  refreshMechanism: 'realtime' | 'scheduled' | 'on-demand' | 'event-driven';
  thresholds: {
    critical?: number;
    warning?: number;
    target?: number;
    excellent?: number;
  };
  statusLogic: 'higher_is_better' | 'lower_is_better' | 'target_range' | 'binary';
  drillDownDestination: string;
  label: string;
  format: 'number' | 'currency' | 'percentage' | 'duration' | 'ratio';
  unit?: string;
}

export interface AlertDefinition {
  code: string;
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  recipients: string[];
}

export interface UIMetadataDefinition {
  listReport: {
    entity: string;
    columns: UIColumnDefinition[];
    filters: UIFilterDefinition[];
    actions: UIActionDefinition[];
  };
  objectPage: {
    entity: string;
    header: UIHeaderDefinition;
    sections: UISectionDefinition[];
  };
}

export interface UIColumnDefinition {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'status' | 'currency' | 'percentage';
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface UIFilterDefinition {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi-select';
  options?: { value: string; label: string }[];
}

export interface UIActionDefinition {
  code: string;
  label: string;
  permission: string;
  action: string;
}

export interface UIHeaderDefinition {
  title: string;
  subtitle?: string;
  status: string;
  actions: string[];
}

export interface UISectionDefinition {
  code: string;
  label: string;
  type: 'form' | 'table' | 'chart' | 'timeline';
  fields?: string[];
}

export interface SoDRuleDefinition {
  code: string;
  description: string;
  conflictingPermissions: [string, string];
  severity: 'error' | 'warning';
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Module Definition Contract
 * 
 * Every module must export a ModuleDefinition that declares:
 * - Permission keys
 * - Workflow definitions
 * - Document definitions
 * - Posting rules
 * - KPIs
 * - Alerts
 * - UI metadata
 * - Segregation of duties rules
 * 
 * Usage:
 * ```typescript
 * // modules/procurement/config/module.definition.ts
 * export const ProcurementModule: ModuleDefinition = {
 *   code: 'PROCURE',
 *   name: 'Procurement',
 *   description: 'Purchase orders, indents, RFQs, and vendor management',
 *   permissionKeys: [...],
 *   workflowDefinitions: [...],
 *   documents: [...],
 *   postingRules: [...],
 *   kpis: [...],
 *   alerts: [...],
 *   uiMetadata: {...},
 *   sodRules: [...],
 * };
 * ```
 */
export interface ModuleDefinition {
  /** Module code (e.g., 'PROCURE', 'INVENTORY', 'HR') */
  code: string;
  
  /** Module name */
  name: string;
  
  /** Module description */
  description: string;
  
  /** Permission keys defined by this module */
  permissionKeys: PermissionKeyDefinition[];
  
  /** Workflow definitions */
  workflowDefinitions: WorkflowDefinition[];
  
  /** Document definitions */
  documents: DocumentDefinition[];
  
  /** Posting rules for GL integration */
  postingRules: PostingRuleDefinition[];
  
  /** KPI definitions */
  kpis: KPIDefinition[];
  
  /** Alert definitions */
  alerts: AlertDefinition[];
  
  /** UI metadata for list reports and object pages */
  uiMetadata: UIMetadataDefinition;
  
  /** Segregation of duties rules */
  sodRules: SoDRuleDefinition[];
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Module Registry — holds all registered modules
 * 
 * Boot-time validator checks:
 * - Every permission key referenced by a controller exists in some module
 * - Every permission key is reachable from at least one responsibility template
 * - No duplicate permission keys across modules
 * - No duplicate workflow codes
 * - No duplicate document codes
 */
export class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();

  /**
   * Register a module
   */
  register(module: ModuleDefinition): void {
    if (this.modules.has(module.code)) {
      throw new Error(`Module already registered: ${module.code}`);
    }
    this.modules.set(module.code, module);
  }

  /**
   * Get a module by code
   */
  get(code: string): ModuleDefinition | undefined {
    return this.modules.get(code);
  }

  /**
   * Get all registered modules
   */
  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get all permission keys across all modules
   */
  getAllPermissionKeys(): PermissionKeyDefinition[] {
    const keys: PermissionKeyDefinition[] = [];
    for (const module of this.modules.values()) {
      keys.push(...module.permissionKeys);
    }
    return keys;
  }

  /**
   * Get all KPIs across all modules
   */
  getAllKPIs(): KPIDefinition[] {
    const kpis: KPIDefinition[] = [];
    for (const module of this.modules.values()) {
      kpis.push(...module.kpis);
    }
    return kpis;
  }

  /**
   * Check if a permission key exists in any module
   */
  hasPermissionKey(key: string): boolean {
    for (const module of this.modules.values()) {
      if (module.permissionKeys.some(pk => pk.key === key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate the registry
   * Returns array of validation errors
   */
  validate(): string[] {
    const errors: string[] = [];

    // Check for duplicate permission keys
    const permissionKeys = new Set<string>();
    for (const module of this.modules.values()) {
      for (const pk of module.permissionKeys) {
        if (permissionKeys.has(pk.key)) {
          errors.push(`Duplicate permission key: ${pk.key}`);
        }
        permissionKeys.add(pk.key);
      }
    }

    // Check for duplicate workflow codes
    const workflowCodes = new Set<string>();
    for (const module of this.modules.values()) {
      for (const wf of module.workflowDefinitions) {
        if (workflowCodes.has(wf.code)) {
          errors.push(`Duplicate workflow code: ${wf.code}`);
        }
        workflowCodes.add(wf.code);
      }
    }

    // Check for duplicate document codes
    const documentCodes = new Set<string>();
    for (const module of this.modules.values()) {
      for (const doc of module.documents) {
        if (documentCodes.has(doc.code)) {
          errors.push(`Duplicate document code: ${doc.code}`);
        }
        documentCodes.add(doc.code);
      }
    }

    return errors;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

export const moduleRegistry = new ModuleRegistry();
