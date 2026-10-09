import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../db';
import { createTaskRepos } from './tasks';
import { dayKey } from '../../core/time/dayKey';

describe('Tasks Persistence Layer', () => {
  let db: ReturnType<typeof createDb>;
  let repos: ReturnType<typeof createTaskRepos>;
  const deviceId = 'test-device';

  beforeEach(() => {
    db = createDb('test-nandi-' + Date.now());
    repos = createTaskRepos(db, deviceId);
  });

  it('creates a task and events', async () => {
    const now = Date.now();
    const task = await repos.createTask({
      title: 'Test',
      size: 'S',
      estimateMin: 15,
      dayKey: dayKey(now),
      plannedSize: 'S'
    }, now);

    expect(task.id).toBeDefined();
    expect(task.status).toBe('unplaced');
    expect(task.postponeCount).toBe(0);

    const events = await db.taskEvents.where({ taskId: task.id }).toArray();
    expect(events.length).toBe(1);
    expect(events[0].kind).toBe('created');
  });

  it('completes a task and logs a ledger fact', async () => {
    const now = Date.now();
    const task = await repos.createTask({
      title: 'Test',
      size: 'S',
      estimateMin: 15,
      dayKey: dayKey(now),
      plannedSize: 'S',
      scheduledStart: now,
      firstScheduledDayKey: dayKey(now)
    }, now);

    const completed = await repos.completeTask(task.id, now + 1000);
    expect(completed.status).toBe('done');

    const ledger = await db.ledger.toArray();
    expect(ledger.length).toBe(1);
    expect(ledger[0].mode).toBe('tasks');
    expect(ledger[0].kind).toBe('done');
    expect(ledger[0].inputs.isFirstDay).toBe(true);
    expect(ledger[0].inputs.postpones).toBe(0);
  });

  it('postpones a task', async () => {
    const now = Date.now();
    const task = await repos.createTask({
      title: 'Test',
      size: 'S',
      estimateMin: 15,
      dayKey: dayKey(now),
      plannedSize: 'S',
      scheduledStart: now,
      firstScheduledDayKey: dayKey(now)
    }, now);

    const newStart = now + 1000 * 60 * 60 * 24; // tomorrow
    const postponed = await repos.postpone(task.id, now + 1000, { newStart, reason: 'low energy' });

    expect(postponed.postponeCount).toBe(1);
    expect(postponed.dayKey).toBe(dayKey(newStart));

    const events = await db.taskEvents.where({ taskId: task.id }).toArray();
    const postponeEvent = events.find(e => e.kind === 'postponed');
    expect(postponeEvent).toBeDefined();
    expect(postponeEvent?.reason).toBe('low energy');
  });
  
  it('focus timer operations', async () => {
     const now = Date.now();
     const task = await repos.createTask({
      title: 'Test',
      size: 'S',
      estimateMin: 15,
      dayKey: dayKey(now),
      plannedSize: 'S'
    }, now);

    const focus = await repos.startFocus(task.id, now);
    expect(focus.taskId).toBe(task.id);
    expect(focus.startedAt).toBe(now);

    const paused = await repos.pauseFocus(focus.id, now + 1000);
    expect(paused.pauses?.length).toBe(1);

    const resumed = await repos.resumeFocus(focus.id, now + 2000);
    expect(resumed.pauses?.[0].resumeAt).toBe(now + 2000);

    const finished = await repos.finishFocus(focus.id, now + 3000);
    expect(finished.endedAt).toBe(now + 3000);
  });

  it('splits a task correctly', async () => {
     const now = Date.now();
     const parent = await repos.createTask({
      title: 'Big Task',
      size: 'L',
      estimateMin: 120,
      dayKey: dayKey(now),
      plannedSize: 'L',
      scheduledStart: now,
      firstScheduledDayKey: dayKey(now)
    }, now);

    const subtasks = await repos.split(parent.id, now + 1000, 2, [60, 60]);
    expect(subtasks.length).toBe(2);
    expect(subtasks[0].parentId).toBe(parent.id);
    expect(subtasks[0].xpShare).toBe(18); // 35 * 0.5 = 17.5 -> 18

    const events = await db.taskEvents.where({ taskId: parent.id }).toArray();
    const splitEvent = events.find(e => e.kind === 'split');
    expect(splitEvent).toBeDefined();
  });
});

