import { useId } from 'react';
import type { AreaId, Phase } from '../../core/courtyard/courtyard';

// The courtyard (spec 12) drawn on a 360 × 200 grid. Each corner gains one object per stage; nothing is removed.
// Layers: sky → wall and floor → objects → a phase tint → lights that glow through the tint.
export type Stages = Record<AreaId, number>;
export const SCENE_W = 360, SCENE_H = 200;

const SKY: Record<Phase, [string, string]> = {
  morning: ['#bfe0f2', '#fde5c4'], day: ['#8fcdf0', '#dff2fb'], evening: ['#6c6fb5', '#f7a56a'], night: ['#121838', '#2c3468'],
};
const TINT: Record<Phase, string | null> = { morning: 'rgba(255,214,170,.10)', day: null, evening: 'rgba(120,64,110,.20)', night: 'rgba(14,18,48,.58)' };
const C = {
  wall: '#f1d4a6', wallShade: '#e2ba86', coping: '#c97f4a', copingDark: '#a9643a', floor: '#e8c896', floorLine: '#c9a170',
  wood: '#8a5a3a', woodDark: '#6b4128', door: '#3f8f9a', doorDark: '#2f6f78', terracotta: '#c8693c', terracottaDark: '#a4522c',
  leaf: '#5f9e4f', leafLight: '#7fb862', leafDark: '#467f3d', marigold: '#f39a1e', marigoldLight: '#f8c447', ink: '#3a2a20',
  stone: '#d9cdb8', stoneDark: '#b9ab93', glow: '#ffd27a',
};

function Sky({ phase, id }: { phase: Phase; id: string }) {
  const [top, bottom] = SKY[phase];
  return <>
    <defs><linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient></defs>
    <rect width={SCENE_W} height="130" fill={`url(#${id}sky)`} />
    {phase === 'morning' && <><circle cx="62" cy="64" r="15" fill="#ffe0a3" /><circle cx="62" cy="64" r="24" fill="#ffe0a3" opacity=".3" /></>}
    {phase === 'day' && <><circle cx="306" cy="28" r="13" fill="#fff3b8" /><circle cx="306" cy="28" r="21" fill="#fff3b8" opacity=".35" /></>}
    {phase === 'evening' && <><circle cx="318" cy="70" r="16" fill="#ffb36b" /><circle cx="318" cy="70" r="26" fill="#ff9a5a" opacity=".3" /></>}
    {phase === 'night' && <g className="courtyard-stars" fill="#fff">
      <path d="M300 20a12 12 0 1 0 10 18a10 10 0 1 1 -10 -18Z" fill="#f4ecd0" />
      {[[30, 18, 1.2], [70, 34, .9], [112, 14, 1.1], [150, 40, .8], [238, 22, 1], [270, 44, .8], [340, 50, 1.1], [92, 56, .7], [210, 52, .7]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} opacity=".85" />)}
    </g>}
    {(phase === 'morning' || phase === 'day') && <g className="courtyard-clouds" fill="#fff" opacity=".85">
      <path d="M96 40c0-6 6-10 12-8 3-5 12-5 15 1 6-1 10 3 9 7Z" /><path d="M232 58c0-5 5-8 10-6 3-4 10-4 12 1 5 0 8 2 7 5Z" />
    </g>}
  </>;
}

function Walls() {
  return <>
    <rect y="80" width={SCENE_W} height="50" fill={C.wall} />
    <path d="M0 118h360v12H0Z" fill={C.wallShade} opacity=".55" />
    {[[30, 96, 18], [210, 104, 22], [330, 92, 14]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r! / 3} fill="#fff" opacity=".18" />)}
    <rect y="74" width={SCENE_W} height="8" rx="1.5" fill={C.coping} /><rect y="80" width={SCENE_W} height="2" fill={C.copingDark} opacity=".6" />
    {/* An arched wooden door, painted teal. */}
    <path d="M94 130V102a21 21 0 0 1 42 0V130Z" fill={C.wood} />
    <path d="M98 130V103a17 17 0 0 1 34 0V130Z" fill={C.door} />
    <path d="M115 87V130" stroke={C.doorDark} strokeWidth="1.6" />
    <path d="M101 108h11M118 108h11M101 120h11M118 120h11" stroke={C.doorDark} strokeWidth="1.1" opacity=".7" />
    <circle cx="112" cy="114" r="1.3" fill="#e7c36a" /><circle cx="118" cy="114" r="1.3" fill="#e7c36a" />
    {/* Floor of warm stone. */}
    <rect y="128" width={SCENE_W} height="72" fill={C.floor} />
    <path d="M0 128h360" stroke={C.floorLine} strokeWidth="1.5" opacity=".6" />
    <path d="M0 152h360M0 178h360M60 128l-28 72M140 128l-12 72M220 128l12 72M300 128l28 72" stroke={C.floorLine} strokeWidth=".8" opacity=".35" />
  </>;
}

/** The neem tree grows with active days; a stone platform (chabutra) is there from the start. */
function Tree({ stage, glowLayer }: { stage: number; glowLayer?: boolean }) {
  const k = [0.22, 0.45, 0.64, 0.84, 1, 1][stage]!;
  const leaves: [number, number, number, string][] = [
    [180, 46, 30, C.leaf], [148, 60, 24, C.leafDark], [212, 60, 24, C.leafDark], [162, 30, 21, C.leafLight], [200, 28, 21, C.leaf],
    [134, 80, 16, C.leaf], [226, 80, 16, C.leaf], [180, 70, 22, C.leafLight], [180, 18, 15, C.leafLight],
  ];
  const lights = [[150, 52], [168, 70], [186, 40], [204, 62], [222, 78], [140, 76], [176, 22], [196, 82]];
  if (glowLayer) return stage >= 5 ? <g transform={`translate(0 -8) translate(180 140) scale(${k}) translate(-180 -140)`} className="courtyard-twinkle">
    {lights.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="5" fill={C.glow} opacity=".35" /><circle cx={x} cy={y} r="1.8" fill="#fff5c8" /></g>)}
  </g> : null;
  return <g transform="translate(0 -8)">
    <ellipse cx="180" cy="146" rx="30" ry="7" fill={C.stoneDark} />
    <path d="M150 140h60v6a30 7 0 0 1 -60 0Z" fill={C.stone} />
    <ellipse cx="180" cy="140" rx="30" ry="6" fill="#e6dccb" />
    <g transform={`translate(180 140) scale(${k}) translate(-180 -140)`}>
      {stage === 0 ? <><path d="M180 140v-26" stroke={C.wood} strokeWidth="3" strokeLinecap="round" />
        <path d="M180 122c-12-4-18 2-20 6 10 2 16 0 20-6ZM180 116c10-6 18-2 20 2-9 3-16 2-20-2Z" fill={C.leafLight} /></> : <>
        <path d="M172 140c2-24 3-44 4-70h8c1 26 2 46 4 70Z" fill={C.wood} />
        <path d="M177 92c-10-8-20-10-30-12M183 88c10-8 22-12 32-12M180 72c-4-14-12-22-18-30M181 72c4-14 10-24 18-32" stroke={C.wood} strokeWidth="5" strokeLinecap="round" fill="none" />
        {leaves.map(([x, y, r, fill], i) => <circle key={i} cx={x} cy={y} r={r} fill={fill} />)}
        {[[170, 40], [196, 52], [150, 64], [214, 70], [186, 24]].map(([x, y], i) => <path key={i} d={`M${x} ${y}q4 -4 8 0`} stroke="#9fd07b" strokeWidth="1.6" fill="none" strokeLinecap="round" />)}
        {stage >= 4 && <g className="courtyard-swing"><path d="M200 80V120M220 80V120" stroke="#a37b52" strokeWidth="1.4" /><rect x="195" y="119" width="30" height="5" rx="1.5" fill={C.woodDark} /></g>}
        {stage >= 5 && <path d="M136 74Q160 92 182 66T228 74M146 50Q176 68 210 46" stroke="#6b4a2c" strokeWidth=".8" fill="none" />}
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

/** Mor looks after Plan: a small garden by the wall. */
function Garden({ stage }: { stage: number }) {
  return <g>
    {stage >= 4 && <g>
      <path d="M8 86h80M8 98h80M8 110h80M14 84v42M34 84v42M54 84v42M74 84v42" stroke="#b48a5c" strokeWidth="1.3" />
      <path d="M12 124c6-10 2-22 12-30s14-6 22-12 18 0 26-4 10 2 16 4" stroke={C.leafDark} strokeWidth="1.6" fill="none" />
      {[[22, 96], [40, 86], [58, 82], [76, 80], [30, 108], [66, 92]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx="4" ry="2.4" fill={C.leaf} transform={`rotate(-30 ${x} ${y})`} />{i % 2 === 0 && <circle cx={x! + 3} cy={y! - 2} r="2" fill="#ef6f8f" />}</g>)}
    </g>}
    {stage >= 3 && <g>
      <rect x="2" y="124" width="92" height="9" rx="2" fill="#9b5a36" /><rect x="4" y="121" width="88" height="5" rx="2" fill="#6f8f3c" />
      {[10, 22, 34, 56, 68, 82].map((x, i) => <g key={x}><path d={`M${x} 124v-6`} stroke={C.leafDark} strokeWidth="1.2" /><circle cx={x} cy={117} r="2.6" fill={i % 2 ? '#ef6f8f' : C.marigoldLight} /></g>)}
    </g>}
    {stage >= 1 && <Pot x={18} />}
    {stage >= 2 && <Pot x={76} />}
    {stage >= 5 && <g><ellipse cx="88" cy="146" rx="11" ry="4" fill={C.stoneDark} /><ellipse cx="88" cy="143" rx="11" ry="4" fill={C.stone} /><ellipse cx="88" cy="143" rx="8" ry="2.6" fill="#7cc3dc" /><path d="M84 142.5q2-1 4 0" stroke="#fff" strokeWidth=".8" fill="none" /></g>}
  </g>;
}

/** Moti looks after Remember: keepsakes on and by the right wall. */
function Keepsakes({ stage, glowLayer }: { stage: number; glowLayer?: boolean }) {
  const bulbs = [[274, 86], [292, 90], [310, 92], [328, 90], [346, 86]];
  if (glowLayer) return stage >= 5 ? <g className="courtyard-twinkle">{bulbs.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="5" fill={C.glow} opacity=".35" /><circle cx={x} cy={y} r="1.7" fill="#fff5c8" /></g>)}</g> : null;
  return <g>
    {stage >= 5 && <g><path d="M266 84Q310 98 356 84" stroke="#6b4a2c" strokeWidth=".9" fill="none" />
      {[[283, 89], [301, 92], [319, 92], [337, 89]].map(([x, y], i) => <g key={i} transform={`rotate(${i % 2 ? 4 : -4} ${x} ${y})`}><rect x={x! - 4} y={y} width="8" height="9" fill="#fff" /><rect x={x! - 3} y={y! + 1} width="6" height="5.5" fill={['#8fc1e3', '#f3b07a', '#9fd07b', '#e7a3c2'][i]} /></g>)}
      {bulbs.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#f6e3a1" />)}
    </g>}
    {stage >= 2 && <g><rect x="324" y="100" width="24" height="20" rx="1.5" fill={C.wood} /><rect x="327" y="103" width="18" height="14" fill="#cfe7f1" />
      <path d="M327 117l6-7 4 4 3-3 5 6Z" fill="#7fb862" /><circle cx="341" cy="107" r="2" fill="#f7c95a" /></g>}
    {stage >= 3 && <g><rect x="278" y="110" width="36" height="3" rx="1" fill={C.woodDark} /><path d="M280 113l3 4M312 113l-3 4" stroke={C.woodDark} strokeWidth="1.2" />
      {[[284, '#f3a64a'], [295, '#c86f9d'], [306, '#7cbf73']].map(([x, color]) => <g key={x}><rect x={Number(x) - 4} y="100" width="8" height="10" rx="2" fill="#e6f2f5" opacity=".9" /><rect x={Number(x) - 4} y="104" width="8" height="6" rx="1.5" fill={color as string} /><rect x={Number(x) - 3} y="98" width="6" height="2.5" rx="1" fill={C.woodDark} /></g>)}</g>}
    {stage >= 4 && <g><rect x="338" y="130" width="22" height="16" rx="2" fill="#7a4a2e" /><path d="M338 134h22" stroke="#d1a24a" strokeWidth="1.6" /><rect x="346" y="133" width="5" height="5" rx="1" fill="#d1a24a" /><path d="M338 130a11 4 0 0 1 22 0" fill="#8c5a38" /></g>}
    {stage >= 1 && <g><rect x="276" y="133" width="16" height="11" rx="1.5" fill="#a86a3f" /><rect x="275" y="131" width="18" height="4" rx="1.2" fill="#c9844f" /><circle cx="284" cy="138" r="1.4" fill="#e7c36a" /></g>}
  </g>;
}

/** Kapi looks after Mind: puzzles on the wall top, a stool, a kite, a telescope and a slate. */
function Puzzles({ stage }: { stage: number }) {
  return <g>
    {stage >= 3 && <g className="courtyard-kite"><path d="M252 70Q268 46 288 34" stroke="#fff" strokeWidth=".7" fill="none" opacity=".8" />
      <path d="M288 22l9 10-9 12-9-12Z" fill="#ef6f5a" /><path d="M288 22v22M279 32h18" stroke="#fff" strokeWidth=".8" /><path d="M288 44q-4 6 2 10q-5 4 0 8" stroke="#f3b84a" strokeWidth="1.2" fill="none" /></g>}
    {stage >= 5 && <g><g transform="translate(26 0)"><rect x="212" y="102" width="26" height="24" rx="1.5" fill={C.woodDark} /><rect x="214.5" y="104.5" width="21" height="19" fill="#2f3b37" />
      <path d="M217 109h6M220 106v6M226 109h4M217 117l4 4M221 117l-4 4M226 119h6M226 121h6" stroke="#eef2ea" strokeWidth=".9" strokeLinecap="round" /></g></g>}
    {stage >= 4 && <g><path d="M272 74l-4 6M272 74l4 6M272 74v6" stroke={C.woodDark} strokeWidth="1" /><rect x="266" y="66" width="16" height="4.5" rx="2" fill="#5a6f8c" transform="rotate(-25 272 70)" /><circle cx="281" cy="64.5" r="2.6" fill="#a9c4e0" /></g>}
    {stage >= 1 && <g><rect x="226" y="66" width="9" height="9" rx="1.3" fill="#fff" /><path d="M229 66v9M232 66v9M226 69h9M226 72h9" stroke="#3a2a20" strokeWidth=".5" /><rect x="226.5" y="66.5" width="2.5" height="2.5" fill="#ef6f5a" /><rect x="232.5" y="69.5" width="2.5" height="2.5" fill="#4f94d4" /><rect x="229.5" y="72.5" width="2.5" height="2.5" fill="#f3c13a" /></g>}
    {stage >= 2 && <g><path d="M240 156l2-12M262 156l-2-12" stroke={C.woodDark} strokeWidth="2" /><path d="M238 141h26l-2 4h-22Z" fill={C.wood} />
      <g transform="translate(240 136.5)">{Array.from({ length: 16 }, (_, i) => <rect key={i} x={(i % 8) * 2.75} y={Math.floor(i / 8) * 2.25} width="2.75" height="2.25" fill={(i + Math.floor(i / 8)) % 2 ? '#3a2a20' : '#f4e6cf'} />)}</g>
      <circle cx="246" cy="135" r="1.3" fill="#fff" /><circle cx="256" cy="135.4" r="1.3" fill="#3a2a20" /></g>}
  </g>;
}

/** Nandi looks after Train: a mat, wooden clubs, dumbbells, a wall bar and medals. */
function Gym({ stage }: { stage: number }) {
  return <g>
    {stage >= 4 && <g><rect x="140" y="88" width="3" height="8" fill="#6f7680" /><rect x="164" y="88" width="3" height="8" fill="#6f7680" /><rect x="138" y="90.5" width="31" height="2.6" rx="1.3" fill="#9aa3ad" /></g>}
    {stage >= 5 && <g><path d="M152 98v4" stroke={C.woodDark} strokeWidth="1.4" /><path d="M147 102l3 7M157 102l-3 7M152 102v8" stroke="#d6584a" strokeWidth="1.4" />
      <circle cx="149" cy="112" r="3" fill="#f2c14e" /><circle cx="155" cy="113" r="3" fill="#cfd5dc" /><circle cx="152" cy="114" r="3.2" fill="#f2c14e" /><path d="M150.6 114h2.8" stroke="#b8862a" strokeWidth=".8" /></g>}
    {stage >= 1 && <g><rect x="132" y="184" width="96" height="12" rx="5" fill="#c9524a" /><path d="M140 186v8M156 186v8M172 186v8M188 186v8M204 186v8M220 186v8" stroke="#e98b6c" strokeWidth="1.2" opacity=".7" /></g>}
    {stage >= 2 && <g>{[121, 129].map(x => <g key={x}><path d={`M${x - 2.4} 166h4.8l2.6 18a5 3 0 0 1 -10 0Z`} fill={C.wood} /><rect x={x - 2} y="160" width="4" height="7" rx="1.6" fill={C.woodDark} /><path d={`M${x - 3.6} 176h7.2`} stroke="#d1a24a" strokeWidth="1.2" /></g>)}</g>}
    {stage >= 3 && <g transform="translate(134 180) scale(.85)"><rect x="0" y="2.2" width="16" height="2.2" fill="#9aa3ad" /><rect x="-2" y="-1" width="5" height="8.5" rx="1.5" fill="#4b5560" /><rect x="13" y="-1" width="5" height="8.5" rx="1.5" fill="#4b5560" />
      <g transform="translate(6 7)"><rect x="0" y="2.2" width="14" height="2" fill="#9aa3ad" /><rect x="-2" y="-.6" width="4.5" height="7.6" rx="1.4" fill="#4b5560" /><rect x="11.5" y="-.6" width="4.5" height="7.6" rx="1.4" fill="#4b5560" /></g></g>}
  </g>;
}

/** Kachhua looks after Sleep: a mat, a pillow, a woven cot (charpai), a lantern and a blanket. */
function Rest({ stage, glowLayer }: { stage: number; glowLayer?: boolean }) {
  const onCot = stage >= 3;
  if (glowLayer) return stage >= 4 ? <g className="courtyard-flicker"><circle cx="108" cy="166" r="16" fill={C.glow} opacity=".3" /><circle cx="108" cy="166" r="3" fill="#ffe9a8" /></g> : null;
  const top = onCot ? 168 : 184;
  return <g>
    {onCot && <g><path d="M14 172v20M98 172v20M20 172v18M92 172v18" stroke={C.woodDark} strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="164" width="92" height="9" rx="2" fill={C.wood} /><rect x="13" y="165.5" width="86" height="6" fill="#e8d3a8" />
      <path d="M17 165.5l6 6M25 165.5l6 6M33 165.5l6 6M41 165.5l6 6M49 165.5l6 6M57 165.5l6 6M65 165.5l6 6M73 165.5l6 6M81 165.5l6 6M89 165.5l6 6" stroke="#c4a777" strokeWidth=".8" /></g>}
    {stage >= 1 && <rect x="14" y={top + (onCot ? -4 : 0)} width="84" height={onCot ? 5 : 11} rx="3" fill="#5f88b8" />}
    {stage >= 1 && !onCot && <path d="M18 186h76M18 190h76" stroke="#86a8d0" strokeWidth="1" />}
    {stage >= 2 && <g><rect x="78" y={top - (onCot ? 9 : 4)} width="18" height="9" rx="4" fill="#f4ede0" /><path d={`M82 ${top - (onCot ? 5 : 0)}h10`} stroke="#d9cdb8" strokeWidth="1" /></g>}
    {stage >= 5 && <g><rect x="15" y={top - (onCot ? 9 : 4)} width="20" height="8" rx="2" fill="#d9734f" /><path d={`M15 ${top - (onCot ? 6 : 1)}h20M15 ${top - (onCot ? 3.5 : 1.5)}h20`} stroke="#f3c56a" strokeWidth="1" /></g>}
    {stage >= 4 && <g transform="translate(-4 0)"><path d="M112 152v4" stroke="#6b4a2c" strokeWidth="1.2" /><path d="M105 156h14l-2 4h-10Z" fill="#6b4a2c" /><rect x="106" y="160" width="12" height="14" rx="2" fill="#f7e2a8" opacity=".85" /><path d="M106 160h12v14h-12Z" fill="none" stroke="#6b4a2c" strokeWidth="1.2" /><path d="M105 174h14l-1 3h-12Z" fill="#6b4a2c" /><path d="M112 162q-2 4 0 7q2 -3 0 -7Z" fill="#f39a1e" /></g>}
  </g>;
}

/** Chiku looks after Learn: a book, a stack, a low shelf, a lamp and a globe. */
function Books({ stage, glowLayer }: { stage: number; glowLayer?: boolean }) {
  if (glowLayer) return stage >= 4 ? <g className="courtyard-flicker"><circle cx="248" cy="168" r="14" fill={C.glow} opacity=".32" /></g> : null;
  const spine = (x: number, y: number, w: number, color: string) => <rect x={x} y={y} width={w} height="5" rx="1" fill={color} />;
  return <g>
    {stage >= 3 && <g><rect x="320" y="148" width="38" height="48" rx="2" fill={C.wood} /><rect x="323" y="151" width="32" height="19" fill="#6b4128" /><rect x="323" y="174" width="32" height="19" fill="#6b4128" />
      {[[324, '#4f94d4', 16], [328, '#ef6f5a', 17], [332, '#f3c13a', 15], [336.5, '#7cbf73', 17], [341, '#c86f9d', 16], [345.5, '#5aa9a0', 14]].map(([x, color, h]) => <rect key={x} x={x as number} y={170 - (h as number)} width="4" height={h as number} rx=".6" fill={color as string} />)}
      {[[324, '#f3a64a', 15], [329, '#4f94d4', 17], [334, '#9fd07b', 16], [339, '#ef6f5a', 14]].map(([x, color, h]) => <rect key={x} x={x as number} y={193 - (h as number)} width="4.4" height={h as number} rx=".6" fill={color as string} />)}</g>}
    {stage >= 4 && <g><path d="M248 194v-26" stroke="#6b4a2c" strokeWidth="1.6" /><ellipse cx="248" cy="195" rx="6" ry="1.8" fill="#6b4a2c" /><path d="M240 170h16l-4-9h-8Z" fill="#f6c45a" /></g>}
    {stage >= 2 && <g>{spine(258, 191, 22, '#4f94d4')}{spine(260, 186, 19, '#ef6f5a')}{spine(257, 181, 21, '#7cbf73')}<path d="M262 182.5h14M262 192.5h16" stroke="#fff" strokeWidth=".6" opacity=".7" /></g>}
    {stage >= 5 && <g><path d="M268 181v-3M264 178h8" stroke="#6b4a2c" strokeWidth="1.2" /><circle cx="268" cy="170" r="7.5" fill="#6fb3d9" /><path d="M263 166q3 2 4 6t5 3M266 163q2 2 6 1" stroke="#7fb862" strokeWidth="2.2" fill="none" strokeLinecap="round" /><path d="M260 170a8 8 0 0 0 16 0" stroke="#6b4a2c" strokeWidth="1" fill="none" /></g>}
    {stage >= 1 && <g><path d="M286 196l12-4 12 4-12 2Z" fill="#fff" /><path d="M298 192v6" stroke="#c9a170" strokeWidth=".8" /><path d="M288 195.4l8-2.6M300 192.8l8 2.6" stroke="#c9b8a0" strokeWidth=".6" /></g>}
  </g>;
}

export function CourtyardScene({ phase, stages, treeStage, title }: { phase: Phase; stages: Stages; treeStage: number; title: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tint = TINT[phase];
  const lit = phase === 'evening' || phase === 'night';
  return <svg className={`courtyard-scene courtyard-${phase}`} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} role="img" aria-label={title} focusable="false" preserveAspectRatio="xMidYMid slice">
    <title>{title}</title>
    <Sky phase={phase} id={id} />
    <Walls />
    <Garden stage={stages.plan} />
    <Keepsakes stage={stages.remember} />
    <Gym stage={stages.train} />
    <Tree stage={treeStage} />
    <Puzzles stage={stages.mind} />
    <Rest stage={stages.sleep} />
    <Books stage={stages.learn} />
    {tint && <rect width={SCENE_W} height={SCENE_H} fill={tint} />}
    {lit && <g>
      <Tree stage={treeStage} glowLayer /><Keepsakes stage={stages.remember} glowLayer /><Rest stage={stages.sleep} glowLayer /><Books stage={stages.learn} glowLayer />
    </g>}
  </svg>;
}
