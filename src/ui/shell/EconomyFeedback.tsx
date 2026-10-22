import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { softMoreKey, softToday } from '../../core/soft/soft';
import { addEconomyDays, deriveEconomy, seasonFor } from '../../core/economy/deriveEconomy';
import { RULES } from '../../core/rules.config';
import { shutdownAt } from '../../core/tasks/planner';
import { isAfterBedtime } from '../../core/time';
import { tapHaptic } from '../../platform/haptics';
import type { LedgerRow, SettingRow, TaskRow, LearnDropRow, SessionRow, PuzzleRunRow, DailyLogRow } from '../../data/types';
import { dailyDropId } from '../learn/dropIds';
import { reconcileGamify } from '../../data/repos/gamify';
import { todayDotStatus } from './TodayDots';
import { finishEvent, pickFinishLine, shouldShowDoneForToday, type FinishActivity } from './finish';
import { DoneForToday, FinishMoment } from './FinishMoment';
import { boundedSuggestion, readInterests } from '../../core/adaptive/day';
import { Cast } from '../cast/Cast';
import { playCastSound } from '../cast/sound';
import '../screens/economy.css';
import { useModalFocus } from './useModalFocus';

/** Browser storage can be blocked (private mode, cleared site data); reveals then simply show again. */
const store = {
  get: (area: Storage, key: string): string | null => { try { return area.getItem(key); } catch { return null; } },
  set: (area: Storage, key: string, value: string): void => { try { area.setItem(key, value); } catch { /* ignore */ } },
};

type Notice = { text: string; macro: boolean; gain?: number; detail?: string; nextSeason?: string; activity?: FinishActivity; character?: 'Mor' | 'Kachhua' };
type Source = { facts: LedgerRow[]; settings: SettingRow[]; tasks: TaskRow[]; sessions: SessionRow[]; runs: PuzzleRunRow[]; drop?: LearnDropRow; log?: DailyLogRow };
const complete = (source: Source, now: number) => Object.values(todayDotStatus(now, { tasks: source.tasks, sessions: source.sessions, ledger: source.facts, runs: source.runs, drop: source.drop, log: source.log })).every(Boolean);
export function EconomyFeedback() {
  const source = useLiveQuery(async () => { const now = Date.now(); await db.learnConcepts.toArray(); return { facts: await db.ledger.toArray(), settings: await db.settings.toArray(), tasks: await db.tasks.toArray(), sessions: await db.sessions.toArray(), runs: await db.puzzleRuns.toArray(), drop: await db.learnDrops.get(dailyDropId(now)), log: await db.dailyLog.get(dayKey(now)) }; }, []);
  const prior = useRef<Source | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const reveal = useModalFocus<HTMLDivElement>(() => setNotice(null));
  // A badge never pops up on its own: it waits to join the next finish moment (audit 10-21).
  const noticeRef = useRef<Notice | null>(null);
  const pendingBadge = useRef<string | null>(null);
  useEffect(() => { noticeRef.current = notice; }, [notice]);
  const withBadge = (next: Notice): Notice => { const label = pendingBadge.current; if (!label || next.macro) return next; pendingBadge.current = null; return next.text.includes(label) ? next : { ...next, text: `${next.text} · ${label}` }; };
  const [doneCard, setDoneCard] = useState(false);
  const [pendingDone, setPendingDone] = useState(false);
  const [shownXp, setShownXp] = useState(0);
  const lastLine = useRef<string | undefined>(store.get(sessionStorage, 'finish.lastLine') ?? undefined);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
  // The finish listener is set up once, so it reads the latest bedtime through a ref.
  const bedtimeRef = useRef<string>(RULES.night.defaultBedtime);
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
      setNotice(withBadge({ text: line, macro: false, activity }));
    };
    window.addEventListener(finishEvent, onFinish);
    return () => window.removeEventListener(finishEvent, onFinish);
  }, []);
  useEffect(() => {
    if (!source) return;
    void reconcileGamify(db).catch(() => { /* Later writes retry reconciliation. */ });
    const previous = prior.current;
    prior.current = source;
    if (!previous) {
      const now = Date.now(), today = dayKey(now), season = seasonFor(today);
      const restNoticeKey = `economy.restUsed:${today}`;
      if (!store.get(sessionStorage, restNoticeKey)) {
        const current = deriveEconomy(source.facts, undefined, source.settings, today);
        if (current.streak.restUsedYesterday) {
          store.set(sessionStorage, restNoticeKey, 'seen');
          queueMicrotask(() => setNotice({ text: `Your rest bank covered yesterday. ${current.streak.restDays} ${current.streak.restDays === 1 ? 'day' : 'days'} ready for later.`, macro: false, character: 'Kachhua' }));
          return;
        }
      }
      const key = `economy.seasonReveal:${season.index - 1}`;
      const bedtime = source.settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
      if (season.index > 0 && !store.get(localStorage, key) && now < shutdownAt(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime)) {
        const past = deriveEconomy(source.facts, undefined, source.settings, addEconomyDays(season.start, -1));
        // A season that ended before the first day here is not this person's: no reveal (season late entry).
        if (!source.facts.some(row => !row.deleted && row.dayKey < season.start)) { store.set(localStorage, key, 'seen'); return; }
        const countKey = `economy.macro:${today}`;
        const count = Number(store.get(sessionStorage, countKey) ?? 0);
        if (count < RULES.juice.macroPerDayMax) {
          store.set(sessionStorage, countKey, String(count + 1)); store.set(localStorage, key, 'seen');
          queueMicrotask(() => setNotice({ text: `Season ${season.index} · ${past.season.tier}`, macro: true, character: 'Mor',
            detail: `${Math.round(past.season.sp)} SP this season · +${RULES.shards.seasonEnd[past.season.tier as keyof typeof RULES.shards.seasonEnd]} Shards`,
            nextSeason: `Next season · Season ${season.index + 1}` }));
        }
      }
      return;
    }
    const oldIds = new Set(previous.facts.map(row => row.id));
    const added = source.facts.filter(row => !oldIds.has(row.id));
    // Bulk restore and historical imports are data operations, not a new check-off.
    if (added.length > 5 || added.some(row => Math.abs(Date.now() - row.updatedAt) > 5_000)) return;
    const badge = added.find(row => row.kind === 'badge-tier' || row.kind === 'monthly-challenge');
    if (badge) {
      // Badge tiers can arrive while someone is answering or planning; mark the moment without covering their controls.
      const label = badge.kind === 'monthly-challenge' ? 'Monthly challenge complete' : 'A new badge tier';
      // A badge usually lands just after the finish that earned it: add it to that moment instead of replacing the warm line.
      // With no finish on screen (say, mid-question) it waits for the next one rather than covering an explanation.
      if (noticeRef.current && !noticeRef.current.macro) setNotice(current => current && !current.macro ? { ...current, text: current.text.includes(label) ? current.text : `${current.text} · ${label}` } : current);
      else pendingBadge.current = label;
      return;
    }
    const achievement = added.find(row => (row.mode === 'tasks' && row.kind === 'done') || (row.mode === 'train' && row.kind === 'session') || (row.mode === 'mind' && ((row.kind === 'mystery' && row.inputs.result === 'solved') || (row.kind === 'board' && row.inputs.daily === true))));
    const dropFinished = !!source.drop && source.drop.drop.items.length > 0 && source.drop.drop.cursor >= source.drop.drop.items.length && (!previous.drop || previous.drop.drop.cursor < previous.drop.drop.items.length);
    const now = Date.now(), today = dayKey(now);
    // Spec 15 C: on the soft Home the tiny task ends in the calm soft finish; no count-up overlay over it.
    const softHome = softToday(source.facts, today).state !== null && !source.settings.some(row => row.key === softMoreKey(today) && row.value === true && !row.deleted);
    if (softHome && achievement?.mode === 'tasks') return;
    const oldView = deriveEconomy(previous.facts, undefined, previous.settings, today);
    const view = deriveEconomy(source.facts, undefined, source.settings, today);
    const gain = Math.max(0, view.totalXp - oldView.totalXp);
    const bedtime = source.settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
    const afterBedtime = now >= shutdownAt(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime);
    const motionReduced = reduced();
    // After bedtime nothing celebrates: no buzz, no count-up (economy review 32, F1).
    if (afterBedtime) return;
    const realWorld = achievement?.mode === 'tasks' || achievement?.mode === 'train';
    const macroKind = view.level > oldView.level ? `Level ${view.level}` : view.season.rank < oldView.season.rank && view.season.tier !== oldView.season.tier ? `${view.season.tier} tier` : '';
    const key = `economy.macro:${today}`;
    const count = Number(store.get(sessionStorage, key) ?? 0);
    const justCompleted = shouldShowDoneForToday({ wasComplete: complete(previous, now), isComplete: complete(source, now), seen: !!store.get(localStorage, `finish.done:${today}`), afterBedtime: isAfterBedtime(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime), macroCount: count });
    // Spec 15 D: the first marked day after a miss brings a fixed, announced gift (a soft day counts too).
    const welcomed = (view.days.at(-1)?.welcome ?? 0) > 0 && !(oldView.days.at(-1)?.welcome);
    const welcomeLine = 'Welcome back. Here is a small gift for coming back.';
    if (welcomed && !achievement && !dropFinished && !justCompleted) {
      // On a soft day the gift line sits inside the calm soft finish, with no count-up overlay.
      if ((view.days.at(-1)?.soft ?? 0) > 0) return;
      void tapHaptic(true, 20); setNotice({ text: welcomeLine, gain, macro: false, character: 'Kachhua' }); return;
    }
    if (!achievement && !dropFinished && !justCompleted) return;
    const macro = !justCompleted && !!macroKind && realWorld && !afterBedtime && count < RULES.juice.macroPerDayMax;
    if (macro || justCompleted) store.set(sessionStorage, key, String(count + 1));
    if (justCompleted) {
      store.set(localStorage, `finish.done:${today}`, 'seen');
      if (achievement || dropFinished) setPendingDone(true);
      else setDoneCard(true);
    }
    void tapHaptic(true, justCompleted ? [30, 50, 30] : 20);
    const soundOn = source.settings.some(row => row.key === 'economy.soundOn' && row.value === true && !row.deleted);
    if (!motionReduced && !afterBedtime) playCastSound(macro ? 'level-up' : 'finish', soundOn);
    if (!achievement && !dropFinished) return;
    const activity: FinishActivity = dropFinished ? 'learn' : achievement?.mode === 'tasks' ? 'task' : achievement?.mode === 'train' ? 'train' : achievement?.kind === 'mystery' ? 'case' : 'puzzle';
    const line = pickFinishLine(activity, lastLine.current);
    lastLine.current = line;
    store.set(sessionStorage, 'finish.lastLine', line);
    setNotice(withBadge({ text: macro ? `${macroKind} · ${view.totalXp.toLocaleString()} XP` : welcomed ? welcomeLine : line, detail: macro ? line : undefined, gain, macro, activity, character: macro ? 'Mor' : undefined }));
  }, [source]);
  useEffect(() => {
    if (!notice?.gain || notice.macro) return;
    if (reduced()) { const gain = notice.gain; const frame = requestAnimationFrame(() => setShownXp(gain)); return () => cancelAnimationFrame(frame); }
    const start = performance.now(), duration = RULES.juice.mesoMs[1];
    let frame = 0;
    const tick = (now: number) => {
      setShownXp(Math.round(notice.gain! * Math.min(1, (now - start) / duration)));
      if (now - start < duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [notice]);
  useEffect(() => {
    if (!notice || notice.macro) return;
    const timer = window.setTimeout(() => setNotice(null), RULES.juice.mesoMs[1] + 600);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!pendingDone) return;
    const timer = window.setTimeout(() => { setNotice(null); setDoneCard(true); setPendingDone(false); }, RULES.juice.mesoMs[1] + 600);
    return () => window.clearTimeout(timer);
  }, [pendingDone]);
  if (doneCard) return <DoneForToday close={() => setDoneCard(false)} reduced={reduced()} suggestion={boundedSuggestion(readInterests(source?.settings ?? []), dayKey(Date.now()), false)} />; // eslint-disable-line react-hooks/purity
  if (!notice) return null;
  return notice.macro ? <div ref={reveal} tabIndex={-1} className="economy-reveal" role="dialog" aria-modal="true" aria-label="Season progress"><div className="economy-reveal-card"><Cast name="Mor" pose="cheer" size={80} /><span className="eyebrow">Your season</span><h2>{notice.text}</h2><p>{notice.detail ?? 'Your work is adding up.'}</p>{notice.nextSeason && <div className="card">{notice.nextSeason}</div>}<button type="button" onClick={() => setNotice(null)}>Continue</button><button type="button" className="secondary" onClick={() => setNotice(null)}>Skip reveal</button></div></div> : <FinishMoment line={notice.text} gain={notice.gain} shownXp={shownXp} reduced={reduced()} activity={notice.activity ?? (notice.character === 'Kachhua' ? 'night' : 'task')} />;
}
