/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontWeight: {
        'extra-black': '950',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-gradient-to-r',
    'bg-gradient-to-br',
    'from-indigo-600',
    'to-purple-600',
    'text-white',
    'font-black',
    'shadow-2xl',
  ],
}