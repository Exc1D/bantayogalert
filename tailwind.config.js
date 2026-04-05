/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Severity (D-120) — references CSS custom properties
        severity: {
          critical: 'var(--color-critical)',
          criticalBg: 'var(--color-critical-bg)',
          criticalBorder: 'var(--color-critical-border)',
          criticalText: 'var(--color-critical-text)',
          high: 'var(--color-high)',
          highBg: 'var(--color-high-bg)',
          highBorder: 'var(--color-high-border)',
          highText: 'var(--color-high-text)',
          medium: 'var(--color-medium)',
          mediumBg: 'var(--color-medium-bg)',
          mediumBorder: 'var(--color-medium-border)',
          mediumText: 'var(--color-medium-text)',
          low: 'var(--color-low)',
          lowBg: 'var(--color-low-bg)',
          lowBorder: 'var(--color-low-border)',
          lowText: 'var(--color-low-text)',
        },
        // Status colors — references CSS custom properties
        status: {
          submitted: 'var(--color-status-submitted)',
          submittedBg: 'var(--color-status-submitted-bg)',
          underReview: 'var(--color-status-under-review)',
          underReviewBg: 'var(--color-status-under-review-bg)',
          verified: 'var(--color-status-verified)',
          verifiedBg: 'var(--color-status-verified-bg)',
          dispatched: 'var(--color-status-dispatched)',
          dispatchedBg: 'var(--color-status-dispatched-bg)',
          inProgress: 'var(--color-status-in-progress)',
          inProgressBg: 'var(--color-status-in-progress-bg)',
          resolved: 'var(--color-status-resolved)',
          resolvedBg: 'var(--color-status-resolved-bg)',
          rejected: 'var(--color-status-rejected)',
          rejectedBg: 'var(--color-status-rejected-bg)',
          duplicate: 'var(--color-status-duplicate)',
          duplicateBg: 'var(--color-status-duplicate-bg)',
        },
        // Alert colors
        alert: {
          info: 'var(--color-alert-info)',
          infoBg: 'var(--color-alert-info-bg)',
          warning: 'var(--color-alert-warning)',
          warningBg: 'var(--color-alert-warning-bg)',
          critical: 'var(--color-alert-critical)',
          criticalBg: 'var(--color-alert-critical-bg)',
          clear: 'var(--color-alert-clear)',
          clearBg: 'var(--color-alert-clear-bg)',
        },
        // Neutral palette
        neutral: {
          900: 'var(--color-gray-900)',
          700: 'var(--color-gray-700)',
          500: 'var(--color-gray-500)',
          300: 'var(--color-gray-300)',
          100: 'var(--color-gray-100)',
          50: 'var(--color-gray-50)',
        },
        // Brand
        navy: 'var(--color-navy)',
        brand: {
          DEFAULT: 'var(--color-brand)',
          light: 'var(--color-brand-light)',
        },
      },
      fontFamily: {
        sans: ['Switzer', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'skeleton': 'skeleton-shimmer 1.5s ease-in-out infinite',
      },
      backgroundSize: {
        'shimmer': '200% 100%',
      },
    },
  },
  plugins: [],
}
