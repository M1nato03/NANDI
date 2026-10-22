import { describe, expect, it } from 'vitest';
import { RULES } from '../rules.config';
import { dayKey } from '../time/dayKey';
import { formatDayKey } from '../time/formatDayKey';
import { boardNumber, dailyBoardLabel } from './daily';

// Run this file under TZ=Asia/Kolkata and TZ=America/New_York: every expectation is the same in both.
describe('daily board number (spec 19 B)', () => {
  it('runs in the zone it was asked for', () => {
    const offsets: Record<string, number> = { 'Asia/Kolkata': -330, 'America/New_York': 300 };
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && zone in offsets) expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(offsets[zone]);
  });
  it('counts whole days from the epoch, starting at 1', () => {
    expect(RULES.mind.boardNumberEpoch).toBe('2026-10-23');
    expect(boardNumber('2026-10-23')).toBe(1);
    expect(boardNumber('2026-10-24')).toBe(2);
    expect(boardNumber('2026-11-03')).toBe(12);
    expect(boardNumber('2027-10-23')).toBe(366);
    expect(boardNumber('2026-10-22')).toBe(0);
  });
  it('does not move across a daylight-saving change (New York, 1 Nov 2026)', () => {
    expect(boardNumber('2026-11-01')).toBe(10);
    expect(boardNumber('2026-11-02')).toBe(11);
    expect(boardNumber('2027-03-14') - boardNumber('2027-03-13')).toBe(1);
  });
  it('rolls with the planning day at 04:00 local time, not at midnight', () => {
    expect(boardNumber(dayKey(new Date(2026, 10, 5, 3, 59)))).toBe(boardNumber('2026-11-04'));
    expect(boardNumber(dayKey(new Date(2026, 10, 5, 4, 0)))).toBe(boardNumber('2026-11-05'));
    expect(boardNumber(dayKey(new Date(2026, 10, 5, 4, 0)))).toBe(14);
  });
  it('labels the daily eyebrow with the number and the date', () => {
    expect(dailyBoardLabel('2026-11-03', formatDayKey('2026-11-03'))).toBe('Daily board #12 · Tue 3 Nov');
    expect(dailyBoardLabel('2026-10-22', 'Thu 22 Oct')).toBe('Daily board · Thu 22 Oct');
  });
});
