import { liveQuery } from 'dexie';
import { db } from '../data/db';
import { DEFAULT_PAUSE_APPS, readDayLimit, readDayMode } from '../core/nightPause';
import { RULES } from '../core/rules.config';
import { configureNightPause, nightPauseAvailable } from './nightPause';

/** Restores the opt-in native watcher after app starts or returns from Settings. */
export function startNightPauseSync(onError: (error: unknown) => void): () => void {
  if (!nightPauseAvailable()) return () => {};
  const keys = ['night.pause.enabled', 'night.pause.apps', 'planner.bedtime', 'night.pause.dayMode', 'night.pause.dayLimitMin'];
  let busy = Promise.resolve();
  const refresh = () => {
    busy = busy.then(async () => {
      const rows = await db.settings.bulkGet(keys);
      const value = (index: number) => rows[index]?.deleted === 0 ? rows[index]?.value : undefined;
      const enabled = value(0) === true;
      const bedtime = typeof value(2) === 'string' ? String(value(2)) : RULES.night.defaultBedtime;
      const savedApps = value(1);
      const packages = Array.isArray(savedApps) ? savedApps.filter((item): item is string => typeof item === 'string') : DEFAULT_PAUSE_APPS.map(app => app.packageName);
      await configureNightPause(enabled, bedtime, packages, { mode: readDayMode(value(3)), limitMinutes: readDayLimit(value(4)) });
    }).catch(onError);
  };
  refresh();
  const subscription = liveQuery(() => db.settings.bulkGet(keys)).subscribe({ next: refresh, error: onError });
  const resume = () => { if (document.visibilityState === 'visible') refresh(); };
  document.addEventListener('visibilitychange', resume);
  return () => { subscription.unsubscribe(); document.removeEventListener('visibilitychange', resume); };
}
