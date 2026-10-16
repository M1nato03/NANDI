import { describe, expect, it } from 'vitest';
import { pauseWindowActive, shouldShowNightPause } from './nightPause';

describe('Night pause decision', () => {
  it('starts 30 minutes before bedtime and ends at 04:00', () => {
    expect(pauseWindowActive(new Date(2026, 9, 16, 22, 59), '23:30')).toBe(false);
    expect(pauseWindowActive(new Date(2026, 9, 16, 23, 0), '23:30')).toBe(true);
    expect(pauseWindowActive(new Date(2026, 9, 17, 3, 59), '23:30')).toBe(true);
    expect(pauseWindowActive(new Date(2026, 9, 17, 4, 0), '23:30')).toBe(false);
  });
  it('requires opt-in, permission, screen, selected foreground app, and a new app entry', () => {
    const base = { enabled: true, usageAllowed: true, screenOn: true, now: new Date(2026, 9, 16, 23, 10), bedtime: '23:30', foregroundPackage: 'com.instagram.android', selectedPackages: ['com.instagram.android'] };
    expect(shouldShowNightPause(base)).toBe(true);
    for (const change of [{ enabled: false }, { usageAllowed: false }, { screenOn: false }, { foregroundPackage: 'com.other' }, { lastPromptPackage: 'com.instagram.android' }]) {
      expect(shouldShowNightPause({ ...base, ...change })).toBe(false);
    }
  });
});
