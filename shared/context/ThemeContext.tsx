'use client';

import React from 'react';

import { THEME_STORAGE_KEY } from '@/shared/lib/theme-preferences';

export type AppTheme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: AppTheme;
  resolvedTheme: Exclude<AppTheme, 'system'>;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(theme: AppTheme) {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: AppTheme) {
  const resolvedTheme = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}

function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'system';
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
    ? storedTheme
    : 'system';
}

function readAppliedTheme(): Exclude<AppTheme, 'system'> {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<AppTheme>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] =
    React.useState<Exclude<AppTheme, 'system'>>(readAppliedTheme);

  React.useEffect(() => {
    const initialTheme = readStoredTheme();
    setThemeState(initialTheme);
    setResolvedTheme(applyTheme(initialTheme));

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (initialTheme === 'system') setResolvedTheme(applyTheme('system'));
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const setTheme = React.useCallback((nextTheme: AppTheme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
    setResolvedTheme(applyTheme(nextTheme));
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
