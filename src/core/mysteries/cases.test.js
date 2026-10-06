import { describe, it, expect } from 'vitest';
import { loadPortedGenerator } from '../ported-test-loader';

const CaseGen = loadPortedGenerator(new URL('./cases.js', import.meta.url), 'CaseGen');


describe('ported mystery generator', () => {
  let total = 0;
  for (const diff of ['easy', 'medium', 'hard']) {
    it(`${diff}: 300 unique cases with explanation`, () => {
      let count = 0;
      for (let k = 0; k < 300; k++) {
        const C = CaseGen.generate({ seed: 1000 + k * 7919, diff });
        expect(C, `seed ${k}`).toBeTruthy();
        const n = C.n;
        const cnt = CaseGen.countSolutions(C.clues, n);
        const fits = C.clues.every((cl) => CaseGen.holds(cl, C.sol.sp, C.sol.si));
        const pr = CaseGen.propagate(C.clues, n, diff !== 'easy');
        const direct = C.killer.k === 'place'
          ? C.clues.some((cl) => cl.k === 'sp+' && cl.s === C.culprit)
          : C.clues.some((cl) => cl.k === 'si+' && cl.s === C.culprit);
        let match = pr.solved;
        if (pr.solved) for (let s = 0; s < n; s++) {
          if (pr.G.A[s][C.sol.sp[s]] !== 1 || pr.G.B[s][C.sol.si[s]] !== 1) match = false;
        }
        expect({ cnt, fits, solved: pr.solved, direct, match }, `seed ${k}`)
          .toEqual({ cnt: 1, fits: true, solved: true, direct: false, match: true });
        expect(C.steps.length).toBeGreaterThan(0);
        count++;
      }
      expect(count).toBe(300);
      total += count;
    }, 120_000);
  }
  it('checks 900 cases', () => expect(total).toBe(900));
});
