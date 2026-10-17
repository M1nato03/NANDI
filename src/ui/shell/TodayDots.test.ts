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
    runs: [{ id: `daily:${today}:${featured.type}:${featured.diff}`, result: 'solved', deleted: 0 } as PuzzleRunRow],
  };
  expect(todayDotStatus(now, data)).toEqual({ plan: true, train: true, learn: true, mind: true });
  expect(todayDotStatus(now, { ...data, drop: { drop: { cursor: 4, items: Array(5).fill({}) } } as LearnDropRow }).learn).toBe(false);
  expect(todayDotStatus(now, { ...empty, ledger: [{ id: `train-rest:${today}`, deleted: 0 } as LedgerRow] }).train).toBe(true);
  expect(todayDotStatus(now, { ...empty, sessions: [{ id: 'skipped', dayKey: today, status: 'skipped', deleted: 0 } as SessionRow] }).train).toBe(false);
});
