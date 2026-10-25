import { expect } from 'vitest';
import type { Level, Rule } from './common';

type Case<T> = {
  seed: number; level: Level; story: string; clues: string[];
  difficulty: { clues: number; candidates: number }; rules: Rule<T>[];
};

export function audit<T, C extends Case<T>>(
  name: string, generate: (seed: number, level: Level) => C,
  solve: (c: C) => T[], matches: (c: C, solution: T) => boolean,
  answerOf?: (c: C, solution: T) => string,
): void {
  const durations: number[] = [];
  const clueCounts: number[] = [];
  let oneClue = 0;
  for (let i = 0; i < 300; i++) {
    const level: Level = i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard';
    const seed = 1009 + i * 7919;
    const start = performance.now();
    const c = generate(seed, level);
    const solutions = solve(c);
    durations.push(performance.now() - start);
    expect(c.story.length, `${name} seed ${seed}`).toBeGreaterThan(20);
    expect(c.clues.length, `${name} seed ${seed}`).toBe(c.rules.length);
    expect(new Set(c.clues).size, `${name} seed ${seed}`).toBe(c.clues.length);
    expect(solutions.length, `${name} seed ${seed}`).toBe(1);
    expect(matches(c, solutions[0]), `${name} seed ${seed}`).toBe(true);
    clueCounts.push(c.rules.length);
    if (c.rules.some(rule => {
      const possible = solve({ ...c, rules: [rule] });
      return answerOf ? new Set(possible.map(solution => answerOf(c, solution))).size === 1
        : possible.length === 1;
    })) oneClue++;
  }
  expect(oneClue / 300).toBeLessThan(0.05);
  const ordered = [...durations].sort((a, b) => a - b);
  const mean = durations.reduce((a, b) => a + b, 0) / 300;
  const avgClues = clueCounts.reduce((a, b) => a + b, 0) / 300;
  console.log(`| ${name} | 300/300 | ${mean.toFixed(2)} | ${ordered[284].toFixed(2)} | ${Math.max(...durations).toFixed(2)} | ${avgClues.toFixed(2)} | ${(100 * oneClue / 300).toFixed(1)}% |`);
}
