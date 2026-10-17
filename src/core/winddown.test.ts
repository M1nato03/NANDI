import { describe, expect, it } from 'vitest';
import winddown from '../../content/winddown/winddown.core.json';
import { selectWinddownMove } from './winddown';

const moves = winddown.body.moves;
const nights = Array.from({ length: 100 }, (_, offset) => {
  const date = new Date(Date.UTC(2026, 9, 1 + offset));
  return date.toISOString().slice(0, 10);
});

describe('wind-down selection', () => {
  it('is deterministic across repeated calls and a month boundary', () => {
    for (const night of nights) {
      expect(selectWinddownMove(night, moves)).toEqual(selectWinddownMove(night, moves));
      expect(selectWinddownMove(night, moves).id).toBeTruthy();
    }
  });

  it('does not repeat a default move within seven nights', () => {
    for (let index = 0; index < nights.length - 7; index++) {
      const window = nights.slice(index, index + 8).map(night => selectWinddownMove(night, moves).id);
      expect(new Set(window).size).toBe(8);
    }
  });

  it('offers three distinct next ideas for the same night', () => {
    for (const night of nights) {
      const choices = Array.from({ length: 4 }, (_, swaps) => selectWinddownMove(night, moves, swaps).id);
      expect(new Set(choices).size).toBe(4);
      expect(selectWinddownMove(night, moves, 3).id).toBe(choices[3]);
    }
  });

  it('rejects an invalid night or swap count', () => {
    expect(() => selectWinddownMove('2026-02-30', moves)).toThrow(RangeError);
    expect(() => selectWinddownMove('2026-10-17', moves, 4)).toThrow(RangeError);
  });
});
