import { useEffect, useState } from 'react';
import { readPauseCard } from '../../core/pauseCard';
import { go } from '../shell/router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { DEFAULT_PAUSE_APPS, pauseWindowTimes } from '../../core/nightPause';
import { dayKey } from '../../core/time';
import { RULES } from '../../core/rules.config';
import { initChosenApps, saveChosenApps } from '../../data/repos/chhutti';
import { nightPauseAvailable, nightPauseStatus, openNightPauseAppInfo, openOverlaySettings, openUsageSettings, readInstalledApps, testNightPause } from '../../platform/nightPause';
import { notifier } from '../../platform/notifier';
import { useModalFocus } from '../shell/useModalFocus';

const defaultPackages: string[] = DEFAULT_PAUSE_APPS.map(app => app.packageName);
/** Seen once on this phone before Usage access is first asked for (Play's prominent disclosure; idea engine item 71). */
export const USAGE_DISCLOSURE_KEY = 'night.usageDisclosureAt';

function UsageDisclosure({ onContinue, onClose }: { onContinue: () => void; onClose: () => void }) {
  const dialog = useModalFocus<HTMLElement>(onClose);
  return <div className="sheet-backdrop" onClick={onClose}><section ref={dialog} tabIndex={-1} className="ui-sheet usage-disclosure" role="dialog" aria-modal="true" aria-labelledby="usage-disclosure-title" onClick={event => event.stopPropagation()}>
    <div className="ui-sheet-handle" aria-hidden="true" />
    <h2 id="usage-disclosure-title">Before you turn on Usage access</h2>
    <p>With Usage access, NANDI reads on this phone which app is on screen and when, and when the screen turns off or locks.</p>
    <p>It uses this only for App pause and Phone ki chhutti: to offer a pause in the apps you choose, and to check a phone break you planned.</p>
    <p>It never sees what you read or type in other apps. What it reads stays on this phone. It leaves only when you back up or share, like the rest of NANDI.</p>
    <p>You can turn Usage access off any time in Android settings.</p>
    <div className="actions"><button type="button" onClick={onContinue}>Continue to Usage access</button><button type="button" className="secondary" onClick={onClose}>Not now</button></div>
  </section></div>;
}

export function NightSettings() {
  const rows = useLiveQuery(() => db.settings.toArray(), []);
  const [allowed, setAllowed] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [message, setMessage] = useState('');
  const [newPackage, setNewPackage] = useState('');
  // On the phone, only the default apps that are installed are offered (Codex A item 66): a chosen app that is not
  // installed would stop Phone ki chhutti from checking by itself, so it shows as not on this phone, to untick.
  const [installed, setInstalled] = useState<string[] | null>(null);
  // Which Usage access step waits on the disclosure: Android's Usage access screen or NANDI's App info (item 73).
  const [disclosure, setDisclosure] = useState<'usage' | 'appInfo' | null>(null);
  useEffect(() => { void readInstalledApps(defaultPackages).then(list => { setInstalled(list); return initChosenApps(db, list); }).catch(() => setInstalled(null)); }, []);
  const enabled = rows?.find(row => row.key === 'night.pause.enabled')?.value === true;
  const storedPackages = rows?.find(row => row.key === 'night.pause.apps')?.value;
  const packages = Array.isArray(storedPackages) ? storedPackages.filter((item): item is string => typeof item === 'string') : defaultPackages;
  const extras = packages.filter(item => !defaultPackages.includes(item));
  const storedBedtime = rows?.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
  const bedtime = typeof storedBedtime === 'string' ? storedBedtime : RULES.night.defaultBedtime;
  const pauseWindow = pauseWindowTimes(bedtime);
  const pauseCard = readPauseCard(rows ?? [], dayKey(Date.now())); // eslint-disable-line react-hooks/purity
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
      const now = Date.now();
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
  async function saveApps(next: string[]) {
    try { await saveChosenApps(db, next); setMessage('App pause saved.'); } catch { setMessage('Could not save App pause.'); }
  }
  const disclosed = rows?.some(row => row.key === USAGE_DISCLOSURE_KEY && !row.deleted) ?? false;
  async function continueToUsage() {
    const next = disclosure;
    setDisclosure(null);
    try {
      const now = Date.now();
      await db.settings.put({ key: USAGE_DISCLOSURE_KEY, value: now, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) });
    } catch { /* still open settings: the person chose to continue */ }
    await (next === 'appInfo' ? openNightPauseAppInfo() : openUsageSettings());
  }
  const usageStep = (step: 'usage' | 'appInfo') => disclosed ? void (step === 'appInfo' ? openNightPauseAppInfo() : openUsageSettings()) : setDisclosure(step);
  const toggle = (packageName: string) => void saveApps(packages.includes(packageName) ? packages.filter(item => item !== packageName) : [...packages, packageName]);
  const add = () => {
    const value = newPackage.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_.]+$/.test(value)) { setMessage('Enter an Android package name, such as com.example.app.'); return; }
    if (!packages.includes(value)) void saveApps([...packages, value]);
    setNewPackage('');
  };
  return <section className="card settings-group" aria-label="App pause settings">
    <h3>App pause</h3>
    <p>Optional. NANDI checks which app is in front, so it can offer a short pause in a chosen app. This needs Android Usage access. The check and your choices stay on this phone.</p>
    <p>Usage access: {allowed ? 'Allowed' : 'Off'}</p>
    {!allowed && <><p>If the switch is greyed out: open NANDI's App info, tap the ⋮ menu (top right), tap 'Allow restricted settings', confirm with your PIN, then come back and turn on Usage access.</p><div className="actions"><button type="button" className="secondary" onClick={() => usageStep('appInfo')}>Open NANDI App info</button><button type="button" className="secondary" onClick={() => usageStep('usage')}>Open Usage access settings</button></div></>}
    <p>Pop-up over apps: {overlay ? 'Allowed' : 'Off'}</p>
    {!overlay && <><p>Without it, the pause comes only as a notification. Tap below, find NANDI, and turn on 'Allow display over other apps'.</p><div className="actions"><button type="button" className="secondary" onClick={() => void openOverlaySettings()}>Allow pop-up over apps</button></div></>}
    <label><input type="checkbox" checked={enabled} onChange={event => void save('night.pause.enabled', event.target.checked)} /> App pause on</label>
    <p>At night: every time you open a chosen app, from {pauseWindow.start} until {pauseWindow.end} ({RULES.night.pauseLeadMin} minutes before your {bedtime} bedtime). Change the bedtime target in Settings.</p>
    {/* Spec 39: by day the pause is now the Pause card, set up at Plan → Pause card. */}
    <p>By day: {pauseCard.offToday ? 'the Pause card is off for today' : pauseCard.on ? 'the Pause card shows your plan when you open a picked app' : 'nothing, unless you turn on the Pause card'}. <button type="button" className="text-button" onClick={() => go('plan/pause')}>Plan → Pause card</button></p>
    <p>After 'Go anyway' at night it asks again in {RULES.night.pauseSnoozeMin} minutes. Turn it off here any time.</p>
    <button type="button" className="secondary" onClick={() => void tryNow()}>Try it now for {RULES.night.pauseTestMin} minutes</button>
    {DEFAULT_PAUSE_APPS.filter(app => !installed || installed.includes(app.packageName) || packages.includes(app.packageName)).map(app => <label key={app.packageName}><input type="checkbox" checked={packages.includes(app.packageName)} onChange={() => toggle(app.packageName)} /> {app.label}{installed && !installed.includes(app.packageName) ? ' (not on this phone)' : ''}</label>)}
    {extras.map(item => <label key={item}><input type="checkbox" checked onChange={() => toggle(item)} /> {item}</label>)}
    <label>Add an app package name <input value={newPackage} onChange={event => setNewPackage(event.target.value)} placeholder="com.example.app" /></label>
    <button type="button" className="secondary" onClick={add}>Add app</button>
    <p>Openings: {Number(rows?.find(row => row.key === 'night.pause.openings')?.value ?? 0)} · Went anyway: {Number(rows?.find(row => row.key === 'night.pause.dismissals')?.value ?? 0)}</p>
    {message && <p role="status">{message}</p>}
    {disclosure && <UsageDisclosure onContinue={() => void continueToUsage()} onClose={() => setDisclosure(null)} />}
  </section>;
}
