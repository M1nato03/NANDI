import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { DAY_LIMIT_CHOICES } from '../../core/nightPause';
import { cleanAct, GRACE_CHOICES, PAUSE_ACTS, PAUSE_APP_CHOICES, pauseAppLabel, pauseLine, readPauseCard, windowText, type PauseWindow } from '../../core/pauseCard';
import { savePauseSettings } from '../../data/repos/pause';
import { nightPauseAvailable, nightPauseStatus, openOverlaySettings, openUsageSettings, readInstalledApps, readLauncherApps } from '../../platform/nightPause';
import { PauseCard } from './PauseCard';
import './pause.css';

type App = { label: string; packageName: string };
type Draft = { apps: string[]; act: string; window: PauseWindow; mode: 'open' | 'limit'; limitMin: number; grace: number };
type View = 'manage' | 'apps' | 'line' | 'when' | 'rehearse' | 'permissions';

/**
 * Spec 39: Plan → Pause card. Three short steps (apps, the person's line, when), then "See it once" and the two phone
 * permissions in plain words. Someone who had the old day pause keeps it, and is asked once for their line.
 */
export function PauseSetup() {
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  const card = readPauseCard(settings ?? [], today);
  const [view, setView] = useState<View | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [choices, setChoices] = useState<App[]>([...PAUSE_APP_CHOICES]);
  const [others, setOthers] = useState<App[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [access, setAccess] = useState<{ usage: boolean; overlay: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const phone = nightPauseAvailable();

  useEffect(() => {
    // On the phone, offer only the listed apps it has, and any other app it can open.
    void readInstalledApps(PAUSE_APP_CHOICES.map(app => app.packageName)).then(installed => { if (installed) setChoices(PAUSE_APP_CHOICES.filter(app => installed.includes(app.packageName))); }).catch(() => undefined);
    void readLauncherApps().then(apps => { if (apps) setOthers(apps.filter(app => app.packageName !== 'app.nandi.personal').sort((a, b) => a.label.localeCompare(b.label))); }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!phone) return;
    const look = () => { if (document.visibilityState === 'visible') void nightPauseStatus().then(status => setAccess({ usage: status.usageAllowed, overlay: status.overlayAllowed })).catch(() => undefined); };
    look();
    document.addEventListener('visibilitychange', look);
    return () => document.removeEventListener('visibilitychange', look);
  }, [phone]);
  if (!settings) return <section className="screen"><p className="eyebrow">Plan</p><h1>Pause card</h1></section>;

  const setUp = card.on && !card.legacy;
  const current: View = view ?? (setUp ? 'manage' : card.legacy && !card.act ? 'line' : card.legacy ? 'manage' : 'apps');
  // Nothing ticked for someone new; an edit starts from what is saved.
  const work: Draft = draft ?? { apps: card.on ? card.packages : [], act: card.act ?? '', window: card.window, mode: card.mode, limitMin: card.limitMin, grace: card.grace };
  const change = (next: Partial<Draft>) => setDraft({ ...work, ...next });
  const known = [...choices, ...(others ?? [])];
  const labelOf = (packageName: string) => known.find(app => app.packageName === packageName)?.label ?? pauseAppLabel(packageName);
  const appNames = work.apps.map(labelOf);
  const first = work.apps[0] ?? 'com.instagram.android';
  const act = cleanAct(work.act);

  async function save(on: boolean, extra: Partial<Record<'offDay', unknown>> = {}) {
    try {
      await savePauseSettings(db, { on, act: act || undefined, window: work.window ?? false, grace: work.grace, apps: work.apps.length ? work.apps : undefined, mode: work.mode, limitMin: work.limitMin, ...extra }, Date.now());
      setDraft(null); setMessage(''); return true;
    } catch { setMessage('Could not save that. Try again.'); return false; }
  }
  async function quick(change: Partial<Record<'on' | 'offDay' | 'act', unknown>>, done: string) {
    try { await savePauseSettings(db, change, Date.now()); setMessage(done); setView('manage'); setDraft(null); } // eslint-disable-line react-hooks/purity
    catch { setMessage('Could not save that. Try again.'); }
  }

  const steps: View[] = ['apps', 'line', 'when', 'rehearse'];
  const stepNumber = steps.indexOf(current);
  return <section className="screen pause-setup">
    <p className="eyebrow">Plan</p>
    <h1>Pause card</h1>
    {current === 'manage' && <>
      <p>When you open a picked app, NANDI shows your plan first. Every way out is one tap.</p>
      <div className="card pause-step">
        <h2>{card.offToday ? 'Off for today' : card.on ? 'On' : 'Off'}</h2>
        {card.on && <>
          <p className="pause-line-preview">{pauseLine(labelOf(card.packages[0] ?? first), card.act)}</p>
          <p className="small">{card.packages.map(labelOf).join(', ')} · {windowText(card.window)} · {card.mode === 'limit' ? `after ${card.limitMin} min a day` : 'every open'} · quiet {card.grace} min after "Open anyway"</p>
        </>}
        {card.legacy && !card.act && <p>Your day pause now shows a plan. Write the one thing you'll do first.</p>}
        <div className="pause-setup-nav">
          {card.on && !card.offToday && <button type="button" className="secondary" onClick={() => void quick({ offDay: today }, 'Off for today. It comes back tomorrow.')}>Off for today</button>}
          {card.offToday && <button type="button" className="secondary" onClick={() => void quick({ offDay: '' }, 'On again.')}>On again today</button>}
          <button type="button" onClick={() => { setDraft(null); setView('apps'); }}>{card.on ? 'Change it' : 'Set it up'}</button>
        </div>
        {card.on && <button type="button" className="text-button" onClick={() => void quick({ on: false }, 'The Pause card is off.')}>Turn it off</button>}
      </div>
      {phone && card.on && access && (!access.usage || !access.overlay) && <PhoneAccess access={access} />}
    </>}

    {stepNumber >= 0 && <p className="small">Step {Math.min(stepNumber + 1, 3)} of 3{current === 'rehearse' ? ' · see it once' : ''}</p>}

    {current === 'apps' && <div className="card pause-step">
      <h2>Pick the apps</h2>
      <p>The card shows when one of these comes to the front. Nothing is ticked until you tick it.</p>
      <ul className="pause-apps">{[...choices, ...known.filter(app => work.apps.includes(app.packageName) && !choices.some(choice => choice.packageName === app.packageName))].map(app => <li key={app.packageName}><label>
        <input type="checkbox" checked={work.apps.includes(app.packageName)} onChange={event => change({ apps: event.target.checked ? [...work.apps, app.packageName] : work.apps.filter(name => name !== app.packageName) })} />{app.label}</label></li>)}</ul>
      {others && others.length > 0 && <label>Add another app <select value="" onChange={event => { const name = event.target.value; if (name && !work.apps.includes(name)) change({ apps: [...work.apps, name] }); }}>
        <option value="">Choose an app</option>{others.filter(app => !work.apps.includes(app.packageName)).map(app => <option key={app.packageName} value={app.packageName}>{app.label}</option>)}</select></label>}
      <div className="pause-setup-nav">
        {card.on && <button type="button" className="secondary" onClick={() => { setDraft(null); setView('manage'); }}>Cancel</button>}
        <button type="button" disabled={!work.apps.length} onClick={() => setView('line')}>Next</button>
      </div>
    </div>}

    {current === 'line' && <div className="card pause-step">
      <h2>Write your line</h2>
      <label htmlFor="pause-act">If I open {appNames.length ? appNames.join(' or ') : 'one of them'}, I'll … first.</label>
      <input id="pause-act" value={work.act} maxLength={80} onChange={event => change({ act: event.target.value })} placeholder="do 10 squats" />
      <div className="pause-acts" role="group" aria-label="Quick picks">{PAUSE_ACTS.map(pick => <button type="button" key={pick} className={act === pick ? undefined : 'secondary'} aria-pressed={act === pick} onClick={() => change({ act: pick })}>{pick}</button>)}</div>
      <p className="small">A small thing you can do in 2 minutes, away from the screen if you can.</p>
      <div className="pause-setup-nav">
        <button type="button" className="secondary" onClick={() => setView(card.legacy && !card.act && !draft ? 'manage' : 'apps')}>Back</button>
        {card.legacy && !card.act && !view
          ? <button type="button" disabled={!act} onClick={() => void quick({ act, on: true }, 'Saved. Your plan shows next time.')}>Save my line</button>
          : <button type="button" disabled={!act} onClick={() => setView('when')}>Next</button>}
      </div>
    </div>}

    {current === 'when' && <div className="card pause-step">
      <h2>When</h2>
      <fieldset className="pause-when"><legend>Show the card</legend>
        <label><input type="radio" name="pause-window" checked={!work.window} onChange={() => change({ window: null })} /> All day until bedtime</label>
        <label><input type="radio" name="pause-window" checked={!!work.window} onChange={() => change({ window: { from: '09:00', to: '21:00' } })} /> From … to …</label>
        {work.window && <div className="pause-times"><label>From <input type="time" value={work.window.from} onChange={event => change({ window: { ...work.window!, from: event.target.value } })} /></label><label>to <input type="time" value={work.window.to} onChange={event => change({ window: { ...work.window!, to: event.target.value } })} /></label></div>}
      </fieldset>
      <fieldset className="pause-when"><legend>How often</legend>
        <label><input type="radio" name="pause-mode" checked={work.mode === 'open'} onChange={() => change({ mode: 'open' })} /> Every open</label>
        <label><input type="radio" name="pause-mode" checked={work.mode === 'limit'} onChange={() => change({ mode: 'limit' })} /> After <select aria-label="Minutes a day" value={work.limitMin} onChange={event => change({ mode: 'limit', limitMin: Number(event.target.value) })}>{DAY_LIMIT_CHOICES.map(minutes => <option key={minutes} value={minutes}>{minutes}</option>)}</select> min a day</label>
      </fieldset>
      <label>After "Open anyway", stay quiet for <select value={work.grace} onChange={event => change({ grace: Number(event.target.value) })}>{GRACE_CHOICES.map(minutes => <option key={minutes} value={minutes}>{minutes} min</option>)}</select></label>
      <p className="small">At bedtime the night pause takes over.</p>
      <div className="pause-setup-nav">
        <button type="button" className="secondary" onClick={() => setView('line')}>Back</button>
        <button type="button" onClick={() => setView('rehearse')}>Next</button>
      </div>
    </div>}

    {current === 'rehearse' && <div className="card pause-step">
      <h2>See it once</h2>
      <p>This is what shows when you open {labelOf(first)}:</p>
      <p className="pause-line-preview">{pauseLine(labelOf(first), act || null)}</p>
      <button type="button" className="secondary" onClick={() => setDemo(true)}>See it once</button>
      <div className="pause-setup-nav">
        <button type="button" className="secondary" onClick={() => setView('when')}>Back</button>
        <button type="button" onClick={() => void save(true).then(ok => { if (ok) setView(phone ? 'permissions' : 'manage'); if (ok && !phone) setMessage('The Pause card is on. It shows in the Android app.'); })}>Turn it on</button>
      </div>
    </div>}

    {current === 'permissions' && <>
      <div className="card pause-step"><h2>The Pause card is on</h2><p>Two phone settings let it appear over the app. Without them it can't show.</p></div>
      {access ? <PhoneAccess access={access} /> : <p className="small">Checking the phone's settings…</p>}
      <button type="button" onClick={() => setView('manage')}>Done</button>
    </>}

    {!phone && current !== 'manage' && <p className="small">The card appears in NANDI's Android app. Here you can set it up and see it once.</p>}
    {message && <p role="status">{message}</p>}
    {demo && <PauseCard demo demoAct={act || null} packageName={first} close={() => setDemo(false)} />}
  </section>;
}

function PhoneAccess({ access }: { access: { usage: boolean; overlay: boolean } }) {
  return <div className="card pause-step">
    <h2>Phone settings</h2>
    <p>{access.usage ? '✓ Usage access is on: NANDI can see which app is in front. It keeps nothing but the app and the time.' : 'Usage access lets NANDI see which app comes to the front. The app names and times stay on this phone.'}</p>
    {!access.usage && <button type="button" className="secondary" onClick={() => void openUsageSettings()}>Open Usage access</button>}
    <p>{access.overlay ? '✓ "Display over other apps" is on: the card can show over the app.' : '"Display over other apps" lets the card show over the app you opened.'}</p>
    {!access.overlay && <button type="button" className="secondary" onClick={() => void openOverlaySettings()}>Open Display over other apps</button>}
  </div>;
}
