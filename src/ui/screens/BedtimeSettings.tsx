import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { RULES } from '../../core/rules.config';
import { getOrCreateDeviceId } from '../../data/device';
import { createSettingsRepos } from '../../data/repos/settings';
import { adaptiveNight, BUSY_SHIFT_KEY, shiftOffKey } from '../../core/adaptive/day';
import { dayKey } from '../../core/time/dayKey';

/**
 * Spec 571 (one place, §0.18 #5): shutdown, bedtime and the long-term goal live behind Grow › Calm & Sleep. Settings
 * keeps a link here. The same keys and the same saving as before; nothing is renamed.
 */
export function BedtimeSettings() {
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.filter(row => row.deleted === 0).toArray(), []);
  const [message, setMessage] = useState('');
  // Spec 660 §3.4: the busy-day line moved here from Plan's More, with its one button (the shift can still be refused today).
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  const night = settings && tasks ? adaptiveNight(settings.filter(row => !row.deleted), tasks, today) : null;
  const value = (key: string, fallback: string) => {
    const saved = settings?.find(row => row.key === key && row.deleted === 0)?.value;
    return typeof saved === 'string' && /^\d{2}:\d{2}$/.test(saved) ? saved : fallback;
  };
  const shutdown = value('planner.shutdown', RULES.night.defaultShutdown);
  const bedtime = value('planner.bedtime', RULES.night.defaultBedtime);
  const goal = value('planner.goalBedtime', RULES.night.goalBedtime);
  async function save(key: string, next: unknown) {
    try {
      const now = Date.now();
      const deviceId = await getOrCreateDeviceId(db, now);
      await createSettingsRepos(db, deviceId).settings.put({ key, value: next }, now);
      setMessage('Planner settings saved.');
    } catch { setMessage('Could not save that setting.'); }
  }
  return <section className="card settings-group bedtime-settings" aria-label="Shutdown and bedtime" data-testid="bedtime-settings"><h2>Shutdown and bedtime</h2>
    <label>Shutdown time <input type="time" value={shutdown} onChange={event => void save('planner.shutdown', event.target.value)} /></label>
    <label>Bedtime target <input type="time" value={bedtime} onChange={event => void save('planner.bedtime', event.target.value)} /></label>
    <p className="setting-help">Your current lights-out time. It sets tonight’s reminders and check-in.</p>
    <label><input type="checkbox" checked={settings?.find(row => row.key === BUSY_SHIFT_KEY && !row.deleted)?.value !== false} onChange={event => void save(BUSY_SHIFT_KEY, event.target.checked)} /> On busy days, start my night later (up to 1&nbsp;hour)</label>
    {night && night.shift > 0 && <p className="small busy-day">Busy day: about {Math.round(night.plannedMinutes / 60)} h planned, so tonight starts {night.shift}&nbsp;min later (bedtime {night.bedtime}). <button type="button" className="text-button" onClick={() => void save(shiftOffKey(today), true)}>Keep my usual time</button></p>}
    <label>Long-term bedtime goal <input type="time" value={goal} onChange={event => void save('planner.goalBedtime', event.target.value)} /></label>
    <p className="setting-help">The earliest target to work toward. After two on-time nights in three, your current target moves 15&nbsp;minutes earlier.</p>
    {message && <p role="status">{message}</p>}
  </section>;
}
