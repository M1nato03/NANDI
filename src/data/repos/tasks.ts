import { ulid } from 'ulidx';
import type { NandiDb } from '../db';
import { db as appDb } from '../db';
import { entityRepo } from './base';
import type { TaskRow, FocusRow, TaskEventRow } from '../types';
import { dayKey } from '../../core/time/dayKey';
import { RULES } from '../../core/rules.config';
import { postponeWeekKey } from '../../core/tasks/budget';
import {
  postponeGate,
  type PostponeAttempt,
} from '../../core/tasks/postponeGate';
import {
  checkDayBoundary,
  check14DayRule,
  doRealReasonMove,
  postponeTask,
  canAddMust,
  type CoreTask,
  type TaskSize,
  type TaskStatus,
} from '../../core/tasks/task-machine';
import { splitTask } from '../../core/tasks/split';
import { trackWrite } from '../../core/pendingWrites';
import {
  isFocusRunning,
  startFocus as coreStartFocus,
  pauseFocus as corePauseFocus,
  resumeFocus as coreResumeFocus,
  finishFocus as coreFinishFocus,
} from '../../core/tasks/focus';

function coreTask(row: TaskRow): CoreTask {
  if (
    (row.size !== 'S' && row.size !== 'M' && row.size !== 'L') ||
    row.estimateMin == null ||
    row.plannedSize == null ||
    (row.plannedSize !== 'S' &&
      row.plannedSize !== 'M' &&
      row.plannedSize !== 'L') ||
    row.postponeCount == null ||
    !['planned', 'unplaced', 'done', 'someday', 'dropped'].includes(row.status)
  ) {
    throw new Error('Incomplete task row');
  }
  return {
    ...row,
    size: row.size as TaskSize,
    plannedSize: row.plannedSize as TaskSize,
    estimateMin: row.estimateMin,
    postponeCount: row.postponeCount,
    status: row.status as TaskStatus,
  };
}

/** Used by reload guards; a paused or finished focus is safe to reload. */
export async function isFocusActive(): Promise<boolean> {
  return (await appDb.focus.filter((row) => row.deleted === 0 && isFocusRunning(row)).count()) > 0;
}

export function createTaskRepos(db: NandiDb, deviceId: string) {
  const repos = {
    tasks: entityRepo(db.tasks, deviceId),
    taskEvents: entityRepo(db.taskEvents, deviceId),
    focus: entityRepo(db.focus, deviceId),
    reminders: entityRepo(db.reminders, deviceId),
    plans: entityRepo(db.plans, deviceId),
  };
  const mutation = <T>(fn: () => Promise<T>): Promise<T> =>
    trackWrite(() => db.transaction('rw', db.tasks, db.taskEvents, db.focus, db.ledger, fn));
  const event = (
    taskId: string,
    kind: TaskEventRow['kind'],
    at: number,
    extra: Partial<TaskEventRow> = {},
  ) => repos.taskEvents.put({ taskId, kind, at, ...extra }, at);

  return {
    ...repos,
    async createTask(
      input: Omit<
        TaskRow,
        | 'id'
        | 'updatedAt'
        | 'deleted'
        | 'deviceId'
        | 'postponeCount'
        | 'status'
        | 'size'
        | 'estimateMin'
      > & { id?: string; size: TaskSize; estimateMin: number },
      now: number,
    ): Promise<TaskRow> {
      return mutation(async () => {
        if (
          input.estimateMin == null ||
          input.estimateMin <= 0 ||
          input.estimateMin > RULES.tasks.maxEstimateMin
        )
          throw new RangeError('Estimate requires a split');
        if (input.mustOrCould === 'must') {
          const key = dayKey(input.scheduledStart ?? now);
          const existing = await db.tasks
            .where('dayKey')
            .equals(key)
            .filter(
              (t) =>
                t.deleted === 0 &&
                t.mustOrCould === 'must' &&
                t.status !== 'dropped',
            )
            .count();
          if (!canAddMust(existing))
            throw new RangeError('Maximum Musts for this day; make it a Could');
        }
        const id = input.id ?? ulid(now);
        if (await db.tasks.get(id)) throw new Error('Task already exists');
        const key = dayKey(input.scheduledStart ?? now);
        const task = await repos.tasks.put(
          {
            ...input,
            id,
            dayKey: key,
            plannedSize: input.size,
            firstScheduledDayKey:
              input.scheduledStart != null ? key : undefined,
            status: input.scheduledStart != null ? 'planned' : 'unplaced',
            postponeCount: 0,
          },
          now,
        );
        await event(id, 'created', now);
        return task;
      });
    },
    async createSplitTask(
      title: string,
      estimates: number[],
      now: number,
      scheduledStart?: number,
    ): Promise<TaskRow[]> {
      return mutation(async () => {
        const total = estimates.reduce((sum, value) => sum + value, 0);
        if (total <= RULES.tasks.maxEstimateMin)
          throw new RangeError(
            'Creation split is for estimates over 90 minutes',
          );
        const id = ulid(now);
        const key = dayKey(scheduledStart ?? now);
        const parentCore: CoreTask = {
          id,
          status: scheduledStart == null ? 'unplaced' : 'planned',
          dayKey: key,
          size: 'L',
          plannedSize: 'L',
          estimateMin: total,
          postponeCount: 0,
          scheduledStart,
          firstScheduledDayKey: scheduledStart == null ? undefined : key,
        };
        const children = splitTask(
          parentCore,
          estimates.length,
          estimates,
          RULES,
          now,
        );
        await repos.tasks.put(
          {
            id,
            title,
            status: 'unplaced',
            dayKey: key,
            size: 'L',
            plannedSize: 'L',
            estimateMin: total,
            postponeCount: 0,
            firstScheduledDayKey: parentCore.firstScheduledDayKey,
          },
          now,
        );
        await event(id, 'created', now);
        await event(id, 'split', now);
        const rows: TaskRow[] = [];
        for (const child of children) {
          rows.push(
            await repos.tasks.put(
              { ...child, title: `${title} (${rows.length + 1})` },
              now,
            ),
          );
          await event(child.id, 'created', now);
        }
        return rows;
      });
    },
    async completeTask(taskId: string, now: number): Promise<TaskRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        if (!task) throw new Error('Task not found');
        if (task.status === 'done') return task;
        if (
          task.status === 'dropped' ||
          (await db.tasks.where('parentId').equals(taskId).count()) > 0
        )
          throw new Error('Container or dropped task cannot earn XP');
        const updated = await repos.tasks.put(
          { ...task, status: 'done', doneAt: now },
          now,
        );
        await event(taskId, 'done', now);
        const created = await db.taskEvents
          .where('taskId')
          .equals(taskId)
          .filter((e) => e.kind === 'created')
          .first();
        const key = dayKey(now);
        const inputs = {
          plannedSize: task.plannedSize ?? task.size,
          isFirstDay:
            task.postponeCount === 0 && task.firstScheduledDayKey === key,
          postpones: task.postponeCount ?? 0,
          clutchStamp:
            (task.postponeCount ?? 0) >= RULES.tasks.clutch.minPostpones,
          createdToDoneMin: created ? (now - created.at) / 60_000 : undefined,
          xpShare: task.xpShare,
        };
        const id = `done:${taskId}`;
        if (!(await db.ledger.get(id)))
          await db.ledger.add({
            id,
            mode: 'tasks',
            kind: 'done',
            refId: taskId,
            dayKey: key,
            inputs,
            updatedAt: now,
            deleted: 0,
            deviceId,
          });
        if (task.parentId) {
          const siblings = await db.tasks
            .where('parentId')
            .equals(task.parentId)
            .toArray();
          if (
            siblings.every(
              (s) =>
                s.id === taskId ||
                s.status === 'done' ||
                s.status === 'dropped',
            )
          ) {
            const parent = await db.tasks.get(task.parentId);
            if (parent)
              await repos.tasks.put(
                { ...parent, status: 'done', doneAt: now },
                now,
              );
          }
        }
        return updated;
      });
    },
    async postpone(
      taskId: string,
      now: number,
      attempt: Omit<PostponeAttempt, 'task' | 'now'>,
    ): Promise<TaskRow> {
      return mutation(async () => {
        const row = await repos.tasks.get(taskId);
        if (!row) throw new Error('Task not found');
        if (row.status === 'done' || row.status === 'dropped')
          throw new Error('Task is closed');
        const task = checkDayBoundary(coreTask(row), now);
        const weekStart = postponeWeekKey(now);
        const counted = await db.taskEvents
          .filter(
            (e) =>
              e.kind === 'postponed' &&
              e.budgetCounted === true &&
              postponeWeekKey(e.at) === weekStart,
          )
          .count();
        const realMoves = await db.taskEvents
          .filter(
            (e) =>
              e.kind === 'realReasonMove' &&
              postponeWeekKey(e.at) === weekStart,
          )
          .count();
        const gate = postponeGate(
          { ...attempt, task, now, realReasonMovesThisWeek: realMoves },
          counted,
        );
        if (!gate.ok) throw new Error(gate.error);
        if (gate.action === 'split')
          throw new Error('Use split with the choice sheet');
        if (gate.action === 'do10') {
          const open = await db.focus
            .filter((f) => f.deleted === 0 && isFocusRunning(f))
            .toArray();
          for (const focus of open) {
            await repos.focus.put(
              {
                ...corePauseFocus(focus, now),
                switches: (focus.switches ?? 0) + 1,
              },
              now,
            );
            await event(focus.taskId, 'switched', now);
          }
          const { newFocus } = coreStartFocus(taskId, now);
          await repos.focus.put({ ...newFocus, id: ulid(now) }, now);
          await event(taskId, 'started', now);
          return row;
        }
        let next: CoreTask;
        if (gate.action === 'real_reason_move') {
          if (attempt.newStart == null) throw new Error('Missing slot');
          next = doRealReasonMove(task, attempt.newStart);
          await event(taskId, 'realReasonMove', now, {
            reason: attempt.realReason,
          });
        } else if (gate.action === 'someday' && task.postponeCount < 3) {
          next = {
            ...task,
            status: 'someday',
            scheduledStart: null,
            scheduledEnd: null,
          };
          await event(taskId, 'someday', now);
        } else {
          next = postponeTask(task, attempt.newStart, now);
          if (
            gate.action === 'postpone' ||
            (gate.action === 'someday' &&
              next.postponeCount > task.postponeCount)
          ) {
            await event(taskId, 'postponed', now, {
              reason: attempt.reason,
              budgetCounted: true,
            });
          }
          if (next.status === 'someday') await event(taskId, 'someday', now);
        }
        if (attempt.firstStep) {
          next.firstStep = attempt.firstStep;
          await event(taskId, 'shrunk', now);
        }
        return repos.tasks.put({ ...row, ...next }, now);
      });
    },
    async startFocus(taskId: string, now: number): Promise<FocusRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        if (!task) throw new Error('Task not found');
        const open = await db.focus
          .filter((f) => f.deleted === 0 && f.endedAt == null)
          .toArray();
        const existing = open.find(
          (f) => f.taskId === taskId && isFocusRunning(f),
        );
        if (existing) return existing;
        for (const focus of open.filter(isFocusRunning)) {
          const paused = corePauseFocus(focus, now);
          await repos.focus.put(
            { ...paused, switches: (focus.switches ?? 0) + 1 },
            now,
          );
          await event(focus.taskId, 'switched', now);
        }
        const { newFocus } = coreStartFocus(taskId, now);
        const saved = await repos.focus.put(
          { ...newFocus, id: ulid(now) },
          now,
        );
        await event(taskId, 'started', now);
        return saved;
      });
    },
    async pauseFocus(focusId: string, now: number): Promise<FocusRow> {
      return mutation(async () => {
        const focus = await repos.focus.get(focusId);
        if (!focus) throw new Error('Focus not found');
        return repos.focus.put(corePauseFocus(focus, now), now);
      });
    },
    async resumeFocus(focusId: string, now: number): Promise<FocusRow> {
      return mutation(async () => {
        const focus = await repos.focus.get(focusId);
        if (!focus) throw new Error('Focus not found');
        const open = await db.focus
          .filter(
            (f) => f.id !== focusId && f.deleted === 0 && isFocusRunning(f),
          )
          .toArray();
        for (const other of open) {
          await repos.focus.put(
            {
              ...corePauseFocus(other, now),
              switches: (other.switches ?? 0) + 1,
            },
            now,
          );
          await event(other.taskId, 'switched', now);
        }
        return repos.focus.put(coreResumeFocus(focus, now), now);
      });
    },
    async finishFocus(focusId: string, now: number): Promise<FocusRow> {
      return mutation(async () => {
        const focus = await repos.focus.get(focusId);
        if (!focus) throw new Error('Focus not found');
        return repos.focus.put(coreFinishFocus(focus, now), now);
      });
    },
    async listForDay(key: string): Promise<TaskRow[]> {
      return db.tasks
        .where('dayKey')
        .equals(key)
        .filter((t) => t.deleted === 0)
        .toArray();
    },
    async reconcile(now: number): Promise<void> {
      await mutation(async () => {
        const open = await db.tasks
          .filter(
            (task) =>
              task.deleted === 0 &&
              (task.status === 'planned' || task.status === 'unplaced'),
          )
          .toArray();
        for (const row of open) {
          const atBoundary = checkDayBoundary(coreTask(row), now);
          const lastEvent = await db.taskEvents
            .where('taskId')
            .equals(row.id)
            .sortBy('at');
          const lastTouched = lastEvent.at(-1)?.at ?? row.updatedAt;
          const next = check14DayRule(atBoundary, now, lastTouched);
          if (next.status === 'someday') await event(row.id, 'someday', now);
          if (next.status !== row.status || next.dayKey !== row.dayKey)
            await repos.tasks.put({ ...row, ...next }, now);
        }
      });
    },
    async split(
      taskId: string,
      now: number,
      numSubtasks: number,
      estimates: number[],
    ): Promise<TaskRow[]> {
      return mutation(async () => {
        const parent = await repos.tasks.get(taskId);
        if (!parent) throw new Error('Task not found');
        if (parent.status === 'done' || parent.status === 'dropped')
          throw new Error('Task is closed');
        if ((await db.tasks.where('parentId').equals(taskId).count()) > 0)
          throw new Error('Task already split');
        const atChoiceSheet = parent.postponeCount === 2;
        const forSplit = atChoiceSheet
          ? { ...coreTask(parent), postponeCount: 3 }
          : coreTask(parent);
        const children = splitTask(
          forSplit,
          numSubtasks,
          estimates,
          RULES,
          now,
        );
        const rows: TaskRow[] = [];
        for (const child of children) {
          rows.push(
            await repos.tasks.put(
              { ...parent, ...child, title: `${parent.title} (${rows.length + 1})`, doneAt: undefined },
              now,
            ),
          );
          await event(child.id, 'created', now);
        }
        await event(taskId, 'split', now);
        if (atChoiceSheet)
          await event(taskId, 'postponed', now, { budgetCounted: true });
        await repos.tasks.put(
          {
            ...parent,
            status: 'unplaced',
            scheduledStart: null,
            scheduledEnd: null,
            postponeCount: forSplit.postponeCount,
          },
          now,
        );
        return rows;
      });
    },
  };
}
