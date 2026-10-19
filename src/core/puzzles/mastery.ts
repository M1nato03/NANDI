import type { PuzzleRunRow } from '../../data/types';
import { RULES } from '../rules.config';

export function parMs(runs: readonly PuzzleRunRow[], type: string, diff: string): number | undefined {
  const times = runs.filter(row => !row.deleted && row.type === type && row.diff === diff && row.result === 'solved' && typeof row.solveMs === 'number' && !row.legacyBest)
    .sort((a, b) => (b.finishedAt ?? b.updatedAt) - (a.finishedAt ?? a.updatedAt)).slice(0, RULES.mind.parWindow).map(row => row.solveMs!).sort((a, b) => a - b);
  if (times.length < RULES.mind.parMinSolves) return undefined;
  const middle = Math.floor(times.length / 2);
  return times.length % 2 ? times[middle] : (times[middle - 1]! + times[middle]!) / 2;
}

export function noHintClear(run: Pick<PuzzleRunRow, 'result' | 'hintsUsed'>): boolean {
  return run.result === 'solved' && (run.hintsUsed ?? 0) === 0;
}
