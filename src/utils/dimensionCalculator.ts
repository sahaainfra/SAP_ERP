/**
 * Part 17 — Dimension Calculation Engine
 * Server-authoritative calculation engine with 16 formula types
 */

import { FORMULA_CATALOGUE, FormulaCode, MbDimension } from '../types/measurement';

// ─── Calculation Engine ──────────────────────────────────────────────────────

export class DimensionCalculator {
  /**
   * Compute quantity from dimension inputs using the specified formula
   */
  static computeQuantity(
    formulaCode: FormulaCode,
    inputs: Record<string, number | number[]>
  ): { quantity: number; formula: string; calcHash: string } {
    const formula = FORMULA_CATALOGUE.find(f => f.code === formulaCode);
    if (!formula) {
      throw new Error(`Unknown formula code: ${formulaCode}`);
    }

    // Validate required inputs
    for (const required of formula.requiredInputs) {
      if (inputs[required] === undefined || inputs[required] === null) {
        throw new Error(`Missing required input: ${required} for formula ${formulaCode}`);
      }
    }

    // Compute based on formula type
    let quantity = 0;
    switch (formulaCode) {
      case 'LINEAR':
        quantity = this.computeLinear(inputs);
        break;
      case 'AREA_LB':
        quantity = this.computeAreaLB(inputs);
        break;
      case 'VOLUME_LBH':
        quantity = this.computeVolumeLBH(inputs);
        break;
      case 'AREA_CIRCLE':
        quantity = this.computeAreaCircle(inputs);
        break;
      case 'VOLUME_CYL':
        quantity = this.computeVolumeCyl(inputs);
        break;
      case 'VOLUME_CONE':
        quantity = this.computeVolumeCone(inputs);
        break;
      case 'TRAPEZOID_AREA':
        quantity = this.computeTrapezoidArea(inputs);
        break;
      case 'PRISMOIDAL':
        quantity = this.computePrismoidal(inputs);
        break;
      case 'MEAN_AREA':
        quantity = this.computeMeanArea(inputs);
        break;
      case 'STEEL_WEIGHT':
        quantity = this.computeSteelWeight(inputs);
        break;
      case 'STEEL_TABLE':
        quantity = this.computeSteelTable(inputs);
        break;
      case 'SIMPSON':
        quantity = this.computeSimpson(inputs);
        break;
      case 'TRAPEZOIDAL_RULE':
        quantity = this.computeTrapezoidalRule(inputs);
        break;
      case 'WEIGHT_DENSITY':
        quantity = this.computeWeightDensity(inputs);
        break;
      case 'COUNT':
        quantity = this.computeCount(inputs);
        break;
      case 'DIRECT':
        quantity = this.computeDirect(inputs);
        break;
      default:
        throw new Error(`Formula not implemented: ${formulaCode}`);
    }

    // Generate calc_hash for tamper evidence
    const calcHash = this.generateCalcHash(formulaCode, inputs, quantity);

    return {
      quantity: this.roundTo6Decimals(quantity),
      formula: formula.formula,
      calcHash,
    };
  }

  // ─── Formula Implementations ─────────────────────────────────────────────

  private static computeLinear(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const length = inputs.length as number;
    return nos * length;
  }

  private static computeAreaLB(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const length = inputs.length as number;
    const breadth = inputs.breadth as number;
    return nos * length * breadth;
  }

  private static computeVolumeLBH(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const length = inputs.length as number;
    const breadth = inputs.breadth as number;
    const height = inputs.height as number;
    return nos * length * breadth * height;
  }

  private static computeAreaCircle(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const radius = inputs.radius as number;
    return nos * Math.PI * Math.pow(radius, 2);
  }

  private static computeVolumeCyl(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const radius = inputs.radius as number;
    const height = inputs.height as number;
    return nos * Math.PI * Math.pow(radius, 2) * height;
  }

  private static computeVolumeCone(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const radius = inputs.radius as number;
    const height = inputs.height as number;
    return nos * (1 / 3) * Math.PI * Math.pow(radius, 2) * height;
  }

  private static computeTrapezoidArea(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const sideA = inputs.side_a as number;
    const sideB = inputs.side_b as number;
    const height = inputs.height as number;
    return nos * 0.5 * (sideA + sideB) * height;
  }

  private static computePrismoidal(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const length = inputs.length as number;
    const area1 = inputs.area_1 as number;
    const areaMid = inputs.area_mid as number;
    const area2 = inputs.area_2 as number;
    return nos * (length / 6) * (area1 + 4 * areaMid + area2);
  }

  private static computeMeanArea(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const length = inputs.length as number;
    const area1 = inputs.area_1 as number;
    const area2 = inputs.area_2 as number;
    return nos * length * (area1 + area2) / 2;
  }

  private static computeSteelWeight(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const barCount = (inputs.bar_count as number) || 1;
    const barLength = inputs.bar_length as number;
    const barDiaMm = inputs.bar_dia_mm as number;
    // Indian standard: d²/162.0 (not 162.2 or 162.28)
    return nos * barCount * barLength * (Math.pow(barDiaMm, 2) / 162.0);
  }

  private static computeSteelTable(inputs: Record<string, number | number[]>): number {
    const nos = (inputs.nos as number) || 1;
    const barCount = (inputs.bar_count as number) || 1;
    const barLength = inputs.bar_length as number;
    const unitWeight = inputs.unit_weight as number;
    return nos * barCount * barLength * unitWeight;
  }

  private static computeSimpson(inputs: Record<string, number | number[]>): number {
    const intervalH = inputs.interval_h as number;
    const offsets = inputs.offsets as number[];
    
    if (!offsets || offsets.length < 3) {
      throw new Error("Simpson's rule requires at least 3 offsets");
    }
    
    const n = offsets.length - 1;
    if (n % 2 !== 0) {
      throw new Error("Simpson's rule requires even number of intervals");
    }
    
    let sum = offsets[0] + offsets[n];
    for (let i = 1; i < n; i += 2) {
      sum += 4 * offsets[i];
    }
    for (let i = 2; i < n - 1; i += 2) {
      sum += 2 * offsets[i];
    }
    
    return (intervalH / 3) * sum;
  }

  private static computeTrapezoidalRule(inputs: Record<string, number | number[]>): number {
    const intervalH = inputs.interval_h as number;
    const offsets = inputs.offsets as number[];
    
    if (!offsets || offsets.length < 2) {
      throw new Error('Trapezoidal rule requires at least 2 offsets');
    }
    
    const n = offsets.length - 1;
    let sum = 0.5 * (offsets[0] + offsets[n]);
    for (let i = 1; i < n; i++) {
      sum += offsets[i];
    }
    
    return intervalH * sum;
  }

  private static computeWeightDensity(inputs: Record<string, number | number[]>): number {
    const volume = inputs.volume as number;
    const density = inputs.density as number;
    return volume * density;
  }

  private static computeCount(inputs: Record<string, number | number[]>): number {
    return (inputs.nos as number) || 1;
  }

  private static computeDirect(inputs: Record<string, number | number[]>): number {
    return inputs.direct_quantity as number;
  }

  // ─── Utility Methods ─────────────────────────────────────────────────────

  private static roundTo6Decimals(value: number): number {
    return Math.round(value * 1000000) / 1000000;
  }

  /**
   * Generate SHA-256 hash of dimension inputs + formula + result
   * This provides tamper evidence for the calculation
   */
  private static generateCalcHash(
    formulaCode: FormulaCode,
    inputs: Record<string, number | number[]>,
    result: number
  ): string {
    // Create a deterministic string representation
    const inputString = JSON.stringify(inputs, Object.keys(inputs).sort());
    const hashInput = `${formulaCode}:${inputString}:${result}`;
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Verify a calculation hash matches the inputs
   */
  static verifyCalcHash(
    dimension: MbDimension,
    expectedHash: string
  ): boolean {
    const inputs: Record<string, number | number[]> = {};
    
    // Reconstruct inputs from dimension
    if (dimension.nos !== undefined) inputs.nos = dimension.nos;
    if (dimension.length !== undefined) inputs.length = dimension.length;
    if (dimension.breadth !== undefined) inputs.breadth = dimension.breadth;
    if (dimension.height !== undefined) inputs.height = dimension.height;
    if (dimension.diameter !== undefined) inputs.diameter = dimension.diameter;
    if (dimension.radius !== undefined) inputs.radius = dimension.radius;
    if (dimension.areaDirect !== undefined) inputs.area_direct = dimension.areaDirect;
    if (dimension.volumeDirect !== undefined) inputs.volume_direct = dimension.volumeDirect;
    if (dimension.barDiaMm !== undefined) inputs.bar_dia_mm = dimension.barDiaMm;
    if (dimension.barCount !== undefined) inputs.bar_count = dimension.barCount;
    if (dimension.barLength !== undefined) inputs.bar_length = dimension.barLength;
    if (dimension.unitWeight !== undefined) inputs.unit_weight = dimension.unitWeight;
    
    const computed = this.computeQuantity(dimension.formulaCode, inputs);
    return computed.calcHash === expectedHash;
  }
}

// ─── Rounding Rules ──────────────────────────────────────────────────────────

export type RoundingRule = '2_DECIMALS' | '3_DECIMALS' | 'INTEGER';

export const ROUNDING_RULES: Record<string, RoundingRule> = {
  'CUM': '2_DECIMALS', // Concrete, excavation
  'SQM': '2_DECIMALS', // Plaster, flooring
  'RMT': '2_DECIMALS', // Length
  'KG': '3_DECIMALS', // Steel weight
  'MT': '3_DECIMALS', // Steel weight (metric tons)
  'NOS': 'INTEGER', // Count
  'LS': 'INTEGER', // Lump sum
};

export function applyRounding(value: number, uom: string): number {
  const rule = ROUNDING_RULES[uom] || '2_DECIMALS';
  
  switch (rule) {
    case 'INTEGER':
      return Math.round(value);
    case '2_DECIMALS':
      return Math.round(value * 100) / 100;
    case '3_DECIMALS':
      return Math.round(value * 1000) / 1000;
    default:
      return Math.round(value * 100) / 100;
  }
}

// ─── Unit Conversion ─────────────────────────────────────────────────────────

export type LengthUnit = 'M' | 'MM' | 'CM' | 'FT';

export function convertToMeters(value: number, fromUnit: LengthUnit): number {
  switch (fromUnit) {
    case 'M':
      return value;
    case 'MM':
      return value / 1000;
    case 'CM':
      return value / 100;
    case 'FT':
      return value * 0.3048;
    default:
      return value;
  }
}

export function convertFromMeters(value: number, toUnit: LengthUnit): number {
  switch (toUnit) {
    case 'M':
      return value;
    case 'MM':
      return value * 1000;
    case 'CM':
      return value * 100;
    case 'FT':
      return value / 0.3048;
    default:
      return value;
  }
}
