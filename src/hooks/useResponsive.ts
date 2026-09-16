/**
 * Part 11 — Responsive Hooks
 * useBreakpoint and useContainerSize for responsive behavior
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BREAKPOINTS,
  BREAKPOINT_RANGES,
  Breakpoint,
  DeviceType,
  getBreakpointFromWidth,
  getDeviceType,
  isAtLeastBreakpoint,
  isAtMostBreakpoint,
  LAYOUT_CONFIG,
} from '../config/breakpoints';

/**
 * Hook to get current breakpoint and device info
 */
export function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [height, setHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 768
  );

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoint = getBreakpointFromWidth(width);
  const device = getDeviceType(breakpoint);
  const layout = LAYOUT_CONFIG[breakpoint];

  return {
    width,
    height,
    breakpoint,
    device,
    layout,
    isPhone: device === 'phone',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isXs: breakpoint === 'xs',
    isS: breakpoint === 's',
    isM: breakpoint === 'm',
    isL: breakpoint === 'l',
    isXl: breakpoint === 'xl',
    isAtLeast: (bp: Breakpoint) => isAtLeastBreakpoint(width, bp),
    isAtMost: (bp: Breakpoint) => isAtMostBreakpoint(width, bp),
  };
}

/**
 * Hook to get container size using ResizeObserver
 */
export function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  const breakpoint = getBreakpointFromWidth(size.width);
  const device = getDeviceType(breakpoint);
  const layout = LAYOUT_CONFIG[breakpoint];

  return {
    ref,
    width: size.width,
    height: size.height,
    breakpoint,
    device,
    layout,
    isPhone: device === 'phone',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isXs: breakpoint === 'xs',
    isS: breakpoint === 's',
    isM: breakpoint === 'm',
    isL: breakpoint === 'l',
    isXl: breakpoint === 'xl',
  };
}

/**
 * Hook to detect orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
      ? 'portrait'
      : 'landscape'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
}

/**
 * Hook to detect touch device
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }, []);

  return { isTouch };
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { prefersReducedMotion };
}

/**
 * Hook to detect high contrast preference
 */
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { prefersHighContrast };
}

/**
 * Hook to detect dark mode preference
 */
export function useDarkMode() {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { prefersDarkMode };
}

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

/**
 * Hook to detect safe area insets
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const style = getComputedStyle(document.documentElement);
    const top = parseInt(style.getPropertyValue('--sat') || '0');
    const right = parseInt(style.getPropertyValue('--sar') || '0');
    const bottom = parseInt(style.getPropertyValue('--sab') || '0');
    const left = parseInt(style.getPropertyValue('--sal') || '0');

    setInsets({ top, right, bottom, left });
  }, []);

  return insets;
}

/**
 * Hook to debounce a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to detect visibility (for pausing animations when tab is hidden)
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isVisible };
}

/**
 * Hook to detect if app is running in standalone mode (PWA)
 */
export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  return { isStandalone };
}

/**
 * Hook to detect keyboard visibility (mobile)
 */
export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;

      if (heightDiff > 100) {
        // Keyboard is likely open
        setIsKeyboardVisible(true);
        setKeyboardHeight(heightDiff);
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}

/**
 * Hook to detect scroll direction
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up');
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { scrollDirection };
}

/**
 * Hook to detect if element is in viewport
 */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}

/**
 * Hook to get responsive value based on breakpoint
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const { breakpoint } = useBreakpoint();

  // Find the value for current breakpoint or fall back to smaller breakpoints
  const breakpoints: Breakpoint[] = ['xs', 's', 'm', 'l', 'xl'];
  const currentIndex = breakpoints.indexOf(breakpoint);

  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  return undefined;
}

/**
 * Hook to detect if user is idle
 */
export function useIdleTimeout(timeout: number = 300000) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimeout = useCallback(() => {
    setIsIdle(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach((event) => {
      window.addEventListener(event, resetTimeout, { passive: true });
    });

    resetTimeout();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimeout]);

  return { isIdle, resetTimeout };
}
