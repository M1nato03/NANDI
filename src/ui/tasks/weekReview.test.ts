import { describe, expect, it } from 'vitest';
import type { DailyLogRow, SessionRow, TaskRow } from '../../data/types';
import { pastWeeks } from './weekReview';

// Spec 660 §3.3: You › history's past weeks, the weekly review's "Earlier week" in one read-only list.
const at = (iso: string) => new Date(iso).getTime();
const task = (doneAt: string) => ({ id: doneAt, deleted: 0, doneAt: at(doneAt) }) as unknown as TaskRow;
const session = (dayKey: string) => ({ id: dayKey, deleted: 0, dayKey, status: 'completed' }) as unknown as SessionRow;
const log = (dayKey: string, extra: Partial<DailyLogRow>) => ({ dayKey, deleted: 0, ...extra }) as unknown as DailyLogRow;

describe('past weeks', () => {
  it('lists finished weeks with anything in them, newest first, with the week in words and the agency answer', () => {
    const now = at('2026-11-18T12:00:00'); // planning week of Mon 16 Nov
    const weeks = pastWeeks([task('2026-11-10T10:00:00'), task('2026-11-11T10:00:00')], [session('2026-11-12')], [log('2026-11-15', { agency1to5: 4 }), log('2026-11-03', { lightsOutAt: 1, bedtimeTarget: 2 })], now);
    expect(weeks.map(week => week.weekKey)).toEqual(['2026-11-09', '2026-11-02']);
    expect(weeks[0]).toEqual({ weekKey: '2026-11-09', words: 'You finished 2 tasks and trained 1 time.', agency: 4 });
    expect(weeks[1]!.words).toBe('You kept 1 night on plan.');
    // This week is not finished, so it is not listed; an empty week is left out.
    expect(pastWeeks([task('2026-11-17T10:00:00')], [], [], now)).toEqual([]);
  });
});
