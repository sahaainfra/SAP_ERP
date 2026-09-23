/**
 * Part 11 — Valuation Service
 * 
 * Handles stock valuation methods for issue rate calculation.
 * Supports Weighted Average, FIFO, and Batch Specific valuation.
 */

import { ValuationMethod, IssueRateParams, FifoLayer } from './types';
import { PostingError } from './types';

export class ValuationService {
  private fifoLayers: Map<string, FifoLayer[]> = new Map();
  private lastInboundRates: Map<string, number> = new Map();
  private nextLayerId = 1;

  /**
   * Calculate issue rate based on valuation method
   */
  async issueRate(params: IssueRateParams): Promise<number> {
    switch (params.method) {
      case 'WEIGHTED_AVERAGE':
        return this.weightedAverageRate(params);
      
      case 'FIFO':
        return this.fifoRate(params);
      
      case 'BATCH_SPECIFIC':
        return this.batchSpecificRate(params);
      
      default:
        throw new PostingError('UNKNOWN_VALUATION_METHOD', { method: params.method });
    }
  }

  /**
   * Weighted Average valuation
   * Rate = Total Value / Total Quantity
   */
  private weightedAverageRate(params: IssueRateParams): number {
    // Zero or negative stock: fall back to last known inbound rate
    if (params.openQty <= 0) {
      const key = this.getRateKey(params.projectId, params.storeId, params.itemId, params.batchId);
      const lastRate = this.lastInboundRates.get(key);
      
      if (!lastRate) {
        throw new PostingError('NO_VALUATION_RATE_AVAILABLE', {
          itemId: params.itemId,
          storeId: params.storeId,
          reason: 'No stock and no previous inbound rate found',
        });
      }
      
      // Emit warning event (in production, would use outbox)
      console.warn('VALUATION_FALLBACK_RATE_USED', {
        itemId: params.itemId,
        storeId: params.storeId,
        rate: lastRate,
      });
      
      return lastRate;
    }

    // Calculate weighted average
    return params.openVal / params.openQty;
  }

  /**
   * FIFO (First In, First Out) valuation
   * Consumes oldest layers first
   */
  private async fifoRate(params: IssueRateParams): Promise<number> {
    const key = this.getLayerKey(params.projectId, params.storeId, params.itemId);
    const layers = this.fifoLayers.get(key) || [];

    if (layers.length === 0) {
      throw new PostingError('NO_FIFO_LAYERS_AVAILABLE', {
        itemId: params.itemId,
        storeId: params.storeId,
      });
    }

    // Sort by creation date (oldest first)
    const sortedLayers = [...layers].sort((a, b) => a.id - b.id);

    let remaining = params.qty;
    let totalValue = 0;

    for (const layer of sortedLayers) {
      if (remaining <= 0) break;

      const take = Math.min(remaining, layer.balanceQty);
      totalValue += take * layer.rate;
      remaining -= take;

      // Update layer (in production, would be persisted)
      layer.balanceQty -= take;
      layer.consumedQty += take;
    }

    if (remaining > 0) {
      throw new PostingError('INSUFFICIENT_FIFO_LAYERS', {
        itemId: params.itemId,
        storeId: params.storeId,
        shortfall: remaining,
      });
    }

    // Return weighted average of consumed layers
    return totalValue / params.qty;
  }

  /**
   * Batch Specific valuation
   * Uses the rate of the specific batch
   */
  private batchSpecificRate(params: IssueRateParams): number {
    if (!params.batchId) {
      throw new PostingError('BATCH_REQUIRED_FOR_VALUATION', {
        itemId: params.itemId,
      });
    }

    const key = this.getRateKey(params.projectId, params.storeId, params.itemId, params.batchId);
    const rate = this.lastInboundRates.get(key);

    if (!rate) {
      throw new PostingError('NO_BATCH_RATE_AVAILABLE', {
        itemId: params.itemId,
        batchId: params.batchId,
      });
    }

    return rate;
  }

  /**
   * Record an inbound movement (creates FIFO layer and updates last rate)
   */
  async recordInbound(
    projectId: number,
    storeId: number,
    itemId: number,
    batchId: number | undefined,
    qty: number,
    rate: number
  ): Promise<void> {
    // Update last inbound rate
    const rateKey = this.getRateKey(projectId, storeId, itemId, batchId);
    this.lastInboundRates.set(rateKey, rate);

    // Create FIFO layer
    const layerKey = this.getLayerKey(projectId, storeId, itemId);
    const layers = this.fifoLayers.get(layerKey) || [];

    layers.push({
      id: this.nextLayerId++,
      ledgerId: 0, // Would be set after ledger insert
      rate,
      originalQty: qty,
      balanceQty: qty,
      consumedQty: 0,
    });

    this.fifoLayers.set(layerKey, layers);
  }

  /**
   * Get last inbound rate for an item
   */
  async getLastInboundRate(
    projectId: number,
    storeId: number,
    itemId: number,
    batchId?: number
  ): Promise<number> {
    const key = this.getRateKey(projectId, storeId, itemId, batchId);
    const rate = this.lastInboundRates.get(key);

    if (!rate) {
      throw new PostingError('NO_INBOUND_RATE_FOUND', {
        itemId,
        storeId,
        batchId,
      });
    }

    return rate;
  }

  /**
   * Get open FIFO layers for an item
   */
  async getOpenFifoLayers(
    projectId: number,
    storeId: number,
    itemId: number
  ): Promise<FifoLayer[]> {
    const key = this.getLayerKey(projectId, storeId, itemId);
    const layers = this.fifoLayers.get(key) || [];
    return layers.filter(l => l.balanceQty > 0);
  }

  /**
   * Lock valuation method for an item category
   * Prevents changing method mid-year once movements exist
   */
  async lockValuationMethod(
    itemId: number,
    fiscalYear: string
  ): Promise<void> {
    // In production, would check if movements exist in the fiscal year
    // and lock the method to prevent changes
    console.log('VALUATION_METHOD_LOCKED', { itemId, fiscalYear });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private getRateKey(
    projectId: number,
    storeId: number,
    itemId: number,
    batchId?: number
  ): string {
    return `${projectId}:${storeId}:${itemId}:${batchId || 'none'}`;
  }

  private getLayerKey(
    projectId: number,
    storeId: number,
    itemId: number
  ): string {
    return `${projectId}:${storeId}:${itemId}`;
  }
}

export const valuationService = new ValuationService();
