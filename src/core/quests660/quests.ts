import type { LedgerRow, SettingRow } from '../../data/types';
import { seededShuffle } from '../learn/engine/shuffle';

/**
 * Spec 660 "Quests": one-sitting real-world quests from the courtyard friends (jenil-a9's 66, all approved by Jenil
 * 8 Nov). Everything is derived from ledger facts in their own mode, `quests660`, so the board never touches Plan's
 * weekly side quests (`mode: 'quests'`, unchanged by Jenil's ruling). The fact kinds are prefixed `quest-` because
 * several economy paths read `kind === 'done'` as a Plan task.
 */
export const QUEST_MODE = 'quests660';
export const QUEST_KIND = { accept: 'quest-accept', swap: 'quest-swap', skip: 'quest-skip', own: 'quest-own', done: 'quest-done' } as const;
/** The first day quests pay (written once in reconcile, kept across a restore like v10From/v11From). */
export const QUESTS_FROM_KEY = 'economy.v12From';
export const SAFETY_KEY = 'quests.safety';
export const SAFETY_ASKED_KEY = 'quests.safetyAsked';

export type QuestFriend = 'Nandi' | 'Moti' | 'Chiku' | 'Kapi' | 'Mor' | 'Kachhua';
export const QUEST_FRIENDS: readonly QuestFriend[] = ['Mor', 'Chiku', 'Moti', 'Kapi', 'Nandi', 'Kachhua'];
export type QuestWhere = 'home' | 'travel' | 'outside';
export const QUEST_WHERE: readonly QuestWhere[] = ['home', 'travel', 'outside'];
export type QuestMinutes = 5 | 15 | 30 | 60;
export const QUEST_MINUTES: readonly QuestMinutes[] = [5, 15, 30, 60];
export type QuestTrack = 'courage' | 'speak';
export interface QuestSafety { strangers: boolean; transit: boolean; afterDark: boolean }
export interface BoardQuest {
  id: string; friend: QuestFriend; track?: QuestTrack; step?: number; minutes: QuestMinutes; where: QuestWhere[];
  predicts: boolean; gentle: boolean; safety: QuestSafety; door?: 'read'; from595?: boolean; text: { en: string; hinglish: string };
}
export interface BoardPack { id: string; version: string; title: string; source?: string; quests: BoardQuest[] }

/** The pack's own rules (checked by validate-packs; the board file is not a Learn pack). */
export function boardErrors(pack: BoardPack): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const perFriend = new Map<QuestFriend, number>();
  const steps = new Map<QuestTrack, number[]>();
  for (const quest of pack.quests ?? []) {
    const at = `quest ${quest.id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(quest.id ?? '')) errors.push(`${at}: id must be a slug`);
    if (ids.has(quest.id)) errors.push(`${at}: duplicate id`);
    ids.add(quest.id);
    if (!QUEST_FRIENDS.includes(quest.friend)) errors.push(`${at}: unknown friend ${String(quest.friend)}`);
    perFriend.set(quest.friend, (perFriend.get(quest.friend) ?? 0) + 1);
    if (!QUEST_MINUTES.includes(quest.minutes)) errors.push(`${at}: minutes must be 5, 15, 30 or 60`);
    if (!quest.where?.length || quest.where.some(where => !QUEST_WHERE.includes(where))) errors.push(`${at}: where must list home, travel or outside`);
    if (!quest.text?.en?.trim() || !quest.text?.hinglish?.trim()) errors.push(`${at}: needs English and Hinglish`);
    if ((quest.text?.en ?? '').length > 160) errors.push(`${at}: English over 160 characters`);
    if (/\(595|wraps |demo quest/.test(quest.text?.en ?? '')) errors.push(`${at}: an editor's note is left in the text`);
    // Predictions are for the Courage and Speak steps only (a9 §0: P = no for every friend quest).
    if (quest.predicts !== (quest.track !== undefined)) errors.push(`${at}: predicts must be set on track steps only`);
    if (quest.track) steps.set(quest.track, [...steps.get(quest.track) ?? [], quest.step ?? 0]);
    const safety = quest.safety ?? {};
    if (typeof safety.strangers !== 'boolean' || typeof safety.transit !== 'boolean' || typeof safety.afterDark !== 'boolean') errors.push(`${at}: safety needs strangers, transit and afterDark`);
  }
  for (const friend of QUEST_FRIENDS) if ((perFriend.get(friend) ?? 0) < 6) errors.push(`${friend} needs at least 6 quests`);
  for (const [track, list] of steps) {
    const sorted = [...list].sort((a, b) => a - b);
    if (sorted.some((step, i) => step !== i + 1)) errors.push(`${track} steps must run 1..${sorted.length} with no gaps`);
  }
  return errors;
}

export const NO_SAFETY: QuestSafety = { strangers: false, transit: false, afterDark: false };
/** The three switches; all off until the person turns one on (Jenil 8 Nov: nothing is assumed from a profile). */
export function readSafety(settings: readonly SettingRow[]): QuestSafety {
  const value = settings.find(row => row.key === SAFETY_KEY && !row.deleted)?.value;
  if (!value || typeof value !== 'object') return NO_SAFETY;
  const raw = value as Partial<QuestSafety>;
  return { strangers: raw.strangers === true, transit: raw.transit === true, afterDark: raw.afterDark === true };
}
/** A quest is allowed when every kind it is tagged with has its switch on. */
export const allowed = (quest: BoardQuest, safety: QuestSafety) =>
  (!quest.safety.strangers || safety.strangers) && (!quest.safety.transit || safety.transit) && (!quest.safety.afterDark || safety.afterDark);

export interface BoardFilter { minutes?: QuestMinutes; where?: QuestWhere }
export interface BoardInput {
  day: string; quests: readonly BoardQuest[]; safety: QuestSafety;
  /** A soft day shows gentle quests only. */
  soft?: boolean;
  /** Quests swapped away today (never back the same day). */
  swapped?: readonly string[];
  filter?: BoardFilter;
}

const eligible = (quest: BoardQuest, input: Pick<BoardInput, 'safety' | 'soft' | 'filter'>) => allowed(quest, input.safety) && (!input.soft || quest.gentle)
  && (input.filter?.minutes === undefined || quest.minutes === input.filter.minutes) && (input.filter?.where === undefined || quest.where.includes(input.filter.where));

/** Up to 3 from `order`, each from a different friend, skipping `exclude`, after the ones already `taken`. */
function pick(order: readonly BoardQuest[], exclude: ReadonlySet<string>, taken: BoardQuest[] = []): BoardQuest[] {
  const out = [...taken];
  for (const quest of order) {
    if (out.length === 3) break;
    if (exclude.has(quest.id) || out.some(other => other.id === quest.id || other.friend === quest.friend)) continue;
    out.push(quest);
  }
  return out;
}

const EPOCH = Date.parse('2026-01-01T00:00:00Z');
const dayIndex = (day: string) => Math.round((Date.parse(`${day}T00:00:00Z`) - EPOCH) / 86_400_000);
const NO_REPEAT_DAYS = 3;

/**
 * Today's 3 quests. The allowed quests (safety switches) are dealt as a seeded deck, one deck per cycle of ~n/3 days, 3
 * from different friends a day, so the board works through the whole pack before a quest comes round again. No quest
 * shown on the last 3 days comes back while there are enough others. Today's view then applies a soft day (gentle only),
 * the time/where filter and today's swaps, drawing first from what is left of the deck. Pure and anchored to a fixed
 * cycle start, so every day agrees on what the days before it showed.
 */
export function boardFor(input: BoardInput): BoardQuest[] {
  const all = input.quests.filter(quest => allowed(quest, input.safety));
  if (!all.length) return [];
  const cycleDays = Math.max(1, Math.floor(all.length / 3));
  const target = dayIndex(input.day);
  const cycleOf = (index: number) => Math.floor(index / cycleDays);
  const deckFor = (cycle: number) => seededShuffle(all, `quests660:${cycle}`);
  const shown: string[][] = [];
  let cycle = cycleOf(target) - 1;
  let deck = deckFor(cycle);
  for (let index = cycle * cycleDays; index < target; index++) {
    if (cycleOf(index) !== cycle) { cycle = cycleOf(index); deck = deckFor(cycle); }
    const recent = new Set(shown.slice(-NO_REPEAT_DAYS).flat());
    let picks = pick(deck, recent);
    if (picks.length < 3) picks = pick(deckFor(cycle), recent, picks);
    deck = deck.filter(quest => !picks.some(p => p.id === quest.id));
    shown.push(picks.map(quest => quest.id));
  }
  if (cycleOf(target) !== cycle) deck = deckFor(cycleOf(target));
  const view = (quest: BoardQuest) => eligible(quest, input);
  const order = [...deck, ...deckFor(cycleOf(target)).filter(quest => !deck.includes(quest))].filter(view);
  const recent = shown.slice(-NO_REPEAT_DAYS).flat();
  const swapped = input.swapped ?? [];
  // Hold back recent quests while that still leaves 3 friends; a swapped one stays out unless nothing else is left.
  const friends = new Set(order.map(quest => quest.friend)).size;
  for (const exclude of [[...recent, ...swapped], swapped, []]) {
    const picks = pick(order, new Set(exclude));
    if (picks.length === Math.min(3, friends)) return picks;
  }
  return pick(order, new Set());
}

/** The ids swapped away on `day` (from the ledger). */
export const swappedOn = (facts: readonly LedgerRow[], day: string) =>
  facts.filter(row => !row.deleted && row.mode === QUEST_MODE && row.kind === QUEST_KIND.swap && row.dayKey === day).map(row => row.refId);

/** Spec 660 §2.3 pay: +5 jar minutes for a 5-15 minute quest, +10 for 30 or more (under the jar's 60-a-day cap). */
export const questJarMinutes = (minutes: number) => minutes >= 30 ? 10 : 5;

/** A finished quest that pays: from the cutoff only, never a night one (the stage-2 night stamp). */
export const paysJar = (fact: LedgerRow, questsFrom: string | undefined) => !fact.deleted && fact.mode === QUEST_MODE && fact.kind === QUEST_KIND.done
  && questsFrom !== undefined && fact.dayKey >= questsFrom && fact.inputs.night !== true;

/**
 * Double pay (Jenil 8 Nov): a quest that wraps a door's own act (Chiku's "read 10 pages" with its chapter fact) pays
 * the quest's jar minutes once. The door fact stays (rings, courtyard growth, XP) and only the jar skips it.
 */
export function wrappedDoorIds(facts: readonly LedgerRow[], questsFrom: string | undefined): Set<string> {
  return new Set(facts.filter(fact => paysJar(fact, questsFrom) && typeof fact.inputs.wraps === 'string').map(fact => fact.inputs.wraps as string));
}

export const questDoneId = (questId: string, day: string) => `quest660:${questId}:${day}`;

export type Prediction = 'ignore' | 'freeze' | 'awkward' | 'other';
export const PREDICTIONS: readonly { id: Prediction; label: string }[] = [
  { id: 'ignore', label: 'They’ll ignore me' }, { id: 'freeze', label: 'I’ll freeze' }, { id: 'awkward', label: 'It’ll be awkward' }, { id: 'other', label: 'Something else' },
];
/** What actually happened. `happened` = the predicted thing came true (an honest miss stays in the Reality Check). */
export type Outcome = 'fine' | 'better' | 'happened' | 'not-done';
export const OUTCOMES: readonly { id: Outcome; label: string }[] = [
  { id: 'better', label: 'Better than I thought' }, { id: 'fine', label: 'It went fine' }, { id: 'happened', label: 'What I feared happened' }, { id: 'not-done', label: 'I didn’t do it this time' },
];
export type Learned = 'try-again' | 'smaller-step' | 'different-time' | 'still-glad';
export const LEARNED: readonly { id: Learned; label: string }[] = [
  { id: 'still-glad', label: 'Still glad I tried' }, { id: 'smaller-step', label: 'Start with a smaller step' }, { id: 'different-time', label: 'Pick a better moment' }, { id: 'try-again', label: 'I’ll try it again' },
];

/** One stone per finished quest-day, keyed by its fact id, so a restore can neither duplicate nor drop one. */
export function questStones(facts: readonly LedgerRow[]): { id: string; questId: string; dayKey: string }[] {
  const seen = new Set<string>();
  return facts.filter(fact => !fact.deleted && fact.mode === QUEST_MODE && fact.kind === QUEST_KIND.done && fact.inputs.outcome !== 'not-done')
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.updatedAt - b.updatedAt || a.id.localeCompare(b.id))
    .filter(fact => !seen.has(fact.id) && seen.add(fact.id)).map(fact => ({ id: fact.id, questId: fact.refId, dayKey: fact.dayKey }));
}

export interface RealityCheck {
  quests: number;
  /** Per prediction made: how often it was made, and how often it happened (a done quest whose fear did not come true counts). */
  predictions: { id: Prediction; label: string; made: number; happened: number }[];
  fearBefore: number | null; feltAfter: number | null;
}
export const REALITY_CHECK_AFTER = 3;
/** Spec 660 §2.3 step 6: from the predicted quests that were done (not "didn't do it"); null until there are 3. */
export function realityCheck(facts: readonly LedgerRow[]): RealityCheck | null {
  const rows = facts.filter(fact => !fact.deleted && fact.mode === QUEST_MODE && fact.kind === QUEST_KIND.done && typeof fact.inputs.prediction === 'string' && fact.inputs.outcome !== 'not-done');
  if (rows.length < REALITY_CHECK_AFTER) return null;
  // a9 13 Nov (w08 #6): whole numbers, so both read the same way ("4/5 … 2/5").
  const mean = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  const scores = (key: string) => rows.map(row => row.inputs[key]).filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 5);
  return {
    quests: rows.length,
    predictions: PREDICTIONS.map(p => ({ ...p, made: rows.filter(row => row.inputs.prediction === p.id).length, happened: rows.filter(row => row.inputs.prediction === p.id && row.inputs.outcome === 'happened').length })).filter(p => p.made > 0),
    fearBefore: mean(scores('fear')), feltAfter: mean(scores('felt')),
  };
}

/** The Reality Check in one line (the view's headline, the Sunday receipt line). No names, no rankings. */
export function realityLine(check: RealityCheck): string {
  // a9 13 Nov (w08): the headline names a real prediction, never "Something else"; the label keeps its own case ("I’ll").
  const top = [...check.predictions].filter(p => p.id !== 'other').sort((a, b) => b.made - a.made)[0];
  if (!top) {
    const made = check.predictions.reduce((sum, p) => sum + p.made, 0), happened = check.predictions.reduce((sum, p) => sum + p.happened, 0);
    return `Your fear came true ${happened} of ${made} times.`;
  }
  const times = (n: number) => n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`;
  return `You predicted “${top.label}” ${times(top.made)}. ${top.happened === 0 ? 'It never happened.' : `It happened ${times(top.happened)}.`}`;
}
