import { describe, expect, it } from 'vitest';
import { RULES } from '../rules.config';
import { badges, badgeTier, chestReady, dailyQuests, focusBoost, goldReviewPassed, longestCombo, monthlyQuestCount, perfectDrop, questProgress } from './gamify';
import { deriveEconomy } from './deriveEconomy';
import type { LedgerRow } from '../../data/types';

const day = '2026-10-20';
const noon = new Date(`${day}T12:00:00`).getTime();
const fact = (kind: string, refId: string, inputs: Record<string, unknown> = {}, updatedAt = noon, mode = 'mind'): LedgerRow =>
  ({ id: `${kind}:${refId}`, kind, refId, dayKey: day, mode, inputs, updatedAt, deleted: 0, deviceId: 'test' });

describe('daily invitations and awards', () => {
  it('selects three distinct invitations for a day and derives progress from facts', () => {
    const selected = dailyQuests(day);
    expect(selected).toEqual(dailyQuests(day));
    expect(new Set(selected.map(q => q.id)).size).toBe(3);
    expect(dailyQuests('2026-10-21')).not.toEqual(selected);
    const workout = dailyQuests(day).find(q => q.id === 'session') ?? { id: 'session', title: 'Log a workout', target: 1, count: (facts: readonly LedgerRow[]) => facts.filter(f => f.kind === 'session').length };
    expect(questProgress(workout, [], day)).toBe(0);
    expect(questProgress(workout, [fact('session', 'one', {}, noon, 'train')], day)).toBe(1);
  });
  it('unlocks fifteen minutes from the last completed invitation', () => {
    const facts = dailyQuests(day).map((q, index) => fact('daily-quest', `${day}:${q.id}`, {}, noon + index * 1000, 'gamify'));
    expect(focusBoost(facts.slice(0, 2), day, noon + 2000)).toBeNull();
    expect(focusBoost(facts, day, noon + 2000)?.remainingMs).toBe(RULES.gamify.focusMinutes * 60_000);
    expect(focusBoost(facts, day, noon + 2000 + RULES.gamify.focusMinutes * 60_000)).toBeNull();
  });
  it('counts badge tiers and the next threshold from history', () => {
    const badge = badges.find(row => row.id === 'workouts')!;
    expect(badgeTier(badge, [])).toBe(0);
    expect(badgeTier(badge, Array.from({ length: 5 }, (_, i) => fact('session', String(i), {}, noon + i, 'train')))).toBe(2);
    expect(badgeTier(badge, Array.from({ length: 20 }, (_, i) => fact('session', String(i), {}, noon + i, 'train')))).toBe(3);
  });
  it('counts consecutive correct answers and grants only a clean completed drop', () => {
    const rows = [true, true, true, true, false].map((correct, i) => fact('learn-answer', `drop:daily:${day}:${i}`, { dropId: `drop:daily:${day}`, correct }, noon + i));
    expect(longestCombo(rows, `drop:daily:${day}`)).toBe(4);
    expect(perfectDrop(rows, `drop:daily:${day}`, 5)).toBe(false);
    expect(perfectDrop(rows.slice(0, 4), `drop:daily:${day}`, 4)).toBe(true);
  });
  it('opens a chest only when all concepts are mastered and passes Gold at four of five', () => {
    expect(chestReady(['a', 'b'], new Set(['a']))).toBe(false);
    expect(chestReady(['a', 'b'], new Set(['a', 'b']))).toBe(true);
    expect(goldReviewPassed(4, 5)).toBe(true);
    expect(goldReviewPassed(3, 5)).toBe(false);
    expect(goldReviewPassed(4, 4)).toBe(false);
  });
  it('replays fixed rewards once and doubles eligible XP during Focus', () => {
    const quest = fact('daily-quest', `${day}:task`, {}, noon, 'gamify');
    const chest = fact('unit-chest', 'money-markets-module', {}, noon, 'gamify');
    const boost = fact('focus-boost', day, {}, noon, 'gamify');
    const task = fact('done', 'task-1', { plannedSize: 'M', wasPlanned: true }, noon + 1000, 'tasks');
    const economy = deriveEconomy([quest, quest, chest, chest, boost, task], undefined, [], day);
    expect(economy.days[0]).toMatchObject({ tasks: 20, focus: 20, total: 40 });
    expect(economy.shards).toBe(RULES.gamify.dailyQuestShards + RULES.gamify.unitChestShards + Math.floor(40 * RULES.shards.perXp));
  });
  it('counts monthly quest facts without carrying them into another month', () => {
    const rows = [fact('daily-quest', `${day}:drop`, {}, noon, 'gamify'), fact('daily-quest', '2026-11-01:drop', {}, noon, 'gamify')];
    rows[1]!.dayKey = '2026-11-01';
    expect(monthlyQuestCount(rows, '2026-10')).toBe(1);
    expect(monthlyQuestCount(rows, '2026-11')).toBe(1);
  });
  it('counts quests and badges by what they name (audit 16.14-18)', async () => {
    const { questPool } = await import('./gamify');
    const quest = (id: string) => questPool.find(q => q.id === id)!;
    // A teach-first drop is finished when the drop is, however few questions it had.
    expect(questProgress(quest('drop'), [fact('learn-drop', day, {}, noon, 'gamify')], day)).toBe(1);
    // An unplanned quick win is not a planned task; a time slot is.
    expect(questProgress(quest('task'), [fact('done', 'quick', {}, noon, 'tasks')], day)).toBe(0);
    expect(questProgress(quest('task'), [fact('done', 'slot', { hadTimeSlot: true }, noon, 'tasks')], day)).toBe(1);
    expect(questProgress(quest('case'), [fact('mystery', 'shown', { result: 'revealed' })], day)).toBe(0);
    const weeks = badges.find(row => row.id === 'weeks')!;
    expect(weeks.count([fact('weekly', 'two', { target: 3, milestone: 2 }, noon, 'train'), fact('weekly', 'three', { target: 3, milestone: 3 }, noon, 'train')])).toBe(1);
    expect(badges.find(row => row.id === 'planned')!.count([fact('done', 'slot', { hadTimeSlot: true }, noon, 'tasks')])).toBe(1);
  });
});
