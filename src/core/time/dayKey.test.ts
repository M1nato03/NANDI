import { describe, expect, it } from 'vitest';
import { dayKey } from './index';
import { lightsOutNightKey } from './dayKey';

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

describe('lightsOutNightKey', () => {
  it('files a morning check-in under the night just gone, and a late one under tonight', () => {
    expect(lightsOutNightKey(new Date(2026, 9, 23, 4, 5).getTime())).toBe('2026-10-22');
    expect(lightsOutNightKey(new Date(2026, 9, 23, 1, 30).getTime())).toBe('2026-10-22');
    expect(lightsOutNightKey(new Date(2026, 9, 22, 23, 50).getTime())).toBe('2026-10-22');
    expect(lightsOutNightKey(new Date(2026, 9, 23, 13, 0).getTime())).toBe('2026-10-23');
  });
});
