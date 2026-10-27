import { describe, expect, it } from 'vitest';
import { doneLine, fadeApplies, intervalBells, nightStars, outBreaths, scanLine, sitMinutes, totalMs } from './session';

const MIN = 60_000;
const breath = { in: 4, out: 6 };

describe('spec 35 Calm session clock', () => {
  it('reads lengths, whole minutes and the done line', () => {
    expect(totalMs(20)).toBe(20 * MIN);
    expect(totalMs('open')).toBeNull();
    expect([sitMinutes(59_999), sitMinutes(60_000), sitMinutes(30 * MIN + 59_000)]).toEqual([0, 1, 30]);
    expect(doneLine(1)).toBe('A quiet minute, together.');
    expect(doneLine(30)).toBe('30 quiet minutes, together.');
  });

  it('spreads the six scan lines evenly over a set length, one a minute when open-ended', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(m => scanLine(m * MIN, 6))).toEqual([0, 1, 2, 3, 4, 5, 5]);
    expect(scanLine(29 * MIN, 30)).toBe(5);
    expect(scanLine(4 * MIN + 59_000, 30)).toBe(0);
    expect(scanLine(5 * MIN, 30)).toBe(1);
    expect([0, 1, 4, 5, 90].map(m => scanLine(m * MIN, 'open'))).toEqual([0, 1, 4, 5, 5]);
  });

  it('rings interval bells at 5, 10 and 15 minutes, never on the end, and none when off', () => {
    expect(intervalBells(29 * MIN, 0, 30)).toBe(0);
    expect([4, 5, 9, 10].map(m => intervalBells(m * MIN, 5, 30))).toEqual([0, 1, 1, 2]);
    expect(intervalBells(30 * MIN, 5, 30)).toBe(5);
    expect(intervalBells(30 * MIN, 10, 30)).toBe(2);
    expect(intervalBells(20 * MIN, 15, 'open')).toBe(1);
  });

  it('fades the guide only in a paced sit of 10 minutes or more with the toggle on', () => {
    expect(fadeApplies('paced', 10, true)).toBe(true);
    expect(fadeApplies('paced', 'open', true)).toBe(true);
    expect(fadeApplies('paced', 5, true)).toBe(false);
    expect(fadeApplies('paced', 30, false)).toBe(false);
    expect(fadeApplies('quiet', 30, true)).toBe(false);
  });

  it('brightens night stars per out-breath, per line or bell, or per minute when bells are off', () => {
    expect([3_999, 4_000, 14_000].map(ms => outBreaths(ms, breath))).toEqual([0, 1, 2]);
    expect(nightStars({ way: 'paced', elapsedMs: 14_000, length: 5, breath, interval: 0, fade: true })).toBe(2);
    expect(nightStars({ way: 'scan', elapsedMs: 12 * MIN, length: 30, breath, interval: 5, fade: true })).toBe(2 + 2);
    expect(nightStars({ way: 'quiet', elapsedMs: 7 * MIN, length: 30, breath, interval: 0, fade: true })).toBe(7);
    expect(nightStars({ way: 'quiet', elapsedMs: 11 * MIN, length: 30, breath, interval: 5, fade: true })).toBe(2);
    // A faded paced sit: the out-breaths of its first 3 minutes, then one a minute.
    expect(nightStars({ way: 'paced', elapsedMs: 5 * MIN, length: 20, breath, interval: 0, fade: true })).toBe(outBreaths(3 * MIN, breath) + 2);
  });
});
