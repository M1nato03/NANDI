import { describe, expect, it } from 'vitest';
import { dayKey } from './index';

describe('dayKey', () => {
  it('uses the previous local date before 04:00', () => {
    expect(dayKey(new Date(2026, 9, 4, 0, 30))).toBe('2026-10-03');
    expect(dayKey(new Date(2026, 9, 4, 3, 59))).toBe('2026-10-03');
  });

  it('uses the current local date from 04:00', () => {
    expect(dayKey(new Date(2026, 9, 4, 4, 0).getTime())).toBe('2026-10-04');
  });

  it('crosses month and year boundaries', () => {
    expect(dayKey(new Date(2026, 2, 1, 3, 59))).toBe('2026-02-28');
    expect(dayKey(new Date(2027, 0, 1, 0, 30))).toBe('2026-12-31');
  });
});
