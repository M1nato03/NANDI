import { expect, it } from 'vitest';
import { RULES, type Rules } from '../rules.config';
import type { LedgerRow } from '../../data/types';
import { calculateTasksDayXp, replayFactXp } from './awards';

const oldRules: Rules = structuredClone(RULES);
const newRules: Rules = {
  ...oldRules,
  tasks: { ...oldRules.tasks, dailyCap: 100, xpBySize: { ...oldRules.tasks.xpBySize, S: 17 } },
  quests: { ...oldRules.quests, sideQuestXp: 31 },
  mind: { ...oldRules.mind, dropBoardXp: 19 },
  bonuses: { ...oldRules.bonuses, lightsOutXp: 22 },
  train: { ...oldRules.train, sessionFullXp: 91, weeklyBonus: { targetMet: 80, oneShort: 40 } },
};
const history = [
  { effectiveFrom: '2026-10-05', rules: oldRules },
  { effectiveFrom: '2026-10-12', rules: newRules },
];
const fact = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown>): LedgerRow => ({ id: `${kind}:${dayKey}`, dayKey, mode, kind, inputs, refId: dayKey, updatedAt: 1, deleted: 0, deviceId: 'test' });

it('replays train, task, quest, Mind and lights-out facts using day-effective rules', () => {
  for (const day of ['2026-10-11', '2026-10-12']) {
    const expected = day.endsWith('11') ? [60, oldRules.tasks.xpBySize.S, 20, 10, 15] : [91, 17, 31, 19, 22];
    const facts = [
      fact(day, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6, safety: false }),
      fact(day, 'tasks', 'done', { plannedSize: 'S', postpones: 1 }),
      fact(day, 'quests', 'quest', { target: 1, progress: 1 }),
      fact(day, 'mind', 'board', { daily: true, afterBedtime: false, type: 'sudoku' }),
      fact(day, 'bonuses', 'lightsout', { metTarget: true }),
    ];
    expect(facts.map(row => replayFactXp(row, history))).toEqual(expected);
  }
});

it('replays the third weekly milestone against the second milestone day', () => {
  const third = fact('2026-10-12', 'train', 'weekly', { milestone: 3, target: 3, priorDayKey: '2026-10-11', xp: 30 });
  expect(replayFactXp(third, history)).toBe(50);
});

it('uses the effective daily task cap when replaying a day', () => {
  const facts = Array.from({ length: 10 }, (_, index) => ({
    ...fact('2026-10-12', 'tasks', 'done', { plannedSize: 'S', postpones: 1 }),
    id: `done:${index}`,
    updatedAt: index,
  }));
  expect(calculateTasksDayXp(facts, RULES, history)).toBe(100);
});
