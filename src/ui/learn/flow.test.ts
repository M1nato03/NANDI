import { describe, expect, it } from 'vitest';
import { catalogFor, chosenTopics, findItem, makeDrop, nightDropId, reviewsOnlyRemainder, topics } from './flow';

// These cases test drop composition, not lessons: every Money step counts as already taught.
const taughtSteps = catalogFor(['money-markets']).flatMap(concept => concept.steps?.map(step => step.id) ?? []);

describe('live learning drop glue', () => {
  it('trims unstarted new steps on a resumed drop without losing the answered step', () => {
    const drop = { id: 'one', items: [
      { itemId: 'a', conceptId: 'a', optionOrder: [], mode: 'new' as const },
      { itemId: 'b', conceptId: 'b', optionOrder: [], mode: 'review' as const },
      { itemId: 'c', conceptId: 'c', optionOrder: [], mode: 'new' as const },
    ], cursor: 1, ending: { kind: 'stopping-screen' as const } };
    expect(reviewsOnlyRemainder(drop).items.map(item => item.itemId)).toEqual(['a', 'b']);
    expect(reviewsOnlyRemainder({ ...drop, cursor: 3 })).toEqual({ ...drop, cursor: 3 });
  });
  it('offers due reviews only after bedtime and stops at once when none are due', () => {
    const now = new Date(2026, 9, 18, 2, 0).getTime();
    const idea = catalogFor(['money-markets'])[0]!;
    const base = { ids: ['money-markets'], taughtSteps, items: [], now, bedtime: '01:30', daily: true, night: true,
      answeredToday: 0, newToday: 0, spentMinutes: 0, facts: [] };
    const empty = makeDrop({ ...base, concepts: [] });
    expect(empty.items).toHaveLength(0);
    expect(empty.ending.kind).toBe('stopping-screen');
    const due = makeDrop({ ...base, concepts: [{ id: idea.id, mastery: 0.8, attempts: 2,
      memory: { stability: 2, difficulty: 5, interval: 2, lastReview: now - 3 * 86_400_000, dueAt: now - 1 },
      activeMisconceptions: [], updatedAt: now, deleted: 0 as const, deviceId: 'test' }] });
    expect(due.items.length).toBeGreaterThan(0);
    expect(due.items.every(item => item.mode !== 'new')).toBe(true);
  });
  it('keeps only bundled topic ids and resolves stored items', () => {
    expect(topics).toHaveLength(6);
    expect(topics.map(pack => pack.body.topic.id).sort()).toEqual(['body-training', 'health-nutrition', 'history-civilisations', 'how-things-work', 'money-markets', 'psychology']);
    expect(chosenTopics(['money-markets', 'history-civilisations', 'health-nutrition', 'unknown'])).toEqual(['money-markets', 'history-civilisations', 'health-nutrition']);
    const concepts = catalogFor(['money-markets']);
    expect(concepts).toHaveLength(10);
    expect(findItem(concepts, concepts[0]!.items[0]!.id)?.concept.id).toBe(concepts[0]!.id);
  });

  it('creates a five item daily drop with stable option order and a stopping screen', () => {
    const input = { ids: ['money-markets'], taughtSteps, concepts: [], items: [], now: new Date('2026-10-16T12:00:00').getTime(), daily: true,
      answeredToday: 0, newToday: 0, spentMinutes: 0, facts: [] };
    const first = makeDrop(input);
    const second = makeDrop(input);
    expect(first.id).toMatch(/^drop:daily:/);
    expect(first.items).toHaveLength(5);
    expect(new Set(first.items.map(item => item.itemId)).size).toBe(5);
    expect(first.items).toEqual(second.items);
    expect(first.ending.kind).toBe('stopping-screen');
  });

  it('keeps a three item night drop separate from the daily drop', () => {
    const now = new Date('2026-10-17T23:30:00').getTime();
    const input = { ids: ['money-markets'], taughtSteps, concepts: [], items: [], now, daily: true,
      answeredToday: 0, newToday: 0, spentMinutes: 0, facts: [] };
    const daily = makeDrop(input);
    const night = makeDrop({ ...input, night: true, itemCount: 3 });
    expect(night.id).toBe(nightDropId(now));
    expect(night.id).not.toBe(daily.id);
    expect(night.items).toHaveLength(3);
    expect(daily.items).toHaveLength(5);
  });

  it('starts due reviews and concept practice under separate practice ids', () => {
    const now = new Date('2026-10-17T12:00:00').getTime();
    const idea = catalogFor(['money-markets'])[0]!;
    const input = { ids: ['money-markets'], taughtSteps, concepts: [{ id: idea.id, mastery: 0.8, attempts: 2,
      memory: { stability: 2, difficulty: 5, interval: 2, lastReview: now - 3 * 86_400_000, dueAt: now - 1 },
      activeMisconceptions: [], updatedAt: now, deleted: 0 as const, deviceId: 'test' }], items: [], now,
      daily: false, answeredToday: 0, newToday: 0, spentMinutes: 0, facts: [], itemCount: 3 };
    const review = makeDrop({ ...input, reviewDue: true });
    const focused = makeDrop({ ...input, preferredConceptId: idea.id });
    expect(review.id).toMatch(/^drop:practice:/);
    expect(review.id).not.toBe(makeDrop({ ...input, daily: true }).id);
    expect(review.items.length).toBeGreaterThan(0);
    expect(review.items.every(item => item.conceptId === idea.id && item.mode !== 'new')).toBe(true);
    expect(focused.items).toHaveLength(3);
    expect(focused.items.every(item => item.conceptId === idea.id)).toBe(true);
  });
});
