import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorNotifier, notifier } from '../../platform/notifier';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { readReminders, REMINDERS_KEY } from '../../core/tasks/reminders';
import { deleteOldReminders } from '../../data/repos/reminderMigration';

const nativeNotifier = notifier as CapacitorNotifier;

export function ReminderSettings() {
  const [exact, setExact] = useState<boolean | null>(null);
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !(notifier instanceof CapacitorNotifier)) return;
    const refresh = () => { void nativeNotifier.exactAlarmGranted().then(setExact); };
    refresh(); document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  if (!Capacitor.isNativePlatform() || !(notifier instanceof CapacitorNotifier)) return <><OldReminders /><p className="small">Reminders are exact only in the installed Android app.</p></>;
  return <section><OldReminders /><h3>Reminders</h3>
    <p>{exact === true ? 'Exact alarms are allowed.' : exact === false ? 'Exact alarms are off. Task and rest reminders may arrive late.' : 'Checking exact alarms…'}</p>
    {exact === false && <button type="button" className="secondary" onClick={() => void nativeNotifier.openExactAlarmSettings()}>Open alarm settings</button>}
  </section>;
}

/**
 * Spec 660 §3.4 (F4): Plan's old Reminders list, kept read-only after its open lines became Later tasks in Mor's list.
 * Shown only while anything is kept; "Delete old reminders" clears them (the Later tasks stay).
 */
export function OldReminders() {
  const row = useLiveQuery(() => db.settings.get(REMINDERS_KEY), []);
  const [message, setMessage] = useState('');
  const list = row && !row.deleted ? readReminders(row.value) : [];
  if (!list.length) return message ? <p role="status" className="small">{message}</p> : null;
  return <section className="old-reminders" aria-labelledby="old-reminders-title" data-testid="old-reminders"><h3 id="old-reminders-title">Old reminders</h3>
    <p className="small">These are in Plan's Later list now. This copy is only for reading.</p>
    <ul className="history-list">{list.map(item => <li key={item.id}>{item.text}{item.doneAt !== undefined ? ' · done' : ''}</li>)}</ul>
    <button type="button" className="secondary" onClick={() => void deleteOldReminders(db).then(() => setMessage('Old reminders deleted.')).catch(() => setMessage('Could not delete them. Try again.'))}>Delete old reminders</button>
  </section>;
}
