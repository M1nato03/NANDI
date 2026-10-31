import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Capacitor } from '@capacitor/core';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { notifier } from '../../platform/notifier';
import { openNightPauseAppInfo } from '../../platform/nightPause';

/** End-to-end tests say the phone turned notifications off (never set in the app itself). */
const E2E = 'nandi.e2eNotify';
/** Reminders ring on the phone app, so the card is for the phone (a browser's own setting is not NANDI's to show). */
async function notificationsOff(): Promise<boolean> {
  try { if (sessionStorage.getItem(E2E) === 'denied') return true; } catch { /* storage is optional */ }
  if (!Capacitor.isNativePlatform()) return false;
  try { return await notifier.checkPermission() === 'denied'; } catch { return false; }
}

/**
 * a11y C10: when notifications are off for NANDI and something today would ring (a timed task, or a focus notice), one
 * plain card says so, with the way to turn them on in the phone's settings. It never nags: it shows only where it
 * matters, and only while they are off.
 */
export function RemindersOff({ focus = false }: { focus?: boolean }) {
  const timed = useLiveQuery(() => db.tasks.where('dayKey').equals(dayKey(Date.now())).filter(row => !row.deleted && row.status === 'planned' && typeof row.scheduledStart === 'number').count(), []);
  const [off, setOff] = useState(false);
  useEffect(() => {
    const look = () => { if (document.visibilityState === 'visible') void notificationsOff().then(setOff); };
    look();
    document.addEventListener('visibilitychange', look);
    return () => document.removeEventListener('visibilitychange', look);
  }, []);
  if (!off || (!focus && !timed)) return null;
  const phone = Capacitor.isNativePlatform();
  return <aside className="card reminders-off" aria-label="Reminders are off">
    <h2>Reminders are off</h2>
    <p>{focus ? "Notifications are off for NANDI, so focus notices can't reach you outside the app." : "Notifications are off for NANDI, so your timed tasks won't ring."}</p>
    {phone ? <button type="button" className="secondary" onClick={() => void openNightPauseAppInfo()}>Open phone settings</button>
      : <p className="small">Turn them on in your browser's site settings for NANDI.</p>}
    {phone && <p className="small">There: Notifications, then allow them for NANDI.</p>}
  </aside>;
}
