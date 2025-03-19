/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // 'class'に設定してクラスベースのダークモードを有効化
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c50502',
          dark: '#8e0000',
          light: '#f8d7d7'
        }
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}