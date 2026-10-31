import { describe, expect, it } from 'vitest';
import { AGAIN_WINDOW_MS, BODY_CUES, cueFor, openerDue, openerStage, roundMs, squareAt } from './squareBreath';
import { dayKey } from '../time/dayKey';

describe('spec 45a square breath', () => {
  it('with holds: in 5, hold 5, out 5, hold 5; boundaries move to the next side', () => {
    expect(roundMs(true)).toBe(20_000);
    expect(squareAt(0, true)).toMatchObject({ round: 0, phase: { kind: 'in', side: 0 }, count: 5 });
    expect(squareAt(4_999, true)).toMatchObject({ phase: { kind: 'in' }, count: 1 });
    expect(squareAt(5_000, true)).toMatchObject({ phase: { kind: 'hold', side: 1 }, count: 5 });
    expect(squareAt(10_000, true)).toMatchObject({ phase: { kind: 'out', side: 2 } });
    expect(squareAt(15_000, true)).toMatchObject({ phase: { kind: 'hold-out', side: 3, label: 'Hold' } });
    expect(squareAt(20_000, true)).toMatchObject({ round: 1, phase: { kind: 'in' }, intoMs: 0 });
  });

  it('without holds: in 5, out 6 on the top and bottom sides only', () => {
    expect(roundMs(false)).toBe(11_000);
    expect(squareAt(4_999, false)).toMatchObject({ phase: { kind: 'in', side: 0 } });
    expect(squareAt(5_000, false)).toMatchObject({ phase: { kind: 'out', side: 2 }, count: 6 });
    expect(squareAt(10_999, false)).toMatchObject({ phase: { kind: 'out' }, count: 1 });
    expect(squareAt(11_000, false)).toMatchObject({ round: 1, phase: { kind: 'in' } });
  });

  it('the cue changes once a round, in order, and comes round again', () => {
    expect([0, 1, 2, 3, 4].map(cueFor)).toEqual([...BODY_CUES, BODY_CUES[0]]);
  });

  it('the opener runs two rounds, offers one more for three seconds, then leaves', () => {
    expect(openerStage(0, true, null)).toEqual({ stage: 'breath', breathMs: 0, round: 0 });
    expect(openerStage(39_999, true, null)).toMatchObject({ stage: 'breath', round: 1 });
    expect(openerStage(40_000, true, null)).toEqual({ stage: 'again', leftMs: AGAIN_WINDOW_MS });
    expect(openerStage(42_999, true, null)).toEqual({ stage: 'again', leftMs: 1 });
    expect(openerStage(43_000, true, null)).toEqual({ stage: 'done' });
    expect(openerStage(22_000, false, null)).toMatchObject({ stage: 'again' });
  });

  it('one more round is exactly one round from the press, with the third cue', () => {
    expect(openerStage(41_000, true, 41_000)).toEqual({ stage: 'breath', breathMs: 0, round: 2 });
    expect(openerStage(60_999, true, 41_000)).toMatchObject({ stage: 'breath', round: 2 });
    expect(openerStage(61_000, true, 41_000)).toEqual({ stage: 'done' });
    expect(openerStage(23_500, false, 22_500)).toMatchObject({ stage: 'breath', breathMs: 1_000 });
    expect(openerStage(33_500, false, 22_500)).toEqual({ stage: 'done' });
  });

  it('once a planning day: the 04:00 boundary is a new day, and a suppressed open shows nothing', () => {
    const before = dayKey(new Date('2026-10-31T03:59:00').getTime()), after = dayKey(new Date('2026-10-31T04:00:00').getTime());
    expect(before).not.toBe(after);
    expect(openerDue({ mode: 'daily', today: after, lastShownDay: before, ordinary: true })).toBe(true);
    expect(openerDue({ mode: 'daily', today: before, lastShownDay: before, ordinary: true })).toBe(false);
    expect(openerDue({ mode: 'daily', today: after, lastShownDay: null, ordinary: false })).toBe(false);
    expect(openerDue({ mode: 'every', today: after, lastShownDay: after, ordinary: true })).toBe(true);
    expect(openerDue({ mode: 'every', today: after, lastShownDay: after, ordinary: false })).toBe(false);
    expect(openerDue({ mode: 'off', today: after, lastShownDay: null, ordinary: true })).toBe(false);
  });
});
