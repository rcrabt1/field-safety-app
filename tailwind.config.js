/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:        '#1B4F8A',
          'blue-mid':  '#2E75B6',
          'blue-lt':   '#D6E4F0',
          orange:      '#E8731A',
          'orange-lt': '#FDF1E7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

