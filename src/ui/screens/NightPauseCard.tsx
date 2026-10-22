import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { DEFAULT_PAUSE_APPS, pauseCardCopy } from '../../core/nightPause';
import { boundedSuggestion, readInterests } from '../../core/adaptive/day';
import { dayKey } from '../../core/time';
import { readNightPlan, nightPlanText } from '../../core/nightPlan';
import { RULES } from '../../core/rules.config';
import { clearNightPause, openPausedApp } from '../../platform/nightPause';
import { go } from '../shell/router';
import { Kachhua } from '../cast/Cast';
import { useModalFocus } from '../shell/useModalFocus';

export function NightPauseCard({ packageName, reason = 'night', minutes = 0, close }: { packageName: string; reason?: string; minutes?: number; close: () => void }) {
  // No Escape: the pause has its own one-tap choices.
  const dialog = useModalFocus<HTMLDivElement>();
  const rows = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const [seconds, setSeconds] = useState<number>(RULES.night.pauseBreathSeconds);
  const [message, setMessage] = useState('');
  const recorded = useRef(false);
  const acting = useRef(false);
  const label = DEFAULT_PAUSE_APPS.find(app => app.packageName === packageName)?.label ?? 'the app';
  const plan = readNightPlan(rows);
  const suggestion = boundedSuggestion(readInterests(rows), dayKey(Date.now()), reason === 'night'); // eslint-disable-line react-hooks/purity
  const copy = pauseCardCopy({ reason, minutes, label, planText: plan ? nightPlanText(plan) : null, suggestion });
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  async function finish(kind: 'openings' | 'dismissals') {
    if (recorded.current) return;
    const now = Date.now(); // eslint-disable-line react-hooks/purity
    const deviceId = await getOrCreateDeviceId(db, now);
    const key = `night.pause.${kind}`;
    const previous = await db.settings.get(key);
    await db.settings.put({ key, value: Number(previous?.value ?? 0) + 1, updatedAt: now, deleted: 0, deviceId });
    recorded.current = true;
    await clearNightPause();
  }
  async function swap(route: string) {
    if (acting.current) return;
    acting.current = true;
    try { await finish('openings'); close(); if (route !== 'close') go(route); }
    catch { acting.current = false; setMessage('Could not open that. Try again.'); }
  }
  async function goAnyway() {
    if (acting.current) return;
    acting.current = true;
    try {
      await finish('dismissals');
      await openPausedApp(packageName, RULES.night.pauseSnoozeMin * 60_000);
      close();
    } catch { acting.current = false; setMessage('Could not open that app. You can leave NANDI normally.'); }
  }
  return <div ref={dialog} tabIndex={-1} className="night-pause-overlay" role="dialog" aria-modal="true" aria-label="Night pause">
    <section className="card night-pause-card">
      <Kachhua pose="rest" size={48} /><p className="eyebrow">A small pause</p><h1>Take one breath</h1>
      <p role="timer">{seconds > 0 ? `Breathe for ${seconds} more seconds` : 'The breath is yours.'}</p>
      <p>{copy.lead}</p>
      {seconds === 0 && <><h2 className="night-pause-ask">What would feel better right now?</h2>
        <div className="night-pause-swaps">{copy.swaps.map((item, index) => <button type="button" key={item.label} className={index === 0 ? undefined : 'secondary'} onClick={() => void swap(item.route)}>{item.label}</button>)}</div></>}
      <button type="button" className="text-button night-pause-anyway" onClick={() => void goAnyway()}>Go to {label} anyway</button>
      {message && <p role="status">{message}</p>}
    </section>
  </div>;
}
