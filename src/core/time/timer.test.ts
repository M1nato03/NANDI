import { describe, expect, it } from 'vitest';
import { createTimer, pauseTimer, resumeTimer, timerElapsedMs, timerRemainingMs } from './index';

const minute = 60_000;

describe('absolute timestamp timer', () => {
  it('computes elapsed and remaining time from a supplied timestamp', () => {
    const timer = createTimer(1_000_000, 25 * minute);
    expect(timerElapsedMs(timer, 1_000_000 + 10 * minute)).toBe(10 * minute);
    expect(timerRemainingMs(timer, 1_000_000 + 10 * minute)).toBe(15 * minute);
    expect(timerElapsedMs(timer, 1_000_000 + 30 * minute)).toBe(30 * minute);
    expect(timerRemainingMs(timer, 1_000_000 + 30 * minute)).toBe(0);
  });

  it('excludes pauses, resumes, and leaves earlier states unchanged', () => {
    const started = createTimer(1_000_000, 25 * minute);
    const paused = pauseTimer(started, 1_000_000 + 5 * minute);
    expect(timerElapsedMs(paused, 1_000_000 + 12 * minute)).toBe(5 * minute);
    expect(timerRemainingMs(paused, 1_000_000 + 12 * minute)).toBe(20 * minute);
    const resumed = resumeTimer(paused, 1_000_000 + 12 * minute);
    expect(timerElapsedMs(resumed, 1_000_000 + 18 * minute)).toBe(11 * minute);
    expect(timerRemainingMs(resumed, 1_000_000 + 18 * minute)).toBe(14 * minute);
    expect(started.pauses).toEqual([]);
    expect(paused.pauses).toEqual([{ at: 1_000_000 + 5 * minute }]);
  });

  it('survives serialization and runs across the 04:00 day boundary', () => {
    const startedAt = new Date(2026, 9, 4, 3, 55).getTime();
    const timer = createTimer(startedAt, 20 * minute);
    const restored = JSON.parse(JSON.stringify(timer)) as typeof timer;
    expect(timerElapsedMs(restored, new Date(2026, 9, 4, 4, 5).getTime())).toBe(10 * minute);
    expect(timerRemainingMs(restored, new Date(2026, 9, 4, 4, 5).getTime())).toBe(10 * minute);
  });
});
