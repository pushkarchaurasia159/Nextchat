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
        navy: {
          950: '#070D1E', // Ultra-deep velvet cosmic navy backdrop
          900: '#0A1226',
          800: '#0E1A34', // Frosted Slate Navy panel
          700: '#13203E', // Incoming message bubble
          600: '#16264A', // Active item hover / card surface
          500: '#1E325E'
        },
        slate: {
          850: '#152033',
          750: '#23334D'
        },
        sapphire: {
          DEFAULT: '#0284C7',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8', // Luminous flare
          500: '#0EA5E9',
          600: '#0284C7', // Outgoing bubble gradient start
          700: '#2563EB', // Outgoing bubble gradient end
          800: '#1D4ED8',
          900: '#1E40AF',
          950: '#0C2340'
        }
      }
    },
  },
  plugins: [],
}
