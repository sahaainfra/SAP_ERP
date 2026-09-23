/**
 * Part 15 — KPI Service
 * 
 * Provides batched KPI queries over consumption views with:
 * - Permission filtering (Part 08)
 * - Batch endpoint (one request for many KPIs)
 * - Trend data
 * - Drill-down support
 * - Provenance tracking
 */

import {
  KpiDefinition,
  KpiRequest,
  KpiResult,
  KpiHealth,
  KpiValueType,
} from './types';
import { kpiEngine } from '../kpi/kpi-engine';

export class KpiService {
  private registry: Map<string, KpiDefinition> = new Map();

  /**
   * Register a KPI definition
   */
  registerKPI(definition: KpiDefinition): void {
    this.registry.set(definition.code, definition);
  }

  /**
   * Get KPI definition by code
   */
  getKPIDefinition(code: string): KpiDefinition | undefined {
    return this.registry.get(code);
  }

  /**
   * Get all registered KPIs
   */
  getAllKPIs(): KpiDefinition[] {
    return Array.from(this.registry.values());
  }

  /**
   * Batch endpoint - one request for many KPIs
   * This is the primary API for dashboards
   */
  async batch(actor: any, requests: KpiRequest[]): Promise<KpiResult[]> {
    // Filter by permission
    const allowed = requests.filter(req => {
      const def = this.registry.get(req.code);
      if (!def) return false;
      return actor.can(def.permission, req.projectId);
    });

    if (allowed.length === 0) {
      return [];
    }

    // Group by source view for efficient querying
    const bySource = this.groupBySource(allowed);

    // Execute queries (in production, would batch SQL queries)
    const results: KpiResult[] = [];
    for (const [sourceKey, group] of bySource.entries()) {
      const sourceResults = await this.querySource(sourceKey, group, actor);
      results.push(...sourceResults);
    }

    return results;
  }

  /**
   * Query a single KPI
   */
  async query(actor: any, request: KpiRequest): Promise<KpiResult | null> {
    const results = await this.batch(actor, [request]);
    return results[0] || null;
  }

  /**
   * Get KPI trend data
   */
  async getTrend(
    kpiCode: string,
    projectId: number,
    grain: 'DAY' | 'WEEK' | 'MONTH' = 'DAY',
    periods: number = 30
  ): Promise<Array<{ period: string; value: number }>> {
    // In production, would query dx_kpi_snapshot
    // For demo, return mock trend data
    const trend: Array<{ period: string; value: number }> = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now);
      if (grain === 'DAY') {
        date.setDate(date.getDate() - i);
      } else if (grain === 'WEEK') {
        date.setDate(date.getDate() - i * 7);
      } else {
        date.setMonth(date.getMonth() - i);
      }

      trend.push({
        period: date.toISOString().split('T')[0],
        value: Math.random() * 100,
      });
    }

    return trend;
  }

  /**
   * Resolve drill-down route
   */
  resolveDrill(kpiCode: string, context: Record<string, any>): { route: string; params: Record<string, string> } | null {
    const def = this.registry.get(kpiCode);
    if (!def || !def.drillTo) return null;

    const params: Record<string, string> = {};
    for (const [key, expr] of Object.entries(def.drillTo.params)) {
      params[key] = this.evaluateExpression(expr, context);
    }

    return {
      route: def.drillTo.route,
      params,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Group KPI requests by source for efficient querying
   */
  private groupBySource(requests: KpiRequest[]): Map<string, KpiRequest[]> {
    const groups = new Map<string, KpiRequest[]>();

    for (const req of requests) {
      const def = this.registry.get(req.code);
      if (!def) continue;

      const sourceKey = this.getSourceKey(def.source);
      if (!groups.has(sourceKey)) {
        groups.set(sourceKey, []);
      }
      groups.get(sourceKey)!.push(req);
    }

    return groups;
  }

  /**
   * Get source key for grouping
   */
  private getSourceKey(source: KpiDefinition['source']): string {
    if (source.kind === 'VIEW') {
      return `view:${source.view}`;
    } else if (source.kind === 'READ_MODEL') {
      return `read_model:${source.table}`;
    } else {
      return `expression:${source.expr}`;
    }
  }

  /**
   * Query a source for multiple KPIs
   */
  private async querySource(
    sourceKey: string,
    requests: KpiRequest[],
    actor: any
  ): Promise<KpiResult[]> {
    const results: KpiResult[] = [];

    for (const req of requests) {
      const def = this.registry.get(req.code);
      if (!def) continue;

      // In production, would execute SQL query against consumption view
      // For demo, delegate to KPI engine
      const kpiValue = await kpiEngine.computeKPI(
        def.code,
        { projectId: req.projectId, companyId: req.companyId },
        actor.userId,
        actor.permissions || []
      );

      const result = this.assembleResult(def, req, kpiValue);
      results.push(result);
    }

    return results;
  }

  /**
   * Assemble KPI result from raw value
   */
  private assembleResult(
    def: KpiDefinition,
    req: KpiRequest,
    kpiValue: any
  ): KpiResult {
    const value = kpiValue.value;
    const target = def.target ? this.evaluateTarget(def.target.expr, { value, ...req.context }) : null;
    const variance = target !== null ? this.computeVariance(value, target, def.target!.direction) : null;
    const health = this.evaluateHealth(value, target, def);

    const result: KpiResult = {
      code: def.code,
      label: def.label,
      value,
      formatted: this.formatValue(value, def.valueType),
      target: target || undefined,
      variance: variance || undefined,
      health,
      asOf: kpiValue.asOf || new Date().toISOString(),
      drillTo: def.drillTo ? this.resolveDrill(def.code, req.context || {}) || undefined : undefined,
      source: {
        view: this.getSourceKey(def.source),
        rowCount: kpiValue.rowCount || 0,
        refresh: def.refresh,
      },
    };

    // Add trend if requested
    if (req.includeTrend && def.trendGrain) {
      // In production, would fetch from snapshots
      result.trend = [];
    }

    return result;
  }

  /**
   * Evaluate target expression
   */
  private evaluateTarget(expr: string, context: Record<string, any>): number | null {
    // In production, would use expression evaluator
    // For demo, return mock target
    return context.value ? context.value * 1.1 : null;
  }

  /**
   * Compute variance between value and target
   */
  private computeVariance(
    value: number | null,
    target: number,
    direction: 'HIGHER_BETTER' | 'LOWER_BETTER'
  ): { value: number; percent: number } | null {
    if (value === null) return null;

    const diff = value - target;
    const percent = target !== 0 ? (diff / target) * 100 : 0;

    return {
      value: diff,
      percent: direction === 'HIGHER_BETTER' ? percent : -percent,
    };
  }

  /**
   * Evaluate health status
   */
  private evaluateHealth(
    value: number | null,
    target: number | null,
    def: KpiDefinition
  ): KpiHealth {
    if (value === null || target === null) return 'NEUTRAL';
    if (!def.thresholds) return 'NEUTRAL';

    const ratio = target !== 0 ? value / target : 0;

    // Parse thresholds (in production, would evaluate expressions)
    const criticalThreshold = parseFloat(def.thresholds.critical) || 0;
    const warningThreshold = parseFloat(def.thresholds.warning) || 0;

    if (ratio <= criticalThreshold) return 'CRITICAL';
    if (ratio <= warningThreshold) return 'WARNING';
    return 'GOOD';
  }

  /**
   * Format value based on type
   */
  private formatValue(value: number | null, type: KpiValueType): string {
    if (value === null) return '—';

    switch (type) {
      case 'MONEY':
        return `₹${value.toLocaleString('en-IN')}`;
      case 'QUANTITY':
        return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
      case 'PERCENT':
        return `${value.toFixed(1)}%`;
      case 'COUNT':
        return value.toLocaleString('en-IN');
      case 'DAYS':
        return `${value.toFixed(0)} days`;
      case 'RATIO':
        return value.toFixed(2);
      default:
        return String(value);
    }
  }

  /**
   * Evaluate simple expression (placeholder)
   */
  private evaluateExpression(expr: string, context: Record<string, any>): string {
    // In production, would use expression evaluator
    // For demo, simple variable substitution
    return expr.replace(/\{(\w+)\}/g, (_, key) => String(context[key] || ''));
  }
}

export const kpiService = new KpiService();
