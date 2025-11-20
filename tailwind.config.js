/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
      },
    },
  },
  plugins: [],
};
