/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class based dark mode
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(210, 78%, 56%)', // vibrant blue
          50: 'hsl(210, 78%, 95%)',
          100: 'hsl(210, 78%, 90%)',
          200: 'hsl(210, 78%, 80%)',
          300: 'hsl(210, 78%, 70%)',
          400: 'hsl(210, 78%, 60%)',
          500: 'hsl(210, 78%, 50%)',
          600: 'hsl(210, 78%, 40%)',
          700: 'hsl(210, 78%, 30%)',
          800: 'hsl(210, 78%, 20%)',
          900: 'hsl(210, 78%, 10%)',
        },
        accent: {
          DEFAULT: 'hsl(14, 85%, 61%)', // warm coral
          100: 'hsl(14, 85%, 95%)',
          200: 'hsl(14, 85%, 90%)',
          300: 'hsl(14, 85%, 80%)',
          400: 'hsl(14, 85%, 70%)',
          500: 'hsl(14, 85%, 60%)',
          600: 'hsl(14, 85%, 50%)',
          700: 'hsl(14, 85%, 40%)',
          800: 'hsl(14, 85%, 30%)',
          900: 'hsl(14, 85%, 20%)',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
