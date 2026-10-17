import { describe, expect, it } from 'vitest';
import { wantedNudges, NUDGE_MORNING_ON, NUDGE_MORNING_TIME, NUDGE_NIGHT_ON } from './nudges';
import type { SettingRow, TaskRow } from '../data/types';

const now = new Date(2026, 9, 16, 8, 0).getTime();
const meta = { deleted: 0 as const, updatedAt: now, deviceId: 'test' };
const setting = (key: string, value: unknown): SettingRow => ({ key, value, ...meta });
const task: TaskRow = { id: 'read', title: 'Read first page', status: 'planned', dayKey: '2026-10-16', estimateMin: 25, ...meta };
const wanted = (settings: SettingRow[] = [], extras: Partial<Parameters<typeof wantedNudges>[0]> = {}) =>
  wantedNudges({ now, settings, tasks: [task], logs: [], ...extras });

describe('daily nudges', () => {
  it('uses local morning and shutdown times, plan text, and first task', () => {
    const rows = wanted([setting(NUDGE_MORNING_TIME, '09:20'), setting('night.plan', { cue: 'reach for Reels at night', action: 'open my night deck' })]);
    expect(rows.filter(row => row.id === 'nudge:morning:2026-10-16')).toEqual([expect.objectContaining({
      at: new Date(2026, 9, 16, 9, 20).getTime(), title: "Today's first step", body: 'Read first page · 25 min',
    })]);
    expect(rows.find(row => row.id === 'nudge:night:2026-10-16')).toEqual(expect.objectContaining({
      at: new Date(2026, 9, 16, 23, 15).getTime(), title: 'Your night deck is ready',
      body: 'If I reach for Reels at night, then I open my night deck.',
    }));
    expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
  });
  it('skips night after lights-out or an opening in the last 15 minutes', () => {
    expect(wanted([], { logs: [{ dayKey: '2026-10-16', lightsOutAt: now, ...meta }] }).some(row => row.id === 'nudge:night:2026-10-16')).toBe(false);
    expect(wanted([], { lastOpenedAt: new Date(2026, 9, 16, 23, 1).getTime() }).some(row => row.id === 'nudge:night:2026-10-16')).toBe(false);
    expect(wanted([], { lastOpenedAt: new Date(2026, 9, 16, 22, 59).getTime() }).some(row => row.id === 'nudge:night:2026-10-16')).toBe(true);
  });
  it('counts morning against the two engagement slots and honors both switches', () => {
    const full = [{ kind: 'planning' as const, at: new Date(2026, 9, 16, 9).getTime() }, { kind: 'streak' as const, at: new Date(2026, 9, 16, 20).getTime() }];
    const rows = wanted([], { scheduledEngagement: full });
    expect(rows.some(row => row.id === 'nudge:morning:2026-10-16')).toBe(false);
    expect(rows.some(row => row.id === 'nudge:night:2026-10-16')).toBe(true);
    expect(wanted([setting(NUDGE_NIGHT_ON, false), setting(NUDGE_MORNING_ON, false)])).toEqual([]);
  });
  it('uses the fallback morning message when no task is set', () => {
    expect(wanted([], { tasks: [] }).find(row => row.id === 'nudge:morning:2026-10-16')?.body).toBe('Pick one small step for today.');
  });
});
