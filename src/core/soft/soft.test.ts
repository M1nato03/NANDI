import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { buildStorybook } from '../courtyard/storybook';
import { deriveCourtyard } from '../courtyard/courtyard';
import { careCardDue, lanternDays, SOFT_OPTIONS, softNumbers, softToday, yesterdayWasSoft } from './soft';

let serial = 0;
const fact = (dayKey: string, kind: string, inputs: Record<string, unknown>, at = ++serial): LedgerRow => ({
  id: `${kind}:${dayKey}:${at}`, dayKey, mode: 'soft', kind, refId: dayKey, inputs, updatedAt: at, deleted: 0, deviceId: 'test',
});
const start = (day: string, state: string, at?: number) => fact(day, 'soft-start', { state }, at);
const soft = (day: string, inputs: Record<string, unknown> = { choice: 'breathe' }, at?: number) => fact(day, 'soft', inputs, at);

describe('soft days core (spec 15)', () => {
  it('offers three fixed gentle choices per state', () => {
    expect(SOFT_OPTIONS.tired.map(option => option.id)).toEqual(['breathe', 'stretch', 'tiny-task']);
    expect(SOFT_OPTIONS.low.map(option => option.id)).toEqual(['outside', 'kind-word', 'good-thing']);
  });

  it('reads today: the latest soft-start wins, okay switches back, the gentle thing marks it done', () => {
    expect(softToday([start('2026-11-03', 'tired', 1)], '2026-11-03')).toEqual({ state: 'tired', done: null });
    expect(softToday([start('2026-11-03', 'tired', 1), start('2026-11-03', 'okay', 2)], '2026-11-03').state).toBeNull();
    expect(softToday([start('2026-11-02', 'low')], '2026-11-03').state).toBeNull();
    expect(softToday([start('2026-11-03', 'low'), soft('2026-11-03')], '2026-11-03').done).not.toBeNull();
  });

  it('lights one lantern per soft day, kept for good, and opens the next morning with a line', () => {
    const facts = [soft('2026-11-03'), soft('2026-11-05')];
    expect(lanternDays(facts)).toEqual(['2026-11-03', '2026-11-05']);
    expect(deriveCourtyard(facts, '2026-12-31').lanterns).toBe(2);
    expect(yesterdayWasSoft(facts, '2026-11-04')).toBe(true);
    expect(yesterdayWasSoft(facts, '2026-11-05')).toBe(false);
  });

  it('shows the care card after 4 low days in 14, then at most every 14 days', () => {
    const low = ['2026-11-01', '2026-11-04', '2026-11-08', '2026-11-12'].map(day => start(day, 'low'));
    expect(careCardDue(low.slice(0, 3), '2026-11-12', undefined)).toBe(false);
    expect(careCardDue(low, '2026-11-12', undefined)).toBe(true);
    expect(careCardDue(low, '2026-11-12', '2026-11-05')).toBe(false);
    expect(careCardDue([...low, start('2026-11-16', 'low'), start('2026-11-20', 'low'), start('2026-11-22', 'low')], '2026-11-22', '2026-11-08')).toBe(true);
    expect(careCardDue(low.map(row => ({ ...row, inputs: { state: 'tired' } })), '2026-11-12', undefined)).toBe(false);
  });

  it('adds a soft page to the storybook; a good thing shows only when allowed', () => {
    const shown = buildStorybook([soft('2026-11-04', { choice: 'good-thing', text: 'Chai with Ma', inStory: true })], '2026-11-02');
    const page = shown.pages.find(row => row.kind === 'soft')!;
    expect(page.text).toContain('Wednesday');
    expect(page.text).toContain('Chai with Ma');
    const hidden = buildStorybook([soft('2026-11-04', { choice: 'good-thing', text: 'Private note' })], '2026-11-02');
    expect(hidden.pages.find(row => row.kind === 'soft')!.text).not.toContain('Private note');
    expect(buildStorybook([soft('2026-11-03'), soft('2026-11-04')], '2026-11-02').pages.find(row => row.kind === 'soft')!.text).toMatch(/^2 /);
  });

  it('counts the kill-test numbers: finish rate, minutes to the gentle thing, next-day return', () => {
    const facts = [start('2026-11-03', 'tired', 0), soft('2026-11-03', { choice: 'breathe' }, 3 * 60_000),
      start('2026-11-04', 'low', 10), fact('2026-11-05', 'other', {}, 20), fact('2026-11-08', 'other', {}, 30)];
    const numbers = softNumbers(facts, '2026-11-10');
    expect(numbers).toMatchObject({ started: 2, finished: 1, finishRate: 0.5, medianMinutes: 3 });
    expect(numbers.returnAfterSoft).toBe(1);
    expect(numbers.returnAfterMiss).toBe(0.5);
  });
});
