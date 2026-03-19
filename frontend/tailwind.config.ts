import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
      colors: {
        base: {
          950: '#070A0F',
          900: '#0B1020',
          800: '#101A2E',
          100: '#EAF0FF',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config

