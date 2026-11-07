import { lazy, Suspense } from 'react';
import { Plan } from '../screens/Plan';
import './yatraTab.css';

// Spec 571 stage 2 (§2): the trek is its own chunk, so Mor's list paints first; the fallback keeps the strip's height,
// so the plan never shifts when the scene arrives (CLS gate C7).
const TrekStrip = lazy(() => import('./Yatra').then(module => ({ default: module.TrekStrip })));

/** Spec 571 stage 2: the Yatra tab, the trek strip above Mor's plan (spec 27's list, unchanged). */
export function YatraTab({ questId }: { questId?: string }) {
  return <div className="yatra-tab">
    <Suspense fallback={<div className="trek-slot" aria-hidden="true" />}><TrekStrip /></Suspense>
    <Plan questId={questId} />
  </div>;
}
