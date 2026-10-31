import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { deriveEconomy } from './deriveEconomy';
import { finishedSeasons, resultDue, resultWords, seasonResult } from './seasonResult';

const meta = { updatedAt: 1, deleted: 0 as const, deviceId: 'd' };
let n = 0;
const done = (dayKey: string): LedgerRow => ({ id: `done:${++n}`, mode: 'tasks', kind: 'done', refId: `t${n}`, dayKey, inputs: { plannedSize: 'L', wasPlanned: true }, ...meta } as LedgerRow);
const set = (key: string, value: unknown): SettingRow => ({ key, value, ...meta });
const S1 = { index: 0, start: '2026-11-02', end: '2026-12-06' };

describe('spec 47c: the season result', () => {
  it('Season 1 has ended only from Mon 7 Dec', () => {
    expect(finishedSeasons('2026-12-06')).toEqual([]);
    expect(finishedSeasons('2026-12-07')).toEqual([S1]);
    expect(finishedSeasons('2027-01-05').map(season => season.start)).toEqual(['2026-11-02', '2026-12-07']);
  });
  it('reads the real rank, tier, useful days and the Shards the tier paid', () => {
    const facts = ['2026-11-02', '2026-11-03', '2026-11-03', '2026-11-20', '2026-12-08'].map(done);
    const result = seasonResult(facts, [], S1);
    const end = deriveEconomy(facts, undefined, [], '2026-12-06');
    expect(result).toMatchObject({ rank: end.season.rank, tier: end.season.tier, usefulDays: 3, rankShown: true, next: { index: 1, start: '2026-12-07' } });
    // The Shards line is the amount the economy actually adds the day after the season ends.
    const before = deriveEconomy(facts.filter(row => row.dayKey <= '2026-12-06'), undefined, [], '2026-12-06').shards;
    const after = deriveEconomy(facts.filter(row => row.dayKey <= '2026-12-06'), undefined, [], '2026-12-07').shards;
    expect(after - before).toBe(result.shards);
  });
  it('is due once: on the first open after the end, not after it was shown, and not for a phone that began later', () => {
    const facts = [done('2026-11-10')];
    expect(resultDue(facts, [], '2026-12-06')).toBeUndefined();
    expect(resultDue(facts, [], '2026-12-07')?.start).toBe('2026-11-02');
    expect(resultDue(facts, [set('useful.resultShown:2026-11-02', '2026-12-07')], '2026-12-09')).toBeUndefined();
    expect(resultDue([done('2026-12-08')], [], '2026-12-09')).toBeUndefined();
    // A deleted flag (an erase) means not shown.
    expect(resultDue(facts, [{ ...set('useful.resultShown:2026-11-02', '2026-12-07'), deleted: 1 }], '2026-12-09')).toBeDefined();
  });
  it('the words: a headline by tier, the real facts, and the rank left out when it is tucked away', () => {
    const base = { ...S1, rank: 212, usefulDays: 19, rankShown: true, next: { index: 1, start: '2026-12-07', end: '2027-01-03' } };
    expect(resultWords({ ...base, tier: 'Contender', shards: 150 }, '2026-12-07')).toEqual({
      eyebrow: 'Season 1 · 2 Nov–6 Dec 2026', headline: 'You reached Contender.',
      facts: '#212 of 500 · 19 useful days moved your goal forward · 150 Shards.', closing: 'Season 2 starts today with a fresh climb.',
    });
    expect(resultWords({ ...base, tier: 'Apex', rank: 1, shards: 300 }, '2026-12-08').facts).toBe('#1 of 500 · 19 useful days · 300 Shards.');
    expect(resultWords({ ...base, tier: 'Apex', rank: 1, shards: 300 }, '2026-12-08').closing).toBe("Here's what you finished. Season 2 is under way, a fresh climb.");
    const bench = resultWords({ ...base, tier: 'Bench', rank: 431, usefulDays: 1, shards: 50, rankShown: false }, '2026-12-07');
    expect(bench).toMatchObject({ headline: 'Season 1 is complete.', facts: 'Bench · 1 useful day toward your goal · 50 Shards.' });
    expect(resultWords({ ...base, tier: 'Bench', usefulDays: 0, shards: 50 }, '2026-12-07').facts).toBe('#212 of 500 · Bench · 50 Shards.');
    for (const tier of ['Apex', 'Ace', 'Elite', 'Contender', 'Challenger', 'Bench']) {
      const words = Object.values(resultWords({ ...base, tier, shards: 50 }, '2026-12-07')).join(' ');
      expect(words).not.toMatch(/fail|fell|drop|lost|lose|miss/i);
    }
  });
});
