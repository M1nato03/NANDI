const DAY_MS = 86_400_000;

/** Pick from a 24-night cycle. Each swap advances seven places in that cycle. */
export function selectWinddownMove<T extends { id: string }>(day: string, moves: readonly T[], swaps = 0): T {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) throw new RangeError('Invalid night');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  const utc = Date.UTC(year, month - 1, date);
  const parsed = new Date(utc);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== date) throw new RangeError('Invalid night');
  if (moves.length !== 24) throw new RangeError('Wind-down pack needs 24 moves');
  if (!Number.isInteger(swaps) || swaps < 0 || swaps > 3) throw new RangeError('Invalid swap count');
  const index = ((Math.floor(utc / DAY_MS) + swaps * 7) % moves.length + moves.length) % moves.length;
  return moves[index]!;
}
