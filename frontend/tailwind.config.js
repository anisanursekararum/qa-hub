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
        'qa-blue': '#0F62FE',
        'qa-obsidian-1': '#161616',
        'qa-obsidian-2': '#1C1C21',
        'qa-purple': '#8A3FFC',
        'qa-green': '#198038',
        'qa-red': '#DA1E28',
        'qa-amber': '#F1C21B'
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
