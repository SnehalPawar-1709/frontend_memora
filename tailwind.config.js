/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Ocean Pro — electric blue + deep navy
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#7BA8F5',
          500: '#4D7AC7',
          600: '#2D6FFF',
          700: '#1A56DB',
        },
        dark: {
          900: '#0B1120',
          800: '#111C35',
          700: '#1A2E55',
          600: '#1A3A6B',
          500: '#3A5A9A',
          400: '#4D7AC7',
          300: '#7BA8F5',
          200: '#94B4F0',
          100: '#E8F0FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
