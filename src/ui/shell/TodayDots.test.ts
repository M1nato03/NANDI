import { expect, it } from 'vitest';
import { featuredSpec } from '../../core/puzzles/daily';
import { dayKey } from '../../core/time/dayKey';
import type { LearnDropRow, LedgerRow, PuzzleRunRow, SessionRow, TaskRow } from '../../data/types';
import { todayDotStatus } from './TodayDots';

it('fills only the dots whose daily work is complete', () => {
  const now = new Date(2026, 9, 17, 12).getTime();
  const today = dayKey(now);
  const featured = featuredSpec(today);
  const empty = { tasks: [], sessions: [], ledger: [], runs: [] };
  expect(todayDotStatus(now, empty)).toEqual({ plan: false, train: false, learn: false, mind: false });
  const data = {
    tasks: [{ id: 'task', doneAt: now, deleted: 0 } as TaskRow],
    sessions: [{ id: 'session', dayKey: today, status: 'completed', deleted: 0 } as SessionRow],
    ledger: [] as LedgerRow[],
    drop: { drop: { cursor: 5, items: Array(5).fill({}) } } as LearnDropRow,
    runs: [{ id: `daily:${today}:${featured.type}:${featured.diff}`, type: featured.type, dayKey: today, daily: true, result: 'solved', deleted: 0 } as PuzzleRunRow],
  };
  expect(todayDotStatus(now, data)).toEqual({ plan: true, train: true, learn: true, mind: true });
  expect(todayDotStatus(now, { ...data, drop: { drop: { cursor: 4, items: Array(5).fill({}) } } as LearnDropRow }).learn).toBe(false);
  expect(todayDotStatus(now, { ...empty, ledger: [{ id: `train-rest:${today}`, deleted: 0 } as LedgerRow] }).train).toBe(true);
  expect(todayDotStatus(now, { ...empty, sessions: [{ id: 'skipped', dayKey: today, status: 'skipped', deleted: 0 } as SessionRow] }).train).toBe(false);
});

it("the Mind dot fills for the featured type's easy shelf daily too (spec 29, one daily per type)", () => {
  // Sat 24 Oct 2026: the featured board is Crowns, hard; a new player's daily for Crowns is the easy shelf board.
  const now = new Date(2026, 9, 24, 12).getTime();
  const today = dayKey(now);
  const easy = { id: `daily:${today}:crowns:easy`, type: 'crowns', dayKey: today, daily: true, diff: 'easy', result: 'solved', deleted: 0 } as PuzzleRunRow;
  expect(todayDotStatus(now, { tasks: [], sessions: [], ledger: [], runs: [easy] }).mind).toBe(true);
  expect(todayDotStatus(now, { tasks: [], sessions: [], ledger: [], runs: [{ ...easy, type: 'sudoku', id: `daily:${today}:sudoku:easy` }] }).mind).toBe(false);
});
