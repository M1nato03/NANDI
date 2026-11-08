import { lazy, Suspense, useEffect, useState } from 'react';
import raw from './anchors.json';
import { homeFit, parseAnchors } from '../../core/courtyard/anchors';
import { useCourtyard } from './Courtyard';
import { LayoutBScene } from './LayoutBScene';
import { go } from '../shell/router';
import './layoutB.css';

// The card's rows come with the trek's chunk (they read the jar and the next move).
const CourtyardCard = lazy(() => import('../yatra/Yatra').then(module => ({ default: module.CourtyardCard })));

/** The painted pass's anchors (p9p now; 9q swaps in with scripts/import-courtyard-anchors.ts). */
const ANCHORS = parseAnchors(raw);
/** What the header must never cover: Kapi on the wall top and his kite (canvas px). */
const TOP_MOST = Math.min(ANCHORS.friends.kapi.tap[1], ANCHORS.props['kapi-kite']?.[1] ?? Infinity);

function useViewport() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return size;
}

/**
 * Spec 571 §0.19 layout B (stage 2 commit 3): the Courtyard is the whole screen between the header and the tab bar,
 * with the §0.2 rows in one compact bottom card. Today's courtyard parts stand where the painted pass puts them.
 */
export function CourtyardHome() {
  const data = useCourtyard();
  const { width, height } = useViewport();
  const fit = homeFit(ANCHORS, width, height, TOP_MOST);
  return <section className="courtyard-b-home" aria-label="Courtyard">
    <h1 className="sr-only">Courtyard</h1>
    {data && <LayoutBScene anchors={ANCHORS} fit={fit} width={width} height={height} state={data.state} phase={data.phase} onFriend={area => go(`courtyard/view/${area}`)} />}
    <Suspense fallback={null}><CourtyardCard /></Suspense>
  </section>;
}
