import type { Rules, RulesHistoryEntry } from '../rules.config';
import type { LedgerRow } from '../../data/types';
import { replayFactXp } from './awards';
import { trainSessionPay } from './effort';
import { isPlannedDone } from './planned';

/** A Mind fact counts only before bedtime (written on the fact when it happened). */
export const beforeBed = (fact: LedgerRow) => fact.inputs.afterBedtime !== true && fact.inputs.beforeBedtime !== false;

/** Spec 571 §0.20 rule 3: a slot fact written inside the night window (bedtime → 05:00) carries `night: true`. */
export const inNight = (fact: LedgerRow) => fact.inputs.night === true;

/** Spec 571 §0.20: the six Mind acts, in the order that breaks a tie in time. */
export const MIND_ACTS = ['drop', 'chapter', 'calm', 'case', 'board', 'cards'] as const;
export type MindAct = typeof MIND_ACTS[number];
export type BodyMark = 'workout' | 'walk';
/** Rule 4: a Calm sit counts toward Mind only from 5 measured minutes. */
export const CALM_RING_MINUTES = 5;

export interface DaySlotContext {
  /** The planning day (04:00 to 04:00). */
  key: string;
  /** The rules in force on that day. */
  rules: Rules;
  history: readonly RulesHistoryEntry[];
  /** Spec 36 v2 (economy.v7From) and spec 41 (economy.v9From) are in force on that day. */
  v7: boolean; v9: boolean;
  /** Spec 571 §0.20 (economy.v10From): the rings are the Hat-trick slots. */
  v10?: boolean;
}

/** What lit each ring (data only; the marks are drawn from it). */
export interface DayRings {
  /** Yatra, "Keep one promise": the first planned task done (its task id), else null. */
  yatra: string | null;
  /** Body, "One real move": the workout wins over the rest walk. */
  body: BodyMark | null;
  /** Mind, "Any two": every different act lit, in the order done; two or more close it. */
  mind: MindAct[];
}

/** The Hat-trick's three slots for one day, and what they were read from (deriveEconomy pays XP from the same reads). */
export interface DaySlots {
  /** Yatra: a planned task was done. */
  plannedTask: boolean;
  /** Body: a paid workout session, or the rest-day walk check when there was no session. */
  body: boolean;
  /** Mind: before v10, any one of today's drop, a solved case, Kapi's daily board or enough due cards; from v10, any two. */
  mindSlot: boolean;
  hatTrick: boolean;
  bestSession: number; restXp: number; rest: number;
  /** The day's Mind facts from before bedtime. */
  mindRows: LedgerRow[];
  caseSolved: boolean; dailyBoard: boolean; cards: LedgerRow[]; learnDrop: boolean;
  /** The day's drop was read as a chapter (or, from spec 41, as an idea sitting): one act, paid through the chapter. */
  dropWasChapter: boolean;
  /** Rule 2: the useful-day mark keeps "any one" (a planned task, a move, or drop / case / board / cards), night or not. */
  useful: boolean;
  /** From v10: what lit each ring; null before (the rings are not shown for a day under the old slots). */
  rings: DayRings | null;
}

type Reads = Omit<DaySlots, 'useful' | 'rings'>;

/** The slot reads as they stood at 4ef31da (stage 2 commit 1 moved them here unchanged). */
function reads(rows: readonly LedgerRow[], { key, rules, history, v7, v9 }: DaySlotContext): Reads {
  // Spec 36 v2: a session written with its paid sets pays per set; an older fact keeps its own award.
  const sessions = rows.filter(row => row.mode === 'train' && row.kind === 'session').map(row => (v7 ? trainSessionPay(row.inputs, rules) : null) ?? replayFactXp(row, history));
  const bestSession = Math.max(0, ...sessions);
  const restXp = Math.max(0, ...rows.filter(row => row.mode === 'train' && row.kind === 'rest').map(row => replayFactXp(row, history)));
  const rest = bestSession ? 0 : restXp;
  const mindRows = rows.filter(row => row.mode === 'mind' && beforeBed(row));
  const caseSolved = mindRows.some(row => row.kind === 'mystery' && row.inputs.result !== 'revealed');
  const dailyBoard = mindRows.some(row => row.kind === 'board' && row.inputs.daily !== false);
  const cards = mindRows.filter(row => row.kind === 'card');
  const learnAnswers = new Set(mindRows.filter(row => row.kind === 'learn-answer' && row.inputs.dropId === `drop:daily:${key}`).map(row => row.refId));
  // A teach-first drop can end after a few scored answers, or after the lesson alone (spec 16 §5, a new
  // learner with nothing earlier to practise), so a finished daily drop counts too, as long as one of
  // its answers or its lesson came before bedtime.
  const lessonDone = rows.some(row => row.kind === 'learn-lesson' && !row.deleted && row.inputs.dropId === `drop:daily:${key}` && beforeBed(row));
  const dropFinished = rows.some(row => row.mode === 'gamify' && row.kind === 'learn-drop' && row.refId === key) && (learnAnswers.size > 0 || lessonDone);
  const learnDrop = mindRows.some(row => row.kind === 'learn-drop') || learnAnswers.size >= 5 || dropFinished;
  // The drop was a chapter's reading: its finished chapter says so, and so does the drop fact from the moment the
  // reading ends (so the drop never pays its 15 first and then gives it back when the chapter is done).
  const dropWasChapter = v7 && rows.some(row => !row.deleted && (isDropReading(row, key)
    || (row.mode === 'gamify' && row.kind === 'learn-drop' && row.refId === key && row.inputs.chapter === true)
    // Spec 41: a sitting that was the day's drop is paid through its chapter, topped up to 15 (rule i).
    || (v9 && row.mode === 'read' && row.kind === 'idea' && row.inputs.dropId === `drop:daily:${key}`)));
  const mindSlot = learnDrop || caseSolved || dailyBoard || cards.length >= rules.streak.minDueCardsForMark;
  const plannedTask = rows.some(isPlannedDone);
  const body = bestSession > 0 || rest > 0;
  return { plannedTask, body, mindSlot, hatTrick: plannedTask && body && mindSlot, bestSession, restXp, rest, mindRows, caseSolved, dailyBoard, cards, learnDrop, dropWasChapter };
}

/** A finished chapter whose reading included the day's drop. */
const isDropReading = (row: LedgerRow, key: string) => row.mode === 'read' && row.kind === 'chapter' && Array.isArray(row.inputs.readDrops) && row.inputs.readDrops.includes(`drop:daily:${key}`);
const earliest = (list: readonly LedgerRow[]) => list.length ? Math.min(...list.map(row => row.updatedAt)) : Infinity;

/**
 * Rule 4: two DIFFERENT acts. The drop read as a chapter (dropWasChapter) or as a spec 41 idea sitting is ONE act, the
 * drop; "a chapter" is reading that was not the day's drop. Calm counts from 5 measured minutes, cards from the mark's
 * minimum, the board only as Kapi's daily board. Each act is timed by the fact that lit it, for the order done.
 */
function mindActs(rows: readonly LedgerRow[], read: Reads, key: string, rules: Rules): MindAct[] {
  const live = rows.filter(row => !row.deleted && beforeBed(row));
  const drop = `drop:daily:${key}`;
  const at = new Map<MindAct, number>();
  if (read.learnDrop || read.dropWasChapter) {
    const answers = new Map<string, number>();
    for (const row of read.mindRows) if (row.kind === 'learn-answer' && row.inputs.dropId === drop) answers.set(row.refId, Math.min(answers.get(row.refId) ?? Infinity, row.updatedAt));
    const fifth = answers.size >= 5 ? [...answers.values()].sort((a, b) => a - b)[4]! : Infinity;
    const finished = live.filter(row => row.kind === 'learn-drop' && (row.mode === 'mind' || (row.mode === 'gamify' && row.refId === key))
      || isDropReading(row, key) || (row.mode === 'read' && row.kind === 'idea' && row.inputs.dropId === drop));
    at.set('drop', Math.min(fifth, earliest(finished)));
  }
  const chapter = live.filter(row => row.mode === 'read' && ((row.kind === 'chapter' && !isDropReading(row, key)) || (row.kind === 'idea' && row.inputs.dropId !== drop)));
  if (chapter.length) at.set('chapter', earliest(chapter));
  const calm = live.filter(row => row.mode === 'calm' && row.kind === 'session' && Number(row.inputs.minutes) >= CALM_RING_MINUTES);
  if (calm.length) at.set('calm', earliest(calm));
  if (read.caseSolved) at.set('case', earliest(read.mindRows.filter(row => row.kind === 'mystery' && row.inputs.result !== 'revealed')));
  if (read.dailyBoard) at.set('board', earliest(read.mindRows.filter(row => row.kind === 'board' && row.inputs.daily !== false)));
  const need = Math.max(1, rules.streak.minDueCardsForMark);
  if (read.cards.length >= need) at.set('cards', read.cards.map(row => row.updatedAt).sort((a, b) => a - b)[need - 1]!);
  return [...at].sort((a, b) => a[1] - b[1] || MIND_ACTS.indexOf(a[0]) - MIND_ACTS.indexOf(b[0])).map(([act]) => act);
}

/**
 * Spec 571 §0.20 (rings): ONE pure definition of a day's Hat-trick slots. deriveEconomy calls it for every day, and the
 * header rings will call it on today's rows, so the two can never disagree (E11). It reads only that day's rows and the
 * static rules history: no other day, no settings, no database.
 *
 * Before v10 the slots are the old ones exactly (build rule 1). From v10 (economy.v10From): Yatra = a planned task
 * done, Body = a paid session or the rest walk, Mind = two different acts; rows stamped `night` count for no slot
 * (rule 3). The XP reads (bestSession, rest, cards, learnDrop, ...) always come from every row, so no item's XP
 * changes; only the Hat-trick follows the rings. The useful-day mark stays "any one" (rule 2).
 */
export function daySlots(rows: readonly LedgerRow[], ctx: DaySlotContext): DaySlots {
  const all = reads(rows, ctx);
  const useful = all.plannedTask || all.body || all.mindSlot;
  if (!ctx.v10) return { ...all, useful, rings: null };
  const awake = rows.filter(row => !inNight(row));
  const ring = awake.length === rows.length ? all : reads(awake, ctx);
  const mind = mindActs(awake, ring, ctx.key, ctx.rules);
  const body: BodyMark | null = ring.bestSession > 0 ? 'workout' : ring.rest > 0 ? 'walk' : null;
  const promise = awake.filter(isPlannedDone).sort((a, b) => a.updatedAt - b.updatedAt || a.id.localeCompare(b.id))[0];
  const mindSlot = mind.length >= 2;
  return { ...all, plannedTask: ring.plannedTask, body: body !== null, mindSlot, hatTrick: ring.plannedTask && body !== null && mindSlot, useful,
    rings: { yatra: promise ? promise.refId : null, body, mind } };
}
