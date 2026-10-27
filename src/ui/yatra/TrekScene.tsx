import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { STAR_COLOURS, STRETCHES_PER_LEG, type Constellation, type Star, type Trek } from '../../core/yatra/trek';
import { Cast } from '../cast/Cast';

/** Spec 34 trek scene: one side-on world, trail below and sky above, so scrolling back scrolls the sky too. */
export const LEG_W = 300;
const PAD = 90;
const RIDGE_W = 1110;
const SEEN_KEY = 'nandi.yatra.seen';

const placeX = (index: number) => PAD + index * LEG_W;
const groupX = (walked: number, legs: number) => { const capped = Math.min(walked, legs * STRETCHES_PER_LEG); return placeX(Math.floor(capped / STRETCHES_PER_LEG)) + (capped % STRETCHES_PER_LEG) * LEG_W / STRETCHES_PER_LEG; };
const walkedOf = (trek: Trek) => trek.legs.reduce((sum, leg) => sum + leg.stretches.length, 0);
/** A small stable number from a string, for star places and the faint sky. */
function hash(text: string): number { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return (h >>> 0) / 4294967295; }
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
function readSeen(): number | null { try { const value = Number(localStorage.getItem(SEEN_KEY)); return Number.isFinite(value) && localStorage.getItem(SEEN_KEY) !== null ? value : null; } catch { return null; } }
function writeSeen(value: number) { try { localStorage.setItem(SEEN_KEY, String(value)); } catch { /* a convenience only */ } }

function starPoint(star: Star, left: number, width: number, index: number) {
  return { x: left + 30 + hash(`${star.id}x`) * (width - 60), y: 26 + ((hash(`${star.id}y`) + index * 0.37) % 1) * 104 };
}

const Ridge = ({ kind, copies }: { kind: 'far' | 'mid' | 'front'; copies: number }) => {
  const paths = {
    far: <><path d="M0 177L56 137L105 162L171 96L225 147L290 80L363 156L431 103L496 158L557 82L632 151L702 93L770 157L845 76L916 153L994 99L1061 160L1110 123V294H0Z" fill="#a6bdb2" /><path d="M134 126L171 96L202 126L183 119L169 109L155 125ZM269 111L290 80L325 118L299 106L288 96ZM532 113L557 82L584 119L563 102ZM819 108L845 76L872 110L850 92Z" fill="#f4ead5" opacity=".76" /></>,
    mid: <><path d="M0 207L67 177L126 194L207 152L281 194L341 151L418 198L496 156L578 200L665 149L738 202L808 154L891 207L975 159L1050 195L1110 169V294H0Z" fill="#779f8c" /><path d="M0 236Q70 198 141 222T271 215T420 223T586 211T745 224T918 212T1110 230V294H0Z" fill="#608e77" /></>,
    front: <><path d="M0 266Q102 246 169 271T337 260T514 273T683 258T853 275T1110 252V294H0Z" fill="#456d60" opacity=".85" /><path d="M0 284Q133 267 223 287T443 281T647 288T867 275T1110 285V294H0Z" fill="#315e58" opacity=".75" /></>,
  };
  return <div className={`trek-ridge trek-ridge-${kind}`} aria-hidden="true">{Array.from({ length: copies }, (_, i) => <svg key={i} viewBox="0 0 1110 294" preserveAspectRatio="none" style={{ left: i * RIDGE_W }}>{paths[kind]}</svg>)}</div>;
};
const Tent = () => <svg viewBox="0 0 90 70" aria-hidden="true"><path d="M9 57L45 10L82 57Z" fill="#e5a75b" stroke="#5e5a49" strokeWidth="2" /><path d="M45 10L45 57H82Z" fill="#b9623b" /><path d="M42 57L54 39L65 57" fill="#3e4b44" /><path d="M9 57H82" stroke="#5e5a49" strokeWidth="3" /></svg>;
const Cairn = () => <svg viewBox="0 0 40 56" aria-hidden="true"><path d="M20 4V30" stroke="#5e5a49" strokeWidth="2" /><path d="M20 5L34 10L20 15Z" fill="#d9573b" /><ellipse cx="20" cy="50" rx="15" ry="5" fill="#8d8a7c" /><ellipse cx="20" cy="42" rx="11" ry="4.5" fill="#a19e90" /><ellipse cx="20" cy="35" rx="7" ry="3.5" fill="#b5b2a4" /></svg>;
const Gate = () => <svg viewBox="0 0 45 54" aria-hidden="true"><path d="M4 53V7Q22 -4 41 7V53" fill="none" stroke="#5c5542" strokeWidth="4" /><path className="trek-gate-door" d="M8 51V11Q22 4 37 11V51Z" fill="#ae7750" stroke="#654c37" strokeWidth="1.5" /><path className="trek-gate-door" d="M8 26H37M16 8V52M29 8V52" stroke="#714c35" strokeWidth="2" /></svg>;
const Fire = () => <svg viewBox="0 0 30 40" aria-hidden="true"><path d="M2 34L27 39M27 34L2 39" stroke="#67503d" strokeWidth="4" strokeLinecap="round" /><path className="trek-flame" d="M15 33C5 29 6 20 14 10C13 19 20 14 21 4C27 16 28 28 18 33Z" fill="#ff9d34" /><path className="trek-flame" d="M15 32C11 27 12 23 16 17C16 23 20 23 20 19C22 25 20 31 15 32Z" fill="#ffe6a1" /></svg>;

export function TrekScene({ trek, night, brighten = 0, onRename }: { trek: Trek; night: boolean; brighten?: number; onRename: (constellation: Constellation) => void }) {
  const legs = trek.trail.legs.length;
  const width = PAD * 2 + legs * LEG_W;
  const walked = walkedOf(trek);
  // Item 192 g: the walk plays the next time Yatra is seen by day; at night the group stays where it stopped.
  const [shown, setShown] = useState(() => { const seen = readSeen(); return night || seen === null || seen > walked ? walked : seen; });
  const scroller = useRef<HTMLDivElement>(null);
  const far = useRef<HTMLDivElement>(null), mid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (night) return;
    if (shown === walked) { writeSeen(walked); return; }
    const timer = window.setTimeout(() => { setShown(walked); writeSeen(walked); }, reducedMotion() ? 0 : 450);
    return () => window.clearTimeout(timer);
  }, [night, shown, walked]);
  const gx = groupX(shown, legs);
  useLayoutEffect(() => { const node = scroller.current; if (node) node.scrollLeft = Math.max(0, groupX(walked, legs) - node.clientWidth * 0.55); }, [walked, legs]);
  const onScroll = () => { const x = scroller.current?.scrollLeft ?? 0; if (far.current) far.current.style.transform = `translateX(${x * 0.23}px)`; if (mid.current) mid.current.style.transform = `translateX(${x * 0.12}px)`; };
  const place = trek.trail.places[Math.min(trek.place, trek.trail.places.length - 1)]!;
  const next = trek.trail.places[trek.place + 1];
  const atPlace = trek.today.atPlace || trek.complete;
  const fire = night || trek.today.campDay;
  const formed = new Set(trek.constellations.flatMap(row => row.stars.map(star => star.id)));
  const loose = trek.today.stars.filter(star => !formed.has(star.id));
  // A night Calm brightens tonight's stars one per out-breath, in turn.
  const tonight = trek.today.stars;
  const brightId = brighten && tonight.length ? tonight[(brighten - 1) % tonight.length]!.id : undefined;
  const copies = Math.ceil(width / RIDGE_W) + 1;
  const pinpricks = Array.from({ length: Math.round(width / 22) }, (_, i) => ({ x: hash(`p${i}x`) * width, y: 8 + hash(`p${i}y`) * 120, o: 0.2 + hash(`p${i}o`) * 0.5 }));
  const caption = night ? (atPlace ? `At ${place.name}` : 'By a trailside fire') : trek.complete ? 'Trail complete' : trek.today.campDay ? atPlace ? `A day at ${place.name}` : 'A day on the trail' : atPlace ? `${place.name} camp` : `Toward ${next?.name ?? place.name}`;

  return <section className={`trek-scene${night ? ' is-night' : ''}`} aria-label={`${trek.trail.name} trail. Swipe to look back along it.`}>
    <div className="trek-scroll" ref={scroller} onScroll={onScroll} tabIndex={0} aria-label="Swipe the trail sideways">
      <div className="trek-world" style={{ width }}>
        <div className="trek-sun" style={{ left: Math.max(PAD, gx - 40) }} aria-hidden="true" />
        <div ref={far} className="trek-layer"><Ridge kind="far" copies={copies} /></div>
        <div ref={mid} className="trek-layer"><Ridge kind="mid" copies={copies} /></div>
        <div className="trek-grass" /><div className="trek-road" /><div className="trek-stream" />
        <Ridge kind="front" copies={copies} />
        <div className="trek-overlay" /><div className="trek-pinpricks" aria-hidden="true">{pinpricks.map((dot, i) => <span key={i} style={{ left: dot.x, top: dot.y, opacity: dot.o }} />)}</div>
        {/* The sky over each leg: its constellation, joined and named, stays above that part of the trail. */}
        <svg className="trek-sky" width={width} height="276" aria-hidden="true">{trek.constellations.map(row => {
          const points = row.stars.map((star, i) => starPoint(star, placeX(row.leg), LEG_W, i)).sort((a, b) => a.x - b.x);
          return <path key={row.id} d={points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join('')} />;
        })}</svg>
        <div className="trek-stars">
          {trek.constellations.flatMap(row => row.stars.map((star, i) => ({ star, ...starPoint(star, placeX(row.leg), LEG_W, i) }))).concat(loose.map((star, i) => ({ star, ...starPoint(star, gx - 110, 220, i) })))
            .map(({ star, x, y }, i) => <i key={star.id} className={`trek-star${brightId === star.id ? ' bright' : ''}`} data-kind={star.kind} style={{ left: x, top: y, '--star': STAR_COLOURS[star.kind], '--delay': `${i * 0.23}s` } as CSSProperties} />)}
        </div>
        {night && trek.constellations.map(row => <button type="button" key={row.id} className="trek-constellation-name" style={{ left: placeX(row.leg) + LEG_W / 2 }} onClick={() => onRename(row)} aria-label={`${row.name}, a constellation. Rename it`}>{row.name}</button>)}
        {trek.trail.places.map((spot, i) => <div key={spot.id} className={`trek-tent${spot.kind === 'pass' ? ' is-pass' : ''}`} style={{ left: placeX(i) - (spot.kind === 'pass' ? 20 : 45) }}>{spot.kind === 'pass' ? <Cairn /> : <Tent />}</div>)}
        {trek.trail.legs.map((leg, i) => <div key={leg.landmark.id} className={`trek-gate${trek.legs[i]!.gateOn ? ' open' : ''}`} style={{ left: placeX(i) + LEG_W / 2 - 22 }} title={leg.landmark.name}><Gate /></div>)}
        <div className="trek-marks" aria-hidden="true">{trek.legs.flatMap(leg => leg.stretches.map((stretch, k) => {
          const from = placeX(leg.index) + k * LEG_W / STRETCHES_PER_LEG;
          if (leg.index * STRETCHES_PER_LEG + k >= shown) return [];
          if (stretch.kind === 'train') return Array.from({ length: 5 }, (_, f) => <i key={`${leg.index}-${k}-${f}`} className="trek-footprint" style={{ left: from + 16 + f * 15, bottom: 39 + (f % 2) * 4 }} />);
          if (stretch.kind === 'calm') return [<i key={`${leg.index}-${k}`} className="trek-rest" style={{ left: from + LEG_W / STRETCHES_PER_LEG - 30 }} />];
          return [];
        }))}</div>
        {fire && <div className="trek-fire" style={{ left: gx + 26 }}><Fire /></div>}
        <div className="trek-group" style={{ left: gx }}>
          <span className="trek-actor kachhua" style={{ left: -150 }}><Cast name="Kachhua" pose={night ? 'rest' : 'idle'} size={64} /></span>
          <span className="trek-actor kapi" style={{ left: -96 }}><Cast name="Kapi" pose={night ? 'rest' : 'idle'} size={62} /></span>
          <span className="trek-actor nandi" style={{ left: -44 }}><Cast name="Nandi" pose={night ? 'rest' : 'idle'} size={66} /></span>
        </div>
        {trek.trail.places.map((spot, i) => <div key={spot.id} className={`trek-place${i === trek.place && atPlace ? ' current' : ''}`} style={{ left: placeX(i) }}><b>{spot.name}</b><i /></div>)}
      </div>
    </div>
    <div className="trek-caption"><b>{place.name.toUpperCase()} · {night ? 'NIGHT' : 'DAY'}</b><span>{caption}</span></div>
  </section>;
}
