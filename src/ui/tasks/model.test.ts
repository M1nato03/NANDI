import { describe, expect, it } from 'vitest';
import type { FocusRow, TaskRow } from '../../data/types';
import { currentFocus, elapsed, minutes, splitEstimates, todayTasks, visibleTasks } from './model';

const now = new Date(2026, 9, 11, 12).getTime();
const task = (id: string, fields: Partial<TaskRow> = {}): TaskRow => ({
  id, title: id, status: 'planned', dayKey: '2026-10-11', scheduledStart: now,
  updatedAt: now, deleted: 0, deviceId: 'test', ...fields,
});
const focus = (id: string, fields: Partial<FocusRow> = {}): FocusRow => ({
  id, taskId: 'a', startedAt: now, updatedAt: now, deleted: 0, deviceId: 'test', ...fields,
});

describe('task view model', () => {
  it('shows split children instead of their container and sorts today by slot', () => {
    const rows = [task('late', { scheduledStart: now + 60_000 }), task('parent'), task('child', { parentId: 'parent' }), task('early', { scheduledStart: now - 60_000 }), task('other', { dayKey: '2026-10-12' })];
    expect(visibleTasks(rows).map((row) => row.id)).not.toContain('parent');
    expect(todayTasks(rows, now).map((row) => row.id)).toEqual(['early', 'child', 'late']);
  });
  it('selects the running focus and recomputes elapsed from absolute timestamps', () => {
    const paused = focus('paused', { startedAt: now + 1000, pauses: [{ at: now + 2000 }] });
    const running = focus('running', { pauses: [{ at: now + 10_000, resumeAt: now + 20_000 }] });
    expect(currentFocus([paused, running])?.id).toBe('running');
    expect(elapsed(running, now + 80_000)).toBe(70_000);
    expect(minutes(70_000)).toBe('1:10');
  });
  it('finds valid creation splits without changing the total estimate', () => {
    expect(splitEstimates(100)).toEqual([50, 50]);
    expect(splitEstimates(180)).toEqual([60, 60, 60]);
    expect(splitEstimates(20)).toBeNull();
  });
});
