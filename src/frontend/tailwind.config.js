/** @type {import('tailwindcss').Config} */
export default {
  content: [
    '../backend/views/**/*.ejs',
    '../../public/**/*.js',
  ],
  safelist: [
    'markdown-body',
    'list-reset',
    { pattern: /markdown-body.*/ }
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
