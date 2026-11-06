import { describe, expect, it } from 'vitest';
import { ALL_PICKS } from '../../core/welcome';
import { dayKey } from '../../core/time/dayKey';
import type { LearnDropRow, LedgerRow, PuzzleRunRow, TaskRow } from '../../data/types';
import { DOT_NAME, DOT_ROUTE, todayDots, todayDotStatus } from './TodayDots';

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

describe('spec 52: the dots follow the picks', () => {
  it('all three at size all; otherwise only picked areas, learn and mind sharing Read, and none for Train alone', () => {
    expect(todayDots(ALL_PICKS)).toEqual(['plan', 'read', 'night']);
    expect(todayDots({ goals: ['learn', 'mind'], size: 'two' })).toEqual(['read']);
    expect(todayDots({ goals: ['train', 'plan'], size: 'two' })).toEqual(['plan']);
    expect(todayDots({ goals: ['sleep'], size: 'two' })).toEqual(['night']);
    expect(todayDots({ goals: ['mind', 'sleep', 'plan', 'train'], size: 'more' })).toEqual(['plan', 'read', 'night']);
    expect(todayDots({ goals: ['train'], size: 'two' })).toEqual([]);
  });
});

it('spec 571 (b2): the reading dot keeps the name Read and opens Grow › Read', () => {
  expect(DOT_NAME).toEqual({ plan: 'Plan', read: 'Read', night: 'Night' });
  expect(DOT_ROUTE.read).toBe('grow/read');
});
