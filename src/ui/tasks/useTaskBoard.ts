import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { createTaskRepos } from '../../data/repos/tasks';
import { dayKey } from '../../core/time/dayKey';
import { RULES } from '../../core/rules.config';
import { isFocusRunning, runStart, stillWorking, taskFocusMs } from '../../core/tasks/focus';
import { guardedPackages } from '../../core/focusGuard';
import { clearGuardPause, lookGuard, watchFocus } from '../../platform/focusGuard';
import { errorMessage } from '../shell/errorMessage';

const reposPromise = getOrCreateDeviceId(db, Date.now()).then((id) => createTaskRepos(db, id));
export type TaskRepos = Awaited<typeof reposPromise>;

/**
 * Spec 36: brings the open focus up to date with what the focus guard saw and with "Still working?". The guard's
 * pause and an unanswered check are dated when they began, so minutes after them never count.
 */
async function syncFocus(at: number): Promise<void> {
  const open = (await db.focus.filter((row) => row.deleted === 0 && row.endedAt == null).toArray()).sort((a, b) => b.startedAt - a.startedAt)[0];
  if (!open) return;
  const repos = await reposPromise;
  const look = await lookGuard(open.id);
  await repos.syncFocusGuard(open.id, { on: look.available && look.usageAllowed, distractedMs: look.distractedMs, spans: look.spans }, at);
  if (look.pausedAt != null) {
    if (isFocusRunning(open)) await repos.pauseFocusAt(open.id, look.pausedAt, at, 'guard', look.pausedApp);
    await clearGuardPause();
  }
  const fresh = await repos.focus.get(open.id);
  const pay = RULES.tasks.focusPay;
  const still = fresh ? stillWorking(fresh, at, pay.stillCheckMin, pay.stillGraceMin) : { ask: false };
  if (fresh && still.pauseAt != null) await repos.pauseFocusAt(fresh.id, still.pauseAt, at, 'still');
}

export function useTaskBoard() {
  const tasks = useLiveQuery(() => db.tasks.filter((row) => row.deleted === 0).toArray(), []);
  const focus = useLiveQuery(() => db.focus.filter((row) => row.deleted === 0).toArray(), []);
  const [message, setMessage] = useState('');
  // Item 177: a success line ("Done.", "Added to Today.") fades after a few seconds; an error stays until the next action.
  const fades = useRef(false);
  useEffect(() => {
    if (!message || !fades.current) return;
    const timer = window.setTimeout(() => setMessage(current => current === message ? '' : current), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);
  const [busy, setBusy] = useState(false);
  // Counts finished writes, so a one-step Undo can tell that any write came after it (Codex A item 93).
  const writesRef = useRef(0);
  const [writes, setWrites] = useState(0);
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
        void reposPromise.then((repos) => repos.reconcile(at)).catch((error) => { fades.current = false; setMessage(errorMessage(error)); });
      }
    };
    const interval = window.setInterval(() => refresh(), 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    void reposPromise.then((repos) => repos.reconcile(Date.now())).catch((error) => { fades.current = false; setMessage(errorMessage(error)); });
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('pageshow', refresh); };
  }, []);
  // Spec 36: the phone's focus guard watches the running focus (its task, when its stretch began, when to ask "Still
  // working?") and stops when no focus runs.
  const nightApps = useLiveQuery(() => db.settings.get('night.pause.apps'), []);
  const running = focus?.filter((row) => row.endedAt == null && isFocusRunning(row)).sort((a, b) => b.startedAt - a.startedAt)[0];
  const runningTitle = running ? tasks?.find((task) => task.id === running.taskId)?.title ?? '' : '';
  const watchKey = running ? `${running.id}:${runStart(running)}:${running.touchedAt ?? 0}:${runningTitle}` : '';
  const apps = JSON.stringify(nightApps && !nightApps.deleted ? nightApps.value : null);
  useEffect(() => {
    if (!running) { void watchFocus(null); return; }
    const pay = RULES.tasks.focusPay;
    void watchFocus({ focusId: running.id, task: runningTitle, runningSince: runStart(running), beforeMs: taskFocusMs(focus ?? [], running.taskId, runStart(running)), stillAt: Math.max(running.touchedAt ?? 0, runStart(running)) + pay.stillCheckMin * 60_000,
      packages: guardedPackages(JSON.parse(apps)), graceSec: pay.guardGraceSec });
  }, [watchKey, apps]); // eslint-disable-line react-hooks/exhaustive-deps
  // Looks again on return to the app and once a minute while a focus is open.
  const openFocus = !!focus?.some((row) => row.endedAt == null);
  useEffect(() => {
    if (!openFocus) return;
    const look = () => { void syncFocus(Date.now()).catch(() => undefined); };
    look();
    const timer = window.setInterval(look, 60_000);
    document.addEventListener('visibilitychange', look);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', look); };
  }, [openFocus]);
  async function act(operation: (repos: TaskRepos, at: number) => Promise<unknown>, success = ''): Promise<boolean> {
    setBusy(true); setMessage('');
    // An action reads the focus as the guard last saw it, so ending a focus pays only its honest minutes.
    try { await syncFocus(Date.now()).catch(() => undefined); await operation(await reposPromise, Date.now()); fades.current = true; setMessage(success); writesRef.current += 1; setWrites(writesRef.current); return true; }
    catch (error) { fades.current = false; setMessage(errorMessage(error)); return false; }
    finally { setBusy(false); setNow(Date.now()); }
  }
  return { tasks: tasks ?? [], focus: focus ?? [], now, busy, message, act, writes, writesRef };
}
