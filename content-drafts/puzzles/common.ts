export type Level = 'easy' | 'medium' | 'hard';
export type Grid = number[][];

export function random(seed: number): () => number {
  let state = (seed | 0) ^ 0x6d2b79f5;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(values: T[], rng: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function copy(grid: Grid): Grid {
  return grid.map(row => [...row]);
}
