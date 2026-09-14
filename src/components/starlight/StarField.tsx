import { useMemo } from 'react';

interface StarFieldProps {
  count: number;
}

/** Decorative twinkling hearts and dots. Positions are generated once per mount. */
export function StarField({ count }: StarFieldProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        glyph: Math.random() < 0.35 ? '♥︎' : '•',
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${8 + Math.random() * 16}px`,
          '--d': `${2 + Math.random() * 3}s`,
          '--dl': `${Math.random() * 3}s`,
        } as React.CSSProperties,
      })),
    [count],
  );

  return (
    <div className="sl-sky" aria-hidden="true">
      {stars.map((star) => (
        <span key={star.id} className="sl-star" style={star.style}>
          {star.glyph}
        </span>
      ))}
    </div>
  );
}
