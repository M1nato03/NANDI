import type { FocusRow, LedgerRow, SettingRow } from '../../data/types';
import { sessionCounts } from '../train/counts';
import { focusElapsedMs } from '../tasks/focus';
import { dayKey } from '../time/dayKey';
import { paysJar, questJarMinutes, QUEST_KIND, QUESTS_FROM_KEY, wrappedDoorIds } from '../quests660/quests';

/**
 * Spec 54: the jar is the Yatra trail filling from real things, in minutes. A Train session, a Mind board or case and a
 * Calm session each add 10 (one stretch, today's pace); each full 30 min of focus in a day adds 5 (from focusRateFrom,
 * spec 571 E1: 1 for each full 3 min); a chapter, an idea
 * or a lesson finished adds 5; lights out on time adds 10. Self-checks and phone use add nothing. At most 60 count in
 * a planning day; past that, acts still count everywhere else and the trail waits for tomorrow. Only sessions light
 * stars. All derived: nothing is stored but the day the jar started (jarFrom) and the open plan.
 */
export type SessionKind = 'train' | 'mind' | 'calm';
export type JarKind = SessionKind | 'focus' | 'read' | 'lesson' | 'lightsout' | 'quest';

export const JAR = { stretchMinutes: 10, dayCap: 60, session: 10, focusBlockMinutes: 30, focusBlock: 5, focusRateMinutes: 3, read: 5, lesson: 5, lightsOut: 10 } as const;
/** The first planning day walked in jar minutes; earlier days keep the rule they were walked by (forward only). */
export const JAR_FROM_KEY = 'yatra.jarFrom';
/**
 * Spec 571 E1 (§0.12): the first planning day whose focus fills the jar 1 min per full 3 min (the 60-a-day cap is
 * unchanged). Written once on the first run after the update, like jarFrom; days before it keep 5 per full 30.
 */
export const FOCUS_RATE_FROM_KEY = 'yatra.focusRateFrom';

/** A day's focus in jar minutes: 1 per full 3 min from `rateFrom`, else 5 per full 30 min. */
export function focusJarMinutes(ms: number, day: string, rateFrom?: string): number {
  if (rateFrom !== undefined && day >= rateFrom) return Math.floor(ms / (JAR.focusRateMinutes * 60_000));
  return Math.floor(ms / (JAR.focusBlockMinutes * 60_000)) * JAR.focusBlock;
}

/** The focus rate's first day from the settings rows, or undefined until it is written. */
export function focusRateFrom(settings: readonly SettingRow[]): string | undefined {
  const value = settings.find(row => row.key === FOCUS_RATE_FROM_KEY && !row.deleted)?.value;
  return typeof value === 'string' ? value : undefined;
}

/** Spec 660: the first day a finished quest fills the jar (economy.v12From), or undefined until it is written. */
export function questsFrom(settings: readonly SettingRow[]): string | undefined {
  const value = settings.find(row => row.key === QUESTS_FROM_KEY && !row.deleted)?.value;
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export function sessionKind(fact: LedgerRow): SessionKind | null {
  if (fact.deleted) return null;
  if (fact.mode === 'train' && fact.kind === 'session') return sessionCounts(fact.inputs ?? {}) ? 'train' : null;
  if (fact.mode === 'mind' && (fact.kind === 'board' || fact.kind === 'mystery')) return 'mind';
  if (fact.mode === 'calm' && fact.kind === 'session') return 'calm';
  return null;
}

/** Ledger kinds the jar reads (an indexed query): the sessions, the reads and lessons, and lights out. */
export const JAR_KINDS = ['session', 'board', 'mystery', 'chapter', 'idea', 'lesson', 'lightsout', QUEST_KIND.done];

export interface JarAct { id: string; kind: JarKind; dayKey: string; minutes: number; at: number; label: string }

/** The finish line's words for each act ("+5 min into the jar · chapter done"). */
const LABEL: Record<string, string> = { train: 'workout done', mind: 'puzzle solved', calm: 'Calm sat', focus: 'focus', chapter: 'chapter done', idea: 'idea read', lesson: 'lesson done', lightsout: 'lights out on time', quest: 'quest done' };

function factAct(fact: LedgerRow): JarAct | null {
  if (fact.deleted) return null;
  const base = { id: fact.id, dayKey: fact.dayKey, at: fact.updatedAt };
  const session = sessionKind(fact);
  if (session) return { ...base, kind: session, minutes: JAR.session, label: LABEL[session]! };
  if (fact.mode === 'read' && (fact.kind === 'chapter' || fact.kind === 'idea')) return { ...base, kind: 'read', minutes: JAR.read, label: LABEL[fact.kind]! };
  // A course or skill-track lesson finished (not learn/learn-lesson, which is one row per taught step of an idea).
  if (fact.mode === 'mind' && fact.kind === 'lesson') return { ...base, kind: 'lesson', minutes: JAR.lesson, label: LABEL.lesson! };
  // A backfilled night is self-reported, so it adds nothing (as in deriveEconomy).
  if (fact.mode === 'bonuses' && fact.kind === 'lightsout' && fact.inputs.metTarget === true && fact.inputs.backfill !== true) return { ...base, kind: 'lightsout', minutes: JAR.lightsOut, label: LABEL.lightsout! };
  return null;
}

/** Ended focus per planning day, split at 04:00: the paid ms and the latest moment counted in each day. */
export function focusDays(focus: readonly FocusRow[]): Map<string, { ms: number; at: number }> {
  const days = new Map<string, { ms: number; at: number }>();
  for (const row of focus) {
    if (row.deleted || row.endedAt == null || row.endedAt <= row.startedAt) continue;
    const running = { ...row, endedAt: undefined };
    let from = row.startedAt;
    while (from < row.endedAt) {
      const boundary = new Date(`${dayKey(from)}T04:00:00`);
      boundary.setDate(boundary.getDate() + 1);
      const until = Math.min(row.endedAt, boundary.getTime());
      const ms = Math.max(0, focusElapsedMs(running, until) - focusElapsedMs(running, from));
      const day = days.get(dayKey(from)) ?? { ms: 0, at: 0 };
      days.set(dayKey(from), { ms: day.ms + ms, at: Math.max(day.at, until) });
      from = until;
    }
  }
  return days;
}

/** Focus per planning day, split at 04:00, as one act per day (ended focus only), at that day's rate (focusJarMinutes). */
function focusActs(focus: readonly FocusRow[], rateFrom?: string): JarAct[] {
  return [...focusDays(focus)].map(([day, { ms, at }]) => ({ id: `focus:${day}`, kind: 'focus' as const, dayKey: day, at, label: LABEL.focus!,
    minutes: focusJarMinutes(ms, day, rateFrom) })).filter(act => act.minutes > 0);
}

/**
 * Every act that can fill the jar, in the order they happened (day, then time, then id). `focusRateFrom`: spec 571 E1.
 * `questsFrom` (spec 660, economy.v12From): a finished quest adds +5/+10 from that day; a door act a quest wraps is
 * dropped so the pair pays the quest's minutes once. Before the cutoff (or without it) the acts are exactly as before.
 */
export function jarActs(facts: readonly LedgerRow[], focus: readonly FocusRow[], focusRateFrom?: string, questsFrom?: string): JarAct[] {
  const wrapped = wrappedDoorIds(facts, questsFrom);
  const quests = facts.filter(fact => paysJar(fact, questsFrom)).map((fact): JarAct => ({ id: fact.id, kind: 'quest', dayKey: fact.dayKey, at: fact.updatedAt,
    minutes: questJarMinutes(typeof fact.inputs.minutes === 'number' ? fact.inputs.minutes : 5), label: LABEL.quest! }));
  return [...facts.map(factAct).filter((act): act is JarAct => act !== null && !wrapped.has(act.id)), ...quests, ...focusActs(focus, focusRateFrom)]
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.at - b.at || a.id.localeCompare(b.id));
}

export interface JarEntry extends JarAct { counted: number }

/** The acts from `from` to `today` with what each counted after the 60-a-day cap (a part counts when it meets it). */
export function deriveJar(acts: readonly JarAct[], from: string, today: string): JarEntry[] {
  const used = new Map<string, number>();
  return acts.filter(act => act.dayKey >= from && act.dayKey <= today).map(act => {
    const before = used.get(act.dayKey) ?? 0;
    const counted = Math.max(0, Math.min(act.minutes, JAR.dayCap - before));
    used.set(act.dayKey, before + counted);
    return { ...act, counted };
  });
}

/** Minutes in the jar on a day after the cap, and whether the trail is done for that day. */
export function jarDay(entries: readonly JarEntry[], day: string): { minutes: number; capped: boolean } {
  const minutes = entries.filter(entry => entry.dayKey === day).reduce((total, entry) => total + entry.counted, 0);
  return { minutes, capped: minutes >= JAR.dayCap };
}

/** "+5 min into the jar · chapter done", or "Trail done for today." once the cap is met. Nothing for acts outside the jar. */
export function jarFinishLine(entry: JarEntry | undefined, dayCapped: boolean): string | null {
  if (!entry) return null;
  if (entry.counted === 0) return dayCapped ? 'Trail done for today.' : null;
  return dayCapped ? `+${entry.counted}\u00a0min into the jar · ${entry.label}. Trail done for today.` : `+${entry.counted}\u00a0min into the jar · ${entry.label}`;
}

/**
 * The finish moment's jar line: the act whose row came in this update first (two acts can share a timestamp), else the
 * newest counted act from the last few seconds (a finished drop can land just before its idea row). Only from jarFrom.
 */
export const JAR_LINE_MS = 10_000;
export function jarLineFor(rows: { facts: readonly LedgerRow[]; settings: readonly SettingRow[]; focus: readonly FocusRow[] }, today: string, now: number, added: readonly LedgerRow[]): string | undefined {
  const from = rows.settings.find(row => row.key === JAR_FROM_KEY && !row.deleted)?.value;
  if (typeof from !== 'string') return undefined;
  const entries = deriveJar(jarActs(rows.facts.filter(row => row.dayKey === today), rows.focus, focusRateFrom(rows.settings), questsFrom(rows.settings)), from, today);
  const entry = entries.find(row => added.some(fact => fact.id === row.id)) ?? entries.filter(row => row.kind !== 'focus' && row.at >= now - JAR_LINE_MS && row.at <= now + JAR_LINE_MS).at(-1);
  return jarFinishLine(entry, jarDay(entries, today).capped) ?? undefined;
}

/** "9 h 15 m", "2 h", "45 m": the receipt's one duration format (core/recap), under the jar's name. */
export { receiptDuration as jarDuration } from '../recap';
