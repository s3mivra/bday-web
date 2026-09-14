import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { StarField } from '@/components/starlight/StarField';
import { Strawberry } from '@/components/starlight/Strawberry';

type Stage = 'idle' | 'opening' | 'flipped' | 'rising' | 'growing' | 'done';

interface EnvelopeProps {
  celebrantName: string;
  occasion: string;
  heading: string;
  /** Called the moment the seal is tapped, so music can start inside the user gesture. */
  onOpenStart: () => void;
  onOpened: () => void;
}

/** Slightly irregular wax edge so the seal does not look like a flat coin. */
function sealPath(): string {
  let d = '';
  for (let i = 0; i <= 64; i += 1) {
    const a = (i / 64) * Math.PI * 2;
    const r = 46 + Math.sin(a * 11) * 2.2 + Math.sin(a * 5 + 1) * 1.2;
    d += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`;
  }
  return `${d}Z`;
}

function WaxSeal({ letter, className }: { letter: string; className: string }) {
  const gradientId = useId();
  const path = useMemo(sealPath, []);
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ff8aa5" />
          <stop offset=".45" stopColor="#df2a52" />
          <stop offset="1" stopColor="#8f0d2c" />
        </radialGradient>
      </defs>
      <path d={path} fill={`url(#${gradientId})`} />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#5e0620" strokeOpacity=".5" strokeWidth="2" />
      <circle cx="50" cy="50" r="29" fill="#000" fillOpacity=".06" />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Sacramento, cursive"
        fontSize="44"
        fill="#ffe3ea"
      >
        {letter}
      </text>
      <ellipse cx="36" cy="28" rx="12" ry="5" fill="#fff" fillOpacity=".35" transform="rotate(-30 36 28)" />
    </svg>
  );
}

interface Burst {
  id: number;
  berry: boolean;
  style: CSSProperties;
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * Full-screen envelope intro: the seal cracks, the flap opens, the letter rises
 * and grows into the page. Guests can be addressed by name with `?to=Name`.
 */
export function Envelope({ celebrantName, occasion, heading, onOpenStart, onOpened }: EnvelopeProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [bursts, setBursts] = useState<Burst[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sealRef = useRef<HTMLButtonElement | null>(null);

  const guest = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('to')?.trim() ?? '';
    return value.slice(0, 60);
  }, []);
  const initial = celebrantName.trim().charAt(0).toUpperCase() || '♥︎';

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  async function open() {
    if (stage !== 'idle') return;
    onOpenStart();

    const rect = stageRef.current?.getBoundingClientRect();
    if (rect) {
      setBursts(
        Array.from({ length: 18 }, (_, id) => {
          const angle = Math.random() * Math.PI * 2;
          const distance = 80 + Math.random() * 90;
          return {
            id,
            berry: id % 3 === 0,
            style: {
              left: rect.left + rect.width / 2,
              top: rect.top + rect.height * 0.54,
              fontSize: 10 + Math.random() * 14,
              '--x': `${Math.cos(angle) * distance}px`,
              '--y': `${Math.sin(angle) * distance}px`,
            } as CSSProperties,
          };
        }),
      );
    }

    const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setStage('opening');
    await wait(quick ? 0 : 700);
    setStage('flipped');
    await wait(quick ? 0 : 500);
    setStage('rising');
    await wait(quick ? 0 : 1000);
    setStage('growing');
    await wait(quick ? 0 : 700);
    setStage('done');
    await wait(quick ? 0 : 1000);
    onOpened();
  }

  return (
    <div className="sl-intro" data-stage={stage} role="dialog" aria-modal="true" aria-label="Invitation envelope">
      <StarField count={60} />
      <div className="sl-rel">
        <div className="sl-intro-top">
          <div className="sl-kicker">you&apos;ve got mail</div>
          <div className="sl-hand">{heading}</div>
        </div>

        <div className="sl-stage" ref={stageRef}>
          <div className="sl-env sl-env-back" />
          <div className="sl-letter">
            <span className="sl-kicker">you are invited to</span>
            <span className="sl-hand">{celebrantName}</span>
            <span className="sl-kicker">{occasion}</span>
          </div>
          <div className="sl-env sl-env-front" />
          <div className="sl-flap" />
          <div className="sl-to">
            To<b>{guest || 'our dearest guest'}</b>
          </div>
          <div className="sl-stamp" aria-hidden="true">
            <Strawberry size={26} />
          </div>
          <button
            ref={sealRef}
            type="button"
            className="sl-seal"
            onClick={() => void open()}
            aria-label="Break the seal to open the invitation"
          >
            <WaxSeal letter={initial} className="whole" />
            <WaxSeal letter={initial} className="half left" />
            <WaxSeal letter={initial} className="half right" />
          </button>
        </div>

        <p className="sl-hint">tap the seal to open</p>
      </div>

      {bursts.map((burst) => (
        <span key={burst.id} className="sl-burst" style={burst.style} aria-hidden="true">
          {burst.berry ? <Strawberry size={20} /> : '♥︎'}
        </span>
      ))}
    </div>
  );
}
