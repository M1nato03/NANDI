import { expect, it } from 'vitest';
import { finishReviewRamp, oneMoreAllowance, reviewAllowance, spreadReviewBacklog } from './reviewSessions';

it('eases a large pile in over review days and allows one extra set only once', () => {
  const first = { step: 0 };
  expect(reviewAllowance(40, '2026-10-11', first)).toBe(5);
  const second = finishReviewRamp(first, '2026-10-11', 35);
  expect(reviewAllowance(35, '2026-10-11', second)).toBe(0);
  expect(oneMoreAllowance(35, '2026-10-11', second)).toBe(10);
  expect(oneMoreAllowance(25, '2026-10-11', finishReviewRamp(second, '2026-10-11', 25, true))).toBe(0);
  expect(reviewAllowance(35, '2026-10-12', second)).toBe(7);
  expect(reviewAllowance(28, '2026-10-13', finishReviewRamp(second, '2026-10-12', 28))).toBe(10);
  expect(reviewAllowance(4, '2026-10-14', { step: 2 })).toBe(4);
});

it('restarts after a pile has been gone for seven days', () => {
  const cleared = finishReviewRamp({ step: 2 }, '2026-10-01', 0);
  expect(reviewAllowance(40, '2026-10-07', cleared)).toBe(10);
  expect(reviewAllowance(40, '2026-10-08', cleared)).toBe(5);
  expect(reviewAllowance(40, '2026-10-20', finishReviewRamp({ step: 2 }, '2026-10-01', 20))).toBe(10);
});

it('spreads only a large backlog on session end, oldest first in small daily groups', () => {
  const waiting = Array.from({ length: 53 }, (_, index) => ({ id: String(index).padStart(2, '0'), due: index < 3 ? '2026-09-01' : '2026-10-01' }));
  expect(spreadReviewBacklog(waiting, '2026-10-11', 50)).toEqual([]);
  const updates = spreadReviewBacklog(waiting, '2026-10-11', 58, 1);
  expect(updates).toHaveLength(53);
  expect(updates.slice(0, 7).every(row => row.due === '2026-10-12')).toBe(true);
  expect(updates[7]?.due).toBe('2026-10-13');
  expect(updates.at(-1)?.due).toBe('2026-10-17');
  expect(waiting[0]?.due).toBe('2026-09-01');
});
