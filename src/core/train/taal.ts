import { addEconomyDays, weekStart } from '../economy/deriveEconomy';
import type { LedgerRow } from '../../data/types';
import { RULES } from '../rules.config';

/**
 * Spec 24 #3, the Taal week (cj5-train §7 #1). In a taal some beats are claps and some are khali, the empty beat that is
 * still part of the rhythm. The training week is one cycle: program days are claps, the other days are rest beats.
 * - A clap fills when a session on that day earned XP (full, partial, minimum or a safety stop).
 * - A rest beat fills on its own once its day has ended without a session. A walk check adds a mark to it.
 * - Training on a rest beat fills it as a clap, shown honestly (`extra`), with no bonus beyond today's rules.
 * - Readiness can move today's clap to a later rest beat of the same week, or make today a rest beat.
 * Everything here is derived from ledger facts plus one settings row per week, so nothing new is scored: the weekly
 * bonus stays the reward, and beats only ever fill.
 */
export type BeatChanges = { moves: { from: string; to: string }[]; restToday: string[] };
export type Beat = { dayKey: string; weekday: number; plan: 'clap' | 'rest'; filled: boolean; walked: boolean; extra: boolean; today: boolean; past: boolean };
export type TaalWeek = { weekStart: string; beats: Beat[]; claps: number; filled: number; target: number; closed: boolean; ended: boolean; movesLeft: number };

export const TAAL_BEATS_KEY = (week: string) => `train.beats:${week}`;

export function readBeatChanges(value: unknown): BeatChanges {
  const raw = value && typeof value === 'object' ? value as Partial<BeatChanges> : {};
  const day = (text: unknown): text is string => typeof text === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(text);
  return {
    moves: Array.isArray(raw.moves) ? raw.moves.filter((move): move is { from: string; to: string } => !!move && day(move.from) && day(move.to)) : [],
    restToday: Array.isArray(raw.restToday) ? raw.restToday.filter(day) : [],
  };
}

const weekdayOf = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();

export function taalWeek(input: { today: string; week?: string; programDays: readonly number[]; target: number; ledger: readonly LedgerRow[]; changes?: BeatChanges }): TaalWeek {
  const start = input.week ?? weekStart(input.today);
  const keys = Array.from({ length: 7 }, (_, index) => addEconomyDays(start, index));
  const changes = input.changes ?? { moves: [], restToday: [] };
  const plan = new Map(keys.map(key => [key, input.programDays.includes(weekdayOf(key)) ? 'clap' as const : 'rest' as const]));
  // Changes apply in order, and only inside this week: a move swaps a clap with a rest beat, rest-today turns a clap.
  let moves = 0;
  for (const move of changes.moves) {
    if (plan.get(move.from) !== 'clap' || plan.get(move.to) !== 'rest' || moves >= RULES.taal.movesPerWeek) continue;
    plan.set(move.from, 'rest'); plan.set(move.to, 'clap'); moves++;
  }
  for (const key of changes.restToday) if (plan.get(key) === 'clap') plan.set(key, 'rest');
  const trained = new Set(input.ledger.filter(fact => !fact.deleted && fact.mode === 'train' && fact.kind === 'session' && Number(fact.inputs?.xp ?? 0) > 0).map(fact => fact.dayKey));
  const walked = new Set(input.ledger.filter(fact => !fact.deleted && fact.mode === 'train' && fact.kind === 'rest').map(fact => fact.dayKey));
  const beats = keys.map(key => {
    const planned = plan.get(key)!;
    const session = trained.has(key);
    const past = key < input.today;
    return { dayKey: key, weekday: weekdayOf(key), plan: session ? 'clap' as const : planned, filled: session || (planned === 'rest' && past), walked: walked.has(key) && !session, extra: session && planned === 'rest', today: key === input.today, past };
  });
  const filled = beats.filter(beat => beat.plan === 'clap' && beat.filled).length;
  const ended = keys[6]! < input.today;
  return { weekStart: start, beats, claps: beats.filter(beat => beat.plan === 'clap').length, filled, target: input.target, closed: filled >= input.target, ended, movesLeft: Math.max(0, RULES.taal.movesPerWeek - moves) };
}

/** The next rest beat after today in the same week, which today's clap could move to. */
export function nextRestBeat(week: TaalWeek): Beat | undefined {
  const today = week.beats.find(beat => beat.today);
  if (!today || today.plan !== 'clap' || today.filled || week.movesLeft <= 0) return undefined;
  return week.beats.find(beat => beat.dayKey > today.dayKey && beat.plan === 'rest' && !beat.filled);
}

/** One line for the week, never a loss: a closed cycle, a week that closed short, or how far it has come. */
export function weekLine(week: TaalWeek): string {
  if (week.closed) return 'This week’s cycle is closed.';
  if (week.ended) return week.filled ? `This week closed at ${week.filled}. That counts.` : 'A rest week.';
  return `${week.filled} of ${week.target} sessions this week.`;
}

/** The rhythm sheet: every past week since the program began, newest first. It only grows. */
export function rhythmSheet(input: { today: string; since: string; programDays: readonly number[]; target: number; ledger: readonly LedgerRow[]; changesFor: (week: string) => BeatChanges; limit?: number }): TaalWeek[] {
  const out: TaalWeek[] = [];
  let week = addEconomyDays(weekStart(input.today), -7);
  const first = weekStart(input.since);
  while (week >= first && out.length < (input.limit ?? 12)) {
    out.push(taalWeek({ today: input.today, week, programDays: input.programDays, target: input.target, ledger: input.ledger, changes: input.changesFor(week) }));
    week = addEconomyDays(week, -7);
  }
  return out;
}
