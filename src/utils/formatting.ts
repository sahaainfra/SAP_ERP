/**
 * Part 03 — Formatting Utilities
 * 
 * Single formatting utility used by every component.
 * Never format inline in components.
 * 
 * - Currency: Indian numbering (lakh/crore), compact Cr/L for KPIs
 * - Quantities: respect UOM decimal precision
 * - Percentages: one decimal place with % suffix
 * - Dates: DD-MMM-YYYY for display, ISO 8601 for APIs
 * - Durations: 3d 4h format
 * - Null vs Zero: 0 = real zero, null = — (em dash)
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CompactMode = 'full' | 'compact' | 'short';

interface FormatCurrencyOptions {
  compact?: CompactMode;
  decimals?: number;
  showSymbol?: boolean;
}

interface FormatQuantityOptions {
  decimals?: number;
  uom?: string;
}

interface FormatPercentageOptions {
  decimals?: number;
}

interface FormatDateOptions {
  format?: 'short' | 'medium' | 'long' | 'iso';
  showTime?: boolean;
}

interface FormatDurationOptions {
  unit?: 'seconds' | 'minutes' | 'hours' | 'days';
}

// ═══════════════════════════════════════════════════════════════════════════
// NULL HANDLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format null/undefined as em dash
 * Zero renders as "0", null renders as "—"
 */
export function formatNull(value: any, fallback: string = '—'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
}

/**
 * Check if value is null/undefined (for conditional rendering)
 */
export function isNullish(value: any): boolean {
  return value === null || value === undefined || value === '';
}

// ═══════════════════════════════════════════════════════════════════════════
// CURRENCY FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format currency with Indian numbering system (lakh/crore)
 * 
 * Full: ₹1,23,45,678.00
 * Compact: ₹1.23 Cr, ₹12.35 L, ₹1.23 K
 * Short: 1.23 Cr, 12.35 L
 */
export function formatCurrency(
  value: number | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const { compact = 'full', decimals = 2, showSymbol = true } = options;

  if (isNullish(value)) {
    return '—';
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '—';
  }

  const symbol = showSymbol ? '₹' : '';
  const isNegative = numValue < 0;
  const absValue = Math.abs(numValue);

  let formatted: string;

  if (compact === 'compact' || compact === 'short') {
    // Compact mode: Cr, L, K
    if (absValue >= 10000000) {
      // Crore
      formatted = `${(absValue / 10000000).toFixed(2)} Cr`;
    } else if (absValue >= 100000) {
      // Lakh
      formatted = `${(absValue / 100000).toFixed(2)} L`;
    } else if (absValue >= 1000) {
      // Thousand
      formatted = `${(absValue / 1000).toFixed(2)} K`;
    } else {
      formatted = absValue.toFixed(decimals);
    }

    if (showSymbol) {
      formatted = symbol + formatted;
    }
  } else {
    // Full mode: Indian numbering
    formatted = formatIndianNumber(absValue, decimals);
    formatted = symbol + formatted;
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format number with Indian grouping (lakh/crore)
 * 1,23,45,678.00
 */
function formatIndianNumber(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  const [integer, decimal] = fixed.split('.');

  // Indian grouping: last 3 digits, then groups of 2
  let result = '';
  const len = integer.length;

  if (len <= 3) {
    result = integer;
  } else {
    result = integer.slice(-3);
    let remaining = integer.slice(0, -3);

    while (remaining.length > 0) {
      const chunk = remaining.slice(-2);
      result = chunk + ',' + result;
      remaining = remaining.slice(0, -2);
    }
  }

  return decimal ? `${result}.${decimal}` : result;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUANTITY FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format quantity with UOM
 * Respects decimal precision from material master
 */
export function formatQuantity(
  value: number | null | undefined,
  options: FormatQuantityOptions = {}
): string {
  const { decimals = 2, uom } = options;

  if (isNullish(value)) {
    return '—';
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '—';
  }

  const formatted = numValue.toFixed(decimals);
  return uom ? `${formatted} ${uom}` : formatted;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERCENTAGE FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format percentage with one decimal place
 * 87.4%
 */
export function formatPercentage(
  value: number | null | undefined,
  options: FormatPercentageOptions = {}
): string {
  const { decimals = 1 } = options;

  if (isNullish(value)) {
    return '—';
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '—';
  }

  return `${numValue.toFixed(decimals)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format date as DD-MMM-YYYY
 * 15-Sep-2026
 */
export function formatDate(
  value: string | Date | null | undefined,
  options: FormatDateOptions = {}
): string {
  const { format = 'medium', showTime = false } = options;

  if (isNullish(value)) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value as string);
  if (isNaN(date.getTime())) {
    return '—';
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  let formatted: string;

  switch (format) {
    case 'short':
      formatted = `${day}/${date.getMonth() + 1}/${year}`;
      break;
    case 'long':
      formatted = `${day} ${month} ${year}`;
      break;
    case 'iso':
      return date.toISOString();
    case 'medium':
    default:
      formatted = `${day}-${month}-${year}`;
  }

  if (showTime) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    formatted += ` ${hours}:${minutes}`;
  }

  return formatted;
}

/**
 * Format date-time with timezone
 * DD-MMM-YYYY HH:mm (IST)
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  timezone?: string
): string {
  if (isNullish(value)) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value as string);
  if (isNaN(date.getTime())) {
    return '—';
  }

  const formatted = formatDate(date, { format: 'medium', showTime: true });
  
  // Add timezone abbreviation if provided
  if (timezone) {
    return `${formatted} (${timezone})`;
  }

  return formatted;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (isNullish(value)) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value as string);
  if (isNaN(date.getTime())) {
    return '—';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DURATION FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format duration as "3d 4h" or "2h 30m"
 */
export function formatDuration(
  value: number | null | undefined,
  options: FormatDurationOptions = {}
): string {
  const { unit = 'seconds' } = options;

  if (isNullish(value)) {
    return '—';
  }

  const numValue = Number(value);
  if (isNaN(numValue) || numValue < 0) {
    return '—';
  }

  // Convert to seconds
  let totalSeconds = numValue;
  switch (unit) {
    case 'minutes':
      totalSeconds = numValue * 60;
      break;
    case 'hours':
      totalSeconds = numValue * 3600;
      break;
    case 'days':
      totalSeconds = numValue * 86400;
      break;
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : '0m';
}

// ═══════════════════════════════════════════════════════════════════════════
// NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format plain number with thousand separators
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (isNullish(value)) {
    return '—';
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '—';
  }

  return formatIndianNumber(numValue, decimals);
}

/**
 * Format compact number (1.2K, 3.4M)
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (isNullish(value)) {
    return '—';
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '—';
  }

  const absValue = Math.abs(numValue);

  if (absValue >= 10000000) {
    return `${(numValue / 10000000).toFixed(2)} Cr`;
  } else if (absValue >= 100000) {
    return `${(numValue / 100000).toFixed(2)} L`;
  } else if (absValue >= 1000) {
    return `${(numValue / 1000).toFixed(1)}K`;
  }

  return numValue.toString();
}
