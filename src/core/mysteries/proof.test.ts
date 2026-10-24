import { describe, expect, it } from 'vitest';
import CaseGen from './index';
import { checkProof, offerProof, shortestProof, stillAllows } from './proof';

const cases = (diff: 'easy' | 'medium' | 'hard', count: number) =>
  Array.from({ length: count }, (_, index) => CaseGen.generate({ seed: 1000 + index * 7919, diff })).filter(mystery => !!mystery);

describe('Prove it (spec 24, cj5-mind §7.2)', () => {
  it('the whole clue list always proves the case, and a shortest proof is minimal', () => {
    for (const diff of ['easy', 'medium', 'hard'] as const) for (const mystery of cases(diff, 40)) {
      expect(checkProof(mystery, mystery.clues.map((_, index) => index)).proves).toBe(true);
      const proof = shortestProof(mystery);
      expect(checkProof(mystery, proof).proves).toBe(true);
      // Dropping any one clue from it no longer proves the case.
      for (const index of proof) expect(checkProof(mystery, proof.filter(value => value !== index)).proves).toBe(false);
    }
  });
  it('a pick that does not prove it names a case the picked clues still allow', () => {
    const mystery = cases('medium', 10).find(offerProof)!;
    const result = checkProof(mystery, []);
    expect(result.proves).toBe(false);
    if (result.proves) return;
    const truth = { s: mystery.culprit, i: mystery.sol.si[mystery.culprit]!, p: mystery.sol.sp[mystery.culprit]! };
    expect(result.still).not.toEqual(truth);
    expect(stillAllows(mystery, result.still)).toMatch(/^These clues still allow .+ with the .+\.$/);
  });
  it('is offered only when a proof is shorter than the clue list, which is most cases, and stays fast', () => {
    const sample = [...cases('easy', 40), ...cases('medium', 40), ...cases('hard', 40)];
    const offered = sample.filter(offerProof).length / sample.length;
    expect(offered).toBeGreaterThan(0.5);
    expect(offered).toBeLessThan(1);
    const hard = cases('hard', 10);
    const started = performance.now();
    for (const mystery of hard) shortestProof(mystery);
    expect((performance.now() - started) / hard.length).toBeLessThan(200);
  });
  it('ignores repeated and unknown clue numbers', () => {
    const mystery = cases('easy', 1)[0]!;
    const all = mystery.clues.map((_, index) => index);
    expect(checkProof(mystery, [...all, ...all, 99]).proves).toBe(true);
  });
});
