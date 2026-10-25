// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { dayKey } from '../../core/time/dayKey';
import { createTaskRepos } from './tasks';

let serial = 0;
let taskSerial = 0;
let db: NandiDb;
let repos: ReturnType<typeof createTaskRepos>;
const at = (day: number, hour = 9) => new Date(2026, 9, day, hour).getTime();

beforeEach(() => {
  db = createDb(`tasks-repo-${++serial}`);
  taskSerial = 0;
  repos = createTaskRepos(db, 'test-device');
});
afterEach(async () => {
  await db.delete();
});

async function task(start?: number) {
  return repos.createTask(
    {
      title: 'Work',
      size: 'L',
      estimateMin: 90,
      plannedSize: 'L',
      dayKey: dayKey(start ?? at(4)),
      scheduledStart: start,
      id: `task-${++taskSerial}`,
    },
    at(4),
  );
}

describe('Tasks repository transactions', () => {
  it('records one lights-out fact with its daily log', async () => {
    await repos.recordLightsOut(at(5, 1));
    await repos.recordLightsOut(at(5, 1));
    const key = dayKey(at(5, 1));
    expect(await db.dailyLog.get(key)).toMatchObject({ lightsOutAt: at(5, 1) });
    expect(await db.ledger.get(`lightsout:${key}`)).toMatchObject({ dayKey: key, mode: 'bonuses', kind: 'lightsout', inputs: { metTarget: true } });
    expect(await db.ledger.count()).toBe(1);
  });
  it('judges lights-out against the busy-day bedtime the app showed (Night audit)', async () => {
    // Lights out at 02:00 against the default 01:30 bedtime: late on a normal day...
    await repos.recordLightsOut(at(6, 2));
    expect((await db.ledger.get(`lightsout:${dayKey(at(6, 2))}`))?.inputs.metTarget).toBe(false);
    // ...but on time when 6 h were planned that day, which moved tonight 60 min later.
    for (const hour of [9, 11, 13, 15]) await task(at(7, hour));
    await repos.recordLightsOut(at(8, 2));
    expect((await db.ledger.get(`lightsout:${dayKey(at(8, 2))}`))?.inputs.metTarget).toBe(true);
  });
  it('rolls back the lights-out log if its award fact fails', async () => {
    db.ledger.hook('creating', () => { throw new Error('ledger failed'); });
    await expect(repos.recordLightsOut(at(5, 1))).rejects.toThrow('ledger failed');
    expect(await db.dailyLog.get(dayKey(at(5, 1)))).toBeUndefined();
  });
  it('creates task and event, and refuses an unsplit estimate over 90 minutes', async () => {
    const created = await task();
    expect(created).toMatchObject({ status: 'unplaced', postponeCount: 0 });
    expect(await db.taskEvents.where('taskId').equals(created.id).count()).toBe(
      1,
    );
    await expect(
      repos.createTask(
        {
          title: 'Too large',
          size: 'L',
          estimateMin: 91,
          dayKey: dayKey(at(4)),
        },
        at(4),
      ),
    ).rejects.toThrow();
    expect(await db.tasks.count()).toBe(1);
  });

  it('rejects a fourth Must atomically', async () => {
    for (let i = 0; i < 3; i++)
      await repos.createTask(
        {
          title: `Must ${i}`,
          size: 'S',
          estimateMin: 10,
          dayKey: dayKey(at(4)),
          mustOrCould: 'must',
          scheduledStart: at(4),
        },
        at(4) + i,
      );
    await expect(
      repos.createTask(
        {
          title: 'Fourth',
          size: 'S',
          estimateMin: 10,
          dayKey: dayKey(at(4)),
          mustOrCould: 'must',
          scheduledStart: at(4),
        },
        at(4) + 5,
      ),
    ).rejects.toThrow(/Could/);
    expect(await db.tasks.count()).toBe(3);
    expect(await db.taskEvents.count()).toBe(3);
  });

  it('moving a task off today ends its running focus with the minutes kept; a same-day move keeps it running (item 83)', async () => {
    const created = await task(at(4, 10));
    const running = await repos.startFocus(created.id, at(4, 10));
    await repos.postpone(created.id, at(4, 10) + 5 * 60_000, { newStart: at(4, 16) });
    expect((await db.focus.get(running.id))?.endedAt).toBeUndefined();
    await repos.postpone(created.id, at(4, 10) + 10 * 60_000, { newStart: at(5, 9), firstStep: 'Open the file' });
    const ended = await db.focus.get(running.id);
    expect(ended?.endedAt).toBe(at(4, 10) + 10 * 60_000);
  });
  it("spec 27: Mor's list adds a planned Today task with no time, and moves are never refused", async () => {
    const added = await repos.addToList('Call the bank', at(4, 10));
    expect(added).toMatchObject({ status: 'planned', dayKey: dayKey(at(4)), scheduledStart: null, timeSet: undefined, estimateMin: 30, firstScheduledDayKey: dayKey(at(4)) });
    const timed = await repos.addToList('Read', at(4, 10), 15);
    expect(timed).toMatchObject({ timeSet: true, estimateMin: 15, size: 'S' });
    // Five moves to tomorrow in a row, no first step, no reason: each one goes through, and none parks it in Someday.
    let day = 4;
    for (let move = 1; move <= 5; move++) {
      await repos.moveTask(added.id, at(day, 11), 'tomorrow');
      day++;
      const row = await db.tasks.get(added.id);
      expect(row).toMatchObject({ status: 'planned', dayKey: dayKey(at(day)), postponeCount: move });
    }
    const before = await repos.moveTask(added.id, at(day, 12), 'later');
    expect(await db.tasks.get(added.id)).toMatchObject({ status: 'someday', postponeCount: 6 });
    await repos.undoMove(added.id, at(day, 12), before);
    expect(await db.tasks.get(added.id)).toMatchObject({ status: 'planned', dayKey: dayKey(at(day)), postponeCount: 5 });
    // Bringing it back to today is not counted as a move.
    await repos.moveTask(added.id, at(day, 13), 'later');
    await repos.moveTask(added.id, at(day, 14), 'today');
    expect(await db.tasks.get(added.id)).toMatchObject({ status: 'planned', dayKey: dayKey(at(day)), postponeCount: 6 });
  });
  it('spec 27: ending a focus adds the minutes worked to the task, across sessions', async () => {
    const added = await repos.addToList('Write', at(4, 10));
    const first = await repos.startFocus(added.id, at(4, 10));
    await repos.finishFocus(first.id, at(4, 10) + 12 * 60_000);
    const second = await repos.startFocus(added.id, at(4, 11));
    await repos.finishFocus(second.id, at(4, 11) + 30 * 60_000);
    expect((await db.tasks.get(added.id))?.actualMinutes).toBe(42);
    // Moving a task in focus stops its timer and keeps the minutes.
    const third = await repos.startFocus(added.id, at(4, 12));
    await repos.moveTask(added.id, at(4, 12) + 5 * 60_000, 'tomorrow');
    expect((await db.focus.get(third.id))?.endedAt).toBe(at(4, 12) + 5 * 60_000);
    expect((await db.tasks.get(added.id))?.actualMinutes).toBe(47);
  });
  it('guards postpone choices within the transaction and does not write on rejection', async () => {
    const created = await task(at(4, 10));
    await expect(
      repos.postpone(created.id, at(4), { newStart: null }),
    ).rejects.toThrow('missing_date_time');
    expect((await db.tasks.get(created.id))?.postponeCount).toBe(0);
    expect(await db.taskEvents.count()).toBe(1);
    const moved = await repos.postpone(created.id, at(4), {
      newStart: at(5, 10),
    });
    expect(moved.postponeCount).toBe(1);
    expect(moved.firstScheduledDayKey).toBe(dayKey(at(4)));
    expect(
      (await db.taskEvents.where('taskId').equals(created.id).toArray())
        .map((e) => e.kind)
        .sort(),
    ).toEqual(['created', 'postponed']);
  });

  it('repeated completion taps write one done event and one idempotent fact', async () => {
    const created = await task(at(4, 10));
    const first = await repos.completeTask(created.id, at(4, 11));
    const again = await repos.completeTask(created.id, at(4, 12));
    expect(again).toEqual(first);
    expect(
      (await db.taskEvents.where('taskId').equals(created.id).toArray()).filter(
        (e) => e.kind === 'done',
      ),
    ).toHaveLength(1);
    expect(await db.ledger.toArray()).toMatchObject([
      { id: `done:${created.id}`, kind: 'done', refId: created.id },
    ]);
  });

  it('Clutch completion stamps the fact without changing its id', async () => {
    const created = await task(at(4, 10));
    await db.tasks.update(created.id, { postponeCount: 2 });
    await repos.completeTask(created.id, at(5, 11));
    expect(await db.ledger.get(`done:${created.id}`)).toMatchObject({
      inputs: { clutchStamp: true, postpones: 2, isFirstDay: false },
    });
  });

  it('one live focus timer pauses the old one and repeated Start does not duplicate it', async () => {
    const a = await task();
    const b = await task();
    const focusA = await repos.startFocus(a.id, at(4));
    expect((await repos.startFocus(a.id, at(4, 10))).id).toBe(focusA.id);
    await repos.startFocus(b.id, at(4, 11));
    expect(await db.focus.count()).toBe(2);
    expect(await db.focus.get(focusA.id)).toMatchObject({
      switches: 1,
      pauses: [{ at: at(4, 11) }],
    });
    expect(
      (await db.taskEvents.toArray()).filter((e) => e.kind === 'switched'),
    ).toHaveLength(1);
  });

  it('Do 10 min now starts focus without counting a postpone', async () => {
    const created = await task(at(4, 10));
    await db.tasks.update(created.id, {
      postponeCount: 2,
      firstStep: 'Open notes',
    });
    await repos.postpone(created.id, at(4, 11), {
      newStart: null,
      choice: 'do10',
    });
    expect((await db.tasks.get(created.id))?.postponeCount).toBe(2);
    expect((await db.focus.toArray()).map((f) => f.taskId)).toEqual([
      created.id,
    ]);
    expect(
      (await db.taskEvents.toArray()).filter((e) => e.kind === 'postponed'),
    ).toHaveLength(0);
  });

  it('reconcile unplaces at 04:00 and retires only old Unplaced tasks', async () => {
    const old = await task(at(4, 10));
    const future = await task(at(25, 10));
    await repos.reconcile(at(5, 3));
    expect((await db.tasks.get(old.id))?.status).toBe('planned');
    await repos.reconcile(at(5, 4));
    expect((await db.tasks.get(old.id))?.status).toBe('unplaced');
    await repos.reconcile(at(19, 4));
    expect((await db.tasks.get(old.id))?.status).toBe('someday');
    expect((await db.tasks.get(future.id))?.status).toBe('planned');
    // Made on the 4th for the 25th and missed: one day overdue is not 14 untouched days (Tasks audit 4).
    await repos.reconcile(at(26, 4));
    expect((await db.tasks.get(future.id))?.status).toBe('unplaced');
    await repos.reconcile(at(27, 4));
    expect((await db.tasks.get(future.id))?.status).toBe('unplaced');
  });

  it('split children conserve the parent pool, inherit its first day and complete the container', async () => {
    const parent = await task(at(4, 10));
    const children = await repos.split(parent.id, at(4, 11), 3, [30, 30, 30]);
    expect(children.map((c) => c.xpShare)).toEqual([12, 12, 11]);
    expect(
      children.every((c) => c.firstScheduledDayKey === dayKey(at(4))),
    ).toBe(true);
    await expect(repos.completeTask(parent.id, at(4, 12))).rejects.toThrow(
      /Container/,
    );
    for (const child of children) await repos.completeTask(child.id, at(5, 12));
    expect((await db.tasks.get(parent.id))?.status).toBe('done');
    expect(await db.ledger.count()).toBe(3);
  });

  it('creation split assigns the 100-minute pool, and choice-sheet split counts once', async () => {
    const created = await repos.createSplitTask('Large work', [50, 50], at(4));
    expect(created.map((c) => c.xpShare)).toEqual([20, 19]);
    expect(created.reduce((sum, child) => sum + (child.xpShare ?? 0), 0)).toBe(
      39,
    );
    const parent = await task(at(4, 10));
    await db.tasks.update(parent.id, {
      postponeCount: 2,
      firstStep: 'Open notes',
    });
    const split = await repos.split(parent.id, at(4, 11), 2, [45, 45]);
    expect(
      split.every(
        (child) => child.postponeCount === 2 && child.status === 'unplaced',
      ),
    ).toBe(true);
    expect((await db.tasks.get(parent.id))?.postponeCount).toBe(3);
    expect(
      (await db.taskEvents.where('taskId').equals(parent.id).toArray()).filter(
        (e) => e.kind === 'postponed' && e.budgetCounted,
      ),
    ).toHaveLength(1);
  });

  it('saves split choices and drops remaining steps without removing completed XP', async () => {
    const estimates = [56, 56, 56, 56, 56, 55, 55, 55, 55];
    const names = estimates.map((_, index) => `Work — step ${index + 1} of 9`);
    const steps = await repos.createSplitTask('Work', estimates, at(4), at(4, 10), { titles: names, priority: 'must', placement: 'today' });
    expect(steps).toHaveLength(9);
    expect(steps[0]).toMatchObject({ title: names[0], status: 'planned', mustOrCould: 'must', scheduledStart: at(4, 10) });
    expect(steps.slice(1).every((step) => step.status === 'unplaced' && step.mustOrCould === 'must' && step.scheduledStart == null)).toBe(true);
    await expect(repos.createTask({ title: 'Another Must', size: 'S', estimateMin: 15, dayKey: dayKey(at(4)), scheduledStart: at(4, 13), mustOrCould: 'must' }, at(4))).resolves.toMatchObject({ title: 'Another Must' });
    await repos.completeTask(steps[0]!.id, at(4, 11));
    const ledgerCount = await db.ledger.count();
    await repos.dropTask(steps[0]!.parentId!, at(4, 12));
    expect((await db.tasks.where('parentId').equals(steps[0]!.parentId!).toArray()).map((step) => step.status)).toEqual(['done', ...Array(8).fill('dropped')]);
    expect(await db.ledger.count()).toBe(ledgerCount);
    expect((await db.taskEvents.where('taskId').equals(steps[0]!.id).toArray()).some((event) => event.kind === 'done')).toBe(true);
  });

  it('backup export, wipe and import preserves task, event, focus and ledger rows', async () => {
    const created = await task(at(4, 10));
    await repos.startFocus(created.id, at(4, 10));
    await repos.completeTask(created.id, at(4, 11));
    const names = ['tasks', 'taskEvents', 'focus', 'ledger'] as const;
    const before = await Promise.all(names.map((name) => db[name].toArray()));
    const backup = await exportBackup(db, at(4, 12));
    await Promise.all(db.tables.map((table) => table.clear()));
    await importBackup(db, backup);
    const after = await Promise.all(names.map((name) => db[name].toArray()));
    expect(after).toEqual(before);
  });
});
