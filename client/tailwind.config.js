/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff1f3',
          100: '#ffe4e8',
          200: '#ffc9d2',
          300: '#ff9fb4',
          400: '#ff6f96',
          500: '#ff3e7f',
          600: '#ea1f70',
          700: '#c51563',
          800: '#9f1556',
          900: '#781347'
        }
      },
      boxShadow: {
        glow: '0 0 40px rgba(255, 62, 127, 0.22)'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 10s linear infinite'
      }
    }
  },
  plugins: []
};