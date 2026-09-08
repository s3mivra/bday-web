/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Channels are defined in src/index.css and swapped per [data-theme].
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
          veil: 'rgb(var(--c-ink-veil) / <alpha-value>)',
          line: 'rgb(var(--c-ink-line) / <alpha-value>)',
          contrast: 'rgb(var(--c-ink-contrast) / <alpha-value>)',
        },
        champagne: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          deep: 'rgb(var(--c-accent-deep) / <alpha-value>)',
          faint: 'rgb(var(--c-accent-faint) / <alpha-value>)',
        },
        blush: 'rgb(var(--c-blush) / <alpha-value>)',
        mist: 'rgb(var(--c-mist) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
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
