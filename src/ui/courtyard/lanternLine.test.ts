import { describe, expect, it } from 'vitest';
import { LANTERNS_DRAWN, lanternLine } from './Scene';

describe('lanternLine (b2 13 Nov)', () => {
  it('names the soft-day string, and says it is full past what it draws', () => {
    expect(lanternLine(0)).toBe('');
    expect(lanternLine(1)).toBe('One lantern hangs on Kachhua’s string.');
    expect(lanternLine(2)).toBe('2 lanterns hang on Kachhua’s string.');
    expect(lanternLine(LANTERNS_DRAWN)).toBe('12 lanterns hang on Kachhua’s string.');
    expect(lanternLine(LANTERNS_DRAWN + 1)).toBe('Lanterns fill Kachhua’s string.');
  });
});
