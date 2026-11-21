/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070A0F',
          900: '#0B0F17',
          850: '#101622',
          800: '#151D2C',
          700: '#1D273B',
          600: '#2A374F',
        },
        gold: {
          50: '#FCF9EE',
          100: '#F7F0D5',
          200: '#EEDDA7',
          300: '#E4C674',
          400: '#DDB64F',
          500: '#D4AF37', // Signature luxury champagne gold
          600: '#B69022',
          700: '#8E6D15',
          800: '#694F12',
          900: '#48350F',
        },
        lounge: {
          surface: '#111827',
          elevated: '#172033',
          border: 'rgba(212, 175, 55, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Gujarati"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        gujarati: ['"Noto Sans Gujarati"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 35px -5px rgba(212, 175, 55, 0.25)',
        'glow-emerald': '0 0 35px -5px rgba(16, 185, 129, 0.25)',
        'glass-subtle': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
