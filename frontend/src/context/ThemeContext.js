'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'admin-theme-mode';

/**
 * ThemeProvider — manages dark/light mode across the entire admin website.
 *
 * Persistence: localStorage('admin-theme-mode')
 * DOM: sets `data-theme-mode="dark|light"`, `data-theme="dark|light"`, and toggles `.dark` class on <html>
 *
 * Ensures all CSS custom properties switch instantly and the user's preference
 * survives page refreshes.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark'); // Default to dark mode for ultra-premium salon look
  const [mounted, setMounted] = useState(false);

  // Read stored preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        // Optional fallback to system preference if explicitly light
        setTheme('light');
      }
    } catch (_) {}
    setMounted(true);
  }, []);

  // Apply theme to <html> element whenever it changes
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme-mode', theme);
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark';

  const value = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Graceful fallback if used outside ThemeProvider
    return {
      theme: 'dark',
      isDark: true,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
};
