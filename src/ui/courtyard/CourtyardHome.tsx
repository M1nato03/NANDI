import { useEffect, useState } from 'react';
import raw from './anchors.json';
import { homeFit, parseAnchors } from '../../core/courtyard/anchors';
import { useCourtyard } from './Courtyard';
import { LayoutBScene } from './LayoutBScene';
import { go } from '../shell/router';
import { CourtyardCard, useYatra } from '../yatra/Yatra';
import { treeKeepsakes, type Keepsake } from '../../core/courtyard/keepsakes';
import './layoutB.css';


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
  const yatra = useYatra();
  const { width, height } = useViewport();
  const fit = homeFit(ANCHORS, width, height, TOP_MOST);
  const keepsakes = yatra ? treeKeepsakes(yatra.trek) : [];
  const [tapped, setTapped] = useState<Keepsake | null>(null);
  useEffect(() => { if (!tapped) return; const timer = window.setTimeout(() => setTapped(null), 6000); return () => window.clearTimeout(timer); }, [tapped]);
  return <section className="courtyard-b-home" aria-label="Courtyard">
    <h1 className="sr-only">Courtyard</h1>
    {data && <LayoutBScene anchors={ANCHORS} fit={fit} width={width} height={height} state={data.state} phase={data.phase} onFriend={area => go(`courtyard/view/${area}`)}
      keepsakes={keepsakes} onKeepsake={setTapped} />}
    {/* §0.14: the camp's name only as a caption outside the art, with the way to its postcard. */}
    {tapped && <p className="courtyard-keepsake-caption" role="status"><span>From {tapped.campName}</span>
      <button type="button" className="text-button" onClick={() => go(`yatra/journal/${tapped.landmarkId}`)}>See its postcard</button></p>}
    <CourtyardCard />
  </section>;
}
