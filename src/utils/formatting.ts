/**
 * Formatting Utilities
 * 
 * Centralized formatting for all display values.
 * - Indian currency grouping (lakh/crore)
 * - Compact display (Cr/L/K)
 * - Quantities with UOM precision
 * - Percentages
 * - Dates (DD-MMM-YYYY)
 * - Durations
 * - Null vs zero handling
 */

// ─── Currency Formatting ─────────────────────────────────────────────────────

/**
 * Format currency in Indian numbering system (lakh/crore grouping)
 * Example: 12345678.90 → ₹1,23,45,678.90
 */
export function formatCurrency(
  value: number | null | undefined,
  options: {
    compact?: boolean;
    decimals?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const { compact = false, decimals = 2, showSymbol = true } = options;

  // Null/undefined handling
  if (value === null || value === undefined) {
    return '—';
  }

  const symbol = showSymbol ? '₹' : '';

  // Compact display
  if (compact) {
    const absValue = Math.abs(value);
    if (absValue >= 10000000) {
      // Crore
      return `${symbol}${(value / 10000000).toFixed(2)} Cr`;
    } else if (absValue >= 100000) {
      // Lakh
      return `${symbol}${(value / 100000).toFixed(2)} L`;
    } else if (absValue >= 1000) {
      // Thousand
      return `${symbol}${(value / 1000).toFixed(2)} K`;
    }
  }

  // Indian numbering format
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formatter.format(value)}`;
}

/**
 * Format currency with full precision (for exports)
 */
export function formatCurrencyFull(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `₹${formatter.format(value)}`;
}

// ─── Quantity Formatting ─────────────────────────────────────────────────────

/**
 * Format quantity with UOM-specific decimal precision
 */
export function formatQuantity(
  value: number | null | undefined,
  decimalPlaces: number = 2
): string {
  if (value === null || value === undefined) {
    return '—';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return formatter.format(value);
}

// ─── Percentage Formatting ───────────────────────────────────────────────────

/**
 * Format percentage with one decimal place
 * Example: 87.4 → "87.4%"
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${value.toFixed(decimals)}%`;
}

// ─── Date Formatting ─────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format date as DD-MMM-YYYY
 * Example: 2026-09-15 → "15-Sep-2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    return '—';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '—';
  }

  const day = d.getDate().toString().padStart(2, '0');
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Format datetime as DD-MMM-YYYY HH:mm
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) {
    return '—';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '—';
  }

  const dateStr = formatDate(d);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format date to ISO 8601 (for APIs and exports)
 */
export function formatDateISO(date: string | Date | null | undefined): string {
  if (!date) {
    return '';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }

  return d.toISOString();
}

// ─── Duration Formatting ─────────────────────────────────────────────────────

/**
 * Format duration in minutes to human-readable format
 * Example: 2640 → "1d 20h"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) {
    return '—';
  }

  if (minutes < 0) {
    return '—';
  }

  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (mins > 0 && days === 0) {
    parts.push(`${mins}m`);
  }

  return parts.length > 0 ? parts.join(' ') : '0m';
}

// ─── Number Formatting ───────────────────────────────────────────────────────

/**
 * Format number with Indian grouping
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined) {
    return '—';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
}

// ─── Null vs Zero Handling ───────────────────────────────────────────────────

/**
 * Display null as em dash, zero as "0"
 * This ensures we never confuse "no data" with "actual zero"
 */
export function displayValue(value: any, fallback: string = '—'): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'number' && isNaN(value)) {
    return fallback;
  }

  return String(value);
}

/**
 * Check if a value is truly zero (not null/undefined)
 */
export function isZero(value: any): boolean {
  return value === 0 || value === '0';
}

/**
 * Check if a value is null/undefined (no data)
 */
export function isNull(value: any): boolean {
  return value === null || value === undefined;
}

// ─── Variance Formatting ─────────────────────────────────────────────────────

/**
 * Format variance with sign and color indication
 * Returns object with formatted value and CSS class
 */
export function formatVariance(
  value: number | null | undefined,
  isPercentage: boolean = false
): { value: string; className: string; isPositive: boolean } {
  if (value === null || value === undefined) {
    return { value: '—', className: '', isPositive: false };
  }

  const formatted = isPercentage 
    ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    : `${value > 0 ? '+' : ''}${formatNumber(value)}`;

  const isPositive = value > 0;
  const className = isPositive ? 'erp-variance-favourable' : 'erp-variance-unfavourable';

  return { value: formatted, className, isPositive };
}

// ─── Export Utilities ────────────────────────────────────────────────────────

/**
 * Format value for export (full precision, no compact display)
 */
export function formatForExport(
  value: number | null | undefined,
  type: 'currency' | 'quantity' | 'percent' = 'currency'
): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'currency':
      return formatCurrencyFull(value);
    case 'quantity':
      return formatQuantity(value, 4); // Higher precision for exports
    case 'percent':
      return `${value.toFixed(2)}%`;
    default:
      return String(value);
  }
}
