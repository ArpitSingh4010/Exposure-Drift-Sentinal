import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // ── Brand palette ─────────────────────────────────────────────────
        navy: {
          50: '#e8edf5',
          100: '#c5d0e6',
          200: '#9fb1d5',
          300: '#7892c4',
          400: '#577ab8',
          500: '#3563ab',
          600: '#2a52a0',
          700: '#1e3f94',
          800: '#132c88',
          900: '#0B1F3A', // primary topbar colour
          950: '#071428',
        },
        teal: {
          50: '#e0f7f5',
          100: '#b2ede8',
          200: '#7de3db',
          300: '#44d8ce',
          400: '#00d0c3',
          500: '#00c7b8', // primary accent
          600: '#00b5a6',
          700: '#009d8f',
          800: '#008579',
          900: '#005f55',
        },
        severity: {
          high: '#dc2626',      // red-600
          medium: '#d97706',    // amber-600
          low: '#2563eb',       // blue-600
          verify: '#6b7280',    // gray-500
        },
      },
      fontSize: {
        // Enterprise density — 14px base
        base: ['14px', { lineHeight: '20px' }],
        sm: ['12px', { lineHeight: '16px' }],
        xs: ['11px', { lineHeight: '14px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.12)',
        topbar: '0 1px 4px 0 rgb(0 0 0 / 0.20)',
      },
      borderRadius: {
        chip: '4px',
      },
    },
  },
  plugins: [],
} satisfies Config;
