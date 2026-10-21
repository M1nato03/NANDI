import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { deriveEconomy } from './deriveEconomy';

let serial = 0;
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'test',
});
const soft = (day: string) => row(day, 'soft', 'soft', { choice: 'breathe', state: 'tired' });
const walk = (day: string) => row(day, 'train', 'session', { xp: 40 });
const view = (facts: LedgerRow[], today: string) => deriveEconomy(facts, undefined, [], today);

describe('soft days (spec 15)', () => {
  it('a gentle thing keeps the day: 10 XP, marked, no Hat-trick, no rest day spent', () => {
    const facts = [walk('2026-11-02'), soft('2026-11-03'), walk('2026-11-04')];
    const economy = view(facts, '2026-11-04');
    expect(economy.days[1]).toMatchObject({ soft: 10, mark: true, hatTrick: false, total: 10, welcome: 0 });
    expect(economy.streak).toMatchObject({ days: 3, restDaysUsed: 0, paused: false });
  });

  it('a soft day keeps gold going', () => {
    const facts = Array.from({ length: 30 }, (_, index) => {
      const day = new Date(Date.UTC(2026, 10, 2 + index)).toISOString().slice(0, 10);
      return index % 3 === 1 ? soft(day) : walk(day);
    });
    expect(view(facts, '2026-12-01').streak.gold).toBe(true);
  });

  it('the first marked day after a miss gets a fixed 15 XP welcome back, a soft day included', () => {
    const facts = [walk('2026-11-02'), soft('2026-11-04')];
    const economy = view(facts, '2026-11-04');
    expect(economy.days.find(day => day.dayKey === '2026-11-04')).toMatchObject({ soft: 10, welcome: 15, total: 25 });
    // Only once: the next day follows a marked day.
    expect(view([...facts, soft('2026-11-05')], '2026-11-05').days.at(-1)!.welcome).toBe(0);
  });

  it('no welcome back on the very first day, on a day after a chosen rest weekday, or before soft days shipped', () => {
    expect(view([soft('2026-11-04')], '2026-11-04').days.at(-1)!.welcome).toBe(0);
    const rest = deriveEconomy([walk('2026-11-02'), walk('2026-11-04')], undefined, { 'economy.restWeekday': 2 }, '2026-11-04');
    expect(rest.days.at(-1)!.welcome).toBe(0);
    expect(view([walk('2026-10-18'), walk('2026-10-20')], '2026-10-20').days.at(-1)!.welcome).toBe(0);
  });

  it('a long miss that ends on the chosen rest weekday still gets the welcome back', () => {
    // Rest weekday Sunday (0). Walk Mon 2 Nov, miss Tue 3 to Sun 8, walk Mon 9.
    const economy = deriveEconomy([walk('2026-11-02'), walk('2026-11-09')], undefined, { 'economy.restWeekday': 0 }, '2026-11-09');
    expect(economy.days.at(-1)!.welcome).toBe(15);
    // A gap that is only the rest day is not a miss.
    const restOnly = deriveEconomy([walk('2026-11-07'), walk('2026-11-09')], undefined, { 'economy.restWeekday': 0 }, '2026-11-09');
    expect(restOnly.days.at(-1)!.welcome).toBe(0);
  });

  it('soft-day and welcome-back XP do not count toward Season SP', () => {
    const withSoft = deriveEconomy([walk('2026-11-02'), soft('2026-11-04')], undefined, [], '2026-11-04');
    const walkOnly = deriveEconomy([walk('2026-11-02')], undefined, [], '2026-11-04');
    expect(withSoft.days.at(-1)!.total).toBe(25);
    expect(withSoft.season.sp).toBe(walkOnly.season.sp);
  });
});
