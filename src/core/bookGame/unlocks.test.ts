import { describe, expect, it } from 'vitest';
import { BABYLON_GAME, chaptersDone, monthLock, newMonthsAt, yearProgress } from './unlocks';

const done = (...modules: string[]) => new Set(modules.map(m => `richest-man-in-babylon:${m}`));
const played = (...months: number[]) => new Set(months);

describe('spec 40 unlocks: count-based pacing blocks (b2 11 Nov)', () => {
  it('no chapter done: every month locked with a plain line, 0 of 12', () => {
    for (let m = 0; m < 12; m++) {
      const lock = monthLock(m, 0, played());
      expect(lock.open, `month ${m}`).toBe(false);
      if (!lock.open) expect(lock.reason).toMatch(/^Finish (a chapter|\d chapters) of the book to open [A-Z][a-z]{2}\.$/);
    }
    expect(yearProgress(0, played())).toEqual({ opened: [], next: null, playedCount: 0 });
  });

  it('N chapters open the first N blocks: 1 → Jan-Mar, 2 → +Apr-May, 3 → +Jun-Aug, 4 → +Sep-Oct, 5 → +Nov-Dec', () => {
    expect(yearProgress(1, played()).opened).toEqual([0, 1, 2]);
    expect(yearProgress(2, played()).opened).toEqual([0, 1, 2, 3, 4]);
    expect(yearProgress(3, played()).opened).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(yearProgress(4, played()).opened).toHaveLength(10);
    expect(yearProgress(5, played()).opened).toHaveLength(12);
  });

  it('count, not which: finishing chapter 3 alone opens Jan-Mar, not Jun-Aug', () => {
    const n = chaptersDone(BABYLON_GAME, done('babylon-3'));
    expect(n).toBe(1);
    expect(monthLock(0, n, played()).open).toBe(true);
    expect(monthLock(5, n, played()).open).toBe(false);
  });

  it('calendar order inside the open months: Feb needs Jan played', () => {
    expect(monthLock(1, 1, played())).toEqual({ open: false, reason: 'Play Jan first. Each month carries into the next.' });
    expect(monthLock(1, 1, played(0)).open).toBe(true);
    expect(yearProgress(1, played(0)).next).toBe(1);
    expect(yearProgress(1, played(0, 1, 2)).next).toBeNull();
  });

  it('a played month never relocks (nothing is stored; the count only grows with chapter facts)', () => {
    expect(monthLock(2, 1, played(0, 1)).open).toBe(true);
    expect(monthLock(2, 5, played(0, 1)).open).toBe(true);
  });

  it('the chapter-done link names the block that chapter count just opened', () => {
    expect(newMonthsAt(1)).toEqual([0, 1, 2]);
    expect(newMonthsAt(2)).toEqual([3, 4]);
    expect(newMonthsAt(6)).toEqual([]);
  });
});
