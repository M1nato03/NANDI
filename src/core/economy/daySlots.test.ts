import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { RULES, RULES_HISTORY, type Rules, type RulesHistoryEntry } from '../rules.config';
import { replayFactXp } from './awards';
import { trainSessionPay } from './effort';
import { isPlannedDone } from './planned';
import { daySlots } from './daySlots';

// Spec 571 stage 2, commit 1: daySlots() is the old inline slot code of deriveEconomy moved, with no behaviour change.
// `legacy` is a frozen copy of those lines as they stood at 4ef31da (deriveEconomy.ts:536-588); fuzzed days must give
// the same plannedTask / body / mindSlot / Hat-trick and the same intermediate reads deriveEconomy pays XP from.
const beforeBed = (fact: LedgerRow) => fact.inputs.afterBedtime !== true && fact.inputs.beforeBedtime !== false;
function legacy(rows: LedgerRow[], key: string, rules: Rules, history: readonly RulesHistoryEntry[], v7: boolean, v9: boolean) {
  const sessions = rows.filter(row => row.mode === 'train' && row.kind === 'session').map(row => (v7 ? trainSessionPay(row.inputs, rules) : null) ?? replayFactXp(row, history));
  const bestSession = Math.max(0, ...sessions);
  const restXp = Math.max(0, ...rows.filter(row => row.mode === 'train' && row.kind === 'rest').map(row => replayFactXp(row, history)));
  const rest = bestSession ? 0 : restXp;
  const mindRows = rows.filter(row => row.mode === 'mind' && beforeBed(row));
  const caseSolved = mindRows.some(row => row.kind === 'mystery' && row.inputs.result !== 'revealed');
  const dailyBoard = mindRows.some(row => row.kind === 'board' && row.inputs.daily !== false);
  const cards = mindRows.filter(row => row.kind === 'card');
  const learnAnswers = new Set(mindRows.filter(row => row.kind === 'learn-answer' && row.inputs.dropId === `drop:daily:${key}`).map(row => row.refId));
  const lessonDone = rows.some(row => row.kind === 'learn-lesson' && !row.deleted && row.inputs.dropId === `drop:daily:${key}` && beforeBed(row));
  const dropFinished = rows.some(row => row.mode === 'gamify' && row.kind === 'learn-drop' && row.refId === key) && (learnAnswers.size > 0 || lessonDone);
  const learnDrop = mindRows.some(row => row.kind === 'learn-drop') || learnAnswers.size >= 5 || dropFinished;
  const dropWasChapter = v7 && rows.some(row => !row.deleted && ((row.mode === 'read' && row.kind === 'chapter' && Array.isArray(row.inputs.readDrops) && row.inputs.readDrops.includes(`drop:daily:${key}`))
    || (row.mode === 'gamify' && row.kind === 'learn-drop' && row.refId === key && row.inputs.chapter === true)
    || (v9 && row.mode === 'read' && row.kind === 'idea' && row.inputs.dropId === `drop:daily:${key}`)));
  const mindSlot = learnDrop || caseSolved || dailyBoard || cards.length >= rules.streak.minDueCardsForMark;
  const plannedTask = rows.some(isPlannedDone);
  const body = bestSession > 0 || rest > 0;
  return { plannedTask, body, mindSlot, hatTrick: plannedTask && body && mindSlot, bestSession, restXp, rest, mindRows, caseSolved, dailyBoard, cards, learnDrop, dropWasChapter };
}

let seed = 571;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]!;
let serial = 0;
const late = () => rand() < 0.25 ? pick([{ afterBedtime: true }, { beforeBedtime: false }, { afterBedtime: false }]) : {};
/** One day of facts, mixing every kind the slots read, at random counts, with after-bedtime flags and deleted rows. */
function fuzzDay(key: string): LedgerRow[] {
  const rows: LedgerRow[] = [];
  const add = (mode: string, kind: string, inputs: Record<string, unknown> = {}, refId = String(++serial)) =>
    rows.push({ id: `${kind}:${refId}:${serial}`, dayKey: key, mode, kind, refId, inputs, updatedAt: serial, deleted: rand() < 0.05 ? 1 : 0, deviceId: 'fuzz' });
  for (let i = Math.floor(rand() * 3); i > 0; i--) add('tasks', 'done', pick([{ planned: true }, { wasPlanned: true, plannedSize: 'M' }, { planned: false }, {}]));
  for (let i = Math.floor(rand() * 3); i > 0; i--) add('train', 'session', pick([{ plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 }, { workingSets: 0 }, { xp: 30 }, {}]));
  if (rand() < 0.4) add('train', 'rest', { minutes: pick([5, 10, 25]) });
  for (let i = Math.floor(rand() * 3); i > 0; i--) add('mind', 'mystery', { result: pick(['solved', 'revealed']), ...late() });
  for (let i = Math.floor(rand() * 3); i > 0; i--) add('mind', 'board', { daily: pick([true, false, undefined]), ...late() });
  for (let i = Math.floor(rand() * 14); i > 0; i--) add('mind', 'card', late());
  for (let i = Math.floor(rand() * 7); i > 0; i--) add('mind', 'learn-answer', { dropId: rand() < 0.8 ? `drop:daily:${key}` : 'drop:other', ...late() }, pick(['a', 'b', 'c', 'd', 'e', 'f', String(serial)]));
  if (rand() < 0.3) add('mind', 'learn-lesson', { dropId: `drop:daily:${key}`, ...late() });
  if (rand() < 0.2) add('mind', 'learn-drop', late());
  if (rand() < 0.4) add('gamify', 'learn-drop', rand() < 0.3 ? { chapter: true } : {}, rand() < 0.9 ? key : 'other');
  if (rand() < 0.3) add('read', 'chapter', { readDrops: rand() < 0.5 ? [`drop:daily:${key}`] : [], newSteps: 2 });
  if (rand() < 0.3) add('read', 'idea', { dropId: rand() < 0.5 ? `drop:daily:${key}` : 'drop:other' });
  return rows.sort(() => rand() - 0.5);
}

const ruleSets: Rules[] = [RULES, ...RULES_HISTORY.map(entry => entry.rules as Rules)];
describe('daySlots (spec 571 stage 2 commit 1: moved, not changed)', () => {
  it('matches the old inline slots on 3000 fuzzed days, for every rules set and every v7/v9 state', () => {
    let hatTricks = 0, minds = 0, bodies = 0, planned = 0;
    for (let day = 0; day < 3000; day++) {
      const key = `2026-${String(10 + Math.floor(day / 900)).padStart(2, '0')}-${String(1 + (day % 28)).padStart(2, '0')}`;
      const rows = fuzzDay(key);
      const rules = ruleSets[day % ruleSets.length]!;
      const v7 = day % 4 >= 2, v9 = v7 && day % 2 === 1;
      const want = legacy(rows, key, rules, RULES_HISTORY, v7, v9);
      expect(daySlots(rows, { key, rules, history: RULES_HISTORY, v7, v9 })).toEqual(want);
      hatTricks += +want.hatTrick; minds += +want.mindSlot; bodies += +want.body; planned += +want.plannedTask;
    }
    // The fuzz reaches both sides of every slot.
    for (const count of [hatTricks, minds, bodies, planned]) { expect(count).toBeGreaterThan(50); expect(count).toBeLessThan(2950); }
  });

  it('reads only the rows it is given (a day alone, with no settings or other days)', () => {
    const key = '2026-11-03';
    const rows = fuzzDay(key);
    const copy = structuredClone(rows);
    daySlots(rows, { key, rules: RULES, history: RULES_HISTORY, v7: true, v9: true });
    expect(rows).toEqual(copy);
  });
});
