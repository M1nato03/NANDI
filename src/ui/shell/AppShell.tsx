import { lazy, Suspense, useEffect, useState } from 'react';
import { dayKey } from '../../core/time';
import { formatDayKey } from '../../core/time/formatDayKey';
import { requestPersist } from '../../platform/storage';
import { db } from '../../data/db';
import { reconcileSolvedBoards } from '../../data/repos/puzzleRuns';
import { recordError } from '../errorRing';
import { Today } from '../screens/Today';
import { Now } from '../screens/Now';
import { DelayedCardSkeleton } from './DelayedCardSkeleton';
import { back, backDestination, go, initializeHistory, navigationEventName, route, tabOf } from './router';
import { TabBar } from './TabBar';
import { useAppearance } from './useAppearance';
import { UpdateBar } from './UpdateBar';
import { startReminderSync } from '../../platform/reminderSync';
import { recordAppOpened } from '../../platform/nudgeSync';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { nightPauseAvailable, nightPauseStatus } from '../../platform/nightPause';
import { startNightPauseSync } from '../../platform/nightPauseSync';
import { useNativeUpdater } from './useNativeUpdater';
import { NativeUpdateBar } from './NativeUpdateBar';
import { useAutoBackup } from './useAutoBackup';

const Backup = lazy(() => import('../screens/Backup').then(module => ({ default: module.Backup })));
const GeneratorCheck = lazy(() => import('../screens/GeneratorCheck').then(module => ({ default: module.GeneratorCheck })));
const Learn = lazy(() => import('../screens/Learn').then(module => ({ default: module.Learn })));
const Plan = lazy(() => import('../screens/Plan').then(module => ({ default: module.Plan })));
const Planner = lazy(() => import('../screens/Planner').then(module => ({ default: module.Planner })));
const Train = lazy(() => import('../screens/Train').then(module => ({ default: module.Train })));
const Mind = lazy(() => import('../screens/Mind').then(module => ({ default: module.Mind })));
const Ground = lazy(() => import('../screens/Ground').then(module => ({ default: module.Ground })));
const You = lazy(() => import('../screens/You').then(module => ({ default: module.You })));
const Night = lazy(() => import('../screens/Night').then(module => ({ default: module.Night })));
const NightPauseCard = lazy(() => import('../screens/NightPauseCard').then(module => ({ default: module.NightPauseCard })));

export function AppShell() {
  const [path, setPath] = useState(route);
  const [today, setToday] = useState(() => dayKey(Date.now()));
  const [pausePackage, setPausePackage] = useState('');
  const appearance = useAppearance();
  const nativeUpdater = useNativeUpdater();
  const autoBackupWarning = useAutoBackup();
  useEffect(() => {
    const refreshDate = () => setToday(dayKey(Date.now()));
    const interval = window.setInterval(refreshDate, 60_000);
    document.addEventListener('visibilitychange', refreshDate);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refreshDate); };
  }, []);
  useEffect(() => { initializeHistory(); const update = () => setPath(route()); window.addEventListener('hashchange', update); window.addEventListener('popstate', update); window.addEventListener(navigationEventName(), update); void requestPersist(); return () => { window.removeEventListener('hashchange', update); window.removeEventListener('popstate', update); window.removeEventListener(navigationEventName(), update); }; }, []);
  useEffect(() => { void reconcileSolvedBoards(db).catch(error => recordError('window', error)); }, []);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) recordAppOpened();
    const opened = () => { if (Capacitor.isNativePlatform() && document.visibilityState === 'visible') recordAppOpened(); };
    document.addEventListener('visibilitychange', opened);
    window.addEventListener('pageshow', opened);
    const stop = startReminderSync(error => recordError('promise', error));
    return () => { stop(); document.removeEventListener('visibilitychange', opened); window.removeEventListener('pageshow', opened); };
  }, []);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    let remove: (() => Promise<void>) | undefined;
    void LocalNotifications.addListener('localNotificationActionPerformed', action => {
      const id = action.notification.extra?.reminderId;
      if (typeof id !== 'string' || !/^nudge:(night|morning):\d{4}-\d{2}-\d{2}$/.test(id)) return;
      history.replaceState({ nandi: true, deckIndex: 0 }, '', '#now');
      window.dispatchEvent(new Event(navigationEventName()));
    }).then(handle => { if (disposed) void handle.remove(); else remove = () => handle.remove(); }).catch(error => recordError('promise', error));
    return () => { disposed = true; void remove?.(); };
  }, []);
  useEffect(() => startNightPauseSync(error => recordError('promise', error)), []);
  useEffect(() => {
    if (!nightPauseAvailable()) return;
    const check = () => { if (document.visibilityState === 'visible') void nightPauseStatus().then(status => { if (status.pendingPackage) setPausePackage(status.pendingPackage); }).catch(error => recordError('promise', error)); };
    check(); document.addEventListener('visibilitychange', check); window.addEventListener('pageshow', check); window.addEventListener('nandi:night-pause', check);
    return () => { document.removeEventListener('visibilitychange', check); window.removeEventListener('pageshow', check); window.removeEventListener('nandi:night-pause', check); };
  }, []);
  const tab = tabOf(path);
  let screen;
  if (path === 'ground/backup' || path === 'you/backup') screen = <Backup onRestored={appearance.reload} />;
  else if (path === 'you/night') screen = <Night />;
  else if (path === 'you/settings') screen = <section className="screen"><p className="eyebrow">You</p><h1>Settings</h1>{nativeUpdater.available && <section className="card"><h2>App updates</h2>
    <p>Current version: {nativeUpdater.installed ? `${nativeUpdater.installed.versionName} (${nativeUpdater.installed.versionCode})` : 'Checking…'}</p>
    <button type="button" className="secondary" onClick={() => void nativeUpdater.check(true)}>Check for updates</button>
    {nativeUpdater.message && <p role="status">{nativeUpdater.message}</p>}
  </section>}<Ground {...appearance} /></section>;
  else if (path === 'mind/generator' || path === 'you/mind/generator') screen = <GeneratorCheck />;
  else if (path === 'tasks/plan' || path === 'plan/morning') screen = <Planner mode="plan" />;
  else if (path === 'tasks/shutdown' || path === 'plan/shutdown') screen = <Planner mode="shutdown" />;
  else if (path === 'tasks/review' || path === 'plan/review') screen = <Planner mode="review" />;
  else if (path === 'now/focus') screen = <Today />;
  else if (path === 'you/learn') screen = <Learn />;
  else if (path === 'train' || path.startsWith('you/train')) screen = <Train entry={path.split('/')[2]} />;
  else if (path === 'mind' || path.startsWith('you/mind')) screen = <Mind key={path} entry={path.split('/').slice(2).join('/')} />;
  else if (path === 'ground') screen = <section className="screen"><h1>Ground</h1><Ground {...appearance} /></section>;
  else if (tab === 'Plan') screen = <Plan questId={path.startsWith('plan/quest/') ? path.split('/')[2] : undefined} />;
  else if (tab === 'You') screen = <You />;
  else screen = <Now />;
  return <div className="app-shell"><NativeUpdateBar updater={nativeUpdater} /><UpdateBar />{autoBackupWarning && <button type="button" className="auto-backup-warning" onClick={() => go('you/backup')}>Automatic backup could not be saved. Tap to export by hand.</button>}<header className="topbar"><h1 className="brand"><span className="brand-mark" aria-hidden="true">●</span>NANDI</h1><span className="top-date">{formatDayKey(today)}</span></header><main id="main" className="content">{path !== 'now' && <div className="screen"><button type="button" className="screen-back" aria-label={`Back to ${backDestination()}`} onClick={() => back()}>‹ Back</button></div>}<Suspense fallback={<DelayedCardSkeleton />}>{screen}</Suspense></main><TabBar current={tab} />{pausePackage && <Suspense fallback={null}><NightPauseCard packageName={pausePackage} close={() => setPausePackage('')} /></Suspense>}</div>;
}
