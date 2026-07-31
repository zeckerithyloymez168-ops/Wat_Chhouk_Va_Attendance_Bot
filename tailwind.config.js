/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        temple: {
          gold: '#D4AF37',
          deepRed: '#7A1C1C',
          amber: '#E67E22',
          darkBg: '#121824',
          cardDark: '#1A2234',
        }
      },
      fontFamily: {
        khmer: ['"Kantumruy Pro"', '"Battambang"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
