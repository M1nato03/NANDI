import type { NextMove } from '../nextMove';
import type { BoardQuest } from './quests';

/** b2 12 Nov (ruling a): a task timed this close, or already past, is due now. */
export const DUE_SOON_MS = 30 * 60_000;

/**
 * Spec 660 §2.1: the collapsed courtyard row shows the plan's next move when something is due now (a running focus, a
 * task timed within 30 min or overdue, a due book check, night), otherwise today's quest.
 */
export function moveIsDue(move: NextMove, now: number): boolean {
  if (move.kind === 'focus') return move.running;
  if (move.kind === 'task') return move.at !== undefined && move.at <= now + DUE_SOON_MS;
  return move.kind === 'book-check' || move.kind === 'night';
}

export type CardRowChoice = { kind: 'move' } | { kind: 'quest'; quest: BoardQuest } | { kind: 'rest' };

/**
 * What the collapsed row shows. Night rests (no quest at night). A due move wins. Otherwise the first quest on today's
 * board not yet done; if every quest is done, swapped away or filtered out, the row falls back to the next move, so it is
 * never empty and never a dead "no quest" line.
 */
export function cardRow(input: { resting: boolean; move?: NextMove; now: number; board: readonly BoardQuest[]; doneToday: ReadonlySet<string> }): CardRowChoice {
  if (input.resting) return { kind: 'rest' };
  if (input.move && moveIsDue(input.move, input.now)) return { kind: 'move' };
  const quest = input.board.find(row => !input.doneToday.has(row.id));
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
