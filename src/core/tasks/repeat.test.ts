import { describe, expect, it } from 'vitest';
import { nextRepeatDay, sameTimeOn } from './repeat';

describe('repeating tasks', () => {
  it('plans the next day for each repeat', () => {
    expect(nextRepeatDay('daily', '2026-10-21', '2026-10-21')).toBe('2026-10-22');
    expect(nextRepeatDay('daily', '2026-10-18', '2026-10-21')).toBe('2026-10-22');
    expect(nextRepeatDay('weekdays', '2026-10-23', '2026-10-23')).toBe('2026-10-26');
    expect(nextRepeatDay('weekdays', '2026-10-21', '2026-10-21')).toBe('2026-10-22');
    expect(nextRepeatDay('weekly', '2026-10-21', '2026-10-21')).toBe('2026-10-28');
    expect(nextRepeatDay('weekly', '2026-10-07', '2026-10-21')).toBe('2026-10-28');
  });
  it('keeps the time of day', () => {
    const start = new Date('2026-10-21T07:30:00').getTime();
    expect(new Date(sameTimeOn(start, '2026-10-22')).toString()).toBe(new Date('2026-10-22T07:30:00').toString());
  });
  it('a task at 00:30 belongs to the night after its planning day, so the repeat lands after midnight too', () => {
    // Planned for planning day 21 Oct at 00:30, which is 22 Oct on the calendar.
    const start = new Date('2026-10-22T00:30:00').getTime();
    expect(new Date(sameTimeOn(start, '2026-10-22')).toString()).toBe(new Date('2026-10-23T00:30:00').toString());
  });
});
