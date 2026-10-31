import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { STAR_COLOURS, STRETCHES_PER_LEG, type Constellation, type Trek } from '../../core/yatra/trek';
import { Cast, type CastName } from '../cast/Cast';

/** Spec 34 trek scene: one side-on world, trail below and sky above, so scrolling back scrolls the sky too. */
// Spec 37: five friends walk now, so a leg is longer and the group still clears both camps' tents mid-leg.
export const LEG_W = 560;
// Item 203: room before the first place, so all five friends and the fire are in view at the start.
const PAD = 340;
const PAD_END = 120;
/** Where the group stands along a leg after 0, 1 or 2 stretches: clear of both camps' tents (item 203). */
// Spec 45b: the camp is wider (Mor's map to the fire), so the mid-leg stop is a little further on, clear of the tent.
const STOPS = [0, 0.62, 0.8];
/** The landmark gate stands between the mid-leg stop and the last one, so it is ahead of the friends mid-leg, not behind Nandi. */
const GATE_AT = (STOPS[1]! + STOPS[2]!) / 2;
const RIDGE_W = 1110;
/** A place's name sign stands under the camp fire, so it never covers Nandi at camp (jenil-7b review). */
const MARK_AT = 48;
const SEEN_KEY = 'nandi.yatra.seen';

const placeX = (index: number) => PAD + index * LEG_W;
const groupX = (walked: number, legs: number) => { const capped = Math.min(walked, legs * STRETCHES_PER_LEG); return placeX(Math.floor(capped / STRETCHES_PER_LEG)) + STOPS[capped % STRETCHES_PER_LEG]! * LEG_W; };
const walkedOf = (trek: Trek) => trek.legs.reduce((sum, leg) => sum + leg.stretches.length, 0);
/** A small stable number from a string, for star places and the faint sky. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  // A final mix, so near-identical strings (p1x, p2x…) do not land in a row (item 198).
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
/** Tonight's stars hang over the group, as in the prototype; past six they ring a little wider. */
const TONIGHT = [[-47, 79], [1, 45], [45, 75], [6, 113], [-20, 41], [48, 118]] as const;
const tonightPoint = (index: number, centre: number) => { const [dx, y] = TONIGHT[index % TONIGHT.length]!; const ring = Math.floor(index / TONIGHT.length); return { x: centre + dx * (1 + ring * 0.6) + ring * 14, y: y - ring * 12 }; };
/** Where the eye rests: the middle of the camp (all five friends stand to the left of the group's point). */
const centreOf = (gx: number) => gx - 128;

/**
 * Spec 45b: the camp. Each friend has its own place on shared ground (Mor at the map, Chiku on the reading rock, Nandi
 * by the pack, Kapi up in the branches, Kachhua by the fire), left of the group's point. On Home each is a button to
 * its area, labelled with the area's word (jenil-87: the word passes the glance test); the place is in its accessible name.
 */
export type CampFriend = { friend: CastName; say: string; area: string; route: string; left: number; bottom: number; size: number };
export const CAMP: readonly CampFriend[] = [
  { friend: 'Mor', say: 'Mor at the map', area: 'Plan', route: 'plan', left: -292, bottom: 0, size: 56 },
  { friend: 'Chiku', say: 'Chiku on the reading rock', area: 'Read', route: 'read', left: -228, bottom: 9, size: 52 },
  { friend: 'Nandi', say: 'Nandi by the pack', area: 'Train', route: 'yatra/train', left: -168, bottom: 0, size: 64 },
  { friend: 'Kapi', say: 'Kapi in the branches', area: 'Play', route: 'yatra/mind', left: -98, bottom: 86, size: 50 },
  { friend: 'Kachhua', say: 'Kachhua by the fire', area: 'Calm', route: 'yatra/calm', left: -62, bottom: 0, size: 58 },
];
/** The fire sits just right of Kachhua. */
const FIRE_AT = 2;
/** A tap's reaction plays this long before the area opens (the reaction itself is 450 ms). */
const TAP_MS = 240;

/** The scene's one line: where the friends are, by day or night. Home uses it as its heading. */
export function campLine(trek: Trek, night: boolean): string {
  const place = trek.trail.places[Math.min(trek.place, trek.trail.places.length - 1)]!;
  const next = trek.trail.places[trek.place + 1];
  const atPlace = trek.today.atPlace || trek.complete;
  if (night) return atPlace ? `At ${place.name}` : 'By a trailside fire';
  if (trek.complete) return 'Trail complete';
  if (trek.today.campDay) return atPlace ? `Camp at ${place.name}` : 'A day on the trail';
  return atPlace ? `${place.name} camp` : `On the way to ${next?.name ?? place.name}`;
}
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
function readSeen(): number | null { try { const value = Number(localStorage.getItem(SEEN_KEY)); return Number.isFinite(value) && localStorage.getItem(SEEN_KEY) !== null ? value : null; } catch { return null; } }
function writeSeen(value: number) { try { localStorage.setItem(SEEN_KEY, String(value)); } catch { /* a convenience only */ } }

/**
 * Where a constellation hangs: a finished leg's over the camp it ended at (where its stars first came out, as in the
 * prototype); a leg closed by a week, over the middle of that leg.
 */
function skyCentre(row: Constellation, trek: Trek): number {
  return trek.legs[row.leg]?.doneOn && row.formedOn === trek.legs[row.leg]!.doneOn ? centreOf(placeX(row.leg + 1)) : placeX(row.leg) + LEG_W / 2;
}
/** The prototype's kite: stars in order, closed into a shape from three on, with one strut across a four-star kite. */
function kitePath(points: { x: number; y: number }[]): string {
  const at = (point: { x: number; y: number }) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  if (points.length < 2) return '';
  let path = points.map((point, i) => `${i ? 'L' : 'M'}${at(point)}`).join('');
  if (points.length >= 3) path += `L${at(points[0]!)}`;
  if (points.length === 4) path += `M${at(points[1]!)}L${at(points[3]!)}`;
  return path;
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
/* Spec 45b camp props, in the notebook's quiet ink. */
const MapSheet = () => <svg viewBox="0 0 40 16" aria-hidden="true"><path d="M3 13L9 2L37 3L31 14Z" fill="#efe3c8" stroke="#6b5d4a" strokeWidth="1" strokeLinejoin="round" /><path d="M16 2.3L12 13.6M25 2.6L21 13.8" stroke="#6b5d4a" strokeWidth=".7" opacity=".5" /><path d="M9 10Q15 5 20 8T30 6" fill="none" stroke="#a5523a" strokeWidth="1" strokeDasharray="2 1.6" /></svg>;
const Rock = () => <svg viewBox="0 0 64 18" aria-hidden="true"><path d="M2 17C3 8 12 2 26 2C42 1 58 5 62 17Z" fill="#a8a493" stroke="#5f5a4b" strokeWidth="1.1" strokeLinejoin="round" /><path d="M14 8C20 5 30 5 36 6" fill="none" stroke="#e9e2cf" strokeWidth="1.2" strokeLinecap="round" opacity=".7" /></svg>;
const Pack = () => <svg viewBox="0 0 22 28" aria-hidden="true"><path d="M3 26V10C3 5 7 2 11 2C15 2 19 5 19 10V26Z" fill="#9c7a54" stroke="#4f3f2e" strokeWidth="1.1" strokeLinejoin="round" /><path d="M5 15H17V22H5Z" fill="#8a6948" stroke="#4f3f2e" strokeWidth=".9" /><path d="M8 2.6V0.8H14V2.6" fill="none" stroke="#4f3f2e" strokeWidth="1" /></svg>;
const Tree = () => <svg viewBox="0 0 70 140" aria-hidden="true"><path d="M40 140C39 110 41 80 37 40" fill="none" stroke="#6a5a45" strokeWidth="5" strokeLinecap="round" /><path d="M38 64C30 58 18 56 6 57" fill="none" stroke="#6a5a45" strokeWidth="3.4" strokeLinecap="round" /><path d="M38 52C46 44 56 42 66 43" fill="none" stroke="#6a5a45" strokeWidth="2.6" strokeLinecap="round" /><g fill="#7f9878" opacity=".9"><ellipse cx="34" cy="26" rx="20" ry="13" /><ellipse cx="52" cy="36" rx="14" ry="9" /><ellipse cx="16" cy="40" rx="13" ry="8" /></g><g fill="none" stroke="#56684f" strokeWidth=".9" opacity=".6"><path d="M22 24Q34 18 46 24M40 34Q50 30 60 36" /></g></svg>;
const FireRing = () => <svg viewBox="0 0 30 40" aria-hidden="true"><path d="M5 35L25 38M25 34L5 38" stroke="#67503d" strokeWidth="3" strokeLinecap="round" /><g fill="#9c988a" stroke="#5f5a4b" strokeWidth=".8"><ellipse cx="3" cy="37" rx="3" ry="2" /><ellipse cx="27" cy="37" rx="3" ry="2" /><ellipse cx="15" cy="39" rx="3.2" ry="1.8" /></g></svg>;
const Fire = () => <svg viewBox="0 0 30 40" aria-hidden="true"><path d="M2 34L27 39M27 34L2 39" stroke="#67503d" strokeWidth="4" strokeLinecap="round" /><path className="trek-flame" d="M15 33C5 29 6 20 14 10C13 19 20 14 21 4C27 16 28 28 18 33Z" fill="#ff9d34" /><path className="trek-flame" d="M15 32C11 27 12 23 16 17C16 23 20 23 20 19C22 25 20 31 15 32Z" fill="#ffe6a1" /></svg>;

export function TrekScene({ trek, night, dusk = false, brighten = 0, breath, onRename, onFriend }: { trek: Trek; night: boolean; dusk?: boolean; brighten?: number; breath?: { phase: 'in' | 'out'; in: number; out: number }; onRename: (constellation: Constellation) => void; onFriend?: (spot: CampFriend) => void }) {
  const legs = trek.trail.legs.length;
  const width = PAD + legs * LEG_W + PAD_END;
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
  const world = useRef<HTMLDivElement>(null);
  // A constellation's name is never shown cut at the edge: one that does not fit the view hides until it does.
  const fitLabels = () => {
    const node = scroller.current;
    if (!node || !world.current) return;
    for (const label of world.current.querySelectorAll<HTMLElement>('.trek-constellation-name')) {
      const left = label.offsetLeft - label.offsetWidth / 2, right = left + label.offsetWidth;
      label.dataset.cut = left < node.scrollLeft + 4 || right > node.scrollLeft + node.clientWidth - 4 ? 'yes' : 'no';
    }
  };
  // a11y C9 (jenil-87): the current camp's sign sits fully in view too, at any text size: the least scroll that shows it.
  const keepSign = () => {
    const node = scroller.current, sign = world.current?.querySelector<HTMLElement>('.trek-place.current b');
    // Home hides the current sign (its heading names the camp): nothing to keep in view then.
    if (!node || !sign || !sign.offsetWidth) return;
    const box = sign.getBoundingClientRect(), view = node.getBoundingClientRect();
    if (box.right > view.right - 8) node.scrollLeft += box.right - view.right + 8;
    else if (box.left < view.left + 8) node.scrollLeft -= view.left + 8 - box.left;
  };
  useLayoutEffect(() => { const node = scroller.current; if (node) node.scrollLeft = Math.max(0, centreOf(groupX(walked, legs)) - node.clientWidth / 2); keepSign(); fitLabels(); }, [walked, legs, night]);  
  useEffect(() => {
    const sign = world.current?.querySelector<HTMLElement>('.trek-place.current b');
    if (!sign || typeof ResizeObserver === 'undefined') return;
    const watch = new ResizeObserver(() => { keepSign(); fitLabels(); });
    watch.observe(sign);
    return () => watch.disconnect();
  }, [walked, legs, night]);  
  const onScroll = () => { fitLabels(); const x = scroller.current?.scrollLeft ?? 0; if (far.current) far.current.style.transform = `translateX(${x * 0.23}px)`; if (mid.current) mid.current.style.transform = `translateX(${x * 0.12}px)`; };
  const place = trek.trail.places[Math.min(trek.place, trek.trail.places.length - 1)]!;
  const atPlace = trek.today.atPlace || trek.complete;
  const fire = night || trek.today.campDay;
  const formed = new Set(trek.constellations.flatMap(row => row.stars.map(star => star.id)));
  const loose = trek.today.stars.filter(star => !formed.has(star.id));
  // A night Calm brightens tonight's stars one per out-breath, in turn.
  const tonight = trek.today.stars;
  const brightId = brighten && tonight.length ? tonight[(brighten - 1) % tonight.length]!.id : undefined;
  const copies = Math.ceil(width / RIDGE_W) + 1;
  const pinpricks = Array.from({ length: Math.round(width / 22) }, (_, i) => ({ x: hash(`p${i}x`) * width, y: 8 + hash(`p${i}y`) * 120, o: 0.2 + hash(`p${i}o`) * 0.5 }));
  // Spec 45b: a tap plays the friend's short reaction where it stands, then goes to its area once.
  const [taps, setTaps] = useState<Partial<Record<CastName, number>>>({});
  const leaving = useRef(false);
  const tap = (spot: CampFriend) => {
    if (!onFriend || leaving.current) return;
    leaving.current = true;
    setTaps(current => ({ ...current, [spot.friend]: (current[spot.friend] ?? 0) + 1 }));
    window.setTimeout(() => { leaving.current = false; onFriend(spot); }, reducedMotion() ? 0 : TAP_MS);
  };
  const home = !!onFriend;

  return <section className={`trek-scene${night ? ' is-night' : dusk ? ' is-dusk' : ''}${home ? ' is-home' : ''}`} aria-label={`${trek.trail.name} trail. Swipe to look back along it.`}>
    <div className="trek-scroll" ref={scroller} onScroll={onScroll} tabIndex={0} aria-label="Swipe the trail sideways">
      <div className="trek-world" ref={world} style={{ width }}>
        <div className="trek-sun" style={{ left: Math.max(PAD, gx - 40) }} aria-hidden="true" />
        <div ref={far} className="trek-layer"><Ridge kind="far" copies={copies} /></div>
        <div ref={mid} className="trek-layer"><Ridge kind="mid" copies={copies} /></div>
        <div className="trek-grass" /><div className="trek-road" /><div className="trek-stream" />
        <Ridge kind="front" copies={copies} />
        <div className="trek-overlay" /><div className="trek-pinpricks" aria-hidden="true">{pinpricks.map((dot, i) => <span key={i} style={{ left: dot.x, top: dot.y, opacity: dot.o }} />)}</div>
        {/* The sky over each leg: its constellation, joined and named, stays above that part of the trail. */}
        <svg className="trek-sky" width={width} height="276" aria-hidden="true">{trek.constellations.map(row => {
          const points = row.stars.map((_, i) => tonightPoint(i, skyCentre(row, trek)));
          return <path key={row.id} d={kitePath(points)} />;
        })}</svg>
        <div className="trek-stars">
          {trek.constellations.flatMap(row => row.stars.map((star, i) => ({ star, ...tonightPoint(i, skyCentre(row, trek)) }))).concat(loose.map((star, i) => ({ star, ...tonightPoint(i, centreOf(gx)) })))
            .map(({ star, x, y }, i) => <i key={star.id} className={`trek-star${brightId === star.id ? ' bright' : ''}`} data-kind={star.kind} style={{ left: x, top: y, '--star': STAR_COLOURS[star.kind], '--delay': `${i * 0.23}s` } as CSSProperties} />)}
        </div>
        {night && trek.constellations.map(row => <button type="button" key={row.id} className="trek-constellation-name" style={{ left: skyCentre(row, trek) }} onClick={() => onRename(row)} aria-label={`${row.name}, a constellation. Rename it`}>{row.name}</button>)}
        {trek.trail.places.map((spot, i) => <div key={spot.id} className={`trek-tent${spot.kind === 'pass' ? ' is-pass' : ''}`} style={{ left: placeX(i) - (spot.kind === 'pass' ? 20 : 45) }}>{spot.kind === 'pass' ? <Cairn /> : <Tent />}</div>)}
        {trek.trail.legs.map((leg, i) => <div key={leg.landmark.id} className={`trek-gate${trek.legs[i]!.gateOn ? ' open' : ''}`} style={{ left: placeX(i) + GATE_AT * LEG_W - 22 }} title={leg.landmark.name}><Gate /></div>)}
        <div className="trek-marks" aria-hidden="true">{trek.legs.flatMap(leg => leg.stretches.map((stretch, k) => {
          const from = placeX(leg.index) + STOPS[k]! * LEG_W;
          const span = ((STOPS[k + 1] ?? 1) - STOPS[k]!) * LEG_W;
          if (leg.index * STRETCHES_PER_LEG + k >= shown) return [];
          if (stretch.kind === 'train') return Array.from({ length: 5 }, (_, f) => <i key={`${leg.index}-${k}-${f}`} className="trek-footprint" style={{ left: from + span * 0.25 + f * 15, bottom: 39 + (f % 2) * 4 }} />);
          if (stretch.kind === 'calm') return [<i key={`${leg.index}-${k}`} className="trek-rest" style={{ left: from + span - 40 }} />];
          return [];
        }))}</div>
        <div className={`trek-fire${fire ? '' : ' is-cold'}`} style={{ left: gx + FIRE_AT }}>{fire ? <Fire /> : <FireRing />}</div>
        <div className="trek-group" style={{ left: gx }}>
          {/* Spec 45b: the camp's props, behind the friends who use them. */}
          <span className="trek-prop tree" style={{ left: -108 }}><Tree /></span>
          <span className="trek-prop map" style={{ left: -302 }}><MapSheet /></span>
          <span className="trek-prop rock" style={{ left: -234 }}><Rock /></span>
          <span className="trek-prop pack" style={{ left: -103 }}><Pack /></span>
          {/* At a night Calm, Kachhua is awake and breathes with the timer; the others may doze (spec 34 table). */}
          {CAMP.map(spot => {
            const pose = night && !(spot.friend === 'Kachhua' && breath) ? 'rest' : 'idle';
            const style = { left: spot.left, bottom: spot.bottom, '--lift': `${spot.bottom}px`, ...(spot.friend === 'Kachhua' ? { '--calm-in': `${breath?.in ?? 4}s`, '--calm-out': `${breath?.out ?? 6}s` } : {}) } as CSSProperties;
            const kind = `trek-actor ${spot.friend.toLowerCase()}`;
            const phase = spot.friend === 'Kachhua' ? breath?.phase : undefined;
            const cast = <Cast name={spot.friend} pose={pose} size={spot.size} {...(taps[spot.friend] ? { moment: 'tap' as const, at: taps[spot.friend] } : {})} />;
            return home
              ? <button type="button" key={spot.friend} className={`${kind} camp-friend`} style={style} data-phase={phase} aria-label={`${spot.area}, ${spot.say}`} onClick={() => tap(spot)}>{cast}<span className="camp-label" aria-hidden="true">{spot.area}</span></button>
              : <span key={spot.friend} className={kind} style={style} data-phase={phase}>{cast}</span>;
          })}
        </div>
        {trek.trail.places.map((spot, i) => <div key={spot.id} className={`trek-place${i === trek.place && atPlace ? ' current' : ''}`} style={{ left: placeX(i) + MARK_AT }}><b>{spot.name}</b><i /></div>)}
      </div>
    </div>
    {/* Home says where the camp is in its heading, so the scene does not say it twice. */}
    {!home && <div className="trek-caption"><b>{place.name.toUpperCase()} · {night ? 'NIGHT' : 'DAY'}</b><span>{campLine(trek, night)}</span></div>}
  </section>;
}
