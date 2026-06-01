/**
 * Utility functions for preventing render flicker and managing Light/Dark themes.
 */

export const THEME_KEY = 'qa-hub-theme';

/**
 * Initializes the theme from localStorage or system preferences.
 * This should be called as early as possible (e.g., in a script tag in document head)
 * to prevent the white page flash (flickering).
 */
export function initializeTheme(): void {
  if (typeof window === 'undefined') return;

  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Toggles the current theme and persists the user preference in localStorage.
 */
export function toggleTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const isDark = document.documentElement.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';

  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  localStorage.setItem(THEME_KEY, newTheme);
  return newTheme;
}

/**
 * Gets the current active theme.
 */
export function getActiveTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
