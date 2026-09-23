/**
 * Part 01 — Boot Validation & Resolution Demo
 * 
 * This component demonstrates the boot-time validator and workspace resolver
 * in action. It shows:
 * - Boot validation with all 10 KPI governance fields checked
 * - Deny-by-default permission interface
 * - Workspace resolution filtering tiles by permission
 * - Orphan detection (tiles with unregistered KPIs)
 * 
 * This proves the contracts are enforced, not just declared.
 */

import React, { useState, useEffect } from 'react';
import { bootValidator } from '../services/BootValidator';
import { workspaceResolver, permissionInterface } from '../services/WorkspaceResolver';
import type { TileContract, KPIGovernance, BootValidationResult, WorkspaceResolution } from '../types/contracts';
import { CheckCircle2, XCircle, AlertTriangle, Shield } from 'lucide-react';

export function BootValidationDemo() {
  const [validationResult, setValidationResult] = useState<BootValidationResult | null>(null);
  const [resolution, setResolution] = useState<WorkspaceResolution | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runBootValidation = () => {
    setIsRunning(true);
    bootValidator.clear();

    // Register known permissions (from responsibility templates)
    const knownPermissions = [
      'project.project.view',
      'procure.po.view',
      'store.stock.view',
      'bill.client.view',
      'finance.voucher.view',
      'qa.inspection.view',
      'admin.workspace.view',
    ];
    knownPermissions.forEach(p => bootValidator.registerPermission(p));

    // Register user permissions (deny-by-default interface)
    permissionInterface.registerUserPermissions('usr_001', [
      'project.project.view',
      'procure.po.view',
      'store.stock.view',
      'finance.voucher.view',
    ]);
    permissionInterface.registerUserProjects('usr_001', ['prj_001', 'prj_002']);
    permissionInterface.registerUserSites('usr_001', ['site_001', 'site_002']);

    // Register VALID tiles (should pass)
    const validTile1: TileContract = {
      code: 'tile-project-progress',
      owningModule: 'project',
      kpiCode: 'kpi-physical-progress',
      permissionKey: 'project.project.view',
      band: 'kpi',
      refreshEvents: ['project.progress.updated'],
      drillTarget: '/project/progress',
      deviceTiers: ['desktop', 'tablet', 'mobile'],
      emptyState: 'no_data',
      defaultPlacement: { order: 1, size: 'medium' },
      title: 'Physical Progress',
      enabled: true,
    };

    const validTile2: TileContract = {
      code: 'tile-po-pending',
      owningModule: 'procure',
      kpiCode: 'kpi-po-open',
      permissionKey: 'procure.po.view',
      band: 'kpi',
      refreshEvents: ['procure.po.released', 'procure.po.closed'],
      drillTarget: '/procurement/po',
      deviceTiers: ['desktop', 'tablet'],
      emptyState: 'no_data',
      defaultPlacement: { order: 2, size: 'small' },
      title: 'Open Purchase Orders',
      enabled: true,
    };

    // Register INVALID tile (missing fields - should fail)
    const invalidTile: TileContract = {
      code: 'tile-incomplete',
      owningModule: 'test',
      permissionKey: '', // Missing!
      band: 'kpi',
      refreshEvents: [], // Missing!
      drillTarget: '', // Missing!
      deviceTiers: [], // Missing!
      emptyState: 'no_data',
      defaultPlacement: { order: 99, size: 'small' },
      title: 'Incomplete Tile',
      enabled: true,
    };

    // Register ORPHAN tile (references unregistered KPI)
    const orphanTile: TileContract = {
      code: 'tile-orphan',
      owningModule: 'test',
      kpiCode: 'kpi-nonexistent', // Not registered!
      permissionKey: 'project.project.view',
      band: 'kpi',
      refreshEvents: ['test.event'],
      drillTarget: '/test',
      deviceTiers: ['desktop'],
      emptyState: 'no_data',
      defaultPlacement: { order: 100, size: 'small' },
      title: 'Orphan Tile',
      enabled: true,
    };

    bootValidator.registerTile(validTile1);
    bootValidator.registerTile(validTile2);
    bootValidator.registerTile(invalidTile);
    bootValidator.registerTile(orphanTile);

    // Register VALID KPI (all 10 governance fields present)
    const validKPI1: KPIGovernance = {
      code: 'kpi-physical-progress',
      source: 'project.progress',
      formula: 'Sum(certified_qty * rate) / Sum(boq_qty * rate) * 100',
      calculationPeriod: 'monthly',
      projectScope: 'active',
      organisationScope: 'company',
      permissionScope: 'project.project.view',
      refreshMechanism: 'scheduled',
      thresholds: { critical: 50, warning: 70, target: 90, excellent: 95 },
      statusLogic: 'higher_is_better',
      drillDownDestination: '/project/progress',
      label: 'Physical Progress',
      format: 'percentage',
      owningModule: 'project',
      registeredBy: 'system',
      registeredAt: new Date().toISOString(),
    };

    const validKPI2: KPIGovernance = {
      code: 'kpi-po-open',
      source: 'procure.po.count',
      formula: 'COUNT(po) WHERE status IN (RELEASED, PARTIALLY_EXECUTED)',
      calculationPeriod: 'real-time',
      projectScope: 'assigned',
      organisationScope: 'company',
      permissionScope: 'procure.po.view',
      refreshMechanism: 'realtime',
      thresholds: { warning: 10, critical: 20 },
      statusLogic: 'lower_is_better',
      drillDownDestination: '/procurement/po',
      label: 'Open POs',
      format: 'number',
      owningModule: 'procure',
      registeredBy: 'system',
      registeredAt: new Date().toISOString(),
    };

    // Register INVALID KPI (missing governance fields)
    const invalidKPI: KPIGovernance = {
      code: 'kpi-incomplete',
      source: 'test.source',
      formula: '', // Missing!
      calculationPeriod: 'daily',
      projectScope: 'all',
      organisationScope: 'company',
      permissionScope: 'test.view',
      refreshMechanism: 'scheduled',
      thresholds: {},
      statusLogic: 'higher_is_better',
      drillDownDestination: '/test',
      label: 'Incomplete KPI',
      format: 'number',
      owningModule: 'test',
      registeredBy: 'system',
      registeredAt: new Date().toISOString(),
    };

    bootValidator.registerKPI(validKPI1);
    bootValidator.registerKPI(validKPI2);
    bootValidator.registerKPI(invalidKPI);

    // Register tiles in resolver
    workspaceResolver.registerTile(validTile1);
    workspaceResolver.registerTile(validTile2);

    // Register KPIs in resolver
    workspaceResolver.registerKPI(validKPI1);
    workspaceResolver.registerKPI(validKPI2);

    // Run validation
    const result = bootValidator.validate();
    setValidationResult(result);

    // Run resolution
    const resolved = workspaceResolver.resolve('usr_001', 'prj_001', 'site_001', 'desktop');
    setResolution(resolved);

    setTimeout(() => setIsRunning(false), 500);
  };

  useEffect(() => {
    runBootValidation();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            Boot Validation & Workspace Resolution
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Demonstrates Rule WS-03 (KPI governance) and Rule WS-04 (orphan detection)
          </p>
        </div>
        <button
          onClick={runBootValidation}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Re-run Validation'}
        </button>
      </div>

      {validationResult && (
        <div className="space-y-4">
          {/* Validation Summary */}
          <div className={`p-4 rounded-lg border ${
            validationResult.passed 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {validationResult.passed ? (
                <CheckCircle2 size={20} className="text-emerald-600" />
              ) : (
                <XCircle size={20} className="text-red-600" />
              )}
              <span className={`font-semibold ${
                validationResult.passed ? 'text-emerald-800' : 'text-red-800'
              }`}>
                Boot Validation {validationResult.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-slate-600">Tiles:</span>{' '}
                <span className="font-semibold">{validationResult.registeredTiles}</span>
              </div>
              <div>
                <span className="text-slate-600">KPIs:</span>{' '}
                <span className="font-semibold">{validationResult.registeredKPIs}</span>
              </div>
              <div>
                <span className="text-slate-600">Errors:</span>{' '}
                <span className="font-semibold text-red-600">{validationResult.errors.length}</span>
              </div>
              <div>
                <span className="text-slate-600">Warnings:</span>{' '}
                <span className="font-semibold text-amber-600">{validationResult.warnings.length}</span>
              </div>
            </div>
          </div>

          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                <XCircle size={14} />
                Validation Errors ({validationResult.errors.length})
              </h3>
              <div className="space-y-1">
                {validationResult.errors.map((error, i) => (
                  <div key={i} className="text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
                    <span className="font-mono text-red-700">[{error.code}]</span>{' '}
                    <span className="text-slate-700">{error.message}</span>
                    {error.tileCode && <span className="text-slate-500"> (tile: {error.tileCode})</span>}
                    {error.kpiCode && <span className="text-slate-500"> (kpi: {error.kpiCode})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                <AlertTriangle size={14} />
                Warnings ({validationResult.warnings.length})
              </h3>
              <div className="space-y-1">
                {validationResult.warnings.map((warning, i) => (
                  <div key={i} className="text-xs bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <span className="font-mono text-amber-700">[{warning.code}]</span>{' '}
                    <span className="text-slate-700">{warning.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orphaned Tiles */}
          {validationResult.orphanedTiles.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Orphaned Tiles (unregistered KPIs)
              </h3>
              <div className="text-xs text-slate-600">
                {validationResult.orphanedTiles.join(', ')}
              </div>
            </div>
          )}

          {/* Workspace Resolution */}
          {resolution && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Workspace Resolution (user: usr_001, project: prj_001)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <span className="text-slate-600">Total Tiles:</span>{' '}
                  <span className="font-semibold">{resolution.totalTiles}</span>
                </div>
                <div>
                  <span className="text-slate-600">Permission Filtered:</span>{' '}
                  <span className="font-semibold text-amber-600">{resolution.permissionFilteredCount}</span>
                </div>
                <div>
                  <span className="text-slate-600">Bands:</span>{' '}
                  <span className="font-semibold">{resolution.bands.length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {resolution.bands.map((band, i) => (
                  <div key={i} className="bg-slate-50 rounded px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 uppercase">
                        {band.band.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">{band.tiles.length} tiles</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {band.tiles.map(tile => (
                        <span
                          key={tile.code}
                          className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5"
                        >
                          {tile.code}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
