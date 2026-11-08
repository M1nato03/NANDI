import { expect, it } from 'vitest';
import { minutesLabel, NBSP } from './units';

it('a number and "min" are joined by a no-break space, so they never split across lines', () => {
  expect(NBSP).toBe(' ');
  expect(minutesLabel(10)).toBe('10 min');
  expect(minutesLabel(0)).toBe('0 min');
  expect(minutesLabel(10)).not.toContain(' ');
  // Still reads as "10 min" once spaces are normalised (screen readers, copy-paste).
  expect(minutesLabel(45).replace(/\s/g, ' ')).toBe('45 min');
});
