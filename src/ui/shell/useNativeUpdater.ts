import { useCallback, useEffect, useRef, useState } from 'react';
import { backupFileName, exportBackup } from '../../data/backup';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { isNewerVersion, isUpdateSnoozed, shouldCheckForUpdate, type UpdateVersion } from '../../core/updates';
import { saveBackupToDocuments } from '../../platform/files';
import { checkForUpdate, downloadAndInstall, getInstalledVersion, updaterAvailable, type InstalledVersion } from '../../platform/updater';

const LAST_CHECK = 'updates.lastCheckedAt';
const SNOOZE_CODE = 'updates.snoozedVersionCode';
const SNOOZE_AT = 'updates.snoozedAt';

async function readNumber(key: string): Promise<number | null> {
  const value = (await db.settings.get(key))?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
async function writeNumber(key: string, value: number): Promise<void> {
  const now = Date.now();
  await db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) });
}

export type NativeUpdaterState = {
  available: boolean;
  installed: InstalledVersion | null;
  update: UpdateVersion | null;
  visible: boolean;
  busy: boolean;
  progress: number | null;
  message: string;
  error: boolean;
  check: (force?: boolean) => Promise<void>;
  install: () => Promise<void>;
  later: () => Promise<void>;
};

export function useNativeUpdater(): NativeUpdaterState {
  const available = updaterAvailable();
  const [installed, setInstalled] = useState<InstalledVersion | null>(null);
  const [update, setUpdate] = useState<UpdateVersion | null>(null);
  const [snooze, setSnooze] = useState<{ code: number | null; at: number | null }>({ code: null, at: null });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const checking = useRef(false);
  const installing = useRef(false);

  const check = useCallback(async (force = false) => {
    if (!available || checking.current || installing.current) return;
    checking.current = true;
    if (force) setError(false);
    try {
      const now = Date.now();
      const last = await readNumber(LAST_CHECK);
      if (!force && !shouldCheckForUpdate(true, last, now)) return;
      await writeNumber(LAST_CHECK, now);
      const current = await getInstalledVersion();
      const latest = await checkForUpdate();
      setInstalled(current);
      setUpdate(current && latest && isNewerVersion(latest.versionCode, current.versionCode) ? latest : null);
      if (force) setMessage(current && latest && isNewerVersion(latest.versionCode, current.versionCode) ? 'New version ready.' : "You're up to date.");
      else setMessage('');
      setError(false);
      setSnooze({ code: await readNumber(SNOOZE_CODE), at: await readNumber(SNOOZE_AT) });
    } catch (error) {
      if (force) setMessage(error instanceof Error ? error.message : 'Could not check for updates. Please try again.');
      if (force) setError(true);
    } finally { checking.current = false; }
  }, [available]);

  useEffect(() => {
    if (!available) return;
    void getInstalledVersion().then(setInstalled).catch(() => undefined);
    void Promise.all([readNumber(SNOOZE_CODE), readNumber(SNOOZE_AT)]).then(([code, at]) => setSnooze({ code, at })).catch(() => undefined);
    const resume = () => { if (document.visibilityState === 'visible') { setNow(Date.now()); void check(); } };
    const initial = window.setTimeout(resume, 0);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    return () => { window.clearTimeout(initial); document.removeEventListener('visibilitychange', resume); window.removeEventListener('pageshow', resume); };
  }, [available, check]);

  useEffect(() => {
    if (snooze.at === null) return;
    const remaining = snooze.at + 24 * 60 * 60 * 1000 - Date.now();
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), remaining);
    return () => window.clearTimeout(timer);
  }, [snooze]);

  const later = useCallback(async () => {
    if (!update) return;
    try {
      const at = Date.now();
      await writeNumber(SNOOZE_CODE, update.versionCode);
      await writeNumber(SNOOZE_AT, at);
      setSnooze({ code: update.versionCode, at });
      setNow(at);
      setMessage('');
      setError(false);
    } catch {
      setMessage('Could not save Later. Please try again.');
      setError(true);
    }
  }, [update]);

  const install = useCallback(async () => {
    if (!update || installing.current) return;
    installing.current = true;
    setBusy(true); setProgress(null); setMessage('Saving a backup before the update…');
    setError(false);
    try {
      const now = Date.now();
      const envelope = await exportBackup(db, now);
      const name = backupFileName(now).replace('.json', `-${now}.json`);
      const path = await saveBackupToDocuments(new File([JSON.stringify(envelope)], name, { type: 'application/json' }));
      await writeNumber('lastBackupAt', now);
      setMessage(`Backup saved to ${path}. Downloading update…`);
      await downloadAndInstall(update, setProgress);
      setMessage(`Backup saved to ${path}. Android will ask you to confirm installation.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not prepare the update. Please try again.');
      setError(true);
    } finally { installing.current = false; setBusy(false); }
  }, [update]);

  const visible = !!update && !!installed && !isUpdateSnoozed(update.versionCode, snooze.code, snooze.at, now);
  return { available, installed, update, visible, busy, progress, message, error, check, install, later };
}
