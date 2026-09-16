/**
 * Theme Engine
 * 
 * Manages theme and density switching with instant application.
 * - Four themes: morning-horizon, evening-horizon, hc-black, hc-white
 * - Three density modes: cozy, compact, condensed
 * - Server-persisted preferences (mocked for frontend-only)
 * - No FOUC (Flash of Unstyled Content)
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'morning-horizon' | 'evening-horizon' | 'hc-black' | 'hc-white' | 'system';
export type Density = 'cozy' | 'compact' | 'condensed';

interface UserPreferences {
  theme: Theme;
  density: Density;
  locale: string;
  timezone: string;
  numberFormat: string;
  dateFormat: string;
  landingPage: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'morning-horizon',
  density: 'cozy',
  locale: 'en-IN',
  timezone: 'Asia/Kolkata',
  numberFormat: 'en-IN',
  dateFormat: 'DD-MMM-YYYY',
  landingPage: '/dashboard',
};

const STORAGE_KEY = 'erp_user_preferences';

/**
 * Get system theme based on prefers-color-scheme
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
 * Load preferences from localStorage (server persistence would go here)
 */
function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load preferences:', e);
  }
  
  return DEFAULT_PREFERENCES;
}

/**
 * Save preferences to localStorage (server persistence would go here)
 */
function savePreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save preferences:', e);
  }
}

/**
 * Apply theme to DOM
 */
function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
}

/**
 * Apply density to DOM
 */
function applyDensity(density: Density): void {
  document.documentElement.setAttribute('data-density', density);
}

/**
 * Theme Engine Hook
 */
export function useThemeEngine() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const [resolvedTheme, setResolvedTheme] = useState<'morning-horizon' | 'evening-horizon' | 'hc-black' | 'hc-white'>(
    resolveTheme(preferences.theme)
  );

  // Apply theme and density on mount and when preferences change
  useEffect(() => {
    applyTheme(preferences.theme);
    applyDensity(preferences.density);
    setResolvedTheme(resolveTheme(preferences.theme));
  }, [preferences]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (preferences.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      setResolvedTheme(getSystemTheme());
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [preferences.theme]);

  const setTheme = useCallback((theme: Theme) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, theme };
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const setDensity = useCallback((density: Density) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, density };
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    theme: preferences.theme,
    resolvedTheme,
    density: preferences.density,
    preferences,
    setTheme,
    setDensity,
    resetPreferences,
  };
}

/**
 * Theme metadata for UI
 */
export const THEMES = {
  'morning-horizon': {
    name: 'Morning Horizon',
    description: 'Light theme (default)',
    icon: '☀️',
  },
  'evening-horizon': {
    name: 'Evening Horizon',
    description: 'Dark theme',
    icon: '🌙',
  },
  'hc-black': {
    name: 'High Contrast Black',
    description: 'Accessibility theme',
    icon: '⬛',
  },
  'hc-white': {
    name: 'High Contrast White',
    description: 'Accessibility theme',
    icon: '⬜',
  },
  'system': {
    name: 'System',
    description: 'Follow OS preference',
    icon: '💻',
  },
} as const;

export const DENSITIES = {
  'cozy': {
    name: 'Cozy',
    description: 'Touch-friendly (default)',
    controlHeight: '2.25rem',
    lineHeight: '2.75rem',
  },
  'compact': {
    name: 'Compact',
    description: 'Desktop data entry',
    controlHeight: '1.625rem',
    lineHeight: '2rem',
  },
  'condensed': {
    name: 'Condensed',
    description: 'Dense tables',
    controlHeight: '1.375rem',
    lineHeight: '1.5rem',
  },
} as const;
