import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { STAR_COLOURS, STRETCHES_PER_LEG, type Constellation, type Trek } from '../../core/yatra/trek';
import { RAIN_LINE, type Weather } from '../../core/yatra/weather';
import { Cast, type CastName } from '../cast/Cast';
import { hash } from './hash';
import { Kit, Landmark, RIDGE_W, RidgeTile, scatterLeg, TALL_KIT } from './trekKit';
/** The camp's width: the five friends stand from this far left of the place's point. */
const CAMP_CLEAR = 320;
import { liftAt, placeLifts } from '../../core/yatra/path';
import type { Trail, Zone } from '../../core/yatra/trail';

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
/** A place's name sign stands under the camp fire, so it never covers Nandi at camp (jenil-7b review). */
const MARK_AT = 48;
const SEEN_KEY = 'nandi.yatra.seen';

const placeX = (index: number) => PAD + index * LEG_W;
/**
 * Spec 571 stage 2: the climb is continuous. `walked` is stretches walked, with the minutes carried into the next stretch
 * as a fraction, so between two stops the group stands that far along; on a whole stretch it is the same stop as before.
 */
const groupX = (walked: number, legs: number) => {
  const capped = Math.max(0, Math.min(walked, legs * STRETCHES_PER_LEG));
  const leg = Math.min(Math.floor(capped / STRETCHES_PER_LEG), legs);
  const into = capped - leg * STRETCHES_PER_LEG, stop = Math.floor(into);
  const from = STOPS[stop] ?? 1, to = STOPS[stop + 1] ?? 1;
  return placeX(leg) + (from + (to - from) * (into - stop)) * LEG_W;
};
/** Where the group stands: earned minutes only (a running focus adds its earned 3-min steps, never a part step). */
const walkedOf = (trek: Trek) => trek.climb.at;
/** Tonight's stars hang over the group, as in the prototype; past six they ring a little wider. */
const TONIGHT = [[-47, 79], [1, 45], [45, 75], [6, 113], [-20, 41], [48, 118]] as const;
/** Spec 575: the stars over a raised camp rise with it, so the friends stay clear of them at the highest point. */
const tonightPoint = (index: number, centre: number, lift = 0) => { const [dx, y] = TONIGHT[index % TONIGHT.length]!; const ring = Math.floor(index / TONIGHT.length); return { x: centre + dx * (1 + ring * 0.6) + ring * 14, y: Math.max(8, y - ring * 12 - lift) }; };
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

const Tent = () => <svg viewBox="0 0 90 70" aria-hidden="true"><path d="M9 57L45 10L82 57Z" fill="#e5a75b" stroke="#5e5a49" strokeWidth="2" /><path d="M45 10L45 57H82Z" fill="#b9623b" /><path d="M42 57L54 39L65 57" fill="#3e4b44" /><path d="M9 57H82" stroke="#5e5a49" strokeWidth="3" /></svg>;
/* Spec 45b camp props, in the notebook's quiet ink. */
const MapSheet = () => <svg viewBox="0 0 40 16" aria-hidden="true"><path d="M3 13L9 2L37 3L31 14Z" fill="#efe3c8" stroke="#6b5d4a" strokeWidth="1" strokeLinejoin="round" /><path d="M16 2.3L12 13.6M25 2.6L21 13.8" stroke="#6b5d4a" strokeWidth=".7" opacity=".5" /><path d="M9 10Q15 5 20 8T30 6" fill="none" stroke="#a5523a" strokeWidth="1" strokeDasharray="2 1.6" /></svg>;
const Rock = () => <svg viewBox="0 0 64 18" aria-hidden="true"><path d="M2 17C3 8 12 2 26 2C42 1 58 5 62 17Z" fill="#a8a493" stroke="#5f5a4b" strokeWidth="1.1" strokeLinejoin="round" /><path d="M14 8C20 5 30 5 36 6" fill="none" stroke="#e9e2cf" strokeWidth="1.2" strokeLinecap="round" opacity=".7" /></svg>;
const Pack = () => <svg viewBox="0 0 22 28" aria-hidden="true"><path d="M3 26V10C3 5 7 2 11 2C15 2 19 5 19 10V26Z" fill="#9c7a54" stroke="#4f3f2e" strokeWidth="1.1" strokeLinejoin="round" /><path d="M5 15H17V22H5Z" fill="#8a6948" stroke="#4f3f2e" strokeWidth=".9" /><path d="M8 2.6V0.8H14V2.6" fill="none" stroke="#4f3f2e" strokeWidth="1" /></svg>;
const Tree = () => <svg viewBox="0 0 70 140" aria-hidden="true"><path d="M40 140C39 110 41 80 37 40" fill="none" stroke="#6a5a45" strokeWidth="5" strokeLinecap="round" /><path d="M38 64C30 58 18 56 6 57" fill="none" stroke="#6a5a45" strokeWidth="3.4" strokeLinecap="round" /><path d="M38 52C46 44 56 42 66 43" fill="none" stroke="#6a5a45" strokeWidth="2.6" strokeLinecap="round" /><g fill="#7f9878" opacity=".9"><ellipse cx="34" cy="26" rx="20" ry="13" /><ellipse cx="52" cy="36" rx="14" ry="9" /><ellipse cx="16" cy="40" rx="13" ry="8" /></g><g fill="none" stroke="#56684f" strokeWidth=".9" opacity=".6"><path d="M22 24Q34 18 46 24M40 34Q50 30 60 36" /></g></svg>;
const FireRing = () => <svg viewBox="0 0 30 40" aria-hidden="true"><path d="M5 35L25 38M25 34L5 38" stroke="#67503d" strokeWidth="3" strokeLinecap="round" /><g fill="#9c988a" stroke="#5f5a4b" strokeWidth=".8"><ellipse cx="3" cy="37" rx="3" ry="2" /><ellipse cx="27" cy="37" rx="3" ry="2" /><ellipse cx="15" cy="39" rx="3.2" ry="1.8" /></g></svg>;
const Fire = () => <svg viewBox="0 0 30 40" aria-hidden="true"><path d="M2 34L27 39M27 34L2 39" stroke="#67503d" strokeWidth="4" strokeLinecap="round" /><path className="trek-flame" d="M15 33C5 29 6 20 14 10C13 19 20 14 21 4C27 16 28 28 18 33Z" fill="#ff9d34" /><path className="trek-flame" d="M15 32C11 27 12 23 16 17C16 23 20 23 20 19C22 25 20 31 15 32Z" fill="#ffe6a1" /></svg>;

/**
 * Spec 575 §5'.1 + must 8: each leg's zone on each layer. A parallax layer moves at `factor` of the scroll, so a zone
 * boundary at world x is drawn at x(1 - factor) + factor * VIEW / 2 in that layer, where it sits over the ground's own
 * boundary when that boundary is mid-view; neighbouring zones blend over BLEND px (a fixed mask: nothing animates, so
 * reduced motion sees the same picture with no crossfade, M3).
 */
const VIEW = 360, BLEND = 120;
/** a9 review 2: a zone starts this far into its leg, past the camp's shelf (SHELF_PX) and its blend, never under a camp. */
export const ZONE_SHIFT = 0.3 * LEG_W;
type ZoneSpan = { zone: Zone; from: number; to: number };
export function zoneSpans(trail: Trail, worldWidth: number): ZoneSpan[] {
  const spans: ZoneSpan[] = [];
  const push = (zone: Zone, from: number, to: number) => { const last = spans.at(-1); if (last && last.zone === zone) last.to = to; else spans.push({ zone, from, to }); };
  trail.legs.forEach((leg, i) => {
    const zone = leg.terrain?.zone ?? 'kullu-forest';
    const from = i === 0 ? 0 : placeX(i) + ZONE_SHIFT, to = i === trail.legs.length - 1 ? worldWidth : placeX(i + 1) + ZONE_SHIFT;
    if (leg.terrain?.toZone) { const mid = placeX(i) + ZONE_SHIFT + LEG_W / 2; push(zone, from, mid); push(leg.terrain.toZone, mid, to); } else push(zone, from, to);
  });
  return spans;
}
const toLayer = (x: number, factor: number) => x * (1 - factor) + factor * VIEW / 2;
function ZoneLayer({ spans, kind, factor, width }: { spans: readonly ZoneSpan[]; kind: 'far' | 'mid' | 'front'; factor: number; width: number }) {
  return <div className={`trek-ridge trek-ridge-${kind}`} aria-hidden="true">{spans.map((span, i) => {
    const left = i === 0 ? 0 : toLayer(span.from, factor) - BLEND / 2;
    const right = i === spans.length - 1 ? width : toLayer(span.to, factor) + BLEND / 2;
    // a9 review 2: the next span (drawn later, so on top) fades in over this one, which stays opaque underneath.
    const fadeIn = i === 0 ? 0 : BLEND;
    const mask = `linear-gradient(90deg, transparent 0, #000 ${fadeIn}px, #000 100%)`;
    const first = Math.floor(left / RIDGE_W), last = Math.ceil(right / RIDGE_W);
    return <div key={`${span.zone}-${i}`} className="trek-zone" data-zone={span.zone} style={{ left, width: right - left, WebkitMaskImage: mask, maskImage: mask }}>
      {Array.from({ length: last - first + 1 }, (_, k) => <svg key={k} viewBox="0 0 1110 294" preserveAspectRatio="none" style={{ left: (first + k) * RIDGE_W - left }}><RidgeTile zone={span.zone} kind={kind} /></svg>)}
    </div>;
  })}</div>;
}
/** The ground under the path (option A, §10: the path is drawn): a hill fill under a raised stretch, the grass and the road, all on one lift. */
function Ground({ width, lift, spans }: { width: number; lift: (x: number) => number; spans: readonly ZoneSpan[] }) {
  const xs = Array.from({ length: Math.ceil(width / 16) + 1 }, (_, i) => Math.min(width, i * 16));
  const y = (x: number, base: number, wobble: number) => 276 - (base + lift(x) + wobble * (hash(`road:${Math.round(x / 64)}`) - 0.5));
  const edge = (base: number, wobble: number) => xs.map(x => `${x} ${y(x, base, wobble).toFixed(1)}`).join('L');
  const back = xs.slice().reverse();
  // a9 review 2: one ground, its colour blended across each zone change (as the ridges blend), never a cut.
  const stops = spans.flatMap((span, i) => [
    { at: i === 0 ? 0 : (span.from + BLEND / 2) / width, colour: ZONE_FRONT[span.zone] },
    { at: i === spans.length - 1 ? 1 : (span.to - BLEND / 2) / width, colour: ZONE_FRONT[span.zone] },
  ]);
  const top = (x: number) => y(x, 28, 3);
  return <svg className="trek-ground" width={width} height="276" aria-hidden="true">
    <defs><linearGradient id="trek-ground-zones" gradientUnits="userSpaceOnUse" x1="0" x2={width} y1="0" y2="0">
      {stops.map((stop, i) => <stop key={i} offset={Math.min(1, Math.max(0, stop.at))} stopColor={stop.colour} />)}
    </linearGradient></defs>
    <path d={`M0 276L${xs.map(x => `${x} ${top(x).toFixed(1)}`).join('L')}L${width} 276Z`} fill="url(#trek-ground-zones)" />
    {/* Texture, so it reads as ground and not a slab: a darker lip along the top and loose tufts of shade below it. */}
    <path d={`M${xs.map(x => `${x} ${top(x).toFixed(1)}`).join('L')}`} fill="none" stroke="#1f2a1c" strokeOpacity=".22" strokeWidth="5" />
    <path d={`M${xs.map(x => `${x} ${(top(x) + 9).toFixed(1)}`).join('L')}`} fill="none" stroke="#1f2a1c" strokeOpacity=".14" strokeWidth="3" strokeDasharray="3 11 6 17" strokeLinecap="round" />
    <path d={`M${xs.map(x => `${x} ${(top(x) + 17).toFixed(1)}`).join('L')}`} fill="none" stroke="#ffffff" strokeOpacity=".08" strokeWidth="2" strokeDasharray="9 23 4 14" strokeLinecap="round" />
    <path className="trek-ground-grass" d={`M${edge(64, 6)}L${back.map(x => `${x} ${y(x, 37, 0).toFixed(1)}`).join('L')}Z`} />
    <path className="trek-road" d={`M${edge(54, 10)}L${back.map(x => `${x} ${y(x, 30, 8).toFixed(1)}`).join('L')}Z`} />
  </svg>;
}
/** a9 review 2: water runs along the bottom only on a leg that has a river, a stream, a ford or a lake. */
const WATER = new Set(['river', 'stream', 'ford', 'lake']);
const ZONE_FRONT: Record<Zone, string> = { 'kullu-forest': '#4c7059', 'valley-meadow': '#7aa267', 'alpine-scree': '#857f70', 'pass-snow': '#cfd8dc', 'lahaul-dry': '#a07a56', 'lake-basin': '#719574', 'rhodo-forest': '#4b6650', 'ridge-meadow': '#86a06d' };

export function TrekScene({ trek, night, dusk = false, weather = 'clear', brighten = 0, breath, onRename, onFriend }: { trek: Trek; night: boolean; dusk?: boolean; weather?: Weather; brighten?: number; breath?: { phase: 'in' | 'out'; in: number; out: number }; onRename: (constellation: Constellation) => void; onFriend?: (spot: CampFriend) => void }) {
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
  // Spec 575 §2: one lift for every piece on the ground, from the trail's own altitudes (a 45 px band).
  const lifts = placeLifts(trek.trail);
  const lift = (x: number) => liftAt(x, lifts, PAD, LEG_W);
  const spans = zoneSpans(trek.trail, width);
  const [caption, setCaption] = useState<string | null>(null);
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

  const rain = weather === 'rain';
  return <section className={`trek-scene${night ? ' is-night' : dusk ? ' is-dusk' : ''}${home ? ' is-home' : ''}${rain ? ' is-rain' : ''}`} aria-label={`${trek.trail.name} trail. Swipe to look back along it.`}>
    <div className="trek-scroll" ref={scroller} onScroll={onScroll} tabIndex={0} aria-label="Swipe the trail sideways">
      <div className="trek-world" ref={world} style={{ width }}>
        <div className="trek-sun" style={{ left: Math.max(PAD, gx - 40) }} aria-hidden="true" />
        <div ref={far} className="trek-layer"><ZoneLayer spans={spans} kind="far" factor={0.23} width={width} /></div>
        <div ref={mid} className="trek-layer"><ZoneLayer spans={spans} kind="mid" factor={0.12} width={width} /></div>
        <ZoneLayer spans={spans} kind="front" factor={0} width={width} />
        <Ground width={width} lift={lift} spans={spans} />
        {trek.trail.legs.map((leg, i) => WATER.has(leg.landmark.kind) || leg.terrain?.features.some(feature => WATER.has(feature.kind) || feature.kind === 'log-bridge')
          ? <div key={leg.landmark.id} className="trek-stream" style={{ left: placeX(i) + 40, width: LEG_W - 80 }} /> : null)}
        {/* §5'.3: each leg's kit, clustered and seeded per leg, kept off the camps' shelves and the landmark's spot. */}
        {/* b2 13 Nov (A+B): nothing stands in a camp, where the five friends stand (from 320 px left of the place to just
            past it), so nothing pops in or out as the group walks; tall pieces stand in a back row, smaller, so mid-leg
            they read as trees behind the trail. */}
        <div className="trek-kit" aria-hidden="true">{trek.trail.legs.flatMap((leg, i) => scatterLeg(leg, placeX(i), LEG_W, [[placeX(i) - CAMP_CLEAR, placeX(i) + 40], [placeX(i) + GATE_AT * LEG_W - 60, placeX(i) + GATE_AT * LEG_W + 60], [placeX(i + 1) - CAMP_CLEAR, placeX(i + 1) + 40]]))
          .map(piece => { const tall = TALL_KIT.has(piece.kind); return <span key={piece.seed} className={tall ? 'tall' : undefined} style={{ left: piece.x, bottom: (tall ? 90 : 60) + lift(piece.x) }}><Kit kind={piece.kind} seed={piece.seed} scale={tall ? piece.scale * 0.6 : piece.scale} /></span>; })}</div>
        <div className="trek-overlay" /><div className="trek-pinpricks" aria-hidden="true">{pinpricks.map((dot, i) => <span key={i} style={{ left: dot.x, top: dot.y, opacity: dot.o }} />)}</div>
        {/* The sky over each leg: its constellation, joined and named, stays above that part of the trail. */}
        <svg className="trek-sky" width={width} height="276" aria-hidden="true">{trek.constellations.map(row => {
          const points = row.stars.map((_, i) => tonightPoint(i, skyCentre(row, trek), lift(skyCentre(row, trek) + 128)));
          return <path key={row.id} d={kitePath(points)} />;
        })}</svg>
        <div className="trek-stars">
          {trek.constellations.flatMap(row => row.stars.map((star, i) => ({ star, ...tonightPoint(i, skyCentre(row, trek), lift(skyCentre(row, trek) + 128)) }))).concat(loose.map((star, i) => ({ star, ...tonightPoint(i, centreOf(gx), lift(gx)) })))
            .map(({ star, x, y }, i) => <i key={star.id} className={`trek-star${brightId === star.id ? ' bright' : ''}`} data-kind={star.kind} style={{ left: x, top: y, '--star': STAR_COLOURS[star.kind], '--delay': `${i * 0.23}s` } as CSSProperties} />)}
        </div>
        {night && trek.constellations.map(row => <button type="button" key={row.id} className="trek-constellation-name" style={{ left: skyCentre(row, trek) }} onClick={() => onRename(row)} aria-label={`${row.name}, a constellation. Rename it`}>{row.name}</button>)}
        {/* D2: nothing stands at a pass (no cairn, no pennant); the leg's landmark is the saddle itself. */}
        {trek.trail.places.map((spot, i) => spot.kind === 'pass' ? null : <div key={spot.id} className="trek-tent" style={{ left: placeX(i) - 45, bottom: 44 + lift(placeX(i)) }}><Tent /></div>)}
        {/* §3 + must 9: each leg's real landmark, hazed until its gate opens; a tap names it in a caption outside the art. */}
        {trek.trail.legs.map((leg, i) => { const x = placeX(i) + GATE_AT * LEG_W; return <button type="button" key={leg.landmark.id} className={`trek-gate trek-landmark${trek.legs[i]!.gateOn ? ' open' : ''}`} data-kind={leg.landmark.kind} style={{ left: x - 32, bottom: 54 + lift(x) }} aria-label={leg.landmark.name} onClick={() => setCaption(current => current === leg.landmark.name ? null : leg.landmark.name)}><Landmark leg={leg} /></button>; })}
        <div className="trek-marks" aria-hidden="true">{trek.legs.flatMap(leg => leg.stretches.map((stretch, k) => {
          const from = placeX(leg.index) + STOPS[k]! * LEG_W;
          const span = ((STOPS[k + 1] ?? 1) - STOPS[k]!) * LEG_W;
          if (leg.index * STRETCHES_PER_LEG + k >= shown) return [];
          if (stretch.kind === 'train') return Array.from({ length: 5 }, (_, f) => <i key={`${leg.index}-${k}-${f}`} className="trek-footprint" style={{ left: from + span * 0.25 + f * 15, bottom: 39 + lift(from + span * 0.25 + f * 15) + (f % 2) * 4 }} />);
          if (stretch.kind === 'calm') return [<i key={`${leg.index}-${k}`} className="trek-rest" style={{ left: from + span - 40, bottom: 42 + lift(from + span - 40) }} />];
          return [];
        }))}</div>
        <div className={`trek-fire${fire ? '' : ' is-cold'}`} style={{ left: gx + FIRE_AT, bottom: 40 + lift(gx + FIRE_AT) }}>{fire ? <Fire /> : <FireRing />}</div>
        {/* Spec 571 E1: while a focus runs the friends walk in place until its next 3-min step is earned; reduced motion
            moves them on each step without the walk. */}
        <div className={`trek-group${trek.climb.walking && !night ? ' is-walking' : ''}`} style={{ left: gx, bottom: 39 + lift(gx) }}>
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
        {trek.trail.places.map((spot, i) => <div key={spot.id} className={`trek-place${i === trek.place && atPlace ? ' current' : ''}`} style={{ left: placeX(i) + MARK_AT, bottom: 18 + lift(placeX(i) + MARK_AT) }}><b>{spot.name}</b><i /></div>)}
      </div>
    </div>
    {/* Spec 571 §4: a focus-guard pause is rain over the view (it stays put when you swipe); the group waits where it stood. */}
    {rain && <div className="trek-rain" aria-hidden="true" />}
    {rain && <p className="trek-weather" role="status">{RAIN_LINE}</p>}
    {/* §3: a landmark's name, outside the art, whole at any text size. */}
    {caption && <p className="trek-landmark-caption" role="status">{caption}</p>}
    {/* Home says where the camp is in its heading, so the scene does not say it twice. */}
    {!home && <div className="trek-caption"><b>{place.name.toUpperCase()} · {night ? 'NIGHT' : 'DAY'}</b><span>{campLine(trek, night)}</span></div>}
  </section>;
}
