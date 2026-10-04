/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--site-card-rgb) / <alpha-value>)',
        gray: {
          50: 'rgb(var(--site-gray-50) / <alpha-value>)',
          100: 'rgb(var(--site-gray-100) / <alpha-value>)',
          200: 'rgb(var(--site-gray-200) / <alpha-value>)',
          300: 'rgb(var(--site-gray-300) / <alpha-value>)',
          400: 'rgb(var(--site-gray-400) / <alpha-value>)',
          500: 'rgb(var(--site-gray-500) / <alpha-value>)',
          600: 'rgb(var(--site-gray-600) / <alpha-value>)',
          700: 'rgb(var(--site-gray-700) / <alpha-value>)',
          800: 'rgb(var(--site-gray-800) / <alpha-value>)',
          900: 'rgb(var(--site-gray-900) / <alpha-value>)',
        },
        green: {
          100: 'rgb(var(--site-success-bg) / <alpha-value>)',
          800: 'rgb(var(--site-success-text) / <alpha-value>)',
        },
        amber: {
          100: 'rgb(var(--site-warning-bg) / <alpha-value>)',
          800: 'rgb(var(--site-warning-text) / <alpha-value>)',
        },
        blue: {
          50: 'rgb(var(--site-info-bg) / <alpha-value>)',
          800: 'rgb(var(--site-info-text) / <alpha-value>)',
        },
        red: {
          50: 'rgb(var(--site-error-bg) / <alpha-value>)',
          800: 'rgb(var(--site-error-text) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        serif: ['EB Garamond', 'Georgia', 'serif'],
        display: ['EB Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
