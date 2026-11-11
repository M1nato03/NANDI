import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { deriveEconomy } from './deriveEconomy';
import { cleanWeeks, confirmUpdates, longestRun, mergeConfirmed, mergeTargets, pendingTarget, readConfirmed, readTargets, setTarget, targetFor, usefulDays, usefulRecord, weekDots } from './usefulDays';

const meta = { updatedAt: 1, deleted: 0 as const, deviceId: 'd' };
const fact = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}, refId = 'r'): LedgerRow => ({ id: `${dayKey}${mode}${kind}${refId}${JSON.stringify(inputs)}`, mode, kind, refId, dayKey, inputs, ...meta } as LedgerRow);
const day = (dayKey: string, mark: boolean, hatTrick = false) => ({ dayKey, mark, hatTrick });
const row = (key: string, value: unknown, deleted: 0 | 1 = 0) => ({ key, value, deleted });

describe('spec 45b decision 7 / 47b: useful days', () => {
  it('counts marked dates in the season, once each, up to today', () => {
    const days = [day('2026-10-31', true), day('2026-11-02', true), day('2026-11-02', true), day('2026-11-03', false), day('2026-11-04', true), day('2026-11-05', true)];
    expect(usefulDays(days, { active: true, start: '2026-11-02' }, '2026-11-04')).toEqual({ count: 2, span: 'season', from: '2026-11-02', dates: ['2026-11-02', '2026-11-04'] });
  });
  it('before Season 1 is active, counts this week from Monday', () => {
    const days = [day('2026-10-25', true), day('2026-10-26', true), day('2026-10-27', false), day('2026-10-28', true)];
    expect(usefulDays(days, { active: false, start: '2026-10-05' }, '2026-10-28')).toMatchObject({ count: 2, span: 'week', from: '2026-10-26' });
  });
  it('an empty start is zero, never negative', () => {
    expect(usefulDays([], { active: true, start: '2026-11-02' }, '2026-11-02').count).toBe(0);
  });
  it('a kept date still counts when its day no longer marks (a late sync, a changed rest pick), and once with a mark', () => {
    const settings = [row('useful.confirmed:2026-11-02', ['2026-11-02', '2026-11-03'])];
    const days = [day('2026-11-02', true), day('2026-11-03', false), day('2026-11-04', true)];
    expect(usefulDays(days, { active: true, start: '2026-11-02' }, '2026-11-04', settings).dates).toEqual(['2026-11-02', '2026-11-03', '2026-11-04']);
  });
  it('a kept set never adds a date outside its own span, a future date, or a deleted row', () => {
    const settings = [row('useful.confirmed:2026-11-02', ['2026-10-30', '2026-11-09', 'junk', 7]), row('useful.confirmed:preseason', ['2026-10-27'], 1)];
    expect(usefulDays([], { active: true, start: '2026-11-02' }, '2026-11-04', settings).count).toBe(0);
    expect(usefulDays([], { active: false, start: '2026-10-05' }, '2026-10-28', settings).count).toBe(0);
    expect(readConfirmed(['2026-11-03', '2026-11-03', '2026-10-30'], '2026-11-02')).toEqual(['2026-11-03']);
  });
  it('keeps what the ledger proves, up to today only, and writes nothing when nothing is new', () => {
    const days = [day('2026-10-31', true), day('2026-11-02', true), day('2026-11-03', false), day('2026-11-05', true)];
    expect(confirmUpdates(days, [], '2026-11-04')).toEqual([
      { key: 'useful.confirmed:preseason', value: ['2026-10-31'] },
      { key: 'useful.confirmed:2026-11-02', value: ['2026-11-02'] },
    ]);
    const kept = [row('useful.confirmed:preseason', ['2026-10-31']), row('useful.confirmed:2026-11-02', ['2026-11-02'])];
    expect(confirmUpdates(days, kept, '2026-11-04')).toEqual([]);
    // An unmarked day never removes a kept date: the union only grows.
    expect(confirmUpdates([day('2026-11-04', true)], kept, '2026-11-04')).toEqual([{ key: 'useful.confirmed:2026-11-02', value: ['2026-11-02', '2026-11-04'] }]);
  });
  it('a restore keeps both sides\' dates', () => {
    expect(mergeConfirmed('2026-11-02', ['2026-11-03'], ['2026-11-02', '2026-11-03', '2026-12-09'])).toEqual(['2026-11-02', '2026-11-03']);
  });
  it('the week is Monday to Sunday; only a past or present useful date fills a dot', () => {
    const dots = weekDots(['2026-11-02', '2026-11-04', '2026-11-06'], '2026-11-04');
    expect(dots.map(dot => dot.dayKey)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
    expect(dots.map(dot => dot.useful)).toEqual([true, false, true, false, false, false, false]);
  });
  it('Clean weeks count weeks of four Hat-tricks from the start, and the longest run never goes down', () => {
    const hat = (key: string) => day(key, true, true);
    const days = [hat('2026-11-02'), hat('2026-11-03'), hat('2026-11-04'), hat('2026-11-05'), hat('2026-11-09'), hat('2026-11-10'), hat('2026-11-11')];
    expect(cleanWeeks(days, '2026-11-02', '2026-11-12')).toBe(1);
    expect(longestRun([row('economy.close:2026-11-01', { streak: 9 }), row('useful.longestRun', 6)], 3)).toBe(9);
    expect(longestRun([row('useful.longestRun', 12), row('economy.close:2026-11-01', { streak: 20 }, 1)], 3)).toBe(12);
    expect(longestRun([], 0)).toBe(0);
  });
});

describe('spec 47b review decision 6: parity with 45b', () => {
  it('the named selector gives the count Home showed in 45b, and keeping the dates changes nothing', () => {
    const facts = ['2026-11-02', '2026-11-03', '2026-11-05'].flatMap(key => [fact(key, 'train', 'session', { status: 'completed', workingSets: 6, xp: 60 }, key), fact(key, 'soft', 'soft', {}, key)]);
    const view = deriveEconomy(facts, undefined, [], '2026-11-06');
    const old = new Set(view.days.filter(d => d.mark && d.dayKey >= '2026-11-02' && d.dayKey <= '2026-11-06').map(d => d.dayKey)).size;
    expect(old).toBeGreaterThan(0);
    expect(usefulDays(view.days, view.season, '2026-11-06').count).toBe(old);
    const kept = confirmUpdates(view.days, [], '2026-11-06').map(({ key, value }) => row(key, value));
    expect(usefulDays(view.days, view.season, '2026-11-06', kept).count).toBe(old);
  });
});

describe('spec 47b: the weekly target', () => {
  it('is 4 until a valid choice; broken entries are ignored', () => {
    expect(targetFor(readTargets(undefined), '2026-11-04')).toBe(4);
    expect(readTargets([{ fromWeek: '2026-11-04', target: 5 }, { fromWeek: '2026-11-09', target: 6 }, null, 'x'])).toEqual([]);
  });
  it('a change starts next Monday; the week under way keeps its target, and a second change replaces the first', () => {
    const once = setTarget([], '2026-11-04', 5);
    expect(once).toEqual([{ fromWeek: '2026-11-09', target: 5 }]);
    expect(targetFor(once, '2026-11-08')).toBe(4);
    expect(targetFor(once, '2026-11-09')).toBe(5);
    expect(pendingTarget(once, '2026-11-04')).toEqual({ fromWeek: '2026-11-09', target: 5 });
    const twice = setTarget(once, '2026-11-05', 3);
    expect(twice).toEqual([{ fromWeek: '2026-11-09', target: 3 }]);
    // Back to this week's target: nothing pending.
    expect(setTarget(twice, '2026-11-05', 4)).toEqual([]);
    // A past week never moves.
    const later = setTarget(once, '2026-11-12', 7);
    expect(later).toEqual([{ fromWeek: '2026-11-09', target: 5 }, { fromWeek: '2026-11-16', target: 7 }]);
    expect(targetFor(later, '2026-11-10')).toBe(5);
  });
  it('a restore keeps every week either side set, the backup\'s for a week both set', () => {
    expect(mergeTargets([{ fromWeek: '2026-11-09', target: 5 }, { fromWeek: '2026-11-23', target: 3 }], [{ fromWeek: '2026-11-09', target: 7 }])).toEqual([{ fromWeek: '2026-11-09', target: 7 }, { fromWeek: '2026-11-23', target: 3 }]);
  });
});

describe('spec 45b decision 7: the record', () => {
  it('lists each useful day, newest first, with what was finished on it', () => {
    const facts = [
      fact('2026-11-02', 'tasks', 'done', {}, 't1'), fact('2026-11-02', 'tasks', 'done', {}, 'gone'),
      fact('2026-11-02', 'calm', 'session', { minutes: 12 }),
      fact('2026-11-03', 'read', 'idea'),
      fact('2026-11-04', 'train', 'session', { status: 'completed', workingSets: 6, xp: 60 }),
      fact('2026-11-04', 'read', 'idea', {}, 'a'), fact('2026-11-04', 'read', 'idea', {}, 'b'),
      fact('2026-11-04', 'mind', 'mystery', { result: 'solved' }), fact('2026-11-04', 'soft', 'soft'),
      { ...fact('2026-11-04', 'read', 'chapter-check'), deleted: 1 as const },
    ];
    expect(usefulRecord(['2026-11-02', '2026-11-04'], facts, new Map([['t1', 'Call the bank']]))).toEqual([
      { dayKey: '2026-11-04', items: ['A workout', '2 ideas read', 'A case solved', 'A gentle thing on a soft day'] },
      { dayKey: '2026-11-02', items: ['Call the bank', 'A planned task', 'Calm, 12\u00a0min'] },
    ]);
  });
  it('a kept date whose rows are gone says so, without inventing an action', () => {
    expect(usefulRecord(['2026-11-02'], [])).toEqual([{ dayKey: '2026-11-02', items: ['Useful day recorded'] }]);
  });
});
