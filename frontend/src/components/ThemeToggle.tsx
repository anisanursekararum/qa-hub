import React, { useEffect, useState } from 'react';
import { toggleTheme, getActiveTheme } from '../utils/theme';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Read initial theme setup on component mount
    setTheme(getActiveTheme());
  }, []);

  const handleToggle = () => {
    const updatedTheme = toggleTheme();
    setTheme(updatedTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative flex items-center justify-center w-9 h-9 border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] bg-transparent text-[#161616] dark:text-[#E0E0E0] hover:bg-[#F4F4F4] dark:hover:bg-[#1C1C21] transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#0F62FE]"
      aria-label="Toggle Theme"
    >
      {/* Sun Icon */}
      <svg
        className={`w-4 h-4 transition-transform duration-300 absolute ${
          theme === 'dark' ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>

      {/* Moon Icon */}
      <svg
        className={`w-4 h-4 transition-transform duration-300 absolute ${
          theme === 'light' ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
};
export default ThemeToggle;
