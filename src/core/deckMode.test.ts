import { describe, expect, it } from 'vitest';
import { deckMode } from './deckMode';

describe('deck selection', () => {
  it.each([
    ['2026-10-11T22:00:00', 'day'],
    ['2026-10-11T23:20:00', 'night'],
    ['2026-10-12T01:45:00', 'night'],
    ['2026-10-12T04:05:00', 'day'],
  ] as const)('selects %s as %s', (time, expected) => {
    expect(deckMode(new Date(time).getTime(), '23:15', '01:30')).toBe(expected);
  });
});
