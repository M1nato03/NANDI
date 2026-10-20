import type { ReactNode } from 'react';
import './cast.css';

export type Pose = 'idle' | 'cheer' | 'think' | 'rest';
export type CastName = 'Nandi' | 'Moti' | 'Chiku' | 'Kapi' | 'Mor' | 'Kachhua';
export const castNames: CastName[] = ['Nandi', 'Moti', 'Chiku', 'Kapi', 'Mor', 'Kachhua'];
export const poses: Pose[] = ['idle', 'cheer', 'think', 'rest'];
export type CastProps = { pose?: Pose; size?: number; title?: string };

const eye = (x: number, y: number, rest: boolean) => rest
  ? <path d={`M${x - 3} ${y}q3 3 6 0`} fill="none" stroke="var(--cast-line)" strokeWidth="1.7" strokeLinecap="round" />
  : <><ellipse cx={x} cy={y} rx="3.4" ry="4.4" fill="white" /><circle cx={x + 0.8} cy={y + 0.4} r="1.8" fill="var(--cast-line)" /></>;
const eyes = (pose: Pose, left = 39, right = 61, y = 52) => <>{eye(left, y, pose === 'rest')}{eye(right, y, pose === 'rest')}</>;
const mood = (pose: Pose) => pose === 'think'
  ? <><circle cx="74" cy="34" r="2" fill="var(--cast-detail)" /><circle cx="79" cy="27" r="3" fill="var(--cast-detail)" /></>
  : pose === 'cheer' ? <path d="M43 65q7 12 14 0" fill="none" stroke="var(--cast-line)" strokeWidth="1.7" strokeLinecap="round" />
    : <path d="M45 65q5 4 10 0" fill="none" stroke="var(--cast-line)" strokeWidth="1.7" strokeLinecap="round" />;

function Frame({ name, pose = 'idle', size = 48, title, children }: CastProps & { name: CastName; children: ReactNode }) {
  return <svg className={`cast-svg cast-${name.toLowerCase()} cast-pose-${pose}`} width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false" data-cast={name} data-pose={pose}>
    {title && <title>{title}</title>}{children}{mood(pose)}
  </svg>;
}
export function Nandi(props: CastProps) { const pose = props.pose ?? 'idle'; return <Frame name="Nandi" {...props}>
  <path d="M24 30Q10 12 13 39Q18 47 30 44M76 30Q90 12 87 39Q82 47 70 44" fill="var(--cast-detail)" />
  <path d="M27 29Q21 13 30 17L38 31M73 29Q79 13 70 17L62 31" fill="var(--cast-cream)" stroke="var(--cast-line)" strokeWidth="1.5" />
  <ellipse cx="50" cy="69" rx="29" ry="25" fill="var(--cast-detail)" /><path d="M28 78q22 13 44 0" fill="none" stroke="var(--cast-accent)" strokeWidth="7" strokeLinecap="round" />
  <ellipse cx="50" cy="48" rx="31" ry="29" fill="var(--cast-cream)" /><path d="M38 27q12-7 24 0" fill="none" stroke="var(--cast-detail)" strokeWidth="5" strokeLinecap="round" />
  {eyes(pose)}<ellipse cx="50" cy="67" rx="16" ry="10" fill="var(--cast-muzzle)" /><circle cx="44" cy="66" r="2" fill="var(--cast-line)" /><circle cx="56" cy="66" r="2" fill="var(--cast-line)" />
  </Frame>; }
export function Moti(props: CastProps) { const pose = props.pose ?? 'idle'; return <Frame name="Moti" {...props}>
  <ellipse cx="50" cy="76" rx="29" ry="21" fill="var(--cast-body)" /><ellipse cx="23" cy="47" rx="17" ry="24" fill="var(--cast-body)" /><ellipse cx="77" cy="47" rx="17" ry="24" fill="var(--cast-body)" />
  <ellipse cx="23" cy="48" rx="10" ry="15" fill="var(--cast-detail)" /><ellipse cx="77" cy="48" rx="10" ry="15" fill="var(--cast-detail)" />
  <ellipse cx="50" cy="49" rx="27" ry="28" fill="var(--cast-body)" />{eyes(pose)}<path d="M47 63q-3 12 2 18 8 6 12-2" fill="none" stroke="var(--cast-body)" strokeWidth="12" strokeLinecap="round" /><path d="M47 63q-3 12 2 18 8 6 12-2" fill="none" stroke="var(--cast-line)" strokeWidth="1.5" strokeLinecap="round" />
  </Frame>; }
export function Chiku(props: CastProps) { const pose = props.pose ?? 'idle'; return <Frame name="Chiku" {...props}>
  <path d="M70 77C100 78 101 31 77 24q14 28-9 30" fill="var(--cast-detail)" stroke="var(--cast-line)" strokeWidth="1.5" />
  <ellipse cx="49" cy="74" rx="23" ry="21" fill="var(--cast-body)" /><path d="M27 37L23 18 39 29M73 37l4-19-16 11" fill="var(--cast-body)" stroke="var(--cast-line)" strokeWidth="1.5" />
  <ellipse cx="50" cy="48" rx="27" ry="28" fill="var(--cast-body)" /><path d="M32 59q18 22 36 0" fill="var(--cast-cream)" />{eyes(pose)}<circle cx="50" cy="61" r="3" fill="var(--cast-line)" />
  </Frame>; }
export function Kapi(props: CastProps) { const pose = props.pose ?? 'idle'; return <Frame name="Kapi" {...props}>
  <path d="M69 76q29 8 18-17" fill="none" stroke="var(--cast-body)" strokeWidth="8" strokeLinecap="round" /><ellipse cx="50" cy="75" rx="27" ry="20" fill="var(--cast-body)" />
  <circle cx="21" cy="43" r="14" fill="var(--cast-body)" /><circle cx="79" cy="43" r="14" fill="var(--cast-body)" /><circle cx="21" cy="43" r="8" fill="var(--cast-detail)" /><circle cx="79" cy="43" r="8" fill="var(--cast-detail)" />
  <ellipse cx="50" cy="47" rx="29" ry="29" fill="var(--cast-body)" /><path d="M29 48q0-14 14-13 7 0 7 6 0-6 7-6 14-1 14 13v12q-20 20-42 0z" fill="var(--cast-cream)" />{eyes(pose)}<ellipse cx="50" cy="63" rx="4" ry="3" fill="var(--cast-detail)" />
  </Frame>; }
export function Mor(props: CastProps) { const pose = props.pose ?? 'idle'; return <Frame name="Mor" {...props}>
  {[20,35,50,65,80].map((x, i) => <ellipse key={x} cx={x} cy={47 - (i % 2) * 9} rx="12" ry="33" fill="var(--cast-detail)" stroke="var(--cast-body)" strokeWidth="1.5" transform={`rotate(${(i - 2) * 16} ${x} 60)`} />)}
  <ellipse cx="50" cy="76" rx="19" ry="22" fill="var(--cast-body)" /><path d="M45 31l-5-12m10 11V16m5 15 5-12" stroke="var(--cast-body)" strokeWidth="2" strokeLinecap="round" /><circle cx="40" cy="19" r="3" fill="var(--cast-accent)" /><circle cx="50" cy="16" r="3" fill="var(--cast-accent)" /><circle cx="60" cy="19" r="3" fill="var(--cast-accent)" />
  <ellipse cx="50" cy="50" rx="19" ry="24" fill="var(--cast-body)" />{eyes(pose, 42, 58, 48)}<path d="M50 58l-8 5 8 4 8-4z" fill="var(--cast-accent)" />
  </Frame>; }
export function Kachhua(props: CastProps) { const pose = props.pose ?? 'idle'; return <Frame name="Kachhua" {...props}>
  <ellipse cx="50" cy="74" rx="34" ry="19" fill="var(--cast-body)" /><circle cx="25" cy="80" r="8" fill="var(--cast-body)" /><circle cx="75" cy="80" r="8" fill="var(--cast-body)" />
  <path d="M19 65q2-37 31-37t31 37z" fill="var(--cast-detail)" stroke="var(--cast-line)" strokeWidth="1.5" /><path d="M50 29v35M27 46h46" fill="none" stroke="var(--cast-body)" strokeWidth="2" opacity=".65" />
  <ellipse cx="50" cy="68" rx="22" ry="17" fill="var(--cast-body)" />{eyes(pose, 42, 58, 65)}
  </Frame>; }
export const castComponents = { Nandi, Moti, Chiku, Kapi, Mor, Kachhua };
export function Cast({ name, ...props }: CastProps & { name: CastName }) { const Component = castComponents[name]; return <Component {...props} />; }
