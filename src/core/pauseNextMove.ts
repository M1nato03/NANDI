import type { FocusRow, ProgramRow, SessionRow, TaskRow } from '../data/types';

/**
 * Spec 39b, "Do it in NANDI": where the Pause card sends someone who would rather do the next real thing here. The
 * first match wins: a running focus, a Train day with no session yet, a task planned for today, else today's Read
 * drop. Whatever is done there pays by its own rules; the card pays nothing for it.
 */
export type PauseNextMove = { route: 'plan/focus' | 'yatra/train' | 'read/drop'; why: 'focus' | 'train' | 'task' | 'read' };

export function pauseNextMove(input: { focus: readonly FocusRow[]; tasks: readonly TaskRow[]; programs: readonly ProgramRow[]; sessions: readonly SessionRow[]; today: string; weekday: number }): PauseNextMove {
  if (input.focus.some(row => !row.deleted && row.endedAt == null)) return { route: 'plan/focus', why: 'focus' };
  const program = input.programs.find(row => !row.deleted);
  const trained = input.sessions.some(row => !row.deleted && row.dayKey === input.today && row.status !== 'skipped');
  if (program?.days?.includes(input.weekday) && !trained) return { route: 'yatra/train', why: 'train' };
  if (input.tasks.some(row => !row.deleted && row.dayKey === input.today && row.status === 'planned')) return { route: 'plan/focus', why: 'task' };
  return { route: 'read/drop', why: 'read' };
}
