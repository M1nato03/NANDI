import { useEffect, useState } from 'react';
import { db } from '../../data/db';
import type { SettingRow } from '../../data/types';
import { nightPauseAvailable, nightPauseStatus } from '../../platform/nightPause';
import { PHONE_USAGE_KEYS, pickedApps } from '../../core/phoneUsage/baseline';
import { resumePhoneUsage, stopPhoneUsage } from '../../data/repos/phoneUsage';

/**
 * Spec 46a: the one quiet line about the daily minutes record, in Settings. It says what is kept and where, and has the
 * off switch, which deletes the record (jenil-87, 31 Oct). No number from the record is shown anywhere yet.
 */
export function MinutesRecord({ settings }: { settings: readonly SettingRow[] | undefined }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState('');
  const available = nightPauseAvailable();
  useEffect(() => {
    if (!available) return;
    const refresh = () => { if (document.visibilityState === 'visible') void nightPauseStatus().then(status => setAllowed(status.usageAllowed), () => setAllowed(null)); };
    refresh(); document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [available]);
  const off = settings?.find(row => row.key === PHONE_USAGE_KEYS.off && !row.deleted)?.value === true;
  if (!available || !settings || (!pickedApps(settings) && !off)) return null;
  const line = off ? 'Daily minutes record is off.' : allowed === false ? 'Daily minutes record paused: Usage access is off.' : 'Keeping a daily minutes record on this phone';
  const stop = () => void stopPhoneUsage(db, Date.now()).then(() => { setConfirming(false); setNote('Record deleted. Nothing more is kept.'); }, () => setNote('Could not delete the record. Try again.'));
  const resume = () => void resumePhoneUsage(db).then(() => setNote('A new record starts the next time you open NANDI.'), () => setNote('Could not turn it on. Try again.'));
  return <section className="card settings-group minutes-record" aria-label="Daily minutes record">
    <p className="minutes-record-line">{line}</p>
    <details className="minutes-record-what"><summary>What's kept</summary>
      <p className="setting-help">A daily minutes record for the apps you picked and similar apps, on this phone only. Similar apps are other video and short-video apps and web browsers. A browser counts as a whole app, since Android does not say which site was open.</p>
      <p className="setting-help">For each day, midnight to midnight, it keeps how many minutes each of these apps was on screen. It keeps about 60&nbsp;days. Nothing from it is shown yet.</p>
      <p className="setting-help">It never leaves this phone: not in a backup, a share or a notification.{!off && ' To end it, tap Stop and delete, or turn off Usage access in Android settings.'}</p>
    </details>
    {off ? <button type="button" className="secondary" onClick={resume}>Keep a record again</button>
      : confirming ? <div className="minutes-record-confirm" role="group" aria-label="Delete the record?"><p className="setting-help">Delete the record? This can't be undone.</p><div className="actions"><button type="button" onClick={stop}>Delete it</button><button type="button" className="secondary" onClick={() => setConfirming(false)}>Keep it</button></div></div>
      : <button type="button" className="secondary" onClick={() => { setNote(''); setConfirming(true); }}>Stop and delete the record</button>}
    {note && <p className="setting-help" role="status">{note}</p>}
  </section>;
}
