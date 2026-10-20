import { describe, expect, it } from 'vitest';
import { pauseCardCopy, pauseWindowActive, pauseWindowTimes, readDayLimit, readDayMode, shouldShowNightPause } from './nightPause';

describe('Night pause decision', () => {
  it('starts 30 minutes before bedtime and ends at 04:00', () => {
    expect(pauseWindowActive(new Date(2026, 9, 16, 22, 59), '23:30')).toBe(false);
    expect(pauseWindowActive(new Date(2026, 9, 16, 23, 0), '23:30')).toBe(true);
    expect(pauseWindowActive(new Date(2026, 9, 17, 3, 59), '23:30')).toBe(true);
    expect(pauseWindowActive(new Date(2026, 9, 17, 4, 0), '23:30')).toBe(false);
  });
  it('reads the daytime choice with a 30-minute limit by default', () => {
    expect(readDayMode(undefined)).toBe('limit');
    expect(readDayMode('open')).toBe('open');
    expect(readDayMode('weird')).toBe('limit');
    expect(readDayLimit(undefined)).toBe(30);
    expect(readDayLimit(45)).toBe(45);
    expect(readDayLimit(7)).toBe(30);
  });
  it('words the card by why it opened', () => {
    const base = { minutes: 0, label: 'Instagram', planText: 'If I reach for one more scroll, then I read 5 pages.' };
    const night = pauseCardCopy({ ...base, reason: 'night' });
    expect(night.lead).toBe(base.planText);
    expect(night.swaps.map(swap => swap.route)).toEqual(['night', 'mind/reviews', 'close']);
    expect(pauseCardCopy({ ...base, reason: 'open' }).lead).toBe('You opened Instagram. Take a breath and choose on purpose.');
    const limit = pauseCardCopy({ ...base, reason: 'limit', minutes: 34 });
    expect(limit.lead).toBe('34 minutes in your chosen apps today. Is the next scroll worth it?');
    expect(limit.swaps.map(swap => swap.label)).toEqual(['A 2-minute puzzle', 'One review card', 'Back to my day']);
    const withInterest = pauseCardCopy({ ...base, reason: 'open', suggestion: 'Watch one episode, then stop' });
    expect(withInterest.swaps[1]).toEqual({ label: 'Watch one episode, then stop', route: 'close' });
  });
  it('names the window as clock times, across midnight too', () => {
    expect(pauseWindowTimes('01:30')).toEqual({ start: '01:00', end: '04:00' });
    expect(pauseWindowTimes('23:30')).toEqual({ start: '23:00', end: '04:00' });
    expect(pauseWindowTimes('00:15')).toEqual({ start: '23:45', end: '04:00' });
  });
  it('requires opt-in, permission, screen, selected foreground app, and a new app entry', () => {
    const base = { enabled: true, usageAllowed: true, screenOn: true, now: new Date(2026, 9, 16, 23, 10), bedtime: '23:30', foregroundPackage: 'com.instagram.android', selectedPackages: ['com.instagram.android'] };
    expect(shouldShowNightPause(base)).toBe(true);
    for (const change of [{ enabled: false }, { usageAllowed: false }, { screenOn: false }, { foregroundPackage: 'com.other' }, { lastPromptPackage: 'com.instagram.android' }]) {
      expect(shouldShowNightPause({ ...base, ...change })).toBe(false);
    }
  });
});
