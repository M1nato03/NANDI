import { describe, expect, it } from 'vitest';
import { dayBounds, daysToRead, LEAD_MS, opensDay, openSpans, summarizeOpens, type OpensDay, type OpensLog } from './pauseOpens';
import type { GuardEvent } from './focusGuard';
import type { LedgerRow } from '../data/types';

const IG = 'com.instagram.android';
const YT = 'com.google.android.youtube';
const at = (day: string, clock: string) => new Date(`${day}T${clock}`).getTime();
const fg = (when: number, pkg: string): GuardEvent => ({ type: 'fg', at: when, pkg, cls: 'Main' });
const bg = (when: number, pkg: string): GuardEvent => ({ type: 'bg', at: when, pkg, cls: 'Main' });
const DAY = '2026-11-04';
const { fromMs } = dayBounds(DAY);
const readFrom = fromMs - LEAD_MS;
const day = (opens: number, minutes: number, whole = true, covered = true): OpensDay => ({ apps: { [IG]: { opens, ms: minutes * 60_000 } }, anyway: { count: 0, ms: 0 }, whole, covered });

describe('the opens log (spec 39)', () => {
  it('joins stretches under 30 s apart into one open and cuts an open that began before 04:00', () => {
    const events = [
      fg(at(DAY, '03:50:00'), IG), bg(at(DAY, '04:10:00'), IG),
      fg(at(DAY, '12:00:00'), IG), bg(at(DAY, '12:05:00'), IG), fg(at(DAY, '12:05:20'), IG), bg(at(DAY, '12:08:00'), IG),
      fg(at(DAY, '13:00:00'), IG), bg(at(DAY, '13:01:00'), IG),
    ];
    expect(openSpans(events, readFrom, fromMs, at(DAY, '23:00:00'), IG)).toEqual([
      [fromMs, at(DAY, '04:10:00')],
      [at(DAY, '12:00:00'), at(DAY, '12:08:00')],
      [at(DAY, '13:00:00'), at(DAY, '13:01:00')],
    ]);
  });

  it('counts a day per app: opens begun that day, minutes in front, the screen off ends a stretch', () => {
    const events: GuardEvent[] = [
      { type: 'on', at: at('2026-11-03', '20:00:00') },
      fg(at(DAY, '03:50:00'), IG), bg(at(DAY, '04:10:00'), IG),
      fg(at(DAY, '09:00:00'), YT), { type: 'off', at: at(DAY, '09:10:00') }, { type: 'on', at: at(DAY, '11:00:00') }, bg(at(DAY, '11:00:05'), YT),
      fg(at(DAY, '12:00:00'), IG), bg(at(DAY, '12:30:00'), IG),
      fg(at(DAY, '15:00:00'), 'com.whatsapp'), bg(at(DAY, '15:20:00'), 'com.whatsapp'),
    ];
    const result = opensDay(events, DAY, readFrom, at(DAY, '23:00:00'), [IG, YT], [], false);
    expect(result.apps[IG]).toEqual({ opens: 1, ms: 40 * 60_000 });
    expect(result.apps[YT]).toEqual({ opens: 2, ms: 10 * 60_000 + 5_000 });
    expect(result.apps['com.whatsapp']).toBeUndefined();
    expect(result.covered).toBe(true);
    expect(result.whole).toBe(false);
  });

  it('a day the phone log does not reach back before is not covered', () => {
    expect(opensDay([fg(at(DAY, '12:00:00'), IG), bg(at(DAY, '12:01:00'), IG)], DAY, readFrom, at(DAY, '23:00:00'), [IG], [], true).covered).toBe(false);
  });

  it('keeps the minutes in the app after each "Open anyway"', () => {
    const tap = at(DAY, '12:00:00');
    const row = (outcome: string, when: number): LedgerRow => ({ id: `pause-attempt:${when}`, dayKey: DAY, mode: 'pause', kind: 'attempt', refId: String(when), inputs: { packageName: IG, outcome }, updatedAt: when, deleted: 0, deviceId: 'd' });
    const events = [fg(tap + 2_000, IG), bg(tap + 8 * 60_000, IG), fg(at(DAY, '14:00:00'), IG), bg(at(DAY, '14:30:00'), IG)];
    const result = opensDay(events, DAY, readFrom, at(DAY, '23:00:00'), [IG], [row('opened_anyway', tap), row('backed_out', at(DAY, '13:00:00'))], false);
    expect(result.anyway).toEqual({ count: 1, ms: 8 * 60_000 - 2_000 });
  });

  it('reads the week before when it starts, then only days not read in full', () => {
    expect(daysToRead(null, DAY)).toEqual(['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', DAY]);
    const log: OpensLog = { since: '2026-11-03', days: { '2026-10-27': day(1, 1), '2026-10-28': day(1, 1), '2026-11-02': day(1, 1), '2026-11-03': day(1, 1, false) } };
    expect(daysToRead(log, DAY)).toEqual(['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-03', DAY]);
  });

  it('sums the picked apps: the week before needs 3 covered days, the last 7 days count whole ones since it began', () => {
    const log: OpensLog = { since: '2026-11-02', days: {
      '2026-10-30': day(10, 60), '2026-10-31': day(14, 100), '2026-11-01': day(12, 80), '2026-10-29': day(2, 2, true, false),
      '2026-11-02': day(8, 40), '2026-11-03': day(6, 30), [DAY]: day(3, 12, false),
    } };
    const summary = summarizeOpens(log, [IG], DAY);
    expect(summary.today).toEqual({ opens: 3, ms: 12 * 60_000 });
    expect(summary.before).toEqual({ opens: 12, ms: 80 * 60_000, days: 3 });
    expect(summary.lately).toEqual({ opens: 7, ms: 35 * 60_000, days: 2 });
    expect(summarizeOpens({ ...log, days: { [DAY]: day(3, 12, false) } }, [IG], DAY).before).toBeNull();
    expect(summarizeOpens(log, [YT], DAY).today).toEqual({ opens: 0, ms: 0 });
  });
});
