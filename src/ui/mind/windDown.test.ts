// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { trackWindDownTime } from './windDown';

it('flushes visible active time on hide, pagehide and leave without counting hidden time', () => {
  let now = 1000;
  let visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  const saved = vi.fn();
  const leave = trackWindDownTime(saved, 0, 600_000, () => now);
  now = 4000;
  visibility = 'hidden';
  document.dispatchEvent(new Event('visibilitychange'));
  expect(saved).toHaveBeenLastCalledWith(3000, 4000);
  now = 9000;
  window.dispatchEvent(new Event('pagehide'));
  expect(saved).toHaveBeenCalledTimes(1);
  visibility = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  now = 11_000;
  leave();
  expect(saved).toHaveBeenLastCalledWith(5000, 11_000);
});
