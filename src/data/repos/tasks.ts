import { ulid } from 'ulidx';
import type { NandiDb } from '../db';
import { entityRepo } from './base';
import { TaskRow, FocusRow, TaskEventRow, LedgerRow } from '../types';
import { dayKey as getDayKey } from '../../core/time/dayKey';
import { postponeGate, PostponeAttempt } from '../../core/tasks/postponeGate';
import { postponeTask, isActualPostpone, checkDayBoundary } from '../../core/tasks/task-machine';
import { startFocus as coreStartFocus, pauseFocus as corePauseFocus, resumeFocus as coreResumeFocus, finishFocus as coreFinishFocus } from '../../core/tasks/focus';

export function createTaskRepos(db: NandiDb, deviceId: string) {
  const repos = {
    tasks: entityRepo(db.tasks, deviceId),
    taskEvents: entityRepo(db.taskEvents, deviceId),
    focus: entityRepo(db.focus, deviceId),
    reminders: entityRepo(db.reminders, deviceId),
    plans: entityRepo(db.plans, deviceId),
  };

  return {
    ...repos,

    async createTask(
      input: Omit<TaskRow, 'id' | 'updatedAt' | 'deleted' | 'deviceId' | 'postponeCount' | 'status'> & { id?: string },
      now: number
    ): Promise<TaskRow> {
      return db.transaction('rw', db.tasks, db.taskEvents, async () => {
         const id = input.id || ulid(now);
         const status = input.scheduledStart ? 'planned' : 'unplaced';
         
         const task = await repos.tasks.put({
            ...input,
            id,
            status,
            postponeCount: 0,
             } as TaskRow, now);

         await repos.taskEvents.put({
            taskId: id,
            kind: 'created',
            at: now
         }, now);

         return task;
      });
    },

    async startFocus(taskId: string, now: number): Promise<FocusRow> {
       return db.transaction('rw', db.tasks, db.taskEvents, db.focus, async () => {
           // We only support 1 live timer at a time according to specs
           const openFocuses = await db.focus.filter(f => f.deleted === 0 && !f.endedAt).toArray();
           const activeFocus = openFocuses.find(f => {
               const pauses = f.pauses || [];
               return pauses.length === 0 || pauses[pauses.length - 1].resumeAt !== undefined;
           });

           const { newFocus, pausedFocus } = coreStartFocus(taskId, now, activeFocus);

           if (pausedFocus) {
               await repos.focus.put(pausedFocus, now);
               await repos.taskEvents.put({ taskId: pausedFocus.taskId, kind: 'switched', at: now }, now);
           }

           const task = await repos.tasks.get(taskId);
           if (task && task.status === 'unplaced') {
              // start unplaced task implies placing it now
              await repos.tasks.put({ ...task, status: 'planned', scheduledStart: now, dayKey: getDayKey(now) }, now);
           }

           const focusRow = await repos.focus.put(newFocus, now);
           await repos.taskEvents.put({ taskId, kind: 'started', at: now }, now);

           return focusRow;
       });
    },

    async pauseFocus(focusId: string, now: number): Promise<FocusRow> {
       return db.transaction('rw', db.focus, async () => {
           const focus = await repos.focus.get(focusId);
           if (!focus) throw new Error('Focus not found');
           const updated = corePauseFocus(focus, now);
           return repos.focus.put(updated, now);
       });
    },

    async resumeFocus(focusId: string, now: number): Promise<FocusRow> {
        return db.transaction('rw', db.focus, async () => {
           const focus = await repos.focus.get(focusId);
           if (!focus) throw new Error('Focus not found');
           const updated = coreResumeFocus(focus, now);
           return repos.focus.put(updated, now);
        });
    },

    async finishFocus(focusId: string, now: number): Promise<FocusRow> {
        return db.transaction('rw', db.focus, async () => {
           const focus = await repos.focus.get(focusId);
           if (!focus) throw new Error('Focus not found');
           const updated = coreFinishFocus(focus, now);
           return repos.focus.put(updated, now);
        });
    },

    async completeTask(taskId: string, now: number): Promise<TaskRow> {
        return db.transaction('rw', db.tasks, db.taskEvents, db.ledger, async () => {
            const task = await repos.tasks.get(taskId);
            if (!task) throw new Error('Task not found');

            const updated = await repos.tasks.put({
                ...task,
                status: 'done',
                doneAt: now
            }, now);

            await repos.taskEvents.put({ taskId, kind: 'done', at: now }, now);

            // Emit ledger fact
            const isFirstDay = task.firstScheduledDayKey === updated.dayKey;
            
            // To figure out if it is a quick win, we need creation time.
            const createdEvent = await db.taskEvents.where({ taskId }).filter(e => e.kind === 'created').first();
            const createdToDoneMin = createdEvent ? (now - createdEvent.at) / 60000 : undefined;

            await db.ledger.add({
                id: `tasks:done:${taskId}`,
                dayKey: getDayKey(now),
                mode: 'tasks',
                kind: 'done',
                refId: taskId,
                inputs: {
                    plannedSize: task.plannedSize,
                    isFirstDay,
                    postpones: task.postponeCount,
                    createdToDoneMin,
                    xpShare: task.xpShare
                },
                updatedAt: now,
                deleted: 0,
                deviceId
            });

            return updated;
        });
    },

    async postpone(taskId: string, now: number, attempt: Omit<PostponeAttempt, 'task'>): Promise<TaskRow> {
        return db.transaction('rw', db.tasks, db.taskEvents, async () => {
            const taskRow = await repos.tasks.get(taskId);
            if (!taskRow) throw new Error('Task not found');
            
            const task = { ...taskRow, size: taskRow.size as 'S'|'M'|'L', status: taskRow.status as any };
            
            // Re-apply boundary rules first if needed? For pure layer we check that before.
            const taskBoundary = checkDayBoundary(task, now);

            // Assuming gate check happens in UI/caller before this, but we apply mutations here.
            // Using core task-machine postponeTask:
            const updated = postponeTask(taskBoundary, attempt.newStart, now);
            
            if (attempt.firstStep) {
                updated.firstStep = attempt.firstStep;
                await repos.taskEvents.put({ taskId, kind: 'shrunk', at: now }, now);
            }

            const isPostpone = isActualPostpone(taskBoundary, attempt.newStart, now);
            const saved = await repos.tasks.put({
                ...taskRow,
                ...updated
            }, now);

            if (isPostpone) {
               await repos.taskEvents.put({ taskId, kind: 'postponed', at: now, reason: attempt.reason }, now);
            }

            return saved;
        });
    },

    async listForDay(dayKey: string): Promise<TaskRow[]> {
        return db.tasks.where('dayKey').equals(dayKey).filter(t => t.deleted === 0).toArray();
    },

    async split(taskId: string, now: number, numSubtasks: number, estimates: number[]): Promise<TaskRow[]> {
        return db.transaction('rw', db.tasks, db.taskEvents, async () => {
             const parentRow = await repos.tasks.get(taskId);
             if (!parentRow) throw new Error('Task not found');

             // Generate subtasks logically
             // Assuming splitTask from core is used, we duplicate minimal logic or import it.
             // Given pure splitTask handles parent updates via return, let's inline pure logic for rows:
             const totalEstimate = estimates.reduce((sum, est) => sum + est, 0);
             const parentXp = parentRow.plannedSize === 'S' ? 10 : 
                              parentRow.plannedSize === 'M' ? 20 : 35; // from Rules

             const subtaskRows: TaskRow[] = [];
             for (let i = 0; i < estimates.length; i++) {
                 const est = estimates[i];
                 const xpShare = Math.round(parentXp * (est / totalEstimate));
                 
                 let childPostponeCount = parentRow.postponeCount;
                 if (parentRow.postponeCount === 3) {
                     childPostponeCount = 2; // rule for postpone #3 choice sheet
                 }

                 const subtask = await repos.tasks.put({
                     ...parentRow,
                     id: `${parentRow.id}-sub-${i}-${now}`,
                     size: parentRow.size,
                     estimateMin: est,
                     parentId: parentRow.id,
                     firstScheduledDayKey: parentRow.firstScheduledDayKey,
                     postponeCount: childPostponeCount,
                     xpShare,
                     doneAt: undefined,
                     status: parentRow.status === 'done' ? 'planned' : parentRow.status
                 } as TaskRow, now);
                 subtaskRows.push(subtask);
                 
                 await repos.taskEvents.put({ taskId: subtask.id, kind: 'created', at: now }, now);
             }

             // Record split event on parent
             await repos.taskEvents.put({ taskId: parentRow.id, kind: 'split', at: now }, now);

             return subtaskRows;
        });
    }
  };
}
