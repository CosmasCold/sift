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
        accent: {
          DEFAULT: '#5b4b8a',
          hover: '#4a3a70',
          light: '#8b7bb0',
        },
        verdict: {
          green: '#10b981',
          amber: '#f59e0b',
          grey: '#9ca3af',
        },
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.02)',
      },
      backgroundImage: {
        'reading-overlay': "url('/reading-bg.jpg')",
      },
    },
  },
  plugins: [],
};