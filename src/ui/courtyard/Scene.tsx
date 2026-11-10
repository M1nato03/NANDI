import { useId, type ReactElement } from 'react';
import type { AreaId, Phase } from '../../core/courtyard/courtyard';
import { NEEM_LEAVES } from '../../core/courtyard/support';

// The courtyard (spec 12) drawn on a 360 × 200 grid. Each corner gains one object per stage; nothing is removed.
// Layers: sky → wall and floor → objects → a phase tint → lights that glow through the tint.
// Spec 571 stage 2: every corner object is also its own part (PARTS), so layout B can place each one where the painted
// pass puts it; the corner functions below compose the same parts, so the classic scene draws exactly as before.
export type Stages = Record<AreaId, number>;
export const SCENE_W = 360, SCENE_H = 200;

const SKY: Record<Phase, [string, string]> = {
  morning: ['#bfe0f2', '#fde5c4'], day: ['#8fcdf0', '#dff2fb'], evening: ['#6c6fb5', '#f7a56a'], night: ['#121838', '#2c3468'],
};
export const TINT: Record<Phase, string | null> = { morning: 'rgba(255,214,170,.10)', day: null, evening: 'rgba(120,64,110,.20)', night: 'rgba(14,18,48,.58)' };
export const C = {
  wall: '#f1d4a6', wallShade: '#e2ba86', coping: '#c97f4a', copingDark: '#a9643a', floor: '#e8c896', floorLine: '#c9a170',
  wood: '#8a5a3a', woodDark: '#6b4128', door: '#3f8f9a', doorDark: '#2f6f78', terracotta: '#c8693c', terracottaDark: '#a4522c',
  leaf: '#5f9e4f', leafLight: '#7fb862', leafDark: '#467f3d', marigold: '#f39a1e', marigoldLight: '#f8c447', ink: '#3a2a20',
  stone: '#d9cdb8', stoneDark: '#b9ab93', glow: '#ffd27a',
};

export function Sky({ phase, id, height = 130 }: { phase: Phase; id: string; height?: number }) {
  const [top, bottom] = SKY[phase];
  return <>
    <defs><linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient></defs>
    <rect width={SCENE_W} height={height} fill={`url(#${id}sky)`} />
    {phase === 'morning' && <><circle cx="62" cy="64" r="15" fill="#ffe0a3" /><circle cx="62" cy="64" r="24" fill="#ffe0a3" opacity=".3" /></>}
    {phase === 'day' && <><circle cx="306" cy="28" r="13" fill="#fff3b8" /><circle cx="306" cy="28" r="21" fill="#fff3b8" opacity=".35" /></>}
    {/* Evening (b2 9 Nov): the sun is down while the friends rest; a warm sky, and the first lights (the evening glow). */}
    {phase === 'night' && <g className="courtyard-stars" fill="#fff">
      <path d="M300 20a12 12 0 1 0 10 18a10 10 0 1 1 -10 -18Z" fill="#f4ecd0" />
      {[[30, 18, 1.2], [70, 34, .9], [112, 14, 1.1], [150, 40, .8], [238, 22, 1], [270, 44, .8], [340, 50, 1.1], [92, 56, .7], [210, 52, .7]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} opacity=".85" />)}
    </g>}
    {(phase === 'morning' || phase === 'day') && <g className="courtyard-clouds" fill="#fff" opacity=".85">
      <path d="M96 40c0-6 6-10 12-8 3-5 12-5 15 1 6-1 10 3 9 7Z" /><path d="M232 58c0-5 5-8 10-6 3-4 10-4 12 1 5 0 8 2 7 5Z" />
    </g>}
  </>;
}

/** The arched wooden door, painted teal (wall at 94..136 × 81..130). */
export const Door = () => <g className="courtyard-door">
  <path d="M94 130V102a21 21 0 0 1 42 0V130Z" fill={C.wood} />
  <path d="M98 130V103a17 17 0 0 1 34 0V130Z" fill={C.door} />
  <path d="M115 87V130" stroke={C.doorDark} strokeWidth="1.6" />
  <path d="M101 108h11M118 108h11M101 120h11M118 120h11" stroke={C.doorDark} strokeWidth="1.1" opacity=".7" />
  <circle cx="112" cy="114" r="1.3" fill="#e7c36a" /><circle cx="118" cy="114" r="1.3" fill="#e7c36a" />
</g>;

/** The wall band and its coping (y 74..130); `door` false leaves the door for its own placement. */
export function WallBand({ door = true }: { door?: boolean }) {
  return <>
    <rect y="80" width={SCENE_W} height="50" fill={C.wall} />
    <path d="M0 118h360v12H0Z" fill={C.wallShade} opacity=".55" />
    {[[30, 96, 18], [210, 104, 22], [330, 92, 14]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r! / 3} fill="#fff" opacity=".18" />)}
    <rect y="74" width={SCENE_W} height="8" rx="1.5" fill={C.coping} /><rect y="80" width={SCENE_W} height="2" fill={C.copingDark} opacity=".6" />
    {door && <Door />}
  </>;
}

function Walls() {
  return <>
    <WallBand />
    {/* Floor of warm stone. */}
    <rect y="128" width={SCENE_W} height="72" fill={C.floor} />
    <path d="M0 128h360" stroke={C.floorLine} strokeWidth="1.5" opacity=".6" />
    <path d="M0 152h360M0 178h360M60 128l-28 72M140 128l-12 72M220 128l12 72M300 128l28 72" stroke={C.floorLine} strokeWidth=".8" opacity=".35" />
  </>;
}

/** The neem tree grows with active days; a stone platform (chabutra) is there from the start. */
const LEAF_FILLS = [C.leaf, C.leafDark, C.leafDark, C.leafLight, C.leaf, C.leaf, C.leaf, C.leafLight, C.leafLight];
/**
 * `narrow` and `lift` (layout B, b2 10 Nov; support.ts crownFit): the crown squeezed about the trunk and raised on a
 * longer trunk (tree units), so it keeps clear of Kapi's things on the coping. The classic scene passes neither.
 */
export function Tree({ stage, glowLayer, k: kOverride, narrow = 1, lift = 0 }: { stage: number; glowLayer?: boolean; k?: number; narrow?: number; lift?: number }) {
  const k = kOverride ?? [0.22, 0.45, 0.64, 0.84, 1, 1][stage]!;
  const leaves = NEEM_LEAVES.map(([x, y, r], i) => [x, y, r, LEAF_FILLS[i]!] as const);
  const lights = [[150, 52], [168, 70], [186, 40], [204, 62], [222, 78], [140, 76], [176, 22], [196, 82]];
  const up = lift / k;
  const crown = `translate(180 ${-up}) scale(${narrow} 1) translate(-180 0)`;
  if (glowLayer) return stage >= 5 ? <g transform={`translate(0 -8) translate(180 140) scale(${k}) translate(-180 -140)`} className="courtyard-twinkle"><g transform={crown}>
    {lights.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="5" fill={C.glow} opacity=".35" /><circle cx={x} cy={y} r="1.8" fill="#fff5c8" /></g>)}
  </g></g> : null;
  return <g transform="translate(0 -8)">
    <ellipse cx="180" cy="146" rx="30" ry="7" fill={C.stoneDark} />
    <path d="M150 140h60v6a30 7 0 0 1 -60 0Z" fill={C.stone} />
    <ellipse cx="180" cy="140" rx="30" ry="6" fill="#e6dccb" />
    <g className="courtyard-neem" transform={`translate(180 140) scale(${k}) translate(-180 -140)`}>
      {stage === 0 ? <><path d="M180 140v-26" stroke={C.wood} strokeWidth="3" strokeLinecap="round" />
        <path d="M180 122c-12-4-18 2-20 6 10 2 16 0 20-6ZM180 116c10-6 18-2 20 2-9 3-16 2-20-2Z" fill={C.leafLight} /></> : <>
        <path d="M172 140c2-24 3-44 4-70h8c1 26 2 46 4 70Z" fill={C.wood} />
        {up > 0 && <rect x="176" y={70 - up} width="8" height={up + 4} fill={C.wood} />}
        <g transform={crown}>
        <path d="M177 92c-10-8-20-10-30-12M183 88c10-8 22-12 32-12M180 72c-4-14-12-22-18-30M181 72c4-14 10-24 18-32" stroke={C.wood} strokeWidth="5" strokeLinecap="round" fill="none" />
        {leaves.map(([x, y, r, fill], i) => <circle key={i} cx={x} cy={y} r={r} fill={fill} />)}
        {[[170, 40], [196, 52], [150, 64], [214, 70], [186, 24]].map(([x, y], i) => <path key={i} d={`M${x} ${y}q4 -4 8 0`} stroke="#9fd07b" strokeWidth="1.6" fill="none" strokeLinecap="round" />)}
        {stage >= 4 && <g className="courtyard-swing"><path d="M200 80V120M220 80V120" stroke="#a37b52" strokeWidth="1.4" /><rect x="195" y="119" width="30" height="5" rx="1.5" fill={C.woodDark} /></g>}
        {stage >= 5 && <path d="M136 74Q160 92 182 66T228 74M146 50Q176 68 210 46" stroke="#6b4a2c" strokeWidth=".8" fill="none" />}
        </g>
      </>}
    </g>
  </g>;
}

const Pot = ({ x }: { x: number }) => <g>
  <path d={`M${x - 3} 112c-6-6-4-12 0-14M${x + 3} 112c6-6 4-12 0-14`} stroke={C.leafDark} strokeWidth="2" fill="none" />
  <circle cx={x - 5} cy={106} r="4.5" fill={C.marigold} /><circle cx={x + 5} cy={105} r="4.5" fill={C.marigoldLight} /><circle cx={x} cy={100} r="5" fill={C.marigold} />
  <circle cx={x} cy={100} r="1.6" fill="#c76a12" /><circle cx={x - 5} cy={106} r="1.3" fill="#c76a12" /><circle cx={x + 5} cy={105} r="1.3" fill="#c76a12" />
  <path d={`M${x - 9} 112h18l-3 16h-12Z`} fill={C.terracotta} /><rect x={x - 10} y="110" width="20" height="4" rx="1" fill={C.terracottaDark} />
</g>;

const Trellis = () => <g>
  <path d="M8 86h80M8 98h80M8 110h80M14 84v42M34 84v42M54 84v42M74 84v42" stroke="#b48a5c" strokeWidth="1.3" />
  <path d="M12 124c6-10 2-22 12-30s14-6 22-12 18 0 26-4 10 2 16 4" stroke={C.leafDark} strokeWidth="1.6" fill="none" />
  {[[22, 96], [40, 86], [58, 82], [76, 80], [30, 108], [66, 92]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx="4" ry="2.4" fill={C.leaf} transform={`rotate(-30 ${x} ${y})`} />{i % 2 === 0 && <circle cx={x! + 3} cy={y! - 2} r="2" fill="#ef6f8f" />}</g>)}
</g>;
const FlowerBed = () => <g>
  <rect x="2" y="124" width="92" height="9" rx="2" fill="#9b5a36" /><rect x="4" y="121" width="88" height="5" rx="2" fill="#6f8f3c" />
  {[10, 22, 34, 56, 68, 82].map((x, i) => <g key={x}><path d={`M${x} 124v-6`} stroke={C.leafDark} strokeWidth="1.2" /><circle cx={x} cy={117} r="2.6" fill={i % 2 ? '#ef6f8f' : C.marigoldLight} /></g>)}
</g>;
const WaterBowl = () => <g><ellipse cx="88" cy="146" rx="11" ry="4" fill={C.stoneDark} /><ellipse cx="88" cy="143" rx="11" ry="4" fill={C.stone} /><ellipse cx="88" cy="143" rx="8" ry="2.6" fill="#7cc3dc" /><path d="M84 142.5q2-1 4 0" stroke="#fff" strokeWidth=".8" fill="none" /></g>;

/** Mor looks after Plan: a small garden by the wall. */
function Garden({ stage }: { stage: number }) {
  return <g>
    {stage >= 4 && <Trellis />}
    {stage >= 3 && <FlowerBed />}
    {stage >= 1 && <Pot x={18} />}
    {stage >= 2 && <Pot x={76} />}
    {stage >= 5 && <WaterBowl />}
  </g>;
}

const BULBS = [[274, 86], [292, 90], [310, 92], [328, 90], [346, 86]];
const PhotoString = () => <g><path d="M266 84Q310 98 356 84" stroke="#6b4a2c" strokeWidth=".9" fill="none" />
  {[[283, 89], [301, 92], [319, 92], [337, 89]].map(([x, y], i) => <g key={i} transform={`rotate(${i % 2 ? 4 : -4} ${x} ${y})`}><rect x={x! - 4} y={y} width="8" height="9" fill="#fff" /><rect x={x! - 3} y={y! + 1} width="6" height="5.5" fill={['#8fc1e3', '#f3b07a', '#9fd07b', '#e7a3c2'][i]} /></g>)}
  {BULBS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#f6e3a1" />)}
</g>;
const PhotoFrame = () => <g><rect x="324" y="100" width="24" height="20" rx="1.5" fill={C.wood} /><rect x="327" y="103" width="18" height="14" fill="#cfe7f1" />
  <path d="M327 117l6-7 4 4 3-3 5 6Z" fill="#7fb862" /><circle cx="341" cy="107" r="2" fill="#f7c95a" /></g>;
const JarShelf = () => <g><rect x="278" y="110" width="36" height="3" rx="1" fill={C.woodDark} /><path d="M280 113l3 4M312 113l-3 4" stroke={C.woodDark} strokeWidth="1.2" />
  {[[284, '#f3a64a'], [295, '#c86f9d'], [306, '#7cbf73']].map(([x, color]) => <g key={x}><rect x={Number(x) - 4} y="100" width="8" height="10" rx="2" fill="#e6f2f5" opacity=".9" /><rect x={Number(x) - 4} y="104" width="8" height="6" rx="1.5" fill={color as string} /><rect x={Number(x) - 3} y="98" width="6" height="2.5" rx="1" fill={C.woodDark} /></g>)}</g>;
const Trunk = () => <g><rect x="338" y="130" width="22" height="16" rx="2" fill="#7a4a2e" /><path d="M338 134h22" stroke="#d1a24a" strokeWidth="1.6" /><rect x="346" y="133" width="5" height="5" rx="1" fill="#d1a24a" /><path d="M338 130a11 4 0 0 1 22 0" fill="#8c5a38" /></g>;
const KeepsakeBox = () => <g><rect x="276" y="133" width="16" height="11" rx="1.5" fill="#a86a3f" /><rect x="275" y="131" width="18" height="4" rx="1.2" fill="#c9844f" /><circle cx="284" cy="138" r="1.4" fill="#e7c36a" /></g>;

/** Moti looks after Remember: keepsakes on and by the right wall. */
function Keepsakes({ stage, glowLayer }: { stage: number; glowLayer?: boolean }) {
  if (glowLayer) return stage >= 5 ? <g className="courtyard-twinkle">{BULBS.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="5" fill={C.glow} opacity=".35" /><circle cx={x} cy={y} r="1.7" fill="#fff5c8" /></g>)}</g> : null;
  return <g>
    {stage >= 5 && <PhotoString />}
    {stage >= 2 && <PhotoFrame />}
    {stage >= 3 && <JarShelf />}
    {stage >= 4 && <Trunk />}
    {stage >= 1 && <KeepsakeBox />}
  </g>;
}

const Kite = () => <g className="courtyard-kite"><path d="M261 60Q272 45 288 34" stroke="#fff" strokeWidth=".7" fill="none" opacity=".8" />
  <path d="M288 22l9 10-9 12-9-12Z" fill="#ef6f5a" /><path d="M288 22v22M279 32h18" stroke="#fff" strokeWidth=".8" /><path d="M288 44q-4 6 2 10q-5 4 0 8" stroke="#f3b84a" strokeWidth="1.2" fill="none" /></g>;
const Slate = () => <g transform="translate(26 0)"><rect x="212" y="102" width="26" height="24" rx="1.5" fill={C.woodDark} /><rect x="214.5" y="104.5" width="21" height="19" fill="#2f3b37" />
  <path d="M217 109h6M220 106v6M226 109h4M217 117l4 4M221 117l-4 4M226 119h6M226 121h6" stroke="#eef2ea" strokeWidth=".9" strokeLinecap="round" /></g>;
const Telescope = () => <g><path d="M272 74l-4 6M272 74l4 6M272 74v6" stroke={C.woodDark} strokeWidth="1" /><rect x="266" y="66" width="16" height="4.5" rx="2" fill="#5a6f8c" transform="rotate(-25 272 70)" /><circle cx="281" cy="64.5" r="2.6" fill="#a9c4e0" /></g>;
const PuzzleCube = () => <g><rect x="226" y="66" width="9" height="9" rx="1.3" fill="#fff" /><path d="M229 66v9M232 66v9M226 69h9M226 72h9" stroke="#3a2a20" strokeWidth=".5" /><rect x="226.5" y="66.5" width="2.5" height="2.5" fill="#ef6f5a" /><rect x="232.5" y="69.5" width="2.5" height="2.5" fill="#4f94d4" /><rect x="229.5" y="72.5" width="2.5" height="2.5" fill="#f3c13a" /></g>;
/** The chess board on Kapi's stool; layout B places the board alone where the painted pass has its flat board game. */
const ChessBoard = () => <g><g transform="translate(240 136.5)">{Array.from({ length: 16 }, (_, i) => <rect key={i} x={(i % 8) * 2.75} y={Math.floor(i / 8) * 2.25} width="2.75" height="2.25" fill={(i + Math.floor(i / 8)) % 2 ? '#3a2a20' : '#f4e6cf'} />)}</g>
  <circle cx="246" cy="135" r="1.3" fill="#fff" /><circle cx="256" cy="135.4" r="1.3" fill="#3a2a20" /></g>;
const ChessStool = () => <g><path d="M240 156l2-12M262 156l-2-12" stroke={C.woodDark} strokeWidth="2" /><path d="M238 141h26l-2 4h-22Z" fill={C.wood} /><ChessBoard /></g>;

/** Kapi looks after Mind: puzzles on the wall top, a stool, a kite, a telescope and a slate. */
function Puzzles({ stage }: { stage: number }) {
  return <g>
    {stage >= 3 && <Kite />}
    {stage >= 5 && <Slate />}
    {stage >= 4 && <Telescope />}
    {stage >= 1 && <PuzzleCube />}
    {stage >= 2 && <ChessStool />}
  </g>;
}

/** One medal, drawn clearly as a medal: a V of two ribbon strips from its hook down to a round disc with a rim. */
function Medal({ x, y, drop = 9, r = 4, metal = 'gold' }: { x: number; y: number; drop?: number; r?: number; metal?: 'gold' | 'silver' }) {
  const [face, rim] = metal === 'gold' ? ['#f2c14e', '#b8862a'] : ['#dfe4ea', '#8e98a3'];
  const cy = y + drop + r;
  return <g className="courtyard-medal">
    <path d={`M${x - 3} ${y}L${x} ${y + drop}L${x - 1.2} ${y + drop}L${x - 4.2} ${y}Z`} fill="#d6584a" />
    <path d={`M${x + 3} ${y}L${x} ${y + drop}L${x + 1.2} ${y + drop}L${x + 4.2} ${y}Z`} fill="#4f7fc4" />
    <circle cx={x} cy={cy} r={r} fill={face} stroke={rim} strokeWidth=".9" />
    <circle cx={x} cy={cy} r={r * .55} fill="none" stroke={rim} strokeWidth=".6" opacity=".8" />
    <path d={`M${x - r * .45} ${cy - r * .45}a${r * .6} ${r * .6} 0 0 1 ${r * .5} -${r * .2}`} stroke="#fff" strokeWidth=".7" fill="none" opacity=".7" />
  </g>;
}
const GYM = { top: 112, foot: 150, left: 136, right: 224 };
// b2 9 Nov (a9's shot reviews): the three hang evenly along the bar, post to post; the middle (silver) hangs on a short
// V ribbon (5, the golds 9) so it clears Nandi's horns below it (alpha-report: 0 px of Nandi over his medals).
const Medals = () => <><Medal x={158} y={GYM.top + 3} metal="gold" /><Medal x={184.5} y={GYM.top + 3} metal="silver" drop={5} /><Medal x={211} y={GYM.top + 3} metal="gold" /></>;
const FrameParts = () => {
  const { top, foot, left, right } = GYM;
  return <>
    <ellipse cx={left} cy={foot + 1} rx="6" ry="1.8" fill="#000" opacity=".14" /><ellipse cx={right} cy={foot + 1} rx="6" ry="1.8" fill="#000" opacity=".14" />
    <rect x={left - 2.5} y={top - 2} width="5" height={foot - top + 2} rx="1.2" fill={C.wood} /><rect x={right - 2.5} y={top - 2} width="5" height={foot - top + 2} rx="1.2" fill={C.wood} />
    <path d={`M${left - 6} ${foot}h12M${right - 6} ${foot}h12`} stroke={C.woodDark} strokeWidth="2.4" strokeLinecap="round" />
    <rect x={left - 1} y={top} width={right - left + 2} height="3" rx="1.5" fill="#9aa3ad" /><path d={`M${left} ${top + .8}h${right - left}`} stroke="#cfd5dc" strokeWidth=".7" />
  </>;
};

/**
 * Spec 571 §0.19 (Jenil 6 Nov, "wooden frame it is"): a freestanding wooden gym frame on the floor behind Nandi's mat
 * (two posts with feet, a steel crossbar about mat-width, contact shadows) from stage 4; the medals hang from its bar at
 * stage 5. It replaces the back-wall bar, so nothing of Nandi's stays by Mor's door.
 */
function GymFrame({ stage }: { stage: number }) {
  if (stage < 4) return null;
  return <g className="courtyard-gym-frame"><FrameParts />{stage >= 5 && <Medals />}</g>;
}
const GymMat = () => <g><rect x="132" y="184" width="96" height="12" rx="5" fill="#c9524a" /><path d="M140 186v8M156 186v8M172 186v8M188 186v8M204 186v8M220 186v8" stroke="#e98b6c" strokeWidth="1.2" opacity=".7" /></g>;
const Clubs = () => <g>{[121, 129].map(x => <g key={x}><path d={`M${x - 2.4} 166h4.8l2.6 18a5 3 0 0 1 -10 0Z`} fill={C.wood} /><rect x={x - 2} y="160" width="4" height="7" rx="1.6" fill={C.woodDark} /><path d={`M${x - 3.6} 176h7.2`} stroke="#d1a24a" strokeWidth="1.2" /></g>)}</g>;
const Dumbbells = () => <g transform="translate(134 180) scale(.85)"><rect x="0" y="2.2" width="16" height="2.2" fill="#9aa3ad" /><rect x="-2" y="-1" width="5" height="8.5" rx="1.5" fill="#4b5560" /><rect x="13" y="-1" width="5" height="8.5" rx="1.5" fill="#4b5560" />
  <g transform="translate(6 7)"><rect x="0" y="2.2" width="14" height="2" fill="#9aa3ad" /><rect x="-2" y="-.6" width="4.5" height="7.6" rx="1.4" fill="#4b5560" /><rect x="11.5" y="-.6" width="4.5" height="7.6" rx="1.4" fill="#4b5560" /></g></g>;

/** Nandi looks after Train: a mat, wooden clubs, dumbbells, a wooden gym frame and medals. */
function Gym({ stage }: { stage: number }) {
  return <g>
    <GymFrame stage={stage} />
    {stage >= 1 && <GymMat />}
    {stage >= 2 && <Clubs />}
    {stage >= 3 && <Dumbbells />}
  </g>;
}

const Cot = () => <g><path d="M14 172v20M98 172v20M20 172v18M92 172v18" stroke={C.woodDark} strokeWidth="3" strokeLinecap="round" />
  <rect x="10" y="164" width="92" height="9" rx="2" fill={C.wood} /><rect x="13" y="165.5" width="86" height="6" fill="#e8d3a8" />
  <path d="M17 165.5l6 6M25 165.5l6 6M33 165.5l6 6M41 165.5l6 6M49 165.5l6 6M57 165.5l6 6M65 165.5l6 6M73 165.5l6 6M81 165.5l6 6M89 165.5l6 6" stroke="#c4a777" strokeWidth=".8" /></g>;
const SleepMat = ({ onCot }: { onCot: boolean }) => { const top = onCot ? 168 : 184; return <>
  <rect x="14" y={top + (onCot ? -4 : 0)} width="84" height={onCot ? 5 : 11} rx="3" fill="#5f88b8" />
  {!onCot && <path d="M18 186h76M18 190h76" stroke="#86a8d0" strokeWidth="1" />}
</>; };
const Pillow = ({ onCot }: { onCot: boolean }) => { const top = onCot ? 168 : 184; return <g><rect x="78" y={top - (onCot ? 9 : 4)} width="18" height="9" rx="4" fill="#f4ede0" /><path d={`M82 ${top - (onCot ? 5 : 0)}h10`} stroke="#d9cdb8" strokeWidth="1" /></g>; };
const Blanket = ({ onCot }: { onCot: boolean }) => { const top = onCot ? 168 : 184; return <g><rect x="15" y={top - (onCot ? 9 : 4)} width="20" height="8" rx="2" fill="#d9734f" /><path d={`M15 ${top - (onCot ? 6 : 1)}h20M15 ${top - (onCot ? 3.5 : 1.5)}h20`} stroke="#f3c56a" strokeWidth="1" /></g>; };
const StandingLantern = () => <g transform="translate(-4 0)"><path d="M112 152v4" stroke="#6b4a2c" strokeWidth="1.2" /><path d="M105 156h14l-2 4h-10Z" fill="#6b4a2c" /><rect x="106" y="160" width="12" height="14" rx="2" fill="#f7e2a8" opacity=".85" /><path d="M106 160h12v14h-12Z" fill="none" stroke="#6b4a2c" strokeWidth="1.2" /><path d="M105 174h14l-1 3h-12Z" fill="#6b4a2c" /><path d="M112 162q-2 4 0 7q2 -3 0 -7Z" fill="#f39a1e" /></g>;

/** Kachhua looks after Sleep: a mat, a pillow, a woven cot (charpai), a lantern and a blanket. */
function Rest({ stage, glowLayer }: { stage: number; glowLayer?: boolean }) {
  const onCot = stage >= 3;
  if (glowLayer) return stage >= 4 ? <g className="courtyard-flicker"><circle cx="108" cy="166" r="16" fill={C.glow} opacity=".3" /><circle cx="108" cy="166" r="3" fill="#ffe9a8" /></g> : null;
  return <g>
    {onCot && <Cot />}
    {stage >= 1 && <SleepMat onCot={onCot} />}
    {stage >= 2 && <Pillow onCot={onCot} />}
    {stage >= 5 && <Blanket onCot={onCot} />}
    {stage >= 4 && <StandingLantern />}
  </g>;
}

/** Spec 15: one lantern on Kachhua's string for each soft day (up to 12 drawn); they never go away. */
export function Lanterns({ count, glowLayer }: { count: number; glowLayer?: boolean }) {
  const shown = Math.min(count, 12);
  if (!shown) return null;
  const xs = Array.from({ length: shown }, (_, index) => 16 + index * 9);
  if (glowLayer) return <g className="courtyard-flicker">{xs.map(x => <circle key={x} cx={x} cy="147" r="7" fill={C.glow} opacity=".35" />)}</g>;
  return <g className="courtyard-lanterns" data-lanterns={count}><path d={`M10 137H${xs.at(-1)! + 6}`} stroke="#6b4a2c" strokeWidth="1" />
    {xs.map(x => <g key={x}><path d={`M${x} 137v3`} stroke="#6b4a2c" strokeWidth=".8" /><rect x={x - 3.6} y="140" width="7.2" height="10" rx="2.4" fill="#f6a640" /><rect x={x - 2.2} y="142" width="4.4" height="6" rx="1.4" fill="#ffd98a" /></g>)}</g>;
}

/** Spec 24 #1: a marigold toran over the door, one flower per day with a kept Phone ki chhutti (up to 15 drawn). */
export function Toran({ count }: { count: number }) {
  const shown = Math.min(count, 15);
  if (!shown) return null;
  // Flowers hang along a soft curve across the door, filled from the middle outwards.
  const slots = Array.from({ length: 15 }, (_, index) => 96 + index * (38 / 14));
  const order = slots.map((x, index) => ({ x, index })).sort((a, b) => Math.abs(a.index - 7) - Math.abs(b.index - 7)).slice(0, shown);
  const y = (x: number) => 84 + 4 * (1 - ((x - 115) / 19) ** 2);
  return <g className="courtyard-toran" data-toran={count}><path d="M94 84Q115 92 136 84" stroke="#3f7a3a" strokeWidth=".9" fill="none" />
    {order.map(({ x }) => <g key={x}><circle cx={x} cy={y(x) + 2} r="2.8" fill="#f39a1e" /><circle cx={x} cy={y(x) + 2} r="1.1" fill="#c8641a" /></g>)}</g>;
}

const spine = (x: number, y: number, w: number, color: string) => <rect x={x} y={y} width={w} height="5" rx="1" fill={color} />;
const Bookshelf = () => <g><rect x="320" y="148" width="38" height="48" rx="2" fill={C.wood} /><rect x="323" y="151" width="32" height="19" fill="#6b4128" /><rect x="323" y="174" width="32" height="19" fill="#6b4128" />
  {[[324, '#4f94d4', 16], [328, '#ef6f5a', 17], [332, '#f3c13a', 15], [336.5, '#7cbf73', 17], [341, '#c86f9d', 16], [345.5, '#5aa9a0', 14]].map(([x, color, h]) => <rect key={x} x={x as number} y={170 - (h as number)} width="4" height={h as number} rx=".6" fill={color as string} />)}
  {[[324, '#f3a64a', 15], [329, '#4f94d4', 17], [334, '#9fd07b', 16], [339, '#ef6f5a', 14]].map(([x, color, h]) => <rect key={x} x={x as number} y={193 - (h as number)} width="4.4" height={h as number} rx=".6" fill={color as string} />)}</g>;
const ReadingLamp = () => <g><path d="M248 194v-26" stroke="#6b4a2c" strokeWidth="1.6" /><ellipse cx="248" cy="195" rx="6" ry="1.8" fill="#6b4a2c" /><path d="M240 170h16l-4-9h-8Z" fill="#f6c45a" /></g>;
const BookStack = () => <g>{spine(258, 191, 22, '#4f94d4')}{spine(260, 186, 19, '#ef6f5a')}{spine(257, 181, 21, '#7cbf73')}<path d="M262 182.5h14M262 192.5h16" stroke="#fff" strokeWidth=".6" opacity=".7" /></g>;
const Globe = () => <g><path d="M268 181v-3M264 178h8" stroke="#6b4a2c" strokeWidth="1.2" /><circle cx="268" cy="170" r="7.5" fill="#6fb3d9" /><path d="M263 166q3 2 4 6t5 3M266 163q2 2 6 1" stroke="#7fb862" strokeWidth="2.2" fill="none" strokeLinecap="round" /><path d="M260 170a8 8 0 0 0 16 0" stroke="#6b4a2c" strokeWidth="1" fill="none" /></g>;
// a9 9 Nov: on its own (s1) the white pages read as a bird, so the book gets a coloured cover under the pages, a spine
// and page edges.
const OpenBook = () => <g>
  <path d="M285 196.4Q291 195.2 298 197Q305 195.2 311 196.4V198.4Q305 197.2 298 199Q291 197.2 285 198.4Z" fill="#3f7f8c" />
  <path d="M286 195.6Q291.5 191.4 298 193.2V197.6Q291.5 195.6 286 197Z" fill="#fffaf0" stroke="#b9a888" strokeWidth=".35" />
  <path d="M310 195.6Q304.5 191.4 298 193.2V197.6Q304.5 195.6 310 197Z" fill="#f6efe0" stroke="#b9a888" strokeWidth=".35" />
  <path d="M298 193.2V197.8" stroke="#2c5d68" strokeWidth=".9" />
  <path d="M288.6 194.9Q292 193 296 193.9M300 193.9Q304 193 307.4 194.9M288.6 196.1Q292 194.3 296 195.1M300 195.1Q304 194.3 307.4 196.1" stroke="#c9b8a0" strokeWidth=".45" fill="none" /></g>;

/** Chiku looks after Learn: a book, a stack, a low shelf, a lamp and a globe. */
function Books({ stage, glowLayer }: { stage: number; glowLayer?: boolean }) {
  if (glowLayer) return stage >= 4 ? <g className="courtyard-flicker"><circle cx="248" cy="168" r="14" fill={C.glow} opacity=".32" /></g> : null;
  return <g>
    {stage >= 3 && <Bookshelf />}
    {stage >= 4 && <ReadingLamp />}
    {stage >= 2 && <BookStack />}
    {stage >= 5 && <Globe />}
    {stage >= 1 && <OpenBook />}
  </g>;
}

/**
 * Spec 571 stage 2: every corner object as its own part, drawn in Scene.tsx's units with the box it occupies there
 * (`box`), so layout B can fit it into the painted pass's prop rect (contain, bottom-centred). The mats, pillow and
 * blanket are the floor versions; on the painted cot they sit where the pass puts them.
 */
export interface Part { box: readonly [number, number, number, number]; draw: () => ReactElement; glow?: () => ReactElement }

// The 9 Nov support hotfix (b2 + a9): layout B's own versions of five parts, so each reads as standing on something.
/** A contact shadow under a floor part (opacity under the gate's alpha cut, so it never counts as the part). */
const FloorShadow = ({ cx, cy, rx }: { cx: number; cy: number; rx: number }) => <ellipse cx={cx} cy={cy} rx={rx} ry={rx * .18} fill="#000" opacity=".13" />;
/** A puzzle cube as a cube: a 3 × 3 front face, a lighter top and a darker side (19 × 19 box). */
const CUBE_FRONT = ['#ef6f5a', '#fff', '#4f94d4', '#f3c13a', '#ef6f5a', '#7cbf73', '#fff', '#f39a1e', '#4f94d4'];
const CubeSolid = () => <g>
  <path d="M0 5L5 0H19L14 5Z" fill="#2a1f18" /><path d="M14 5L19 0V14L14 19Z" fill="#241a14" /><rect x="0" y="5" width="14" height="14" rx=".8" fill="#2a1f18" />
  {CUBE_FRONT.map((fill, i) => <rect key={i} x={.7 + (i % 3) * 4.4} y={5.7 + Math.floor(i / 3) * 4.4} width="3.9" height="3.9" rx=".5" fill={fill} />)}
  {['#f8c447', '#fff4dc', '#9fd07b', '#f6a49a', '#f8c447', '#a9cdee', '#fff4dc', '#9fd07b', '#f8c447'].map((fill, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 1 + col * 4.4 + (2 - row) * 1.55, y = .6 + row * 1.5;
    return <path key={i} d={`M${x} ${y + 1.25}l${1.2} -1.2h3.5l-1.2 1.2Z`} fill={fill} />;
  })}
  {['#3a78b8', '#c9a020', '#5f9e4f', '#d9534a', '#3a78b8', '#c9a020', '#5f9e4f', '#d9534a', '#3a78b8'].map((fill, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 14.5 + col * 1.5, y = 5.4 - col * 1.5 + row * 4.4;
    return <path key={i} d={`M${x} ${y + 1.3}l1.2 -1.2v3.6l-1.2 1.2Z`} fill={fill} />;
  })}
</g>;
/** Moti's frame standing at the wall foot, leaning on the wall, with a contact shadow (9q's spot). */
const StandingFrame = () => <g><FloorShadow cx={336} cy={120} rx={13} /><PhotoFrame /></g>;
/** Mor's planter shelf: a stone ledge fixed to the wall face on two brackets; the pots and the bed stand on it (72 × 9 box). */
const PlanterShelf = () => <g>
  <path d="M3 3L3 9L8 3ZM69 3L69 9L64 3Z" fill="#b9ab93" />
  <rect x="0" y="0" width="72" height="3.2" rx=".8" fill="#efe6d6" /><rect x="0" y="2.4" width="72" height="1" fill="#c9b99c" />
</g>;
/** Kachhua's sleeping mat laid on the floor: one rolled end, a thick front edge, fringe and a shadow (84 × 12 box). */
const LaidMat = () => <g>
  <FloorShadow cx={57} cy={195} rx={42} />
  <rect x="21" y="185" width="75" height="8" rx="1.5" fill="#5f88b8" /><rect x="21" y="191.6" width="75" height="2.6" rx="1" fill="#3f6693" />
  <path d="M28 187.2h66M28 190h66" stroke="#86a8d0" strokeWidth="1" />
  <path d="M96 186.2l2.4 .4M96 188.6l2.4 .4M96 191l2.4 .4" stroke="#e9dcc0" strokeWidth=".8" strokeLinecap="round" />
  <ellipse cx="20.5" cy="189" rx="4.8" ry="5.6" fill="#4d75a3" /><ellipse cx="20.5" cy="189" rx="2.8" ry="3.5" fill="none" stroke="#86a8d0" strokeWidth=".9" /><circle cx="20.5" cy="189" r="1" fill="#3f6693" />
</g>;
/** Chiku's small reading mat (27 × 4 box), a book or the stack lies on it at his first two stages. */
const ReadingMat = () => <g>
  <FloorShadow cx={13.5} cy={4} rx={14} />
  <rect x=".5" y="0" width="26" height="3" rx=".8" fill="#c96f4a" /><rect x=".5" y="2.6" width="26" height="1.2" rx=".5" fill="#9b4f30" />
  <path d="M3 1.4h21" stroke="#f3d9a8" strokeWidth=".6" />
</g>;
const PotOnFloor = ({ x }: { x: number }) => <g><FloorShadow cx={x} cy={128} rx={10} /><Pot x={x} /></g>;
const LIGHT_GLOW = { photoString: () => <Keepsakes stage={5} glowLayer />, standingLantern: () => <Rest stage={4} glowLayer />, readingLamp: () => <Books stage={4} glowLayer /> };
export const PARTS = {
  pot1: { box: [8, 95, 20, 33], draw: () => <PotOnFloor x={18} /> },
  pot2: { box: [66, 95, 20, 33], draw: () => <PotOnFloor x={76} /> },
  flowerBed: { box: [2, 114.4, 92, 18.6], draw: () => <FlowerBed /> },
  trellis: { box: [8, 77, 82, 49], draw: () => <Trellis /> },
  waterBowl: { box: [77, 139, 22, 11], draw: () => <WaterBowl /> },
  keepsakeBox: { box: [275, 131, 18, 13], draw: () => <KeepsakeBox /> },
  photoFrame: { box: [324, 100, 24, 20], draw: () => <StandingFrame /> },
  planterShelf: { box: [0, 0, 72, 9], draw: () => <PlanterShelf /> },
  jarShelf: { box: [278, 98, 36, 19], draw: () => <JarShelf /> },
  trunk: { box: [338, 126, 22, 20], draw: () => <Trunk /> },
  photoString: { box: [266, 84, 90, 17], draw: () => <PhotoString />, glow: LIGHT_GLOW.photoString },
  puzzleCube: { box: [0, 0, 19, 19], draw: () => <CubeSolid /> },
  chessBoard: { box: [240, 133.7, 22, 7.3], draw: () => <ChessBoard /> },
  kite: { box: [279, 22, 18, 40], draw: () => <Kite /> },
  telescope: { box: [264, 60, 20, 20], draw: () => <Telescope /> },
  slate: { box: [238, 102, 26, 24], draw: () => <Slate /> },
  gymMat: { box: [132, 184, 96, 12], draw: () => <GymMat /> },
  clubs: { box: [116, 160, 18, 26], draw: () => <Clubs /> },
  dumbbells: { box: [132.3, 179.1, 20.4, 13.6], draw: () => <Dumbbells /> },
  gymFrame: { box: [130, 110, 100, 42.8], draw: () => <g className="courtyard-gym-frame"><FrameParts /></g> },
  medals: { box: [157.8, 115, 52.4, 20], draw: () => <Medals /> },
  sleepMat: { box: [15, 183, 84, 12], draw: () => <LaidMat /> },
  pillow: { box: [78, 180, 18, 9], draw: () => <Pillow onCot={false} /> },
  cot: { box: [10, 164, 92, 28], draw: () => <Cot /> },
  standingLantern: { box: [101, 152, 14, 25], draw: () => <StandingLantern />, glow: LIGHT_GLOW.standingLantern },
  blanket: { box: [15, 180, 20, 8], draw: () => <Blanket onCot={false} /> },
  openBook: { box: [286, 192, 24, 6], draw: () => <OpenBook /> },
  readingMat: { box: [0, 0, 27, 4], draw: () => <ReadingMat /> },
  bookStack: { box: [257, 181, 23, 15], draw: () => <BookStack /> },
  bookshelf: { box: [320, 148, 38, 48], draw: () => <Bookshelf /> },
  readingLamp: { box: [240, 161, 16, 36], draw: () => <ReadingLamp />, glow: LIGHT_GLOW.readingLamp },
  globe: { box: [260, 162, 16, 20], draw: () => <Globe /> },
} satisfies Record<string, Part>;
export type PartId = keyof typeof PARTS;

export function CourtyardScene({ phase, stages, treeStage, title, lanterns = 0, toran = 0 }: { phase: Phase; stages: Stages; treeStage: number; title: string; lanterns?: number; toran?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tint = TINT[phase];
  const lit = phase === 'evening' || phase === 'night';
  return <svg className={`courtyard-scene courtyard-${phase}`} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} role="img" aria-label={title} focusable="false" preserveAspectRatio="xMidYMid slice">
    <title>{title}</title>
    <Sky phase={phase} id={id} />
    <Walls />
    <Toran count={toran} />
    <Garden stage={stages.plan} />
    <Keepsakes stage={stages.remember} />
    <Gym stage={stages.train} />
    <Tree stage={treeStage} />
    <Puzzles stage={stages.mind} />
    <Rest stage={stages.sleep} />
    <Lanterns count={lanterns} />
    <Books stage={stages.learn} />
    {tint && <rect width={SCENE_W} height={SCENE_H} fill={tint} />}
    {lit && <g>
      <Tree stage={treeStage} glowLayer /><Keepsakes stage={stages.remember} glowLayer /><Rest stage={stages.sleep} glowLayer /><Lanterns count={lanterns} glowLayer /><Books stage={stages.learn} glowLayer />
    </g>}
  </svg>;
}
