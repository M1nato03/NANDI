import { useEffect, useState } from 'react';
import raw from './anchors.json';
import { homeFit, parseAnchors, type ScreenChromeCss } from '../../core/courtyard/anchors';
import { nudgeAnchors } from '../../core/courtyard/nudges';
import { useCourtyard } from './Courtyard';
import { LayoutBScene } from './LayoutBScene';
import { go } from '../shell/router';
import { CourtyardCard, useYatra } from '../yatra/Yatra';
import { treeKeepsakes, type Keepsake } from '../../core/courtyard/keepsakes';
import './layoutB.css';


/** The painted pass's anchors (p9p now; 9q swaps in with scripts/import-courtyard-anchors.ts). */
// The painted pass plus the layout-B nudges (b2 9 Nov: the beside rule at ≤ 6 px on the real sprites).
const ANCHORS = nudgeAnchors(parseAnchors(raw));
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
 * The real top bar and bottom card, measured (gate-s2 shots: header 68, card 146 + its 8 gap + the 64 tab bar at 100%;
 * at 200% text the card grows). The fit keeps every friend and prop above the card's top, so the front row lifts when
 * the card grows.
 */
function useChrome(width: number, height: number): ScreenChromeCss | undefined {
  const [chrome, setChrome] = useState<ScreenChromeCss>();
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('.topbar')?.getBoundingClientRect().bottom;
      const card = document.querySelector('.courtyard-card')?.getBoundingClientRect().top;
      if (header === undefined || card === undefined) return;
      setChrome(current => current && Math.abs(current.headerCss - header) < 0.5 && Math.abs(current.cardCss - (height - card)) < 0.5 ? current : { headerCss: header, cardCss: height - card });
    };
    measure();
    const watch = new ResizeObserver(measure);
    for (const node of document.querySelectorAll('.topbar, .courtyard-card')) watch.observe(node);
    return () => watch.disconnect();
  }, [width, height]);
  return chrome;
}

/**
 * Spec 571 §0.19 layout B (stage 2 commit 3): the Courtyard is the whole screen between the header and the tab bar,
 * with the §0.2 rows in one compact bottom card. Today's courtyard parts stand where the painted pass puts them.
 */
export function CourtyardHome() {
  const data = useCourtyard();
  const yatra = useYatra();
  const { width, height } = useViewport();
  const chrome = useChrome(width, height);
  const fit = homeFit(ANCHORS, width, height, TOP_MOST, undefined, chrome);
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
    <CourtyardCard phase={data?.phase} />
  </section>;
}
