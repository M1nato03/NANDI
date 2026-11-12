import { canonicalRoute } from './router';

/**
 * b2 13 Nov (spec 52 gate 5): the one next move's screen is fetched while the phone is idle, so the tap lands in the
 * thing without waiting for its code on a slow phone. The same imports AppShell's lazy screens use (one chunk each).
 */
export type Chunk = readonly [RegExp, () => Promise<unknown>];
export const CHUNKS: readonly Chunk[] = [
  [/^grow\/train(\/|$)/, () => import('../screens/Train')],
  [/^grow\/play(\/|$)/, () => import('../screens/Mind')],
  [/^grow\/read\/chapter\//, () => import('../learn/Chapter')],
  [/^plan\/(morning|shutdown)$/, () => import('../screens/Planner')],
  [/^you\/tonight$/, () => import('../screens/NightPlanSetting')],
];

/** Fetches the route's screen once the phone is idle; returns the canceller (an effect's cleanup). */
export function prefetchRoute(route: string, chunks: readonly Chunk[] = CHUNKS): () => void {
  const hit = chunks.find(([pattern]) => pattern.test(canonicalRoute(route)));
  if (!hit) return () => undefined;
  const run = () => { void hit[1]().catch(() => undefined); };
  if (typeof window.requestIdleCallback === 'function') { const id = window.requestIdleCallback(run, { timeout: 2000 }); return () => window.cancelIdleCallback(id); }
  const timer = window.setTimeout(run, 300);
  return () => window.clearTimeout(timer);
}
