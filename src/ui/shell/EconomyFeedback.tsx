import { useEffect, useRef, useState } from 'react';
import { sessionCounts } from '../../core/train/counts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { softMoreKey, softToday } from '../../core/soft/soft';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { RULES } from '../../core/rules.config';
import { shutdownAt } from '../../core/tasks/planner';
import { isAfterBedtime } from '../../core/time';
import { tapHaptic } from '../../platform/haptics';
import type { LedgerRow, SettingRow, TaskRow, LearnDropRow, SessionRow, PuzzleRunRow, DailyLogRow, FocusRow } from '../../data/types';
import { jarActs, jarLineFor, JAR_LINE_MS } from '../../core/yatra/jar';
import { dailyDropId } from '../learn/dropIds';
import { reconcileGamify, recordShown } from '../../data/repos/gamify';
import { todayDotStatus } from './TodayDots';
import { RECONCILE_KINDS } from '../../core/reconcileKinds';
import { finishEvent, pickFinishLine, shouldShowDoneForToday, type FinishActivity } from './finish';
import { DoneForToday, FinishMoment } from './FinishMoment';
import { PauseOffer } from '../pause/PauseOffer';
import { pauseOfferDue, PAUSE_OFFER_KEY } from '../../core/pauseOffer';
import { answerOffer } from '../../data/repos/picks';
import { nightPauseAvailable } from '../../platform/nightPause';
import { boundedSuggestion, readInterests } from '../../core/adaptive/day';
import { Cast } from '../cast/Cast';
import { playCastSound } from '../cast/sound';
import '../screens/economy.css';
import { useModalFocus } from './useModalFocus';
import { closeToast, emptyToastQueue, enqueueToast, welcomeToastLine, type Notice } from './toastQueue';

/** Browser storage can be blocked (private mode, cleared site data); reveals then simply show again. */
const store = {
  get: (area: Storage, key: string): string | null => { try { return area.getItem(key); } catch { return null; } },
  set: (area: Storage, key: string, value: string): void => { try { area.setItem(key, value); } catch { /* ignore */ } },
};

type Source = { facts: LedgerRow[]; settings: SettingRow[]; tasks: TaskRow[]; sessions: SessionRow[]; runs: PuzzleRunRow[]; drop?: LearnDropRow; log?: DailyLogRow; focus: FocusRow[] };
// Spec 33: the day's two areas are Plan and Read (Night comes after the day closes; Train is parked).
const complete = (source: Source, now: number) => { const status = todayDotStatus(now, { tasks: source.tasks, ledger: source.facts, runs: source.runs, drop: source.drop, log: source.log }); return status.plan && status.read; };
export function EconomyFeedback() {
  const source = useLiveQuery(async () => { const now = Date.now(); await db.learnConcepts.toArray(); return { facts: await db.ledger.toArray(), settings: await db.settings.toArray(), tasks: await db.tasks.toArray(), sessions: await db.sessions.toArray(), runs: await db.puzzleRuns.toArray(), drop: await db.learnDrops.get(dailyDropId(now)), log: await db.dailyLog.get(dayKey(now)), focus: await db.focus.where('startedAt').above(now - 36 * 3_600_000).toArray() }; }, []);
  const prior = useRef<Source | null>(null);
  const bedtimeRef = useRef<string>(RULES.night.defaultBedtime);
  const lastJarAct = useRef<string | undefined>(undefined);
  const [queue, setQueue] = useState(emptyToastQueue);
  const queueRef = useRef(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  const notice = queue.current;
  const showNotice = (next: Notice) => setQueue(current => enqueueToast(current, next));
  const dismissNotice = () => setQueue(current => isAfterBedtime(Date.now(), bedtimeRef.current) ? emptyToastQueue : closeToast(current));
  const reveal = useModalFocus<HTMLDivElement>(dismissNotice);
  const [doneCard, setDoneCard] = useState(false);
  const [pendingDone, setPendingDone] = useState(false);
  const pendingDoneRef = useRef(pendingDone);
  useEffect(() => { pendingDoneRef.current = pendingDone; }, [pendingDone]);
  const [shownXp, setShownXp] = useState(0);
  const lastLine = useRef<string | undefined>(store.get(sessionStorage, 'finish.lastLine') ?? undefined);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
  // The finish listener is set up once, so it reads the latest bedtime through a ref.
  useEffect(() => {
    const value = source?.settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
    bedtimeRef.current = typeof value === 'string' ? value : RULES.night.defaultBedtime;
  }, [source]);
  useEffect(() => {
    const onFinish = (event: Event) => {
      // After bedtime nothing celebrates: no buzz, no toast (night audit 10-22).
      if (isAfterBedtime(Date.now(), bedtimeRef.current)) return;
      const activity = (event as CustomEvent<FinishActivity>).detail;
      const line = pickFinishLine(activity, lastLine.current);
      lastLine.current = line;
      store.set(sessionStorage, 'finish.lastLine', line);
      void tapHaptic(true);
      showNotice({ text: line, macro: false, activity });
    };
    window.addEventListener(finishEvent, onFinish);
    return () => window.removeEventListener(finishEvent, onFinish);
  }, []);
  useEffect(() => {
    if (!source) return;
    // Today counts as seen before reconcile runs, so a phone shut at once keeps what today showed (item 47).
    void recordShown(db).catch(() => { /* Reconcile raises it too. */ });
    const previous = prior.current;
    // Reconcile only when facts or the drop changed, not on every settings or app-minute write (cj2 heavy data #3, #5).
    const signature = (from: Source) => `${from.facts.length}:${from.facts.reduce((max, row) => Math.max(max, row.updatedAt), 0)}:${from.drop?.updatedAt ?? 0}`;
    if (!previous || signature(previous) !== signature(source)) void reconcileGamify(db).catch(() => { /* Later writes retry reconciliation. */ });
    prior.current = source;
    if (!previous) {
      // Spec 47b: no "rest bank covered yesterday" notice. Spec 47c: the season-end reveal is now the season result
      // page, shown once by the open moment (ui/cast/OpenMoment), so nothing is raised here on the first load.
      return;
    }
    const oldIds = new Set(previous.facts.map(row => row.id));
    const added = source.facts.filter(row => !oldIds.has(row.id));
    // Bulk restore and historical imports are data operations, not a new check-off (a restore keeps each fact's own
    // older time). Reconcile's rows (badge tiers, quests, the drop fact) that land with a fresh fact of the person's are
    // its consequences, so only the person's facts count toward the limit (spec 52: a first idea plus its badges and
    // quest made 6 rows and lost its finish); more than five reconcile rows alone stay quiet, as before.
    const own = added.filter(row => !RECONCILE_KINDS.has(row.kind));
    if (own.length > 5 || (!own.length && added.length > 5) || added.some(row => Math.abs(Date.now() - row.updatedAt) > 5_000)) return;
    const isBadge = (row: LedgerRow) => row.kind === 'badge-tier' || row.kind === 'monthly-challenge';
    // Badges remain in the ledger for You. Neither badges nor quests add a pop to a finish.
    const dropDone = !!source.drop && source.drop.drop.items.length > 0 && source.drop.drop.cursor >= source.drop.drop.items.length && (!previous.drop || previous.drop.drop.cursor < previous.drop.drop.items.length);
    if (!dropDone && added.length && added.every(row => isBadge(row) || row.kind === 'daily-quest')) return;
    const achievement = added.find(row => (row.mode === 'tasks' && row.kind === 'done') || (row.mode === 'train' && row.kind === 'session' && sessionCounts(row.inputs)) || (row.mode === 'mind' && ((row.kind === 'mystery' && row.inputs.result === 'solved') || (row.kind === 'board' && row.inputs.daily === true))) || (row.mode === 'read' && row.kind === 'chapter'));
    const dropFinished = dropDone;
    const now = Date.now(), today = dayKey(now);
    // Spec 15 C: on the soft Home the tiny task ends in the calm soft finish; no count-up overlay over it.
    const softHome = softToday(source.facts, today).state !== null && !source.settings.some(row => row.key === softMoreKey(today) && row.value === true && !row.deleted);
    if (softHome && achievement?.mode === 'tasks') return;
    // Nothing new to celebrate: return before deriving the economy twice (cj2 heavy data #3).
    if (!added.length && !dropFinished && !(complete(source, now) && !complete(previous, now))) return;
    const oldView = deriveEconomy(previous.facts, undefined, previous.settings, today);
    const view = deriveEconomy(source.facts, undefined, source.settings, today);
    const gain = Math.max(0, view.totalXp - oldView.totalXp);
    const bedtime = source.settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
    const afterBedtime = now >= shutdownAt(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime);
    const motionReduced = reduced();
    // After bedtime nothing celebrates: no buzz, no count-up (economy review 32, F1).
    if (afterBedtime) return;
    const acts = jarActs(source.facts.filter(row => row.dayKey === today), source.focus);
    const jarAct = acts.find(row => added.some(fact => fact.id === row.id))
      ?? acts.filter(row => row.kind !== 'focus' && Math.abs(now - row.at) <= JAR_LINE_MS).at(-1);
    const jarId = jarAct ? `${jarAct.id}:${jarAct.at}` : undefined;
    const jar = jarId && jarId !== lastJarAct.current ? jarLineFor(source, today, now, added) : undefined;
    if (jar) lastJarAct.current = jarId;
    // A jar row can arrive after the finish event. It waits for that visible line to close.
    if (jar && !achievement && !dropFinished) showNotice({ text: jar, jar, macro: false, activity: queueRef.current.current?.activity });
    const realWorld = achievement?.mode === 'tasks' || achievement?.mode === 'train';
    const macroKind = view.level > oldView.level ? `Level ${view.level}` : view.season.rank < oldView.season.rank && view.season.tier !== oldView.season.tier ? `${view.season.tier} tier` : '';
    const key = `economy.macro:${today}`;
    const count = Number(store.get(sessionStorage, key) ?? 0);
    const justCompleted = shouldShowDoneForToday({ wasComplete: complete(previous, now), isComplete: complete(source, now), seen: !!store.get(localStorage, `finish.done:${today}`), afterBedtime: isAfterBedtime(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime), macroCount: count });
    // Spec 15 D: the first marked day after a miss brings a fixed, announced gift (a soft day counts too).
    const welcomed = (view.days.at(-1)?.welcome ?? 0) > 0 && !(oldView.days.at(-1)?.welcome);
    const welcomeLine = welcomeToastLine;
    if (welcomed && !achievement && !dropFinished && !justCompleted) {
      // On a soft day the gift line sits inside the calm soft finish, with no count-up overlay.
      if ((view.days.at(-1)?.soft ?? 0) > 0) return;
      void tapHaptic(true, 20); showNotice({ text: welcomeLine, gain, macro: false, character: 'Kachhua' }); return;
    }
    if (!achievement && !dropFinished && !justCompleted) return;
    const macro = !justCompleted && !!macroKind && realWorld && !afterBedtime && count < RULES.juice.macroPerDayMax;
    if (macro || justCompleted) store.set(sessionStorage, key, String(count + 1));
    if (justCompleted) {
      store.set(localStorage, `finish.done:${today}`, 'seen');
      setPendingDone(true);
    }
    void tapHaptic(true, justCompleted ? [30, 50, 30] : 20);
    const soundOn = source.settings.some(row => row.key === 'economy.soundOn' && row.value === true && !row.deleted);
    if (!motionReduced && !afterBedtime) playCastSound(macro ? 'level-up' : 'finish', soundOn);
    if (!achievement && !dropFinished) return;
    const activity: FinishActivity = dropFinished || achievement?.mode === 'read' ? 'learn' : achievement?.mode === 'tasks' ? 'task' : achievement?.mode === 'train' ? 'train' : achievement?.kind === 'mystery' ? 'case' : 'puzzle';
    const line = pickFinishLine(activity, lastLine.current);
    lastLine.current = line;
    store.set(sessionStorage, 'finish.lastLine', line);
    showNotice({ text: macro ? `${macroKind} · ${view.totalXp.toLocaleString()} XP` : welcomed ? welcomeLine : line, detail: macro ? line : undefined, gain, macro, activity, character: macro ? 'Nandi' : undefined,
      // Spec 45c: a real level rise opens the level page in place of the reveal; a tier change keeps the reveal.
      level: macro && view.level > oldView.level ? view.level : undefined, totalXp: view.totalXp, jar });
  }, [source]);
  useEffect(() => {
    if (!notice?.gain || notice.macro) return;
    // With Motion off the render shows the full number at once, so there is nothing to count.
    if (reduced()) return;
    const start = performance.now(), duration = RULES.juice.mesoMs[1];
    let frame = 0;
    const tick = (now: number) => {
      // A frame's timestamp can come from just before `start`, so the count never shows below zero.
      setShownXp(Math.round(notice.gain! * Math.max(0, Math.min(1, (now - start) / duration))));
      if (now - start < duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [notice]);
  // Spec 52 D: once the first finish moment has gone, the Pause card is offered once (where it works, before it is set up).
  const [pauseOffer, setPauseOffer] = useState(false);
  const settingsRef = useRef<SettingRow[]>([]);
  useEffect(() => { settingsRef.current = source?.settings ?? []; }, [source]);
  useEffect(() => {
    if (!notice || notice.macro || doneCard || pauseOffer) return;
    const finish = !!notice.activity;
    const timer = window.setTimeout(() => {
      dismissNotice();
      if (queueRef.current.pending.length || pendingDoneRef.current || isAfterBedtime(Date.now(), bedtimeRef.current) || !finish || !pauseOfferDue(settingsRef.current, dayKey(Date.now()), nightPauseAvailable())) return;
      setPauseOffer(true);
      void answerOffer(db, PAUSE_OFFER_KEY, 'shown', Date.now()).catch(() => { /* shown again next finish at most */ });
    }, RULES.juice.mesoMs[1] + 600);
    return () => window.clearTimeout(timer);
  }, [notice, doneCard, pauseOffer]);
  useEffect(() => {
    if (!pendingDone || notice) return;
    const timer = window.setTimeout(() => {
      if (!isAfterBedtime(Date.now(), bedtimeRef.current)) setDoneCard(true);
      setPendingDone(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingDone, notice]);
  if (pauseOffer && !doneCard) return <PauseOffer close={() => setPauseOffer(false)} />;
  if (doneCard) return <DoneForToday close={() => setDoneCard(false)} reduced={reduced()} suggestion={boundedSuggestion(readInterests(source?.settings ?? []), dayKey(Date.now()), false)} />; // eslint-disable-line react-hooks/purity
  if (!notice) return null;
  if (notice.macro && notice.level) return <LevelPage dialog={reveal} level={notice.level} totalXp={notice.totalXp ?? 0} reduced={reduced()} close={() => {
    dismissNotice();
    // Focus goes back to what raised the page; if that is gone (a finished row folds away), to the page's heading. The
    // row can fold away a moment after focus went back to its Done, so it is checked again once the fold is over.
    const toHeading = () => { if (document.activeElement && document.activeElement !== document.body) return; const heading = document.getElementById('main')?.querySelector<HTMLElement>('h1'); if (!heading) return; if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); };
    requestAnimationFrame(toHeading);
    window.setTimeout(toHeading, 500);
  }} />;
  return notice.macro ? <div ref={reveal} tabIndex={-1} className="economy-reveal" role="dialog" aria-modal="true" aria-label="Season progress"><div className="economy-reveal-card"><Cast name="Nandi" pose="cheer" size={80} moment="hop" at={1} /><span className="eyebrow">Your season</span><h2>{notice.text}</h2><p>{notice.detail ?? 'Your work is adding up.'}</p><button type="button" onClick={dismissNotice}>Continue</button><button type="button" className="secondary" onClick={dismissNotice}>Skip reveal</button></div></div> : <FinishMoment line={notice.text} gain={notice.gain} shownXp={reduced() ? notice.gain : shownXp} reduced={reduced()} activity={notice.activity ?? (notice.character === 'Kachhua' ? 'night' : 'task')} jar={notice.jar} />;
}

const ARRIVING = ['Mor', 'Chiku', 'Nandi', 'Kapi', 'Kachhua'] as const;

/**
 * Spec 45c: the level page. A notebook sheet with a small page mark for the level, a lantern hung for the next stretch,
 * and the five friends arriving in a short hop wave (still with reduced motion). It pays nothing; Continue closes it and
 * leaves the page that raised it where it was, and focus goes back where it came from.
 */
function LevelPage({ dialog, level, totalXp, reduced, close }: { dialog: React.Ref<HTMLDivElement>; level: number; totalXp: number; reduced: boolean; close: () => void }) {
  return <div ref={dialog} tabIndex={-1} className="economy-reveal level-page" role="dialog" aria-modal="true" aria-label={`Level ${level}`}>
    <section className={`level-sheet paper${reduced ? ' is-still' : ''}`}>
      <div className="level-top"><p className="eyebrow">A new level</p><span className="level-mark" aria-hidden="true">Level<b>{level}</b></span></div>
      <h2>Level {level}</h2>
      <p>{totalXp.toLocaleString()} XP in all.</p>
      <div className="level-scene" aria-hidden="true">
        <svg className="level-lantern" viewBox="0 0 40 120" width="40" height="120"><path d="M20 120V18M20 18h12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M32 18v8" stroke="currentColor" strokeWidth="2" /><rect x="25" y="26" width="14" height="20" rx="3" fill="var(--level-glow)" stroke="currentColor" strokeWidth="2" /></svg>
        <div className="level-friends">{ARRIVING.map((name, index) => <span key={name} style={{ animationDelay: `${index * 90}ms` }}><Cast name={name} pose={name === 'Kachhua' ? 'idle' : 'cheer'} size={46} /></span>)}</div>
      </div>
      <p className="level-note">A lantern for the next stretch.</p>
      <button type="button" onClick={close}>Continue</button>
    </section>
  </div>;
}
