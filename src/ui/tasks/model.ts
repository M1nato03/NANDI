import type { FocusRow, TaskRow } from '../../data/types';
import { dayKey } from '../../core/time/dayKey';
import { focusElapsedMs, isFocusRunning } from '../../core/tasks/focus';

export function visibleTasks(rows: TaskRow[]): TaskRow[] {
  const parents = new Set(rows.filter((row) => row.parentId).map((row) => row.parentId));
  return rows.filter((row) => row.deleted === 0 && !parents.has(row.id));
}

export function todayTasks(rows: TaskRow[], now: number): TaskRow[] {
  const key = dayKey(now);
  return visibleTasks(rows).filter((row) => row.status === 'planned' && row.dayKey === key)
    .sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
}

export function currentFocus(rows: FocusRow[]): FocusRow | undefined {
  return rows.filter((row) => row.deleted === 0 && row.endedAt == null)
    .sort((a, b) => b.startedAt - a.startedAt)
    .find(isFocusRunning) ?? rows.filter((row) => row.deleted === 0 && row.endedAt == null)
      .sort((a, b) => b.startedAt - a.startedAt)[0];
}

export function minutes(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function elapsed(focus: FocusRow, now: number): number {
  return focusElapsedMs(focus, now);
}

export function localDateTime(value: number): string {
  const date = new Date(value);
  const part = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`;
}

export function defaultSlot(now: number): string {
  const date = new Date(now + 3_600_000);
  date.setMinutes(0, 0, 0);
  return localDateTime(dayKey(date.getTime()) === dayKey(now) ? date.getTime() : now);
}

export function splitEstimates(total: number, chosenCount?: number): number[] | null {
  if (!Number.isInteger(total) || total <= 0) return null;
  const counts = chosenCount == null ? Array.from({ length: Math.floor(total / 25) - 1 }, (_, i) => i + 2) : [chosenCount];
  for (const count of counts) {
    if (!Number.isInteger(count) || count < 2) continue;
    const base = Math.floor(total / count);
    const parts = Array.from({ length: count }, (_, index) => base + (index < total % count ? 1 : 0));
    if (parts.every((part) => part >= 25 && part <= 60)) return parts;
  }
  return null;
}

export type SplitPlacement = 'today' | 'unplaced' | 'someday';
export type PreviewStep = { title: string; estimateMin: number; mustOrCould: 'must' | 'could'; status: 'planned' | 'unplaced' | 'someday'; scheduledStart?: number };
export function splitPreview(title: string, total: number, priority: 'must' | 'could', placement: SplitPlacement, scheduledStart?: number, count?: number): { title: string; steps: PreviewStep[] } | null {
  const estimates = splitEstimates(total, count);
  if (!estimates || !title.trim() || (placement === 'today' && !Number.isFinite(scheduledStart))) return null;
  return { title: title.trim(), steps: estimates.map((estimateMin, index) => ({
    title: `${title.trim()} — step ${index + 1} of ${estimates.length}`,
    estimateMin, mustOrCould: priority,
    status: placement === 'someday' ? 'someday' : placement === 'today' && index === 0 ? 'planned' : 'unplaced',
    scheduledStart: placement === 'today' && index === 0 ? scheduledStart : undefined,
  })) };
}

export type TaskGroup = { parent: TaskRow; steps: TaskRow[]; done: number; total: number; placement: string; dayKey: string; scheduledStart?: number | null };
export function taskGroups(rows: TaskRow[]): TaskGroup[] {
  const live = rows.filter((row) => row.deleted === 0);
  const children = new Map<string, TaskRow[]>();
  for (const row of live) if (row.parentId) children.set(row.parentId, [...(children.get(row.parentId) ?? []), row]);
  return live.filter((row) => !row.parentId).map((parent) => {
    const steps = children.get(parent.id) ?? [];
    const active = steps.find((step) => step.status === 'planned') ?? steps.find((step) => step.status === 'unplaced') ?? steps.find((step) => step.status === 'someday');
    return { parent, steps, done: steps.filter((step) => step.status === 'done').length, total: steps.length, placement: active?.status ?? parent.status, dayKey: active?.dayKey ?? parent.dayKey, scheduledStart: active?.scheduledStart ?? parent.scheduledStart };
  });
}

/**
 * A step's own name wins. Under its task, an unnamed step (the split's default name, an empty name or the task's
 * own name) reads 'Step 1 of 3', not the task's name again (item 139).
 */
export function stepLabel(group: TaskGroup, task: TaskRow): string {
  const parent = group.parent.title.trim(), title = task.title.trim();
  const fallback = `Step ${group.steps.findIndex(step => step.id === task.id) + 1} of ${group.total}`;
  if (!title || title === parent) return fallback;
  return /^step \d+ of \d+$/i.test(title.slice(parent.length + 3)) && title.startsWith(`${parent} — `) ? fallback : task.title;
}
