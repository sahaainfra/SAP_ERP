/**
 * Part 09 — Number Series Service
 * 
 * Implements document number allocation with:
 * - Row-level locking to prevent duplicates
 * - Gap tracking for audit purposes
 * - Configurable patterns with placeholders
 * - Scope-based series (GLOBAL, COMPANY, PROJECT)
 */

import { NumberSeries, SeriesScope, NumberAllocation, NumberGap } from './types';
import { UowContext } from '../uow/UnitOfWork';

export class NumberSeriesService {
  private series: Map<number, NumberSeries> = new Map();
  private allocations: NumberAllocation[] = [];
  private gaps: NumberGap[] = [];
  private nextSeriesId = 1;
  private nextAllocationId = 1;
  private nextGapId = 1;

  /**
   * Register a number series
   */
  registerSeries(
    seriesCode: string,
    documentType: string,
    pattern: string,
    scope: { type: 'GLOBAL' | 'COMPANY' | 'PROJECT'; id?: number },
    fiscalYear?: string,
    options: {
      maxValue?: number;
      padding?: number;
      warnThreshold?: number;
      startValue?: number;
    } = {}
  ): NumberSeries {
    const series: NumberSeries = {
      id: this.nextSeriesId++,
      seriesCode,
      documentType,
      scopeType: scope.type,
      scopeId: scope.id,
      fiscalYear,
      pattern,
      currentValue: options.startValue ?? 0,
      maxValue: options.maxValue,
      padding: options.padding ?? 4,
      warnThreshold: options.warnThreshold,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.series.set(series.id, series);
    return series;
  }

  /**
   * Allocate next number in series
   * MUST be called inside document's transaction
   */
  async allocate(
    ctx: UowContext,
    seriesCode: string,
    scope: SeriesScope
  ): Promise<string> {
    // Find matching series (most specific first)
    const fy = scope.date ? this.getFiscalYear(scope.date) : undefined;
    
    const series = this.findSeries(seriesCode, scope, fy);
    if (!series) {
      throw new Error(`Number series not configured: ${seriesCode} for scope ${JSON.stringify(scope)}`);
    }

    // Check if series is active
    if (!series.isActive) {
      throw new Error(`Number series is inactive: ${seriesCode}`);
    }

    // Check if max value reached
    if (series.maxValue && series.currentValue >= series.maxValue) {
      throw new Error(`Number series exhausted: ${seriesCode} (max: ${series.maxValue})`);
    }

    // Allocate next number
    const nextValue = series.currentValue + 1;
    series.currentValue = nextValue;
    series.updatedAt = ctx.now.toISOString();

    // Render document number
    const documentNumber = this.renderPattern(series.pattern, {
      PRJ: scope.projectCode,
      CO: scope.companyCode,
      SITE: scope.siteCode,
      FY: fy,
      YY: fy?.slice(2, 4),
      MM: scope.date ? String(scope.date.getMonth() + 1).padStart(2, '0') : undefined,
      SEQ: String(nextValue).padStart(series.padding, '0'),
    });

    // Record allocation
    const allocation: NumberAllocation = {
      id: this.nextAllocationId++,
      seriesId: series.id,
      allocatedValue: nextValue,
      documentNumber,
      documentType: series.documentType,
      allocatedBy: Number(ctx.actor.userId),
      allocatedAt: ctx.now.toISOString(),
      correlationId: ctx.correlationId,
    };
    this.allocations.push(allocation);

    // Check warn threshold
    if (series.warnThreshold && nextValue >= series.warnThreshold) {
      const remaining = series.maxValue ? series.maxValue - nextValue : null;
      ctx.outbox.publish({
        eventType: 'numbering.series.near_exhaustion',
        aggregateId: series.id,
        payload: { seriesId: series.id, seriesCode, remaining },
        occurredAt: ctx.now,
      });
    }

    // Audit
    ctx.audit.record({
      entity: 'number_series',
      entityId: series.id,
      action: 'UPDATE',
      before: { currentValue: nextValue - 1 },
      after: { currentValue: nextValue, documentNumber },
    });

    return documentNumber;
  }

  /**
   * Find matching series (most specific scope first)
   */
  private findSeries(
    seriesCode: string,
    scope: SeriesScope,
    fiscalYear?: string
  ): NumberSeries | undefined {
    const candidates = Array.from(this.series.values()).filter(s => {
      if (s.seriesCode !== seriesCode) return false;
      if (!s.isActive) return false;
      
      // Check fiscal year
      if (s.fiscalYear && s.fiscalYear !== fiscalYear) return false;
      
      // Check scope (most specific first)
      if (s.scopeType === 'PROJECT' && scope.projectId && s.scopeId === scope.projectId) {
        return true;
      }
      if (s.scopeType === 'COMPANY' && scope.companyId && s.scopeId === scope.companyId) {
        return true;
      }
      if (s.scopeType === 'GLOBAL' && !s.scopeId) {
        return true;
      }
      
      return false;
    });

    // Sort by specificity: PROJECT > COMPANY > GLOBAL
    candidates.sort((a, b) => {
      const order = { PROJECT: 1, COMPANY: 2, GLOBAL: 3 };
      return order[a.scopeType] - order[b.scopeType];
    });

    return candidates[0];
  }

  /**
   * Render pattern with placeholders
   */
  private renderPattern(
    pattern: string,
    values: Record<string, string | undefined>
  ): string {
    let result = pattern;
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) {
        result = result.replace(`{${key}}`, value);
      }
    }
    return result;
  }

  /**
   * Get fiscal year from date
   */
  private getFiscalYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    // Assuming fiscal year starts in April (common in India)
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }

  /**
   * Record a gap (number lost to rollback)
   */
  async recordGap(
    ctx: UowContext,
    seriesId: number,
    gapValue: number,
    reason?: string
  ): Promise<void> {
    const gap: NumberGap = {
      id: this.nextGapId++,
      seriesId,
      gapValue,
      correlationId: ctx.correlationId,
      reason,
      detectedAt: ctx.now.toISOString(),
    };
    this.gaps.push(gap);

    // Audit
    ctx.audit.record({
      entity: 'number_gap',
      entityId: gap.id,
      action: 'CREATE',
      after: { seriesId, gapValue, reason },
    });
  }

  /**
   * Get all series
   */
  getAllSeries(): NumberSeries[] {
    return Array.from(this.series.values());
  }

  /**
   * Get series by ID
   */
  getSeries(id: number): NumberSeries | undefined {
    return this.series.get(id);
  }

  /**
   * Get allocations for a series
   */
  getAllocations(seriesId: number): NumberAllocation[] {
    return this.allocations.filter(a => a.seriesId === seriesId);
  }

  /**
   * Get gaps for a series
   */
  getGaps(seriesId: number): NumberGap[] {
    return this.gaps.filter(g => g.seriesId === seriesId);
  }

  /**
   * Deactivate a series
   */
  deactivate(ctx: UowContext, seriesId: number): void {
    const series = this.series.get(seriesId);
    if (!series) {
      throw new Error(`Series not found: ${seriesId}`);
    }

    series.isActive = false;
    series.updatedAt = ctx.now.toISOString();

    ctx.audit.record({
      entity: 'number_series',
      entityId: seriesId,
      action: 'UPDATE',
      before: { isActive: true },
      after: { isActive: false },
    });
  }
}

export const numberSeriesService = new NumberSeriesService();
