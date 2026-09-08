import { useCountdown } from '@/hooks/useCountdown';

interface CountdownProps {
  target: Date | null;
  pastMessage?: string;
}

const UNITS = ['Days', 'Hours', 'Minutes', 'Seconds'] as const;

export function Countdown({ target, pastMessage = 'The celebration has happened. Thank you for coming.' }: CountdownProps) {
  const { days, hours, minutes, seconds, isPast, isReady } = useCountdown(target);

  if (!isReady) return null;

  if (isPast) {
    return (
      <p className="text-sm text-champagne sm:text-base" role="status">
        {pastMessage}
      </p>
    );
  }

  const values = [days, hours, minutes, seconds];

  return (
    <div>
      <p className="sr-only" role="timer" aria-live="off">
        {days} days, {hours} hours, {minutes} minutes and {seconds} seconds until the celebration.
      </p>
      <ul aria-hidden="true" className="grid w-full max-w-md grid-cols-4 gap-px overflow-hidden rounded-xl border border-ink-line/70 bg-ink-line/70">
        {values.map((value, index) => (
          <li key={UNITS[index]} className="bg-ink-soft/80 px-1 py-4 text-center sm:px-2 sm:py-5">
            <span className="block font-display text-3xl tabular-nums text-mist sm:text-4xl">
              {String(value).padStart(2, '0')}
            </span>
            <span className="mt-1 block text-[0.65rem] tracking-wide text-muted sm:text-xs">
              {UNITS[index]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
