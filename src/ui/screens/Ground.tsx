import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { RULES } from '../../core/rules.config';
import { effectiveShutdown } from '../../core/tasks/planner';
import { getOrCreateDeviceId } from '../../data/device';
import { createSettingsRepos } from '../../data/repos/settings';
import { go } from '../shell/router';
import { ErrorRing } from './ErrorRing';
import type { Appearance } from '../shell/useAppearance';
import { NightPlanSetting } from './NightPlanSetting';
import { ReminderSettings } from './ReminderSettings';
import { nightPauseAvailable } from '../../platform/nightPause';

export function Ground({ theme, motion, setTheme, setMotion }: Appearance) {
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const [message, setMessage] = useState('');
  const value = (key: string, fallback: string) => {
    const saved = settings?.find(row => row.key === key && row.deleted === 0)?.value;
    return typeof saved === 'string' && /^\d{2}:\d{2}$/.test(saved) ? saved : fallback;
  };
  const shutdown = value('planner.shutdown', RULES.night.defaultShutdown);
  const bedtime = value('planner.bedtime', RULES.night.defaultBedtime);
  const goal = value('planner.goalBedtime', RULES.night.goalBedtime);
  async function save(key: string, next: string) {
    try {
      const now = Date.now();
      const deviceId = await getOrCreateDeviceId(db, now);
      await createSettingsRepos(db, deviceId).settings.put({ key, value: next }, now);
      setMessage('Planner settings saved.');
    } catch { setMessage('Could not save that setting.'); }
  }
  return <div className="you-settings"><NightPlanSetting />
    {nightPauseAvailable() && <button type="button" className="secondary" onClick={() => go('you/night')}>Night pause</button>}
    <button type="button" className="secondary" onClick={() => go('you/backup')}>Backup and restore</button>
    <section className="card"><h2>Appearance</h2>
      <label>Theme <select value={theme} onChange={event => void setTheme(event.target.value)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <label>Motion <select value={motion} onChange={event => void setMotion(event.target.value)}><option value="system">System</option><option value="reduce">Reduced</option></select></label>
      <h3 className="day-night-heading">Day and night</h3>
      <label>Shutdown time <input type="time" value={shutdown} onChange={event => void save('planner.shutdown', event.target.value)} /></label>
      <label>Bedtime target <input type="time" value={bedtime} onChange={event => void save('planner.bedtime', event.target.value)} /></label>
      <p className="setting-help">Your current lights-out time. It sets tonight's reminders and check-in.</p>
      <label>Long-term bedtime goal <input type="time" value={goal} onChange={event => void save('planner.goalBedtime', event.target.value)} /></label>
      <p className="setting-help">The earliest target to work toward. After two on-time nights in three, your current target moves 15 minutes earlier.</p>
      <p>Shutdown nudge: {effectiveShutdown(shutdown, bedtime)}.</p>
      <ReminderSettings />
      {message && <p role="status">{message}</p>}
    </section>
    <details className="about-app"><summary>About this app</summary><p className="small">NANDI {__APP_VERSION__} · {__BUILD_COMMIT__} · {__BUILD_DATE__}</p><ErrorRing /></details>
  </div>;
}
