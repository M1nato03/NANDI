import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
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
import { notifier } from '../../platform/notifier';
import { MORNING_DEFAULT, NUDGE_MORNING_ON, NUDGE_MORNING_TIME, NUDGE_NIGHT_ON, NUDGE_PERMISSION_ASKED } from '../../core/nudges';

export function Ground({ theme, motion, setTheme, setMotion }: Appearance) {
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const [message, setMessage] = useState('');
  const [nudgeDraft, setNudgeDraft] = useState<Record<string, boolean>>({});
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const requestingPermission = useRef(false);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const refresh = () => { if (document.visibilityState === 'visible') void notifier.checkPermission().then(setPermission); };
    refresh(); document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  const value = (key: string, fallback: string) => {
    const saved = settings?.find(row => row.key === key && row.deleted === 0)?.value;
    return typeof saved === 'string' && /^\d{2}:\d{2}$/.test(saved) ? saved : fallback;
  };
  const shutdown = value('planner.shutdown', RULES.night.defaultShutdown);
  const bedtime = value('planner.bedtime', RULES.night.defaultBedtime);
  const goal = value('planner.goalBedtime', RULES.night.goalBedtime);
  const morning = value(NUDGE_MORNING_TIME, MORNING_DEFAULT);
  const enabled = (key: string) => nudgeDraft[key] ?? (settings?.find(row => row.key === key && !row.deleted)?.value !== false);
  const asked = settings?.find(row => row.key === NUDGE_PERMISSION_ASKED && !row.deleted)?.value === true;
  async function save(key: string, next: unknown) {
    try {
      const now = Date.now();
      const deviceId = await getOrCreateDeviceId(db, now);
      await createSettingsRepos(db, deviceId).settings.put({ key, value: next }, now);
      setMessage('Planner settings saved.');
      return true;
    } catch { setMessage('Could not save that setting.'); return false; }
  }
  async function askPermission() {
    if (asked || requestingPermission.current || !Capacitor.isNativePlatform()) return;
    requestingPermission.current = true;
    await save(NUDGE_PERMISSION_ASKED, true);
    try {
      const result = await notifier.requestPermission();
      setPermission(result);
      setMessage(result === 'granted' ? 'Notifications are allowed.' : 'Notifications are off. You can allow them in Android app settings.');
    } catch { setMessage('Could not check notification permission.'); }
  }
  async function toggleNudge(key: string, checked: boolean) {
    setNudgeDraft(previous => ({ ...previous, [key]: checked }));
    if (!await save(key, checked)) {
      setNudgeDraft(previous => previous[key] === checked ? { ...previous, [key]: !checked } : previous);
      return;
    }
    if (checked && permission !== 'granted') await askPermission();
  }
  return <div className="you-settings"><NightPlanSetting />
    {nightPauseAvailable() && <button type="button" className="secondary ui-list-row" onClick={() => go('you/night')}>Night pause</button>}
    <button type="button" className="secondary ui-list-row" onClick={() => go('you/backup')}>Backup and restore</button>
    <section className="card settings-group"><h2>Appearance</h2>
      <label>Theme <select value={theme} onChange={event => void setTheme(event.target.value)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <label>Motion <select value={motion} onChange={event => void setMotion(event.target.value)}><option value="system">System</option><option value="reduce">Reduced</option></select></label>
    </section>
    <section className="card settings-group"><h2 className="day-night-heading">Day and night</h2>
      <label>Shutdown time <input type="time" value={shutdown} onChange={event => void save('planner.shutdown', event.target.value)} /></label>
      <label>Bedtime target <input type="time" value={bedtime} onChange={event => void save('planner.bedtime', event.target.value)} /></label>
      <p className="setting-help">Your current lights-out time. It sets tonight's reminders and check-in.</p>
      <label>Long-term bedtime goal <input type="time" value={goal} onChange={event => void save('planner.goalBedtime', event.target.value)} /></label>
      <p className="setting-help">The earliest target to work toward. After two on-time nights in three, your current target moves 15 minutes earlier.</p>
      <p>Shutdown nudge: {effectiveShutdown(shutdown, bedtime)}.</p>
      <label><input type="checkbox" checked={enabled(NUDGE_NIGHT_ON)} onChange={event => void toggleNudge(NUDGE_NIGHT_ON, event.target.checked)} /> Night deck nudge</label>
      <p className="setting-help">A quiet reminder at shutdown time ({effectiveShutdown(shutdown, bedtime)}). Stays on this phone.</p>
      <label><input type="checkbox" checked={enabled(NUDGE_MORNING_ON)} onChange={event => void toggleNudge(NUDGE_MORNING_ON, event.target.checked)} /> Morning first step nudge</label>
      <p className="setting-help">One local reminder for your first task each morning.</p>
      <label>Morning nudge time <input type="time" value={morning} onChange={event => void save(NUDGE_MORNING_TIME, event.target.value)} /></label>
      {Capacitor.isNativePlatform() && permission !== 'granted' && <p className="setting-help">Notifications are off on this phone. {asked ? 'Allow NANDI notifications in Android app settings.' : 'Allow NANDI notifications to receive these nudges.'} {!asked && <button type="button" className="secondary" onClick={() => void askPermission()}>Allow notifications</button>}</p>}
      <ReminderSettings />
      {message && <p role="status">{message}</p>}
    </section>
    <details className="about-app"><summary>About this app</summary><p className="small">NANDI {__APP_VERSION__} · {__BUILD_COMMIT__} · {__BUILD_DATE__}</p><button type="button" className="secondary ui-list-row" onClick={() => go('you/contentreview')}>Review content</button><button type="button" className="text-button small" onClick={() => go('you/mind/generator')}>Puzzle generator check</button><ErrorRing /></details>
  </div>;
}
