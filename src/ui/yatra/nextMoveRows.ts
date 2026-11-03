import { db as appDb, type NandiDb } from '../../data/db';
import type { FocusRow } from '../../data/types';
import { effectiveBedtime } from '../../data/repos/night';
import { dayKey } from '../../core/time/dayKey';
import { isAfterBedtime } from '../../core/time/nightTimeline';
import { weekStart } from '../../core/economy/deriveEconomy';
import { softToday } from '../../core/soft/soft';
import { readBeatChanges, taalWeek, trainDays, TAAL_BEATS_KEY } from '../../core/train/taal';
import { isFocusRunning } from '../../core/tasks/focus';
import { bookCheckDue, readingNow } from '../../core/learn/books';
import { readPicks, type Picks } from '../../core/welcome';
import { nextMove, type NextMove, type NextMoveInput } from '../../core/nextMove';
import { topics } from '../learn/flow';

export type NextMoveRows = { input: NextMoveInput; move: NextMove; picks: Picks; focus: FocusRow[]; current: FocusRow | null; boardMedianMs?: number };

/**
 * Spec 52: the one loader for the next move. Home's card and the Pause card's in-app choice both read the rows here
 * and pass them to the same nextMove, so the two can never disagree. Existing rows only; nothing is written.
 */
export async function readNextMove(now = Date.now(), db: NandiDb = appDb): Promise<NextMoveRows> {
  const today = dayKey(now);
  const week = weekStart(today);
  const [settings, focus, ledger, reads, tasks, program, beats, runs, bedtime] = await Promise.all([
    db.settings.toArray(), db.focus.filter(row => !row.deleted).toArray(),
    db.ledger.where('dayKey').between(week, today, true, true).filter(row => !row.deleted).toArray(),
    db.ledger.where('kind').anyOf('chapter', 'chapter-check', 'learn-lesson').toArray(),
    db.tasks.where('dayKey').equals(today).toArray(), db.programs.get('train-program'), db.settings.get(TAAL_BEATS_KEY(week)),
    db.puzzleRuns.filter(run => !!run.daily && run.result === 'solved' && !run.deleted && typeof run.solveMs === 'number').toArray(),
    effectiveBedtime(db, now),
  ]);
  const picks = readPicks(settings);
  const open = focus.filter(row => row.endedAt == null).sort((a, b) => b.startedAt - a.startedAt)[0];
  const task = open ? await db.tasks.get(open.taskId) : undefined;
  const current = open && task && !task.deleted ? open : null;
  const beat = program ? taalWeek({ today, programDays: program.days ?? [1, 3, 5], target: program.weeklyTarget ?? 3, days: trainDays(ledger), changes: readBeatChanges(beats && !beats.deleted ? beats.value : undefined) }).beats.find(row => row.today) : undefined;
  const input: NextMoveInput = {
    focus: current && task ? { title: task.title, running: isFocusRunning(current) } : null,
    bookCheck: bookCheckDue(reads, today) ?? null,
    trainToday: beat?.plan === 'clap' && !beat.filled,
    tasks, today,
    softDay: !!softToday(ledger, today).state,
    goals: picks.goals, size: picks.size,
    afterBedtime: isAfterBedtime(now, bedtime),
    reading: readingNow(topics, reads) ?? null,
    train: !program ? 'easy' : beat?.filled || beat?.walked ? 'done' : 'rest',
  };
  // The person's own median time on the daily board, once there are three solved runs to take it from.
  const times = runs.map(run => run.solveMs!).sort((a, b) => a - b);
  const boardMedianMs = times.length >= 3 ? times[Math.floor(times.length / 2)] : undefined;
  return { input, move: nextMove(input), picks, focus, current, ...(boardMedianMs != null ? { boardMedianMs } : {}) };
}
