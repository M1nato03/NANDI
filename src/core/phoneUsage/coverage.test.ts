import { describe, expect, it } from 'vitest';
import type { GuardEvent } from '../focusGuard';
import { addCalendarDays, calendarBounds, calendarDayKey, calendarWeekday } from './calendarDay';
import { judgeDay, MISMATCH_MIN_MS, REACH_MS, settled, type DayEvidence } from './coverage';
import { GAP_MS, LEAD_MS, measureDay } from './measure';

const MIN = 60_000, HOUR = 60 * MIN;
const IG = 'com.instagram.android', YT = 'com.google.android.youtube';
const { fromMs, toMs } = calendarBounds('2026-11-10');
const at = (hours: number) => fromMs + hours * HOUR;
const fg = (time: number, pkg = IG, cls = 'Main'): GuardEvent => ({ type: 'fg', at: time, pkg, cls });
const bg = (time: number, pkg = IG, cls = 'Main'): GuardEvent => ({ type: 'bg', at: time, pkg, cls });
const ev = (type: GuardEvent['type'], time: number): GuardEvent => ({ type, at: time });
/** A screen-off the night before: the state at midnight is known. */
const night = ev('off', at(-2));
const measure = (events: GuardEvent[]) => measureDay(events, fromMs - LEAD_MS, fromMs, toMs, [IG, YT]);
const evidence = (change: Partial<DayEvidence> = {}): DayEvidence => ({ access: true, logStart: fromMs - LEAD_MS + MIN, fromMs, boundaryKnown: true, rebootAmbiguous: false, gap: false, clockChanged: false, zoneChanged: false, ms: 0, crossCheckMs: null, ...change });

describe('spec 46a: the calendar day', () => {
  it('runs midnight to midnight in local time, not from 04:00', () => {
    expect(new Date(fromMs).getHours()).toBe(0);
    expect(toMs - fromMs).toBe(24 * HOUR);
    expect(calendarDayKey(fromMs)).toBe('2026-11-10');
    expect(calendarDayKey(toMs - 1)).toBe('2026-11-10');
    // 03:00 is NANDI's previous planning day but this calendar day.
    expect(calendarDayKey(at(3))).toBe('2026-11-10');
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(calendarWeekday('2026-11-10')).toBe(2);
  });
  it('a clock-change day keeps its true length (23 or 25 hours) and both offsets', () => {
    // Node reads TZ afresh when it changes; the app's own types have no `process`.
    const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
    const zone = env.TZ;
    env.TZ = 'Europe/London';
    try {
      const spring = calendarBounds('2026-03-29');
      expect(spring.toMs - spring.fromMs).toBe(23 * HOUR);
      expect([spring.offsetStartMin, spring.offsetEndMin]).toEqual([0, 60]);
      const autumn = calendarBounds('2026-10-25');
      expect(autumn.toMs - autumn.fromMs).toBe(25 * HOUR);
    } finally { if (zone === undefined) delete env.TZ; else env.TZ = zone; }
  });
});

describe('spec 46a: measuring one day', () => {
  it('sums raw milliseconds for each app, and a quiet day is a real zero', () => {
    const day = measure([night, ev('on', at(9)), fg(at(9)), bg(at(9) + 90_500), fg(at(20)), bg(at(20) + 30_250)]);
    expect(day.ms[IG]).toBe(120_750);
    expect(day.ms[YT]).toBe(0);
    expect(day.boundaryKnown).toBe(true);
  });
  it('counts an app open across midnight only from midnight, and one open at the end only to midnight', () => {
    const day = measure([night, ev('on', at(-1)), fg(at(-0.5)), bg(at(0.25)), fg(at(23.5))]);
    expect(day.ms[IG]).toBe(0.25 * HOUR + 0.5 * HOUR);
  });
  it('pauses on screen-off and lock, and counts two apps in front at once separately', () => {
    const day = measure([night, ev('on', at(10)), fg(at(10)), fg(at(10), YT, 'Pip'), ev('lock', at(11)), ev('on', at(12)), bg(at(12.5)), bg(at(12.5), YT, 'Pip')]);
    expect(day.ms[IG]).toBe(1.5 * HOUR);
    expect(day.ms[YT]).toBe(1.5 * HOUR);
  });
  it('does not know what was open at midnight without a screen-off, lock, start-up or shutdown before it', () => {
    expect(measure([fg(at(9)), bg(at(10))]).boundaryKnown).toBe(false);
  });
  it('a start-up with no shutdown before it (the phone died) leaves the open app unknown; a clean restart does not', () => {
    const died = measure([night, ev('on', at(9)), fg(at(9)), ev('boot', at(11))]);
    expect(died.rebootAmbiguous).toEqual([IG]);
    const clean = measure([night, ev('on', at(9)), fg(at(9)), ev('down', at(10)), ev('boot', at(11))]);
    expect(clean.rebootAmbiguous).toEqual([]);
    expect(clean.ms[IG]).toBe(HOUR);
  });
  it('an app in front through a long silence in the log is a gap', () => {
    expect(measure([night, ev('on', at(9)), fg(at(9)), bg(at(9) + GAP_MS + MIN)]).gaps).toEqual([IG]);
    expect(measure([night, ev('on', at(9)), fg(at(9)), bg(at(9) + GAP_MS - MIN)]).gaps).toEqual([]);
  });
});

describe('spec 46a: when a day can be trusted', () => {
  it('a complete zero is written only when every check passes', () => {
    expect(judgeDay(evidence())).toEqual({ foregroundMs: 0 });
  });
  it('anything else is unknown, never zero, with its reason', () => {
    expect(judgeDay(evidence({ access: false }))).toEqual({ foregroundMs: null, reason: 'no_access' });
    expect(judgeDay(evidence({ logStart: null })).reason).toBe('short_history');
    expect(judgeDay(evidence({ logStart: fromMs + MIN })).reason).toBe('short_history');
    expect(judgeDay(evidence({ boundaryKnown: false })).reason).toBe('boundary_unknown');
    expect(judgeDay(evidence({ rebootAmbiguous: true })).reason).toBe('reboot_ambiguous');
    expect(judgeDay(evidence({ gap: true })).reason).toBe('event_gap');
    expect(judgeDay(evidence({ clockChanged: true })).reason).toBe('clock_change');
    expect(judgeDay(evidence({ zoneChanged: true })).reason).toBe('timezone_change');
    for (const change of [{ access: false }, { logStart: null }, { gap: true }] as const) expect(judgeDay(evidence(change)).foregroundMs).toBeNull();
  });
  it("Android's own total only fails a day when it shows more than the events did (an undercount could look like a better week)", () => {
    expect(judgeDay(evidence({ ms: 60 * MIN, crossCheckMs: 60 * MIN + MISMATCH_MIN_MS + MIN })).reason).toBe('mismatch');
    expect(judgeDay(evidence({ ms: 60 * MIN, crossCheckMs: 60 * MIN + MISMATCH_MIN_MS - MIN }))).toEqual({ foregroundMs: 60 * MIN });
    expect(judgeDay(evidence({ ms: 60 * MIN, crossCheckMs: 10 * MIN }))).toEqual({ foregroundMs: 60 * MIN });
  });
  it('a measured or clock-moved day is settled; another unknown is read again while the log reaches it', () => {
    const now = toMs + HOUR;
    expect(settled({ foregroundMs: 0, fromMs }, now)).toBe(true);
    expect(settled({ foregroundMs: null, reason: 'clock_change', fromMs }, now)).toBe(true);
    expect(settled({ foregroundMs: null, reason: 'no_access', fromMs }, now)).toBe(false);
    expect(settled({ foregroundMs: null, reason: 'no_access', fromMs }, fromMs + REACH_MS + 1)).toBe(true);
  });
});
