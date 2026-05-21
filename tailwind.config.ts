import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#8b5cf6', // vibrant purple (violet-500)
          hover: '#7c3aed',   // darker violet-600
          light: '#a78bfa',   // lighter violet-400
        },
        verdict: {
          green: '#10b981',
          amber: '#f59e0b',
          grey: '#9ca3af',
        },
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
export default config;