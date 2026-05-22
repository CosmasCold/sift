'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return true; // default dark
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light') return false;
    if (stored === 'dark') return true;
    return !window.matchMedia('(prefers-color-scheme: light)').matches;
  } catch {
    return true;
  }
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(getInitialTheme);

  // Apply the class whenever dark state changes
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('theme');
      if (!stored) {
        setDark(!e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = useCallback(() => setDark((prev) => !prev), []);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800/40 transition"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}