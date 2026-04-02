import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#121212',
        paper: '#fdfcf8',
        rule: '#d4d0c8',
        muted: '#5c5c5c',
        accent: '#567b95'
      },
      fontFamily: {
        serif: ['"Libre Baskerville"', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'masthead-sm': ['1.75rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        masthead: ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        deck: ['1.0625rem', { lineHeight: '1.45' }]
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)'
      },
      maxWidth: {
        measure: '38rem',
        edition: '72rem'
      }
    }
  },
  plugins: []
} satisfies Config
