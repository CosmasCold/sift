/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // ← this is essential
  theme: {
    extend: {
      colors: {
        surface: {
          50: 'var(--surface-50)',
          100: 'var(--surface-100)',
          200: 'var(--surface-200)',
          300: 'var(--surface-300)',
          400: 'var(--surface-400)',
          500: 'var(--surface-500)',
          600: 'var(--surface-600)',
          700: 'var(--surface-700)',
          800: 'var(--surface-800)',
          900: 'var(--surface-900)',
          950: 'var(--surface-950)',
        },
        accent: {
    DEFAULT: 'var(--accent-DEFAULT)',
    50: 'var(--accent-50)',
    100: 'var(--accent-100)',
    200: 'var(--accent-200)',
    300: 'var(--accent-300)',
    400: 'var(--accent-400)',
    500: 'var(--accent-500)',
    600: 'var(--accent-600)',
    700: 'var(--accent-700)',
    800: 'var(--accent-800)',
    900: 'var(--accent-900)',
    950: 'var(--accent-950)',
  },
        verdict: {
          green: '#10b981',
          amber: '#f59e0b',
          grey: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0,0,0,0.15), inset 0 1px 0 0 rgba(255,255,255,0.1)',
        'glass-sm': '0 4px 16px 0 rgba(0,0,0,0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)',
        'card': '0 4px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.02)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      backgroundImage: {
        'reading-overlay': "url('/reading-bg.jpg')",
      },
    },
  },
  plugins: [],
};