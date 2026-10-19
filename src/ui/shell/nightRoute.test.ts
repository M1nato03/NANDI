import { expect, it } from 'vitest';
import { nightRouteTime, nightRouteTransition } from './nightRoute';

it('opens at shutdown and closes at 04:00 while the app remains open', () => {
  const at = (hour: number, minute: number) => new Date(2026, 9, 18, hour, minute).getTime();
  expect(nightRouteTime(at(23, 39), '23:40')).toBe(false);
  expect(nightRouteTime(at(23, 40), '23:40')).toBe(true);
  expect(nightRouteTime(at(3, 59), '23:40')).toBe(true);
  expect(nightRouteTime(at(4, 0), '23:40')).toBe(false);
  expect(nightRouteTransition(false, true, 'plan')).toBe('night');
  expect(nightRouteTransition(true, false, 'night')).toBe('plan');
  expect(nightRouteTransition(true, true, 'plan')).toBeNull(); // Leaving the overlay is respected until the next boundary.
});
