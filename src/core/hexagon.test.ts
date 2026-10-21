import { describe, expect, it } from 'vitest';
import { hexagon, type HexSources } from './hexagon';
import { addEconomyDays } from './economy/deriveEconomy';
import type { LedgerRow } from '../data/types';

const today = '2026-10-21';
const meta = { updatedAt: new Date(`${today}T12:00:00`).getTime(), deleted: 0 as const, deviceId: 'test' };
const day = (back: number) => addEconomyDays(today, -back);
const fact = (id: string, dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}, refId = id): LedgerRow => ({ ...meta, id, dayKey, mode, kind, refId, inputs } as LedgerRow);
const empty = (): HexSources => ({ ledger: [], tasks: [], events: [], puzzleRuns: [], plans: [], programs: [], drops: [], settings: [] });
const value = (result: ReturnType<typeof hexagon>, key: string) => result.stats.find(stat => stat.key === key)?.value;

describe('six-stat hexagon (spec 05 §8)', () => {
  it('has nothing to show before the first day', () => {
    const result = hexagon(today, empty());
    expect(result.days).toBe(0);
    expect(result.stats.map(stat => stat.value)).toEqual([null, null, null, null, null, null]);
  });

  it('counts only the days since first use, up to 28', () => {
    expect(hexagon(today, { ...empty(), ledger: [fact('a', day(9), 'mind', 'card')] }).days).toBe(10);
    expect(hexagon(today, { ...empty(), ledger: [fact('a', day(60), 'mind', 'card')] }).days).toBe(28);
  });

  it('works out each stat from the last 28 days', () => {
    const source = empty();
    for (let back = 0; back < 28; back++) source.ledger.push(fact(`open:${back}`, day(back), 'tasks', 'open'));
    // Body: 6 of 12 expected sessions (3 a week) and 2 new bests → 50 + 5.
    for (let n = 0; n < 6; n++) source.ledger.push(fact(`s${n}`, day(n * 4), 'train', 'session'));
    source.ledger.push(fact('pr1', day(1), 'train', 'pr'), fact('pr2', day(2), 'train', 'pr'));
    // Drive: 3 of 4 due tasks done on their first day; 1 of 2 timed starts on time → 37.5 + 25.
    for (let n = 0; n < 4; n++) source.tasks.push({ ...meta, id: `t${n}`, title: 'x', status: 'planned', dayKey: day(n + 1), firstScheduledDayKey: day(n + 1), ...(n < 2 ? { scheduledStart: new Date(`${day(n + 1)}T10:00:00`).getTime() } : {}) });
    for (let n = 0; n < 3; n++) source.ledger.push(fact(`done:t${n}`, day(n + 1), 'tasks', 'done', { isFirstDay: true }, `t${n}`));
    source.events.push({ ...meta, id: 'e0', taskId: 't0', kind: 'started', at: new Date(`${day(1)}T10:05:00`).getTime() }, { ...meta, id: 'e1', taskId: 't1', kind: 'started', at: new Date(`${day(2)}T15:00:00`).getTime() });
    // Mind: 7 no-hint and 7 hinted daily boards over 28 active days → (7 + 5.25) / 28.
    for (let n = 0; n < 14; n++) source.puzzleRuns.push({ ...meta, id: `b${n}`, type: 'sudoku', daily: true, result: 'solved', dayKey: day(n), hintsUsed: n < 7 ? 0 : 1 });
    // Recall: 4 review items offered and done, 3 remembered.
    source.drops.push({ ...meta, id: `drop:daily:${day(3)}`, drop: { id: `drop:daily:${day(3)}`, cursor: 4, ending: { kind: 'stopping-screen' }, items: [0, 1, 2, 3].map(n => ({ itemId: `i${n}`, conceptId: 'c', optionOrder: [], mode: 'review' as const })) } });
    for (let n = 0; n < 4; n++) source.ledger.push(fact(`ans${n}`, day(3), 'mind', 'learn-answer', { dropId: `drop:daily:${day(3)}`, itemId: `i${n}`, correct: n < 3 }));
    // Wisdom: lessons on 15 of 28 days (the answers above count for day 3); plans fired 2 of 4 → (53.6 + 50) / 2.
    for (let n = 0; n < 14; n++) if (n !== 3) source.ledger.push(fact(`lesson${n}`, day(n), 'mind', 'learn-lesson'));
    source.ledger.push(fact('lesson-extra', day(20), 'mind', 'learn-lesson'));
    (['yes', 'partly', 'no', 'no'] as const).forEach((fired, n) => source.plans.push({ ...meta, id: `p${n}`, lessonId: 'l', madeDayKey: day(5), fired }));
    // Discipline: lights out on target on 14 of 28 nights, a back-filled night does not count, no Clean Week → 70 × 0.5 / 100.
    for (let n = 0; n < 14; n++) source.ledger.push(fact(`lo${n}`, day(n), 'bonuses', 'lightsout', { metTarget: true }));
    source.ledger.push(fact('lo-back', day(20), 'bonuses', 'lightsout', { metTarget: true, backfill: true }));

    const result = hexagon(today, source);
    expect(result.days).toBe(28);
    expect(value(result, 'body')).toBe(55);
    expect(value(result, 'drive')).toBe(63);
    expect(value(result, 'mind')).toBe(44);
    expect(value(result, 'recall')).toBe(75);
    expect(value(result, 'wisdom')).toBe(52);
    expect(value(result, 'discipline')).toBe(35);
    for (const stat of result.stats) expect(stat.value).toBeGreaterThanOrEqual(0);
  });

  it('leaves out a part with no data instead of scoring it zero', () => {
    const source = empty();
    for (let back = 0; back < 14; back++) source.ledger.push(fact(`l${back}`, day(back), 'mind', 'learn-lesson'));
    const result = hexagon(today, source);
    expect(value(result, 'wisdom')).toBe(100);
    expect(value(result, 'drive')).toBeNull();
    expect(value(result, 'recall')).toBeNull();
  });
});
