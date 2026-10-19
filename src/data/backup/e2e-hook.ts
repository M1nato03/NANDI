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
    __nandiTest?: { backupRoundTrip: typeof roundTrip; seedShell: typeof seedShell; seedPlannerComplete: typeof seedPlannerComplete; removeShellTask: typeof removeShellTask; shellCounts: typeof shellCounts; wipeData: typeof wipeData; seedLearnNight: typeof seedLearnNight; learnConfidence: typeof learnConfidence };
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
async function seedPlannerComplete(kind: 'fresh' | 'calibration' | 'checkpoint' | 'history'): Promise<void> {
  const at = (date: string) => new Date(date).getTime();
  const meta = { updatedAt: at('2026-10-19T09:00:00'), deleted: 0 as const, deviceId: 'e2e-planner' };
  if (kind === 'fresh') await db.tasks.put({ id: 'fresh-yesterday', title: 'Yesterday task', status: 'unplaced', dayKey: '2026-10-19', firstScheduledDayKey: '2026-10-18', size: 'M', plannedSize: 'M', estimateMin: 30, postponeCount: 0, ...meta });
  if (kind === 'calibration') for (let i = 0; i < 5; i++) {
    const id = `study-${i}`;
    await db.tasks.put({ id, title: `Study sample ${i}`, status: 'done', dayKey: '2026-10-17', firstScheduledDayKey: '2026-10-17', size: 'M', plannedSize: 'M', estimateMin: 30, category: 'study', postponeCount: 0, doneAt: at('2026-10-17T12:00:00'), ...meta });
    await db.focus.put({ id: `focus-${i}`, taskId: id, startedAt: at('2026-10-17T10:00:00'), endedAt: at('2026-10-17T10:42:00'), ...meta });
  }
  if (kind === 'checkpoint') await db.tasks.put({ id: 'due-task', title: 'Prepare exam', status: 'planned', dayKey: '2026-10-27', firstScheduledDayKey: '2026-10-27', scheduledStart: at('2026-10-27T12:00:00'), size: 'M', plannedSize: 'M', estimateMin: 60, postponeCount: 0, ...meta });
  if (kind === 'history') {
    await db.tasks.put({ id: 'history-task', title: 'History task', status: 'planned', dayKey: '2026-10-19', firstScheduledDayKey: '2026-10-18', scheduledStart: at('2026-10-19T14:00:00'), size: 'M', plannedSize: 'M', estimateMin: 30, postponeCount: 1, ...meta });
    await db.taskEvents.put({ id: 'history-event', taskId: 'history-task', kind: 'postponed', at: at('2026-10-18T12:00:00'), reason: 'blocked', budgetCounted: true, ...meta });
  }
}

async function seedLearnNight(conceptId: string, dueAt: number, selectedTopic = 'money-markets'): Promise<void> {
  const at = Date.now();
  await db.settings.put({ key: 'learn.selectedTopics', value: [selectedTopic], updatedAt: at, deleted: 0, deviceId: 'e2e-learn' });
  await db.learnConcepts.put({ id: conceptId, mastery: 0.8, attempts: 2, firstLearnedAt: at - 3 * 86_400_000,
    memory: { stability: 2, difficulty: 5, interval: 2, lastReview: at - 3 * 86_400_000, dueAt },
    activeMisconceptions: [], updatedAt: at, deleted: 0, deviceId: 'e2e-learn' });
}
async function learnConfidence(): Promise<string | undefined> {
  const rows = await db.ledger.where('kind').anyOf('learn-answer', 'learn-retention').toArray();
  return rows.at(-1)?.inputs.confidence as string | undefined;
}

window.__nandiTest = { backupRoundTrip: roundTrip, seedShell, seedPlannerComplete, removeShellTask, shellCounts, wipeData, seedLearnNight, learnConfidence };
