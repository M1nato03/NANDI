import type { NandiDb } from '../db';
import type { PuzzleRunRow } from '../types';
import type { PuzzleBoard } from '../../core/puzzles';
import { getOrCreateDeviceId } from '../device';
import { trackWrite } from '../../core/pendingWrites';

export function runId(day: string, board: Pick<PuzzleBoard, 'type' | 'diff'>, daily: boolean, attempt = 0): string {
  return `${daily ? 'daily' : 'practice'}:${day}:${board.type}:${board.diff}${daily ? '' : `:${attempt}`}`;
}

export function initialGrid(board: PuzzleBoard): number[] {
  if (board.type === 'sudoku') return board.givens.slice();
  if (board.type === 'sunmoon') return board.given.slice();
  if (board.type === 'path') return [];
  const size = board.N * board.N;
  return Array(size).fill(0);
}

export async function openPuzzleRun(store: NandiDb, board: PuzzleBoard, day: string, daily: boolean, now = Date.now(), attempt = 0): Promise<PuzzleRunRow> {
  const id = runId(day, board, daily, attempt);
  const prior = await store.puzzleRuns.get(id);
  if (prior && !prior.deleted) return { ...prior, lastActiveAt: now };
  const deviceId = await getOrCreateDeviceId(store, now);
  const row: PuzzleRunRow = {
    id, type: board.type, dayKey: day, seed: String(board.seed), diff: board.diff, daily,
    source: 'app', practiceAttempt: daily ? undefined : attempt, grid: initialGrid(board), path: [], notes: Array(board.solution.length).fill(0),
    notesMode: false, activeMs: 0, lastActiveAt: now, hintsUsed: 0, hintRungs: [],
    updatedAt: now, deleted: 0, deviceId,
  };
  await trackWrite(() => store.puzzleRuns.put(row));
  return row;
}

export function accrueActive(row: PuzzleRunRow, now: number): PuzzleRunRow {
  if (row.result) return row;
  const gap = Math.max(0, now - (row.lastActiveAt ?? now));
  return { ...row, activeMs: (row.activeMs ?? 0) + Math.min(gap, 60_000), lastActiveAt: now };
}

export async function savePuzzleRun(store: NandiDb, row: PuzzleRunRow, now = Date.now()): Promise<PuzzleRunRow> {
  return trackWrite(() => store.transaction('rw', store.puzzleRuns, async () => {
    const prior = await store.puzzleRuns.get(row.id);
    if (prior?.result === 'solved') return prior;
    const saved = { ...row, updatedAt: now };
    await store.puzzleRuns.put(saved);
    return saved;
  }));
}

export async function bestPuzzleMs(store: NandiDb, type: PuzzleBoard['type'], diff: string): Promise<number | undefined> {
  const rows = await store.puzzleRuns.where('type').equals(type).toArray();
  const times = rows.filter(row => !row.deleted && row.result === 'solved' && row.diff === diff && row.solveMs !== undefined).map(row => row.solveMs!);
  return times.length ? Math.min(...times) : undefined;
}
