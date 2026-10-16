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
import { dayKey } from '../../core/time/dayKey';
import { economyVisible } from '../mind/economyVisibility';
import { readNightPlan, nightsBackOnPlan } from '../../core/nightPlan';
import { NightPlanSetting } from './NightPlanSetting';
import { ReminderSettings } from './ReminderSettings';

export function Ground({ theme, motion, setTheme, setMotion }: Appearance) {
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const logs = useLiveQuery(() => db.dailyLog.toArray(), []) ?? [];
  const [message, setMessage] = useState('');
  const [today] = useState(() => dayKey(Date.now()));
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
  const showEconomy = economyVisible(settings ?? [], today);
  const nights = nightsBackOnPlan(logs);
  return <div className="you-settings"><section className="card"><h2>Progress</h2>{showEconomy ? <><strong className="rank">#500</strong><p>Bench · start where you are</p></> : <p>Your progress appears here when it is ready.</p>}</section>
    <section className="card"><h2>Nights back on plan</h2><strong className="night-count">{nights}</strong><p>One night at a time. Back tonight.</p></section>
    {readNightPlan(settings ?? []) && <NightPlanSetting />}
    <button type="button" className="secondary" onClick={() => go('you/backup')}>Backup and restore</button>
    <section className="card"><h2>Settings</h2>
      <label>Theme <select value={theme} onChange={event => void setTheme(event.target.value)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <label>Motion <select value={motion} onChange={event => void setMotion(event.target.value)}><option value="system">System</option><option value="reduce">Reduced</option></select></label>
      <h3>Day and night</h3>
      <label>Shutdown time <input type="time" value={shutdown} onChange={event => void save('planner.shutdown', event.target.value)} /></label>
      <label>Bedtime target <input type="time" value={bedtime} onChange={event => void save('planner.bedtime', event.target.value)} /></label>
      <label>Bedtime goal <input type="time" value={goal} onChange={event => void save('planner.goalBedtime', event.target.value)} /></label>
      <p>Shutdown nudge: {effectiveShutdown(shutdown, bedtime)}. After three nights, the bedtime target can move 15 minutes earlier when two met the target.</p>
      <ReminderSettings />
      {message && <p role="status">{message}</p>}
    </section>
    <p className="small">NANDI {__APP_VERSION__} · {__BUILD_COMMIT__} · {__BUILD_DATE__}</p>
    <ErrorRing />
  </div>;
}
