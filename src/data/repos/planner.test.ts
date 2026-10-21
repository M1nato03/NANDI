// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { createTaskRepos } from './tasks';

let db: NandiDb;
let serial = 0;
let repos: ReturnType<typeof createTaskRepos>;
const at = (day: number, hour = 9, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();

beforeEach(() => { db = createDb(`planner-repo-${++serial}`); repos = createTaskRepos(db, 'device'); });
afterEach(async () => { await db.delete(); });

describe('planner persistence', () => {
  it('records plan, shutdown and review on their day and keeps the optional if-then', async () => {
    await repos.markRitual('planDone', at(5));
    await repos.markRitual('shutdownDone', at(5, 22), 'If in bed, charge the phone away');
    await repos.markRitual('reviewDone', at(5, 23));
    expect(await db.dailyLog.get('2026-10-05')).toMatchObject({ planDone: true, shutdownDone: true, reviewDone: true, shutdownIfThen: 'If in bed, charge the phone away', windDownAt: at(5, 22) });
  });
  it('counts the baseline without enforcement and stores the calibrated budget', async () => {
    expect(await repos.plannerBudget(at(5))).toMatchObject({ baselineStart: '2026-10-05', budget: 5 });
    for (let i = 0; i < 9; i++) await db.taskEvents.add({ id: `event-${i}`, taskId: `task-${i}`, kind: 'postponed', at: at(5, 10, i), budgetCounted: true, updatedAt: at(5), deleted: 0, deviceId: 'device' });
    const state = await repos.plannerBudget(at(12, 4));
    expect(state).toMatchObject({ budget: 6, lastWeek: '2026-10-12', countsSinceRaise: [] });
    expect((await db.settings.get('planner.budget'))?.value).toEqual(state);
  });
  it('gives a Sunday starter a full seven-day baseline before the next Monday budget', async () => {
    expect(await repos.plannerBudget(at(11, 12))).toMatchObject({ baselineStart: '2026-10-11', baselineComplete: false });
    expect((await repos.plannerBudget(at(12, 4))).baselineComplete).toBe(false);
    for (let i = 0; i < 9; i++) await db.taskEvents.add({ id: `sunday-${i}`, taskId: `task-${i}`, kind: 'postponed', at: at(13, 10, i), budgetCounted: true, updatedAt: at(13), deleted: 0, deviceId: 'device' });
    expect(await repos.plannerBudget(at(18, 4))).toMatchObject({ baselineComplete: true, budget: 6, enforcementFromWeek: '2026-10-19' });
  });
  it('moves the bedtime target after two of three early check-ins', async () => {
    await repos.recordLightsOut(at(5, 23));
    await repos.recordLightsOut(at(6, 23));
    await repos.recordLightsOut(at(7, 23));
    expect((await db.settings.get('planner.bedtime'))?.value).toBe('01:15');
    expect((await db.settings.get('planner.bedtimeDays'))?.value).toBe(0);
    expect((await db.dailyLog.get('2026-10-07'))?.lightsOutAt).toBe(at(7, 23));
  });
  it('a lights-out at 04:05 counts for the night just gone, as a late night', async () => {
    await repos.recordLightsOut(at(6, 4, 5));
    expect(await db.dailyLog.get('2026-10-06')).toBeUndefined();
    const night = await db.dailyLog.get('2026-10-05');
    expect(night?.lightsOutAt).toBe(at(6, 4, 5));
    expect(night!.bedtimeTarget!).toBeLessThan(at(6, 4, 5));
    expect((await db.ledger.get('lightsout:2026-10-05'))?.inputs.metTarget).toBe(false);
  });
  it('counts a missing night in the three-night bedtime window', async () => {
    await repos.recordLightsOut(at(5, 23));
    await repos.recordLightsOut(at(7, 23));
    expect((await db.settings.get('planner.bedtime'))?.value).toBe('01:15');
  });
  it('offers a season step-down only once after four under-budget weeks', async () => {
    await repos.plannerBudget(at(5));
    for (let i = 0; i < 13; i++) await db.taskEvents.add({ id: `baseline-${i}`, taskId: `task-${i}`, kind: 'postponed', at: at(5, 10, i), budgetCounted: true, updatedAt: at(5), deleted: 0, deviceId: 'device' });
    const seasonStart = new Date(2026, 10, 2, 9).getTime();
    expect((await repos.plannerBudget(seasonStart)).budget).toBe(9);
    expect((await repos.lowerBudget(seasonStart)).budget).toBe(8);
    await expect(repos.lowerBudget(seasonStart)).rejects.toThrow('No budget adjustment');
  });
});
