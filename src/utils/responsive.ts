/**
 * Part 11 — Responsive & Multi-Device Framework
 * Responsive utilities and breakpoint system
 */

import { useState, useEffect } from 'react';

// Breakpoint definitions (mobile-first)
export const BREAKPOINTS = {
  xs: 0,        // Extra small devices (phones, < 576px)
  sm: 576,      // Small devices (landscape phones, ≥ 576px)
  md: 768,      // Medium devices (tablets, ≥ 768px)
  lg: 992,      // Large devices (desktops, ≥ 992px)
  xl: 1200,     // Extra large devices (large desktops, ≥ 1200px)
  xxl: 1400,    // Extra extra large devices (≥ 1400px)
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Device type detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
}

export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

// Responsive hook
export function useResponsive() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [height, setHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 768);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width,
    height,
    breakpoint: getCurrentBreakpoint(width),
    device: getDeviceType(width),
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isSmallMobile: width < BREAKPOINTS.sm,
  };
}

// Responsive value helper
export function responsiveValue<T>(
  value: T | { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; xxl?: T },
  breakpoint: Breakpoint
): T | undefined {
  if (typeof value !== 'object' || value === null) {
    return value as T;
  }

  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpoints.indexOf(breakpoint);

  // Find the closest defined value for current or smaller breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpoints[i];
    if ((value as any)[bp] !== undefined) {
      return (value as any)[bp];
    }
  }

  return undefined;
}

// Grid system utilities
export const GRID_COLUMNS = {
  xs: 4,   // Mobile: 4 columns
  sm: 6,   // Small tablet: 6 columns
  md: 8,   // Tablet: 8 columns
  lg: 12,  // Desktop: 12 columns
  xl: 12,  // Large desktop: 12 columns
  xxl: 12, // Extra large: 12 columns
} as const;

export const GRID_GAP = {
  xs: '0.5rem',  // 8px
  sm: '0.75rem', // 12px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '1.5rem',  // 24px
  xxl: '2rem',   // 32px
} as const;

// Touch target sizes (WCAG 2.1 AA)
export const TOUCH_TARGET = {
  minimum: '44px',  // 44x44px minimum
  comfortable: '48px', // 48x48px comfortable
  large: '56px',    // 56x56px for primary actions
} as const;

// Spacing scale for different devices
export const DEVICE_SPACING = {
  mobile: {
    page: '1rem',      // 16px page padding
    card: '0.75rem',   // 12px card padding
    gap: '0.5rem',     // 8px between elements
  },
  tablet: {
    page: '1.5rem',    // 24px page padding
    card: '1rem',      // 16px card padding
    gap: '0.75rem',    // 12px between elements
  },
  desktop: {
    page: '2rem',      // 32px page padding
    card: '1.5rem',    // 24px card padding
    gap: '1rem',       // 16px between elements
  },
} as const;
