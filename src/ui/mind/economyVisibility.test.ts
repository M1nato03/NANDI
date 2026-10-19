import { expect, it } from 'vitest';
import { economyVisible, nightMindNote } from './economyVisibility';

it('shows the economy by default and respects an explicit future visibility date', () => {
  expect(economyVisible([], '2026-10-11')).toBe(true);
  const row = { key: 'economyVisibleFrom', value: '2026-10-12', updatedAt: 1, deleted: 0 as const, deviceId: 'test' };
  expect(economyVisible([row], '2026-10-11')).toBe(false);
  expect(economyVisible([row], '2026-10-12')).toBe(true);
  expect(nightMindNote(true)).toBe('After bedtime, Mind earns 0 XP.');
});
