import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { weekStart } from '../../core/economy/deriveEconomy';
import { effectiveShutdown } from '../../core/tasks/planner';
import { validReward } from '../../core/tasks/complete';
import { getOrCreateDeviceId } from '../../data/device';
import { createSettingsRepos } from '../../data/repos/settings';
import { readRestWeekday, setRestWeekday } from '../../data/repos/economy';
import { askNotificationsOnce } from '../../platform/notifyPermission';
import { go } from '../shell/router';
import { ErrorRing } from './ErrorRing';
import type { Appearance } from '../shell/useAppearance';
import { NightPlanSetting } from './NightPlanSetting';
import { ReminderSettings } from './ReminderSettings';
import { nightPauseAvailable } from '../../platform/nightPause';
import { BUSY_SHIFT_KEY, INTERESTS, INTERESTS_KEY, readInterests, type InterestId } from '../../core/adaptive/day';
import { notifier } from '../../platform/notifier';
import { MORNING_DEFAULT, NUDGE_MORNING_ON, NUDGE_MORNING_TIME, NUDGE_NIGHT_ON, NUDGE_STREAK_ON, NUDGE_PERMISSION_ASKED } from '../../core/nudges';

export function Ground({ theme, motion, setTheme, setMotion }: Appearance) {
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const [message, setMessage] = useState('');
  const [rewardDraft, setRewardDraft] = useState('');
  const [rewardToggleDraft, setRewardToggleDraft] = useState<boolean | null>(null);
  const [nudgeSaving, setNudgeSaving] = useState<Record<string, boolean>>({});
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const requestingPermission = useRef(false);
  const interests = readInterests(settings ?? []);
  // Owner panel: tap the version line 5 times within 3 seconds.
  const ownerTaps = useRef<number[]>([]);
  const interestQueue = useRef<Promise<unknown>>(Promise.resolve());
  const ownerTap = () => {
    const now = Date.now();
    ownerTaps.current = [...ownerTaps.current.filter(at => now - at < 3000), now];
    if (ownerTaps.current.length >= 5) { ownerTaps.current = []; go('you/owner'); }
  };
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
  const restWeek = weekStart(dayKey(Date.now())); // eslint-disable-line react-hooks/purity
  const reward = settings?.find(row => row.key === 'planner.reward')?.value;
  const rewardName = typeof reward === 'string' ? reward : '';
  const rewardOn = settings?.find(row => row.key === 'planner.rewardEnabled')?.value === true;
  const enabled = (key: string) => settings?.find(row => row.key === key && !row.deleted)?.value !== false;
  const asked = settings?.find(row => row.key === NUDGE_PERMISSION_ASKED && !row.deleted)?.value === true;
  // Taps are queued and read the stored list, so two quick taps never overwrite each other.
  function toggleInterest(id: InterestId) {
    interestQueue.current = interestQueue.current.then(async () => {
      const row = await db.settings.get(INTERESTS_KEY);
      const current = readInterests(row ? [row] : []);
      return save(INTERESTS_KEY, current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    }).catch(() => undefined);
  }

  async function save(key: string, next: unknown) {
    try {
      const now = Date.now(); // eslint-disable-line react-hooks/purity
      const deviceId = await getOrCreateDeviceId(db, now);
      await createSettingsRepos(db, deviceId).settings.put({ key, value: next }, now);
      setMessage('Planner settings saved.');
      return true;
    } catch { setMessage('Could not save that setting.'); return false; }
  }
  async function askPermission() {
    if (asked || requestingPermission.current || !Capacitor.isNativePlatform()) return;
    requestingPermission.current = true;
    try {
      const result = await askNotificationsOnce();
      if (result === 'skipped') return;
      setPermission(result);
      setMessage(result === 'granted' ? 'Notifications are allowed.' : 'Notifications are off. You can allow them in Android app settings.');
    } catch { setMessage('Could not check notification permission.'); }
  }
  async function toggleNudge(key: string, checked: boolean) {
    if (nudgeSaving[key]) return;
    setNudgeSaving(previous => ({ ...previous, [key]: true }));
    try {
      if (await save(key, checked) && checked && permission !== 'granted') await askPermission();
    } finally { setNudgeSaving(previous => ({ ...previous, [key]: false })); }
  }
  return <div className="you-settings"><NightPlanSetting />
    {nightPauseAvailable() && <button type="button" className="secondary ui-list-row" onClick={() => go('you/night')}>App pause</button>}
    <button type="button" className="secondary ui-list-row" onClick={() => go('you/backup')}>Backup and restore</button>
    <section className="card settings-group" aria-label="Plan settings"><h2>Plan</h2><label><input type="checkbox" checked={rewardToggleDraft ?? rewardOn} onChange={event => { const checked = event.target.checked; setRewardToggleDraft(checked); void save('planner.rewardEnabled', checked).then(ok => { if (!ok) setRewardToggleDraft(null); }); }} /> Reward after a focus block</label><label>Name your reward <input value={rewardDraft || rewardName} onChange={event => setRewardDraft(event.target.value)} placeholder="Chai or a short walk" /></label><button type="button" className="secondary" onClick={() => { const name = (rewardDraft || rewardName).trim(); if (!validReward(name)) { setMessage('Pick something away from the feed, like chai or a short walk.'); return; } void save('planner.reward', name).then(ok => { if (ok) setRewardDraft(''); }); }}>Save reward</button></section>
    <section className="card settings-group"><h2>Appearance</h2>
      <label>Theme <select value={theme} onChange={event => void setTheme(event.target.value)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <label>Motion <select value={motion} onChange={event => void setMotion(event.target.value)}><option value="system">System</option><option value="reduce">Reduced</option></select></label>
      <label><input type="checkbox" checked={settings?.find(row => row.key === 'economy.soundOn')?.value === true} onChange={event => void save('economy.soundOn', event.target.checked)} /> Soft check-off sounds</label>
    </section>
    <section className="card settings-group" aria-label="What you enjoy"><h2>What you enjoy</h2><p className="setting-help">NANDI suggests one of these, with a clear end, when you pause or finish your day.</p>
      <div className="interest-chips">{INTERESTS.map(item => { const chosen = interests.includes(item.id); return <button type="button" key={item.id} className={chosen ? 'interest-chip on' : 'interest-chip'} aria-pressed={chosen} onClick={() => toggleInterest(item.id)}>{item.label}</button>; })}</div>
    </section>
    <section className="card settings-group"><h2 className="day-night-heading">Day and night</h2>
      <label>Shutdown time <input type="time" value={shutdown} onChange={event => void save('planner.shutdown', event.target.value)} /></label>
      <label>Bedtime target <input type="time" value={bedtime} onChange={event => void save('planner.bedtime', event.target.value)} /></label>
      <p className="setting-help">Your current lights-out time. It sets tonight's reminders and check-in.</p>
      <label><input type="checkbox" checked={settings?.find(row => row.key === BUSY_SHIFT_KEY && !row.deleted)?.value !== false} onChange={event => void save(BUSY_SHIFT_KEY, event.target.checked)} /> On busy days, start my night later (up to 1 hour)</label>
      <label>Long-term bedtime goal <input type="time" value={goal} onChange={event => void save('planner.goalBedtime', event.target.value)} /></label>
      <label>Weekly rest day <select value={String(readRestWeekday(settings ?? [], restWeek) ?? '')} onChange={event => { void setRestWeekday(db, Number(event.target.value)).then(() => setMessage('Planner settings saved.'), () => setMessage('Could not save that setting.')); }}><option value="" disabled>Choose a day</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option></select></label>
      <p className="setting-help">The earliest target to work toward. After two on-time nights in three, your current target moves 15 minutes earlier.</p>
      <p>Shutdown nudge: {effectiveShutdown(shutdown, bedtime)}.</p>
      <label><input type="checkbox" checked={enabled(NUDGE_NIGHT_ON)} disabled={!!nudgeSaving[NUDGE_NIGHT_ON]} onChange={event => void toggleNudge(NUDGE_NIGHT_ON, event.target.checked)} /> Night deck nudge</label>
      <p className="setting-help">A quiet reminder at shutdown time ({effectiveShutdown(shutdown, bedtime)}). Stays on this phone.</p>
      <label><input type="checkbox" checked={enabled(NUDGE_MORNING_ON)} disabled={!!nudgeSaving[NUDGE_MORNING_ON]} onChange={event => void toggleNudge(NUDGE_MORNING_ON, event.target.checked)} /> Morning first step nudge</label>
      <p className="setting-help">One local reminder for your first task each morning.</p>
      <label>Morning nudge time <input type="time" value={morning} onChange={event => void save(NUDGE_MORNING_TIME, event.target.value)} /></label>
      <label><input type="checkbox" checked={settings?.find(row => row.key === NUDGE_STREAK_ON && !row.deleted)?.value === true} disabled={!!nudgeSaving[NUDGE_STREAK_ON]} onChange={event => void toggleNudge(NUDGE_STREAK_ON, event.target.checked)} /> Streak reminder</label>
      <p className="setting-help">Optional, before wind-down. A small step still counts.</p>
      {Capacitor.isNativePlatform() && permission !== 'granted' && <p className="setting-help">Notifications are off on this phone. {asked ? 'Allow NANDI notifications in Android app settings.' : 'Allow NANDI notifications to receive these nudges.'} {!asked && <button type="button" className="secondary" onClick={() => void askPermission()}>Allow notifications</button>}</p>}
      <ReminderSettings />
      {message && <p role="status">{message}</p>}
    </section>
    <details className="about-app"><summary>About this app</summary><p className="small" onClick={ownerTap}>NANDI {__APP_VERSION__} · {__BUILD_COMMIT__} · {__BUILD_DATE__}</p><button type="button" className="secondary ui-list-row" onClick={() => go('you/cast')}>Meet the cast</button><button type="button" className="secondary ui-list-row" onClick={() => go('you/contentreview')}>Review content</button><a className="secondary ui-list-row" href="privacy.html">Privacy notice</a><button type="button" className="text-button small" onClick={() => go('you/mind/generator')}>Puzzle generator check</button><ErrorRing /></details>
  </div>;
}
