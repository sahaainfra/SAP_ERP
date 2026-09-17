/**
 * Part 11 — Responsive Component
 * Conditional rendering based on breakpoint and device type
 */

import React from 'react';
import { useBreakpoint } from '../hooks/useResponsive';
import { Breakpoint, DeviceType } from '../config/breakpoints';

interface ResponsiveProps {
  children: React.ReactNode;
  /** Show only on these breakpoints */
  showOn?: Breakpoint[];
  /** Hide on these breakpoints */
  hideOn?: Breakpoint[];
  /** Show only on these device types */
  showOnDevice?: DeviceType[];
  /** Hide on these device types */
  hideOnDevice?: DeviceType[];
  /** Show only when width is at least this breakpoint */
  minBreakpoint?: Breakpoint;
  /** Show only when width is at most this breakpoint */
  maxBreakpoint?: Breakpoint;
  /** Fallback content when hidden */
  fallback?: React.ReactNode;
}

/**
 * Responsive component for conditional rendering based on breakpoint/device
 * 
 * @example
 * // Show only on desktop
 * <Responsive showOnDevice={['desktop']}>
 *   <DesktopOnlyContent />
 * </Responsive>
 * 
 * @example
 * // Hide on phone
 * <Responsive hideOnDevice={['phone']}>
 *   <ContentNotForMobile />
 * </Responsive>
 * 
 * @example
 * // Show only on tablet and up
 * <Responsive minBreakpoint="m">
 *   <TabletAndDesktopContent />
 * </Responsive>
 * 
 * @example
 * // Different content for different breakpoints
 * <Responsive showOn={['xs', 's']} fallback={<DesktopView />}>
 *   <MobileView />
 * </Responsive>
 */
export function Responsive({
  children,
  showOn,
  hideOn,
  showOnDevice,
  hideOnDevice,
  minBreakpoint,
  maxBreakpoint,
  fallback = null,
}: ResponsiveProps) {
  const { breakpoint, device, width, isAtLeast, isAtMost } = useBreakpoint();

  // Check showOn breakpoints
  if (showOn && !showOn.includes(breakpoint)) {
    return <>{fallback}</>;
  }

  // Check hideOn breakpoints
  if (hideOn && hideOn.includes(breakpoint)) {
    return <>{fallback}</>;
  }

  // Check showOnDevice
  if (showOnDevice && !showOnDevice.includes(device)) {
    return <>{fallback}</>;
  }

  // Check hideOnDevice
  if (hideOnDevice && hideOnDevice.includes(device)) {
    return <>{fallback}</>;
  }

  // Check minBreakpoint
  if (minBreakpoint && !isAtLeast(minBreakpoint)) {
    return <>{fallback}</>;
  }

  // Check maxBreakpoint
  if (maxBreakpoint && !isAtMost(maxBreakpoint)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show only on phone
 */
export function ShowOnPhone({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Responsive showOnDevice={['phone']} fallback={fallback}>
      {children}
    </Responsive>
  );
}

/**
 * Show only on tablet
 */
export function ShowOnTablet({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Responsive showOnDevice={['tablet']} fallback={fallback}>
      {children}
    </Responsive>
  );
}

/**
 * Show only on desktop
 */
export function ShowOnDesktop({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Responsive showOnDevice={['desktop']} fallback={fallback}>
      {children}
    </Responsive>
  );
}

/**
 * Hide on phone
 */
export function HideOnPhone({ children }: { children: React.ReactNode }) {
  return (
    <Responsive hideOnDevice={['phone']}>
      {children}
    </Responsive>
  );
}

/**
 * Hide on tablet
 */
export function HideOnTablet({ children }: { children: React.ReactNode }) {
  return (
    <Responsive hideOnDevice={['tablet']}>
      {children}
    </Responsive>
  );
}

/**
 * Hide on desktop
 */
export function HideOnDesktop({ children }: { children: React.ReactNode }) {
  return (
    <Responsive hideOnDevice={['desktop']}>
      {children}
    </Responsive>
  );
}

/**
 * Show on tablet and up (tablet + desktop)
 */
export function ShowOnTabletAndUp({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Responsive minBreakpoint="m" fallback={fallback}>
      {children}
    </Responsive>
  );
}

/**
 * Show on desktop only (l + xl)
 */
export function ShowOnDesktopOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Responsive minBreakpoint="l" fallback={fallback}>
      {children}
    </Responsive>
  );
}

/**
 * Responsive text that changes based on breakpoint
 */
export function ResponsiveText({
  xs,
  s,
  m,
  l,
  xl,
}: {
  xs?: string;
  s?: string;
  m?: string;
  l?: string;
  xl?: string;
}) {
  const { breakpoint } = useBreakpoint();

  const text = { xs, s, m, l, xl }[breakpoint];

  return <>{text || null}</>;
}

/**
 * Responsive value hook for use in components
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  s?: T;
  m?: T;
  l?: T;
  xl?: T;
}): T | undefined {
  const { breakpoint } = useBreakpoint();
  return values[breakpoint];
}

/**
 * Device restriction message component
 * Used for the 3 documented exceptions in Part 11
 */
export function DeviceRestrictionMessage({
  feature,
  reason,
  requiredDevice,
}: {
  feature: string;
  reason: string;
  requiredDevice: 'tablet' | 'desktop';
}) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      style={{
        background: 'var(--sapInformationBackground)',
        borderRadius: 'var(--sapElement_BorderCornerRadius)',
        border: '1px solid var(--sapInformationBorderColor)',
      }}
    >
      <div
        className="mb-4"
        style={{
          fontSize: '48px',
        }}
      >
        {requiredDevice === 'desktop' ? '🖥️' : '📱'}
      </div>
      <h3
        className="mb-2"
        style={{
          fontSize: 'var(--sapFontHeader4Size)',
          fontWeight: 'bold',
          color: 'var(--sapTextColor)',
        }}
      >
        {feature} requires {requiredDevice}
      </h3>
      <p
        className="mb-4"
        style={{
          fontSize: 'var(--sapFontSize)',
          color: 'var(--sapContent_LabelColor)',
          maxWidth: '400px',
        }}
      >
        {reason}
      </p>
      <p
        style={{
          fontSize: 'var(--sapFontSmallSize)',
          color: 'var(--sapContent_LabelColor)',
        }}
      >
        Please switch to a {requiredDevice} to access this feature.
      </p>
    </div>
  );
}

/**
 * Responsive container with max-width
 */
export function ResponsiveContainer({
  children,
  className = '',
  maxWidth,
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}) {
  const { breakpoint } = useBreakpoint();

  const defaultMaxWidths = {
    xs: '100%',
    s: '100%',
    m: '100%',
    l: '1200px',
    xl: '1600px',
  };

  const style = {
    maxWidth: maxWidth || defaultMaxWidths[breakpoint],
    margin: '0 auto',
    padding: 'var(--erp-space-4)',
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
