import { useEffect, useState } from 'react';
import { Nandi } from './Cast';

let openedThisRun = false;
export function shouldOpen({ night, pause, reduced }: { night: boolean; pause: boolean; reduced: boolean }): boolean {
  if (openedThisRun) return false;
  openedThisRun = true;
  return !night && !pause && !reduced;
}
export function OpenMoment({ night, pause }: { night: boolean; pause: boolean }) {
  const [visible, setVisible] = useState(() => shouldOpen({ night, pause, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce' }));
  useEffect(() => { if (night || pause) queueMicrotask(() => setVisible(false)); }, [night, pause]);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 1100);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return <div role="button" tabIndex={0} className="cast-open" aria-label="Skip opening animation" onClick={() => setVisible(false)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setVisible(false); } }}>
    <span className="cast-open-inner"><Nandi size={108} /><strong>NANDI</strong></span>
  </div>;
}
