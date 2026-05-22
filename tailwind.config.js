/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
  50: '#f6f4f9',
  100: '#ece9f2',
  200: '#dbd4e5',
  300: '#c3b8d4',
  400: '#a595bc',
  500: '#8b7aa3',
  600: '#72648a',
  700: '#5c5070',
  800: '#2e2839',    // Glass card background
  900: '#1f1c2e',    // Page background (lighter stop of gradient)
  950: '#171322',    // Deepest background (darker stop)
},
        // New accent: Lavender Fog (replaces old accent)
        accent: {
          DEFAULT: '#b4a7d6', // accent-400
          50: '#f5f3fa',
          100: '#ece7f5',
          200: '#ddd4ed',
          300: '#c9b9e2',
          400: '#b4a7d6',    // Primary accent (Lavender Fog)
          500: '#9b8ac4',
          600: '#8471b2',
          700: '#6f5d9d',
          800: '#5c4d82',
          900: '#4a3e6a',
          950: '#2f2646',
        },
        // Preserved verdict colors (unchanged)
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
        // New glass shadows
        'glass': '0 8px 32px 0 rgba(28, 24, 22, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass-sm': '0 4px 16px 0 rgba(28, 24, 22, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
        // Preserved existing card shadows (if you still need them)
        'card': '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      backgroundImage: {
        'reading-overlay': "url('/reading-bg.jpg')", // preserved
      },
    },
  },
  plugins: [],
};