import { useEffect, useMemo, useState } from 'react';

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  isReady: boolean;
}

const SECOND = 1000;

function diff(target: number, now: number): CountdownState {
  const delta = target - now;
  if (delta <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, isReady: true };
  }
  const totalSeconds = Math.floor(delta / SECOND);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: false,
    isReady: true,
  };
}

/**
 * Ticks once a second against a fixed target. The interval is cleared as soon
 * as the target passes so an expired countdown costs nothing.
 */
export function useCountdown(target: Date | null): CountdownState {
  const targetTime = target?.getTime() ?? null;
  const initial = useMemo<CountdownState>(
    () =>
      targetTime === null
        ? { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isReady: false }
        : diff(targetTime, Date.now()),
    [targetTime],
  );

  const [state, setState] = useState<CountdownState>(initial);

  useEffect(() => {
    if (targetTime === null) {
      setState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isReady: false });
      return;
    }

    setState(diff(targetTime, Date.now()));
    if (targetTime <= Date.now()) return;

    const id = window.setInterval(() => {
      const next = diff(targetTime, Date.now());
      setState(next);
      if (next.isPast) window.clearInterval(id);
    }, SECOND);

    return () => window.clearInterval(id);
  }, [targetTime]);

  return state;
}
