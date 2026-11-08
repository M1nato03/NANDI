import { expect, it } from 'vitest';
import { dayKey } from '../../core/time/dayKey';
import type { LearnDropRow, LedgerRow, PuzzleRunRow, TaskRow } from '../../data/types';
import { todayDotStatus } from './TodayDots';

// Spec 33: the dots are Plan, Read and Night.
it('fills only the dots whose daily work is complete', () => {
  const now = new Date(2026, 9, 17, 12).getTime();
  const today = dayKey(now);
  const empty = { tasks: [], ledger: [], runs: [] };
  expect(todayDotStatus(now, empty)).toEqual({ plan: false, read: false, night: false });
  const data = {
    tasks: [{ id: 'task', doneAt: now, deleted: 0 } as TaskRow],
    ledger: [{ id: `lightsout:${today}`, kind: 'lightsout', dayKey: today, inputs: { metTarget: true }, deleted: 0 } as unknown as LedgerRow],
    drop: { drop: { cursor: 5, items: Array(5).fill({}) } } as LearnDropRow,
    runs: [],
  };
  expect(todayDotStatus(now, data)).toEqual({ plan: true, read: true, night: true });
  expect(todayDotStatus(now, { ...data, drop: { drop: { cursor: 4, items: Array(5).fill({}) } } as LearnDropRow }).read).toBe(false);
  expect(todayDotStatus(now, { ...empty, nightDrop: { drop: { cursor: 3, items: Array(3).fill({}) } } as LearnDropRow }).night).toBe(true);
});

it('a chapter read today fills Read; a chapter from yesterday does not', () => {
  const now = new Date(2026, 9, 27, 12).getTime();
  const chapter = (day: string) => ({ id: `chapter:psychology:psychology-ch1`, kind: 'chapter', dayKey: day, inputs: {}, deleted: 0 }) as unknown as LedgerRow;
  expect(todayDotStatus(now, { tasks: [], ledger: [chapter(dayKey(now))], runs: [] }).read).toBe(true);
  expect(todayDotStatus(now, { tasks: [], ledger: [chapter('2026-10-26')], runs: [] }).read).toBe(false);
});

it("Kapi's featured daily board fills Read too, the easy shelf daily included (spec 29)", () => {
  // Sat 24 Oct 2026: the featured board is Crowns, hard; a new player's daily for Crowns is the easy shelf board.
  const now = new Date(2026, 9, 24, 12).getTime();
  const today = dayKey(now);
  const easy = { id: `daily:${today}:crowns:easy`, type: 'crowns', dayKey: today, daily: true, diff: 'easy', result: 'solved', deleted: 0 } as PuzzleRunRow;
  expect(todayDotStatus(now, { tasks: [], ledger: [], runs: [easy] }).read).toBe(true);
  expect(todayDotStatus(now, { tasks: [], ledger: [], runs: [{ ...easy, type: 'sudoku', id: `daily:${today}:sudoku:easy` }] }).read).toBe(false);
});
