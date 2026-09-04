/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c7d6fe',
          300: '#a4bbfd',
          400: '#7a96fa',
          500: '#526df4',
          600: '#384ee9',
          700: '#2b39d5',
          800: '#2731ad',
          900: '#242e88',
          950: '#14184f',
        },
        themeLight: {
          bg: '#FBFBFB',
          surface: '#E8F9FF',
          accent: '#C4D9FF',
          primary: '#C5BAFF',
        },
        dark: {
          bg: '#090d16',
          surface: '#0f172a',
          card: '#162036',
          border: '#1e293b',
          muted: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

