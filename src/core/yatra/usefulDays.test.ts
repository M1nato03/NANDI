import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { usefulDays, usefulRecord } from './usefulDays';

const meta = { updatedAt: 1, deleted: 0 as const, deviceId: 'd' };
const fact = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}, refId = 'r'): LedgerRow => ({ id: `${dayKey}${mode}${kind}${refId}${JSON.stringify(inputs)}`, mode, kind, refId, dayKey, inputs, ...meta } as LedgerRow);
const day = (dayKey: string, mark: boolean) => ({ dayKey, mark });

describe('spec 45b decision 7: useful days', () => {
  it('counts marked dates in the season, once each, up to today', () => {
    const days = [day('2026-10-31', true), day('2026-11-02', true), day('2026-11-02', true), day('2026-11-03', false), day('2026-11-04', true), day('2026-11-05', true)];
    expect(usefulDays(days, { active: true, start: '2026-11-02' }, '2026-11-04')).toEqual({ count: 2, span: 'season', from: '2026-11-02' });
  });
  it('before Season 1 is active, counts this week from Monday', () => {
    const days = [day('2026-10-25', true), day('2026-10-26', true), day('2026-10-27', false), day('2026-10-28', true)];
    expect(usefulDays(days, { active: false, start: '2026-10-05' }, '2026-10-28')).toEqual({ count: 2, span: 'week', from: '2026-10-26' });
  });
  it('an empty start is zero, never negative', () => {
    expect(usefulDays([], { active: true, start: '2026-11-02' }, '2026-11-02').count).toBe(0);
  });
});

describe('spec 45b decision 7: the record', () => {
  it('lists each useful day, newest first, with what was finished on it', () => {
    const days = [day('2026-11-02', true), day('2026-11-03', false), day('2026-11-04', true)];
    const facts = [
      fact('2026-11-02', 'tasks', 'done', {}, 't1'), fact('2026-11-02', 'tasks', 'done', {}, 'gone'),
      fact('2026-11-02', 'calm', 'session', { minutes: 12 }),
      fact('2026-11-03', 'read', 'idea'),
      fact('2026-11-04', 'train', 'session', { status: 'completed', workingSets: 6, xp: 60 }),
      fact('2026-11-04', 'read', 'idea', {}, 'a'), fact('2026-11-04', 'read', 'idea', {}, 'b'),
      fact('2026-11-04', 'mind', 'mystery', { result: 'solved' }), fact('2026-11-04', 'soft', 'soft'),
      { ...fact('2026-11-04', 'read', 'chapter-check'), deleted: 1 as const },
    ];
    expect(usefulRecord(days, facts, '2026-11-02', '2026-11-04', new Map([['t1', 'Call the bank']]))).toEqual([
      { dayKey: '2026-11-04', items: ['A workout', '2 ideas read', 'A case solved', 'A gentle thing on a soft day'] },
      { dayKey: '2026-11-02', items: ['Call the bank', 'A planned task', 'Calm, 12 min'] },
    ]);
  });
  it('a useful day with nothing listed still shows a line', () => {
    expect(usefulRecord([day('2026-11-02', true)], [], '2026-11-02', '2026-11-02')).toEqual([{ dayKey: '2026-11-02', items: ['The day counted'] }]);
  });
});
