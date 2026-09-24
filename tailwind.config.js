/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#2d3a2e',
          green: '#3d5a3e',
          light: '#f5f3ef',
          cream: '#faf8f5',
        },
      },
      fontFamily: {
        thai: ['"Noto Sans Thai"', 'sans-serif'],
        'helvetica-neue': ['"Helvetica Neue Light"', 'Helvetica', 'Arial', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
        oswald: ['"Oswald"', 'sans-serif'],
        montserrat: ['"Montserrat"', 'sans-serif'],
        'roboto-slab': ['"Roboto Slab"', 'serif'],
        raleway: ['"Raleway"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
