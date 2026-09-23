/**
 * Part 12 — Money Value Object
 * 
 * Represents monetary values using integer minor units to avoid floating-point errors.
 * All arithmetic operations preserve precision and enforce currency consistency.
 */

import Decimal from 'decimal.js';

// Configure Decimal for financial calculations
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
});

export type RoundMode = 'HALF_UP' | 'HALF_EVEN' | 'CEIL' | 'FLOOR';

export const MINOR_UNITS: Record<string, number> = {
  INR: 2,  // Paisa
  USD: 2,  // Cent
  EUR: 2,
  GBP: 2,
  AED: 2,
  SAR: 2,
};

export class Money {
  private constructor(
    private readonly minor: bigint,
    readonly currency: string
  ) {}

  /**
   * Create Money from a value (string, number, or Decimal)
   */
  static of(value: string | number | Decimal, currency = 'INR'): Money {
    const decimal = new Decimal(value);
    const minorUnits = MINOR_UNITS[currency] ?? 2;
    const minor = BigInt(decimal.times(new Decimal(10).pow(minorUnits)).toFixed(0));
    return new Money(minor, currency);
  }

  /**
   * Create Money from minor units directly
   */
  static fromMinor(minor: bigint | number | string, currency: string): Money {
    return new Money(BigInt(minor), currency);
  }

  /**
   * Zero value in a currency
   */
  static zero(currency = 'INR'): Money {
    return new Money(0n, currency);
  }

  /**
   * Get the value as a Decimal
   */
  toDecimal(): Decimal {
    const minorUnits = MINOR_UNITS[this.currency] ?? 2;
    return new Decimal(this.minor.toString()).div(new Decimal(10).pow(minorUnits));
  }

  /**
   * Get the minor units value
   */
  toMinor(): bigint {
    return this.minor;
  }

  /**
   * Get numeric value (use sparingly, prefer toDecimal)
   */
  toNumber(): number {
    return this.toDecimal().toNumber();
  }

  /**
   * Addition
   */
  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minor + other.minor, this.currency);
  }

  /**
   * Subtraction
   */
  minus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minor - other.minor, this.currency);
  }

  /**
   * Multiplication by a scalar
   */
  times(scalar: Decimal | number, mode: RoundMode = 'HALF_UP'): Money {
    const result = new Decimal(this.minor.toString()).times(new Decimal(scalar));
    const rounded = this.roundBigInt(result, mode);
    return new Money(rounded, this.currency);
  }

  /**
   * Division by a scalar
   */
  dividedBy(scalar: Decimal | number, mode: RoundMode = 'HALF_UP'): Money {
    if (new Decimal(scalar).isZero()) {
      throw new Error('Division by zero');
    }
    const result = new Decimal(this.minor.toString()).div(new Decimal(scalar));
    const rounded = this.roundBigInt(result, mode);
    return new Money(rounded, this.currency);
  }

  /**
   * Percentage calculation
   */
  percent(percentage: Decimal | number): Money {
    return this.times(new Decimal(percentage).div(100));
  }

  /**
   * Negate the value
   */
  negate(): Money {
    return new Money(-this.minor, this.currency);
  }

  /**
   * Absolute value
   */
  abs(): Money {
    return new Money(this.minor < 0n ? -this.minor : this.minor, this.currency);
  }

  /**
   * Comparison: is this greater than other?
   */
  gt(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor > other.minor;
  }

  /**
   * Comparison: is this greater than or equal to other?
   */
  gte(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor >= other.minor;
  }

  /**
   * Comparison: is this less than other?
   */
  lt(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor < other.minor;
  }

  /**
   * Comparison: is this less than or equal to other?
   */
  lte(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor <= other.minor;
  }

  /**
   * Comparison: is this equal to other?
   */
  eq(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor === other.minor;
  }

  /**
   * Is this zero?
   */
  isZero(): boolean {
    return this.minor === 0n;
  }

  /**
   * Is this negative?
   */
  isNegative(): boolean {
    return this.minor < 0n;
  }

  /**
   * Is this positive?
   */
  isPositive(): boolean {
    return this.minor > 0n;
  }

  /**
   * Allocate this amount across multiple weights using largest-remainder method
   * Ensures the sum of allocations equals the original amount exactly
   */
  allocate(weights: Decimal[]): Money[] {
    if (weights.length === 0) {
      throw new Error('Cannot allocate to zero weights');
    }

    const totalWeight = weights.reduce((sum, w) => sum.plus(w), new Decimal(0));
    if (totalWeight.isZero()) {
      throw new Error('Cannot allocate with zero total weight');
    }

    // Calculate raw allocations
    const rawAllocations = weights.map(w => 
      new Decimal(this.minor.toString()).times(w).div(totalWeight)
    );

    // Floor each allocation
    const floors = rawAllocations.map(r => BigInt(r.floor().toFixed(0)));
    
    // Calculate remainder
    const allocatedSum = floors.reduce((sum, f) => sum + f, 0n);
    let remainder = this.minor - allocatedSum;

    // Sort by fractional part (descending) to distribute remainder
    const indices = rawAllocations
      .map((r, i) => ({ index: i, frac: r.minus(r.floor()) }))
      .sort((a, b) => b.frac.comparedTo(a.frac));

    // Distribute remainder one unit at a time
    for (const { index } of indices) {
      if (remainder <= 0n) break;
      floors[index] += 1n;
      remainder -= 1n;
    }

    return floors.map(f => new Money(f, this.currency));
  }

  /**
   * Round to specified decimal places
   */
  toDecimalPlaces(decimals: number, mode: RoundMode = 'HALF_UP'): Money {
    const minorUnits = MINOR_UNITS[this.currency] ?? 2;
    if (decimals >= minorUnits) {
      return this;
    }

    const divisor = new Decimal(10).pow(minorUnits - decimals);
    const value = new Decimal(this.minor.toString()).div(divisor);
    const rounded = this.roundDecimal(value, mode);
    const newMinor = BigInt(rounded.times(divisor).toFixed(0));
    
    return new Money(newMinor, this.currency);
  }

  /**
   * Format as string with currency symbol
   */
  format(locale = 'en-IN'): string {
    const value = this.toNumber();
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: MINOR_UNITS[this.currency] ?? 2,
      maximumFractionDigits: MINOR_UNITS[this.currency] ?? 2,
    });
    return formatter.format(value);
  }

  /**
   * Format compact (e.g., ₹1.23 Cr, ₹45.67 L)
   */
  formatCompact(): string {
    const value = this.toNumber();
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (this.currency === 'INR') {
      if (absValue >= 10000000) {
        return `${sign}₹${(absValue / 10000000).toFixed(2)} Cr`;
      }
      if (absValue >= 100000) {
        return `${sign}₹${(absValue / 100000).toFixed(2)} L`;
      }
      if (absValue >= 1000) {
        return `${sign}₹${(absValue / 1000).toFixed(2)} K`;
      }
    }

    return this.format();
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON(): { amount: string; currency: string } {
    return {
      amount: this.toDecimal().toFixed(MINOR_UNITS[this.currency] ?? 2),
      currency: this.currency,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: { amount: string; currency: string }): Money {
    return Money.of(json.amount, json.currency);
  }

  // Private helpers

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  private roundBigInt(value: Decimal, mode: RoundMode): bigint {
    const rounded = this.roundDecimal(value, mode);
    return BigInt(rounded.toFixed(0));
  }

  private roundDecimal(value: Decimal, mode: RoundMode): Decimal {
    switch (mode) {
      case 'HALF_UP':
        return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      case 'HALF_EVEN':
        return value.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN);
      case 'CEIL':
        return value.ceil();
      case 'FLOOR':
        return value.floor();
      default:
        return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    }
  }
}

/**
 * Sum an array of Money values
 */
export function sumMoney(values: Money[]): Money {
  if (values.length === 0) {
    throw new Error('Cannot sum empty array');
  }
  return values.reduce((sum, val) => sum.plus(val));
}
