import { describe, expect, it } from 'vitest';
import { reasonsLine } from './pauseReasons';
import type { LedgerRow } from '../data/types';

const reason = (why: string, day: string, deleted: 0 | 1 = 0): LedgerRow => ({ id: `${why}${day}${Math.random()}`, mode: 'pause', kind: 'reason', refId: 'a', dayKey: day, inputs: { why }, updatedAt: 1, deleted, deviceId: 't' });

describe('spec 54: the reasons line in You', () => {
  it('counts only, in a fixed order, this week only, with no judging word', () => {
    const facts = [...Array.from({ length: 6 }, () => reason('quick-check', '2026-11-03')), reason('scrolling', '2026-11-04'), reason('scrolling', '2026-11-05'), reason('reply', '2026-11-10'), reason('posting', '2026-11-04', 1)];
    const line = reasonsLine(facts, '2026-11-02', '2026-11-09');
    expect(line).toBe('Your reasons this week: 6 quick checks, 2 just scrolling');
    expect(line).not.toMatch(/too|much|bad|only|should/i);
    expect(reasonsLine([reason('reply', '2026-11-03')], '2026-11-02', '2026-11-09')).toBe('Your reasons this week: 1 reply');
    expect(reasonsLine([], '2026-11-02', '2026-11-09')).toBeNull();
  });
});
