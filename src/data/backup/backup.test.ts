// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup, previewBackup, validateBackup, backupFileName, migrateEnvelope } from './index';

let serial = 0;
const opened: NandiDb[] = [];
function freshDb(): NandiDb {
  const db = createDb(`backup-test-${++serial}`);
  opened.push(db);
  return db;
}
const stamp = { updatedAt: 10, deleted: 0 as const, deviceId: 'device-a' };
const localKeys = ['deviceId', 'lastBackupAt', 'retired'];

async function snapshot(db: NandiDb) {
  return Object.fromEntries(await Promise.all(db.tables.map(async table => [table.name, await table.toArray()])));
}

afterEach(async () => {
  for (const db of opened.splice(0)) await db.delete();
});

describe('backup and restore', () => {
  it('round trips every table, including tombstones and ledger facts, while keeping local settings', async () => {
    const db = freshDb();
    await db.settings.bulkPut([
      { key: 'deviceId', value: 'device-a', ...stamp },
      { key: 'retired', value: false, ...stamp },
      { key: 'theme', value: 'dark', ...stamp },
    ]);
    await db.tasks.bulkPut([
      { id: 'task-1', title: 'One', status: 'open', dayKey: '2026-10-06', ...stamp },
      { id: 'task-2', title: 'Two', status: 'done', dayKey: '2026-10-08', ...stamp, deleted: 1 },
    ]);
    await db.ledger.add({ id: 'task-done:task-2', kind: 'task-done', refId: 'task-2', mode: 'tasks', dayKey: '2026-10-08', inputs: { plannedSize: 'S' }, ...stamp });
    await db.cards.add({ id: 'card-1', deckId: 'greene', due: '2026-10-09', ...stamp });
    await db.dailyLog.add({ dayKey: '2026-10-07', reelsBucket: 'none', ...stamp });
    const envelope = await exportBackup(db, new Date(2026, 9, 9, 12));
    const before = await snapshot(db);
    expect(backupFileName(new Date(2026, 9, 9, 12))).toBe('nandi-backup-2026-10-09.json');
    expect(envelope).toMatchObject({ app: 'nandi', ppFormatVersion: 2, deviceId: 'device-a' });
    expect(await db.settings.get('lastBackupAt')).toBeUndefined();
    const preview = previewBackup(envelope);
    expect(preview.counts).toMatchObject({ tasks: 2, ledger: 1, cards: 1, dailyLog: 1 });
    expect(preview.earliestDayKey).toBe('2026-10-06');
    expect(preview.latestDayKey).toBe('2026-10-09');
    await Promise.all(db.tables.map(table => table.clear()));
    await db.settings.bulkPut([
      { key: 'deviceId', value: 'device-b', ...stamp, deviceId: 'device-b' },
      { key: 'lastBackupAt', value: 999, ...stamp, deviceId: 'device-b' },
      { key: 'retired', value: true, ...stamp, deviceId: 'device-b' },
    ]);
    await importBackup(db, envelope);
    const after = await snapshot(db);
    for (const name of Object.keys(before)) {
      if (name === 'settings') continue;
      expect(after[name], name).toEqual(before[name]);
    }
    expect((after.settings as { key: string; value: unknown }[]).filter(row => !localKeys.includes(row.key)))
      .toEqual((before.settings as { key: string; value: unknown }[]).filter(row => !localKeys.includes(row.key)));
    expect(await db.settings.get('deviceId')).toMatchObject({ value: 'device-b', deviceId: 'device-b' });
    expect(await db.settings.get('lastBackupAt')).toMatchObject({ value: 999, deviceId: 'device-b' });
    expect(await db.settings.get('retired')).toMatchObject({ value: true, deviceId: 'device-b' });
  });

  it('restores a long run of day closes in one settings write, keeping the higher close per day', async () => {
    // Batch 3 (b): a put per close woke every live query once per row, so a year's restore took 212 s.
    const db = freshDb();
    const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);
    const close = (total: number) => ({ total, sp: total, streak: 1, paused: false, shards: 0, owned: [], purchases: [] });
    await db.settings.bulkPut(Array.from({ length: 120 }, (_, n) => ({ key: `economy.close:${day(n)}`, value: close(10), ...stamp })));
    const envelope = await exportBackup(db, new Date(2026, 4, 1, 12));
    await db.settings.clear();
    await db.settings.bulkPut(Array.from({ length: 120 }, (_, n) => ({ key: `economy.close:${day(n)}`, value: close(n % 2 ? 30 : 5), ...stamp })));
    // Each settings.put after the import is its own commit, and so one wake-up for every live query.
    const puts = vi.spyOn(db.settings, 'put');
    await importBackup(db, envelope);
    // The peak and the seen-up-to day are one put each; the closes are one bulkPut, never a put per day.
    expect(puts.mock.calls.length).toBeLessThanOrEqual(2);
    expect(puts.mock.calls.every(([row]) => !String(row.key).startsWith('economy.close:'))).toBe(true);
    // The restore also closes the books up to today, as reconcile would; the 120 restored days are the ones checked.
    const rows = await db.settings.where('key').between(`economy.close:${day(0)}`, `economy.close:${day(119)}`, true, true).toArray();
    expect(rows).toHaveLength(120);
    expect(rows.map(row => (row.value as { total: number }).total)).toEqual(Array.from({ length: 120 }, (_, n) => n % 2 ? 30 : 10));
  });

  it('validates the envelope and dexie content with readable failures', async () => {
    const envelope = await exportBackup(freshDb(), 1000);
    expect(validateBackup(JSON.stringify(envelope))).toEqual({ success: true, envelope, errors: [] });
    expect(validateBackup('{').errors).toContain('Invalid JSON');
    expect(validateBackup({ ...envelope, app: 'other' }).errors.join(' ')).toMatch(/app/i);
    expect(validateBackup({ ...envelope, ppFormatVersion: 3 }).errors.join(' ')).toMatch(/future/i);
    expect(validateBackup({ ...envelope, exportedAt: undefined }).errors.join(' ')).toMatch(/exportedAt/i);
    expect(validateBackup({ ...envelope, dexie: { formatName: 'dexie' } }).errors.join(' ')).toMatch(/dexie/i);
  });

  it('leaves retired sentinel dates out of the preview range', async () => {
    const db = freshDb();
    await db.tasks.add({ id: 'dated', title: 'Dated', status: 'open', dayKey: '2026-10-02', ...stamp });
    await db.deckProg.add({ id: 'retired-item', b: 99, due: '9999-12-31', ...stamp });
    const preview = previewBackup(await exportBackup(db, 1000));
    expect(preview).toMatchObject({ earliestDayKey: '2026-10-02', latestDayKey: '2026-10-02', retired: 1 });
  });

  it('runs pure envelope migrators in order', () => {
    const old = { ppFormatVersion: 0, oldApp: 'nandi', value: 1 };
    const original = structuredClone(old);
    const migrated = migrateEnvelope(old, { 0: value => ({ ...value, app: value.oldApp, ppFormatVersion: 1 }), 1: value => ({ ...value, ppFormatVersion: 2 }) });
    expect(migrated).toMatchObject({ app: 'nandi', ppFormatVersion: 2 });
    expect(old).toEqual(original);
  });

  it('rejects an incomplete backup before clearing the current database', async () => {
    const db = freshDb();
    await db.tasks.add({ id: 'keep', title: 'Keep', status: 'open', dayKey: '2026-10-07', ...stamp });
    const envelope = await exportBackup(db, 1000);
    const incomplete = structuredClone(envelope);
    incomplete.dexie.data.tables.pop();
    incomplete.dexie.data.data.pop();
    await expect(importBackup(db, incomplete)).rejects.toThrow('tables do not match');
    expect(await db.tasks.get('keep')).toBeDefined();
  });

  it('restores a v1 backup into v2, then round trips quests and ledger facts', async () => {
    const db = freshDb();
    await db.tasks.add({ id: 'old-task', title: 'Old task', status: 'open', dayKey: '2026-10-05', ...stamp });
    const old = structuredClone(await exportBackup(db, 1000));
    old.ppFormatVersion = 1 as 2;
    old.dexie.data.databaseVersion = 1;
    old.dexie.data.tables = old.dexie.data.tables.filter(table => table.name !== 'quests');
    old.dexie.data.data = old.dexie.data.data.filter(table => table.tableName !== 'quests');
    const migrated = validateBackup(old);
    expect(migrated.success).toBe(true);
    await db.tasks.clear();
    await importBackup(db, migrated.envelope!);
    expect((await db.tasks.get('old-task'))?.title).toBe('Old task');
    expect(await db.quests.count()).toBe(0);
    await db.quests.add({ id: 'q:2026-W41', sourceId: 'q', week: '2026-W41', title: 'Quest', kind: 'once', target: 1, unit: '', step: 1, progress: 1, tapIds: [], status: 'done', custom: false, ...stamp });
    await db.ledger.add({ id: 'quest:q:2026-W41:2026-W41', mode: 'quests', kind: 'quest', refId: 'q:2026-W41', dayKey: '2026-10-08', inputs: {}, ...stamp });
    const exported = await exportBackup(db, 2000);
    await db.quests.clear(); await db.ledger.clear();
    await importBackup(db, exported);
    expect((await db.quests.get('q:2026-W41'))?.progress).toBe(1);
    expect(await db.ledger.count()).toBe(1);
  });
});
