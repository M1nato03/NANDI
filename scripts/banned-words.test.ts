import { describe, expect, it } from 'vitest';
import { findBannedWords } from './banned-words';

describe('banned words', () => {
  it('finds exact, case-sensitive names with word boundaries', () => {
    expect(
      findBannedWords('Ego and Zip!\n(Blue Lock) Queens Tango KenKen Egoist'),
    ).toEqual([
      { line: 1, word: 'Ego' },
      { line: 1, word: 'Zip' },
      { line: 2, word: 'Blue Lock' },
      { line: 2, word: 'Queens' },
      { line: 2, word: 'Tango' },
      { line: 2, word: 'KenKen' },
      { line: 2, word: 'Egoist' },
    ]);
  });

  it('ignores lowercase words and names embedded in larger words', () => {
    expect(
      findBannedWords('ego zip file Egoism preEgo Zip_2 3Zip Blue Locker'),
    ).toEqual([]);
  });
});
