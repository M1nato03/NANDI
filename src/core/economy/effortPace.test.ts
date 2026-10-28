import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { addEconomyDays, deriveEconomy } from './deriveEconomy';
import { levelForXp } from './levelCurve';

// Spec 36 guard: total daily XP rises, so the level pace is measured before and after, on fixed day profiles.
// Days to a level = the first day whose running total reaches it (level L starts at 100 × L × (L − 1) / 2).
const MIN = 60_000;
let serial = 0;
const fact = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'pace',
});
type Profile = { name: string; day: (key: string) => LedgerRow[] };
const done = (key: string, size: 'S' | 'M' | 'L') => fact(key, 'tasks', 'done', { plannedSize: size, wasPlanned: true, postpones: 1 });
const focus = (key: string, task: string, minutes: number, blocks: number) => fact(key, 'tasks', 'focus-time', { taskId: task, paidMs: minutes * MIN, blocks, guard: true });
const PROFILES: Profile[] = [
  // A light day: one small task with a short focus, the daily board.
  { name: 'light', day: key => [done(key, 'S'), focus(key, 'a', 20, 0), fact(key, 'mind', 'board', { daily: true })] },
  // A steady day: two tasks with an hour of focus, a session, the board and case, 10 minutes of Calm, a 1 h chhutti.
  { name: 'steady', day: key => [done(key, 'M'), done(key, 'M'), focus(key, 'a', 35, 1), focus(key, 'b', 25, 1),
    fact(key, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 }),
    fact(key, 'mind', 'board', { daily: true }), fact(key, 'mind', 'mystery', { result: 'solved' }),
    fact(key, 'calm', 'session', { minutes: 10 }), fact(key, 'tasks', 'chhutti', { kept: true, source: 'usage', plannedMin: 60 })] },
  // A big study day: a 3 h L task in six clean blocks, a session, the board, 20 minutes of Calm, a 2 h chhutti.
  { name: 'study', day: key => [done(key, 'L'), focus(key, 'a', 180, 6),
    fact(key, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 }),
    fact(key, 'mind', 'board', { daily: true }), fact(key, 'calm', 'session', { minutes: 20 }),
    fact(key, 'tasks', 'chhutti', { kept: true, source: 'usage', plannedMin: 120 })] },
];
const START = '2026-11-02';
const cutoffs = (effort: boolean): SettingRow[] => [['economy.v2From', '2026-10-01'], ['economy.v3From', '2026-10-01'], ...(effort ? [['economy.v6From', '2026-10-01']] : [])]
  .map(([key, value]) => ({ key: key!, value, updatedAt: 1, deleted: 0, deviceId: 'pace' }));

function pace(profile: Profile, effort: boolean, days = 365) {
  const keys = Array.from({ length: days }, (_, i) => addEconomyDays(START, i));
  const view = deriveEconomy(keys.flatMap(profile.day), undefined, cutoffs(effort), keys.at(-1)!);
  const perDay = view.days.find(day => day.dayKey === START)!.total;
  let running = 0;
  const reach: Record<number, number | null> = { 5: null, 10: null, 20: null };
  for (const [index, day] of view.days.filter(day => day.dayKey >= START).entries()) {
    running += day.total;
    for (const level of [5, 10, 20]) if (reach[level] == null && levelForXp(running) >= level) reach[level] = index + 1;
  }
  return { perDay, reach };
}

describe('spec 36 level pace, before and after', () => {
  it('pays more for more measured effort, and the pace stays in a sane range', () => {
    const table = PROFILES.map(profile => ({ profile: profile.name, before: pace(profile, false), after: pace(profile, true) }));
    // Printed for the ship report (days to reach level 5, 10 and 20).
    console.log(table.map(row => `${row.profile}: ${row.before.perDay} → ${row.after.perDay} XP/day; L5 ${row.before.reach[5]} → ${row.after.reach[5]}, L10 ${row.before.reach[10]} → ${row.after.reach[10]}, L20 ${row.before.reach[20]} → ${row.after.reach[20]} days`).join('\n'));
    for (const row of table) {
      expect(row.after.perDay).toBeGreaterThan(row.before.perDay);
      expect(row.after.reach[10] ?? Infinity).toBeLessThanOrEqual(row.before.reach[10] ?? Infinity);
    }
    const study = table.find(row => row.profile === 'study')!;
    // A real study day pays visibly more, but level 10 still takes days, not one sitting.
    expect(study.after.perDay - study.before.perDay).toBeGreaterThanOrEqual(150);
    expect(study.after.reach[10]!).toBeGreaterThanOrEqual(7);
  });
});

// Spec 36 v2: the same method on the regular and heavy days of 36b, v1 rules (economy.v6From only) against v2
// (economy.v7From too). Each day's chapter is a new chapter of the same depth (its fact id is unique per day).
const v2Cutoffs = (v2: boolean): SettingRow[] => [['economy.v2From', '2026-10-01'], ['economy.v3From', '2026-10-01'], ['economy.v6From', '2026-10-01'], ...(v2 ? [['economy.v7From', '2026-10-01']] : [])]
  .map(([key, value]) => ({ key: key!, value, updatedAt: 1, deleted: 0, deviceId: 'pace' }));
const trainSets = (key: string, sets: number) => fact(key, 'train', 'session', { plannedExercises: 3, touchedExercises: 3, plannedSets: sets, workingSets: sets, safety: false, paidSets: sets });
const chapterRead = (key: string, n: number, asDrop: boolean) => fact(key, 'read', 'chapter', { afterBedtime: false, newSteps: 2, firstRight: 2, readDrops: [asDrop ? `drop:daily:${key}` : `drop:chapter:t:${n}:${key}`] });
const regular = (key: string) => [done(key, 'M'), done(key, 'M'), focus(key, 'a', 35, 1), focus(key, 'b', 25, 1), trainSets(key, 6),
  fact(key, 'mind', 'board', { daily: true, diff: 'medium', hintsUsed: 0 }), fact(key, 'mind', 'mystery', { result: 'solved' }),
  fact(key, 'mind', 'learn-drop'), chapterRead(key, 1, true),
  fact(key, 'calm', 'session', { minutes: 10 }), fact(key, 'tasks', 'chhutti', { kept: true, source: 'usage', plannedMin: 60 })];
const V2_PROFILES: Profile[] = [
  { name: 'regular', day: regular },
  // The regular day with a 12-set session in place of 6, a hard side board and two more chapters.
  { name: 'heavy', day: key => [...regular(key).filter(row => !(row.mode === 'train' && row.kind === 'session')), trainSets(key, 12),
    fact(key, 'mind', 'board', { daily: false, diff: 'hard', hintsUsed: 0 }), chapterRead(key, 2, false), chapterRead(key, 3, false)] },
];
function paceV2(profile: Profile, v2: boolean, days = 365) {
  const keys = Array.from({ length: days }, (_, i) => addEconomyDays(START, i));
  const view = deriveEconomy(keys.flatMap(profile.day), undefined, v2Cutoffs(v2), keys.at(-1)!);
  const first = view.days.find(day => day.dayKey === START)!;
  let running = 0, l20: number | null = null;
  for (const [index, day] of view.days.filter(day => day.dayKey >= START).entries()) {
    running += day.total;
    if (l20 == null && levelForXp(running) >= 20) l20 = index + 1;
  }
  return { perDay: first.total, train: first.train, mind: first.mind, l20 };
}

describe('spec 36 v2 level pace, v1 against v2', () => {
  it('a regular day pays more and a heavy day more again, and level 20 still takes weeks', () => {
    const table = V2_PROFILES.map(profile => ({ profile: profile.name, v1: paceV2(profile, false), v2: paceV2(profile, true) }));
    // Printed for the ship report.
    console.log(table.map(row => `${row.profile}: ${row.v1.perDay} → ${row.v2.perDay} XP/day (train ${row.v1.train} → ${row.v2.train}, mind ${row.v1.mind} → ${row.v2.mind}); L20 ${row.v1.l20} → ${row.v2.l20} days`).join('\n'));
    const [regularRow, heavyRow] = table;
    expect(regularRow!.v2.perDay).toBeGreaterThan(regularRow!.v1.perDay);
    expect(heavyRow!.v2.perDay).toBeGreaterThan(regularRow!.v2.perDay);
    expect(heavyRow!.v2.l20!).toBeLessThan(regularRow!.v2.l20!);
    expect(heavyRow!.v2.l20!).toBeGreaterThanOrEqual(30);
  });
});
