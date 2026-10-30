import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { RULES } from '../rules.config';
import { deriveEconomy } from './deriveEconomy';
import { readingPay } from './effort';

// Spec 41 (from economy.v9From): a chapter is read one idea a sitting and pays as it goes. The §5.3 table of the
// attention proposal is the test: a 6-idea chapter, 3 steps an idea (18 steps; 5 base + 90 uncapped, capped at 40).
let serial = 0;
const CHAPTER = 'babylon:babylon-ch1';
const days = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'];
const idea = (day: string, steps: number, drop = false, chapter = CHAPTER): LedgerRow => ({
  id: `read-idea:${++serial}`, dayKey: day, mode: 'read', kind: 'idea', refId: `${chapter}:c${serial}`,
  inputs: { chapter, conceptId: `c${serial}`, newSteps: steps, ...(drop ? { dropId: `drop:daily:${day}` } : {}) }, updatedAt: serial, deleted: 0, deviceId: 'test',
});
const check = (day: string, right: number): LedgerRow => ({ id: `read-check:${++serial}`, dayKey: day, mode: 'read', kind: 'chapter-check', refId: CHAPTER, inputs: { firstRight: right }, updatedAt: serial, deleted: 0, deviceId: 'test' });
const done = (day: string, steps: number): LedgerRow => ({ id: `chapter:${CHAPTER}`, dayKey: day, mode: 'read', kind: 'chapter', refId: CHAPTER, inputs: { newSteps: steps, firstRight: 0, readDrops: [] }, updatedAt: ++serial, deleted: 0, deviceId: 'test' });
const pay = (facts: LedgerRow[], from = days[0]!) => readingPay(facts, from, () => RULES);
const sitting = (result: ReturnType<typeof pay>, day: string) => { const one = result.get(day); return one ? one.chapterXp + one.dropTopUp + one.checkXp : 0; };

describe('spec 41 reading pays per idea, the chapter stays the paid unit', () => {
  it('one sitting a day, each the day\'s drop: 20 · 15 · 5+10 · 0+15 · 0+15 · 0+15, then the check: 95 + 15', () => {
    const facts = days.slice(0, 6).map(day => idea(day, 3, true));
    facts.push(check(days[6]!, 3));
    const result = pay(facts);
    expect(days.map(day => sitting(result, day))).toEqual([20, 15, 15, 15, 15, 15, 15]);
    expect(days.slice(0, 6).reduce((sum, day) => sum + result.get(day)!.chapterXp, 0)).toBe(40);
    expect(result.get(days[2]!)).toEqual({ chapterXp: 5, dropTopUp: 10, checkXp: 0 });
    expect(days.map(day => sitting(result, day)).reduce((a, b) => a + b, 0)).toBe(95 + 15);
  });
  it('all 6 in one day (only the first is the drop): 20 · 15 · 5 · 0 · 0 · 0, then the check next day: 40 + 15', () => {
    const facts = [idea(days[0]!, 3, true), ...Array.from({ length: 5 }, () => idea(days[0]!, 3))];
    facts.push(check(days[1]!, 3));
    const result = pay(facts);
    expect(result.get(days[0]!)).toEqual({ chapterXp: 40, dropTopUp: 0, checkXp: 0 });
    expect(result.get(days[1]!)).toEqual({ chapterXp: 0, dropTopUp: 0, checkXp: 15 });
  });
  it('the check pays outside the cap and uses no chapter slot; a 4th chapter in a day waits for its own day', () => {
    const facts = ['a:1', 'b:1', 'c:1', 'd:1'].map(chapter => idea(days[0]!, 1, false, chapter));
    facts.push(check(days[0]!, 2));
    expect(pay(facts).get(days[0]!)).toEqual({ chapterXp: 3 * 10, dropTopUp: 0, checkXp: 10 });
  });
  it('a chapter begun under v8 and finished after v9 pays its earlier steps exactly once: on its first idea fact', () => {
    // The first v9 idea fact carries the 4 steps taught before v9 plus its own 2; the completion fact adds nothing.
    const result = pay([idea(days[1]!, 6), done(days[2]!, 6)], days[1]);
    expect(result.get(days[1]!)!.chapterXp).toBe(5 + 30);
    expect(sitting(result, days[2]!)).toBe(0);
  });
  it('...or on the completion fact when the chapter needed no new sitting after v9', () => {
    const result = pay([done(days[2]!, 6)], days[1]);
    expect(result.get(days[2]!)!.chapterXp).toBe(5 + 30);
  });
  it('after bedtime pays nothing, as before', () => {
    const late = { ...idea(days[0]!, 3), inputs: { chapter: CHAPTER, newSteps: 3, afterBedtime: true } };
    expect(pay([late]).get(days[0]!)).toBeUndefined();
  });
});

const settings = (v9From?: string): SettingRow[] => [['economy.v2From', '2026-10-01'], ['economy.v3From', '2026-10-01'], ['economy.v6From', '2026-10-01'], ['economy.v7From', '2026-10-01'], ['economy.v8From', '2026-10-01'], ...(v9From ? [['economy.v9From', v9From]] : [])]
  .map(([key, value]) => ({ key: key!, value, updatedAt: 1, deleted: 0, deviceId: 'test' }));
const mind = (facts: LedgerRow[], v9From?: string) => deriveEconomy(facts, undefined, settings(v9From), days[0]!).days.at(-1)!.mind;

describe('spec 41 is forward-only', () => {
  it('from economy.v9From an idea sitting pays; before it (or with none written) the same fact pays nothing', () => {
    const facts = [idea(days[0]!, 3, true)];
    expect(mind(facts, days[0])).toBe(20);
    expect(mind(facts, days[1])).toBe(0);
    expect(mind(facts)).toBe(0);
  });
  it('the old completion fact still pays the old way on a day before v9', () => {
    expect(mind([done(days[0]!, 3)], days[1])).toBe(5 + 15);
  });
});
