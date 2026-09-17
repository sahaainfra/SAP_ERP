/**
 * Part 11 — Breakpoint System
 * Single source of truth for responsive breakpoints
 * 
 * SAP Fiori Adaptive Model:
 * - xs: 0-599px (Phone)
 * - s: 600-899px (Phone landscape / small tablet)
 * - m: 900-1279px (Tablet)
 * - l: 1280-1679px (Desktop)
 * - xl: 1680px+ (Large desktop)
 */

// Breakpoint values in pixels
export const BREAKPOINTS = {
  xs: 0,
  s: 600,
  m: 900,
  l: 1280,
  xl: 1680,
} as const;

// Breakpoint names
export type Breakpoint = keyof typeof BREAKPOINTS;

// Breakpoint ranges
export const BREAKPOINT_RANGES = {
  xs: { min: 0, max: 599 },
  s: { min: 600, max: 899 },
  m: { min: 900, max: 1279 },
  l: { min: 1280, max: 1679 },
  xl: { min: 1680, max: Infinity },
} as const;

// Device types
export type DeviceType = 'phone' | 'tablet' | 'desktop';

/**
 * Get device type from breakpoint
 */
export function getDeviceType(breakpoint: Breakpoint): DeviceType {
  if (breakpoint === 'xs' || breakpoint === 's') return 'phone';
  if (breakpoint === 'm') return 'tablet';
  return 'desktop';
}

/**
 * Get breakpoint from width
 */
export function getBreakpointFromWidth(width: number): Breakpoint {
  if (width < BREAKPOINTS.s) return 'xs';
  if (width < BREAKPOINTS.m) return 's';
  if (width < BREAKPOINTS.l) return 'm';
  if (width < BREAKPOINTS.xl) return 'l';
  return 'xl';
}

/**
 * Check if width matches breakpoint
 */
export function isBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  const range = BREAKPOINT_RANGES[breakpoint];
  return width >= range.min && width <= range.max;
}

/**
 * Check if width is at least breakpoint
 */
export function isAtLeastBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  return width >= BREAKPOINTS[breakpoint];
}

/**
 * Check if width is at most breakpoint
 */
export function isAtMostBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  const range = BREAKPOINT_RANGES[breakpoint];
  return width <= range.max;
}

// CSS custom media queries (generated from BREAKPOINTS)
export const CSS_MEDIA_QUERIES = {
  xs: `(max-width: ${BREAKPOINT_RANGES.xs.max}px)`,
  s: `(min-width: ${BREAKPOINT_RANGES.s.min}px) and (max-width: ${BREAKPOINT_RANGES.s.max}px)`,
  m: `(min-width: ${BREAKPOINT_RANGES.m.min}px) and (max-width: ${BREAKPOINT_RANGES.m.max}px)`,
  l: `(min-width: ${BREAKPOINT_RANGES.l.min}px) and (max-width: ${BREAKPOINT_RANGES.l.max}px)`,
  xl: `(min-width: ${BREAKPOINT_RANGES.xl.min}px)`,
  
  // Convenience queries
  phone: `(max-width: ${BREAKPOINT_RANGES.s.max}px)`,
  tablet: `(min-width: ${BREAKPOINT_RANGES.m.min}px) and (max-width: ${BREAKPOINT_RANGES.m.max}px)`,
  desktop: `(min-width: ${BREAKPOINT_RANGES.l.min}px)`,
  
  // Min-width queries (mobile-first)
  'min-s': `(min-width: ${BREAKPOINTS.s}px)`,
  'min-m': `(min-width: ${BREAKPOINTS.m}px)`,
  'min-l': `(min-width: ${BREAKPOINTS.l}px)`,
  'min-xl': `(min-width: ${BREAKPOINTS.xl}px)`,
  
  // Max-width queries (desktop-first)
  'max-xs': `(max-width: ${BREAKPOINT_RANGES.xs.max}px)`,
  'max-s': `(max-width: ${BREAKPOINT_RANGES.s.max}px)`,
  'max-m': `(max-width: ${BREAKPOINT_RANGES.m.max}px)`,
  'max-l': `(max-width: ${BREAKPOINT_RANGES.l.max}px)`,
} as const;

// Layout configuration per breakpoint
export const LAYOUT_CONFIG = {
  xs: {
    columns: 4,
    gap: 'var(--erp-space-3)', // 12px
    padding: 'var(--erp-space-3)', // 12px
    navigation: 'bottom-tabs',
    tableMode: 'card',
    formColumns: 1,
  },
  s: {
    columns: 6,
    gap: 'var(--erp-space-3)', // 12px
    padding: 'var(--erp-space-4)', // 16px
    navigation: 'bottom-tabs',
    tableMode: 'card',
    formColumns: 1,
  },
  m: {
    columns: 8,
    gap: 'var(--erp-space-4)', // 16px
    padding: 'var(--erp-space-4)', // 16px
    navigation: 'icon-rail',
    tableMode: 'table',
    formColumns: 2,
  },
  l: {
    columns: 12,
    gap: 'var(--erp-space-4)', // 16px
    padding: 'var(--erp-space-5)', // 24px
    navigation: 'expanded',
    tableMode: 'table',
    formColumns: 3,
  },
  xl: {
    columns: 12,
    gap: 'var(--erp-space-5)', // 24px
    padding: 'var(--erp-space-6)', // 32px
    navigation: 'expanded',
    tableMode: 'table',
    formColumns: 3,
    maxWidth: '1600px',
  },
} as const;

// Touch target sizes per device
export const TOUCH_TARGETS = {
  phone: {
    minimum: '44px',
    comfortable: '48px',
    large: '56px',
  },
  tablet: {
    minimum: '44px',
    comfortable: '48px',
    large: '56px',
  },
  desktop: {
    minimum: '32px',
    comfortable: '40px',
    large: '48px',
  },
} as const;

// Font sizes per device
export const FONT_SIZES = {
  phone: {
    base: '16px',
    small: '14px',
    large: '18px',
  },
  tablet: {
    base: '15px',
    small: '13px',
    large: '17px',
  },
  desktop: {
    base: '14px',
    small: '12px',
    large: '16px',
  },
} as const;

/**
 * Generate CSS custom properties for breakpoints
 */
export function generateCSSCustomProperties(): string {
  return `
:root {
  /* Breakpoint values */
  --dx-bp-xs: ${BREAKPOINTS.xs}px;
  --dx-bp-s: ${BREAKPOINTS.s}px;
  --dx-bp-m: ${BREAKPOINTS.m}px;
  --dx-bp-l: ${BREAKPOINTS.l}px;
  --dx-bp-xl: ${BREAKPOINTS.xl}px;
  
  /* Device type flags (set via JS) */
  --dx-device-phone: 0;
  --dx-device-tablet: 0;
  --dx-device-desktop: 0;
}
`;
}

/**
 * Generate CSS media queries from breakpoints
 */
export function generateCSSMediaQueries(): string {
  return `
/* Phone (xs + s) */
@media ${CSS_MEDIA_QUERIES.phone} {
  :root {
    --dx-device-phone: 1;
    --dx-device-tablet: 0;
    --dx-device-desktop: 0;
  }
}

/* Tablet (m) */
@media ${CSS_MEDIA_QUERIES.tablet} {
  :root {
    --dx-device-phone: 0;
    --dx-device-tablet: 1;
    --dx-device-desktop: 0;
  }
}

/* Desktop (l + xl) */
@media ${CSS_MEDIA_QUERIES.desktop} {
  :root {
    --dx-device-phone: 0;
    --dx-device-tablet: 0;
    --dx-device-desktop: 1;
  }
}
`;
}
