import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { DEFAULT_PAUSE_APPS } from '../../core/nightPause';
import { readNightPlan, nightPlanText } from '../../core/nightPlan';
import { RULES } from '../../core/rules.config';
import { clearNightPause, openPausedApp } from '../../platform/nightPause';
import { go } from '../shell/router';

export function NightPauseCard({ packageName, close }: { packageName: string; close: () => void }) {
  const rows = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const [seconds, setSeconds] = useState<number>(RULES.night.pauseBreathSeconds);
  const [message, setMessage] = useState('');
  const recorded = useRef(false);
  const acting = useRef(false);
  const label = DEFAULT_PAUSE_APPS.find(app => app.packageName === packageName)?.label ?? 'the app';
  const plan = readNightPlan(rows);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  async function finish(kind: 'openings' | 'dismissals') {
    if (recorded.current) return;
    const now = Date.now();
    const deviceId = await getOrCreateDeviceId(db, now);
    const key = `night.pause.${kind}`;
    const previous = await db.settings.get(key);
    await db.settings.put({ key, value: Number(previous?.value ?? 0) + 1, updatedAt: now, deleted: 0, deviceId });
    recorded.current = true;
    await clearNightPause();
  }
  async function openDeck() {
    if (acting.current) return;
    acting.current = true;
    try { await finish('openings'); close(); go('night'); }
    catch { acting.current = false; setMessage('Could not open the deck. Try again.'); }
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
  return <div className="night-pause-overlay" role="dialog" aria-modal="true" aria-label="Night pause">
    <section className="card night-pause-card">
      <p className="eyebrow">A small pause</p><h1>Take one breath</h1>
      <p role="timer">{seconds > 0 ? `Breathe for ${seconds} more seconds` : 'The breath is yours.'}</p>
      <p>{plan ? nightPlanText(plan) : 'If I reach for Reels at night, then I open my night deck.'}</p>
      <div className="actions"><button type="button" onClick={() => void openDeck()}>Open my night deck</button>
        <button type="button" className="secondary" onClick={() => void goAnyway()}>Go to {label} anyway</button></div>
      {message && <p role="status">{message}</p>}
    </section>
  </div>;
}
