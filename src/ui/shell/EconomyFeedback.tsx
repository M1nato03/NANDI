import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { addEconomyDays, deriveEconomy, seasonFor } from '../../core/economy/deriveEconomy';
import { RULES } from '../../core/rules.config';
import { shutdownAt } from '../../core/tasks/planner';
import { isAfterBedtime } from '../../core/time';
import { tapHaptic } from '../../platform/haptics';
import type { LedgerRow, SettingRow, TaskRow, LearnDropRow, SessionRow, PuzzleRunRow, DailyLogRow } from '../../data/types';
import { dailyDropId } from '../learn/dropIds';
import { todayDotStatus } from './TodayDots';
import { finishEvent, pickFinishLine, shouldShowDoneForToday, type FinishActivity } from './finish';
import { DoneForToday, FinishMoment } from './FinishMoment';
import { Cast } from '../cast/Cast';
import { playCastSound } from '../cast/sound';
import '../screens/economy.css';

/** Browser storage can be blocked (private mode, cleared site data); reveals then simply show again. */
const store = {
  get: (area: Storage, key: string): string | null => { try { return area.getItem(key); } catch { return null; } },
  set: (area: Storage, key: string, value: string): void => { try { area.setItem(key, value); } catch { /* ignore */ } },
};

type Notice = { text: string; macro: boolean; gain?: number; detail?: string; nextSeason?: string; activity?: FinishActivity; character?: 'Mor' | 'Kachhua' };
type Source = { facts: LedgerRow[]; settings: SettingRow[]; tasks: TaskRow[]; sessions: SessionRow[]; runs: PuzzleRunRow[]; drop?: LearnDropRow; log?: DailyLogRow };
const complete = (source: Source, now: number) => Object.values(todayDotStatus(now, { tasks: source.tasks, sessions: source.sessions, ledger: source.facts, runs: source.runs, drop: source.drop, log: source.log })).every(Boolean);
export function EconomyFeedback() {
  const source = useLiveQuery(async () => { const now = Date.now(); return { facts: await db.ledger.toArray(), settings: await db.settings.toArray(), tasks: await db.tasks.toArray(), sessions: await db.sessions.toArray(), runs: await db.puzzleRuns.toArray(), drop: await db.learnDrops.get(dailyDropId(now)), log: await db.dailyLog.get(dayKey(now)) }; }, []);
  const prior = useRef<Source | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [doneCard, setDoneCard] = useState(false);
  const [pendingDone, setPendingDone] = useState(false);
  const [shownXp, setShownXp] = useState(0);
  const lastLine = useRef<string | undefined>(store.get(sessionStorage, 'finish.lastLine') ?? undefined);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
  useEffect(() => {
    const onFinish = (event: Event) => {
      const activity = (event as CustomEvent<FinishActivity>).detail;
      const line = pickFinishLine(activity, lastLine.current);
      lastLine.current = line;
      store.set(sessionStorage, 'finish.lastLine', line);
      void tapHaptic(true);
      setNotice({ text: line, macro: false, activity });
    };
    window.addEventListener(finishEvent, onFinish);
    return () => window.removeEventListener(finishEvent, onFinish);
  }, []);
  useEffect(() => {
    if (!source) return;
    const previous = prior.current;
    prior.current = source;
    if (!previous) {
      const now = Date.now(), today = dayKey(now), season = seasonFor(today);
      const restNoticeKey = `economy.restUsed:${today}`;
      if (!store.get(sessionStorage, restNoticeKey)) {
        const current = deriveEconomy(source.facts, undefined, source.settings, today);
        if (current.streak.restUsedYesterday) {
          store.set(sessionStorage, restNoticeKey, 'seen');
          queueMicrotask(() => setNotice({ text: `Rest day used. ${current.streak.restDays} left.`, macro: false, character: 'Kachhua' }));
          return;
        }
      }
      const key = `economy.seasonReveal:${season.index - 1}`;
      const bedtime = source.settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
      if (season.index > 0 && !store.get(localStorage, key) && now < shutdownAt(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime)) {
        const past = deriveEconomy(source.facts, undefined, source.settings, addEconomyDays(season.start, -1));
        const countKey = `economy.macro:${today}`;
        const count = Number(store.get(sessionStorage, countKey) ?? 0);
        if (count < RULES.juice.macroPerDayMax) {
          store.set(sessionStorage, countKey, String(count + 1)); store.set(localStorage, key, 'seen');
          queueMicrotask(() => setNotice({ text: `Season ${season.index} · ${past.season.tier}`, macro: true, character: 'Mor',
            detail: `${past.season.sp} SP · ${past.totalXp.toLocaleString()} XP · +${RULES.shards.seasonEnd[past.season.tier as keyof typeof RULES.shards.seasonEnd]} Shards`,
            nextSeason: `Next season · Season ${season.index + 1}` }));
        }
      }
      return;
    }
    const oldIds = new Set(previous.facts.map(row => row.id));
    const added = source.facts.filter(row => !oldIds.has(row.id));
    // Bulk restore and historical imports are data operations, not a new check-off.
    if (added.length > 5 || added.some(row => Math.abs(Date.now() - row.updatedAt) > 5_000)) return;
    const achievement = added.find(row => (row.mode === 'tasks' && row.kind === 'done') || (row.mode === 'train' && row.kind === 'session') || (row.mode === 'mind' && ((row.kind === 'mystery' && row.inputs.result === 'solved') || (row.kind === 'board' && row.inputs.daily === true))));
    const dropFinished = !!source.drop && source.drop.drop.items.length > 0 && source.drop.drop.cursor >= source.drop.drop.items.length && (!previous.drop || previous.drop.drop.cursor < previous.drop.drop.items.length);
    const now = Date.now(), today = dayKey(now);
    const oldView = deriveEconomy(previous.facts, undefined, previous.settings, today);
    const view = deriveEconomy(source.facts, undefined, source.settings, today);
    const gain = Math.max(0, view.totalXp - oldView.totalXp);
    const bedtime = source.settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
    const afterBedtime = now >= shutdownAt(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime);
    const motionReduced = reduced();
    const realWorld = achievement?.mode === 'tasks' || achievement?.mode === 'train';
    const macroKind = view.level > oldView.level ? `Level ${view.level}` : view.season.rank < oldView.season.rank && view.season.tier !== oldView.season.tier ? `${view.season.tier} tier` : '';
    const key = `economy.macro:${today}`;
    const count = Number(store.get(sessionStorage, key) ?? 0);
    const justCompleted = shouldShowDoneForToday({ wasComplete: complete(previous, now), isComplete: complete(source, now), seen: !!store.get(localStorage, `finish.done:${today}`), afterBedtime: isAfterBedtime(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime), macroCount: count });
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
    setNotice({ text: macro ? `${macroKind} · ${view.totalXp.toLocaleString()} XP` : line, detail: macro ? line : undefined, gain, macro, activity, character: macro ? 'Mor' : undefined });
  }, [source]);
  useEffect(() => {
    if (!notice?.gain || notice.macro) return;
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
  if (doneCard) return <DoneForToday close={() => setDoneCard(false)} reduced={reduced()} />;
  if (!notice) return null;
  return notice.macro ? <div className="economy-reveal" role="dialog" aria-modal="true" aria-label="Season progress"><div className="economy-reveal-card"><Cast name="Mor" pose="cheer" size={80} /><span className="eyebrow">Your season</span><h2>{notice.text}</h2><p>{notice.detail ?? 'Your work is adding up.'}</p>{notice.nextSeason && <div className="card">{notice.nextSeason}</div>}<button type="button" onClick={() => setNotice(null)}>Continue</button><button type="button" className="secondary" onClick={() => setNotice(null)}>Skip reveal</button></div></div> : <FinishMoment line={notice.text} gain={notice.gain} shownXp={shownXp} reduced={reduced()} activity={notice.activity ?? (notice.character === 'Kachhua' ? 'night' : 'task')} />;
}
