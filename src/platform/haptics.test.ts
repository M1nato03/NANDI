// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tapHaptic } from './haptics';

// Economy review 32, F3: Motion off, in NANDI or on the phone, also turns off the decorative taps.
const vibrate = vi.fn(() => true);
const media = (reduce: boolean) => Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: reduce }) });

beforeEach(() => {
  vibrate.mockClear();
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
  delete document.documentElement.dataset.motion;
  media(false);
});
afterEach(() => { delete document.documentElement.dataset.motion; });

describe('tap haptics', () => {
  it('taps when on and motion is allowed', async () => {
    await tapHaptic(true);
    expect(vibrate).toHaveBeenCalledWith(20);
  });
  it('stays still when switched off', async () => {
    await tapHaptic(false);
    expect(vibrate).not.toHaveBeenCalled();
  });
  it('stays still with Motion off in NANDI', async () => {
    document.documentElement.dataset.motion = 'reduce';
    await tapHaptic(true);
    expect(vibrate).not.toHaveBeenCalled();
  });
  it('stays still when the phone asks for reduced motion', async () => {
    media(true);
    await tapHaptic(true, [30, 50, 30]);
    expect(vibrate).not.toHaveBeenCalled();
  });
});
