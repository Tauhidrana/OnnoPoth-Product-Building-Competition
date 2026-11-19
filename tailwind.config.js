/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        paper: '#f6f5f1',
        surface: '#ffffff',
        sunken: '#efeee8',
        ink: { DEFAULT: '#111418', 2: '#3b4049', 3: '#6a6f78', 4: '#9a9ea6' },
        line: { DEFAULT: '#e4e2db', strong: '#cfccc3' },
        brand: { DEFAULT: '#2f5bea', ink: '#1f43bf', soft: '#e9efff' },
        navy: '#14264a',
        signal: '#f5b82e',
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        card: '0 1px 2px rgb(17 20 24 / 0.04), 0 1px 1px rgb(17 20 24 / 0.03)',
        lift: '0 1px 2px rgb(17 20 24 / 0.05), 0 12px 32px -12px rgb(17 20 24 / 0.18)',
      },
      maxWidth: { page: '76rem' },
    },
  },
  plugins: [],
};
