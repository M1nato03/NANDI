import { expect, it } from 'vitest';
import { addDays, cardAfterAnswer, confidencePercent, duePlan, isCorrect, itemAfterAnswer, nextRating, shuffleOptions, canStartLesson, mindXp } from './learn';

it('04 §7 test 3: Mind XP is capped and practice, night, and second lessons earn zero', () => {
  expect(mindXp({ lessons: 2, cards: 90, boards: 9, mysteries: 1, sideBoards: 3, night: false })).toBe(80);
  expect(mindXp({ lessons: 1, cards: 2, boards: 1, night: true })).toBe(0);
  expect(mindXp({ lessons: 1, cards: 2, boards: 1, night: false, practice: true })).toBe(0);
  expect(mindXp({ lessons: 2, cards: 0, boards: 0, night: false })).toBe(15);
});

it('04 §7 test 6: shuffled lesson answers are judged by their original index', () => {
  const order = shuffleOptions(4, () => 0);
  expect(order).toHaveLength(4);
  expect(new Set(order).size).toBe(4);
  expect(order).not.toEqual([0, 1, 2, 3]);
  expect(isCorrect(order, order.indexOf(2), 2)).toBe(true);
  expect(isCorrect(order, order.indexOf(1), 2)).toBe(false);
  expect(confidencePercent('sure')).toBe(90);
});

it('04 §7 test 7: one new lesson per course per day and reviews cannot create cards', () => {
  expect(canStartLesson([], 'gita', '2026-10-11', false)).toBe(true);
  expect(canStartLesson([{ course: 'gita', day: '2026-10-11' }], 'gita', '2026-10-11', false)).toBe(false);
  expect(canStartLesson([{ course: 'gita', day: '2026-10-11' }], 'charaka', '2026-10-11', false)).toBe(true);
  expect(canStartLesson([{ course: 'gita', day: '2026-10-11' }], 'gita', '2026-10-11', true)).toBe(true);
});

it('04 §7 test 8: only unanswered plans aged one to three days get a check-in', () => {
  expect(duePlan('2026-10-08', '2026-10-11', null)).toBe(true);
  expect(duePlan('2026-10-10', '2026-10-11', null)).toBe(true);
  expect(duePlan('2026-10-07', '2026-10-11', null)).toBe(false);
  expect(duePlan('2026-10-11', '2026-10-11', null)).toBe(false);
  expect(duePlan('2026-10-10', '2026-10-11', 'partly')).toBe(false);
});

it('card and item schedules preserve legacy state until an answer', () => {
  expect(cardAfterAnswer({ box: 3, due: '2026-10-01', last: '2026-09-24', reviews: 5 }, true, '2026-10-11')).toMatchObject({ box: 4, due: '2026-10-25', last: '2026-10-11', reviews: 6 });
  expect(cardAfterAnswer({ box: 3, due: '2026-10-01' }, false, '2026-10-11')).toMatchObject({ box: 0, due: '2026-10-11' });
  expect(itemAfterAnswer({ b: 2, due: '2026-10-01' }, true, '2026-10-11', 'scenario').due).toBe('2027-01-09');
  expect(itemAfterAnswer({ b: 2, due: '2026-10-01' }, false, '2026-10-11', 'teaser').due).toBe('2026-10-14');
  expect(addDays('2026-10-11', 1)).toBe('2026-10-12');
});

it('Elo uses early and later K, hint score and clamps', () => {
  expect(nextRating(1000, 0, 1000, 1)).toBe(1020);
  expect(nextRating(1000, 20, 1000, 1)).toBe(1012);
  expect(nextRating(2400, 0, 400, 1)).toBe(2400);
});
