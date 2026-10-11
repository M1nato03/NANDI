import { expect, it } from 'vitest';
import { economyVisible, nightMindNote } from './economyVisibility';

it('keeps economy copy hidden until economyVisibleFrom is reached', () => {
  expect(economyVisible([], '2026-10-11')).toBe(false);
  const row = { key: 'economyVisibleFrom', value: '2026-10-12', updatedAt: 1, deleted: 0 as const, deviceId: 'test' };
  expect(economyVisible([row], '2026-10-11')).toBe(false);
  expect(economyVisible([row], '2026-10-12')).toBe(true);
  expect(nightMindNote(false)).toBe('Mind is resting for the night.');
  expect(nightMindNote(false)).not.toMatch(/XP|rank|level/i);
});
