import { liveQuery } from 'dexie';
import { db } from '../data/db';
import { readPauseCard } from '../core/pauseCard';
import { adaptiveNight } from '../core/adaptive/day';
import { dayKey } from '../core/time';
import { configureNightPause, nightPauseAvailable } from './nightPause';

/** Restores the opt-in native watcher after app starts or returns from Settings. */
export function startNightPauseSync(onError: (error: unknown) => void): () => void {
  if (!nightPauseAvailable()) return () => {};
  let busy = Promise.resolve();
  const refresh = () => {
    busy = busy.then(async () => {
      const settings = await db.settings.toArray();
      const enabled = settings.some(row => row.key === 'night.pause.enabled' && !row.deleted && row.value === true);
      // The native watcher gets today's bedtime after any busy-day shift (spec 11 W5).
      const today = dayKey(Date.now());
      const night = adaptiveNight(settings, await db.tasks.where('dayKey').equals(today).toArray(), today);
      const bedtime = night.bedtime;
      // Spec 39: by day only the Pause card pauses; off, or off for today, the day mode is off.
      const card = readPauseCard(settings, today);
      const pauseOn = card.on && !card.offToday;
      await configureNightPause(enabled, bedtime, card.packages, { mode: pauseOn ? card.mode : 'off', limitMinutes: card.limitMin }, { on: pauseOn, from: card.window?.from ?? '', to: card.window?.to ?? '' });
    }).catch(onError);
  };
  refresh();
  const subscription = liveQuery(async () => [await db.settings.toArray(), await db.tasks.where('dayKey').equals(dayKey(Date.now())).toArray()]).subscribe({ next: refresh, error: onError });
  const resume = () => { if (document.visibilityState === 'visible') refresh(); };
  document.addEventListener('visibilitychange', resume);
  return () => { subscription.unsubscribe(); document.removeEventListener('visibilitychange', resume); };
}
