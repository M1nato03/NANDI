import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { addEconomyDays, deriveEconomy, seasonFor } from '../../core/economy/deriveEconomy';
import { RULES } from '../../core/rules.config';
import { shutdownAt } from '../../core/tasks/planner';
import { tapHaptic } from '../../platform/haptics';
import type { LedgerRow, SettingRow, TaskRow } from '../../data/types';
import '../screens/economy.css';

/** Browser storage can be blocked (private mode, cleared site data); reveals then simply show again. */
const store = {
  get: (area: Storage, key: string): string | null => { try { return area.getItem(key); } catch { return null; } },
  set: (area: Storage, key: string, value: string): void => { try { area.setItem(key, value); } catch { /* ignore */ } },
};

type Notice = { text: string; macro: boolean; gain?: number; detail?: string; nextSeason?: string };
function softSound() {
  const AudioContextType = window.AudioContext;
  if (!AudioContextType) return;
  const context = new AudioContextType();
  const tone = context.createOscillator(), gain = context.createGain();
  tone.type = 'sine'; tone.frequency.setValueAtTime(520, context.currentTime);
  tone.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
  tone.connect(gain); gain.connect(context.destination); tone.start(); tone.stop(context.currentTime + 0.21);
  tone.onended = () => { void context.close(); };
}
export function EconomyFeedback() {
  const source = useLiveQuery(async () => ({ facts: await db.ledger.toArray(), settings: await db.settings.toArray(), tasks: await db.tasks.toArray() }), []);
  const prior = useRef<{ facts: LedgerRow[]; settings: SettingRow[]; tasks: TaskRow[] } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [shownXp, setShownXp] = useState(0);
  useEffect(() => {
    if (!source) return;
    const previous = prior.current;
    prior.current = source;
    if (!previous) {
      const now = Date.now(), today = dayKey(now), season = seasonFor(today);
      const key = `economy.seasonReveal:${season.index - 1}`;
      const bedtime = source.settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
      if (season.index > 0 && !store.get(localStorage, key) && now < shutdownAt(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime)) {
        const past = deriveEconomy(source.facts, undefined, source.settings, addEconomyDays(season.start, -1));
        const countKey = `economy.macro:${today}`;
        const count = Number(store.get(sessionStorage, countKey) ?? 0);
        if (count < RULES.juice.macroPerDayMax) {
          store.set(sessionStorage, countKey, String(count + 1)); store.set(localStorage, key, 'seen');
          queueMicrotask(() => setNotice({ text: `Season ${season.index} · ${past.season.tier}`, macro: true,
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
    const achievement = added.find(row => (row.mode === 'tasks' && row.kind === 'done') || (row.mode === 'train' && row.kind === 'session') || (row.mode === 'mind' && (row.kind === 'mystery' || row.kind === 'board' || row.kind === 'learn-answer')));
    if (!achievement) return;
    const now = Date.now(), today = dayKey(now);
    const oldView = deriveEconomy(previous.facts, undefined, previous.settings, today);
    const view = deriveEconomy(source.facts, undefined, source.settings, today);
    const gain = Math.max(0, view.totalXp - oldView.totalXp);
    if (gain <= 0) return;
    const bedtime = source.settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
    const afterBedtime = now >= shutdownAt(now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime);
    if (afterBedtime) return;
    const motionReduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
    if (!afterBedtime) {
      void tapHaptic(true);
      if (!motionReduced && source.settings.some(row => row.key === 'economy.soundOn' && row.value === true && !row.deleted) && view.owned.includes('sound:soft')) softSound();
    }
    const realWorld = achievement.mode === 'tasks' || achievement.mode === 'train';
    const macroKind = view.level > oldView.level ? `Level ${view.level}` : view.season.rank < oldView.season.rank && view.season.tier !== oldView.season.tier ? `${view.season.tier} tier` : '';
    const key = `economy.macro:${today}`;
    const count = Number(store.get(sessionStorage, key) ?? 0);
    const macro = !!macroKind && realWorld && !afterBedtime && count < RULES.juice.macroPerDayMax;
    if (macro) store.set(sessionStorage, key, String(count + 1));
    const doneToday = source.facts.filter(row => row.dayKey === today && row.mode === 'tasks' && row.kind === 'done' && !row.deleted).length;
    const plannedToday = Math.max(doneToday, source.tasks.filter(row => !row.deleted && row.dayKey === today && row.status !== 'dropped').length);
    const taskFeedback = achievement.mode === 'tasks' ? `${doneToday} of ${plannedToday} planned today` : 'A step forward today';
    setNotice({ text: macro ? `${macroKind} · ${view.totalXp.toLocaleString()} XP` : taskFeedback, gain, macro });
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
  if (!notice) return null;
  return notice.macro ? <div className="economy-reveal" role="dialog" aria-modal="true" aria-label="Season progress"><div className="economy-reveal-card"><span className="eyebrow">Your season</span><h2>{notice.text}</h2><p>{notice.detail ?? 'Your work is adding up.'}</p>{notice.nextSeason && <div className="card">{notice.nextSeason}</div>}<button type="button" onClick={() => setNotice(null)}>Continue</button><button type="button" className="secondary" onClick={() => setNotice(null)}>Skip reveal</button></div></div> : <div className="economy-toast" role="status">+{shownXp} XP · {notice.text}</div>;
}
