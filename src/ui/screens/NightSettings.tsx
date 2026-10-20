import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { DAY_LIMIT_CHOICES, DAY_MODES, DEFAULT_PAUSE_APPS, pauseWindowTimes, readDayLimit, readDayMode } from '../../core/nightPause';
import { RULES } from '../../core/rules.config';
import { nightPauseAvailable, nightPauseStatus, openNightPauseAppInfo, openOverlaySettings, openUsageSettings, testNightPause } from '../../platform/nightPause';
import { notifier } from '../../platform/notifier';

const defaultPackages: string[] = DEFAULT_PAUSE_APPS.map(app => app.packageName);
export function NightSettings() {
  const rows = useLiveQuery(() => db.settings.toArray(), []);
  const [allowed, setAllowed] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [message, setMessage] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const enabled = rows?.find(row => row.key === 'night.pause.enabled')?.value === true;
  const storedPackages = rows?.find(row => row.key === 'night.pause.apps')?.value;
  const packages = Array.isArray(storedPackages) ? storedPackages.filter((item): item is string => typeof item === 'string') : defaultPackages;
  const extras = packages.filter(item => !defaultPackages.includes(item));
  const storedBedtime = rows?.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
  const bedtime = typeof storedBedtime === 'string' ? storedBedtime : RULES.night.defaultBedtime;
  const pauseWindow = pauseWindowTimes(bedtime);
  const dayMode = readDayMode(rows?.find(row => row.key === 'night.pause.dayMode' && !row.deleted)?.value);
  const dayLimit = readDayLimit(rows?.find(row => row.key === 'night.pause.dayLimitMin' && !row.deleted)?.value);
  useEffect(() => {
    if (!nightPauseAvailable()) return;
    const refresh = () => { if (document.visibilityState === 'visible') void nightPauseStatus().then(status => { setAllowed(status.usageAllowed); setOverlay(status.overlayAllowed); }).catch(() => setMessage('Could not check Usage access.')); };
    refresh(); document.addEventListener('visibilitychange', refresh); window.addEventListener('pageshow', refresh);
    return () => { document.removeEventListener('visibilitychange', refresh); window.removeEventListener('pageshow', refresh); };
  }, []);
  if (!nightPauseAvailable()) return <p>App pause is available in the Android app. You can set your night plan in Settings.</p>;
  async function save(key: string, value: unknown) {
    try {
      if (key === 'night.pause.enabled' && value === true && await notifier.requestPermission() !== 'granted') {
        setMessage('Allow NANDI notifications first, so the pause can appear.');
        return;
      }
      const now = Date.now(); // eslint-disable-line react-hooks/purity
      const deviceId = await getOrCreateDeviceId(db, now);
      await db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId });
      setMessage('App pause saved.');
    } catch { setMessage('Could not save App pause.'); }
  }
  async function tryNow() {
    if (!enabled || !allowed) { setMessage('Turn on App pause and Usage access first.'); return; }
    try {
      await testNightPause(RULES.night.pauseTestMin * 60_000);
      setMessage(`For the next ${RULES.night.pauseTestMin} minutes, open one of your chosen apps to see the pause.`);
    } catch { setMessage('Could not start the test. Check that Usage access is on.'); }
  }
  const toggle = (packageName: string) => void save('night.pause.apps', packages.includes(packageName) ? packages.filter(item => item !== packageName) : [...packages, packageName]);
  const add = () => {
    const value = newPackage.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_.]+$/.test(value)) { setMessage('Enter an Android package name, such as com.example.app.'); return; }
    if (!packages.includes(value)) void save('night.pause.apps', [...packages, value]);
    setNewPackage('');
  };
  return <section className="card settings-group" aria-label="App pause settings">
    <h3>App pause</h3>
    <p>Optional. NANDI checks which app is in front, so it can offer a short pause in a chosen app. This needs Android Usage access. The check and your choices stay on this phone.</p>
    <p>Usage access: {allowed ? 'Allowed' : 'Off'}</p>
    {!allowed && <><p>If the switch is greyed out: open NANDI's App info, tap the ⋮ menu (top right), tap 'Allow restricted settings', confirm with your PIN, then come back and turn on Usage access.</p><div className="actions"><button type="button" className="secondary" onClick={() => void openNightPauseAppInfo()}>Open NANDI App info</button><button type="button" className="secondary" onClick={() => void openUsageSettings()}>Open Usage access settings</button></div></>}
    <p>Pop-up over apps: {overlay ? 'Allowed' : 'Off'}</p>
    {!overlay && <><p>Without it, the pause comes only as a notification. Tap below, find NANDI, and turn on 'Allow display over other apps'.</p><div className="actions"><button type="button" className="secondary" onClick={() => void openOverlaySettings()}>Allow pop-up over apps</button></div></>}
    <label><input type="checkbox" checked={enabled} onChange={event => void save('night.pause.enabled', event.target.checked)} /> App pause on</label>
    <p>At night: every time you open a chosen app, from {pauseWindow.start} until {pauseWindow.end} ({RULES.night.pauseLeadMin} minutes before your {bedtime} bedtime). Change the bedtime target in Settings.</p>
    <label>During the day <select value={dayMode} onChange={event => void save('night.pause.dayMode', readDayMode(event.target.value))}>{DAY_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
    {dayMode === 'limit' && <label>Daily limit <select value={dayLimit} onChange={event => void save('night.pause.dayLimitMin', readDayLimit(Number(event.target.value)))}>{DAY_LIMIT_CHOICES.map(minutes => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>}
    <p>{dayMode === 'limit' ? `By day it pauses once your chosen apps reach ${dayLimit} minutes together since 04:00, then each time you open one.` : dayMode === 'open' ? 'By day it pauses every time you open a chosen app.' : 'By day it stays quiet.'} After 'Go anyway' it asks again in {RULES.night.pauseSnoozeMin} minutes. Turn it off here any time.</p>
    <button type="button" className="secondary" onClick={() => void tryNow()}>Try it now for {RULES.night.pauseTestMin} minutes</button>
    {DEFAULT_PAUSE_APPS.map(app => <label key={app.packageName}><input type="checkbox" checked={packages.includes(app.packageName)} onChange={() => toggle(app.packageName)} /> {app.label}</label>)}
    {extras.map(item => <label key={item}><input type="checkbox" checked onChange={() => toggle(item)} /> {item}</label>)}
    <label>Add an app package name <input value={newPackage} onChange={event => setNewPackage(event.target.value)} placeholder="com.example.app" /></label>
    <button type="button" className="secondary" onClick={add}>Add app</button>
    <p>Openings: {Number(rows?.find(row => row.key === 'night.pause.openings')?.value ?? 0)} · Went anyway: {Number(rows?.find(row => row.key === 'night.pause.dismissals')?.value ?? 0)}</p>
    {message && <p role="status">{message}</p>}
  </section>;
}
