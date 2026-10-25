import { describe, expect, it } from 'vitest';
import { MATKA_STOP, matkaItem, matkaPicks, matkaReveal, matkaShift } from './matka';

const fact = (id: string, kind: string, dayKey: string, inputs: Record<string, unknown>) => ({ id, kind, refId: id.split(':')[1] ?? id, dayKey, inputs });
const pct = (v: number) => `${v}%`;

describe("spec 26 Moti's matka", () => {
  it('reads the three levels from sealed facts; facts without a seal are skipped', () => {
    expect(matkaItem(fact('learn-answer:a', 'learn-answer', '2026-10-20', { itemId: 'i', guess: 40, answerValue: 70 }))).toMatchObject({ level: 2, sealed: 40, answer: 70 });
    expect(matkaItem(fact('learn-lesson:s', 'learn-lesson', '2026-10-20', { hookCorrect: false, hookPick: 'b' }))).toMatchObject({ level: 1, sealed: 'b' });
    expect(matkaItem(fact('learn-lesson:t', 'learn-lesson', '2026-10-20', { hookCorrect: true }))).toMatchObject({ level: 0, sealed: true });
    expect(matkaItem(fact('learn-answer:c', 'learn-answer', '2026-10-20', { correct: true }))).toBeUndefined();
  });
  it('Sundays only, 3 items from facts 5-21 days old, the same pick all day whatever the results', () => {
    const facts = Array.from({ length: 30 }, (_, i) => fact(`learn-lesson:s${i}`, 'learn-lesson', `2026-10-${String(i + 1).padStart(2, '0')}`, { hookCorrect: i % 2 === 0 }));
    const sunday = '2026-11-01';
    const picks = matkaPicks(facts, sunday, '2026-10-26', true);
    expect(picks).toHaveLength(3);
    for (const item of picks) expect(item.dayKey >= '2026-10-11' && item.dayKey <= '2026-10-27').toBe(true);
    const flipped = facts.map(row => ({ ...row, inputs: { hookCorrect: !row.inputs.hookCorrect } }));
    expect(matkaPicks(flipped, sunday, '2026-10-26', true).map(item => item.factId)).toEqual(picks.map(item => item.factId));
    expect(matkaPicks(facts, '2026-10-31', '2026-10-26', false)).toEqual([]);
  });
  it('the shift moves toward the answer and is never a score', () => {
    expect(matkaShift(40, 60, 70)).toBeCloseTo(2 / 3);
    expect(matkaShift(40, 40, 70)).toBe(0);
    expect(matkaShift(70, 50, 70)).toBe(0);
  });
  it('uses the exact reveal copy, never "wrong", "should", "your brain" or "everyone"', () => {
    const two = { factId: 'f', level: 2 as const, sealed: 40, answer: 70, dayKey: '2026-10-20' };
    expect(matkaReveal(two, 60, { value: pct })[0]).toBe('Sealed: 40%. You remembered: 60%. Answer: 70%.');
    expect(matkaReveal(two, 60, { value: pct })[1]).toContain('Your memory slid toward the answer.');
    expect(matkaReveal(two, 40, { value: pct })[1]).toMatch(/^Spot on\./);
    expect(matkaReveal(two, 'unsure', { value: pct })).toEqual(['Fair answer. Sealed: 40%. Answers this week: done.']);
    const zero = { factId: 'g', level: 0 as const, sealed: false, dayKey: '2026-10-20' };
    expect(matkaReveal(zero, 'landed', { value: pct })[0]).toBe('Sealed: your first guess missed.');
    expect(matkaReveal(zero, 'missed', { value: pct })[0]).toMatch(/^Matches the seal\./);
    const one = { factId: 'h', level: 1 as const, sealed: 'b', dayKey: '2026-10-20' };
    expect(matkaReveal(one, 'a', { value: pct, option: id => `option ${id}` })[0]).toBe('Sealed: your first pick was option b.');
    const all = [two, zero, one].flatMap(item => ['landed', 'missed', 'unsure', 'a', 'b', 40, 60].flatMap(recalled => matkaReveal(item, recalled as never, { value: pct, option: id => id }))).concat(MATKA_STOP).join(' ');
    expect(all).not.toMatch(/\bwrong\b|\bshould\b|your brain|everyone/i);
  });
});
