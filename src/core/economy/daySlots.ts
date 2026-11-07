import type { Rules, RulesHistoryEntry } from '../rules.config';
import type { LedgerRow } from '../../data/types';
import { replayFactXp } from './awards';
import { trainSessionPay } from './effort';
import { isPlannedDone } from './planned';

/** A Mind fact counts only before bedtime (written on the fact when it happened). */
export const beforeBed = (fact: LedgerRow) => fact.inputs.afterBedtime !== true && fact.inputs.beforeBedtime !== false;

export interface DaySlotContext {
  /** The planning day (04:00 to 04:00). */
  key: string;
  /** The rules in force on that day. */
  rules: Rules;
  history: readonly RulesHistoryEntry[];
  /** Spec 36 v2 (economy.v7From) and spec 41 (economy.v9From) are in force on that day. */
  v7: boolean; v9: boolean;
}

/** The Hat-trick's three slots for one day, and what they were read from (deriveEconomy pays XP from the same reads). */
export interface DaySlots {
  /** Yatra: a planned task was done. */
  plannedTask: boolean;
  /** Body: a paid workout session, or the rest-day walk check when there was no session. */
  body: boolean;
  /** Mind: today's drop, a solved case, Kapi's daily board, or enough due cards. */
  mindSlot: boolean;
  hatTrick: boolean;
  bestSession: number; restXp: number; rest: number;
  /** The day's Mind facts from before bedtime. */
  mindRows: LedgerRow[];
  caseSolved: boolean; dailyBoard: boolean; cards: LedgerRow[]; learnDrop: boolean;
  /** The day's drop was read as a chapter (or, from spec 41, as an idea sitting): one act, paid through the chapter. */
  dropWasChapter: boolean;
}

/**
 * Spec 571 §0.20 (rings): ONE pure definition of a day's Hat-trick slots. deriveEconomy calls it for every day, and the
 * header rings will call it on today's rows, so the two can never disagree (E11). It reads only that day's rows and the
 * static rules history: no other day, no settings, no database. Stage 2 commit 1 moves these lines here unchanged.
 */
export function daySlots(rows: readonly LedgerRow[], { key, rules, history, v7, v9 }: DaySlotContext): DaySlots {
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
  const dropWasChapter = v7 && rows.some(row => !row.deleted && ((row.mode === 'read' && row.kind === 'chapter' && Array.isArray(row.inputs.readDrops) && row.inputs.readDrops.includes(`drop:daily:${key}`))
    || (row.mode === 'gamify' && row.kind === 'learn-drop' && row.refId === key && row.inputs.chapter === true)
    // Spec 41: a sitting that was the day's drop is paid through its chapter, topped up to 15 (rule i).
    || (v9 && row.mode === 'read' && row.kind === 'idea' && row.inputs.dropId === `drop:daily:${key}`)));
  const mindSlot = learnDrop || caseSolved || dailyBoard || cards.length >= rules.streak.minDueCardsForMark;
  const plannedTask = rows.some(isPlannedDone);
  const body = bestSession > 0 || rest > 0;
  return { plannedTask, body, mindSlot, hatTrick: plannedTask && body && mindSlot, bestSession, restXp, rest, mindRows, caseSolved, dailyBoard, cards, learnDrop, dropWasChapter };
}
