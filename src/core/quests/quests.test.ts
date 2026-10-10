import { describe, expect, it } from 'vitest';
import { applyTap, archivePast, complete, selectWeekly, weekKey, type Quest } from './index';

const quest: Quest = { id: 'q:2026-W41', sourceId: 'q', week: '2026-W41', title: 'Walk', kind: 'total', target: 20, unit: 'km', step: 1, progress: 0, tapIds: [], status: 'active', custom: false };

describe('weekly side quests', () => {
  it('changes weeks on Monday at 04:00 and handles ISO year boundaries', () => {
    expect(weekKey(new Date(2026, 9, 12, 3, 59))).toBe('2026-W41');
    expect(weekKey(new Date(2026, 9, 12, 4))).toBe('2026-W42');
    expect(weekKey(new Date(2027, 0, 1, 12))).toBe('2026-W53');
  });
  it('selects three deterministically and avoids prior picks', () => {
    const pack = Array.from({ length: 10 }, (_, i) => ({ ...quest, id: String(i), sourceId: String(i) }));
    const first = selectWeekly(pack, '2026-W41');
    expect(first).toHaveLength(3);
    expect(selectWeekly(pack, '2026-W41')).toEqual(first);
    expect(selectWeekly(pack, '2026-W42', first.map(q => q.sourceId)).map(q => q.sourceId).filter(id => first.some(q => q.sourceId === id))).toHaveLength(0);
  });
  it('applies each tap once, clamps progress, and completes once', () => {
    const a = applyTap(quest, 'tap-1', 1);
    expect(applyTap(a, 'tap-1', 1)).toEqual(a);
    expect(applyTap(a, 'tap-2', -1).progress).toBe(0);
    const b = applyTap(a, 'tap-3', 99);
    expect(b.progress).toBe(20);
    expect(b.status).toBe('done');
    expect(complete(b)).toEqual(b);
    expect(applyTap(b, 'tap-4', 1)).toEqual(b);
  });
  it('archives unfinished older quests and retains progress', () => {
    expect(archivePast([quest, { ...quest, id: 'done', status: 'done' }], '2026-W42'))
      .toEqual([{ ...quest, status: 'archived' }, { ...quest, id: 'done', status: 'done' }]);
  });
});
