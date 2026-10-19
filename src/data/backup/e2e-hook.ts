import { createDb, db } from '../db';
import { exportBackup, importBackup } from './index';

export interface BackupRoundTripResult {
  exportedJson: string;
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
}

async function counts(db: ReturnType<typeof createDb>): Promise<Record<string, number>> {
  return Object.fromEntries(await Promise.all(db.tables.map(async table => [table.name, await table.count()])));
}

async function roundTrip(): Promise<BackupRoundTripResult> {
  const db = createDb(`nandi-e2e-backup-${crypto.randomUUID()}`);
  try {
    await db.settings.bulkPut([
      { key: 'deviceId', value: 'e2e-a', updatedAt: 1, deleted: 0, deviceId: 'e2e-a' },
      { key: 'lastBackupAt', value: 1, updatedAt: 1, deleted: 0, deviceId: 'e2e-a' },
      { key: 'retired', value: false, updatedAt: 1, deleted: 0, deviceId: 'e2e-a' },
    ]);
    await db.tasks.add({ id: 'e2e-task', title: 'Backup check', status: 'done', dayKey: '2026-10-07', updatedAt: 1, deleted: 0, deviceId: 'e2e-a' });
    await db.ledger.add({ id: 'task-done:e2e-task', kind: 'task-done', refId: 'e2e-task', mode: 'tasks', dayKey: '2026-10-07', inputs: {}, updatedAt: 1, deleted: 0, deviceId: 'e2e-a' });
    const envelope = await exportBackup(db, Date.now());
    const exportedJson = JSON.stringify(envelope);
    const beforeCounts = await counts(db);
    await Promise.all(db.tables.map(table => table.clear()));
    await db.settings.bulkPut([
      { key: 'deviceId', value: 'e2e-b', updatedAt: 2, deleted: 0, deviceId: 'e2e-b' },
      { key: 'lastBackupAt', value: 2, updatedAt: 2, deleted: 0, deviceId: 'e2e-b' },
      { key: 'retired', value: true, updatedAt: 2, deleted: 0, deviceId: 'e2e-b' },
    ]);
    await importBackup(db, JSON.parse(exportedJson) as typeof envelope);
    const afterCounts = await counts(db);
    if ((await db.settings.get('deviceId'))?.value !== 'e2e-b') throw new Error('Restore replaced device ID');
    return { exportedJson, beforeCounts, afterCounts };
  } finally {
    await db.delete();
  }
}

declare global {
  interface Window {
    __nandiTest?: { backupRoundTrip: typeof roundTrip; roundTripCurrent: typeof roundTripCurrent; seedShell: typeof seedShell; removeShellTask: typeof removeShellTask; shellCounts: typeof shellCounts; wipeData: typeof wipeData };
  }
}

async function seedShell(): Promise<void> {
  await db.tasks.put({ id: 'e2e-shell-task', title: 'Shell check', status: 'done', dayKey: '2026-10-07', updatedAt: 1, deleted: 0, deviceId: 'e2e-shell' });
}
async function removeShellTask(): Promise<void> { await db.tasks.delete('e2e-shell-task'); }
async function shellCounts(): Promise<Record<string, number>> {
  return Object.fromEntries(await Promise.all(db.tables.map(async table => [table.name, await table.count()])));
}
async function wipeData(): Promise<void> { await Promise.all(db.tables.map(table => table.clear())); }
async function roundTripCurrent(): Promise<void> {
  const envelope = await exportBackup(db, Date.now());
  await importBackup(db, envelope);
}

window.__nandiTest = { backupRoundTrip: roundTrip, roundTripCurrent, seedShell, removeShellTask, shellCounts, wipeData };
