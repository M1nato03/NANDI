import { describe, expect, it } from 'vitest';
import { catalogFor, chosenTopics, findItem, makeDrop, topics } from './flow';

describe('live learning drop glue', () => {
  it('keeps only bundled topic ids and resolves stored items', () => {
    expect(topics).toHaveLength(3);
    expect(chosenTopics(['money-markets', 'unknown'])).toEqual(['money-markets']);
    const concepts = catalogFor(['money-markets']);
    expect(concepts).toHaveLength(6);
    expect(findItem(concepts, concepts[0]!.items[0]!.id)?.concept.id).toBe(concepts[0]!.id);
  });

  it('creates a five item daily drop with stable option order and a stopping screen', () => {
    const input = { ids: ['money-markets'], concepts: [], items: [], now: new Date('2026-10-16T12:00:00').getTime(), daily: true,
      answeredToday: 0, newToday: 0, spentMinutes: 0, facts: [] };
    const first = makeDrop(input);
    const second = makeDrop(input);
    expect(first.id).toMatch(/^drop:daily:/);
    expect(first.items).toHaveLength(5);
    expect(new Set(first.items.map(item => item.itemId)).size).toBe(5);
    expect(first.items).toEqual(second.items);
    expect(first.ending.kind).toBe('stopping-screen');
  });
});
