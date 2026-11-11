import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: [
          'SFMono-Regular', 'SF Mono', 'ui-monospace',
          'Cascadia Code', 'Menlo', 'Courier New', 'monospace',
        ],
      },
      colors: {
        // Warm neutral palette
        canvas: '#F7F6F3',
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#FAFAF8',
          subtle: '#F2F1EE',
          hover: '#EDECE9',
          active: '#E8E7E3',
        },
        // Forest green accent
        forest: {
          50:  '#EAF4EE',
          100: '#C0DAC9',
          200: '#8DC0A3',
          300: '#5DA37A',
          500: '#2D6A4F',   // primary
          600: '#1E4D38',   // hover
          700: '#163827',
        },
        // Text
        ink: {
          DEFAULT: '#1A1A18',  // primary
          2: '#4A4A45',        // secondary
          3: '#7A7A74',        // muted
          4: '#A8A8A0',        // faint
        },
        // Topbar
        onyx: {
          DEFAULT: '#1C1C1A',
          soft: '#2A2A27',
          border: '#2E2E2B',
        },
        // Borders
        line: {
          DEFAULT: '#E2E0DB',
          strong: '#CCCAC4',
        },
        // Risk
        risk: {
          'high-bg':     '#FEF2F0',
          'high-text':   '#B42318',
          'high-border': '#FECDC9',
          'med-bg':      '#FFFAEB',
          'med-text':    '#B54708',
          'med-border':  '#FEDF89',
        },
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',   { lineHeight: '1.125rem' }],
        sm:    ['0.8125rem', { lineHeight: '1.25rem' }],
        base:  ['0.875rem',  { lineHeight: '1.375rem' }],
        md:    ['0.9375rem', { lineHeight: '1.5rem' }],
        lg:    ['1rem',      { lineHeight: '1.5rem' }],
        xl:    ['1.125rem',  { lineHeight: '1.625rem' }],
        '2xl': ['1.25rem',   { lineHeight: '1.75rem' }],
      },
      boxShadow: {
        xs:    '0 1px 2px 0 rgba(26, 26, 24, 0.04)',
        sm:    '0 1px 3px 0 rgba(26, 26, 24, 0.06), 0 1px 2px -1px rgba(26, 26, 24, 0.04)',
        md:    '0 4px 6px -1px rgba(26, 26, 24, 0.07), 0 2px 4px -2px rgba(26, 26, 24, 0.05)',
        modal: '0 20px 40px -8px rgba(26, 26, 24, 0.20), 0 8px 16px -4px rgba(26, 26, 24, 0.10)',
      },
      borderRadius: {
        DEFAULT: '5px',
        sm: '3px',
        md: '6px',
        lg: '8px',
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
