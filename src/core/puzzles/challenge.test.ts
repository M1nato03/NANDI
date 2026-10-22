import { describe, expect, it } from 'vitest';
import PZ from '.';
import { dailyBoard } from './daily';
import { challengeRoute, challengeUrl, parseChallenge } from './challenge';

describe('challenge a friend', () => {
  it('rebuilds the identical daily board from the link', () => {
    for (const day of ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']) {
      const board = dailyBoard(day)!;
      const parsed = parseChallenge(challengeRoute({ type: board.type, diff: board.diff, seed: Number(board.seed) }).slice('mind/'.length))!;
      const again = PZ.generate(parsed.type, { seed: parsed.seed, diff: parsed.diff });
      expect(again?.solution, day).toEqual(board.solution);
      expect(JSON.stringify(again), day).toBe(JSON.stringify(board));
    }
  });
  it('builds a route the router accepts and rejects anything else', () => {
    const route = challengeRoute({ type: 'sunmoon', diff: 'hard', seed: 4_000_000_000 });
    expect(route).toMatch(/^[a-z0-9]+(?:\/[a-z0-9]+)*$/);
    expect(challengeUrl({ type: 'calc', diff: 'easy', seed: 7 })).toBe('https://nandi.nandi11.workers.dev/#mind/challenge/calc/easy/7');
    expect(parseChallenge('challenge/chess/easy/7')).toBeNull();
    expect(parseChallenge('challenge/calc/easy/99999999999')).toBeNull();
    expect(parseChallenge('board/calc/easy')).toBeNull();
  });
});
