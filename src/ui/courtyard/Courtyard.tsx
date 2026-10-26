import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time/dayKey';
import { RULES } from '../../core/rules.config';
import { effectiveShutdown } from '../../core/tasks/planner';
import { adaptiveNight, shiftClock } from '../../core/adaptive/day';
import { AREAS, COURTYARD_KINDS, courtyardLine, courtyardNightFrom, deriveCourtyard, phaseAt, poseFor, TREE_OBJECTS, type AreaId, type AreaState, type CourtyardState, type Phase } from '../../core/courtyard/courtyard';
import { Cast } from '../cast/Cast';
import { go } from '../shell/router';
import { CourtyardScene, SCENE_H, SCENE_W, type Stages } from './Scene';
import './courtyard.css';

/** Where each friend stands, in scene units: centre x, feet y, size. Kachhua moves onto the cot once there is one. */
const SPOTS: Record<AreaId, (stage: number) => [number, number, number]> = {
  train: () => [184, 199, 64], plan: () => [46, 140, 50], remember: () => [314, 146, 52],
  mind: () => [250, 80, 40], learn: () => [298, 197, 46], sleep: stage => stage >= 3 ? [54, 170, 46] : [54, 192, 46],
};
const PHASE_WORD: Record<Phase, string> = { morning: 'Morning', day: 'Daytime', evening: 'Evening', night: 'Night' };

export function useCourtyard() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  const source = useLiveQuery(async () => ({
    facts: await db.ledger.where('kind').anyOf(COURTYARD_KINDS).toArray(),
    settings: await db.settings.filter(row => row.deleted === 0).toArray(),
    tasks: await db.tasks.filter(row => row.deleted === 0).toArray(),
  }), []);
  if (!source) return null;
  const today = dayKey(now);
  const read = (key: string, fallback: string) => { const value = source.settings.find(row => row.key === key)?.value; return typeof value === 'string' ? value : fallback; };
  const night = adaptiveNight(source.settings, source.tasks, today);
  const shutdown = shiftClock(effectiveShutdown(read('planner.shutdown', RULES.night.defaultShutdown), read('planner.bedtime', RULES.night.defaultBedtime)), night.shift);
  const state = deriveCourtyard(source.facts, today, undefined, courtyardNightFrom(source.settings));
  return { state, phase: phaseAt(now, shutdown, night.bedtime), facts: source.facts, today, nightFrom: courtyardNightFrom(source.settings) };
}

export const stagesOf = (state: CourtyardState): Stages => Object.fromEntries(state.areas.map(area => [area.id, area.stage])) as Stages;

const NOD_KEY = 'nandi.courtyard.nodded';
/** Spec 31: true only on the first courtyard view of a day on this phone (a per-viewer nicety, so localStorage). */
function firstViewToday(): boolean {
  try { const day = dayKey(Date.now()); if (localStorage.getItem(NOD_KEY) === day) return false; localStorage.setItem(NOD_KEY, day); return true; } catch { return false; }
}

export function CourtyardView({ state, phase, onFriend, selected, forcePose }: { state: CourtyardState; phase: Phase; onFriend?: (id: AreaId) => void; selected?: AreaId; forcePose?: 'idle' }) {
  const [taps, setTaps] = useState<Partial<Record<AreaId, number>>>({});
  const [nod] = useState(firstViewToday);
  const title = `${PHASE_WORD[phase]} in the courtyard. ${courtyardLine(state, phase)}${state.lanterns ? ` ${state.lanterns === 1 ? 'One lantern glows' : `${state.lanterns} lanterns glow`} in Kachhua's corner.` : ''}${state.toran ? ` ${state.toran === 1 ? 'One marigold hangs' : `${state.toran} marigolds hang`} over the door.` : ''}`;
  return <div className={`courtyard courtyard-${phase}`} style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}>
    <CourtyardScene phase={phase} stages={stagesOf(state)} treeStage={state.treeStage} title={title} lanterns={state.lanterns} toran={state.toran} />
    {state.areas.map(area => {
      const [x, feet, size] = SPOTS[area.id](area.stage);
      const style = { left: `${(x - size / 2) / SCENE_W * 100}%`, top: `${(feet - size * 0.95) / SCENE_H * 100}%`, width: `${size / SCENE_W * 100}%` };
      const pose = forcePose ?? poseFor(area.today, phase);
      const tapped = taps[area.id] ?? 0;
      const moment = tapped ? { moment: 'hop' as const, at: tapped } : nod && area.today ? { moment: 'nod' as const, at: 1 } : {};
      const label = `${area.friend}, ${area.label}: ${area.days} ${area.days === 1 ? 'day' : 'days'}${area.today ? ', done today' : ''}`;
      return onFriend
        ? <button type="button" key={area.id} className={`courtyard-friend${selected === area.id ? ' selected' : ''}`} style={style} aria-label={label} aria-pressed={selected === area.id} onClick={() => { setTaps(current => ({ ...current, [area.id]: (current[area.id] ?? 0) + 1 })); onFriend(area.id); }}><Cast name={area.friend} pose={pose} {...moment} size={size} /></button>
        : <span key={area.id} className="courtyard-friend" style={style} aria-hidden="true"><Cast name={area.friend} pose={pose} size={size} {...moment} /></span>;
    })}
  </div>;
}

/** The small courtyard at the top of Plan: one tap opens the full one. */
export function CourtyardBanner() {
  const data = useCourtyard();
  if (!data) return <div className="courtyard courtyard-placeholder" style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }} />;
  return <button type="button" className="courtyard-banner" onClick={() => go('you/courtyard')} aria-label={`Open the courtyard. ${courtyardLine(data.state, data.phase)}`}>
    <CourtyardView state={data.state} phase={data.phase} />
    <span className="courtyard-caption">{courtyardLine(data.state, data.phase)}</span>
  </button>;
}

function FriendCard({ area }: { area: AreaState }) {
  const objects = AREAS.find(item => item.id === area.id)!.objects;
  return <section className="card courtyard-card" aria-label={`${area.friend} card`}>
    <div className="cast-inline"><Cast name={area.friend} pose={area.today ? 'cheer' : 'idle'} size={52} /><div><h2>{area.friend} · {area.label}</h2>
      <p className="small">{area.days} practice {area.days === 1 ? 'day' : 'days'} · stage {area.stage} of 5{area.today ? ' · done today' : ''}</p></div></div>
    <div className="courtyard-steps" aria-label={`Stage ${area.stage} of 5`}>{objects.map((object, index) => <span key={object} className={index < area.stage ? 'got' : ''} title={object} />)}</div>
    <p>{area.nextAt != null ? `${area.nextAt - area.days} more ${area.nextAt - area.days === 1 ? 'day' : 'days'} of ${area.practice} ${area.nextAt - area.days === 1 ? 'adds' : 'add'} ${area.nextObject}.` : 'Every object is here. This corner is complete.'}</p>
    {area.stage > 0 && <p className="small">Here now: {objects.slice(0, area.stage).join(', ')}.</p>}
  </section>;
}

export function CourtyardScreen() {
  const data = useCourtyard();
  const [selected, setSelected] = useState<AreaId>('train');
  if (!data) return <section className="screen"><h1>Courtyard</h1></section>;
  const area = data.state.areas.find(item => item.id === selected)!;
  const treeNext = data.state.treeStage < 5 ? [3, 7, 14, 30, 60][data.state.treeStage]! : null;
  return <section className="screen courtyard-screen"><p className="eyebrow">Your courtyard</p><h1>Courtyard</h1>
    <CourtyardView state={data.state} phase={data.phase} onFriend={setSelected} selected={selected} />
    <p className="courtyard-caption">{courtyardLine(data.state, data.phase)}</p>
    <p className="small">Each friend looks after one part of your day and grows with the days you practise it. Missed days never take anything away.</p>
    <FriendCard area={area} />
    <section className="card courtyard-card" aria-label="Neem tree"><h2>The neem tree</h2><p className="small">{data.state.activeDays} active {data.state.activeDays === 1 ? 'day' : 'days'} · stage {data.state.treeStage} of 5</p>
      <p>{treeNext != null ? `${treeNext - data.state.activeDays} more active ${treeNext - data.state.activeDays === 1 ? 'day adds' : 'days add'} ${TREE_OBJECTS[data.state.treeStage]}.` : 'The tree is full grown, with lights in its branches.'}</p></section>
    <div className="courtyard-friends-list">{data.state.areas.map(item => <button type="button" key={item.id} className={`secondary courtyard-chip${item.id === selected ? ' selected' : ''}`} aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}>{item.friend}<small>{item.label} · {item.stage}/5</small></button>)}</div>
    <button type="button" className="card you-link" onClick={() => go('you/stories')}><strong>Storybooks</strong><span>Each week of your courtyard, told as a short story</span></button>
  </section>;
}
