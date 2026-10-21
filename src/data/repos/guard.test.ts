// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { addAppMinutes, anyTimerRunning, recordAgency } from './guard';
import { agencyAnsweredRecently, foregroundSlice, FOREGROUND_SLICE_MAX_MS, logHasActivity, timerRunning, TIMER_STALE_MS } from '../../core/guard';
import * as v from 'valibot';
import { buildWeeklySummary, weeklySummarySchema } from '../../core/weeklySummary';
import type { DailyLogRow, FocusRow, SessionRow } from '../types';

let serial = 0;
const opened: NandiDb[] = [];
function fresh() { const db = createDb(`guard-test-${++serial}`); opened.push(db); return db; }
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const now = new Date('2026-10-21T12:00:00').getTime();
const meta = { updatedAt: now, deleted: 0 as const, deviceId: 'test' };

describe('guard metric: foreground minutes', () => {
  it('caps one tick so a sleeping phone adds nothing', () => {
    expect(foregroundSlice(now - 15_000, now)).toBe(15_000);
    expect(foregroundSlice(now - 3_600_000, now)).toBe(FOREGROUND_SLICE_MAX_MS);
    expect(foregroundSlice(now + 5_000, now)).toBe(0);
  });

  it('leaves out time while a focus or workout timer runs, but not a forgotten one', () => {
    const focus = (startedAt: number, endedAt?: number): FocusRow => ({ ...meta, id: `f${startedAt}`, taskId: 't', startedAt, ...(endedAt ? { endedAt } : {}) });
    const session = (status: SessionRow['status'], startedAt: number): SessionRow => ({ ...meta, id: `s${startedAt}`, dayKey: '2026-10-21', status, startedAt });
    expect(timerRunning([focus(now - 60_000)], [], now)).toBe(true);
    expect(timerRunning([focus(now - 60_000, now - 1_000)], [], now)).toBe(false);
    expect(timerRunning([focus(now - TIMER_STALE_MS - 1)], [], now)).toBe(false);
    expect(timerRunning([], [session('active', now - 600_000)], now)).toBe(true);
    expect(timerRunning([], [session('completed', now - 600_000)], now)).toBe(false);
  });

  it('adds whole minutes to the day, keeps the rest of the row, and reaches the weekly summary', async () => {
    const db = fresh();
    await db.dailyLog.put({ ...meta, dayKey: '2026-10-21', planDone: true });
    await addAppMinutes(db, '2026-10-21', 3, now);
    await addAppMinutes(db, '2026-10-21', 2, now);
    await addAppMinutes(db, '2026-10-21', 0, now);
    const row = await db.dailyLog.get('2026-10-21');
    expect(row).toMatchObject({ appMinutes: 5, planDone: true });
    await recordAgency(db, now, { score: 4, openedInstead: true });
    const logs = await db.dailyLog.toArray();
    const summary = buildWeeklySummary('2026-10-19', { tasks: [], events: [], focus: [], logs, sessions: [], prs: [], programs: [], puzzleRuns: [], lessonProg: [], plans: [], flags: [], ledger: [], quests: [], settings: [], exState: [] }, 6);
    expect(v.safeParse(weeklySummarySchema, summary).success).toBe(true);
    expect(summary.guard.appMinutesExclTimers).toBe(5);
    expect(summary.life).toMatchObject({ agencyScore: 4, openedInsteadOfTask: true });
  });

  it('a row that only counts minutes is not history for the first-run check', () => {
    expect(logHasActivity({ ...meta, dayKey: '2026-10-21', appMinutes: 4 })).toBe(false);
    expect(logHasActivity({ ...meta, dayKey: '2026-10-21', appMinutes: 4, planDone: true })).toBe(true);
  });

  it('reads running timers from the database', async () => {
    const db = fresh();
    expect(await anyTimerRunning(db, now)).toBe(false);
    await db.focus.put({ ...meta, id: 'f1', taskId: 't', startedAt: now - 60_000 });
    expect(await anyTimerRunning(db, now)).toBe(true);
  });
});

describe('weekly agency check', () => {
  it('saves both answers on today, keeps other fields, and rejects scores outside 1–5', async () => {
    const db = fresh();
    await db.dailyLog.put({ ...meta, dayKey: '2026-10-21', appMinutes: 7 });
    await recordAgency(db, now, { score: 4 });
    await recordAgency(db, now, { openedInstead: false });
    expect(await db.dailyLog.get('2026-10-21')).toMatchObject({ appMinutes: 7, agency1to5: 4, agencyOpenedInstead: false });
    await expect(recordAgency(db, now, { score: 6 })).rejects.toThrow();
    await expect(recordAgency(db, now, { score: 2.5 })).rejects.toThrow();
  });

  it('counts as answered for seven days, then asks again', () => {
    const log = (dayKey: string): DailyLogRow => ({ ...meta, dayKey, agency1to5: 3 });
    expect(agencyAnsweredRecently([log('2026-10-18')], '2026-10-24')).toBe(true);
    expect(agencyAnsweredRecently([log('2026-10-18')], '2026-10-25')).toBe(false);
    expect(agencyAnsweredRecently([{ ...log('2026-10-20'), deleted: 1 }], '2026-10-21')).toBe(false);
  });
});
