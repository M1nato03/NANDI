// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHUNKS, prefetchRoute } from './prefetch';

// b2/a9 13 Nov: the next move's screen is fetched on idle. Every landing route fetches exactly one chunk, once; an
// unknown route fetches nothing; without requestIdleCallback the timeout path runs; the canceller stops it.
const LANDS = ['grow/read/chapter/psychology/psychology-ch1', 'grow/play/board/daily', 'grow/train/workout', 'plan/morning', 'you/tonight'];
const spies = () => CHUNKS.map(([pattern]) => [pattern, vi.fn(() => Promise.resolve())] as const);

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('prefetchRoute', () => {
  it('each landing route runs exactly one import, once, when the phone is idle', () => {
    for (const route of LANDS) {
      const chunks = spies();
      let idle: (() => void) | undefined;
      vi.stubGlobal('requestIdleCallback', (run: () => void) => { idle = run; return 7; });
      vi.stubGlobal('cancelIdleCallback', vi.fn());
      prefetchRoute(route, chunks);
      expect(chunks.every(([, load]) => load.mock.calls.length === 0), `${route}: nothing before idle`).toBe(true);
      idle!();
      expect(chunks.map(([, load]) => load.mock.calls.length).filter(Boolean), route).toEqual([1]);
    }
  });

  it('an unknown route is a no-op', () => {
    const chunks = spies();
    const idle = vi.fn();
    vi.stubGlobal('requestIdleCallback', idle);
    prefetchRoute('you/settings', chunks)();
    expect(idle).not.toHaveBeenCalled();
    expect(chunks.every(([, load]) => load.mock.calls.length === 0)).toBe(true);
  });

  it('without requestIdleCallback the timeout path runs, and the canceller stops it', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const ran = spies();
    prefetchRoute('grow/train/workout', ran);
    vi.advanceTimersByTime(300);
    expect(ran.map(([, load]) => load.mock.calls.length).filter(Boolean)).toEqual([1]);
    const cancelled = spies();
    prefetchRoute('grow/train/workout', cancelled)();
    vi.advanceTimersByTime(1000);
    expect(cancelled.every(([, load]) => load.mock.calls.length === 0)).toBe(true);
  });

  it('the idle canceller is the one the cleanup calls', () => {
    const cancel = vi.fn();
    vi.stubGlobal('requestIdleCallback', () => 42);
    vi.stubGlobal('cancelIdleCallback', cancel);
    prefetchRoute('plan/morning', spies())();
    expect(cancel).toHaveBeenCalledWith(42);
  });
});
