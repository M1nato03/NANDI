import { expect, it } from 'vitest';
import { minutesLabel, NBSP } from './units';

it('a number and "min" are joined by a no-break space, so they never split across lines', () => {
  expect(NBSP).toBe('\u00a0');
  expect(minutesLabel(10)).toBe('10\u00a0min');
  expect(minutesLabel(0)).toBe('0\u00a0min');
  expect(minutesLabel(10)).not.toContain(' ');
  // Still reads as "10 min" once spaces are normalised (screen readers, copy-paste).
  expect(minutesLabel(45).replace(/\s/g, ' ')).toBe('45 min');
});
