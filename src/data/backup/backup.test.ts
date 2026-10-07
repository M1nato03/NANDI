// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
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
    expect(envelope).toMatchObject({ app: 'nandi', ppFormatVersion: 1, deviceId: 'device-a' });
    expect((await db.settings.get('lastBackupAt'))?.value).toBe(envelope.exportedAt);
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

  it('validates the envelope and dexie content with readable failures', async () => {
    const envelope = await exportBackup(freshDb(), 1000);
    expect(validateBackup(JSON.stringify(envelope))).toEqual({ success: true, envelope, errors: [] });
    expect(validateBackup('{').errors).toContain('Invalid JSON');
    expect(validateBackup({ ...envelope, app: 'other' }).errors.join(' ')).toMatch(/app/i);
    expect(validateBackup({ ...envelope, ppFormatVersion: 2 }).errors.join(' ')).toMatch(/future/i);
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
    const migrated = migrateEnvelope(old, { 0: value => ({ ...value, app: value.oldApp, ppFormatVersion: 1 }) });
    expect(migrated).toMatchObject({ app: 'nandi', ppFormatVersion: 1 });
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
});
