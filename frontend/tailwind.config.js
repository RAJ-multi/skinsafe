/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f5',
          100: '#e5ede8',
          200: '#cedecf',
          300: '#abc7af',
          400: '#81aa87',
          500: '#5f8d66',
          600: '#4a7251',
          700: '#3c5b42',
          800: '#324a37',
          900: '#2a3e2f',
        },
      },
    },
  },
  plugins: [],
};

