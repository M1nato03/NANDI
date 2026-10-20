import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { revealMeters } from './reveal';

let serial = 0;
const fact = (dayKey: string, kind = 'done'): LedgerRow => ({ id: `${kind}:${++serial}`, dayKey, mode: 'tasks', kind, refId: String(serial), inputs: {}, updatedAt: serial, deleted: 0, deviceId: 'test' });
const preSeason = { start: '2026-11-02', active: false };

describe('calm rewards', () => {
  it('shows only the three day-one cards to a new person', () => {
    expect(revealMeters([], '2026-10-21', preSeason, 0)).toEqual({ quests: false, season: false, cleanWeek: false, shards: false, badges: false, storybooks: false });
  });
  it('opens each meter the first time it means something', () => {
    const facts = [fact('2026-10-21')];
    expect(revealMeters(facts, '2026-10-21', preSeason, 0)).toMatchObject({ quests: true, cleanWeek: false, shards: false, badges: false });
    expect(revealMeters([...facts, fact('2026-10-21', 'badge-tier')], '2026-10-21', preSeason, 5)).toMatchObject({ shards: true, badges: true });
    expect(revealMeters(facts, '2026-10-28', preSeason, 0).cleanWeek).toBe(true);
    expect(revealMeters(facts, '2026-10-27', preSeason, 0).cleanWeek).toBe(false);
  });
  it('teases the season one week ahead and shows it while it runs', () => {
    expect(revealMeters([], '2026-10-25', preSeason, 0).season).toBe(false);
    expect(revealMeters([], '2026-10-26', preSeason, 0).season).toBe(true);
    expect(revealMeters([], '2026-11-10', { start: '2026-11-02', active: true }, 0).season).toBe(true);
  });
  it('offers storybooks once a finished week holds something', () => {
    expect(revealMeters([fact('2026-10-19')], '2026-10-21', preSeason, 0).storybooks).toBe(false);
    expect(revealMeters([fact('2026-10-18')], '2026-10-21', preSeason, 0).storybooks).toBe(true);
  });
});
