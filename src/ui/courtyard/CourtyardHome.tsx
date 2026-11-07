import { lazy, Suspense } from 'react';
import { CourtyardScreen } from './Courtyard';

// Spec 571 stage 2: the home's rows come with the trek's chunk until the Courtyard home (layout B) gets its own card.
const HomeRows = lazy(() => import('../yatra/Yatra').then(module => ({ default: module.HomeRows })));

/**
 * Spec 571 stage 2, commit 2: the Courtyard tab is home: the courtyard, then the §0.2 rows (the one next move, this
 * week, the crew bar) as they stood on the Yatra home. Commit 3 turns this into layout B (the full scene + a bottom card).
 */
export function CourtyardHome() {
  return <>
    <CourtyardScreen />
    <Suspense fallback={null}><section className="screen courtyard-home-rows" aria-label="Today"><HomeRows /></section></Suspense>
  </>;
}
