import { describe, expect, it } from 'vitest';
import { deckNavigation } from './deckNavigation';

describe('deck navigation', () => {
  it('moves both ways and keeps skipped cards reachable', () => {
    let state = { index: 0, length: 7 };
    state = deckNavigation(state, { type: 'next' });
    state = deckNavigation(state, { type: 'next' });
    expect(deckNavigation(state, { type: 'previous' }).index).toBe(1);
    expect(deckNavigation(state, { type: 'jump', index: 0 }).index).toBe(0);
  });

  it('clamps the first and end cards', () => {
    expect(deckNavigation({ index: 0, length: 7 }, { type: 'previous' }).index).toBe(0);
    expect(deckNavigation({ index: 6, length: 7 }, { type: 'next' }).index).toBe(6);
    expect(deckNavigation({ index: 6, length: 7 }, { type: 'previous' }).index).toBe(5);
    expect(deckNavigation({ index: 0, length: 2 }, { type: 'jump', index: 99 }).index).toBe(1);
  });
});
