import { describe, expect, it } from 'vitest';
import { distractedWithin, guardAppName, guardedPackages, guardedSpans, type GuardEvent } from './focusGuard';
import { stillWorking } from './tasks/focus';
import { cleanBlocks } from './economy/effort';
import type { FocusRow } from '../data/types';

const MIN = 60_000;
const focus = (extra: Partial<FocusRow> = {}) => ({ id: 'f', taskId: 't', startedAt: 0, updatedAt: 0, deleted: 0, deviceId: 'x', ...extra }) as FocusRow;

describe('spec 36 focus guard', () => {
  it('guards the fixed six apps and the Night picks, and nothing else (a calculator never pauses a focus)', () => {
    const list = guardedPackages(['com.reddit.frontpage', 'com.instagram.android', 'bad package']);
    expect(list).toEqual(expect.arrayContaining(['com.instagram.android', 'com.google.android.youtube', 'com.snapchat.android', 'com.facebook.katana', 'com.twitter.android', 'com.instagram.barcelona', 'com.reddit.frontpage']));
    expect(list).toHaveLength(7);
    expect(list).not.toContain('com.google.android.calculator');
    expect(guardedPackages(undefined)).toHaveLength(6);
    expect([guardAppName('com.instagram.android'), guardAppName('com.twitter.android'), guardAppName('com.reddit.frontpage')]).toEqual(['Instagram', 'X', 'frontpage']);
  });

  it('"Still working?" asks 60 minutes after the last touch and pauses at the question after 5 more', () => {
    expect(stillWorking(focus(), 59 * MIN, 60, 5)).toEqual({ ask: false });
    expect(stillWorking(focus(), 61 * MIN, 60, 5)).toEqual({ ask: true });
    expect(stillWorking(focus(), 66 * MIN, 60, 5)).toEqual({ ask: false, pauseAt: 60 * MIN });
    // A tap at 61 minutes moves the question on; a resume counts as a touch too.
    expect(stillWorking(focus({ touchedAt: 61 * MIN }), 100 * MIN, 60, 5)).toEqual({ ask: false });
    expect(stillWorking(focus({ pauses: [{ at: 10 * MIN, resumeAt: 50 * MIN }] }), 100 * MIN, 60, 5)).toEqual({ ask: false });
    // A focus in pause asks nothing.
    expect(stillWorking(focus({ pauses: [{ at: 10 * MIN }] }), 200 * MIN, 60, 5)).toEqual({ ask: false });
  });

  it('a short visit to a guarded app breaks the clean block it falls in', () => {
    expect(cleanBlocks({ startedAt: 0, endedAt: 60 * MIN }, 60 * MIN, 25)).toBe(2);
    expect(cleanBlocks({ startedAt: 0, endedAt: 60 * MIN }, 60 * MIN, 25, [[20 * MIN, 21 * MIN]])).toBe(1);
    expect(cleanBlocks({ startedAt: 0, endedAt: 60 * MIN }, 60 * MIN, 25, [[5 * MIN, 6 * MIN], [40 * MIN, 41 * MIN]])).toBe(1);
    expect(cleanBlocks({ startedAt: 0, endedAt: 60 * MIN }, 60 * MIN, 25, [[20 * MIN, 21 * MIN], [40 * MIN, 41 * MIN]])).toBe(0);
  });

  it("reads distracted time from Android's own log, so a watcher the phone stopped cannot make it pay", () => {
    const pkgs = guardedPackages(undefined);
    // Focus from 0 to 60 min. The watcher was killed at 10 min; the log still has Instagram 20-40 min, a calculator
    // 45-50, and YouTube 52 min until the screen went off at 55.
    const log: GuardEvent[] = [
      { type: 'fg', at: 20 * MIN, pkg: 'com.instagram.android', cls: 'Main' }, { type: 'bg', at: 40 * MIN, pkg: 'com.instagram.android', cls: 'Main' },
      { type: 'fg', at: 45 * MIN, pkg: 'com.google.android.calculator', cls: 'C' }, { type: 'bg', at: 50 * MIN, pkg: 'com.google.android.calculator', cls: 'C' },
      { type: 'fg', at: 52 * MIN, pkg: 'com.google.android.youtube', cls: 'W' }, { type: 'off', at: 55 * MIN },
    ];
    const spans = guardedSpans(log, 0, 60 * MIN, pkgs);
    expect(spans).toEqual([[20 * MIN, 40 * MIN], [52 * MIN, 55 * MIN]]);
    expect(distractedWithin(spans, { startedAt: 0 }, 60 * MIN)).toBe(23 * MIN);
    // A stretch the focus spent paused is not focus time, so it is not taken off twice.
    expect(distractedWithin(spans, { startedAt: 0, pauses: [{ at: 20 * MIN, resumeAt: 40 * MIN }] }, 60 * MIN)).toBe(3 * MIN);
    // An app still in front at the end counts up to then.
    expect(guardedSpans([{ type: 'fg', at: 5 * MIN, pkg: 'com.snapchat.android' }], 0, 9 * MIN, pkgs)).toEqual([[5 * MIN, 9 * MIN]]);
  });
});
