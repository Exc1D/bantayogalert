import resolveConfig from 'tailwindcss/resolveConfig';
const fullConfig = resolveConfig({});
const defaultSans = fullConfig.theme?.fontFamily?.sans || ['ui-sans-serif', 'system-ui', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'];

export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: 'var(--color-nav)',
          DEFAULT: 'var(--color-brand)',
          light: 'var(--color-brand-light)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--color-surface-2)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        severity: {
          critical: {
            DEFAULT: 'var(--color-critical)',
            bg: 'var(--color-critical-bg)',
            border: 'var(--color-critical-border)',
            text: 'var(--color-critical-text)',
          },
          high: {
            DEFAULT: 'var(--color-high)',
            bg: 'var(--color-high-bg)',
            border: 'var(--color-high-border)',
            text: 'var(--color-high-text)',
          },
          medium: {
            DEFAULT: 'var(--color-medium)',
            bg: 'var(--color-medium-bg)',
            border: 'var(--color-medium-border)',
            text: 'var(--color-medium-text)',
          },
          low: {
            DEFAULT: 'var(--color-low)',
            bg: 'var(--color-low-bg)',
            border: 'var(--color-low-border)',
            text: 'var(--color-low-text)',
          },
        },
        status: {
          submitted: {
            DEFAULT: 'var(--color-status-submitted)',
            bg: 'var(--color-status-submitted-bg)',
          },
          review: {
            DEFAULT: 'var(--color-status-review)',
            bg: 'var(--color-status-review-bg)',
          },
          verified: {
            DEFAULT: 'var(--color-status-verified)',
            bg: 'var(--color-status-verified-bg)',
          },
          dispatched: {
            DEFAULT: 'var(--color-status-dispatched)',
            bg: 'var(--color-status-dispatched-bg)',
          },
          inprogress: {
            DEFAULT: 'var(--color-status-inprogress)',
            bg: 'var(--color-status-inprogress-bg)',
          },
          resolved: {
            DEFAULT: 'var(--color-status-resolved)',
            bg: 'var(--color-status-resolved-bg)',
          },
          rejected: {
            DEFAULT: 'var(--color-status-rejected)',
            bg: 'var(--color-status-rejected-bg)',
          },
          duplicate: {
            DEFAULT: 'var(--color-status-duplicate)',
            bg: 'var(--color-status-duplicate-bg)',
          },
        },
        alert: {
          info: {
            DEFAULT: 'var(--color-alert-info)',
            bg: 'var(--color-alert-info-bg)',
          },
          warning: {
            DEFAULT: 'var(--color-alert-warning)',
            bg: 'var(--color-alert-warning-bg)',
          },
          critical: {
            DEFAULT: 'var(--color-alert-critical)',
            bg: 'var(--color-alert-critical-bg)',
          },
          clear: {
            DEFAULT: 'var(--color-alert-clear)',
            bg: 'var(--color-alert-clear-bg)',
          },
        },
      },
      fontFamily: {
        sans: ['Switzer', ...defaultSans],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
      },
    },
  },
  plugins: [],
};
