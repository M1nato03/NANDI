import { expect, it } from 'vitest';
import { featuredSpec } from './daily';
import { nightPracticeSeed, nightPuzzleBoard, selectNightPuzzle } from './night';

it('offers an unsolved easy or medium daily board', () => {
  for (const day of ['2026-10-19', '2026-10-21']) {
    const featured = featuredSpec(day);
    const choice = selectNightPuzzle(featured.type, featured.diff, false);
    expect(choice).toEqual({ ...featured, daily: true });
    expect(nightPuzzleBoard(day, choice)?.diff).toBe(featured.diff);
  }
});

it('offers a same-type easy practice board for hard or solved dailies', () => {
  for (const [day, solved] of [['2026-10-17', false], ['2026-10-19', true]] as const) {
    const featured = featuredSpec(day);
    const choice = selectNightPuzzle(featured.type, featured.diff, solved);
    const board = nightPuzzleBoard(day, choice);
    expect(choice).toEqual({ type: featured.type, diff: 'easy', daily: false });
    expect(board).toMatchObject({ type: featured.type, diff: 'easy', seed: nightPracticeSeed(day, featured.type) });
    expect(nightPuzzleBoard(day, choice)).toEqual(board);
  }
});
