import { describe, expect, it } from 'vitest';
import type { FocusRow, TaskRow } from '../../data/types';
import { currentFocus, defaultSlot, elapsed, minutes, splitEstimates, splitPreview, taskGroups, todayTasks, visibleTasks } from './model';
import { dayKey } from '../../core/time/dayKey';

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
  it('previews 500 minutes as nine named steps and keeps priority and placement', () => {
    const preview = splitPreview('Big work', 500, 'must', 'today', now);
    expect(preview?.steps).toHaveLength(9);
    expect(preview?.steps.map((step) => step.estimateMin).reduce((a, b) => a + b, 0)).toBe(500);
    expect(preview?.steps.every((step) => step.estimateMin >= 25 && step.estimateMin <= 60 && step.mustOrCould === 'must')).toBe(true);
    expect(preview?.steps[0]).toMatchObject({ title: 'Big work — step 1 of 9', scheduledStart: now, status: 'planned' });
    expect(preview?.steps.slice(1).every((step) => step.status === 'unplaced' && step.scheduledStart == null)).toBe(true);
    expect(splitPreview('Big work', 500, 'could', 'someday')?.steps.every((step) => step.status === 'someday' && step.mustOrCould === 'could')).toBe(true);
    expect(splitPreview('Big work', 500, 'could', 'unplaced')?.steps.every((step) => step.status === 'unplaced')).toBe(true);
    expect(splitEstimates(500, 8)).toBeNull();
    expect(splitEstimates(500, 20)?.every((part) => part === 25)).toBe(true);
  });
  it('groups a split under one parent and counts completed steps', () => {
    const rows = [task('parent', { title: 'Big work' }), task('a', { parentId: 'parent', status: 'done' }), task('b', { parentId: 'parent', status: 'unplaced' })];
    expect(taskGroups(rows)).toMatchObject([{ parent: { id: 'parent' }, done: 1, total: 2 }]);
  });
  it('keeps the default Today slot in the current planning day near 04:00', () => {
    const beforeBoundary = new Date(2026, 9, 11, 3, 15).getTime();
    const slot = new Date(defaultSlot(beforeBoundary)).getTime();
    expect(dayKey(slot)).toBe(dayKey(beforeBoundary));
    expect(slot).toBe(beforeBoundary);
  });
});
