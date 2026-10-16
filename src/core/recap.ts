import { dayKey } from './time/dayKey';
import { nightsBackOnPlan } from './nightPlan';
import { focusElapsedMs } from './tasks/focus';
import type { DailyLogRow, FocusRow, LearnConceptRow, QuestRow, SessionRow, TaskRow } from '../data/types';

export type RecapSources = { tasks: TaskRow[]; focus: FocusRow[]; sessions: SessionRow[]; quests: QuestRow[]; concepts: LearnConceptRow[]; logs: DailyLogRow[] };
export type WeeklyRecapData = { from: string; to: string; tasks: number; focusHours: number; workouts: number; sideQuests: number; concepts: number; nights: number };

function localKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The latest complete week starts on the previous Monday at 04:00 local time. */
export function recapWindow(now: number): { from: string; to: string; start: number; end: number } {
  const planningDay = new Date(`${dayKey(now)}T12:00:00`);
  planningDay.setDate(planningDay.getDate() - ((planningDay.getDay() + 6) % 7));
  const currentMonday = localKey(planningDay);
  planningDay.setDate(planningDay.getDate() - 7);
  const previousMonday = localKey(planningDay);
  return { from: previousMonday, to: currentMonday, start: new Date(`${previousMonday}T04:00:00`).getTime(), end: new Date(`${currentMonday}T04:00:00`).getTime() };
}

export function buildRecap(now: number, source: RecapSources): WeeklyRecapData {
  const { from, to, start, end } = recapWindow(now);
  const inside = (at?: number) => at != null && at >= start && at < end;
  const focusMs = source.focus.filter(row => !row.deleted).reduce((total, row) => {
    const until = row.endedAt ?? start;
    if (until <= start || row.startedAt >= end) return total;
    const running = { ...row, endedAt: undefined };
    return total + Math.max(0, focusElapsedMs(running, Math.min(end, until)) - focusElapsedMs(running, Math.max(start, row.startedAt)));
  }, 0);
  return {
    from, to,
    tasks: source.tasks.filter(row => !row.deleted && inside(row.doneAt)).length,
    focusHours: Math.round(focusMs / 3_600_000 * 10) / 10,
    workouts: source.sessions.filter(row => !row.deleted && ['completed', 'minimum', 'partial'].includes(row.status) && inside(row.endedAt)).length,
    sideQuests: source.quests.filter(row => !row.deleted && row.status === 'done' && inside(row.updatedAt)).length,
    concepts: source.concepts.filter(row => !row.deleted && inside(row.firstLearnedAt)).length,
    nights: nightsBackOnPlan(source.logs.filter(row => row.dayKey >= from && row.dayKey < to)),
  };
}
