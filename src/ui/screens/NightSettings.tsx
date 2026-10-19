import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { DEFAULT_PAUSE_APPS, pauseWindowTimes } from '../../core/nightPause';
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
  useEffect(() => {
    if (!nightPauseAvailable()) return;
    const refresh = () => { if (document.visibilityState === 'visible') void nightPauseStatus().then(status => { setAllowed(status.usageAllowed); setOverlay(status.overlayAllowed); }).catch(() => setMessage('Could not check Usage access.')); };
    refresh(); document.addEventListener('visibilitychange', refresh); window.addEventListener('pageshow', refresh);
    return () => { document.removeEventListener('visibilitychange', refresh); window.removeEventListener('pageshow', refresh); };
  }, []);
  if (!nightPauseAvailable()) return <p>Night pause is available in the Android app. You can set your night plan in Settings.</p>;
  async function save(key: string, value: unknown) {
    try {
      if (key === 'night.pause.enabled' && value === true && await notifier.requestPermission() !== 'granted') {
        setMessage('Allow NANDI notifications first, so the pause can appear.');
        return;
      }
      const now = Date.now(); // eslint-disable-line react-hooks/purity
      const deviceId = await getOrCreateDeviceId(db, now);
      await db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId });
      setMessage('Night pause saved.');
    } catch { setMessage('Could not save Night pause.'); }
  }
  async function tryNow() {
    if (!enabled || !allowed) { setMessage('Turn on Night pause and Usage access first.'); return; }
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
  return <section className="card settings-group" aria-label="Night pause settings">
    <h3>Night pause</h3>
    <p>Optional. NANDI checks which app is in front during your bedtime window, so it can offer a short pause before a chosen app. This needs Android Usage access. The check and your choices stay on this phone.</p>
    <p>Usage access: {allowed ? 'Allowed' : 'Off'}</p>
    {!allowed && <><p>If the switch is greyed out: open NANDI's App info, tap the ⋮ menu (top right), tap 'Allow restricted settings', confirm with your PIN, then come back and turn on Usage access.</p><div className="actions"><button type="button" className="secondary" onClick={() => void openNightPauseAppInfo()}>Open NANDI App info</button><button type="button" className="secondary" onClick={() => void openUsageSettings()}>Open Usage access settings</button></div></>}
    <p>Pop-up over apps: {overlay ? 'Allowed' : 'Off'}</p>
    {!overlay && <><p>Without it, the pause comes only as a notification. Tap below, find NANDI, and turn on 'Allow display over other apps'.</p><div className="actions"><button type="button" className="secondary" onClick={() => void openOverlaySettings()}>Allow pop-up over apps</button></div></>}
    <label><input type="checkbox" checked={enabled} onChange={event => void save('night.pause.enabled', event.target.checked)} /> Night pause on</label>
    <p>Pauses from {pauseWindow.start} until {pauseWindow.end}, {RULES.night.pauseLeadMin} minutes before your {bedtime} bedtime. Change the bedtime target in Settings. Turn it off here any time.</p>
    <button type="button" className="secondary" onClick={() => void tryNow()}>Try it now for {RULES.night.pauseTestMin} minutes</button>
    {DEFAULT_PAUSE_APPS.map(app => <label key={app.packageName}><input type="checkbox" checked={packages.includes(app.packageName)} onChange={() => toggle(app.packageName)} /> {app.label}</label>)}
    {extras.map(item => <label key={item}><input type="checkbox" checked onChange={() => toggle(item)} /> {item}</label>)}
    <label>Add an app package name <input value={newPackage} onChange={event => setNewPackage(event.target.value)} placeholder="com.example.app" /></label>
    <button type="button" className="secondary" onClick={add}>Add app</button>
    <p>Openings: {Number(rows?.find(row => row.key === 'night.pause.openings')?.value ?? 0)} · Went anyway: {Number(rows?.find(row => row.key === 'night.pause.dismissals')?.value ?? 0)}</p>
    {message && <p role="status">{message}</p>}
  </section>;
}
