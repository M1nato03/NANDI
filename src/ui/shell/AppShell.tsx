import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { dayKey } from '../../core/time';
import { formatDayKey } from '../../core/time/formatDayKey';
import { requestPersist } from '../../platform/storage';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { reconcileSolvedBoards } from '../../data/repos/puzzleRuns';
import { recordError } from '../errorRing';
import { Today } from '../screens/Today';
import { Now } from '../screens/Now';
import { TodayDots } from './TodayDots';
import { useLiveQuery } from 'dexie-react-hooks';
import { effectiveShutdown } from '../../core/tasks/planner';
import { RULES } from '../../core/rules.config';
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
import { ContentReview } from '../screens/ContentReview';
import { useAutoBackup } from './useAutoBackup';
import { useWidgetSync } from './useWidgetSync';
import { consumeWidgetLaunchRoute } from '../../platform/widget';
import { nightRouteTime, nightRouteTransition } from './nightRoute';
import { EconomyFeedback } from './EconomyFeedback';

const Backup = lazy(() => import('../screens/Backup').then(module => ({ default: module.Backup })));
const GeneratorCheck = lazy(() => import('../screens/GeneratorCheck').then(module => ({ default: module.GeneratorCheck })));
const Learn = lazy(() => import('../screens/Learn').then(module => ({ default: module.Learn })));
const Plan = lazy(() => import('../screens/Plan').then(module => ({ default: module.Plan })));
const Planner = lazy(() => import('../screens/Planner').then(module => ({ default: module.Planner })));
const Train = lazy(() => import('../screens/Train').then(module => ({ default: module.Train })));
const Mind = lazy(() => import('../screens/Mind').then(module => ({ default: module.Mind })));
const Ground = lazy(() => import('../screens/Ground').then(module => ({ default: module.Ground })));
const You = lazy(() => import('../screens/You').then(module => ({ default: module.You })));
const SeasonLadder = lazy(() => import('../screens/EconomyScreens').then(module => ({ default: module.SeasonLadder })));
const SeasonShop = lazy(() => import('../screens/EconomyScreens').then(module => ({ default: module.SeasonShop })));
const Badges = lazy(() => import('../screens/GamifyScreens').then(module => ({ default: module.Badges })));
const Night = lazy(() => import('../screens/Night').then(module => ({ default: module.Night })));
const NightPauseCard = lazy(() => import('../screens/NightPauseCard').then(module => ({ default: module.NightPauseCard })));

export function AppShell() {
  const [path, setPath] = useState(route);
  const [today, setToday] = useState(() => dayKey(Date.now()));
  const [clockTime, setClockTime] = useState(Date.now);
  const [pause, setPause] = useState<{ packageName: string; reason: string; minutes: number } | null>(null);
  const nightSettings = useLiveQuery(() => db.settings.toArray(), []);
  const openingChecked = useRef(false);
  const wasNight = useRef<boolean | null>(null);
  const appearance = useAppearance();
  // A restore clears and refills every table; remount the always-visible live views so none keep stale rows.
  const [restoreGen, setRestoreGen] = useState(0);
  const restored = async () => { await appearance.reload(); setRestoreGen(gen => gen + 1); };
  const nativeUpdater = useNativeUpdater();
  const autoBackupWarning = useAutoBackup();
  useWidgetSync();
  useEffect(() => {
    const refreshDate = () => { const now = Date.now(); setToday(dayKey(now)); setClockTime(now); };
    const interval = window.setInterval(refreshDate, 60_000);
    document.addEventListener('visibilitychange', refreshDate);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refreshDate); };
  }, []);
  useEffect(() => { initializeHistory(); const update = () => { const resolved = route(); if (location.hash !== `#${resolved}`) history.replaceState(history.state ?? { nandi: true }, '', `#${resolved}`); setPath(resolved); }; update(); window.addEventListener('hashchange', update); window.addEventListener('popstate', update); window.addEventListener(navigationEventName(), update); void requestPersist(); return () => { window.removeEventListener('hashchange', update); window.removeEventListener('popstate', update); window.removeEventListener(navigationEventName(), update); }; }, []);
  useEffect(() => { void consumeWidgetLaunchRoute().then(path => { if (path === '#night' || path === '#plan') go(path.slice(1)); }).catch(error => recordError('promise', error)); }, []);
  useEffect(() => {
    if (!nightSettings) return;
    const setting = (key: string, fallback: string) => {
      const value = nightSettings.find(row => row.key === key && !row.deleted)?.value;
      return typeof value === 'string' ? value : fallback;
    };
    const bedtime = setting('planner.bedtime', RULES.night.defaultBedtime);
    const shutdown = effectiveShutdown(setting('planner.shutdown', RULES.night.defaultShutdown), bedtime);
    const active = nightRouteTime(clockTime, shutdown);
    if (!openingChecked.current) {
      openingChecked.current = true;
      wasNight.current = active;
      if (active && route() !== 'night') go('night');
      return;
    }
    const destination = nightRouteTransition(wasNight.current ?? active, active, route());
    wasNight.current = active;
    if (destination) go(destination);
  }, [nightSettings, clockTime]);
  useEffect(() => { void reconcileSolvedBoards(db).catch(error => recordError('window', error)); }, []);
  useEffect(() => {
    const now = Date.now(), today = dayKey(now);
    void db.settings.get('economyVisibleFrom').then(async row => {
      if (typeof row?.value === 'string' && row.value <= today && !row.deleted) return;
      await db.settings.put({ key: 'economyVisibleFrom', value: today, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) });
    }).catch(error => recordError('promise', error));
  }, []);
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
    void LocalNotifications.addListener('localNotificationActionPerformed', async action => {
      const id = action.notification.extra?.reminderId;
      if (typeof id !== 'string') return;
      const destination = id.startsWith('nudge:night:') ? 'night' : id.startsWith('nudge:morning:') ? 'plan' : (await db.reminders.get(id))?.refType === 'session' ? 'train' : 'plan';
      history.replaceState({ nandi: true, deckIndex: 0 }, '', `#${destination}`);
      window.dispatchEvent(new Event(navigationEventName()));
    }).then(handle => { if (disposed) void handle.remove(); else remove = () => handle.remove(); }).catch(error => recordError('promise', error));
    return () => { disposed = true; void remove?.(); };
  }, []);
  useEffect(() => startNightPauseSync(error => recordError('promise', error)), []);
  useEffect(() => {
    if (!nightPauseAvailable()) return;
    const check = () => { if (document.visibilityState === 'visible') void nightPauseStatus().then(status => { if (status.pendingPackage) setPause({ packageName: status.pendingPackage, reason: status.pendingReason ?? 'night', minutes: Number(status.pendingMinutes ?? 0) }); }).catch(error => recordError('promise', error)); };
    check(); document.addEventListener('visibilitychange', check); window.addEventListener('pageshow', check); window.addEventListener('nandi:night-pause', check);
    return () => { document.removeEventListener('visibilitychange', check); window.removeEventListener('pageshow', check); window.removeEventListener('nandi:night-pause', check); };
  }, []);
  const tab = tabOf(path);
  let screen;
  if (path === 'ground/backup' || path === 'you/backup') screen = <Backup onRestored={restored} />;
  else if (path === 'you/season') screen = <SeasonLadder />;
  else if (path === 'you/shop') screen = <SeasonShop />;
  else if (path === 'you/badges') screen = <Badges />;
  else if (path === 'you/contentreview') screen = <ContentReview />;
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
  else if (path === 'plan/focus') screen = <Today />;
  else if (path === 'learn' || path === 'learn/drop') screen = <Learn entry={path.split('/')[1]} />;
  else if (path === 'learn/lesson' || path === 'learn/unit') screen = <Mind key={path} entry={path.split('/')[1]} />;
  else if (path === 'train' || path.startsWith('train/')) screen = <Train entry={path.split('/')[1]} />;
  else if (path === 'mind' || path.startsWith('mind/')) screen = <Mind key={path} entry={path.split('/').slice(1).join('/')} />;
  else if (path === 'ground') screen = <section className="screen"><h1>Ground</h1><Ground {...appearance} /></section>;
  else if (path === 'night') screen = <Now />;
  else if (tab === 'Plan') screen = <Plan questId={path.startsWith('plan/quest/') ? path.split('/')[2] : undefined} />;
  else if (tab === 'You') screen = <You />;
  else screen = <Plan />;
  const root = ['plan', 'train', 'learn', 'mind', 'you'].includes(path);
  return <div className={`app-shell${path === 'night' ? ' night-route' : ''}`}><NativeUpdateBar updater={nativeUpdater} /><UpdateBar />{autoBackupWarning && <button type="button" className="auto-backup-warning" onClick={() => go('you/backup')}>Automatic backup could not be saved. Tap to export by hand.</button>}<header className="topbar"><h1 className="brand"><span className="brand-mark" aria-hidden="true">●</span>NANDI</h1><span className="top-date">{formatDayKey(today)}</span><TodayDots key={restoreGen} now={clockTime} /></header><main id="main" className="content">{!root && path !== 'night' && <div className="screen"><button type="button" className="screen-back" aria-label={`Back to ${backDestination()}`} onClick={() => back()}><span className="back-chevron" aria-hidden="true">‹</span>Back</button></div>}<Suspense fallback={<DelayedCardSkeleton />}>{screen}</Suspense></main>{path !== 'night' && <TabBar current={tab} />}<EconomyFeedback key={restoreGen} />{pause && <Suspense fallback={null}><NightPauseCard packageName={pause.packageName} reason={pause.reason} minutes={pause.minutes} close={() => setPause(null)} /></Suspense>}</div>;
}
