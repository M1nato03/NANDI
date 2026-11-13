import type { ReactNode } from 'react';
import type { FeatureKind, Leg, Zone } from '../../core/yatra/trail';
import { hash } from './hash';

/**
 * Spec 575 §5' (Jenil 10 Nov, "drawn now, paint later"): every zone and kit piece is code SVG in the trek's drawn
 * style. The bar is "as good as today's trek": no even rows, no stickers, no text in the art, nothing random (the
 * scatter is hash()-seeded per leg). Exclusions (§5, N2, N3): no flags, cairns, shrines, stupas, border markers or
 * pillars, no buildings, no person on the ice.
 */
export const RIDGE_W = 1110;
const H = 294;

/* ---------- Ridges: one silhouette set and palette per zone (§5'.1) ---------- */
type Wave = readonly [period: number, amp: number, phase: number];
interface Shape { base: number; amp: number; waves: readonly Wave[]; jag?: boolean; flatTop?: number; step?: number }
const frac = (value: number) => value - Math.floor(value);
/** A tileable ridge line: every wave repeats a whole number of times across RIDGE_W, so the copies meet seamlessly. */
function ridgeY(shape: Shape, x: number): number {
  let value = 0;
  for (const [period, amp, phase] of shape.waves) {
    const t = x / RIDGE_W * period + phase;
    value += amp * (shape.jag ? 1 - Math.abs(4 * frac(t) - 2) : Math.cos(2 * Math.PI * t));
  }
  const y = shape.base - shape.amp * value;
  return shape.flatTop !== undefined ? Math.max(y, shape.flatTop) : y;
}
function ridgePath(shape: Shape): string {
  const step = shape.step ?? (shape.jag ? 15 : 10);
  const points: string[] = [];
  for (let x = 0; x <= RIDGE_W; x += step) points.push(`${x} ${ridgeY(shape, x).toFixed(1)}`);
  return `M${points.join('L')}V${H}H0Z`;
}
interface ZoneArt {
  far: { shape: Shape; fill: string; caps?: number };
  mid: { shape: Shape; fill: string; band: string };
  front: readonly [string, string];
  /** ridge-meadow's distant high white wall; lahaul-dry's eroded striations. */
  extra?: 'wall' | 'striations';
}
const ROUND_FAR: Shape = { base: 128, amp: 34, waves: [[7, 0.6, 0.1], [13, 0.3, 0.4], [3, 0.25, 0.7]] };
export const ZONE_ART: Record<Zone, ZoneArt> = {
  'kullu-forest': { far: { shape: ROUND_FAR, fill: '#a6bdb2', caps: 108 }, mid: { shape: { base: 178, amp: 24, waves: [[9, 0.6, 0.2], [4, 0.4, 0.5]] }, fill: '#5f8a6e', band: '#527b60' }, front: ['#3e6450', '#315747'] },
  'valley-meadow': { far: { shape: { base: 132, amp: 30, waves: [[5, 0.5, 0.3], [11, 0.35, 0.1]] }, fill: '#b2c4bb', caps: 112 }, mid: { shape: { base: 196, amp: 12, waves: [[2, 0.7, 0.1], [5, 0.3, 0.6]] }, fill: '#8fb27a', band: '#80a36c' }, front: ['#6f9a5f', '#5d8851'] },
  'alpine-scree': { far: { shape: { base: 118, amp: 46, waves: [[8, 0.6, 0.15], [17, 0.3, 0.4], [5, 0.2, 0.8]], jag: true }, fill: '#b9bfc0', caps: 104 }, mid: { shape: { base: 182, amp: 26, waves: [[11, 0.6, 0.3], [6, 0.4, 0.1]], jag: true }, fill: '#9e9a8c', band: '#8c887b' }, front: ['#7d786a', '#6b675b'] },
  'pass-snow': { far: { shape: { base: 120, amp: 26, waves: [[2, 0.7, 0.5], [9, 0.25, 0.2]], jag: true }, fill: '#c9d3d8' }, mid: { shape: { base: 186, amp: 16, waves: [[1, 0.8, 0.5], [7, 0.2, 0.3]] }, fill: '#e6ecef', band: '#b8c4ca' }, front: ['#d5dde1', '#c2ccd2'] },
  'lahaul-dry': { far: { shape: { base: 120, amp: 30, waves: [[6, 0.6, 0.2], [13, 0.3, 0.6]], flatTop: 104 }, fill: '#c9a98a', caps: 106 }, mid: { shape: { base: 182, amp: 22, waves: [[5, 0.6, 0.4], [12, 0.3, 0.1]], flatTop: 166 }, fill: '#b88f66', band: '#a98058' }, front: ['#9a7350', '#876345'], extra: 'striations' },
  'lake-basin': { far: { shape: { base: 120, amp: 36, waves: [[1, 0.55, 0.5], [9, 0.3, 0.2], [17, 0.12, 0.6]], jag: true }, fill: '#a9bcc4', caps: 110 }, mid: { shape: { base: 194, amp: 22, waves: [[1, 0.8, 0.5], [6, 0.2, 0.1]] }, fill: '#87a98a', band: '#789b7b' }, front: ['#6b8f6e', '#5c7f60'] },
  'rhodo-forest': { far: { shape: { base: 126, amp: 40, waves: [[6, 0.65, 0.25], [14, 0.3, 0.5]] }, fill: '#9fb2a6' }, mid: { shape: { base: 172, amp: 32, waves: [[8, 0.7, 0.1], [3, 0.3, 0.45]] }, fill: '#5c7d5c', band: '#4f6f50' }, front: ['#45604a', '#3a5340'] },
  // a9 review 2: a muted grey-green far ridge with real relief under the white wall (the flat blue read as water).
  'ridge-meadow': { far: { shape: { base: 140, amp: 26, waves: [[5, 0.5, 0.2], [11, 0.3, 0.45], [2, 0.3, 0.7]] }, fill: '#9eab9c' }, mid: { shape: { base: 192, amp: 10, waves: [[3, 0.6, 0.3], [8, 0.4, 0.1]] }, fill: '#a3b886', band: '#94a978' }, front: ['#7f9a68', '#6e8a5a'], extra: 'wall' },
};
/** The distant high white wall of ridge-meadow (no label, no peak names: §1c). */
const WALL: Shape = { base: 96, amp: 34, waves: [[10, 0.5, 0.3], [23, 0.3, 0.1], [4, 0.2, 0.6]], jag: true, step: 10 };
const paths = new Map<string, string>();
const pathOf = (key: string, shape: Shape) => { let value = paths.get(key); if (!value) { value = ridgePath(shape); paths.set(key, value); } return value; };

/** One tile (RIDGE_W wide) of a zone's layer. */
export function RidgeTile({ zone, kind }: { zone: Zone; kind: 'far' | 'mid' | 'front' }) {
  const art = ZONE_ART[zone];
  if (kind === 'far') {
    const d = pathOf(`${zone}:far`, art.far.shape);
    return <>
      {art.extra === 'wall' && <><path d={pathOf('wall', WALL)} fill="#eef1f2" /><path d={pathOf('wall', WALL)} fill="#c9d4dc" opacity=".35" transform="translate(0 10)" /></>}
      <path d={d} fill={art.far.fill} />
      {/* Snow caps: the same ridge, kept only above the cap line (today's cap colour). */}
      {art.far.caps !== undefined && <path d={d} fill="#f4ead5" opacity=".78" clipPath={`inset(0 0 ${H - art.far.caps}px 0)`} style={{ clipPath: `inset(0 0 ${H - art.far.caps}px 0)` }} />}
    </>;
  }
  if (kind === 'mid') return <>
    <path d={pathOf(`${zone}:mid`, art.mid.shape)} fill={art.mid.fill} />
    {art.extra === 'striations' && <g fill="none" stroke="#8f6a48" strokeWidth="1.4" opacity=".45">{[0, 1, 2].map(i => <path key={i} d={`M0 ${200 + i * 13}Q280 ${192 + i * 13} 555 ${201 + i * 13}T1110 ${200 + i * 13}`} />)}</g>}
    <path d={`M0 236Q70 ${222 - (zone.length % 5) * 3} 141 222T271 215T420 223T586 211T745 224T918 212T1110 236V294H0Z`} fill={art.mid.band} />
  </>;
  return <>
    <path d="M0 266Q102 246 169 271T337 260T514 273T683 258T853 275T1110 266V294H0Z" fill={art.front[0]} opacity=".9" />
    <path d="M0 284Q133 267 223 287T443 281T647 288T867 275T1110 284V294H0Z" fill={art.front[1]} opacity=".8" />
  </>;
}

/* ---------- The kit (§5'.2): small parameterised pieces, standing on the ground line (their own bottom) ---------- */
type Piece = { w: number; h: number; draw: ReactNode };
const svg = (piece: Piece, scale: number) => <svg viewBox={`0 0 ${piece.w} ${piece.h}`} width={piece.w * scale} height={piece.h * scale} aria-hidden="true">{piece.draw}</svg>;
const CONIFER = { pine: { fill: '#3f6b4f', tiers: 3, spread: 0.7 }, deodar: { fill: '#4f7357', tiers: 4, spread: 1 }, fir: { fill: '#2f5a45', tiers: 5, spread: 0.55 } } as const;
export type KitKind = 'pine' | 'deodar' | 'fir' | 'maple' | 'birch' | 'rhodo' | 'bamboo' | 'boulder' | 'scree' | 'snow' | 'grass' | 'flowers' | 'waterfall';
export function kitPiece(kind: KitKind, seed: string): Piece {
  const r = (n: number) => hash(`${seed}:${n}`);
  if (kind === 'pine' || kind === 'deodar' || kind === 'fir') {
    const { fill, tiers, spread } = CONIFER[kind];
    const shapes = Array.from({ length: tiers }, (_, i) => { const y = 8 + i * (44 / tiers), half = (6 + i * 4) * spread + 3; return <path key={i} d={`M20 ${y - 4}L${20 + half} ${y + 12}H${20 - half}Z`} />; });
    return { w: 40, h: 64, draw: <><path d="M20 64V46" stroke="#5a4a38" strokeWidth="3" /><g fill={fill}>{shapes}</g><path d="M20 6L26 20H20Z" fill="#ffffff" opacity=".08" /></> };
  }
  if (kind === 'maple' || kind === 'birch') {
    const birch = kind === 'birch';
    return { w: 44, h: 60, draw: <><path d="M22 60V30" stroke={birch ? '#e8e2d4' : '#6a5a45'} strokeWidth="3.4" />{birch && <path d="M21 44H23M21 52H23" stroke="#5f584c" strokeWidth="1" />}<g fill={birch ? '#9db56f' : '#6f8f4e'} opacity=".95"><ellipse cx="22" cy="20" rx="16" ry="12" /><ellipse cx={30 + r(1) * 4} cy="28" rx="10" ry="8" /><ellipse cx={12 - r(2) * 3} cy="29" rx="9" ry="7" /></g></> };
  }
  if (kind === 'rhodo') {
    const dots = Array.from({ length: 7 }, (_, i) => <circle key={i} cx={8 + r(i) * 30} cy={8 + r(i + 9) * 18} r="2.2" />);
    return { w: 46, h: 36, draw: <><path d="M23 36V26" stroke="#5a4a38" strokeWidth="2.4" /><g fill="#4e6b49"><ellipse cx="23" cy="18" rx="20" ry="12" /><ellipse cx="12" cy="24" rx="10" ry="7" /></g><g fill="#d9577a">{dots}</g></> };
  }
  if (kind === 'bamboo') {
    const stalks = Array.from({ length: 5 }, (_, i) => { const x = 6 + i * 6 + r(i) * 3, top = 4 + r(i + 5) * 14; return <g key={i}><path d={`M${x} 70V${top}`} stroke="#8fae5a" strokeWidth="2" /><path d={`M${x} ${top + 10}l7 -4M${x} ${top + 22}l-7 -4`} stroke="#6f9a45" strokeWidth="2.2" strokeLinecap="round" /></g>; });
    return { w: 40, h: 70, draw: <>{stalks}</> };
  }
  if (kind === 'boulder') return { w: 40, h: 20, draw: <><path d={`M2 20C3 ${10 - r(1) * 4} 11 3 20 3C${30 + r(2) * 4} 3 38 9 38 20Z`} fill="#a19d8e" stroke="#5f5a4b" strokeWidth="1" strokeLinejoin="round" /><path d="M10 9C15 6 22 6 26 7" fill="none" stroke="#e9e2cf" strokeWidth="1.1" strokeLinecap="round" opacity=".7" /></> };
  if (kind === 'scree') return { w: 70, h: 26, draw: <><path d="M35 0L70 26H0Z" fill="#b3ae9f" opacity=".75" /><g fill="#8d8878">{Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx={14 + r(i) * 42} cy={10 + r(i + 20) * 14} rx="2.4" ry="1.4" />)}</g></> };
  if (kind === 'snow') return { w: 60, h: 12, draw: <path d={`M2 12C6 ${5 - r(1) * 3} 18 2 30 3C44 1 56 6 58 12Z`} fill="#f4f6f7" stroke="#c9d4dc" strokeWidth=".8" /> };
  if (kind === 'grass') return { w: 18, h: 14, draw: <g stroke="#5e8a4f" strokeWidth="1.4" strokeLinecap="round" fill="none"><path d="M9 14L4 3M9 14L9 1M9 14L14 4M9 14L1 7M9 14L17 8" /></g> };
  if (kind === 'flowers') {
    const colours = ['#e8c547', '#d97aa6', '#9b7fd4'];
    return { w: 30, h: 18, draw: <><g stroke="#5e8a4f" strokeWidth="1.2" fill="none"><path d="M8 18V7M15 18V4M22 18V8" /></g><g>{[8, 15, 22].map((x, i) => <circle key={x} cx={x} cy={[7, 4, 8][i]} r="2.6" fill={colours[Math.floor(r(i) * 3)]} />)}</g></> };
  }
  return { w: 30, h: 60, draw: <><path d="M0 60V8C8 2 22 2 30 8V60Z" fill="#7d786a" /><path d="M11 6V60M16 4V60M20 6V60" stroke="#e8f3f5" strokeWidth="2.4" opacity=".85" /><ellipse cx="15" cy="58" rx="14" ry="3" fill="#a9d4e0" /></> };
}
/** Pieces that stand above a friend's head: drawn in the back row (b2 13 Nov, option B). */
export const TALL_KIT: ReadonlySet<KitKind> = new Set(['pine', 'deodar', 'fir', 'maple', 'birch', 'rhodo', 'bamboo', 'waterfall']);
export const Kit = ({ kind, seed, scale }: { kind: KitKind; seed: string; scale: number }) => svg(kitPiece(kind, seed), scale);

/** What stands along each zone (its signature kit), in no fixed order; the scatter picks from it. */
export const ZONE_KIT: Record<Zone, readonly KitKind[]> = {
  'kullu-forest': ['deodar', 'pine', 'fir', 'pine', 'boulder', 'grass'],
  'valley-meadow': ['flowers', 'grass', 'flowers', 'grass', 'boulder', 'birch'],
  'alpine-scree': ['boulder', 'scree', 'boulder', 'snow', 'grass'],
  'pass-snow': ['snow', 'snow', 'boulder', 'snow'],
  'lahaul-dry': ['boulder', 'scree', 'boulder'],
  'lake-basin': ['grass', 'boulder', 'flowers', 'grass'],
  'rhodo-forest': ['rhodo', 'bamboo', 'rhodo', 'maple', 'fir'],
  'ridge-meadow': ['grass', 'rhodo', 'grass', 'flowers', 'boulder'],
};

export interface Scattered { x: number; kind: KitKind; scale: number; seed: string }
/**
 * §5'.3: clusters of 2-5 pieces in 3 sizes, gaps drawn from a wide spread (never a fixed spacing), seeded per leg by
 * its landmark id, and kept off the camps' shelves (the tents, the fire) and the landmark's own spot.
 */
export function scatterLeg(leg: Leg, from: number, width: number, keepClear: readonly [number, number][]): Scattered[] {
  const zone = leg.terrain?.zone ?? 'kullu-forest';
  const kit = ZONE_KIT[zone];
  const id = leg.landmark.id;
  const out: Scattered[] = [];
  let x = from + 30 + hash(`${id}:start:x`) * 60;
  for (let n = 0; x < from + width - 30; n++) {
    const count = 2 + Math.floor(hash(`${id}:${n}:count`) * 4);
    for (let k = 0; k < count; k++) {
      const at = x + k * (10 + hash(`${id}:${n}:${k}:dx`) * 22);
      const half = width / 2;
      const pool = leg.terrain?.toZone && at > from + half ? ZONE_KIT[leg.terrain.toZone] : kit;
      const kind = pool[Math.floor(hash(`${id}:${n}:${k}:kind`) * pool.length) % pool.length]!;
      if (at < from + width && !keepClear.some(([a, b]) => at > a && at < b)) out.push({ x: at, kind, scale: [0.7, 0.9, 1.15][Math.floor(hash(`${id}:${n}:${k}:size`) * 3)]!, seed: `${id}:${n}:${k}` });
    }
    // Gaps between clusters run from a quarter to 1.75x the mean, so no two stretches look spaced alike.
    x += (0.25 + 1.5 * hash(`${id}:${n}:x`)) * 120;
  }
  return out;
}

/** The coefficient of variation of neighbouring gaps (the a9 even-rows check: ≥ 0.35 per zone). */
export function gapVariation(xs: readonly number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((x, i) => x - sorted[i]!);
  if (gaps.length < 2) return 1;
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const sd = Math.sqrt(gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length);
  return sd / mean;
}

/* ---------- Landmarks (§3, must 9): composed from the kit for the leg's landmark kind and features ---------- */
const LAKES = {
  'tarsar-lake': 'M6 22C14 8 54 4 80 12C92 16 90 26 74 30C50 36 14 34 6 22Z',
  'sundarsar-lake': 'M10 20C12 8 40 4 60 8C80 12 82 28 62 32C38 36 8 32 10 20Z',
  'marsar-lake': 'M4 18C20 10 70 8 92 14C98 18 90 24 70 26C46 28 12 28 4 18Z',
} as const;
export function Landmark({ leg }: { leg: Leg }) {
  const kind = leg.landmark.kind;
  const features = new Set<FeatureKind>((leg.terrain?.features ?? []).map(feature => feature.kind));
  const seed = leg.landmark.id;
  if (kind === 'lake' || features.has('lake') && kind !== 'river') {
    const outline = LAKES[seed as keyof typeof LAKES] ?? LAKES['sundarsar-lake'];
    return <svg viewBox="0 0 100 40" aria-hidden="true"><path d={outline} fill="#d9d2b8" transform="translate(-3 -2) scale(1.06)" /><path d={outline} fill="#6fa6b8" /><path d="M24 18H48M56 22H70" stroke="#d6eef2" strokeWidth="1.4" strokeLinecap="round" opacity=".8" /></svg>;
  }
  if (kind === 'glacier') return <svg viewBox="0 0 100 60" aria-hidden="true"><path d="M0 60L22 14L40 30L58 6L82 26L100 60Z" fill="#8f8a7d" /><path d="M40 30L58 6L70 18L66 40L54 58L46 46Z" fill="#eaf4f7" /><path d="M58 10L62 34M50 30L56 52" stroke="#a9cbd8" strokeWidth="1.4" /></svg>;
  if (kind === 'pass') return <svg viewBox="0 0 100 50" aria-hidden="true"><path d="M0 50L18 22L42 30L50 26L58 30L82 20L100 50Z" fill="#8a8578" /><path d="M14 30C26 22 40 28 50 26C62 24 74 22 86 28L92 36C70 32 34 34 10 38Z" fill="#f4f6f7" /><path d="M44 40L50 34L56 40Z" fill="#5f5a4b" /></svg>;
  if (kind === 'meadow') return <svg viewBox="0 0 100 40" aria-hidden="true"><path d="M0 40C20 26 80 24 100 40Z" fill="#9cc07f" />{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={10 + hash(`${seed}:${i}:x`) * 80} cy={30 + hash(`${seed}:${i}:y`) * 7} r="2.4" fill={['#e8c547', '#d97aa6', '#9b7fd4'][i % 3]} />)}</svg>;
  if (kind === 'forest') return <svg viewBox="0 0 100 60" aria-hidden="true">{[0, 1, 2].map(i => <g key={i} transform={`translate(${8 + i * 28 + hash(`${seed}:${i}:x`) * 8} ${4 + hash(`${seed}:${i}:y`) * 6}) scale(.9)`}>{kitPiece(seed.includes('bamboo') && i === 1 ? 'bamboo' : i === 1 ? 'rhodo' : 'fir', `${seed}:${i}`).draw}</g>)}</svg>;
  if (kind === 'view' || kind === 'ridge' || kind === 'summit') return <svg viewBox="0 0 100 50" aria-hidden="true"><path d="M0 34L14 18L26 26L42 8L56 22L70 12L86 24L100 16V50H0Z" fill="#eef1f2" /><path d="M0 50V40C30 32 70 30 100 38V50Z" fill="#a3b886" />{kind === 'summit' && <path d="M38 50L50 36L62 50Z" fill="#8a8578" />}</svg>;
  // river, stream, ford: water across the trail, with the log bridge or the stepping stones the leg names.
  const ford = kind === 'ford' || kind === 'stream' || features.has('ford') && !features.has('log-bridge');
  const wide = seed === 'chandra-river';
  return <svg viewBox="0 0 100 40" aria-hidden="true">
    <path d={wide ? 'M0 24C30 18 70 18 100 24V40H0Z' : 'M0 30C30 24 70 24 100 30V40H0Z'} fill={wide ? '#9fb1b5' : '#6fa6b8'} />
    <path d="M10 33H30M52 32H74" stroke="#d6eef2" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
    {ford ? [18, 34, 50, 66, 82].map((x, i) => <ellipse key={x} cx={x} cy={31 + (i % 2) * 2} rx="5" ry="2.6" fill="#8d8a7c" stroke="#5f5a4b" strokeWidth=".7" />)
      : !wide && <><path d="M4 24L96 22" stroke="#7a5a3c" strokeWidth="5" strokeLinecap="round" /><path d="M4 28L96 26" stroke="#5f4630" strokeWidth="3" strokeLinecap="round" /></>}
  </svg>;
}
