import { expect, it } from 'vitest';
import { budgetBar, chooseTrackDay, rhythmForDay, soonerWeakCards } from './tracks';

const units = ['lift', 'motors', 'battery', 'sensors'];

it('offers four ordered new units, then review, apply and off', () => {
  expect(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'].map(rhythmForDay)).toEqual(['new', 'new', 'new', 'new', 'review', 'apply', 'off']);
  expect(chooseTrackDay({ day: '2026-10-13', active: true, unitIds: units, completed: [{ id: 'lift', day: '2026-10-12' }], dueReviews: 2 }).unitId).toBe('motors');
  expect(chooseTrackDay({ day: '2026-10-16', active: true, unitIds: units, completed: [], dueReviews: 0 }).kind).toBe('review');
});

it('brakes above 30 due reviews, parks without a streak effect, and stops after one unit', () => {
  const input = { day: '2026-10-12', active: true, unitIds: units, completed: [], dueReviews: 31 };
  expect(chooseTrackDay(input)).toMatchObject({ kind: 'review', reason: 'backlog' });
  expect(chooseTrackDay({ ...input, dueReviews: 30 }).unitId).toBe('lift');
  expect(chooseTrackDay({ ...input, active: false })).toMatchObject({ kind: 'parked', unitId: null });
  expect(chooseTrackDay({ ...input, dueReviews: 0, completed: [{ id: 'lift', day: input.day }] })).toMatchObject({ kind: 'done', unitId: null });
});

it('counts review estimate and unit plus check against 25 minutes without increasing it', () => {
  expect(budgetBar({ unitMinutes: 12, checkMinutes: 3, dueReviews: 4, spentMinutes: 0 })).toEqual({ used: 19, limit: 25, remaining: 6, full: false });
  expect(budgetBar({ unitMinutes: 12, checkMinutes: 3, dueReviews: 11, spentMinutes: 0 })).toMatchObject({ used: 25, remaining: 0, full: true });
});

it('brings weak cards due sooner but preserves their boxes', () => {
  expect(soonerWeakCards([{ id: 'a', box: 5, due: '2026-11-10' }, { id: 'b', box: 2, due: '2026-10-11' }], new Set(['a']), '2026-10-12')).toEqual([{ id: 'a', box: 5, due: '2026-10-12' }, { id: 'b', box: 2, due: '2026-10-11' }]);
});
