/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FACC15',
          'yellow-hover': '#EAB308',
          'yellow-light': '#FEF08A',
          'yellow-subtle': '#FEFCE8',
          dark: '#111111',
          black: '#000000',
          white: '#FFFFFF',
          bg: '#F8F8F6',
          text: '#171717',
          'text-muted': '#525252',
          border: '#E5E5E5',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
