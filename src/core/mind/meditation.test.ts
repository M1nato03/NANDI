import { describe, expect, it } from 'vitest';
import { createTimer, pauseTimer, resumeTimer } from '../time/timer';
import { meditationElapsedMs, parseMeditation, type MeditationSession } from './meditation';

const start = new Date('2026-10-13T08:00:00').getTime();
const session: MeditationSession = { ...createTimer(start, 120_000), id: 'session-a', dayKey: '2026-10-13' };

describe('meditation saved timers', () => {
  it('accepts a running timer and recomputes after time away', () => {
    expect(parseMeditation(session)).toEqual(session);
    expect(meditationElapsedMs(session, start + 40_000)).toBe(40_000);
    expect(meditationElapsedMs(session, start + 900_000)).toBe(120_000);
  });

  it('excludes pauses after reload and caps completed time', () => {
    const paused = { ...session, ...pauseTimer(session, start + 30_000) };
    expect(meditationElapsedMs(parseMeditation(paused)!, start + 900_000)).toBe(30_000);
    const resumed = { ...paused, ...resumeTimer(paused, start + 900_000) };
    const ended = { ...resumed, endedAt: start + 920_000 };
    expect(meditationElapsedMs(ended, start + 999_000)).toBe(50_000);
  });

  it('rejects malformed backups and impossible pause sequences', () => {
    for (const invalid of [null, {}, { ...session, startedAt: NaN }, { ...session, durationMs: -1 },
      { ...session, dayKey: '2026-02-31' }, { ...session, pauses: [{ at: start - 1 }] },
      { ...session, pauses: [{ at: start + 1 }, { at: start + 2 }] },
      { ...session, pauses: [{ at: start + 10, resumeAt: start + 9 }] },
      { ...session, endedAt: start - 1 }, { ...session, pauses: [{ at: start + 10 }], endedAt: start + 5 }]) {
      expect(parseMeditation(invalid)).toBeNull();
    }
  });
});
