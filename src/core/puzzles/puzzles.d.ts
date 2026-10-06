export type PuzzleType = 'sudoku' | 'crowns' | 'sunmoon' | 'path' | 'calc';
export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';
export type PuzzleOptions = { seed: number; diff: PuzzleDifficulty };

type BaseBoard = { type: PuzzleType; diff: PuzzleDifficulty; seed: number; solution: number[] };
export type PuzzleBoard =
  | (BaseBoard & { type: 'sudoku'; N: number; br: number; bc: number; givens: number[] })
  | (BaseBoard & { type: 'crowns'; N: number; region: number[] })
  | (BaseBoard & { type: 'sunmoon'; given: number[]; hs: number[]; vs: number[] })
  | (BaseBoard & { type: 'path'; R: number; C: number; waypoints: number[] })
  | (BaseBoard & { type: 'calc'; N: number; cages: Array<{ cells: number[]; op: string; target: number }> });

declare const PZ: {
  TYPES: Record<PuzzleType, { name: string; rule: string; gen: (options: PuzzleOptions) => PuzzleBoard | null; check: (board: PuzzleBoard, solution: number[]) => boolean }>;
  generate: (type: PuzzleType, options: PuzzleOptions) => PuzzleBoard | null;
  hash: (text: string) => number;
  rng: (seed: number) => () => number;
  _test: Record<string, (...args: never[]) => unknown>;
};
export default PZ;
