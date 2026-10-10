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

export function splitEstimates(total: number): number[] | null {
  for (let count = 2; count <= Math.ceil(total / 25); count++) {
    const base = Math.floor(total / count);
    const parts = Array.from({ length: count }, (_, index) => base + (index < total % count ? 1 : 0));
    if (parts.every((part) => part >= 25 && part <= 60)) return parts;
  }
  return null;
}
