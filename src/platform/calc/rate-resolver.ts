/**
 * Part 12 — Rate Resolver
 * 
 * Resolves effective-dated rates from the rate master.
 * Single authority for every rate in the system.
 * Scope precedence: RATE_CONTRACT > PROJECT > VENDOR > COMPANY > GLOBAL
 */

import Decimal from 'decimal.js';
import { Money } from './money';

export type RateScopeType = 'RATE_CONTRACT' | 'PROJECT' | 'VENDOR' | 'COMPANY' | 'GLOBAL';

export interface RateQuery {
  rateType: string;
  referenceType: string;
  referenceId: number;
  referenceCode?: string;
  asOfDate: Date;
  rateContractId?: number;
  projectId?: number;
  vendorId?: number;
  companyId?: number;
}

export interface ResolvedRate {
  rate: Decimal;
  uom: string;
  currency: string;
  rateSourceId: number;
  scopeType: RateScopeType;
  effectiveFrom: string;
  sourceDocument?: string;
}

export interface RateMasterRow {
  id: number;
  rateType: string;
  referenceType: string;
  referenceId: number;
  scopeType: RateScopeType;
  scopeId?: number;
  rate: string;
  uom: string;
  currencyCode: string;
  effectiveFrom: string;
  effectiveTo?: string;
  approvalStatus: string;
  sourceDocument?: string;
}

export class RateNotFoundError extends Error {
  constructor(
    public rateType: string,
    public referenceCode: string,
    public asOfDate: string
  ) {
    super(`RATE_NOT_FOUND: ${rateType} for ${referenceCode} as of ${asOfDate}`);
    this.name = 'RateNotFoundError';
  }
}

export class RateResolver {
  private static readonly SCOPE_ORDER: RateScopeType[] = [
    'RATE_CONTRACT',
    'PROJECT',
    'VENDOR',
    'COMPANY',
    'GLOBAL',
  ];

  private rateMaster: RateMasterRow[] = [];
  private cache: Map<string, ResolvedRate> = new Map();
  private nextId = 1;

  /**
   * Resolve a rate for the given query
   * 
   * Resolution order:
   * 1. Rate contract scope
   * 2. Project scope
   * 3. Vendor scope
   * 4. Company scope
   * 5. Global scope
   * 
   * Within each scope, finds the most recent effective rate as of the query date.
   */
  async resolve(query: RateQuery): Promise<ResolvedRate> {
    const cacheKey = this.buildCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const asOfDateStr = this.formatDate(query.asOfDate);

    // Find all applicable rates
    const applicableRates = this.rateMaster.filter(row => {
      // Must match rate type and reference
      if (row.rateType !== query.rateType) return false;
      if (row.referenceType !== query.referenceType) return false;
      if (row.referenceId !== query.referenceId) return false;

      // Must be approved
      if (row.approvalStatus !== 'APPROVED') return false;

      // Must be effective as of the query date
      if (row.effectiveFrom > asOfDateStr) return false;
      if (row.effectiveTo && row.effectiveTo < asOfDateStr) return false;

      // Check scope
      if (row.scopeType === 'RATE_CONTRACT' && row.scopeId !== query.rateContractId) return false;
      if (row.scopeType === 'PROJECT' && row.scopeId !== query.projectId) return false;
      if (row.scopeType === 'VENDOR' && row.scopeId !== query.vendorId) return false;
      if (row.scopeType === 'COMPANY' && row.scopeId !== query.companyId) return false;
      // GLOBAL scope has no scopeId check

      return true;
    });

    // Sort by scope precedence, then by effective date (most recent first)
    applicableRates.sort((a, b) => {
      const scopeA = RateResolver.SCOPE_ORDER.indexOf(a.scopeType);
      const scopeB = RateResolver.SCOPE_ORDER.indexOf(b.scopeType);
      if (scopeA !== scopeB) return scopeA - scopeB;
      return b.effectiveFrom.localeCompare(a.effectiveFrom);
    });

    // Take the first matching rate (highest scope precedence, most recent)
    const rateRow = applicableRates[0];

    if (!rateRow) {
      throw new RateNotFoundError(
        query.rateType,
        query.referenceCode || String(query.referenceId),
        asOfDateStr
      );
    }

    const resolved: ResolvedRate = {
      rate: new Decimal(rateRow.rate),
      uom: rateRow.uom,
      currency: rateRow.currencyCode,
      rateSourceId: rateRow.id,
      scopeType: rateRow.scopeType,
      effectiveFrom: rateRow.effectiveFrom,
      sourceDocument: rateRow.sourceDocument,
    };

    // Cache with TTL (10 minutes)
    this.cache.set(cacheKey, resolved);
    setTimeout(() => this.cache.delete(cacheKey), 10 * 60 * 1000);

    return resolved;
  }

  /**
   * Add a rate to the rate master
   */
  addRate(rate: Omit<RateMasterRow, 'id'>): RateMasterRow {
    const rateRow: RateMasterRow = {
      ...rate,
      id: this.nextId++,
    };
    this.rateMaster.push(rateRow);
    
    // Invalidate cache for this reference
    this.invalidateCache(rate.rateType, rate.referenceType, rate.referenceId);
    
    return rateRow;
  }

  /**
   * Invalidate cache for a specific rate reference
   */
  invalidateCache(rateType: string, referenceType: string, referenceId: number): void {
    // Remove all cache entries that match this reference
    for (const key of this.cache.keys()) {
      if (key.includes(`${rateType}:${referenceType}:${referenceId}`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Build cache key from query
   */
  private buildCacheKey(query: RateQuery): string {
    const parts = [
      query.rateType,
      query.referenceType,
      query.referenceId,
      query.projectId ?? 0,
      query.vendorId ?? 0,
      this.formatDate(query.asOfDate),
    ];
    return `rate:${parts.join(':')}`;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get all rates for a reference (for debugging/audit)
   */
  getRateHistory(rateType: string, referenceType: string, referenceId: number): RateMasterRow[] {
    return this.rateMaster
      .filter(r => 
        r.rateType === rateType &&
        r.referenceType === referenceType &&
        r.referenceId === referenceId
      )
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  }
}

export const rateResolver = new RateResolver();
