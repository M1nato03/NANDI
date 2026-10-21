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
  _test: {
    latinUnits: () => unknown;
    latinLogic: (grid: number[], n: number, units: unknown, level: number) => { solved: boolean; grid: number[] };
    crownLogic: (n: number, region: number[], level: number) => { solved: boolean; st: ArrayLike<number> };
    binLogic: (clues: { given: number[]; hs: number[]; vs: number[] }, level: number) => { solved: boolean; grid: number[] };
    calcLogic: (n: number, cages: Array<{ cells: number[]; op: string; target: number; tuples: number[][] }>, level: number) => { solved: boolean; grid: number[] };
    cageTuples: (cage: { cells: number[]; op: string; target: number }, n: number) => number[][];
    pathCount: (R: number, C: number, waypoints: number[], limit: number) => number;
    pathLogic: (R: number, C: number, waypoints: number[], level: number, start?: number[]) => { solved: boolean; broken: boolean; path: number[]; why: Record<string, string> };
  };
};
export default PZ;
