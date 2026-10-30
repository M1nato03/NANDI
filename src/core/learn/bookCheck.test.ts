import { describe, expect, it } from 'vitest';
import { bookCheckDue } from './books';
import { ideaLine } from '../../ui/economy/effortLines';
import type { LedgerRow } from '../../data/types';

const row = (id: string, kind: string, refId: string, dayKey: string, inputs: Record<string, unknown>, updatedAt = 1): LedgerRow => ({ id, kind, refId, dayKey, mode: 'read', inputs, updatedAt, deleted: 0, deviceId: 't' });

describe('spec 41 the Book check', () => {
  it('is due from the day after a sitting-read quiz chapter, until it is answered', () => {
    const done = row('chapter:b:b-ch1', 'chapter', 'b:b-ch1', '2026-11-04', { checkLater: true });
    expect(bookCheckDue([done], '2026-11-04')).toBeUndefined();
    expect(bookCheckDue([done], '2026-11-05')).toEqual({ topicId: 'b', moduleId: 'b-ch1' });
    expect(bookCheckDue([done, row('read-check:b:b-ch1', 'chapter-check', 'b:b-ch1', '2026-11-05', { firstRight: 3 })], '2026-11-06')).toBeUndefined();
    // A chapter finished the old way (its check inside) never asks again.
    expect(bookCheckDue([row('chapter:b:b-ch2', 'chapter', 'b:b-ch2', '2026-11-01', {})], '2026-11-05')).toBeUndefined();
  });
});

describe('spec 41 an idea says what it earned', () => {
  const idea = (concept: string, steps: number, at: number, drop = false) => row(`read-idea:b:b-ch1:${concept}`, 'idea', `b:b-ch1:${concept}`, '2026-11-04', { chapter: 'b:b-ch1', conceptId: concept, newSteps: steps, ...(drop ? { dropId: 'drop:daily:2026-11-04' } : {}) }, at);
  it('the base on the first idea, 5 a step, topped up to 15 as the day\'s drop, and complete past the cap', () => {
    const facts = [idea('a', 1, 1, true), idea('b', 3, 2), idea('c', 4, 3), idea('d', 3, 4)];
    expect(ideaLine(facts, 'b:b-ch1', 'a')).toBe('+15 XP');
    expect(ideaLine(facts, 'b:b-ch1', 'b')).toBe('+15 XP');
    expect(ideaLine(facts, 'b:b-ch1', 'c')).toBe('+15 XP');
    expect(ideaLine(facts, 'b:b-ch1', 'd')).toBe('Chapter XP complete · your reading time still counts');
  });
});
