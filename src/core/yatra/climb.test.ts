import { describe, expect, it } from 'vitest';
import { deriveTrek, focusEarned } from './trek';
import { deriveJar, jarActs } from './jar';
import { RAIN_LINE, weatherFor } from './weather';
import type { FocusRow, LedgerRow } from '../../data/types';
import type { Trail } from './trail';

// Spec 571 stage 2 commit 4 (b2, 8 Nov): the continuous climb draws only earned 3-min steps (nothing unearned), splits
// at 04:00 like the jar, and a guard pause is rain that leaves the trek and the jar exactly where they were.
const meta = { deleted: 0 as const, deviceId: 'test' };
let serial = 0;
const fact = (mode: string, kind: string, day: string, inputs: Record<string, unknown> = {}): LedgerRow =>
  ({ ...meta, id: `${kind}:${++serial}`, mode, kind, refId: String(serial), dayKey: day, inputs, updatedAt: new Date(`${day}T09:00:00`).getTime() + serial });
const t = (at: string) => new Date(at).getTime();
const focus = (startedAt: string, endedAt?: string, extra: Partial<FocusRow> = {}): FocusRow =>
  ({ ...meta, id: `f${++serial}`, taskId: 't', startedAt: t(startedAt), ...(endedAt ? { endedAt: t(endedAt) } : {}), updatedAt: 1, ...extra });
const trail = { id: 't', name: 'T', region: 'R', places: Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, kind: 'camp', regionLine: '' })),
  legs: Array.from({ length: 9 }, (_, i) => ({ from: `p${i}`, to: `p${i + 1}`, landmark: { id: `l${i}`, name: `L${i}`, kind: 'tree' }, constellation: `C${i}` })) } as unknown as Trail;
const FROM = '2026-11-01';
const DAY = '2026-11-08';
const climbOf = (focusRows: FocusRow[], now: string, facts: LedgerRow[] = [], today = DAY, rate: string | undefined = FROM) =>
  deriveTrek(facts, trail, FROM, today, {}, { from: FROM, focus: focusRows, focusRateFrom: rate, now: t(now) }).climb;

describe('spec 571 stage 2: the continuous climb', () => {
  it('minutes carried into the next stretch move the group: a chapter (5 min) is half a stretch', () => {
    const trek = deriveTrek([fact('read', 'chapter', DAY)], trail, FROM, DAY, {}, { from: FROM, focus: [] });
    expect(trek.stretch).toBe(0);
    expect(trek.jar.carry).toBe(5);
    expect(trek.climb).toEqual({ settled: 0.5, at: 0.5, walking: false });
    // A session (10) and a chapter (5): one stretch and a half.
    expect(deriveTrek([fact('calm', 'session', DAY), fact('read', 'chapter', DAY)], trail, FROM, DAY, {}, { from: FROM, focus: [] }).climb.settled).toBe(1.5);
  });

  it('a running focus adds only earned 3-min steps: 2:59 adds nothing, 3:00 adds one jar minute, 8:59 adds two', () => {
    const run = focus(`${DAY}T10:00:00`);
    expect(climbOf([run], `${DAY}T10:02:59`)).toEqual({ settled: 0, at: 0, walking: true, nextStepAt: t(`${DAY}T10:03:00`) });
    expect(climbOf([run], `${DAY}T10:03:00`)).toMatchObject({ at: 0.1, walking: true, nextStepAt: t(`${DAY}T10:06:00`) });
    expect(climbOf([run], `${DAY}T10:08:59`)).toMatchObject({ settled: 0, at: 0.2, nextStepAt: t(`${DAY}T10:09:00`) });
    // Settled (what the receipt and finish line read) never includes the running focus.
    expect(climbOf([run], `${DAY}T10:30:00`).settled).toBe(0);
    expect(climbOf([run], `${DAY}T10:30:00`).at).toBe(1);
  });

  it('nothing unearned is drawn: the live position equals the same focus ended at that moment, never more', () => {
    for (const minute of [0, 1, 2, 3, 4, 5, 17, 29, 30, 31, 59, 61]) {
      const now = t(`${DAY}T10:00:00`) + minute * 60_000 + 59_000;
      const live = deriveTrek([], trail, FROM, DAY, {}, { from: FROM, focus: [focus(`${DAY}T10:00:00`)], focusRateFrom: FROM, now }).climb.at;
      const ended = deriveTrek([], trail, FROM, DAY, {}, { from: FROM, focus: [{ ...focus(`${DAY}T10:00:00`), endedAt: now }], focusRateFrom: FROM }).climb.settled;
      expect(live, `minute ${minute}`).toBe(ended);
      expect(live * 10, `minute ${minute}: whole jar minutes only`).toBe(Math.floor((minute * 60 + 59) / 180));
    }
  });

  it('the day before focusRateFrom steps every full 30 min (5 jar min), not every 3', () => {
    const run = focus(`${DAY}T10:00:00`);
    expect(climbOf([run], `${DAY}T10:29:00`, [], DAY, '2026-11-09')).toMatchObject({ at: 0, nextStepAt: t(`${DAY}T10:30:00`) });
    expect(climbOf([run], `${DAY}T10:30:00`, [], DAY, '2026-11-09').at).toBe(0.5);
  });

  it('the 04:00 split: minutes before 04:00 belong to the night before, minutes after to the new day, each under its own cap', () => {
    // Yesterday already used its 60: the 10 min before 04:00 add nothing; the 9 min after add 3 to today.
    const capped = Array.from({ length: 6 }, () => fact('calm', 'session', '2026-11-07'));
    const run = focus('2026-11-08T03:50:00');
    const climb = climbOf([run], '2026-11-08T04:09:00', capped);
    const base = deriveTrek(capped, trail, FROM, DAY, {}, { from: FROM, focus: [] }).climb.settled;
    expect(base).toBe(6);
    expect(climb.at - base).toBeCloseTo(0.3, 10);
    // Without yesterday's cap the 10 min before 04:00 count for yesterday (3) and the 9 after for today (3).
    expect(climbOf([run], '2026-11-08T04:09:00').at).toBeCloseTo(0.6, 10);
    // The next step is today's: 9 min in, so the step at 12 min.
    expect(climb.nextStepAt).toBe(t('2026-11-08T04:12:00'));
  });

  it('the next move’s "+N min": what the open focus has earned so far, after the cap', () => {
    const run = focus(`${DAY}T10:00:00`);
    expect(focusEarned(climbOf([run], `${DAY}T10:02:59`))).toBe(0);
    expect(focusEarned(climbOf([run], `${DAY}T10:26:00`))).toBe(8);
    // With 55 min already in today's jar, a 30-min focus has earned only the 5 left under the cap.
    const near = [...Array.from({ length: 5 }, () => fact('calm', 'session', DAY)), fact('read', 'chapter', DAY)];
    expect(focusEarned(climbOf([run], `${DAY}T10:30:00`, near))).toBe(5);
  });

  it('stops walking when today is capped, and stands still while paused', () => {
    const full = Array.from({ length: 6 }, () => fact('calm', 'session', DAY));
    expect(climbOf([focus(`${DAY}T10:00:00`)], `${DAY}T10:30:00`, full)).toEqual({ settled: 6, at: 6, walking: false });
    const paused = focus(`${DAY}T10:00:00`, undefined, { pauses: [{ at: t(`${DAY}T10:07:00`) }] });
    expect(climbOf([paused], `${DAY}T10:40:00`)).toEqual({ settled: 0, at: 0.2, walking: false });
  });
});

describe('spec 571 stage 2 §4: trek weather from a guard pause', () => {
  const now = `${DAY}T10:20:00`;
  it('rain only while the open focus has an unresumed guard pause', () => {
    expect(weatherFor([focus(`${DAY}T10:00:00`, undefined, { pauses: [{ at: t(`${DAY}T10:10:00`), reason: 'guard', app: 'x' }] })], t(now))).toBe('rain');
    expect(weatherFor([focus(`${DAY}T10:00:00`, undefined, { pauses: [{ at: t(`${DAY}T10:10:00`), resumeAt: t(`${DAY}T10:15:00`), reason: 'guard' }] })], t(now))).toBe('clear');
    // "Still working?" and your own pause are not weather; an ended focus is not either.
    expect(weatherFor([focus(`${DAY}T10:00:00`, undefined, { pauses: [{ at: t(`${DAY}T10:10:00`), reason: 'still' }] })], t(now))).toBe('clear');
    expect(weatherFor([focus(`${DAY}T10:00:00`, undefined, { pauses: [{ at: t(`${DAY}T10:10:00`) }] })], t(now))).toBe('clear');
    expect(weatherFor([focus(`${DAY}T10:00:00`, `${DAY}T10:12:00`, { pauses: [{ at: t(`${DAY}T10:10:00`), reason: 'guard' }] })], t(now))).toBe('clear');
    expect(weatherFor([], t(now))).toBe('clear');
    expect(RAIN_LINE).toBe('Waiting out the rain. Back to focus to climb on.');
  });

  it('a guard pause leaves the trek position and the jar minutes exactly as they were at the pause', () => {
    const pausedAt = `${DAY}T10:10:00`;
    const running = focus(`${DAY}T10:00:00`);
    const rained = { ...running, pauses: [{ at: t(pausedAt), reason: 'guard' as const }] };
    const atPause = climbOf([running], pausedAt);
    for (const later of [`${DAY}T10:20:00`, `${DAY}T11:30:00`]) {
      const climb = climbOf([rained], later);
      expect(climb.at).toBe(atPause.at);
      expect(climb.walking).toBe(false);
      // Ending the rained focus later pays exactly the minutes before the pause.
      expect(deriveJar(jarActs([], [{ ...rained, endedAt: t(later) }], FROM), FROM, DAY)).toEqual(deriveJar(jarActs([], [{ ...running, endedAt: t(pausedAt) }], FROM), FROM, DAY).map(entry => ({ ...entry, at: t(later) })));
    }
  });
});
