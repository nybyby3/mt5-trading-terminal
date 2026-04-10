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
        terminal: {
          bg: '#0d1117',
          panel: '#161b22',
          border: '#30363d',
          header: '#1c2128',
          hover: '#1f2937',
          accent: '#1f6feb',
          green: '#26a69a',
          red: '#ef5350',
          text: '#e6edf3',
          muted: '#8b949e',
          yellow: '#f0b429',
        },
      },
    },
  },
  plugins: [],
};
