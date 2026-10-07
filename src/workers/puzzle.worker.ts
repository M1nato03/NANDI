import PZ from '../core/puzzles';
import { generateCheck } from './generator';

const pathRuns = 20;
const pathBudgetMs = 300;

self.onmessage = (event: MessageEvent<string>) => {
  try {
    const start = performance.now();
    const result = generateCheck(event.data);
    self.postMessage({ result, ms: performance.now() - start });
    const times: number[] = [];
    for (let i = 0; i < pathRuns; i++) {
      const seed = PZ.hash(`number-path-hard-speed:${i}`);
      const runStart = performance.now();
      const board = PZ.generate('path', { seed, diff: 'hard' });
      times.push(performance.now() - runStart);
      if (!board) throw new Error(`Number Path generation failed for seed ${seed}`);
    }
    times.sort((a, b) => a - b);
    const p50 = times[Math.ceil(pathRuns * 0.5) - 1];
    const p95 = times[Math.ceil(pathRuns * 0.95) - 1];
    self.postMessage({ pathSpeed: { count: pathRuns, p50, p95, max: times[pathRuns - 1], budgetMs: pathBudgetMs } });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
