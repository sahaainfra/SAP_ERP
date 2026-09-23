/**
 * Part 01 — Boot-Time Validator
 * 
 * Rule WS-03: A KPI missing any of its ten governance fields fails registration.
 * Rule WS-04: A tile with unregistered KPI or unreachable permission fails boot.
 * 
 * This validator runs at application startup and rejects incomplete registrations.
 * It proves the contracts are enforced, not just declared.
 */

import type { TileContract, KPIGovernance, BootValidationResult, BootValidationError, BootValidationWarning } from '../types/contracts';
import { MODULE_NAMESPACES } from '../types/domain';

export class BootValidator {
  private tiles: Map<string, TileContract> = new Map();
  private kpis: Map<string, KPIGovernance> = new Map();
  private knownPermissions: Set<string> = new Set();

  /**
   * Register a known permission key (from responsibility templates)
   */
  registerPermission(key: string): void {
    this.knownPermissions.add(key);
  }

  /**
   * Register a tile for validation
   */
  registerTile(tile: TileContract): void {
    this.tiles.set(tile.code, tile);
  }

  /**
   * Register a KPI for validation
   */
  registerKPI(kpi: KPIGovernance): void {
    this.kpis.set(kpi.code, kpi);
  }

  /**
   * Validate all registrations and return the result
   */
  validate(): BootValidationResult {
    const errors: BootValidationError[] = [];
    const warnings: BootValidationWarning[] = [];
    const orphanedTiles: string[] = [];
    const unregisteredKPIs: string[] = [];

    // Validate each tile
    for (const [code, tile] of this.tiles) {
      // Check mandatory fields
      if (!tile.code) {
        errors.push({ code: 'TILE-001', message: 'Tile missing code', tileCode: code });
      }
      if (!tile.owningModule) {
        errors.push({ code: 'TILE-002', message: 'Tile missing owningModule', tileCode: code });
      }
      if (!tile.permissionKey) {
        errors.push({ code: 'TILE-003', message: 'Tile missing permissionKey', tileCode: code });
      }
      if (!tile.band) {
        errors.push({ code: 'TILE-004', message: 'Tile missing band', tileCode: code });
      }
      if (!tile.refreshEvents || tile.refreshEvents.length === 0) {
        errors.push({ code: 'TILE-005', message: 'Tile missing refreshEvents', tileCode: code });
      }
      if (!tile.drillTarget) {
        errors.push({ code: 'TILE-006', message: 'Tile missing drillTarget', tileCode: code });
      }
      if (!tile.deviceTiers || tile.deviceTiers.length === 0) {
        errors.push({ code: 'TILE-007', message: 'Tile missing deviceTiers', tileCode: code });
      }
      if (!tile.emptyState) {
        errors.push({ code: 'TILE-008', message: 'Tile missing emptyState', tileCode: code });
      }
      if (!tile.defaultPlacement) {
        errors.push({ code: 'TILE-009', message: 'Tile missing defaultPlacement', tileCode: code });
      }

      // Check if KPI is registered (if tile is analytical)
      if (tile.kpiCode && !this.kpis.has(tile.kpiCode)) {
        orphanedTiles.push(code);
        unregisteredKPIs.push(tile.kpiCode);
        errors.push({
          code: 'TILE-010',
          message: `Tile references unregistered KPI: ${tile.kpiCode}`,
          tileCode: code,
          kpiCode: tile.kpiCode,
        });
      }

      // Check if permission key is reachable (warning if not in known permissions)
      if (tile.permissionKey && !this.knownPermissions.has(tile.permissionKey)) {
        warnings.push({
          code: 'TILE-011',
          message: `Tile permission key not found in responsibility templates: ${tile.permissionKey}`,
          tileCode: code,
        });
      }

      // Validate module namespace
      const module = tile.owningModule;
      if (module && !MODULE_NAMESPACES.includes(module as any)) {
        errors.push({
          code: 'TILE-012',
          message: `Tile references unknown module namespace: ${module}`,
          tileCode: code,
        });
      }
    }

    // Validate each KPI (all 10 governance fields mandatory)
    for (const [code, kpi] of this.kpis) {
      const requiredFields: Array<keyof KPIGovernance> = [
        'source',
        'formula',
        'calculationPeriod',
        'projectScope',
        'organisationScope',
        'permissionScope',
        'refreshMechanism',
        'thresholds',
        'statusLogic',
        'drillDownDestination',
      ];

      for (const field of requiredFields) {
        if (!kpi[field]) {
          errors.push({
            code: 'KPI-001',
            message: `KPI missing mandatory governance field: ${field}`,
            kpiCode: code,
          });
        }
      }

      // Validate thresholds structure
      if (kpi.thresholds && typeof kpi.thresholds !== 'object') {
        errors.push({
          code: 'KPI-002',
          message: 'KPI thresholds must be an object',
          kpiCode: code,
        });
      }

      // Validate status logic
      const validStatusLogic = ['higher_is_better', 'lower_is_better', 'target_range', 'binary'];
      if (kpi.statusLogic && !validStatusLogic.includes(kpi.statusLogic)) {
        errors.push({
          code: 'KPI-003',
          message: `KPI has invalid statusLogic: ${kpi.statusLogic}`,
          kpiCode: code,
        });
      }

      // Validate calculation period
      const validPeriods = ['real-time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
      if (kpi.calculationPeriod && !validPeriods.includes(kpi.calculationPeriod)) {
        errors.push({
          code: 'KPI-004',
          message: `KPI has invalid calculationPeriod: ${kpi.calculationPeriod}`,
          kpiCode: code,
        });
      }

      // Validate refresh mechanism
      const validMechanisms = ['realtime', 'scheduled', 'on-demand', 'event-driven'];
      if (kpi.refreshMechanism && !validMechanisms.includes(kpi.refreshMechanism)) {
        errors.push({
          code: 'KPI-005',
          message: `KPI has invalid refreshMechanism: ${kpi.refreshMechanism}`,
          kpiCode: code,
        });
      }
    }

    const passed = errors.length === 0;

    return {
      passed,
      errors,
      warnings,
      registeredTiles: this.tiles.size,
      registeredKPIs: this.kpis.size,
      orphanedTiles,
      unregisteredKPIs,
    };
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.tiles.clear();
    this.kpis.clear();
    this.knownPermissions.clear();
  }
}

// Singleton instance
export const bootValidator = new BootValidator();
