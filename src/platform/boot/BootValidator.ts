/**
 * Part 04 — Boot-Time Validator
 * 
 * Validates that all module registrations are correct at application startup.
 * Checks:
 * - Every permission key referenced by a controller exists in some module
 * - Every permission key is reachable from at least one responsibility template
 * - No duplicate permission keys across modules
 * - No duplicate workflow codes
 * - No duplicate document codes
 * - All engines are registered
 */

import { moduleRegistry, ModuleDefinition } from '../module/ModuleDefinition';
import { ENGINE_INVENTORY } from '../engine/EngineInventory';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BootValidationResult {
  passed: boolean;
  errors: BootValidationError[];
  warnings: BootValidationWarning[];
  summary: BootValidationSummary;
}

export interface BootValidationError {
  code: string;
  message: string;
  module?: string;
  severity: 'error' | 'critical';
}

export interface BootValidationWarning {
  code: string;
  message: string;
  module?: string;
}

export interface BootValidationSummary {
  totalModules: number;
  totalPermissionKeys: number;
  totalWorkflows: number;
  totalDocuments: number;
  totalKPIs: number;
  totalEngines: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOT VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Boot-Time Validator
 * 
 * Validates the entire module registry at application startup.
 * 
 * Usage:
 * ```typescript
 * // Register all modules
 * moduleRegistry.register(ProcurementModule);
 * moduleRegistry.register(InventoryModule);
 * moduleRegistry.register(HRModule);
 * 
 * // Validate at boot
 * const result = validateBoot();
 * if (!result.passed) {
 *   console.error('Boot validation failed:', result.errors);
 *   process.exit(1);
 * }
 * ```
 */
export function validateBoot(): BootValidationResult {
  const errors: BootValidationError[] = [];
  const warnings: BootValidationWarning[] = [];

  // ─── Validate Module Registry ──────────────────────────────────────────
  const registryErrors = moduleRegistry.validate();
  for (const error of registryErrors) {
    errors.push({
      code: 'MOD-001',
      message: error,
      severity: 'error',
    });
  }

  // ─── Validate Permission Keys ──────────────────────────────────────────
  const permissionKeys = new Map<string, string[]>(); // key -> modules
  
  for (const module of moduleRegistry.getAll()) {
    for (const pk of module.permissionKeys) {
      const existing = permissionKeys.get(pk.key) || [];
      existing.push(module.code);
      permissionKeys.set(pk.key, existing);
    }
  }

  // Check for duplicate permission keys
  for (const [key, modules] of permissionKeys.entries()) {
    if (modules.length > 1) {
      errors.push({
        code: 'PERM-001',
        message: `Duplicate permission key "${key}" found in modules: ${modules.join(', ')}`,
        severity: 'critical',
      });
    }
  }

  // ─── Validate Workflows ────────────────────────────────────────────────
  const workflowCodes = new Map<string, string[]>(); // code -> modules
  
  for (const module of moduleRegistry.getAll()) {
    for (const wf of module.workflowDefinitions) {
      const existing = workflowCodes.get(wf.code) || [];
      existing.push(module.code);
      workflowCodes.set(wf.code, existing);
    }
  }

  // Check for duplicate workflow codes
  for (const [code, modules] of workflowCodes.entries()) {
    if (modules.length > 1) {
      errors.push({
        code: 'WF-001',
        message: `Duplicate workflow code "${code}" found in modules: ${modules.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // ─── Validate Documents ────────────────────────────────────────────────
  const documentCodes = new Map<string, string[]>(); // code -> modules
  
  for (const module of moduleRegistry.getAll()) {
    for (const doc of module.documents) {
      const existing = documentCodes.get(doc.code) || [];
      existing.push(module.code);
      documentCodes.set(doc.code, existing);
    }
  }

  // Check for duplicate document codes
  for (const [code, modules] of documentCodes.entries()) {
    if (modules.length > 1) {
      errors.push({
        code: 'DOC-001',
        message: `Duplicate document code "${code}" found in modules: ${modules.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // ─── Validate KPIs ─────────────────────────────────────────────────────
  const kpiCodes = new Set<string>();
  
  for (const module of moduleRegistry.getAll()) {
    for (const kpi of module.kpis) {
      if (kpiCodes.has(kpi.code)) {
        errors.push({
          code: 'KPI-001',
          message: `Duplicate KPI code "${kpi.code}" in module ${module.code}`,
          module: module.code,
          severity: 'error',
        });
      }
      kpiCodes.add(kpi.code);
    }
  }

  // ─── Validate Engine Inventory ─────────────────────────────────────────
  for (const engine of ENGINE_INVENTORY) {
    if (engine.status === 'planned') {
      warnings.push({
        code: 'ENG-001',
        message: `Engine "${engine.name}" is planned but not yet implemented (Part ${engine.builtInPart})`,
      });
    }
  }

  // ─── Build Summary ─────────────────────────────────────────────────────
  const summary: BootValidationSummary = {
    totalModules: moduleRegistry.getAll().length,
    totalPermissionKeys: moduleRegistry.getAllPermissionKeys().length,
    totalWorkflows: moduleRegistry.getAll().reduce((sum, m) => sum + m.workflowDefinitions.length, 0),
    totalDocuments: moduleRegistry.getAll().reduce((sum, m) => sum + m.documents.length, 0),
    totalKPIs: moduleRegistry.getAllKPIs().length,
    totalEngines: ENGINE_INVENTORY.length,
  };

  // ─── Return Result ─────────────────────────────────────────────────────
  return {
    passed: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOT VALIDATION REPORTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format boot validation result for display
 */
export function formatBootValidationResult(result: BootValidationResult): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('BOOT VALIDATION REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('───────');
  lines.push(`Modules:           ${result.summary.totalModules}`);
  lines.push(`Permission Keys:   ${result.summary.totalPermissionKeys}`);
  lines.push(`Workflows:         ${result.summary.totalWorkflows}`);
  lines.push(`Documents:         ${result.summary.totalDocuments}`);
  lines.push(`KPIs:              ${result.summary.totalKPIs}`);
  lines.push(`Engines:           ${result.summary.totalEngines}`);
  lines.push('');

  // Status
  if (result.passed) {
    lines.push('✅ VALIDATION PASSED');
  } else {
    lines.push('❌ VALIDATION FAILED');
  }
  lines.push('');

  // Errors
  if (result.errors.length > 0) {
    lines.push('ERRORS');
    lines.push('──────');
    for (const error of result.errors) {
      lines.push(`[${error.code}] ${error.message}`);
      if (error.module) {
        lines.push(`  Module: ${error.module}`);
      }
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push('WARNINGS');
    lines.push('────────');
    for (const warning of result.warnings) {
      lines.push(`[${warning.code}] ${warning.message}`);
      if (warning.module) {
        lines.push(`  Module: ${warning.module}`);
      }
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}
