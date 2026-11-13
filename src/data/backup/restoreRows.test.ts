// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createDb } from '../db';
import { OTHER_LABEL, RESTORE_HIDDEN, RESTORE_LABELS, RESTORE_OTHER, restoreRows } from './restoreRows';
import { exportBackup, previewBackup } from './index';

const stamp = { updatedAt: 1, deleted: 0, deviceId: 'device-a' };

describe('Sat Q1: the restore review in plain words', () => {
  it('labels tables in a fixed order, hides zeros and sums the rest into Other', () => {
    expect(restoreRows({ ledger: 4, tasks: 2, cards: 0, settings: 3, taskEvents: 5, questPhotos: 9, phoneUsageMinutes: 7, someNewTable: 1 }))
      .toEqual([{ label: 'Tasks', count: 2 }, { label: 'Progress record', count: 4 }, { label: OTHER_LABEL, count: 9 }]);
  });

  it('a settings-only file shows only Other', () => {
    expect(restoreRows({ tasks: 0, settings: 3 })).toEqual([{ label: OTHER_LABEL, count: 3 }]);
    expect(restoreRows({ tasks: 0 })).toEqual([]);
  });

  it('a deleted task is not counted', async () => {
    const db = createDb(`restore-rows-${Math.random()}`);
    await db.settings.put({ key: 'deviceId', value: 'device-a', ...stamp });
    await db.tasks.bulkPut([
      { id: 'kept', title: 'Kept', status: 'open', dayKey: '2026-11-13', ...stamp },
      { id: 'gone', title: 'Gone', status: 'open', dayKey: '2026-11-13', ...stamp, deleted: 1 },
    ] as never);
    const preview = previewBackup(await exportBackup(db, new Date(2026, 10, 13, 12)));
    expect(preview.counts.tasks).toBe(2);
    expect(preview.live.tasks).toBe(1);
    expect(restoreRows(preview.live)[0]).toEqual({ label: 'Tasks', count: 1 });
  });

  it('every table on this phone is labelled, known Other or never shown', () => {
    const named = new Set([...RESTORE_LABELS.map(([table]) => table), ...RESTORE_OTHER, ...RESTORE_HIDDEN]);
    const db = createDb(`restore-rows-tables-${Math.random()}`);
    expect(db.tables.map(table => table.name).filter(name => !named.has(name))).toEqual([]);
  });
});
