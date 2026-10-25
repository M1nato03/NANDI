import { describe, it } from 'vitest';
import { audit } from './audit.test-helper';
import { familyRelation, generateFamily, solveFamily } from './family';

describe('family', () => {
  it('checks 300 seeds', () => {
    const answerOf = (c: ReturnType<typeof generateFamily>, solution: ReturnType<typeof solveFamily>[number]) => {
      const puzzle = c as ReturnType<typeof generateFamily>;
      const [, x, y] = /^How is (.+) related to (.+)\?$/.exec(puzzle.question)!;
      return familyRelation(solution, x, y);
    };
    audit('family', generateFamily, solveFamily,
      (c, solution) => answerOf(c as ReturnType<typeof generateFamily>, solution)
        === (c as ReturnType<typeof generateFamily>).answer,
      (c, solution) => answerOf(c as ReturnType<typeof generateFamily>, solution));
  }, 120_000);
});
