/**
 * Part 03 — Theme & Density Engine
 * 
 * Manages theme (4 themes + system) and density (cozy/compact/condensed).
 * - Theme applied via data-theme on <html>
 * - Density applied via data-density on <html>
 * - Preferences persist server-side (dx_user_preference table)
 * - Instant switching, no reload, no flash
 * - Blocking inline script reads preference before first paint
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Theme = 'morning-horizon' | 'evening-horizon' | 'hc-black' | 'hc-white' | 'system';
export type Density = 'cozy' | 'compact' | 'condensed';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'morning-horizon' | 'evening-horizon' | 'hc-black' | 'hc-white';
  density: Density;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  availableThemes: Theme[];
  availableDensities: Density[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const AVAILABLE_THEMES: Theme[] = ['morning-horizon', 'evening-horizon', 'hc-black', 'hc-white', 'system'];
const AVAILABLE_DENSITIES: Density[] = ['cozy', 'compact', 'condensed'];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get system color scheme preference
 */
function getSystemTheme(): 'morning-horizon' | 'evening-horizon' {
  if (typeof window === 'undefined') return 'morning-horizon';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'evening-horizon'
    : 'morning-horizon';
}

/**
 * Resolve theme to actual theme (handles 'system')
 */
function resolveTheme(theme: Theme): 'morning-horizon' | 'evening-horizon' | 'hc-black' | 'hc-white' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply theme to DOM
 */
function applyThemeToDOM(resolvedTheme: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolvedTheme);
}

/**
 * Apply density to DOM
 */
function applyDensityToDOM(density: Density) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-density', density);
}

/**
 * Get stored preference from localStorage (fallback before server persistence)
 */
function getStoredPreference(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') return defaultValue;
  try {
    return localStorage.getItem(`dx_pref_${key}`) || defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Store preference to localStorage (fallback before server persistence)
 */
function storePreference(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`dx_pref_${key}`, value);
  } catch {
    // Ignore storage errors
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultDensity?: Density;
}

export function ThemeProvider({
  children,
  defaultTheme = 'morning-horizon',
  defaultDensity = 'cozy',
}: ThemeProviderProps) {
  // Initialize from stored preferences
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredPreference('theme', defaultTheme);
    return (AVAILABLE_THEMES.includes(stored as Theme) ? stored : defaultTheme) as Theme;
  });

  const [density, setDensityState] = useState<Density>(() => {
    const stored = getStoredPreference('density', defaultDensity);
    return (AVAILABLE_DENSITIES.includes(stored as Density) ? stored : defaultDensity) as Density;
  });

  // Resolve theme (handle 'system')
  const resolvedTheme = resolveTheme(theme);

  // Apply theme and density to DOM
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    applyDensityToDOM(density);
  }, [density]);

  // Listen for system theme changes when using 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyThemeToDOM(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Set theme
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storePreference('theme', newTheme);
    
    // TODO: Persist to server via API
    // PUT /api/dx/v1/preferences/theme
  }, []);

  // Set density
  const setDensity = useCallback((newDensity: Density) => {
    setDensityState(newDensity);
    storePreference('density', newDensity);
    
    // TODO: Persist to server via API
    // PUT /api/dx/v1/preferences/density
  }, []);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    density,
    setTheme,
    setDensity,
    availableThemes: AVAILABLE_THEMES,
    availableDensities: AVAILABLE_DENSITIES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE SCRIPT (for index.html)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns the inline script to inject into index.html
 * This runs before React to prevent flash of unstyled content
 */
export function getThemeInitScript(): string {
  return `
    (function() {
      try {
        var theme = localStorage.getItem('dx_pref_theme') || 'morning-horizon';
        var density = localStorage.getItem('dx_pref_density') || 'cozy';
        
        // Resolve 'system' theme
        if (theme === 'system') {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? 'evening-horizon' 
            : 'morning-horizon';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-density', density);
      } catch (e) {
        // Fallback to default
        document.documentElement.setAttribute('data-theme', 'morning-horizon');
        document.documentElement.setAttribute('data-density', 'cozy');
      }
    })();
  `;
}
