/**
 * Part 19 — Breakpoint System
 * 
 * Single source of truth for responsive breakpoints.
 * Generates both CSS custom media queries and JavaScript constants.
 * 
 * Breakpoints follow SAP Fiori adaptive model:
 * - xs: 0-599px (Phone portrait)
 * - sm: 600-899px (Phone landscape / small tablet)
 * - md: 900-1279px (Tablet)
 * - lg: 1280-1679px (Desktop)
 * - xl: 1680px+ (Large desktop)
 */

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface Breakpoint {
  name: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  minWidth: number;
  maxWidth: number | null;
  label: string;
  layoutModel: string;
}

export const BREAKPOINTS: Breakpoint[] = [
  {
    name: 'xs',
    minWidth: 0,
    maxWidth: 599,
    label: 'Phone',
    layoutModel: 'Single column, bottom nav, sheet-based detail',
  },
  {
    name: 'sm',
    minWidth: 600,
    maxWidth: 899,
    label: 'Phone landscape / small tablet',
    layoutModel: 'Single column, wider fields',
  },
  {
    name: 'md',
    minWidth: 900,
    maxWidth: 1279,
    label: 'Tablet',
    layoutModel: 'Two column, collapsible side nav (icon rail)',
  },
  {
    name: 'lg',
    minWidth: 1280,
    maxWidth: 1679,
    label: 'Desktop',
    layoutModel: 'Full shell, expanded side nav, 3-column capable',
  },
  {
    name: 'xl',
    minWidth: 1680,
    maxWidth: null,
    label: 'Large desktop',
    layoutModel: 'Full shell, wider content cap, 4-column tiles',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get breakpoint by name
 */
export function getBreakpoint(name: string): Breakpoint | undefined {
  return BREAKPOINTS.find(bp => bp.name === name);
}

/**
 * Get breakpoint for a given width
 */
export function getBreakpointForWidth(width: number): Breakpoint {
  for (const bp of BREAKPOINTS) {
    if (bp.maxWidth === null) {
      return bp; // xl breakpoint
    }
    if (width >= bp.minWidth && width <= bp.maxWidth) {
      return bp;
    }
  }
  return BREAKPOINTS[0]; // fallback to xs
}

/**
 * Check if width is at least a certain breakpoint
 */
export function isAtLeast(width: number, breakpointName: string): boolean {
  const bp = getBreakpoint(breakpointName);
  if (!bp) return false;
  return width >= bp.minWidth;
}

/**
 * Check if width is at most a certain breakpoint
 */
export function isAtMost(width: number, breakpointName: string): boolean {
  const bp = getBreakpoint(breakpointName);
  if (!bp) return false;
  return bp.maxWidth === null || width <= bp.maxWidth;
}

/**
 * Check if width is within a specific breakpoint
 */
export function isWithin(width: number, breakpointName: string): boolean {
  const bp = getBreakpoint(breakpointName);
  if (!bp) return false;
  return width >= bp.minWidth && (bp.maxWidth === null || width <= bp.maxWidth);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE TYPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

export type DeviceType = 'phone' | 'tablet' | 'desktop';

/**
 * Get device type from width
 */
export function getDeviceType(width: number): DeviceType {
  if (width < 600) return 'phone';
  if (width < 900) return 'tablet';
  return 'desktop';
}

/**
 * Check if device is touch-capable
 * Note: Use only for input method selection, not for layout decisions
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS MEDIA QUERY GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate CSS custom media queries from breakpoint definitions
 * This ensures CSS and JS breakpoints never drift apart
 */
export function generateCSSMediaQueries(): string {
  const queries = BREAKPOINTS.map(bp => {
    if (bp.maxWidth === null) {
      return `--dx-bp-${bp.name}: (min-width: ${bp.minWidth}px);`;
    }
    return `--dx-bp-${bp.name}: (min-width: ${bp.minWidth}px) and (max-width: ${bp.maxWidth}px);`;
  });

  return `/* Auto-generated from breakpoints.ts - DO NOT EDIT MANUALLY */\n${queries.join('\n')}`;
}

/**
 * Generate CSS custom properties for breakpoint values
 */
export function generateCSSCustomProperties(): string {
  const props = BREAKPOINTS.map(bp => {
    return `--dx-bp-${bp.name}-min: ${bp.minWidth}px;${
      bp.maxWidth !== null ? `\n  --dx-bp-${bp.name}-max: ${bp.maxWidth}px;` : ''
    }`;
  });

  return `/* Auto-generated from breakpoints.ts - DO NOT EDIT MANUALLY */\n:root {\n  ${props.join('\n  ')}\n}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to get current breakpoint
 * Uses ResizeObserver for container queries where possible
 */
export function useBreakpoint(): {
  breakpoint: Breakpoint;
  deviceType: DeviceType;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  atLeast: (name: string) => boolean;
  atMost: (name: string) => boolean;
} {
  // This would be implemented as a React hook in the actual codebase
  // For now, return a mock implementation
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const breakpoint = getBreakpointForWidth(width);
  const deviceType = getDeviceType(width);

  return {
    breakpoint,
    deviceType,
    isPhone: deviceType === 'phone',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    atLeast: (name: string) => isAtLeast(width, name),
    atMost: (name: string) => isAtMost(width, name),
  };
}

/**
 * Hook to get container size for container queries
 */
export function useContainerSize(): {
  width: number;
  height: number;
  breakpoint: Breakpoint;
} {
  // This would use ResizeObserver in the actual implementation
  return {
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    breakpoint: getBreakpointForWidth(typeof window !== 'undefined' ? window.innerWidth : 1280),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE COMPONENT HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Responsive render helper
 * Renders different components based on breakpoint
 */
export function Responsive<T>({
  xs,
  sm,
  md,
  lg,
  xl,
  fallback,
}: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  fallback: T;
}): T {
  const { breakpoint } = useBreakpoint();
  
  switch (breakpoint.name) {
    case 'xs':
      return xs ?? fallback;
    case 'sm':
      return sm ?? xs ?? fallback;
    case 'md':
      return md ?? sm ?? xs ?? fallback;
    case 'lg':
      return lg ?? md ?? sm ?? xs ?? fallback;
    case 'xl':
      return xl ?? lg ?? md ?? sm ?? xs ?? fallback;
    default:
      return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  BREAKPOINTS,
  getBreakpoint,
  getBreakpointForWidth,
  isAtLeast,
  isAtMost,
  isWithin,
  getDeviceType,
  isTouchDevice,
  generateCSSMediaQueries,
  generateCSSCustomProperties,
  useBreakpoint,
  useContainerSize,
  Responsive,
};
