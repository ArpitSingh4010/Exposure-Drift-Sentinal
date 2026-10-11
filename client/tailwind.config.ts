import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // ── Brand palette ─────────────────────────────────────────────────
        navy: {
          50: '#f0f4fa',
          100: '#d9e2f1',
          200: '#b3c6e4',
          300: '#8da9d6',
          400: '#5c84c2',
          500: '#3463ab',
          600: '#264e8e',
          700: '#1b3b70',
          800: '#11274d',
          900: '#0B1F3A', // primary topbar
          950: '#07152b', // deep midnight
        },
        teal: {
          50: '#ecfdf9',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#00c7b8', // primary accent
          600: '#00a89b',
          700: '#008b80',
          800: '#056b63',
          900: '#044c46',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        slate: {
          850: '#152136',
          950: '#0a0f1d',
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
        '2xl': ['22px', { lineHeight: '30px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 10px 25px -5px rgb(11 31 58 / 0.08), 0 8px 10px -6px rgb(11 31 58 / 0.04)',
        topbar: '0 4px 20px -2px rgb(7 21 43 / 0.35)',
        glow: '0 0 20px -2px rgba(0, 199, 184, 0.35)',
        'glow-red': '0 0 20px -2px rgba(220, 38, 38, 0.35)',
      },
      borderRadius: {
        chip: '6px',
        card: '10px',
      },
    },
  },
  plugins: [],
} satisfies Config;
