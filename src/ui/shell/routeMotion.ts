import { flushSync } from 'react-dom';

/**
 * Spec 45a: a route change brings the new page in over about 320 ms (from 6 px below, fading in) while the top bar,
 * the tab bar and the frame stay put. Transform and opacity only, on the page alone.
 * This is the spec's fallback, used everywhere (spec 45 decision 5): the browser's view transition was tried and dropped,
 * because under load a tab tap made soon after another one sometimes did not change the route (seen in e2e; the cause
 * was not pinned down), and the outgoing page cannot fade without it.
 * Nothing moves with reduced motion, while a dialog is open, on the first route, when the phone hid the page, or while
 * the new screen is still loading (a skeleton never fades in). A change during a running one ends it at once: the
 * latest route wins, and no old page or timer is left behind.
 * <html data-route-motion> says what the last change did ('fade' or 'none').
 */
let running: Animation | null = null;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
const loading = () => !!document.querySelector('#main .lazy-card-skeleton');
const said = (motion: 'fade' | 'none') => { document.documentElement.dataset.routeMotion = motion; };

/** Resolves when the page change in progress has finished (at once when none is running). */
export function routeMotionDone(): Promise<void> {
  return running ? running.finished.then(() => undefined, () => undefined) : Promise.resolve();
}

export function changeRoute(apply: () => void, { first = false } = {}): void {
  running?.cancel();
  running = null;
  if (first) { apply(); said('none'); return; }
  // A dialog (or the opening breath) over the page when the route changes: no fade.
  const modal = !!document.querySelector('[aria-modal="true"]');
  flushSync(apply);
  const main = document.getElementById('main');
  const still = modal || reduced() || document.visibilityState !== 'visible' || loading() || !main?.animate;
  if (still) { said('none'); return; }
  const animation = main.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
  running = animation;
  said('fade');
  void animation.finished.then(() => { if (running === animation) running = null; }, () => undefined);
}
