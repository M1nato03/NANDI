import { describe, expect, it } from 'vitest';
import { jarLineFor } from './jar';
import type { LedgerRow } from '../../data/types';

// Spec 54: two counted acts with the same updatedAt; the line names the act whose row came in this update.
describe('spec 54: the jar line on a tie', () => {
  it('names the act in this live-query update, not whichever sorts last', () => {
    const now = new Date('2026-11-05T12:00:00').getTime(), day = '2026-11-05';
    const row = (id: string, mode: string, kind: string): LedgerRow => ({ id, mode, kind, refId: id, dayKey: day, inputs: {}, updatedAt: now, deleted: 0, deviceId: 't' });
    // Same time; by id the idea sorts after the chapter, so "newest" alone would pick the idea.
    const idea = row('idea:z', 'read', 'idea'), chapter = row('chapter:a', 'read', 'chapter');
    const source = { facts: [idea, chapter], settings: [{ key: 'yatra.jarFrom', value: day, updatedAt: 1, deleted: 0 as const, deviceId: 't' }], focus: [] };
    expect(jarLineFor(source as never, day, now, [chapter])).toBe('+5 min into the jar · chapter done');
    expect(jarLineFor(source as never, day, now, [idea])).toBe('+5 min into the jar · idea read');
    // With nothing of its own in the update (a finish whose row lands later), the newest counted act is named.
    expect(jarLineFor(source as never, day, now, [])).toBe('+5 min into the jar · idea read');
  });
});
