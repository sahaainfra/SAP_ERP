/**
 * Part 12 — UoM Conversion Service
 * 
 * Handles unit of measure conversions with proper validation.
 * Supports direct conversions, inverse conversions, and single-hop conversions.
 * Never infers or defaults to 1 — missing conversions block the transaction.
 */

import Decimal from 'decimal.js';

export interface UomConversion {
  id: number;
  fromUom: string;
  toUom: string;
  factor: Decimal;
  itemId?: number | null; // null = global conversion
  isActive: boolean;
}

export class UomConversionError extends Error {
  constructor(
    public fromUom: string,
    public toUom: string,
    public itemId?: number
  ) {
    super(`UOM_CONVERSION_MISSING: No conversion from ${fromUom} to ${toUom}${itemId ? ` for item ${itemId}` : ''}`);
    this.name = 'UomConversionError';
  }
}

export class UomService {
  private conversions: UomConversion[] = [];
  private nextId = 1;

  /**
   * Register a UoM conversion
   */
  registerConversion(
    fromUom: string,
    toUom: string,
    factor: number | string | Decimal,
    itemId?: number | null
  ): UomConversion {
    const conversion: UomConversion = {
      id: this.nextId++,
      fromUom,
      toUom,
      factor: new Decimal(factor),
      itemId: itemId ?? null,
      isActive: true,
    };
    this.conversions.push(conversion);
    return conversion;
  }

  /**
   * Convert a quantity from one UoM to another
   * 
   * Resolution order:
   * 1. Item-specific direct conversion
   * 2. Global direct conversion
   * 3. Item-specific inverse conversion
   * 4. Global inverse conversion
   * 5. Single-hop conversion (via base unit)
   * 
   * Never infers or defaults to 1 — missing conversion throws error.
   */
  async convert(
    qty: Decimal | number,
    fromUom: string,
    toUom: string,
    itemId?: number
  ): Promise<Decimal> {
    const quantity = new Decimal(qty);

    // Same UoM — no conversion needed
    if (fromUom === toUom) {
      return quantity;
    }

    // 1. Item-specific direct conversion
    if (itemId !== undefined) {
      const direct = this.findConversion(fromUom, toUom, itemId);
      if (direct) {
        return quantity.times(direct.factor);
      }
    }

    // 2. Global direct conversion
    const globalDirect = this.findConversion(fromUom, toUom, null);
    if (globalDirect) {
      return quantity.times(globalDirect.factor);
    }

    // 3. Item-specific inverse conversion
    if (itemId !== undefined) {
      const inverse = this.findConversion(toUom, fromUom, itemId);
      if (inverse) {
        return quantity.div(inverse.factor);
      }
    }

    // 4. Global inverse conversion
    const globalInverse = this.findConversion(toUom, fromUom, null);
    if (globalInverse) {
      return quantity.div(globalInverse.factor);
    }

    // 5. Single-hop conversion (via base unit)
    const hop = await this.findSingleHop(fromUom, toUom, itemId);
    if (hop) {
      return quantity.times(hop.f1).times(hop.f2);
    }

    // No conversion found — block the transaction
    throw new UomConversionError(fromUom, toUom, itemId);
  }

  /**
   * Find a direct conversion factor
   */
  private findConversion(
    fromUom: string,
    toUom: string,
    itemId: number | null | undefined
  ): UomConversion | null {
    return this.conversions.find(c => 
      c.fromUom === fromUom &&
      c.toUom === toUom &&
      c.isActive &&
      (itemId === null || itemId === undefined 
        ? c.itemId === null 
        : c.itemId === itemId || c.itemId === null)
    ) || null;
  }

  /**
   * Find a single-hop conversion via a base unit
   * Only allows one intermediate step — multi-hop chains are refused
   */
  private async findSingleHop(
    fromUom: string,
    toUom: string,
    itemId?: number
  ): Promise<{ f1: Decimal; f2: Decimal } | null> {
    // Find all UoMs that both fromUom and toUom can convert to/from
    const fromConversions = this.conversions.filter(c => 
      c.isActive && (c.fromUom === fromUom || c.toUom === fromUom)
    );

    const toConversions = this.conversions.filter(c => 
      c.isActive && (c.fromUom === toUom || c.toUom === toUom)
    );

    // Find common intermediate UoM
    for (const fromConv of fromConversions) {
      const intermediateUom = fromConv.fromUom === fromUom ? fromConv.toUom : fromConv.fromUom;
      
      for (const toConv of toConversions) {
        const toIntermediateUom = toConv.fromUom === toUom ? toConv.toUom : toConv.fromUom;
        
        if (intermediateUom === toIntermediateUom) {
          // Found a single-hop path
          const f1 = fromConv.fromUom === fromUom 
            ? fromConv.factor 
            : new Decimal(1).div(fromConv.factor);
          const f2 = toConv.toUom === toUom 
            ? toConv.factor 
            : new Decimal(1).div(toConv.factor);
          
          return { f1, f2 };
        }
      }
    }

    return null;
  }

  /**
   * Get all conversions for a UoM
   */
  getConversionsForUom(uom: string): UomConversion[] {
    return this.conversions.filter(c => 
      c.isActive && (c.fromUom === uom || c.toUom === uom)
    );
  }

  /**
   * Check if a conversion exists
   */
  hasConversion(fromUom: string, toUom: string, itemId?: number): boolean {
    try {
      // Try to find any conversion path (we don't actually convert, just check)
      if (fromUom === toUom) return true;
      
      const direct = this.findConversion(fromUom, toUom, itemId) ||
                     this.findConversion(fromUom, toUom, null) ||
                     this.findConversion(toUom, fromUom, itemId) ||
                     this.findConversion(toUom, fromUom, null);
      
      return direct !== null;
    } catch {
      return false;
    }
  }

  /**
   * Seed common construction UoM conversions
   */
  seedCommonConversions(): void {
    // Length
    this.registerConversion('MM', 'M', 0.001);
    this.registerConversion('CM', 'M', 0.01);
    this.registerConversion('KM', 'M', 1000);
    this.registerConversion('FT', 'M', 0.3048);
    this.registerConversion('IN', 'M', 0.0254);
    
    // Weight
    this.registerConversion('MG', 'KG', 0.000001);
    this.registerConversion('G', 'KG', 0.001);
    this.registerConversion('TON', 'KG', 1000);
    this.registerConversion('MT', 'KG', 1000);
    this.registerConversion('LB', 'KG', 0.453592);
    
    // Volume
    this.registerConversion('ML', 'L', 0.001);
    this.registerConversion('CL', 'L', 0.01);
    this.registerConversion('MLD', 'L', 1000); // Megaliters
    this.registerConversion('GAL', 'L', 3.78541);
    this.registerConversion('CUM', 'L', 1000); // Cubic meters
    this.registerConversion('CUFT', 'L', 28.3168);
    
    // Area
    this.registerConversion('SQMM', 'SQM', 0.000001);
    this.registerConversion('SQCM', 'SQM', 0.0001);
    this.registerConversion('SQFT', 'SQM', 0.092903);
    this.registerConversion('ACRE', 'SQM', 4046.86);
    this.registerConversion('HECTARE', 'SQM', 10000);
    
    // Count
    this.registerConversion('DOZ', 'NOS', 12);
    this.registerConversion('GROSS', 'NOS', 144);
    
    // Time
    this.registerConversion('SEC', 'MIN', 1/60);
    this.registerConversion('MIN', 'HR', 1/60);
    this.registerConversion('HR', 'DAY', 1/8); // 8-hour work day
    this.registerConversion('DAY', 'WK', 1/7);
  }
}

export const uomService = new UomService();

// Seed common conversions
uomService.seedCommonConversions();
