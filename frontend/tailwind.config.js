/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#02040a',
          900: '#050a18',
          850: '#091124',
          800: '#0d1833',
          700: '#14234b',
          600: '#1e3368',
        },
        nasa: {
          blue: '#0b3d91',
          cyan: '#00e5ff',
          sky: '#38bdf8',
          orange: '#ff5722',
          red: '#ff1744',
          amber: '#ffab00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 229, 255, 0.4)',
        'glow-orange': '0 0 25px -5px rgba(255, 87, 34, 0.4)',
        'glow-earth': '0 0 60px 10px rgba(0, 180, 255, 0.18)',
      }
    },
  },
  plugins: [],
}

