/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "ink" - deep charcoal-navy base (not pure black), used for
        // backgrounds and text-on-dark across the app.
        ink: {
          950: '#0A0E17',
          900: '#10151F',
          800: '#1A2130',
          700: '#252E42',
          600: '#3A4356',
          400: '#8A93A6',
          200: '#C7CCD6',
          100: '#EDEFF3',
        },
        // "pulse" - signal teal, reserved for AI-active / live states
        // (AIStatusIndicator, waveform motifs, live caption cursor).
        pulse: {
          400: '#5CE6DA',
          500: '#21D0C3',
          600: '#14A99E',
        },
        // "voice" - warm coral, reserved for primary actions/CTAs.
        voice: {
          400: '#FF8A72',
          500: '#FF6B4A',
          600: '#E85A3B',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
