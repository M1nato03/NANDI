import { describe, expect, it } from 'vitest';
import { compareNightTimes, minutesAfterNoon } from './index';

const earlier = (left: string, right: string): string =>
  compareNightTimes(left, right) <= 0 ? left : right;

describe('night timeline', () => {
  it('counts minutes from local noon through the following morning', () => {
    expect(minutesAfterNoon('12:00')).toBe(0);
    expect(minutesAfterNoon('23:30')).toBe(690);
    expect(minutesAfterNoon('00:30')).toBe(750);
    expect(minutesAfterNoon('11:59')).toBe(1439);
  });

  it('orders times across midnight', () => {
    expect(compareNightTimes('01:30', '23:00')).toBeGreaterThan(0);
    expect(compareNightTimes('23:00', '01:30')).toBeLessThan(0);
    expect(compareNightTimes('23:15', '23:15')).toBe(0);
  });

  it('follows economy spec §12 test 14 for shutdown and reminder limits', () => {
    // Default bedtime 01:30: bedtime − 15 min = 01:15, − 90 min = 00:00.
    const defaultShutdown = earlier('23:15', '01:15');
    expect(defaultShutdown).toBe('23:15');
    const defaultReminderLimit = earlier('00:00', defaultShutdown);
    expect(defaultReminderLimit).toBe('23:15');
    expect(compareNightTimes('23:15', defaultReminderLimit)).toBeLessThanOrEqual(0);
    expect(compareNightTimes('23:16', defaultReminderLimit)).toBeGreaterThan(0);

    // Bedtime 23:30: bedtime − 15 min = 23:15, − 90 min = 22:00.
    const earlyShutdown = earlier('23:15', '23:15');
    expect(earlyShutdown).toBe('23:15');
    const earlyReminderLimit = earlier('22:00', earlyShutdown);
    expect(earlyReminderLimit).toBe('22:00');
    expect(compareNightTimes('22:00', earlyReminderLimit)).toBeLessThanOrEqual(0);
    expect(compareNightTimes('22:01', earlyReminderLimit)).toBeGreaterThan(0);
  });
});
