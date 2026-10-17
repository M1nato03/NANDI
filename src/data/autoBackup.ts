import { autoBackupDue, autoBackupFileName, nextFailureStreak } from '../core/autoBackup';
import { pendingWrites, trackWrite } from '../core/pendingWrites';
import { dayKey } from '../core/time/dayKey';
import { saveAutoBackup } from '../platform/files';
import { recordError } from '../ui/errorRing';
import { exportBackup } from './backup';
import { db } from './db';
import { getOrCreateDeviceId } from './device';

const ENABLED = 'autoBackup.enabled';
const SAVED = 'autoBackup.saved';
const FAILURE = 'autoBackup.failure';

export interface AutoBackupState {
  enabled: boolean;
  lastSavedAt: number | null;
  lastSavedDay: string | null;
  kept: number;
  failureDay: string | null;
  failureStreak: number;
}

function details(value: unknown): { at: number; day: string; kept: number } | null {
  if (!value || typeof value !== 'object') return null;
  const saved = value as Record<string, unknown>;
  return typeof saved.at === 'number' && typeof saved.day === 'string' && typeof saved.kept === 'number'
    ? { at: saved.at, day: saved.day, kept: saved.kept } : null;
}

export async function readAutoBackupState(): Promise<AutoBackupState> {
  const [enabled, saved, failed] = await Promise.all([db.settings.get(ENABLED), db.settings.get(SAVED), db.settings.get(FAILURE)]);
  const last = details(saved?.value);
  const failure = failed?.value && typeof failed.value === 'object' ? failed.value as Record<string, unknown> : null;
  return {
    enabled: enabled?.value !== false,
    lastSavedAt: last?.at ?? null,
    lastSavedDay: last?.day ?? null,
    kept: last?.kept ?? 0,
    failureDay: typeof failure?.day === 'string' ? failure.day : null,
    failureStreak: typeof failure?.streak === 'number' ? failure.streak : 0,
  };
}

async function putSetting(key: string, value: unknown, now: number, deviceId?: string): Promise<void> {
  const id = deviceId ?? await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId: id }).then(() => undefined));
}

export async function setAutoBackupEnabled(enabled: boolean): Promise<void> {
  await putSetting(ENABLED, enabled, Date.now());
}

let currentRun: Promise<AutoBackupState> | null = null;

async function waitForWrites(): Promise<void> {
  while (pendingWrites.count > 0) {
    await new Promise<void>(resolve => {
      const stop = pendingWrites.subscribe(count => { if (count === 0) { stop(); resolve(); } });
      if (pendingWrites.count === 0) { stop(); resolve(); }
    });
  }
}

/** Returns the current state. Automatic failures are logged and saved for the next open. */
export async function runAutoBackup(force = false): Promise<AutoBackupState> {
  if (currentRun) {
    const existing = await currentRun;
    return force ? runAutoBackup(true) : existing;
  }
  const task = performAutoBackup(force);
  currentRun = task;
  try { return await task; }
  finally { if (currentRun === task) currentRun = null; }
}

async function performAutoBackup(force: boolean): Promise<AutoBackupState> {
  if (force) await waitForWrites();
  const now = Date.now();
  const state = await readAutoBackupState();
  if (!force && !autoBackupDue(now, state.lastSavedDay, state.enabled, pendingWrites.count)) return state;
  if (force) await waitForWrites();
  try {
    const key = dayKey(now);
    const envelope = await exportBackup(db, now);
    const file = new File([JSON.stringify(envelope)], autoBackupFileName(key), { type: 'application/json' });
    const kept = await saveAutoBackup(file);
    await putSetting(FAILURE, { day: null, streak: 0 }, now, envelope.deviceId);
    await putSetting(SAVED, { at: now, day: key, kept }, now, envelope.deviceId);
    return { ...state, lastSavedAt: now, lastSavedDay: key, kept, failureDay: null, failureStreak: 0 };
  } catch (error) {
    recordError('promise', error);
    const key = dayKey(now);
    const streak = nextFailureStreak(state.failureDay, state.failureStreak, key);
    try { await putSetting(FAILURE, { day: key, streak }, now); }
    catch (saveError) { recordError('promise', saveError); }
    if (force) throw error;
    return { ...state, failureDay: key, failureStreak: streak };
  }
}
