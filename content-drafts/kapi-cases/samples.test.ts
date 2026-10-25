import { describe, it, expect } from 'vitest';
import { generateSeating, solveSeating } from './seating';
import { generateFamily, solveFamily } from './family';
import { generateRoute, solveRoute } from './route';
import { generateLock, solveLock } from './lock';

describe('review samples', () => {
  it('regenerates two medium cases per type', () => {
    const kinds = [
      ['seating', generateSeating],
      ['family', generateFamily],
      ['route', generateRoute],
      ['lock', generateLock],
    ] as const;
    for (const [name, generate] of kinds) for (const seed of [1, 2]) {
      // The solvers have different candidate types, so dispatch through each case.
      const c = generate(seed, 'medium');
      const count = name === 'seating' ? solveSeating(c as ReturnType<typeof generateSeating>).length
        : name === 'family' ? solveFamily(c as ReturnType<typeof generateFamily>).length
          : name === 'route' ? solveRoute(c as ReturnType<typeof generateRoute>).length
            : solveLock(c as ReturnType<typeof generateLock>).length;
      expect(count).toBe(1);
      if (process.env.PRINT_KAPI_SAMPLES === '1') {
        console.log(JSON.stringify({ name, seed, story: c.story, clues: c.clues,
          question: 'question' in c ? c.question : undefined, answer: c.answer }));
      }
    }
  }, 20_000);
});
