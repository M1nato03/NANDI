import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import './cast.css';

export type Pose = 'idle' | 'cheer' | 'think' | 'rest';
export type CastName = 'Nandi' | 'Moti' | 'Chiku' | 'Kapi' | 'Mor' | 'Kachhua';
export const castNames: CastName[] = ['Nandi', 'Moti', 'Chiku', 'Kapi', 'Mor', 'Kachhua'];
export const poses: Pose[] = ['idle', 'cheer', 'think', 'rest'];
/**
 * Spec 31, living friends: one short moment on the existing drawing (whole body, eyes or front limb). `at` says when to
 * play it: a moment plays when `at` first becomes non-zero and again each time it changes, never on a plain re-render.
 * `breathe` adds the slow loop on a rest pose (after `settle` when both are set).
 */
export type FriendMoment = 'blink' | 'nod' | 'hop' | 'tilt' | 'wave' | 'settle';
export type CastProps = { pose?: Pose; size?: number; title?: string; moment?: FriendMoment; at?: number; breathe?: boolean };

/** The trigger's change count: hand it to <Cast at>. Starts at `initial` (1 plays the moment on mount). */
export function useFriendMoment(trigger: unknown, initial = 0): number {
  const [state, setState] = useState({ trigger, at: initial });
  if (!Object.is(state.trigger, trigger)) setState({ trigger, at: state.at + 1 });
  return Object.is(state.trigger, trigger) ? state.at : state.at + 1;
}

const seedOf = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; };
/** An idle friend blinks once every 8-14 s (seeded per friend on screen), only while it is visible. */
function useIdleBlink(node: RefObject<SVGSVGElement | null>, on: boolean, seed: string): number {
  const [blinks, setBlinks] = useState(0);
  useEffect(() => {
    const svg = node.current;
    if (!on || !svg || typeof IntersectionObserver === 'undefined') return;
    let timer: number | undefined, n = 0;
    const next = () => { n += 1; timer = window.setTimeout(() => { setBlinks(count => count + 1); next(); }, 8000 + seedOf(`${seed}:${n}`) % 6000); };
    const observer = new IntersectionObserver(([entry]) => { window.clearTimeout(timer); if (entry?.isIntersecting) next(); });
    observer.observe(svg);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [node, on, seed]);
  return blinks;
}

// Each friend keeps fixed colours in light and dark, drawn flat with one shade and one highlight (spec 11 §2).
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, '');

function Eye({ x, y, pose, ink, s = 1 }: { x: number; y: number; pose: Pose; ink: string; s?: number }) {
  if (pose === 'cheer') return <path d={`M${x - 3.4 * s} ${y + 0.9 * s}Q${x} ${y - 3.8 * s} ${x + 3.4 * s} ${y + 0.9 * s}`} fill="none" stroke={ink} strokeWidth={1.9 * s} strokeLinecap="round" />;
  if (pose === 'rest') return <g fill="none" stroke={ink} strokeWidth={1.6 * s} strokeLinecap="round">
    <path d={`M${x - 3.4 * s} ${y - 0.4 * s}Q${x} ${y + 3.2 * s} ${x + 3.4 * s} ${y - 0.4 * s}`} />
    <path d={`M${x - 2.2 * s} ${y + 1.9 * s}l-.9 1.4M${x + 2.2 * s} ${y + 1.9 * s}l.9 1.4`} strokeWidth={1.1 * s} />
  </g>;
  const lx = pose === 'think' ? 1.2 * s : 0.5 * s, ly = pose === 'think' ? -1.1 * s : 0.7 * s;
  return <g className="cast-eye">
    <ellipse cx={x} cy={y} rx={4 * s} ry={4.7 * s} fill="#fff" stroke={ink} strokeWidth={0.7 * s} strokeOpacity=".35" />
    <circle cx={x + lx} cy={y + ly} r={2.9 * s} fill={ink} />
    <circle cx={x + lx - 1 * s} cy={y + ly - 1.1 * s} r={1.15 * s} fill="#fff" />
    <circle cx={x + lx + 1.1 * s} cy={y + ly + 1.2 * s} r={0.5 * s} fill="#fff" />
  </g>;
}
const Eyes = ({ at, pose, ink, s }: { at: [number, number, number, number]; pose: Pose; ink: string; s?: number }) =>
  <><Eye x={at[0]} y={at[1]} pose={pose} ink={ink} s={s} /><Eye x={at[2]} y={at[3]} pose={pose} ink={ink} s={s} /></>;
const Blush = ({ at, r = 1 }: { at: [number, number, number, number]; r?: number }) =>
  <g fill="#f19a8f" opacity=".5"><ellipse cx={at[0]} cy={at[1]} rx={2.8 * r} ry={1.6 * r} /><ellipse cx={at[2]} cy={at[3]} rx={2.8 * r} ry={1.6 * r} /></g>;
const star = (x: number, y: number, s: number) => `M${x} ${y - s}Q${x + s * 0.22} ${y - s * 0.22} ${x + s} ${y}Q${x + s * 0.22} ${y + s * 0.22} ${x} ${y + s}Q${x - s * 0.22} ${y + s * 0.22} ${x - s} ${y}Q${x - s * 0.22} ${y - s * 0.22} ${x} ${y - s}Z`;

/** The small sign of each pose: sparkles for cheer, rising dots for think, z's for rest. */
function Mood({ pose, at }: { pose: Pose; at: [number, number] }) {
  const [x, y] = at;
  if (pose === 'cheer') return <g fill="#f5bf3f"><path d={star(x, y, 4.2)} /><path d={star(x + 9, y + 8, 2.6)} /><path d={star(x - 6, y + 11, 2)} /></g>;
  if (pose === 'think') return <g fill="#aab8d3"><circle cx={x - 4} cy={y + 9} r="1.5" /><circle cx={x} cy={y + 4} r="2.1" /><circle cx={x + 5} cy={y - 1.5} r="2.8" /></g>;
  if (pose === 'rest') return <g fill="none" stroke="#8a9bc0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={`M${x} ${y + 4}h4.4l-4.4 4.4h4.4`} /><path d={`M${x + 6.5} ${y - 3}h3.2l-3.2 3.2h3.2`} strokeWidth="1.2" />
  </g>;
  return null;
}

function Frame({ name, pose = 'idle', size = 48, title, moment, at = 0, breathe, children }: CastProps & { name: CastName; children: ReactNode }) {
  const svg = useRef<SVGSVGElement>(null);
  const uid = useId();
  const blinks = useIdleBlink(svg, pose === 'idle' && !(moment && at), `${name}${uid}`);
  // The latest of the caller's moment and the idle blink plays; the inner group's key restarts its animation once.
  const [shown, setShown] = useState<{ at: number; blinks: number; kind?: FriendMoment; key: string }>({ at: 0, blinks: 0, key: '' });
  let current = shown;
  if (at !== shown.at) current = { ...shown, at, kind: at && moment ? moment : undefined, key: `m${at}` };
  else if (blinks !== shown.blinks) current = { ...shown, blinks, kind: 'blink', key: `b${blinks}` };
  if (current !== shown) setShown(current);
  const loop = breathe && pose === 'rest';
  return <svg ref={svg} className={`cast-svg cast-${name.toLowerCase()} cast-pose-${pose}${current.kind ? ` cast-m-${current.kind}` : ''}${loop ? ' cast-breathe' : ''}`} width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false" data-cast={name} data-pose={pose} data-moment={current.kind ?? ''}>
    {title && <title>{title}</title>}<g className="cast-move" key={current.key}>{children}</g>
  </svg>;
}
/**
 * Spec 25 §4: each friend wears one small thing in its area colour, taken from its courtyard corner. The hues are fixed
 * in both themes, like the friends, and sit between the light and dark area tokens in areas.ts.
 */
export const ACCESSORY: Record<CastName, { thing: string; fill: string; line: string }> = {
  Nandi: { thing: 'green band', fill: '#3f9a52', line: '#24622f' },
  Moti: { thing: 'rose tassel', fill: '#d04870', line: '#8e2546' },
  Chiku: { thing: 'teal satchel', fill: '#1f9c8a', line: '#0f5f54' },
  Kapi: { thing: 'violet kite', fill: '#8a6ae0', line: '#523a9c' },
  Mor: { thing: 'marigold', fill: '#f2a516', line: '#b06a08' },
  Kachhua: { thing: 'indigo lantern', fill: '#4b57a8', line: '#2a326e' },
};
const Shadow = ({ cx = 50, rx = 30 }: { cx?: number; rx?: number }) => <ellipse cx={cx} cy="93.5" rx={rx} ry="3.8" fill="#000" opacity=".1" />;

/** Nandi: a friendly young bull resting, with a hump, a dark muzzle and an orange knitted scarf. */
const N = { line: '#5b4232', cream: '#fbf5ea', shade: '#e6d6c0', muzzle: '#9a8171', muzzleHi: '#b39d8c', dark: '#33241b', horn: '#f2e8d5', ear: '#f2b5a3', hoof: '#6f5546', patch: '#ead8c1', scarf: '#ef8a2b', scarfLine: '#c96a17', scarfStripe: '#fde3c2', hornTip: '#d9c7aa' };
export function Nandi(props: CastProps) {
  const pose = props.pose ?? 'idle'; const id = useUid();
  const head = pose === 'cheer' ? 'rotate(-6 38 60) translate(0 -1.5)' : pose === 'think' ? 'rotate(5 38 60)' : pose === 'rest' ? 'translate(1 3) rotate(4 38 60)' : undefined;
  const earL = pose === 'cheer' ? 'rotate(-14 24 34)' : pose === 'rest' ? 'rotate(12 24 34)' : undefined;
  const earR = pose === 'cheer' ? 'rotate(14 52 34)' : pose === 'rest' ? 'rotate(-12 52 34)' : undefined;
  const body = 'M34 82C33 70 40 62 50 60C51 49 61 44 69 50C72 52 73 56 72 59C85 61 95 67 95 79C95 88 88 92 77 92L44 92C37 92 34 88 34 82Z';
  return <Frame name="Nandi" {...props}>
    <defs><clipPath id={`${id}b`}><path d={body} /></clipPath></defs>
    <Shadow cx={62} rx={36} />
    <path d="M91 74C98 68 98 58 94.5 52" fill="none" stroke={N.line} strokeWidth="4.2" strokeLinecap="round" /><path d="M91 74C98 68 98 58 94.5 52" fill="none" stroke={N.cream} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M94.5 55.5C89 52.5 89.6 44.6 95 45C99.6 46.4 99.2 52.6 94.5 55.5Z" fill={N.muzzle} stroke={N.line} strokeWidth="1.1" />
    <path d={body} fill={N.cream} stroke={N.line} strokeWidth="1.6" />
    <g clipPath={`url(#${id}b)`}><ellipse cx="66" cy="96" rx="34" ry="9.5" fill={N.shade} /><path d="M78 69C88 71 91 81 87 92" fill="none" stroke={N.shade} strokeWidth="2.6" strokeLinecap="round" /><path d="M53 50C57 47 63 46.5 67 49" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".9" /></g>
    <path d="M73 63.5C79.5 61.5 86 65.5 85 72C84 77.5 77 78 73.5 74C71 71 70.5 66 73 63.5Z" fill={N.patch} />
    <ellipse cx="88.4" cy="90.6" rx="4" ry="2.2" fill={N.hoof} />
    <g className="cast-limb"><path d="M36 85.5C37 82.5 46 82.5 50 84.8L50 90.5C46 92.2 38.5 92.2 36 90Z" fill={N.cream} stroke={N.line} strokeWidth="1.4" /><ellipse cx="38" cy="89" rx="3.2" ry="2.6" fill={N.hoof} /></g>
    <path d="M50 86.5C52 83.6 60 83.6 63 86.4L62.4 91C58.4 92.6 52.4 92.6 50 91Z" fill={N.cream} stroke={N.line} strokeWidth="1.4" /><ellipse cx="60.6" cy="89.6" rx="3" ry="2.4" fill={N.hoof} />
    <path className="cast-accessory" d="M54.2 84.1L57.4 84.3L57.2 92.1L54 92.2Z" fill={ACCESSORY.Nandi.fill} stroke={ACCESSORY.Nandi.line} strokeWidth=".8" strokeLinejoin="round" />
    <g transform={head}>
      <g transform={earL}><path d="M24.5 32C17 31 9.5 33 6 38.2C10 41.5 18 40.6 25 37Z" fill={N.cream} stroke={N.line} strokeWidth="1.4" /><path d="M22.5 33.8C16.5 33.7 11.5 35.2 9 37.8C13 39.4 18 38.8 22.6 36.6Z" fill={N.ear} /></g>
      <g transform={earR}><path d="M51.5 32C59 31 66.5 33 70 38.2C66 41.5 58 40.6 51 37Z" fill={N.cream} stroke={N.line} strokeWidth="1.4" /><path d="M53.5 33.8C59.5 33.7 64.5 35.2 67 37.8C63 39.4 58 38.8 53.4 36.6Z" fill={N.ear} /></g>
      <path d="M25 24C19 22 14 18 13.5 11C13.4 8.6 15.8 8 16.6 10C18 14 23 16.5 33 17.5Z" fill={N.horn} stroke={N.line} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13.6 12.4C13.2 9.8 13.9 8.2 15.2 8.3C16 8.4 16.4 9.2 16.9 10.4C16 11.4 14.7 12.1 13.6 12.4Z" fill={N.hornTip} />
      <path d="M51 24C57 22 62 18 62.5 11C62.6 8.6 60.2 8 59.4 10C58 14 53 16.5 43 17.5Z" fill={N.horn} stroke={N.line} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M62.4 12.4C62.8 9.8 62.1 8.2 60.8 8.3C60 8.4 59.6 9.2 59.1 10.4C60 11.4 61.3 12.1 62.4 12.4Z" fill={N.hornTip} />
      <path d="M27 48C26 60 29 70 38 74C44 75 50 72 53 66C53 58 51 52 49 47Z" fill={N.cream} stroke={N.line} strokeWidth="1.5" />
      <path d="M29 62C28 70 31 78 37 81C40 79 41 74 40 70" fill={N.cream} stroke={N.line} strokeWidth="1.3" />
      <path d="M26.5 59.5C31 66 45.5 66.5 52.6 60.4L53.8 66.6C46 73 30.5 72.4 27 65.8Z" fill={N.scarf} stroke={N.scarfLine} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M29 63.4C34 67.6 45 68 51.8 63.6" fill="none" stroke={N.scarfStripe} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M41.6 67.6L48.6 67.2L50.6 80.6L43.2 81.6Z" fill={N.scarf} stroke={N.scarfLine} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M42.6 72.2L49.2 71.8M43.2 76.6L49.8 76.2" stroke={N.scarfStripe} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M44.4 81.6v2.6M46.6 81.3v2.6M48.8 81v2.6" stroke={N.scarfLine} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M23 30C23 19 53 19 53 30C53 38 51.5 44 50.5 48L25.5 48C24.5 44 23 38 23 30Z" fill={N.cream} stroke={N.line} strokeWidth="1.6" />
      <path d="M33.6 22.4C34.4 17.8 39.6 16.6 41.8 20.2C40 19.5 38.2 20.3 37.4 22.4Z" fill={N.cream} stroke={N.line} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M25.5 47.6C25.5 43 50.5 43 50.5 47.6C50.5 54.8 45.4 58.8 38 58.8C30.6 58.8 25.5 54.8 25.5 47.6Z" fill={N.muzzle} stroke={N.line} strokeWidth="1.5" />
      <ellipse cx="38" cy="45.8" rx="8.6" ry="1.4" fill={N.muzzleHi} />
      <path d="M30.8 49C31.6 47.4 34 47.6 33.9 49.6C33.8 50.9 31.8 51.1 30.8 49ZM45.2 49C44.4 47.4 42 47.6 42.1 49.6C42.2 50.9 44.2 51.1 45.2 49Z" fill={N.dark} />
      {pose === 'cheer' ? <><path d="M33 53.6Q38 61 43 53.6Z" fill={N.dark} /><ellipse cx="38" cy="57.1" rx="2.6" ry="1.4" fill="#e47b7b" /></>
        : <path d={pose === 'think' ? 'M35.5 55.6Q38.5 54.4 41.5 55.8' : pose === 'rest' ? 'M34.5 55Q38 56.6 41.5 55' : 'M33.5 54.4Q38 57.4 42.5 54.4'} fill="none" stroke={N.dark} strokeWidth="1.4" strokeLinecap="round" />}
      <Eyes at={[30.5, 34, 45.5, 34]} pose={pose} ink={N.dark} />
      {pose === 'think' && <path d="M42 27.4Q45.5 25.2 49 27.4" fill="none" stroke={N.line} strokeWidth="1.3" strokeLinecap="round" />}
      <Blush at={[26, 42, 50, 42]} />
    </g>
    <Mood pose={pose} at={pose === 'think' ? [74, 22] : pose === 'rest' ? [72, 20] : [72, 22]} />
  </Frame>;
}

/** Moti: a baby elephant wearing a small festival forehead plate. */
const M = { line: '#465472', body: '#a6b8d0', shade: '#8ea2bf', ear: '#f3b5c1', gold: '#f2c14e', goldLine: '#c58b1f', red: '#d2473c', nail: '#f6efe2', dark: '#2f3a55' };
export function Moti(props: CastProps) {
  const pose = props.pose ?? 'idle'; const id = useUid();
  const earL = pose === 'cheer' ? 'rotate(-10 30 40)' : pose === 'rest' ? 'rotate(6 30 40)' : undefined;
  const earR = pose === 'cheer' ? 'rotate(10 70 40)' : pose === 'rest' ? 'rotate(-6 70 40)' : undefined;
  const headT = pose === 'think' ? 'rotate(5 50 60)' : pose === 'rest' ? 'translate(0 2) rotate(-3 50 60)' : pose === 'cheer' ? 'translate(0 -1.5)' : undefined;
  const headD = 'M26 41C26 27 34 19.5 44 20C47 20.3 49 21.8 50 23C51 21.8 53 20.3 56 20C66 19.5 74 27 74 41C74 53 65 61 50 61C35 61 26 53 26 41Z';
  const body = 'M50 56C63 56 72 66 72 78C72 87 64 91 50 91C36 91 28 87 28 78C28 66 37 56 50 56Z';
  const trunk = pose === 'cheer'
    ? 'M45.5 48C44.5 56 46.5 62 52 63.5C56.5 64.5 60.5 61 60 57.5C59.6 55 56.4 55.2 56.6 57.4C53.4 57.6 52.6 53 55 48Z'
    : 'M45.5 48C44.5 58 46 67 52 71.5C56 74 60.5 71.4 59.6 67.4C58.8 64.3 55.4 64.6 55.2 67C51.6 63.8 52.4 56 55 48Z';
  return <Frame name="Moti" {...props}>
    <defs><clipPath id={`${id}b`}><path d={body} /></clipPath><clipPath id={`${id}h`}><path d={headD} /></clipPath></defs>
    <Shadow rx={28} />
    <path d="M70 83C76 81.5 78.5 77 77 72.5" fill="none" stroke={M.line} strokeWidth="2.6" strokeLinecap="round" /><circle cx="77" cy="71.6" r="1.8" fill={M.line} />
    <path d={body} fill={M.body} stroke={M.line} strokeWidth="1.5" /><g clipPath={`url(#${id}b)`}><ellipse cx="50" cy="95" rx="26" ry="8" fill={M.shade} /></g>
    <ellipse cx="39" cy="88" rx="8.6" ry="5.6" fill={M.body} stroke={M.line} strokeWidth="1.4" /><ellipse cx="61" cy="88" rx="8.6" ry="5.6" fill={M.body} stroke={M.line} strokeWidth="1.4" />
    <g fill={M.nail}>{[34.4, 39, 43.6, 56.4, 61, 65.6].map((x, i) => <ellipse key={x} cx={x} cy={i % 3 === 1 ? 91.5 : 90.7} rx="1.8" ry="1.2" />)}</g>
    <g transform={headT}>
      <g transform={earL}><path d="M31 30C19 21 6 27 6 41C6 54 16 61 29 55Z" fill={M.body} stroke={M.line} strokeWidth="1.5" /><path d="M28 33.5C20 28.5 11.5 32 11.5 41.5C11.5 50 18 55 26.5 51.5Z" fill={M.ear} /></g>
      <g transform={earR}><path d="M69 30C81 21 94 27 94 41C94 54 84 61 71 55Z" fill={M.body} stroke={M.line} strokeWidth="1.5" /><path d="M72 33.5C80 28.5 88.5 32 88.5 41.5C88.5 50 82 55 73.5 51.5Z" fill={M.ear} />
        <g className="cast-accessory"><path d="M82 57.4V60" stroke={ACCESSORY.Moti.line} strokeWidth="1" /><circle cx="82" cy="60.6" r="1.7" fill={ACCESSORY.Moti.fill} stroke={ACCESSORY.Moti.line} strokeWidth=".7" /><path d="M80.2 62L83.8 62L85 68.4L79 68.4Z" fill={ACCESSORY.Moti.fill} stroke={ACCESSORY.Moti.line} strokeWidth=".8" strokeLinejoin="round" /><path d="M80.8 66.4v2M82 66.4v2M83.2 66.4v2" stroke={ACCESSORY.Moti.line} strokeWidth=".6" /></g></g>
      <path d={headD} fill={M.body} stroke={M.line} strokeWidth="1.6" />
      <g clipPath={`url(#${id}h)`}><ellipse cx="50" cy="65" rx="26" ry="8.5" fill={M.shade} /><path d="M33 29C36 25 40 23.6 44 23.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" /></g>
      <path d="M50 22.2C54.5 22.2 57.6 24.4 57.6 27.4C57.6 31 54 34.2 50 37.4C46 34.2 42.4 31 42.4 27.4C42.4 24.4 45.5 22.2 50 22.2Z" fill={M.gold} stroke={M.goldLine} strokeWidth=".9" />
      <path d="M50 24.4C53 24.4 55.2 25.8 55.2 27.8C55.2 30.2 52.6 32.4 50 34.6C47.4 32.4 44.8 30.2 44.8 27.8C44.8 25.8 47 24.4 50 24.4Z" fill="#f8db86" />
      <ellipse cx="50" cy="28.6" rx="1.9" ry="2.3" fill={M.red} /><circle cx="49.4" cy="27.8" r=".6" fill="#fff" opacity=".8" />
      <g fill={M.goldLine}>{[[44.8, 32.6], [47.2, 35.2], [52.8, 35.2], [55.2, 32.6]].map(([x, y]) => <circle key={x} cx={x} cy={y} r=".7" />)}</g><circle cx="50" cy="39" r="1.1" fill={M.gold} stroke={M.goldLine} strokeWidth=".5" />
      <Eyes at={[40, 42, 60, 42]} pose={pose} ink={M.dark} />
      {pose === 'think' && <path d="M56 35.6Q59.6 33.4 63.4 35.6" fill="none" stroke={M.line} strokeWidth="1.3" strokeLinecap="round" />}
      <Blush at={[34.5, 50, 65.5, 50]} />
      {pose === 'cheer' ? <path d="M39 51.2Q42.4 57.6 46 52.4Z" fill={M.dark} /> : <path d={pose === 'think' ? 'M41 53.2Q43.4 52.6 45.6 53.6' : 'M40.4 51.8Q43 54.8 45.8 52.8'} fill="none" stroke={M.dark} strokeWidth="1.3" strokeLinecap="round" />}
      <g className="cast-limb"><path d={trunk} fill={M.body} stroke={M.line} strokeWidth="1.5" strokeLinejoin="round" />
        <g fill="none" stroke={M.shade} strokeWidth="1.1" strokeLinecap="round"><path d="M46 53.4q4.2 1.2 8.4-.2" /><path d="M46.2 57.6q3.8 1.2 7.4-.4" />{pose !== 'cheer' && <path d="M47 62q3 1.1 5.6-.6" />}</g></g>
    </g>
    <Mood pose={pose} at={pose === 'cheer' ? [80, 10] : [76, 12]} />
  </Frame>;
}

/** Chiku: an Indian palm squirrel with three pale stripes, holding a nut. */
const C = { line: '#4b3527', fur: '#a9876c', dark: '#7a5d48', cream: '#f5e9d6', ear: '#efb09d', nut: '#b06a32', cap: '#6d4424' };
export function Chiku(props: CastProps) {
  const pose = props.pose ?? 'idle';
  const headT = pose === 'cheer' ? 'rotate(-5 50 56) translate(0 -1)' : pose === 'think' ? 'rotate(6 50 56)' : pose === 'rest' ? 'translate(0 2) rotate(-4 50 56)' : undefined;
  const nutY = pose === 'cheer' ? -4 : 0;
  return <Frame name="Chiku" {...props}>
    <Shadow rx={26} />
    <path d="M56 86C80 90 94 70 87 48C83 35 72 28 64 33C61 35 61.5 39 65 40C73 42 78 52 74 62C70 72 62 76 54 77Z" fill={C.fur} stroke={C.line} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M60 82C76 82 86 68 82 52C80 44 74 39.4 69.4 38.8C74.4 44.4 77.4 54 73.4 64C70.4 72 64.4 76 58 77Z" fill={C.cream} opacity=".55" />
    <path d="M35 87C31 73 35 59 47 57C59 56 64 68 62 87Z" fill={C.fur} stroke={C.line} strokeWidth="1.5" />
    <path d="M41 85C39 75 42 65 48.5 64C55 64 57.5 73 56.5 85Z" fill={C.cream} />
    <path d="M59.4 61C61.8 68 62.2 77 60.8 85" fill="none" stroke={C.cream} strokeWidth="1.7" strokeLinecap="round" />
    <ellipse cx="41" cy="88.6" rx="5.2" ry="2.6" fill={C.dark} /><ellipse cx="55.6" cy="88.6" rx="5.2" ry="2.6" fill={C.dark} />
    <g className="cast-accessory"><path d="M58.6 60.4L38 78" stroke={ACCESSORY.Chiku.line} strokeWidth="3.2" strokeLinecap="round" /><path d="M58.6 60.4L38 78" stroke={ACCESSORY.Chiku.fill} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="29.4" y="75.4" width="12.4" height="10" rx="2.2" fill={ACCESSORY.Chiku.fill} stroke={ACCESSORY.Chiku.line} strokeWidth=".9" /><path d="M29.6 78.6C33 80.4 38.4 80.4 41.6 78.6V77.4C41.6 76.2 40.6 75.4 39.4 75.4H31.8C30.6 75.4 29.6 76.2 29.6 77.4Z" fill={ACCESSORY.Chiku.line} opacity=".55" /></g>
    <g className="cast-limb" transform={`translate(0 ${nutY})`}>
      <ellipse cx="48.5" cy="67" rx="4.2" ry="5" fill={C.nut} stroke={C.line} strokeWidth="1" /><path d="M44.4 64.2C44.8 60.6 52.2 60.6 52.6 64.2C50 65.4 47 65.4 44.4 64.2Z" fill={C.cap} /><path d="M48.5 60.9l1 -2" stroke={C.cap} strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="44" cy="68" rx="2.6" ry="3.2" fill={C.fur} stroke={C.line} strokeWidth=".9" /><ellipse cx="53" cy="68" rx="2.6" ry="3.2" fill={C.fur} stroke={C.line} strokeWidth=".9" />
    </g>
    <g transform={headT}>
      <path d="M35 30C31 22 33 15.5 38.5 16.5C41.5 17.5 41.5 23 40 27.5Z" fill={C.fur} stroke={C.line} strokeWidth="1.3" /><path d="M36.6 27.4C34.6 22.6 35.6 19 38.4 19.4C39.8 20 39.8 23 39 26Z" fill={C.ear} />
      <path d="M66 30C70 22 68 15.5 62.5 16.5C59.5 17.5 59.5 23 61 27.5Z" fill={C.fur} stroke={C.line} strokeWidth="1.3" /><path d="M64.4 27.4C66.4 22.6 65.4 19 62.6 19.4C61.2 20 61.2 23 62 26Z" fill={C.ear} />
      <path d="M30 39C30 27 39 20.5 50.5 20.5C62 20.5 71 27 71 39C71 49.5 62 55.5 50.5 55.5C39 55.5 30 49.5 30 39Z" fill={C.fur} stroke={C.line} strokeWidth="1.6" />
      <g fill="none" stroke={C.cream} strokeWidth="1.8" strokeLinecap="round"><path d="M45 22.4Q46.4 27 46 31" /><path d="M50.5 21.4V30" /><path d="M56 22.4Q54.6 27 55 31" /></g>
      <path d="M38 46C38 40 63 40 63 46C63 52 57 55.4 50.5 55.4C44 55.4 38 52 38 46Z" fill={C.cream} />
      <path d="M48.4 43.3C48.4 41.8 52.6 41.8 52.6 43.3C52.6 44.6 51.2 45.6 50.5 45.6C49.8 45.6 48.4 44.6 48.4 43.3Z" fill={C.line} />
      {pose === 'cheer' ? <><path d="M46.5 47.6Q50.5 53.6 54.5 47.6Z" fill={C.line} /><rect x="49.1" y="47.7" width="2.8" height="2.1" rx=".4" fill="#fff" /></>
        : pose === 'think' ? <circle cx="51.6" cy="49.2" r="1.2" fill={C.line} />
          : <path d={pose === 'rest' ? 'M48 48.6Q50.5 49.8 53 48.6' : 'M47 48Q48.8 49.8 50.5 48Q52.2 49.8 54 48'} fill="none" stroke={C.line} strokeWidth="1.2" strokeLinecap="round" />}
      <g stroke={C.line} strokeWidth=".8" strokeLinecap="round" opacity=".55"><path d="M38.5 45.5l-5-1.2M38.5 47.5l-5 .6M62.5 45.5l5-1.2M62.5 47.5l5 .6" /></g>
      <Eyes at={[41, 37.5, 60, 37.5]} pose={pose} ink={C.line} s={0.95} />
      {pose === 'think' && <path d="M56.4 31.4Q60 29.4 63.6 31.6" fill="none" stroke={C.line} strokeWidth="1.2" strokeLinecap="round" />}
      <Blush at={[36, 45.6, 65, 45.6]} r={0.9} />
    </g>
    <Mood pose={pose} at={pose === 'cheer' ? [22, 14] : [72, 12]} />
  </Frame>;
}

/** Kapi: a bonnet macaque with a parted cap of hair and a long curling tail. */
const K = { line: '#47301f', fur: '#9a6a48', dark: '#6a4630', face: '#f1c6a4', faceHi: '#f8dcc6', ear: '#e9a585' };
export function Kapi(props: CastProps) {
  const pose = props.pose ?? 'idle';
  const headT = pose === 'think' ? 'rotate(6 50 62)' : pose === 'rest' ? 'translate(0 2) rotate(-4 50 62)' : pose === 'cheer' ? 'rotate(-4 50 62) translate(0 -1)' : undefined;
  const arm: { d: string; hand: [number, number] } = pose === 'cheer' ? { d: 'M64.5 66C71 62 74.5 54 72.5 46.5', hand: [72.4, 45.4] } : pose === 'think' ? { d: 'M64.5 66C69.5 63 67 58 60 58', hand: [58.6, 58.2] } : { d: 'M64.5 66C70 72 69.5 80 64.5 84', hand: [64, 84.8] };
  return <Frame name="Kapi" {...props}>
    <Shadow rx={26} />
    <path d="M66 85C84 90 93 77 89 65C86 57 78 57 77.6 63.4C77.4 67.4 81.4 68.6 82.6 65.6" fill="none" stroke={K.line} strokeWidth="5.6" strokeLinecap="round" />
    <path d="M66 85C84 90 93 77 89 65C86 57 78 57 77.6 63.4C77.4 67.4 81.4 68.6 82.6 65.6" fill="none" stroke={K.fur} strokeWidth="3.8" strokeLinecap="round" />
    <path d="M33 66C33 59 67 59 67 66L68.5 84C68.5 92 31.5 92 31.5 84Z" fill={K.fur} stroke={K.line} strokeWidth="1.5" />
    <path d="M40 70C40 66 60 66 60 70L61 84C61 89 39 89 39 84Z" fill={K.faceHi} />
    <ellipse cx="38" cy="86" rx="7.6" ry="5" fill={K.fur} stroke={K.line} strokeWidth="1.3" /><ellipse cx="62" cy="86" rx="7.6" ry="5" fill={K.fur} stroke={K.line} strokeWidth="1.3" />
    <ellipse cx="34" cy="90.6" rx="4" ry="2" fill={K.face} stroke={K.line} strokeWidth=".8" /><ellipse cx="66" cy="90.6" rx="4" ry="2" fill={K.face} stroke={K.line} strokeWidth=".8" />
    <path d="M35.5 66C30 72 30.5 80 35.5 84" fill="none" stroke={K.line} strokeWidth="6.6" strokeLinecap="round" /><path d="M35.5 66C30 72 30.5 80 35.5 84" fill="none" stroke={K.fur} strokeWidth="4.8" strokeLinecap="round" />
    <circle cx="36" cy="84.8" r="2.7" fill={K.face} stroke={K.line} strokeWidth=".9" />
    <g transform={headT}>
      <circle cx="24.5" cy="42" r="7.5" fill={K.fur} stroke={K.line} strokeWidth="1.3" /><circle cx="24.5" cy="42" r="4.3" fill={K.ear} />
      <circle cx="75.5" cy="42" r="7.5" fill={K.fur} stroke={K.line} strokeWidth="1.3" /><circle cx="75.5" cy="42" r="4.3" fill={K.ear} />
      <path d="M27 41C27 25 38 17 50 17C62 17 73 25 73 41C73 55 63 63 50 63C37 63 27 55 27 41Z" fill={K.fur} stroke={K.line} strokeWidth="1.6" />
      <path d="M29.5 33C31 21 42 15.5 50 19C58 15.5 69 21 70.5 33C64.5 27.5 56.5 25.5 50 27.5C43.5 25.5 35.5 27.5 29.5 33Z" fill={K.dark} />
      <path d="M33.5 43C33.5 33.5 45.5 31 50 37C54.5 31 66.5 33.5 66.5 43C66.5 54.5 58.5 61 50 61C41.5 61 33.5 54.5 33.5 43Z" fill={K.face} />
      <ellipse cx="50" cy="52.4" rx="9" ry="6.4" fill={K.faceHi} />
      <circle cx="48.1" cy="49.4" r=".95" fill={K.line} /><circle cx="51.9" cy="49.4" r=".95" fill={K.line} />
      {pose === 'cheer' ? <><path d="M44.5 53.6Q50 61 55.5 53.6Z" fill={K.line} /><ellipse cx="50" cy="57" rx="2.6" ry="1.3" fill="#e47b7b" /></>
        : <path d={pose === 'think' ? 'M46.5 55.6Q50 54.2 53.5 55.8' : pose === 'rest' ? 'M46 55Q50 56.6 54 55' : 'M45 54.4Q50 57.6 55 54.4'} fill="none" stroke={K.line} strokeWidth="1.3" strokeLinecap="round" />}
      <Eyes at={[42.8, 42.6, 57.2, 42.6]} pose={pose} ink={K.line} s={0.95} />
      <path d={pose === 'think' ? 'M37.6 37.4Q42.4 35.2 47 37.2M53 35.6Q57.6 32.6 62.4 35.2' : 'M37.6 37.4Q42.4 35.2 47 37.2M53 37.2Q57.6 35.2 62.4 37.4'} fill="none" stroke={K.dark} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
      <Blush at={[37.6, 50.4, 62.4, 50.4]} r={0.9} />
    </g>
    <g className="cast-accessory"><path d={`M89 40Q${(89 + arm.hand[0]) / 2 + 4} ${(40 + arm.hand[1]) / 2} ${arm.hand[0]} ${arm.hand[1]}`} fill="none" stroke={ACCESSORY.Kapi.line} strokeWidth=".7" />
      <path d="M89 21L95.4 29.6L89 40L82.6 29.6Z" fill={ACCESSORY.Kapi.fill} stroke={ACCESSORY.Kapi.line} strokeWidth=".9" strokeLinejoin="round" /><path d="M89 21V40M82.6 29.6H95.4" stroke="#fff" strokeWidth=".7" opacity=".6" />
      <path d="M89 40q-2 3 0 5q2 2 0 5" fill="none" stroke={ACCESSORY.Kapi.line} strokeWidth=".7" /><path d="M87.4 44.6l3.2 -.6M87.4 49.4l3.2 -.6" stroke={ACCESSORY.Kapi.fill} strokeWidth="1.4" strokeLinecap="round" /></g>
    <g className="cast-limb"><path d={arm.d} fill="none" stroke={K.line} strokeWidth="6.6" strokeLinecap="round" /><path d={arm.d} fill="none" stroke={K.fur} strokeWidth="4.8" strokeLinecap="round" />
      <circle cx={arm.hand[0]} cy={arm.hand[1]} r="2.8" fill={K.face} stroke={K.line} strokeWidth=".9" /></g>
    <Mood pose={pose} at={pose === 'cheer' ? [16, 14] : [78, 12]} />
  </Frame>;
}

/** Mor: a peacock with a fanned train of eye-spot feathers and a small crest. */
const P = { line: '#173a6b', blue: '#1e5fb4', blueHi: '#4a90dc', beak: '#efb441', beakLine: '#b9831c', green: '#2f8f62', greenDark: '#1f6b47', gold: '#d9ab3e', teal: '#2a9a95', navy: '#1c3a86', wing: '#c69d6c', wingBar: '#8d6a43', feet: '#9b968c' };
export function Mor(props: CastProps) {
  const pose = props.pose ?? 'idle';
  const fan = pose === 'rest' ? { spread: 46, length: 30, n: 7 } : pose === 'think' ? { spread: 66, length: 40, n: 9 } : { spread: 80, length: pose === 'cheer' ? 46 : 44, n: 9 };
  const headT = pose === 'think' ? 'rotate(8 50 52)' : pose === 'rest' ? 'translate(0 2) rotate(-6 50 52)' : pose === 'cheer' ? 'translate(0 -1.5)' : undefined;
  const L = fan.length;
  const feather = `M0 0C-7 ${-L * 0.35} -7.5 ${-L * 0.8} 0 ${-L}C7.5 ${-L * 0.8} 7 ${-L * 0.35} 0 0Z`;
  return <Frame name="Mor" {...props}>
    <Shadow rx={20} />
    {Array.from({ length: fan.n }, (_, i) => -fan.spread + (2 * fan.spread * i) / (fan.n - 1)).map(angle => <g key={angle} transform={`translate(50 76) rotate(${angle})`}>
      <path d={feather} fill={P.green} stroke={P.greenDark} strokeWidth=".8" />
      <path d={`M0 -2V${-L + 9}`} stroke={P.greenDark} strokeWidth=".6" opacity=".7" />
      <ellipse cy={-L + 7} rx="5" ry="6" fill={P.gold} /><ellipse cy={-L + 7.4} rx="3.6" ry="4.3" fill={P.teal} /><ellipse cy={-L + 7.8} rx="2.1" ry="2.6" fill={P.navy} />
    </g>)}
    <path d="M42 66C35.5 70 34.5 82 40 89C42 86 43 78 44 70Z" fill={P.wing} stroke={P.wingBar} strokeWidth=".8" /><path className="cast-limb" d="M58 66C64.5 70 65.5 82 60 89C58 86 57 78 56 70Z" fill={P.wing} stroke={P.wingBar} strokeWidth=".8" />
    <g stroke={P.wingBar} strokeWidth=".8"><path d="M38 74l4 1M37.6 79l4.4 .8M38.4 84l3.6.4M62 74l-4 1M62.4 79l-4.4.8M61.6 84l-3.6.4" /></g>
    <path d="M45 90l-2 4M45 90l1 4M55 90l2 4M55 90l-1 4" stroke={P.feet} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M40.5 89.5C34.5 80 37.5 66 44 58C46.5 54.6 53.5 54.6 56 58C62.5 66 65.5 80 59.5 89.5Z" fill={P.blue} stroke={P.line} strokeWidth="1.3" />
    <path d="M46.6 61C45.2 68 45 76 46.6 84" fill="none" stroke={P.blueHi} strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
    <g transform={headT}>
      <g stroke={P.line} strokeWidth="1" strokeLinecap="round">{[[42.5, 17.5], [46.2, 15], [50, 14], [53.8, 15], [57.5, 17.5]].map(([x, y]) => <path key={x} d={`M50 30L${x} ${y}`} />)}</g>
      {[[42.5, 17.5], [46.2, 15], [50, 14], [53.8, 15], [57.5, 17.5]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="2" fill={P.teal} /><circle cx={x} cy={y} r="1" fill={P.navy} /></g>)}
      <circle cx="50" cy="42" r="12.6" fill={P.blue} stroke={P.line} strokeWidth="1.3" />
      <path d="M41.4 35.4C43.6 32.8 47.6 31.8 50.6 32.2" fill="none" stroke={P.blueHi} strokeWidth="1.8" strokeLinecap="round" opacity=".8" />
      <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"><path d="M40.2 47.2Q44.2 49.6 48 47" /><path d="M59.8 47.2Q55.8 49.6 52 47" /></g>
      <g className="cast-accessory">{Array.from({ length: 8 }, (_, k) => { const a = (Math.PI / 4) * k; return <circle key={k} cx={(61.4 + 2.7 * Math.cos(a)).toFixed(2)} cy={(31.4 + 2.7 * Math.sin(a)).toFixed(2)} r="1.9" fill={ACCESSORY.Mor.fill} stroke={ACCESSORY.Mor.line} strokeWidth=".5" />; })}<circle cx="61.4" cy="31.4" r="1.6" fill={ACCESSORY.Mor.line} /></g>
      <Eyes at={[44.6, 41.6, 55.4, 41.6]} pose={pose} ink={P.line} s={0.92} />
      {pose === 'cheer' ? <><path d="M47.3 46.8L52.7 46.8L50 50.2Z" fill={P.beak} stroke={P.beakLine} strokeWidth=".8" strokeLinejoin="round" /><path d="M48.2 51L51.8 51L50 53.6Z" fill={P.beak} stroke={P.beakLine} strokeWidth=".8" strokeLinejoin="round" /></>
        : <path d="M47.6 47.2L52.4 47.2L50 52.2Z" fill={P.beak} stroke={P.beakLine} strokeWidth=".8" strokeLinejoin="round" />}
      <Blush at={[41.4, 50.4, 58.6, 50.4]} r={0.75} />
    </g>
    <Mood pose={pose} at={pose === 'rest' ? [62, 22] : pose === 'think' ? [66, 18] : [80, 6]} />
  </Frame>;
}

/** Kachhua: an Indian star tortoise, with pale star rays on each shell plate. */
const T = { line: '#3e2b1e', shell: '#4a3324', scute: '#5f4331', star: '#f1c75b', rim: '#6e4e35', skin: '#c9a96e', skinShade: '#ab8a52' };
export function Kachhua(props: CastProps) {
  const pose = props.pose ?? 'idle'; const id = useUid();
  const shell = 'M24 77C24 49 40 36 58.5 36C78 36 93 50 93 77Z';
  const headT = pose === 'rest' ? 'translate(7 4)' : pose === 'cheer' ? 'rotate(-6 26 66) translate(-1 -2)' : pose === 'think' ? 'rotate(5 26 66)' : undefined;
  const scutes: [number, number][] = [[45, 47], [70.5, 47], [32.5, 64], [57.5, 63], [82.5, 64]];
  const hex = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k + Math.PI / 6; return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * 0.86 * Math.sin(a)).toFixed(1)}`; }).join(' ');
  return <Frame name="Kachhua" {...props}>
    <defs><clipPath id={`${id}s`}><path d={shell} /></clipPath></defs>
    <Shadow cx={56} rx={36} />
    <path d="M76 77C76 87 81 91 86 90C90.5 89 91 83 88 77Z" fill={T.skin} stroke={T.line} strokeWidth="1.3" />
    <path d="M91.5 76l6 2.2-6 1.4z" fill={T.skin} stroke={T.line} strokeWidth="1" strokeLinejoin="round" />
    <path d={shell} fill={T.shell} stroke={T.line} strokeWidth="1.5" />
    <g clipPath={`url(#${id}s)`}>
      {scutes.map(([x, y]) => <g key={`${x}${y}`}>
        <polygon points={hex(x, y, 10.6)} fill={T.scute} stroke={T.line} strokeWidth=".9" strokeLinejoin="round" />
        <g stroke={T.star} strokeWidth="1.5" strokeLinecap="round">{Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k; return <path key={k} d={`M${x} ${y}L${(x + 6.4 * Math.cos(a)).toFixed(1)} ${(y + 5.6 * Math.sin(a)).toFixed(1)}`} />; })}</g>
        <circle cx={x} cy={y} r="2.3" fill={T.star} />
      </g>)}
      <path d="M38 44C44 39.6 51 38 58 38" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".25" />
    </g>
    <g className="cast-accessory"><path d="M60.4 25.4Q64 20.6 67.6 25.4" fill="none" stroke={ACCESSORY.Kachhua.line} strokeWidth="1" />
      <rect x="59.4" y="25" width="9.2" height="2.2" rx=".8" fill={ACCESSORY.Kachhua.line} /><rect x="59.8" y="27" width="8.4" height="8.6" rx="2" fill={ACCESSORY.Kachhua.fill} stroke={ACCESSORY.Kachhua.line} strokeWidth=".8" />
      <rect x="61.8" y="28.6" width="4.4" height="5.4" rx="1.2" fill={pose === 'rest' ? '#e9c96a' : '#f7d774'} /><rect x="59.4" y="35.4" width="9.2" height="1.8" rx=".7" fill={ACCESSORY.Kachhua.line} /></g>
    <path d="M21.5 77C21.5 74 95.5 74 95.5 77C95.5 81 21.5 81 21.5 77Z" fill={T.rim} stroke={T.line} strokeWidth="1.2" />
    <g stroke={T.line} strokeWidth=".8">{[30, 38, 46, 54, 62, 70, 78, 86].map(x => <path key={x} d={`M${x} 75.4V80.2`} />)}</g>
    <g fill={T.star}>{[34, 50, 66, 82].map(x => <circle key={x} cx={x} cy="77.8" r=".9" />)}</g>
    <path className="cast-limb" d="M27 77C24.5 86 28 91.5 34 91.5C38.5 91 39.5 85 37.5 77Z" fill={T.skin} stroke={T.line} strokeWidth="1.3" />
    <g fill={T.skinShade}><circle cx="31" cy="84" r="1.1" /><circle cx="34.6" cy="87.4" r=".9" /><circle cx="82" cy="83.4" r="1.1" /><circle cx="85.6" cy="86.6" r=".9" /></g>
    <g transform={headT}>
      <path d="M31 72C26 63 22 60.5 17.5 60.5L20 73C24 74 28 74 31 72Z" fill={T.skin} stroke={T.line} strokeWidth="1.2" />
      <path d="M24.5 66C13 67 6.5 61 8 54.5C9.5 47.5 18.5 46 25 50.5C30 54 30.5 63.5 24.5 66Z" fill={T.skin} stroke={T.line} strokeWidth="1.5" />
      <circle cx="9.8" cy="56.4" r=".7" fill={T.line} />
      <Eyes at={[14.6, 55, 22.6, 54.4]} pose={pose} ink={T.line} s={0.85} />
      {pose === 'cheer' ? <path d="M10 60.4Q14 66 18.6 60.8Z" fill={T.line} />
        : <path d={pose === 'think' ? 'M12 62.4Q14.5 61.4 17 62.6' : pose === 'rest' ? 'M11 61.6Q14 62.8 17 61.8' : 'M10.5 61.2Q14 63.8 18 61.6'} fill="none" stroke={T.line} strokeWidth="1.3" strokeLinecap="round" />}
      <Blush at={[11.6, 59.6, 25, 59]} r={0.75} />
    </g>
    <Mood pose={pose} at={pose === 'rest' ? [28, 30] : pose === 'cheer' ? [12, 30] : [30, 32]} />
  </Frame>;
}

export const castComponents = { Nandi, Moti, Chiku, Kapi, Mor, Kachhua };
export function Cast({ name, ...props }: CastProps & { name: CastName }) { const Component = castComponents[name]; return <Component {...props} />; }
