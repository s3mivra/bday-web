import { useId, type CSSProperties } from 'react';

interface StrawberryProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Tilt in degrees, for scattered decorations. */
  rotate?: number;
}

const SEEDS: Array<[number, number]> = [
  [22, 30], [32, 27], [42, 30], [17, 41], [27, 39], [37, 38], [47, 40],
  [22, 50], [32, 48], [42, 50], [27, 59], [37, 58], [32, 68],
];

/** Hand-drawn style strawberry used across the berry design. Decorative only. */
export function Strawberry({ size = 32, className, style, rotate = 0 }: StrawberryProps) {
  const bodyId = useId();
  const shineId = useId();
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 64 74"
      className={className}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={bodyId} cx="38%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ff6b86" />
          <stop offset=".55" stopColor="#e8263f" />
          <stop offset="1" stopColor="#b3122f" />
        </radialGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Berry body */}
      <path
        d="M32 72C20 66 7 50 6 34 5.5 24 13 17 22 18c4 .4 7 2 10 2s6-1.6 10-2c9-1 16.5 6 16 16-1 16-14 32-26 38Z"
        fill={`url(#${bodyId})`}
      />
      <path d="M14 30c1-6 5-9 10-9-4 3-7 7-8 13Z" fill={`url(#${shineId})`} />
      {/* Seeds */}
      {SEEDS.map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x + 1} cy={y} rx="1.3" ry="2" fill="#ffe08a" opacity=".9" />
      ))}
      {/* Leaves */}
      <path
        d="M32 22c-3-4-9-6-15-4 4 1 7 3 9 6-5-1-10 0-13 3 6 0 11 1 14 3 1-3 3-5 5-8Z"
        fill="#3fa34d"
      />
      <path
        d="M32 22c3-4 9-6 15-4-4 1-7 3-9 6 5-1 10 0 13 3-6 0-11 1-14 3-1-3-3-5-5-8Z"
        fill="#2f8f3e"
      />
      <path d="M32 24c-2-2-3-5-3-8 2 1 3 3 3 5 0-3 1-5 3-6 0 3-1 6-3 9Z" fill="#4cb85a" />
      <path d="M32 16c0-5 2-9 5-12" stroke="#2f8f3e" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Three small strawberries, used as a divider above section titles. */
export function BerryDivider({ className }: { className?: string }) {
  return (
    <div className={`sl-berry-divider ${className ?? ''}`} aria-hidden="true">
      <span className="line" />
      <Strawberry size={16} rotate={-18} />
      <Strawberry size={22} />
      <Strawberry size={16} rotate={18} />
      <span className="line" />
    </div>
  );
}
