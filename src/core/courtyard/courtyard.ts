import type { LedgerRow } from '../../data/types';
import { RULES } from '../rules.config';

/** Spec 12: each friend looks after one area of life and grows with the days you practise it. */
export type AreaId = 'train' | 'plan' | 'learn' | 'remember' | 'mind' | 'sleep';
export type Phase = 'morning' | 'day' | 'evening' | 'night';
export type FriendName = 'Nandi' | 'Moti' | 'Chiku' | 'Kapi' | 'Mor' | 'Kachhua';

export const AREAS: readonly { id: AreaId; friend: FriendName; label: string; practice: string; objects: readonly [string, string, string, string, string] }[] = [
  { id: 'train', practice: 'training', friend: 'Nandi', label: 'Train', objects: ['an exercise mat', 'wooden clubs', 'dumbbells', 'a pull-up bar', 'a medal hook'] },
  { id: 'plan', practice: 'finished tasks', friend: 'Mor', label: 'Plan', objects: ['a marigold pot', 'a second pot', 'a flower bed', 'a creeper trellis', 'a water bowl'] },
  { id: 'learn', practice: 'learning', friend: 'Chiku', label: 'Learn', objects: ['a first book', 'a book stack', 'a low shelf', 'a reading lamp', 'a globe'] },
  { id: 'remember', practice: 'idea checks', friend: 'Moti', label: 'Remember', objects: ['a keepsake box', 'a photo frame', 'a shelf of jars', 'a trunk', 'a string of photos'] },
  { id: 'mind', practice: 'puzzles', friend: 'Kapi', label: 'Mind', objects: ['a puzzle cube', 'a chess stool', 'a kite', 'a telescope', 'a slate of sums'] },
  { id: 'sleep', practice: 'on-time nights', friend: 'Kachhua', label: 'Sleep', objects: ['a sleeping mat', 'a pillow', 'a woven cot', 'a lantern', 'a soft blanket'] },
];
export const TREE_OBJECTS = ['a neem sapling', 'a young neem', 'a leafy neem', 'a swing on the neem', 'lights in the neem'] as const;
/** Practice days needed for stages 1–5. Days, never points, so one long sitting cannot rush it. */
export const STAGE_DAYS = RULES.courtyard.stageDays;

const answerFrom = (fact: LedgerRow, prefix: string) => typeof fact.inputs.dropId === 'string' && fact.inputs.dropId.startsWith(prefix);

/** The day from which a puzzle or lesson after bedtime grows nothing (batch 5); none stored means never. */
export const COURTYARD_NIGHT_KEY = 'economy.v5From';
export function courtyardNightFrom(settings: readonly { key: string; value: unknown; deleted?: number }[]): string {
  const stored = settings.find(row => row.key === COURTYARD_NIGHT_KEY && !row.deleted)?.value;
  return typeof stored === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(stored) ? stored : '9999-12-31';
}

/**
 * Which area a ledger fact counts toward, if any. From `nightFrom` on, a puzzle, lesson or daily-drop answer done
 * after bedtime grows nothing, like its XP; the night deck's own reviews still count. Earlier days keep what they
 * grew, because the courtyard never shrinks (batch 5 ethics line 11, item 51).
 */
export function areaOf(fact: LedgerRow, nightFrom = '9999-12-31'): AreaId | null {
  if (fact.deleted) return null;
  if (fact.mode === 'mind' && fact.inputs.afterBedtime === true && fact.dayKey >= nightFrom && !answerFrom(fact, 'drop:night:')) return null;
  if (fact.mode === 'train' && (fact.kind === 'session' || fact.kind === 'rest')) return 'train';
  if (fact.mode === 'tasks' && fact.kind === 'done') return 'plan';
  // Spec 24 #1: a kept Phone ki chhutti is a Plan practice day (Mor's corner).
  if (fact.mode === 'tasks' && fact.kind === 'chhutti') return fact.inputs.kept === true ? 'plan' : null;
  if (fact.kind === 'lightsout') return fact.inputs.metTarget === true ? 'sleep' : null;
  // Spec 26: a finished kolam is a night practice day for Kachhua (it pays no XP); one finished after bedtime grows nothing.
  if (fact.mode === 'night' && fact.kind === 'kolam') return fact.inputs.afterBedtime === true ? null : 'sleep';
  if (fact.mode !== 'mind') return null;
  if (fact.kind === 'board' || fact.kind === 'mystery') return 'mind';
  if (fact.kind === 'learn-retention' || fact.kind === 'card') return 'remember';
  if (fact.kind === 'learn-answer') return answerFrom(fact, 'drop:night:') || answerFrom(fact, 'drop:practice:') ? 'remember' : 'learn';
  if (fact.kind === 'learn-drop' || fact.kind === 'lesson') return 'learn';
  return null;
}
/** Ledger kinds worth reading for the courtyard (indexed query). */
export const COURTYARD_KINDS = ['session', 'rest', 'done', 'chhutti', 'lightsout', 'kolam', 'board', 'mystery', 'learn-retention', 'card', 'learn-answer', 'learn-drop', 'lesson', 'soft'];

export function stageFor(days: number): number { return STAGE_DAYS.filter(need => days >= need).length; }

export interface AreaState { id: AreaId; friend: FriendName; label: string; practice: string; days: number; stage: number; today: boolean; week: number; nextAt: number | null; nextObject: string | null }
/** `lanterns`: spec 15 soft days, one per day a gentle thing was done (Kachhua's corner); they never go away.
 * `toran`: spec 24 #1, one marigold over the gate per day with a kept Phone ki chhutti; flowers are never removed. */
export interface CourtyardState { areas: AreaState[]; activeDays: number; treeStage: number; todayCount: number; lanterns: number; toran: number }

/** Days per area, all time and in the week starting `weekFrom` (inclusive) up to `today`. */
export function deriveCourtyard(facts: readonly LedgerRow[], today: string, weekFrom?: string, nightFrom = '9999-12-31'): CourtyardState {
  const days = new Map<AreaId, Set<string>>(AREAS.map(area => [area.id, new Set()]));
  const active = new Set<string>();
  const lanterns = new Set<string>();
  const toran = new Set<string>();
  for (const fact of facts) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fact.dayKey) || fact.dayKey > today) continue;
    // A soft day kept the day, so it is an active day for the neem tree too (it belongs to no single area).
    if (fact.kind === 'soft' && !fact.deleted) { lanterns.add(fact.dayKey); active.add(fact.dayKey); }
    if (fact.kind === 'chhutti' && !fact.deleted && fact.inputs.kept === true) toran.add(fact.dayKey);
    const area = areaOf(fact, nightFrom);
    if (!area) continue;
    days.get(area)!.add(fact.dayKey);
    active.add(fact.dayKey);
  }
  const areas = AREAS.map(area => {
    const set = days.get(area.id)!;
    const stage = stageFor(set.size);
    return { id: area.id, friend: area.friend, label: area.label, practice: area.practice, days: set.size, stage, today: set.has(today),
      week: weekFrom ? [...set].filter(day => day >= weekFrom).length : 0,
      nextAt: stage < 5 ? STAGE_DAYS[stage]! : null, nextObject: stage < 5 ? area.objects[stage]! : null };
  });
  return { areas, activeDays: active.size, treeStage: stageFor(active.size), todayCount: areas.filter(area => area.today).length, lanterns: lanterns.size, toran: toran.size };
}

const minutesOf = (clock: string) => { const [hour = 0, minute = 0] = clock.split(':').map(Number); return hour * 60 + minute; };
/** Minutes since the planning day began at 04:00, so a 01:30 bedtime sorts after a 23:15 shutdown. */
const sinceFour = (minutes: number) => ((minutes - 240) % 1440 + 1440) % 1440;

/** The sky follows the person's own day: morning to 11:00, day to shutdown, evening to bedtime, then night. */
export function phaseAt(now: number, shutdown: string, bedtime: string): Phase {
  const date = new Date(now);
  const at = sinceFour(date.getHours() * 60 + date.getMinutes());
  const bed = sinceFour(minutesOf(bedtime));
  const off = Math.min(sinceFour(minutesOf(shutdown)), bed);
  if (at >= bed) return 'night';
  if (at >= off) return 'evening';
  return at < 7 * 60 ? 'morning' : 'day';
}

export type Pose = 'idle' | 'cheer' | 'think' | 'rest';
/** Done today: cheer. Not yet: calm by day, dozing in the evening. Everyone sleeps at night. Never sad. */
export function poseFor(done: boolean, phase: Phase): Pose {
  if (phase === 'night') return 'rest';
  if (done) return 'cheer';
  return phase === 'evening' ? 'rest' : 'idle';
}

const TODAY_LINES: Record<AreaId, string> = {
  train: 'Nandi trained with you today.', plan: 'Mor watched a task get done today.', learn: 'Chiku learned something new with you today.',
  remember: 'Moti kept an old idea fresh today.', mind: 'Kapi solved a puzzle with you today.', sleep: 'Kachhua slept on time with you.',
};
/** One plain sentence under the scene. */
export function courtyardLine(state: CourtyardState, phase: Phase): string {
  if (phase === 'night') return 'The courtyard is asleep. See you in the morning.';
  const done = state.areas.filter(area => area.today);
  if (done.length === 0) return phase === 'morning' ? 'A new day in the courtyard.' : 'The courtyard is quiet. Any small step wakes a friend.';
  if (done.length === 1) return TODAY_LINES[done[0]!.id];
  return `${done.length} friends are busy with you today.`;
}
