import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import type { DailyLogRow, SessionRow, TaskRow } from '../../data/types';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time/dayKey';
import { postponeWeekKey } from '../../core/tasks/budget';
import { weekInWords, weekInWordsSummary } from '../../core/tasks/plannerCopy';
import { buildWeeklySummary, isoFileWeek } from '../../core/weeklySummary';
import { shareOrDownload } from '../../platform/files';
import { taskRepos, useTaskBoard } from './useTaskBoard';
import { QUEST_MODE, realityCheck, realityLine } from '../../core/quests660/quests';

/**
 * Spec 660 §3.3 (jenil-0b F3, 12 Nov): the weekly review's controls, each in its one new home. The review screen
 * itself is gone; Someday triage is Plan's Later list, checkpoints stay in task details, the two agency questions stay
 * on Plan on Sundays. What lives here: the week's export (Settings › Backup), the move-budget line (the Sunday
 * receipt) and the past weeks (You › history).
 */
type Policy = { budget?: number; raisedAtWeek?: string; steppedDownAtWeek?: string };
const policyOf = (settings: readonly { key: string; value: unknown; deleted: number }[]) => settings.find(row => row.key === 'planner.budget' && !row.deleted)?.value as Policy | undefined;

/** The week's summary file (what the review's "Export summary" made), for the current planning week. */
export async function exportWeekSummary(now = Date.now()): Promise<string> {
  const weekKey = postponeWeekKey(now);
  const name = `nandi-week-${isoFileWeek(weekKey)}.json`;
  const source = await db.transaction('r', [db.tasks, db.taskEvents, db.focus, db.dailyLog, db.sessions, db.prs, db.programs, db.puzzleRuns, db.lessonProg, db.plans, db.flags, db.ledger, db.quests, db.settings, db.exState], async () => {
    const [tasks, events, focus, logs, sessions, prs, programs, puzzleRuns, lessonProg, plans, flags, ledger, quests, settings, exState] = await Promise.all([db.tasks.toArray(), db.taskEvents.toArray(), db.focus.toArray(), db.dailyLog.toArray(), db.sessions.toArray(), db.prs.toArray(), db.programs.toArray(), db.puzzleRuns.toArray(), db.lessonProg.toArray(), db.plans.toArray(), db.flags.toArray(), db.ledger.toArray(), db.quests.toArray(), db.settings.toArray(), db.exState.toArray()]);
    return { tasks, events, focus, logs, sessions, prs, programs, puzzleRuns, lessonProg, plans, flags, ledger, quests, settings, exState };
  });
  const complete = buildWeeklySummary(weekKey, source, policyOf(source.settings)?.budget ?? RULES.tasks.postpone.weeklyBudget);
  const result = await shareOrDownload(new File([JSON.stringify(complete, null, 2)], name, { type: 'application/json' }));
  return result === 'cancelled' ? 'Export cancelled.' : result === 'shared' ? 'Shared weekly summary.' : `Saved ${name}.`;
}

/** Settings › Backup: the week's summary export, moved from the weekly review. */
export function ExportWeekButton() {
  const [message, setMessage] = useState('');
  return <div className="export-week">
    <button type="button" className="secondary" onClick={() => void exportWeekSummary().then(setMessage).catch(() => setMessage('Could not export the weekly summary.'))}>Export this week's summary</button>
    {message && <p role="status" className="small">{message}</p>}
  </div>;
}

/**
 * The Sunday receipt's one optional line about the move budget: "raised" when it went up this week, or the offer to
 * lower it after 3 of the last 4 weeks came in under it (both moved from the weekly review). Nothing when neither.
 */
export function MoveBudgetLine() {
  const board = useTaskBoard();
  const source = useLiveQuery(async () => ({ events: await db.taskEvents.filter(row => row.deleted === 0).count(), settings: await db.settings.toArray() }), []);
  // b2 12 Nov: the offer is read from the same state and rule the action uses (repos.budgetLowerOffer), so it shows
  // only when "Lower it by 1?" will work. Re-read whenever the moves or the settings change.
  const [read, setRead] = useState<Awaited<ReturnType<Awaited<ReturnType<typeof taskRepos>>['budgetLowerOffer']>> | null>(null);
  useEffect(() => {
    if (!source) return;
    let live = true;
    void taskRepos().then(repos => repos.budgetLowerOffer(Date.now())).then(next => { if (live) setRead(next); }).catch(() => undefined);
    return () => { live = false; };
  }, [source]);
  if (!source || !read) return null;
  const policy = policyOf(source.settings) ?? read.state;
  const currentWeek = postponeWeekKey(board.now);
  if (policy.raisedAtWeek === currentWeek) return <p className="small move-budget-line" role="status">Move budget raised to {policy.budget}. Plans should fit real life.</p>;
  // Lowered this week: the line stays, so the answer to the tap does not vanish with the offer.
  if (policy.steppedDownAtWeek === currentWeek) return <p className="small move-budget-line" role="status">Move budget lowered to {policy.budget}.</p>;
  if (read.offer == null) return null;
  return <p className="small move-budget-line">Under your move budget in 3 of the last 4 weeks.{' '}
    <button type="button" className="text-button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.lowerBudget(now))}>Lower it by 1?</button>
    {board.message && <span role="status"> {board.message}</span>}</p>;
}

/** One finished planning week, as the review's "Earlier week" showed it: the week in words and the agency answer. */
export interface PastWeek { weekKey: string; words: string; agency?: number }
export function pastWeeks(tasks: readonly TaskRow[], sessions: readonly SessionRow[], logs: readonly DailyLogRow[], now: number, count = 8): PastWeek[] {
  const current = postponeWeekKey(now);
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(`${current}T12:00:00`); start.setDate(start.getDate() - (index + 1) * 7);
    const weekKey = dayKey(start);
    const next = dayKey(new Date(start.getTime() + 7 * 86_400_000));
    const inWeek = (key: string) => key >= weekKey && key < next;
    const startAt = new Date(`${weekKey}T04:00:00`).getTime();
    const done = tasks.filter(task => !task.deleted && task.doneAt != null && task.doneAt >= startAt && task.doneAt < startAt + 7 * 86_400_000).length;
    const training = sessions.filter(session => !session.deleted && inWeek(session.dayKey) && session.status === 'completed').length;
    const nights = logs.filter(log => !log.deleted && inWeek(log.dayKey) && log.lightsOutAt != null && log.bedtimeTarget != null && log.lightsOutAt <= log.bedtimeTarget).length;
    const answers = logs.filter(log => !log.deleted && inWeek(log.dayKey) && log.agency1to5 !== undefined).map(log => log.agency1to5!);
    const active = done + training + nights + answers.length > 0;
    return active ? { weekKey, words: weekInWordsSummary(done, training, nights), ...(answers.length ? { agency: answers.at(-1)! } : {}) } : null;
  }).filter((row): row is PastWeek => row !== null);
}

/** You › history: the last eight weeks with anything in them, newest first. */
/** The finished weeks, live (undefined while reading). */
export function usePastWeeks(): PastWeek[] | undefined {
  const source = useLiveQuery(async () => ({ tasks: await db.tasks.toArray(), sessions: await db.sessions.toArray(), logs: await db.dailyLog.toArray() }), []);
  return source ? pastWeeks(source.tasks, source.sessions, source.logs, Date.now()) : undefined; // eslint-disable-line react-hooks/purity
}

export function PastWeeks({ weeks }: { weeks: readonly PastWeek[] }) {
  return <section className="card" aria-labelledby="history-weeks"><h2 id="history-weeks">Past weeks</h2>
    {weeks.length ? <ul className="history-list">{weeks.map(week => <li key={week.weekKey}><strong>Week of {weekInWords(week.weekKey)}</strong> · {week.words}{week.agency !== undefined ? ` Time well spent: ${week.agency}/5.` : ''}</li>)}</ul> : <p>Your weeks show here once one has finished.</p>}
  </section>;
}

/** Spec 660 §3.3: the receipt's Reality Check line (after 3 predicted quests); in the sheet only, never on the image. */
export function RealityCheckLine() {
  const facts = useLiveQuery(() => db.ledger.where('mode').equals(QUEST_MODE).toArray(), []);
  const check = facts ? realityCheck(facts.filter(row => !row.deleted)) : null;
  const line = check ? realityLine(check) : '';
  return line ? <p className="small reality-check-line">{line}</p> : null;
}
