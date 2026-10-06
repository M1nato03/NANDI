import { describe, expect, it } from 'vitest';
import { creationSplitPool } from './creationSplit';
import { levelForXp } from './levelCurve';
import { seasonRank, seasonSeed } from './seasonRank';

describe('economy worked numbers', () => {
  it('reaches levels 10 and 50 at the specified cumulative XP', () => {
    expect(levelForXp(4_499)).toBe(9);
    expect(levelForXp(4_500)).toBe(10);
    expect(levelForXp(122_500)).toBe(50);
  });

  it('maps SP to the 500-seat ladder in a 28-day season', () => {
    expect(seasonRank(250, 28)).toBe(452);
    expect(seasonRank(3_500, 28)).toBe(193);
    expect(seasonRank(7_000, 28)).toBe(1);
    expect(seasonSeed(7_000, 28)).toBe(700);
    expect(seasonRank(seasonSeed(7_000, 28), 28)).toBe(401);
  });

  it('uses the creation split XP pool formula', () => {
    expect(creationSplitPool(100)).toBe(39);
    expect(creationSplitPool(180)).toBe(70);
  });
});
