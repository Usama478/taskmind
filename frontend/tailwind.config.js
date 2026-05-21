/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        appBackground: '#0F0F1A',
        chatBackground: '#16162A',
        boardBackground: '#1A1A2E',
        cardBackground: '#252540',
        inputBackground: '#1E1E35',
        priorityHigh: '#FF4757',
        priorityMedium: '#FFA502',
        priorityLow: '#2ED573',
        priorityDone: '#747D8C',
        accent: '#7C5CBF',
        accentHover: '#9370DB',
        aiBubble: '#2A1F45',
        userBubble: '#2F3542',
        borderColor: '#2E2E4E',
      },
    },
  },
  plugins: [],
}
