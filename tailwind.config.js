/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:      '#005984',
          'navy-lt': '#E4F0F5',
          cyan:      '#14BCD9',
          'cyan-lt': '#E6F8FB',
          green:     '#50BB40',
          'green-lt':'#EBF7E9',
        },
        surface:  '#F5F2EC',
        hairline: '#DDD9D2',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

