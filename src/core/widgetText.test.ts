import { expect, it } from 'vitest';
import type { SettingRow, TaskRow } from '../data/types';
import { buildWidgetText } from './widgetText';

const now = new Date(2026, 9, 17, 12).getTime();
const task = (id: string, title: string, extra: Partial<TaskRow> = {}): TaskRow => ({
  id, title, status: 'planned', dayKey: '2026-10-17', deleted: 0, updatedAt: now, ...extra,
} as TaskRow);
const setting = (key: string, value: unknown): SettingRow => ({ key, value, deleted: 0, updatedAt: now } as SettingRow);

it('shows the next planned title and counts visible tasks completed today', () => {
  const rows = [
    task('later', '  Write the project outline  ', { scheduledStart: now + 1000 }),
    task('first', 'Read notes', { scheduledStart: now }),
    task('done', 'Draft title', { status: 'done', doneAt: now }),
    task('old', 'Old task', { status: 'done', doneAt: now - 86_400_000, dayKey: '2026-10-16' }),
  ];
  const result = buildWidgetText(rows, [], now);
  expect(result.dayTitle).toBe('Now · Read notes');
  expect(result.daySubtitle).toBe('1 of 3 done today');
  expect(result.nightSubtitle).toBe('Six calm cards, then phone down.');
  expect(result.shutdownMinutes).toBe(23 * 60 + 15);
});

it('trims long titles and uses only the saved if-then plan for night text', () => {
  const result = buildWidgetText(
    [task('one', '  A very long task title that exceeds forty characters today  ')],
    [setting('night.plan', { cue: 'reach for the phone', action: 'read five pages' }), setting('planner.shutdown', '22:40')],
    now,
  );
  expect(result.dayTitle.length).toBeLessThanOrEqual(40);
  expect(result.dayTitle).toMatch(/^Now · A very long task title/);
  expect(result.nightSubtitle).toBe('If I reach for the phone, then I read five pages.');
  expect(result.shutdownMinutes).toBe(22 * 60 + 40);
});
