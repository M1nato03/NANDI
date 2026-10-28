import { describe, expect, it } from 'vitest';
import { guardAppName, guardedPackages } from './focusGuard';
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
});
