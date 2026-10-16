import { describe, expect, it } from 'vitest';
import { dayKey } from './dayKey';
import { formatDayKey } from './formatDayKey';

describe('formatDayKey', () => {
  it('shows the local planning date until the 04:00 rollover', () => {
    expect(formatDayKey(dayKey(new Date(2026, 9, 17, 3, 59)))).toBe('Fri 16 Oct');
    expect(formatDayKey(dayKey(new Date(2026, 9, 17, 4, 0)))).toBe('Sat 17 Oct');
  });

  it('keeps the prior year across a January rollover', () => {
    expect(formatDayKey(dayKey(new Date(2027, 0, 1, 0, 30)))).toBe('Thu 31 Dec');
  });
});
