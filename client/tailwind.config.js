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
        wa: {
          green: {
            DEFAULT: '#00a884',
            dark: '#008069',
            light: '#25d366',
            hover: '#02906f'
          },
          bg: {
            dark: '#111b21',
            darker: '#0c1317',
            panel: '#202c33',
            input: '#2a3942',
            bubble: '#005c4b',
            bubbleIncoming: '#202c33',
            light: '#f0f2f5',
            lightBubble: '#d9fdd3',
            lightIncoming: '#ffffff'
          },
          text: {
            primary: '#e9edef',
            secondary: '#8696a0',
            muted: '#667781',
            accent: '#53bdeb'
          },
          border: {
            dark: '#222d34',
            light: '#e9edef'
          }
        }
      }
    },
  },
  plugins: [],
}
