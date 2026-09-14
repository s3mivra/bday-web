import { useMemo } from 'react';
import { Strawberry } from '@/components/starlight/Strawberry';

interface StarFieldProps {
  count: number;
}

type Piece = 'berry' | 'heart' | 'dot';

/** Decorative floating strawberries, hearts and dots. Positions are generated once per mount. */
export function StarField({ count }: StarFieldProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const roll = Math.random();
        const kind: Piece = roll < 0.18 ? 'berry' : roll < 0.6 ? 'heart' : 'dot';
        return {
          id: index,
          kind,
          size: kind === 'berry' ? 10 + Math.random() * 10 : 8 + Math.random() * 14,
          rotate: Math.round(Math.random() * 60 - 30),
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            '--d': `${2.5 + Math.random() * 3}s`,
            '--dl': `${Math.random() * 3}s`,
          } as React.CSSProperties,
        };
      }),
    [count],
  );

  return (
    <div className="sl-sky" aria-hidden="true">
      {pieces.map((piece) =>
        piece.kind === 'berry' ? (
          <span key={piece.id} className="sl-star sl-float-berry" style={piece.style}>
            <Strawberry size={piece.size} rotate={piece.rotate} />
          </span>
        ) : (
          <span key={piece.id} className="sl-star" style={{ ...piece.style, fontSize: `${piece.size}px` }}>
            {piece.kind === 'heart' ? '♥︎' : '•'}
          </span>
        ),
      )}
    </div>
  );
}
