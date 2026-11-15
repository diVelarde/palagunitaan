/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--site-paper-rgb) / <alpha-value>)',
        surface: 'rgb(var(--site-surface-rgb) / <alpha-value>)',
        ink: 'rgb(var(--site-ink-rgb) / <alpha-value>)',
        rule: 'rgb(var(--site-rule-rgb) / <alpha-value>)',
        accent: 'rgb(var(--site-accent-rgb) / <alpha-value>)',
        'accent-gold': 'rgb(var(--site-accent-gold-rgb) / <alpha-value>)',
        muted: 'rgb(var(--site-muted-rgb) / <alpha-value>)',
        white: 'rgb(255 255 255 / <alpha-value>)',
        gray: {
          50: 'rgb(var(--site-paper-rgb) / <alpha-value>)',
          100: 'rgb(var(--site-surface-rgb) / <alpha-value>)',
          200: 'rgb(var(--site-rule-rgb) / <alpha-value>)',
          300: 'rgb(var(--site-rule-rgb) / <alpha-value>)',
          400: 'rgb(var(--site-muted-rgb) / <alpha-value>)',
          500: 'rgb(var(--site-muted-rgb) / <alpha-value>)',
          600: 'rgb(var(--site-muted-rgb) / <alpha-value>)',
          700: 'rgb(var(--site-ink-rgb) / <alpha-value>)',
          800: 'rgb(var(--site-ink-rgb) / <alpha-value>)',
          900: 'rgb(var(--site-ink-rgb) / <alpha-value>)',
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
        sans: ['var(--site-font-family)'],
        serif: ['var(--site-display-font-family)'],
        display: ['var(--site-display-font-family)'],
      },
    },
  },
  plugins: [],
}
