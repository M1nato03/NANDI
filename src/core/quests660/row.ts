import type { NextMove } from '../nextMove';
import type { Goal } from '../welcome';
import type { BoardQuest, QuestFriend } from './quests';

/** b2 12 Nov (ruling a): a task timed this close, or already past, is due now. */
export const DUE_SOON_MS = 30 * 60_000;

/**
 * Spec 660 §2.1: the collapsed courtyard row shows the plan's next move when something is due now (an open focus, running
 * or held at "Still working?", a task timed within 30 min or overdue, a due book check, night), otherwise today's quest.
 */
export function moveIsDue(move: NextMove, now: number): boolean {
  // An open focus is work in hand, running or paused (its pause waits for the person, spec 36 Still working?).
  if (move.kind === 'focus') return true;
  if (move.kind === 'task') return move.at !== undefined && move.at <= now + DUE_SOON_MS;
  return move.kind === 'book-check' || move.kind === 'night';
}

export type CardRowChoice = { kind: 'move' } | { kind: 'quest'; quest: BoardQuest } | { kind: 'rest' };

/**
 * What the collapsed row shows. Night rests (no quest at night). A due move wins. Otherwise the first quest on today's
 * board not yet done; if every quest is done, swapped away or filtered out, the row falls back to the next move, so it is
 * never empty and never a dead "no quest" line.
 */
/** The friend who looks after each pick (spec 52's goals); Moti's Remember is no pick of its own. */
export const GOAL_FRIEND: Record<Goal, QuestFriend> = { sleep: 'Kachhua', learn: 'Chiku', train: 'Nandi', mind: 'Kapi', plan: 'Mor' };

export function cardRow(input: { resting: boolean; move?: NextMove; now: number; board: readonly BoardQuest[]; doneToday: ReadonlySet<string>; picked?: readonly Goal[] }): CardRowChoice {
  if (input.resting) return { kind: 'rest' };
  if (input.move && moveIsDue(input.move, input.now)) return { kind: 'move' };
  const open = input.board.filter(row => !input.doneToday.has(row.id));
  // Sun walkthrough (b2/a9 14 Nov, 660 §2.3 in part): the first open quest from a friend the person picked, if any;
  // otherwise the first open quest as before. (The full §2.3 weighting is post-16, a9 P19.)
  const friends = new Set((input.picked ?? []).map(goal => GOAL_FRIEND[goal]));
  const quest = open.find(row => friends.has(row.friend)) ?? open[0];
  return quest ? { kind: 'quest', quest } : { kind: 'move' };
}

/** "Chiku has a quest", "· 5 min". */
export const questRowLine = (quest: Pick<BoardQuest, 'friend' | 'minutes'>) => ({ line: `${quest.friend} has a quest`, meta: `${quest.minutes}\u00a0min` });

/** "5 min · home or outside". */
export function questMeta(quest: Pick<BoardQuest, 'minutes' | 'where'>): string {
  const where = quest.where.map(place => place === 'travel' ? 'on the way' : place);
  const places = where.length > 1 ? `${where.slice(0, -1).join(', ')} or ${where.at(-1)}` : where[0] ?? '';
  return `${quest.minutes}\u00a0min · ${places}`;
}
