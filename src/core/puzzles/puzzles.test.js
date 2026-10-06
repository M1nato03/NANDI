import { describe, it, expect } from 'vitest';
import { loadPortedGenerator } from '../ported-test-loader';

const PZ = loadPortedGenerator(new URL('./puzzles.js', import.meta.url), 'PZ');


const T = PZ._test;
const types = ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'];
const levels = ['easy', 'medium', 'hard'];

describe('ported puzzle generators', () => {
  let total = 0;
  for (const type of types) for (const diff of levels) {
    it(`${type} ${diff}: 40 unique, valid, logic-solvable boards`, () => {
      let count = 0;
      for (let k = 0; k < 40; k++) {
        const p = PZ.generate(type, { seed: PZ.hash(type + diff + k), diff });
        expect(p, `seed ${k}`).toBeTruthy();
        let unique, logic, valid;
        if (type === 'sudoku') {
          unique = T.sdkCount(p.givens, 2) === 1;
          logic = T.latinLogic(p.givens, 6, T.latinUnits(), diff === 'hard' ? 2 : 1).solved;
          valid = PZ.TYPES.sudoku.check(p, p.solution);
        }
        if (type === 'crowns') {
          unique = T.crownCount(p.N, p.region, 2) === 1;
          logic = T.crownLogic(p.N, p.region, diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3).solved;
          valid = PZ.TYPES.crowns.check(p, p.solution.map((c, r) => r * p.N + c));
        }
        if (type === 'sunmoon') {
          const clues = { given: p.given, hs: p.hs, vs: p.vs };
          unique = T.binCount(clues, 2) === 1;
          logic = T.binLogic(clues, diff === 'easy' ? 1 : 2).solved;
          valid = PZ.TYPES.sunmoon.check(p, p.solution);
        }
        if (type === 'path') {
          unique = T.pathCount(p.R, p.C, p.waypoints, 2) === 1;
          logic = true; // No Number Path logic solver yet.
          valid = PZ.TYPES.path.check(p, p.solution);
        }
        if (type === 'calc') {
          const cages = p.cages.map((c) => ({ ...c, tuples: T.cageTuples(c, p.N) }));
          unique = T.calcCount(p.N, cages, 2) === 1;
          logic = T.calcLogic(p.N, cages, diff === 'easy' ? 1 : 2).solved;
          valid = PZ.TYPES.calc.check(p, p.solution);
        }
        expect({ unique, logic, valid }, `seed ${k}`).toEqual({ unique: true, logic: true, valid: true });
        count++;
      }
      expect(count).toBe(40);
      total += count;
    }, 120_000);
  }
  it('checks 600 boards', () => expect(total).toBe(600));
});
