import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { DEFAULT_PAUSE_APPS } from '../../core/nightPause';
import { RULES } from '../../core/rules.config';
import { nightPauseAvailable, nightPauseStatus, openNightPauseAppInfo, openUsageSettings } from '../../platform/nightPause';
import { notifier } from '../../platform/notifier';

const defaultPackages: string[] = DEFAULT_PAUSE_APPS.map(app => app.packageName);
export function NightSettings() {
  const rows = useLiveQuery(() => db.settings.toArray(), []);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const enabled = rows?.find(row => row.key === 'night.pause.enabled')?.value === true;
  const storedPackages = rows?.find(row => row.key === 'night.pause.apps')?.value;
  const packages = Array.isArray(storedPackages) ? storedPackages.filter((item): item is string => typeof item === 'string') : defaultPackages;
  const extras = packages.filter(item => !defaultPackages.includes(item));
  useEffect(() => {
    if (!nightPauseAvailable()) return;
    const refresh = () => { if (document.visibilityState === 'visible') void nightPauseStatus().then(status => setAllowed(status.usageAllowed)).catch(() => setMessage('Could not check Usage access.')); };
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
    <label><input type="checkbox" checked={enabled} onChange={event => void save('night.pause.enabled', event.target.checked)} /> Night pause on</label>
    <p>From {RULES.night.pauseLeadMin} minutes before bedtime until 04:00. Turn it off here any time.</p>
    {DEFAULT_PAUSE_APPS.map(app => <label key={app.packageName}><input type="checkbox" checked={packages.includes(app.packageName)} onChange={() => toggle(app.packageName)} /> {app.label}</label>)}
    {extras.map(item => <label key={item}><input type="checkbox" checked onChange={() => toggle(item)} /> {item}</label>)}
    <label>Add an app package name <input value={newPackage} onChange={event => setNewPackage(event.target.value)} placeholder="com.example.app" /></label>
    <button type="button" className="secondary" onClick={add}>Add app</button>
    <p>Openings: {Number(rows?.find(row => row.key === 'night.pause.openings')?.value ?? 0)} · Went anyway: {Number(rows?.find(row => row.key === 'night.pause.dismissals')?.value ?? 0)}</p>
    {message && <p role="status">{message}</p>}
  </section>;
}
