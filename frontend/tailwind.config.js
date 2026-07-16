/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#0065BD',
        'brand-dark': '#003E7E',
        ink: '#1A1A1A',
        'ink-muted': '#5B5B5B',
        line: '#D9D9D9',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        DEFAULT: '2px',
      },
    },
  },
  plugins: [],
}
