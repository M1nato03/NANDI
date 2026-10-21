import { useEffect, useState } from 'react';

const motionOff = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';

/** Counts from 0 to the target over `ms` (spec 13 E). Reduced motion shows the number at once. */
export function useCountUp(target: number, ms = 700, run = true): number {
  const [shown, setShown] = useState(() => (run && !motionOff() ? 0 : target));
  useEffect(() => {
    if (!run || motionOff()) { queueMicrotask(() => setShown(target)); return; }
    let frame = 0;
    const started = performance.now();
    const tick = (at: number) => {
      const t = Math.min(1, (at - started) / ms);
      setShown(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms, run]);
  return shown;
}
