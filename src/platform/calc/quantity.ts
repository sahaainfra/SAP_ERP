/**
 * Part 12 — Quantity Value Object
 * 
 * Represents quantities with units of measure. Prevents arithmetic across
 * different units unless explicitly converted.
 */

import Decimal from 'decimal.js';

export class Quantity {
  private constructor(
    private readonly value: Decimal,
    readonly uom: string
  ) {}

  /**
   * Create Quantity from a value
   */
  static of(value: string | number | Decimal, uom: string): Quantity {
    if (!uom || uom.trim() === '') {
      throw new Error('UoM is required');
    }
    return new Quantity(new Decimal(value), uom);
  }

  /**
   * Zero quantity in a UoM
   */
  static zero(uom: string): Quantity {
    return new Quantity(new Decimal(0), uom);
  }

  /**
   * Get the value as a Decimal
   */
  toDecimal(): Decimal {
    return this.value;
  }

  /**
   * Get numeric value
   */
  toNumber(): number {
    return this.value.toNumber();
  }

  /**
   * Addition (only same UoM)
   */
  plus(other: Quantity): Quantity {
    this.assertSameUom(other);
    return new Quantity(this.value.plus(other.value), this.uom);
  }

  /**
   * Subtraction (only same UoM)
   */
  minus(other: Quantity): Quantity {
    this.assertSameUom(other);
    return new Quantity(this.value.minus(other.value), this.uom);
  }

  /**
   * Multiplication by a scalar (result keeps same UoM)
   */
  times(scalar: Decimal | number): Quantity {
    return new Quantity(this.value.times(new Decimal(scalar)), this.uom);
  }

  /**
   * Division by a scalar (result keeps same UoM)
   */
  dividedBy(scalar: Decimal | number): Quantity {
    if (new Decimal(scalar).isZero()) {
      throw new Error('Division by zero');
    }
    return new Quantity(this.value.div(new Decimal(scalar)), this.uom);
  }

  /**
   * Comparison: is this greater than other?
   */
  gt(other: Quantity): boolean {
    this.assertSameUom(other);
    return this.value.gt(other.value);
  }

  /**
   * Comparison: is this greater than or equal to other?
   */
  gte(other: Quantity): boolean {
    this.assertSameUom(other);
    return this.value.gte(other.value);
  }

  /**
   * Comparison: is this less than other?
   */
  lt(other: Quantity): boolean {
    this.assertSameUom(other);
    return this.value.lt(other.value);
  }

  /**
   * Comparison: is this less than or equal to other?
   */
  lte(other: Quantity): boolean {
    this.assertSameUom(other);
    return this.value.lte(other.value);
  }

  /**
   * Comparison: is this equal to other?
   */
  eq(other: Quantity): boolean {
    this.assertSameUom(other);
    return this.value.eq(other.value);
  }

  /**
   * Is this zero?
   */
  isZero(): boolean {
    return this.value.isZero();
  }

  /**
   * Is this negative?
   */
  isNegative(): boolean {
    return this.value.isNegative();
  }

  /**
   * Absolute value
   */
  abs(): Quantity {
    return new Quantity(this.value.abs(), this.uom);
  }

  /**
   * Negate the value
   */
  negate(): Quantity {
    return new Quantity(this.value.neg(), this.uom);
  }

  /**
   * Round to specified decimal places
   */
  toDecimalPlaces(decimals: number, mode: Decimal.Rounding = Decimal.ROUND_HALF_UP): Quantity {
    return new Quantity(this.value.toDecimalPlaces(decimals, mode), this.uom);
  }

  /**
   * Format as string with UoM
   */
  format(decimals?: number): string {
    const value = decimals !== undefined 
      ? this.value.toDecimalPlaces(decimals).toFixed(decimals)
      : this.value.toFixed();
    return `${value} ${this.uom}`;
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON(): { value: string; uom: string } {
    return {
      value: this.value.toFixed(),
      uom: this.uom,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: { value: string; uom: string }): Quantity {
    return Quantity.of(json.value, json.uom);
  }

  // Private helpers

  private assertSameUom(other: Quantity): void {
    if (this.uom !== other.uom) {
      throw new Error(`UoM mismatch: ${this.uom} vs ${other.uom}. Convert before arithmetic.`);
    }
  }
}

/**
 * Sum an array of Quantity values (all must have same UoM)
 */
export function sumQuantity(values: Quantity[]): Quantity {
  if (values.length === 0) {
    throw new Error('Cannot sum empty array');
  }
  return values.reduce((sum, val) => sum.plus(val));
}
