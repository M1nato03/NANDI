import { useEffect } from 'react';
import { liveQuery } from 'dexie';
import type { SettingRow, TaskRow } from '../../data/types';
import { db } from '../../data/db';
import { buildWidgetText } from '../../core/widgetText';
import { setWidgetState, widgetAvailable } from '../../platform/widget';
import { recordError } from '../errorRing';

type WidgetRows = { tasks: TaskRow[]; settings: SettingRow[] };

export function useWidgetSync(): void {
  useEffect(() => {
    if (!widgetAvailable()) return;
    let latest: WidgetRows | undefined;
    let timer: number | undefined;
    let pending = Promise.resolve();
    const send = (rows: WidgetRows) => {
      const state = buildWidgetText(rows.tasks, rows.settings, Date.now());
      pending = pending.then(() => setWidgetState(state)).catch(error => recordError('promise', error));
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (latest) send(latest); }, 2000);
    };
    const subscription = liveQuery(async () => ({
      tasks: await db.tasks.toArray(),
      settings: await db.settings.toArray(),
    })).subscribe({
      next: rows => { latest = rows; schedule(); },
      error: error => recordError('promise', error),
    });
    const flush = () => {
      window.clearTimeout(timer);
      void Promise.all([db.tasks.toArray(), db.settings.toArray()])
        .then(([tasks, settings]) => { latest = { tasks, settings }; send(latest); })
        .catch(error => recordError('promise', error));
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); else schedule(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    const minute = window.setInterval(schedule, 60_000);
    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timer);
      window.clearInterval(minute);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, []);
}
