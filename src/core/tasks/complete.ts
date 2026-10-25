import type { DailyLogRow, FocusRow, TaskRow } from '../../data/types';
import { RULES } from '../rules.config';
import { dayKey } from '../time/dayKey';
import { focusElapsedMs } from './focus';

const dayAt = (key: string) => new Date(`${key}T12:00:00`).getTime();
const shift = (key: string, days: number) => dayKey(dayAt(key) + days * 86_400_000);
export function needsFreshStart(tasks: TaskRow[], logs: DailyLogRow[], today: string): boolean {
  const yesterday = shift(today, -1);
  const planned = tasks.filter(task => !task.deleted && (task.lastPlannedDayKey === yesterday || task.dayKey === yesterday || task.firstScheduledDayKey === yesterday) && (task.lastPlannedDayKey || task.firstScheduledDayKey));
  return planned.length > 0 && !planned.some(task => task.status === 'done' && task.doneAt != null && dayKey(task.doneAt) === yesterday) && !logs.some(log => log.dayKey === yesterday && log.shutdownDone);
}

export function chooseNowTask(tasks: TaskRow[], focus: FocusRow[], now: number): TaskRow | undefined {
  // One pass for the parents (this ran for every open task against every task: quadratic, about 27 ms a call
  // at a year of tasks, re-run on each Plan render; cj2 heavy data #1).
  const parents = new Set(tasks.filter(child => !child.deleted && child.parentId).map(child => child.parentId));
  const today = dayKey(now);
  const open = tasks.filter(task => !task.deleted && task.status !== 'done' && task.status !== 'dropped' && !parents.has(task.id));
  const live = open.filter(task => task.status === 'planned' && task.dayKey === today);
  const active = focus.filter(row => !row.deleted && row.endedAt == null).sort((a, b) => b.startedAt - a.startedAt);
  // A focus holds the Now card only while its task still belongs to today (item 83: a task moved to tomorrow mid-focus).
  const focused = active.map(row => open.find(task => task.id === row.taskId && task.dayKey === today && (task.status === 'planned' || task.status === 'unplaced'))).find(Boolean);
  return focused ?? live.sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0))[0] ?? open.find(task => task.status === 'unplaced' && task.mustOrCould === 'must' && task.dayKey === today);
}

export function calibration(tasks: TaskRow[], focus: FocusRow[], category: string): { ratio: number; samples: number } | null {
  const matching = tasks.filter(task => !task.deleted && task.status === 'done' && (task.category || 'general') === category && (task.estimateMin ?? 0) > 0);
  let actual = 0, estimated = 0, samples = 0;
  for (const task of matching) {
    const rows = focus.filter(row => !row.deleted && row.taskId === task.id && row.endedAt != null);
    if (!rows.length) continue;
    actual += rows.reduce((sum, row) => sum + focusElapsedMs(row, row.endedAt!), 0) / 60_000;
    estimated += task.estimateMin!;
    samples++;
  }
  return samples >= RULES.tasks.calibrationMinSamples && estimated > 0 ? { ratio: Math.round(actual / estimated * 10) / 10, samples } : null;
}
export function calibratedMinutes(estimate: number, ratio: number): number { return Math.min(RULES.tasks.maxEstimateMin, Math.max(1, Math.round(estimate * ratio))); }
export function validReward(value: string): boolean {
  const text = value.trim().toLowerCase();
  return !!text && !RULES.tasks.rewardBlockedWords.some(word => new RegExp(`(^|[^a-z0-9])${word.replace('.', '\\.')}($|[^a-z0-9])`, 'i').test(text));
}
export function steadyLine(tasks: TaskRow[], focus: FocusRow[], today: string): string {
  const days = new Set(Array.from({ length: 7 }, (_, i) => shift(today, -i)));
  const planned = new Set(tasks.flatMap(task => !task.deleted ? [task.firstScheduledDayKey, task.lastPlannedDayKey, task.status === 'planned' || task.status === 'done' ? task.dayKey : undefined].filter((key): key is string => !!key && days.has(key)) : [])).size;
  const date = new Date(`${today}T12:00:00`);
  const monday = shift(today, -((date.getDay() + 6) % 7));
  const minutes = Math.round(focus.filter(row => !row.deleted && row.endedAt != null && dayKey(row.startedAt) >= monday && dayKey(row.startedAt) <= today).reduce((sum, row) => sum + focusElapsedMs(row, row.endedAt!), 0) / 60_000);
  return `Planned ${planned} of the last 7 days · ${minutes} focus min this week`;
}
export type Checkpoint = { title: string; scheduledStart: number; estimateMin: number };
export function proposeCheckpoints(task: TaskRow, now: number): Checkpoint[] {
  const due = task.scheduledStart;
  if (!due || dayAt(dayKey(due)) - dayAt(dayKey(now)) < 3 * 86_400_000) return [];
  const days = Math.round((dayAt(dayKey(due)) - dayAt(dayKey(now))) / 86_400_000);
  const count = days >= 8 ? 4 : 3;
  return Array.from({ length: count }, (_, i) => ({ title: `${task.title} · checkpoint ${i + 1}`, scheduledStart: now + Math.round((due - now) * (i + 1) / (count + 1)), estimateMin: Math.min(RULES.tasks.maxEstimateMin, Math.max(15, Math.round((task.estimateMin ?? 30) / count))) }));
}
export function respaceCheckpoints(remaining: TaskRow[], movedAt: number, dueAt: number): { id: string; scheduledStart: number }[] {
  const ordered = remaining.filter(task => task.status === 'planned').sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
  const span = dueAt - movedAt;
  if (span <= 0) return [];
  return ordered.map((task, index) => ({ id: task.id, scheduledStart: movedAt + Math.round(span * (index + 1) / (ordered.length + 1)) }));
}
