/**
 * Part 11 — Adaptive Layout Components
 * Components that automatically adjust based on device type
 */

import { useResponsive } from '../utils/responsive';

interface AdaptiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AdaptiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 'md',
  className = '',
}: AdaptiveGridProps) {
  const { breakpoint } = useResponsive();

  const gapMap = {
    xs: 'var(--erp-space-2)',
    sm: 'var(--erp-space-3)',
    md: 'var(--erp-space-4)',
    lg: 'var(--erp-space-5)',
    xl: 'var(--erp-space-6)',
  };

  const colCount = (columns as any)[breakpoint] || columns.xs || 1;

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
        gap: gapMap[gap],
      }}
    >
      {children}
    </div>
  );
}

interface AdaptiveStackProps {
  children: React.ReactNode;
  direction?: {
    xs?: 'row' | 'column';
    sm?: 'row' | 'column';
    md?: 'row' | 'column';
    lg?: 'row' | 'column';
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

export function AdaptiveStack({
  children,
  direction = { xs: 'column', md: 'row' },
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
}: AdaptiveStackProps) {
  const { breakpoint } = useResponsive();

  const gapMap = {
    xs: 'var(--erp-space-2)',
    sm: 'var(--erp-space-3)',
    md: 'var(--erp-space-4)',
    lg: 'var(--erp-space-5)',
    xl: 'var(--erp-space-6)',
  };

  const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  };

  const justifyMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
  };

  const dir = (direction as any)[breakpoint] || direction.xs || 'column';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: dir,
        gap: gapMap[gap],
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
      }}
    >
      {children}
    </div>
  );
}

interface AdaptiveCardProps {
  children: React.ReactNode;
  padding?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
  className?: string;
}

export function AdaptiveCard({
  children,
  padding = { xs: 'var(--erp-space-3)', md: 'var(--erp-space-4)', lg: 'var(--erp-space-5)' },
  className = '',
}: AdaptiveCardProps) {
  const { breakpoint } = useResponsive();

  const currentPadding = (padding as any)[breakpoint] || padding.xs || 'var(--erp-space-4)';

  return (
    <div
      className={`sap-card ${className}`}
      style={{
        padding: currentPadding,
      }}
    >
      {children}
    </div>
  );
}

interface AdaptiveTextProps {
  children: React.ReactNode;
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

export function AdaptiveText({
  children,
  size = { xs: 'var(--sapFontSmallSize)', md: 'var(--sapFontSize)', lg: 'var(--sapFontLargeSize)' },
  weight = 'normal',
  className = '',
}: AdaptiveTextProps) {
  const { breakpoint } = useResponsive();

  const currentSize = (size as any)[breakpoint] || size.xs || 'var(--sapFontSize)';

  const weightMap = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };

  return (
    <span
      className={className}
      style={{
        fontSize: currentSize,
        fontWeight: weightMap[weight],
        color: 'var(--sapTextColor)',
      }}
    >
      {children}
    </span>
  );
}

interface AdaptiveButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: {
    xs?: 'small' | 'medium' | 'large';
    md?: 'small' | 'medium' | 'large';
    lg?: 'small' | 'medium' | 'large';
  };
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AdaptiveButton({
  children,
  variant = 'primary',
  size = { xs: 'medium', md: 'medium', lg: 'large' },
  fullWidth = false,
  onClick,
  className = '',
}: AdaptiveButtonProps) {
  const { breakpoint } = useResponsive();

  const currentSize = (size as any)[breakpoint] || size.xs || 'medium';

  const sizeMap = {
    small: { padding: '0.5rem 1rem', fontSize: 'var(--sapFontSmallSize)' },
    medium: { padding: '0.75rem 1.5rem', fontSize: 'var(--sapFontSize)' },
    large: { padding: '1rem 2rem', fontSize: 'var(--sapFontLargeSize)' },
  };

  const variantMap = {
    primary: {
      background: 'var(--sapBrandColor)',
      color: '#ffffff',
      border: 'none',
    },
    secondary: {
      background: 'var(--sapButtonBackground)',
      color: 'var(--sapButtonTextColor)',
      border: '1px solid var(--sapButtonBorderColor)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--sapButtonTextColor)',
      border: 'none',
    },
  };

  const currentSizeStyle = sizeMap[currentSize as keyof typeof sizeMap];
  const currentVariantStyle = variantMap[variant];

  return (
    <button
      onClick={onClick}
      className={`touch-target-comfortable rounded-md font-medium transition-colors ${className}`}
      style={{
        padding: currentSizeStyle.padding,
        fontSize: currentSizeStyle.fontSize,
        ...currentVariantStyle,
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {children}
    </button>
  );
}

interface ShowOnDeviceProps {
  children: React.ReactNode;
  device: 'mobile' | 'tablet' | 'desktop';
}

export function ShowOnDevice({ children, device }: ShowOnDeviceProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const shouldShow =
    (device === 'mobile' && isMobile) ||
    (device === 'tablet' && isTablet) ||
    (device === 'desktop' && isDesktop);

  if (!shouldShow) return null;

  return <>{children}</>;
}

interface HideOnDeviceProps {
  children: React.ReactNode;
  device: 'mobile' | 'tablet' | 'desktop';
}

export function HideOnDevice({ children, device }: HideOnDeviceProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const shouldHide =
    (device === 'mobile' && isMobile) ||
    (device === 'tablet' && isTablet) ||
    (device === 'desktop' && isDesktop);

  if (shouldHide) return null;

  return <>{children}</>;
}
