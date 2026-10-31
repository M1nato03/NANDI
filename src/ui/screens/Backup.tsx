import { useCallback, useEffect, useState } from 'react';
import { db } from '../../data/db';
import { backupFileName, detectRestoreKind, exportBackup, importBackup, isPreviewDay, previewBackup, validateBackup, type BackupEnvelope } from '../../data/backup';
import { getOrCreateDeviceId } from '../../data/device';
import { importLegacy, mapLegacy, validateLegacy, type LegacyExport } from '../../data/legacy-import';
import { pickFile, shareOrDownload } from '../../platform/files';
import { estimate, requestPersist } from '../../platform/storage';
import { recordError } from '../errorRing';
import { formatDayKey } from '../../core/time/formatDayKey';
import { dayKey } from '../../core/time/dayKey';
import { errorMessage } from '../shell/errorMessage';
import { Capacitor } from '@capacitor/core';
import { readAutoBackupState, runAutoBackup, setAutoBackupEnabled, type AutoBackupState } from '../../data/autoBackup';
import { listAutoBackups } from '../../platform/files';

type RestoreChoice = { kind: 'backup'; data: BackupEnvelope; counts: Record<string, number>; first: string | null; last: string | null; retired: number; skipped: string[] }
  | { kind: 'legacy'; data: LegacyExport; counts: Record<string, number>; first: string | null; last: string | null; retired: number; skipped: string[] };

function legacyPreview(data: LegacyExport): RestoreChoice {
  const rows = mapLegacy(data, { deviceId: 'preview', now: Date.now() });
  const counts = Object.fromEntries(Object.entries(rows).filter(([key]) => key !== 'skipped').map(([key, value]) => [key, value.length]));
  const days: string[] = [];
  for (const row of [...rows.cards, ...rows.deckProg, ...rows.puzzleRuns, ...rows.lessonProg, ...rows.plans]) {
    for (const [key, value] of Object.entries(row)) {
      if ((key === 'dayKey' || key.endsWith('DayKey') || key === 'due' || key === 'last') && isPreviewDay(value)) days.push(value);
    }
  }
  days.sort();
  return { kind: 'legacy', data, counts, first: days[0] ?? null, last: days.at(-1) ?? null,
    retired: rows.deckProg.filter(row => row.b === 99).length, skipped: rows.skipped };
}

export function Backup({ onRestored }: { onRestored: () => Promise<void> }) {
  const [choice, setChoice] = useState<RestoreChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  // The restore's own line sits in its card (jenil-87): the page-bottom status is easy to miss.
  const [restored, setRestored] = useState('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [keepNote, setKeepNote] = useState('');
  const [usage, setUsage] = useState<StorageEstimate | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [auto, setAuto] = useState<AutoBackupState | null>(null);
  const [autoKept, setAutoKept] = useState(0);

  const refresh = useCallback(async (): Promise<void> => {
    const [row, storage, state] = await Promise.all([db.settings.get('lastBackupAt'), estimate(), navigator.storage?.persisted?.()]);
    setLastBackup(typeof row?.value === 'number' ? row.value : null);
    setUsage(storage); setPersisted(state ?? null);
    setCounts(Object.fromEntries(await Promise.all(db.tables.map(async table => [table.name, await table.count()]))));
    if (Capacitor.isNativePlatform()) {
      const [state, files] = await Promise.all([readAutoBackupState(), listAutoBackups()]);
      setAuto(state); setAutoKept(files.length);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh().catch(error => { recordError('promise', error); setMessage('Storage details are unavailable right now.'); }); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function exportFile(): Promise<void> {
    setBusy(true); setMessage('');
    try {
      const now = Date.now();
      const envelope = await exportBackup(db, now);
      const name = backupFileName(now);
      const result = await shareOrDownload(new File([JSON.stringify(envelope)], name, { type: 'application/json' }));
      if (result === 'cancelled') { setMessage('Export cancelled.'); return; }
      await db.settings.put({ key: 'lastBackupAt', value: now, updatedAt: now, deleted: 0, deviceId: envelope.deviceId });
      await refresh(); setMessage(result === 'shared' ? 'Shared.' : `Saved to Downloads as ${name}.`);
    } catch (error) { recordError('promise', error); setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }

  async function chooseFile(): Promise<void> {
    setChoice(null); setMessage(''); setRestored('');
    try {
      const file = await pickFile(); if (!file) return;
      const parsed: unknown = JSON.parse(await file.text());
      const kind = detectRestoreKind(parsed);
      if (kind === 'backup') {
        const checked = validateBackup(parsed);
        if (!checked.success || !checked.envelope) throw new Error(checked.errors.join('; '));
        const preview = previewBackup(checked.envelope);
        setChoice({ kind, data: checked.envelope, counts: preview.counts, first: preview.earliestDayKey, last: preview.latestDayKey,
          retired: preview.retired, skipped: [] });
      } else if (kind === 'legacy') {
        const checked = validateLegacy(parsed); if (!checked.success) throw new Error(checked.errors.join('; '));
        setChoice(legacyPreview(checked.data));
      } else throw new Error('This file is not a NANDI or legacy backup.');
    } catch (error) { setMessage(`Could not read that file: ${errorMessage(error)}`); }
  }

  async function toggleAuto(enabled: boolean): Promise<void> {
    try { await setAutoBackupEnabled(enabled); setAuto(await readAutoBackupState()); }
    catch (error) { recordError('promise', error); setMessage('Could not save automatic backup setting.'); }
  }

  async function backUpNow(): Promise<void> {
    setBusy(true); setMessage('');
    try {
      const state = await runAutoBackup(true);
      setAuto(state); setAutoKept((await listAutoBackups()).length);
      window.dispatchEvent(new Event('nandi:auto-backup-saved'));
      setMessage('Automatic backup saved to Documents/NANDI/auto.');
    } catch (error) { setMessage(`Automatic backup could not be saved: ${errorMessage(error)}`); }
    finally { setBusy(false); }
  }

  async function confirmRestore(): Promise<void> {
    if (!choice) return;
    setBusy(true); setMessage('');
    try {
      if (choice.kind === 'backup') await importBackup(db, choice.data);
      else await importLegacy(db, choice.data, { deviceId: await getOrCreateDeviceId(db, Date.now()), now: Date.now() });
      // Bug hunt 30 Oct: say which backup came back. "Last backup" stays this phone's own last backup.
      const from = choice.kind === 'backup' ? formatDayKey(dayKey(choice.data.exportedAt)) : null;
      setChoice(null); await onRestored(); await refresh(); setRestored(from ? `Restored · backup from ${from}. Your data is ready.` : 'Restore complete. Your data is ready.');
    } catch (error) { recordError('promise', error); setMessage(`Restore could not finish: ${errorMessage(error)}`); }
    finally { setBusy(false); }
  }

  return <section className="screen backup-screen">
    <p className="eyebrow">Keep your work</p><h1>Backup</h1>
    <p>Save a copy you control. The file is plain text and contains your personal data.</p>
    <p className="small">Your own Calm sounds stay on this phone and are not in backups.</p>
    <div className="card"><h2>Save a copy</h2><p>{lastBackup === null ? 'No backup made on this phone yet.' : `Last backup: ${formatDayKey(dayKey(lastBackup))}`}</p><button disabled={busy} onClick={() => void exportFile()}>Export backup</button></div>
    {Capacitor.isNativePlatform() && <div className="card"><h2>Automatic backup</h2>
      <p>Automatic backup: {auto?.enabled === false ? 'off' : 'on'} · last saved {auto?.lastSavedAt ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(auto.lastSavedAt) : 'never'} · {autoKept} kept in Documents/NANDI/auto</p>
      <label><input type="checkbox" role="switch" checked={auto?.enabled !== false} onChange={event => void toggleAuto(event.target.checked)} /> Automatic backup</label>
      <button type="button" className="secondary" disabled={busy} onClick={() => void backUpNow()}>Back up now</button>
    </div>}
    <div className="card"><h2>Bring a copy back</h2><p>Choose a NANDI backup or a legacy export. You will see what is inside before restoring.</p><button className="secondary" disabled={busy} onClick={() => void chooseFile()}>Choose restore file</button>{restored && <p role="status" className="backup-restored">{restored}</p>}</div>
    {choice && <div className="card preview" aria-label="Restore preview">
      <h2>Review restore</h2><p>{choice.kind === 'backup' ? 'NANDI backup' : 'Legacy export'} · {choice.first && choice.last ? `${formatDayKey(choice.first)} to ${formatDayKey(choice.last)}` : 'No dated rows'}</p>
      {choice.retired > 0 && <p>{choice.retired} retired</p>}
      <ul className="count-list">{Object.entries(choice.counts).map(([name, count]) => <li key={name}><span>{name}</span><strong>{count}</strong></li>)}</ul>
      {choice.skipped.length > 0 && <p>Skipped keys: {choice.skipped.join(', ')}</p>}
      <p>{choice.kind === 'backup' ? 'This replaces current app data.' : 'This adds legacy data to this device.'}</p>
      {/* Jenil 24 Oct: a restore replaces today too (cj3 clock fuzz C1), so say so before it happens. */}
      {choice.kind === 'backup' && <p className="restore-today">Today's activity, purchases, owned items, Shards and courtyard growth will be replaced by the backup's.</p>}
      <div className="actions"><button disabled={busy} onClick={() => void confirmRestore()}>Confirm restore</button><button className="secondary" onClick={() => setChoice(null)}>Cancel</button></div>
    </div>}
    <div className="card"><h2>Device storage</h2><p>Persistent storage: {persisted === null ? 'Unavailable' : persisted ? 'On' : 'Off'}</p>
      <p>Used: {usage?.usage === undefined ? 'Unavailable' : `${(usage.usage / 1048576).toFixed(1)} MB`} · Quota: {usage?.quota === undefined ? 'Unavailable' : `${(usage.quota / 1048576).toFixed(1)} MB`}</p>
      <button className="secondary" onClick={() => void requestPersist().then(kept => { setKeepNote(kept ? 'This device will keep NANDI\'s data.' : 'This browser did not agree to keep it. Export a backup now and then, so you always have a copy.'); return refresh(); }).catch(() => setKeepNote('Could not ask just now. Export a backup to keep a copy.'))}>Ask to keep data on this device</button>
      {keepNote && <p className="small" role="status">{keepNote}</p>}</div>
    {counts && <p className="small">Current rows: {Object.values(counts).reduce((a, b) => a + b, 0)}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
