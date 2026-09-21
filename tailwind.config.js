/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        thai: ['"Noto Sans Thai"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
