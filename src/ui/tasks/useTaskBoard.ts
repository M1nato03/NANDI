import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { createTaskRepos } from '../../data/repos/tasks';
import { dayKey } from '../../core/time/dayKey';
import { errorMessage } from '../shell/errorMessage';

const reposPromise = getOrCreateDeviceId(db, Date.now()).then((id) => createTaskRepos(db, id));
export type TaskRepos = Awaited<typeof reposPromise>;

export function useTaskBoard() {
  const tasks = useLiveQuery(() => db.tasks.filter((row) => row.deleted === 0).toArray(), []);
  const focus = useLiveQuery(() => db.focus.filter((row) => row.deleted === 0).toArray(), []);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // The clock re-renders every screen that uses the board, so it ticks each second only while a focus
  // timer runs, and otherwise once a minute (cj2 heavy data #2: idle Plan at a year of data used the whole CPU).
  const timing = useRef(false);
  useEffect(() => { timing.current = !!focus?.some(row => row.endedAt == null); }, [focus]);
  useEffect(() => {
    let lastDay = dayKey(Date.now());
    let lastMinute = Math.floor(Date.now() / 60_000);
    const refresh = (event?: Event) => {
      const at = Date.now();
      const minute = Math.floor(at / 60_000);
      if (!event && !timing.current && minute === lastMinute) return;
      lastMinute = minute;
      setNow(at);
      const currentDay = dayKey(at);
      if (currentDay !== lastDay) {
        lastDay = currentDay;
        void reposPromise.then((repos) => repos.reconcile(at)).catch((error) => setMessage(errorMessage(error)));
      }
    };
    const interval = window.setInterval(() => refresh(), 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    void reposPromise.then((repos) => repos.reconcile(Date.now())).catch((error) => setMessage(errorMessage(error)));
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('pageshow', refresh); };
  }, []);
  async function act(operation: (repos: TaskRepos, at: number) => Promise<unknown>, success = ''): Promise<boolean> {
    setBusy(true); setMessage('');
    try { await operation(await reposPromise, Date.now()); setMessage(success); return true; }
    catch (error) { setMessage(errorMessage(error)); return false; }
    finally { setBusy(false); setNow(Date.now()); }
  }
  return { tasks: tasks ?? [], focus: focus ?? [], now, busy, message, act };
}
