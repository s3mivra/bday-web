/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#150F1E',
          soft: '#1F1730',
          veil: '#2C2140',
          line: '#3A2C52',
        },
        champagne: {
          DEFAULT: '#E4C285',
          deep: '#C69C57',
          faint: '#6A5330',
        },
        blush: '#E3A2A8',
        mist: '#F6F1EA',
        muted: '#B3A6C6',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Karla', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-sm': ['clamp(2.5rem, 11vw, 4rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(3.25rem, 13vw, 6rem)', { lineHeight: '0.92', letterSpacing: '-0.025em' }],
        'display-lg': ['clamp(3.75rem, 15vw, 8.5rem)', { lineHeight: '0.88', letterSpacing: '-0.03em' }],
      },
      maxWidth: {
        prose: '62ch',
      },
      boxShadow: {
        lift: '0 24px 60px -32px rgba(0, 0, 0, 0.85)',
        frame: '0 0 0 1px rgba(228, 194, 133, 0.18), 0 30px 80px -40px rgba(0,0,0,0.9)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translate3d(0, 18px, 0)' },
          to: { opacity: '1', transform: 'none' },
        },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        rise: 'rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fade: 'fade 400ms ease-out both',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
