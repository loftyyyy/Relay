import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1A1D27',
        border: '#2A2D3A',
        accent: '#5B6EF5',
        'connected': '#22C55E',
        'reconnecting': '#F59E0B',
        'disconnected': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config
