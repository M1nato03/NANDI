import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { backupFileName, exportBackup } from '../../data/backup';
import { getOrCreateDeviceId } from '../../data/device';
import { shareOrDownload } from '../../platform/files';
import { dayKey } from '../../core/time/dayKey';
import { recordError } from '../errorRing';
import { backupWeekOf, shouldNudgeBackup } from '../../core/backupNudge';

const DISMISS_KEY = 'backup.nudgeDismissedWeek';
export function BackupNudge() {
  const now = Date.now(); // eslint-disable-line react-hooks/purity
  const today = dayKey(now);
  const data = useLiveQuery(async () => ({
    first: (await db.ledger.orderBy('dayKey').first())?.dayKey,
    last: (await db.settings.get('lastBackupAt'))?.value,
    dismissed: (await db.settings.get(DISMISS_KEY))?.value,
  }), []);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (!data || (!message && !shouldNudgeBackup(today, data.first, typeof data.last === 'number' ? data.last : undefined, typeof data.dismissed === 'string' ? data.dismissed : undefined, now))) return null;
  const copy = async () => {
    setBusy(true); setMessage('');
    try {
      const at = Date.now();
      const envelope = await exportBackup(db, at);
      const result = await shareOrDownload(new File([JSON.stringify(envelope)], backupFileName(at), { type: 'application/json' }));
      if (result === 'cancelled') { setMessage('No copy made this time.'); return; }
      await db.settings.put({ key: 'lastBackupAt', value: at, updatedAt: at, deleted: 0, deviceId: envelope.deviceId });
      setMessage(result === 'shared' ? 'Copy sent. Your week is safe.' : 'Copy saved to Downloads.');
    } catch (error) { recordError('promise', error); setMessage('Could not make a copy. Try You → Settings → Backup.'); }
    finally { setBusy(false); }
  };
  const later = async () => { const at = Date.now(); await db.settings.put({ key: DISMISS_KEY, value: backupWeekOf(today), updatedAt: at, deleted: 0, deviceId: await getOrCreateDeviceId(db, at) }); };
  return <section className="card backup-nudge" aria-label="Backup copy"><span className="eyebrow">Once a week</span><h2>Keep a copy somewhere safe</h2>
    <p>Everything lives on this phone. Send a backup to Drive, email or a chat with yourself, so your progress moves with you to any new phone.</p>
    {message ? <p role="status">{message}</p> : <div className="sheet-actions"><button type="button" disabled={busy} onClick={() => void copy()}>Copy my backup</button><button type="button" className="secondary" disabled={busy} onClick={() => void later().catch(error => recordError('promise', error))}>Not this week</button></div>}
  </section>;
}
