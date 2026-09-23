/**
 * Part 14 — KPI Engine Service
 * 
 * Core KPI computation engine with:
 * - Permission-filtered computation
 * - Event-driven cache invalidation
 * - Batched KPI endpoint
 * - Threshold evaluation and status logic
 * - Drill-down support
 */

import {
  KPIDefinition,
  KPIValue,
  KPIBatchRequest,
  KPIBatchResponse,
  KPIStatus,
  KPISnapshot,
  KPISeedData,
} from './types';
import { eventBus } from '../realtime/event-bus';
import { DomainEvent, EventType } from '../realtime/types';

export class KPIEngine {
  private definitions: Map<string, KPIDefinition> = new Map();
  private cache: Map<string, { value: KPIValue; expiresAt: number }> = new Map();
  private snapshots: Map<string, KPISnapshot[]> = new Map();
  private eventSubscriptions: Map<string, string[]> = new Map(); // kpiKey -> eventTypes

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Register a KPI definition
   */
  registerKPI(definition: KPIDefinition): void {
    this.definitions.set(definition.kpiKey, definition);
  }

  /**
   * Map events to KPIs for invalidation
   */
  mapEventToKPI(eventType: string, kpiKey: string): void {
    if (!this.eventSubscriptions.has(kpiKey)) {
      this.eventSubscriptions.set(kpiKey, []);
    }
    this.eventSubscriptions.get(kpiKey)!.push(eventType);
  }

  /**
   * Compute a single KPI value with permission filtering
   */
  async computeKPI(
    kpiKey: string,
    scope: { companyId?: number; projectId?: number; siteId?: number },
    userId: number,
    userPermissions: string[]
  ): Promise<KPIValue> {
    const definition = this.definitions.get(kpiKey);
    if (!definition) {
      throw new Error(`KPI not found: ${kpiKey}`);
    }

    // Check permission
    if (!userPermissions.includes(definition.requiredPermission)) {
      throw new Error(`Permission denied: ${definition.requiredPermission}`);
    }

    // Check cache
    const cacheKey = this.buildCacheKey(kpiKey, scope, userId);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Compute value (in production, this would query the database)
    const startTime = Date.now();
    const value = await this.executeQuery(definition, scope);
    const computeMs = Date.now() - startTime;

    // Evaluate status
    const status = this.evaluateStatus(definition, value);

    const kpiValue: KPIValue = {
      kpiKey,
      value,
      targetValue: definition.targetSource ? await this.getTargetValue(definition, scope) : undefined,
      status,
      unit: definition.unit,
      asOf: new Date().toISOString(),
      isPartial: false,
      rowCount: 1, // In production, would be actual row count
      computeMs,
      drillRoute: definition.drillRoute,
    };

    // Cache the result
    this.cache.set(cacheKey, {
      value: kpiValue,
      expiresAt: Date.now() + definition.cacheTtlSeconds * 1000,
    });

    // Store snapshot for trends
    this.storeSnapshot(kpiKey, scope, kpiValue);

    return kpiValue;
  }

  /**
   * Compute multiple KPIs in a single batch
   */
  async computeBatch(request: KPIBatchRequest, userId: number, userPermissions: string[]): Promise<KPIBatchResponse> {
    const values: Record<string, KPIValue> = {};

    for (const kpiKey of request.kpiKeys) {
      try {
        values[kpiKey] = await this.computeKPI(kpiKey, request.scope, userId, userPermissions);
      } catch (error) {
        // Return null for failed KPIs
        values[kpiKey] = {
          kpiKey,
          value: null,
          status: 'neutral',
          asOf: new Date().toISOString(),
          isPartial: true,
          rowCount: 0,
          computeMs: 0,
        };
      }
    }

    return {
      values,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Get KPI history from snapshots
   */
  getKPIHistory(
    kpiKey: string,
    scope: { companyId?: number; projectId?: number; siteId?: number },
    limit: number = 30
  ): KPISnapshot[] {
    const key = this.buildSnapshotKey(kpiKey, scope);
    const snapshots = this.snapshots.get(key) || [];
    return snapshots.slice(-limit);
  }

  /**
   * Invalidate KPI cache on event
   */
  invalidateKPI(event: DomainEvent): void {
    for (const [kpiKey, eventTypes] of this.eventSubscriptions.entries()) {
      if (eventTypes.includes(event.eventType)) {
        // Clear all cache entries for this KPI
        for (const cacheKey of this.cache.keys()) {
          if (cacheKey.startsWith(`kpi:${kpiKey}:`)) {
            this.cache.delete(cacheKey);
          }
        }

        // Emit KPI update event
        eventBus.publish({
          eventId: `kpi_update_${Date.now()}`,
          eventType: 'kpi.invalidated',
          occurredAt: new Date().toISOString(),
          actorUserId: event.actorUserId,
          entityType: 'kpi',
          entityId: 0,
          scope: event.scope,
          payload: { kpiKey },
          version: 1,
        });
      }
    }
  }

  /**
   * Seed KPI definitions
   */
  seedKPIs(seedData: KPISeedData[]): void {
    for (const data of seedData) {
      const definition: KPIDefinition = {
        id: this.definitions.size + 1,
        ...data,
        thresholdType: 'PERCENT_OF_TARGET',
        cacheTtlSeconds: 300,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.registerKPI(definition);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private setupEventListeners(): void {
    // Subscribe to all events for KPI invalidation
    eventBus.subscribe({
      handler: (event) => this.invalidateKPI(event),
    });
  }

  private buildCacheKey(
    kpiKey: string,
    scope: { companyId?: number; projectId?: number; siteId?: number },
    userId: number
  ): string {
    const scopeHash = this.hashScope(scope, userId);
    return `kpi:${kpiKey}:${scopeHash}`;
  }

  private buildSnapshotKey(
    kpiKey: string,
    scope: { companyId?: number; projectId?: number; siteId?: number }
  ): string {
    return `${kpiKey}:${scope.companyId || 0}:${scope.projectId || 0}:${scope.siteId || 0}`;
  }

  private hashScope(
    scope: { companyId?: number; projectId?: number; siteId?: number },
    userId: number
  ): string {
    // Simple hash for demo - in production, use proper hashing
    return `${scope.companyId || 0}_${scope.projectId || 0}_${scope.siteId || 0}_${userId}`;
  }

  private async executeQuery(
    definition: KPIDefinition,
    scope: { companyId?: number; projectId?: number; siteId?: number }
  ): Promise<number> {
    // In production, this would execute the source definition query
    // For demo, return mock values based on KPI key
    const mockValues: Record<string, number> = {
      'project.physical_progress': 67.5,
      'project.cost_variance': -5.2,
      'procurement.po_pending_count': 14,
      'procurement.po_value_approved': 2450000,
      'store.stock_value': 8450000,
      'store.low_stock_count': 7,
      'billing.certified_value': 12500000,
      'billing.pending_count': 3,
      'finance.cash_position': 3200000,
      'hr.headcount': 342,
      'hr.attendance_percent': 94.5,
    };

    return mockValues[definition.kpiKey] || Math.random() * 100;
  }

  private async getTargetValue(
    definition: KPIDefinition,
    scope: { companyId?: number; projectId?: number; siteId?: number }
  ): Promise<number | undefined> {
    // In production, would fetch from budget/contract/plan
    if (!definition.targetSource || definition.targetSource === 'NONE') {
      return undefined;
    }

    const mockTargets: Record<string, number> = {
      'project.physical_progress': 75,
      'project.cost_variance': 0,
      'procurement.po_value_approved': 3000000,
      'billing.certified_value': 15000000,
      'finance.cash_position': 5000000,
    };

    return mockTargets[definition.kpiKey];
  }

  private evaluateStatus(definition: KPIDefinition, value: number | null): KPIStatus {
    if (value === null) {
      return 'neutral';
    }

    const target = definition.targetSource ? 100 : undefined; // Simplified
    if (!target) {
      return 'neutral';
    }

    const ratio = value / target;

    switch (definition.goodDirection) {
      case 'UP':
        if (ratio >= (definition.thresholdGreen || 90)) return 'good';
        if (ratio >= (definition.thresholdAmber || 70)) return 'warning';
        return 'critical';

      case 'DOWN':
        if (ratio <= (definition.thresholdGreen || 10)) return 'good';
        if (ratio <= (definition.thresholdAmber || 30)) return 'warning';
        return 'critical';

      case 'TARGET':
        const deviation = Math.abs(ratio - 1);
        if (deviation <= 0.1) return 'good';
        if (deviation <= 0.2) return 'warning';
        return 'critical';

      default:
        return 'neutral';
    }
  }

  private storeSnapshot(
    kpiKey: string,
    scope: { companyId?: number; projectId?: number; siteId?: number },
    value: KPIValue
  ): void {
    const key = this.buildSnapshotKey(kpiKey, scope);
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, []);
    }

    const snapshot: KPISnapshot = {
      id: this.snapshots.get(key)!.length + 1,
      kpiKey,
      companyId: scope.companyId,
      projectId: scope.projectId,
      siteId: scope.siteId,
      value: value.value,
      targetValue: value.targetValue,
      computedAt: value.asOf,
      computeMs: value.computeMs,
      rowCount: value.rowCount,
    };

    const snapshots = this.snapshots.get(key)!;
    snapshots.push(snapshot);

    // Keep only last 100 snapshots
    if (snapshots.length > 100) {
      snapshots.shift();
    }
  }
}

export const kpiEngine = new KPIEngine();
