import { useCallback, useEffect, useState } from 'react';

import type { Theme } from '@/types/ui';

const STORAGE_KEY = 'app-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';

/** Stored choice wins; otherwise follow the OS. */
const initialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isTheme(stored)) return stored;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
};

export interface UseThemeResult {
  theme: Theme;
  toggleTheme: () => void;
}

export const useTheme = (): UseThemeResult => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [hasChoice, setHasChoice] = useState(() => isTheme(localStorage.getItem(STORAGE_KEY)));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!hasChoice) return;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, hasChoice]);

  // Follow the OS until the user expresses a preference of their own.
  useEffect(() => {
    if (hasChoice) return;

    const media = window.matchMedia(DARK_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [hasChoice]);

  const toggleTheme = useCallback(() => {
    setHasChoice(true);
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
};
