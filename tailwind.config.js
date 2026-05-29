/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00D54B',
          gold: '#FFD700',
          dark: '#0D1117',
          card: '#161B22',
          border: '#30363D',
          text: '#E6EDF3',
          muted: '#8B949E',
        },
      },
    },
  },
  plugins: [],
}
