/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#FE9200',
          'orange-light': '#FFB84D',
          'orange-dark': '#E58300',
          purple: '#7A00AA',
          'purple-light': '#9B2DD3',
          'purple-dark': '#5C0080',
          cream: '#FFF5E6',
        },
      },
    },
  },
  plugins: [],
}
