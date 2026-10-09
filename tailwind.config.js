/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        facebook: {
          blue: '#1877F2',
          hover: '#166FE5',
          bg: '#F0F2F5',
          card: '#FFFFFF',
          text: '#050505',
          subtext: '#65676B',
          divider: '#CED0D4',
          active: '#E7F3FF',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
