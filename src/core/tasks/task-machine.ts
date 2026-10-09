import { dayKey as getDayKey } from '../time/dayKey';
import { RULES, Rules } from '../rules.config';

export type TaskStatus = 'planned' | 'unplaced' | 'done' | 'someday' | 'dropped';

export interface CoreTask {
  id: string;
  status: TaskStatus;
  dayKey: string;
  size: 'S' | 'M' | 'L';
  estimateMin: number;
  plannedSize?: 'S' | 'M' | 'L';
  category?: string;
  mustOrCould?: 'must' | 'could';
  scheduledStart?: number | null;
  scheduledEnd?: number | null;
  firstStep?: string;
  postponeCount: number;
  firstScheduledDayKey?: string;
  parentId?: string;
  xpShare?: number;
}

export function createTask(
  id: string,
  now: number,
  size: 'S' | 'M' | 'L',
  estimateMin: number,
  options: Partial<CoreTask> = {}
): CoreTask {
  const dayKey = options.scheduledStart ? getDayKey(options.scheduledStart) : getDayKey(now);
  
  return {
    id,
    status: options.scheduledStart ? 'planned' : 'unplaced',
    dayKey,
    size,
    estimateMin,
    plannedSize: size,
    postponeCount: 0,
    ...options
  };
}

export function postponeTask(task: CoreTask, newStart: number | null, now: number, rules: Rules = RULES): CoreTask {
  const isPostpone = isActualPostpone(task, newStart, now);
  const updatedTask = { ...task };

  if (isPostpone) {
    updatedTask.postponeCount += 1;
  }

  if (newStart === null) {
    updatedTask.status = 'unplaced';
    updatedTask.scheduledStart = null;
    updatedTask.scheduledEnd = null;
    updatedTask.dayKey = getDayKey(now); 
  } else {
    updatedTask.status = 'planned';
    updatedTask.scheduledStart = newStart;
    updatedTask.dayKey = getDayKey(newStart);
    if (!updatedTask.firstScheduledDayKey) {
      updatedTask.firstScheduledDayKey = updatedTask.dayKey;
    }
  }

  return updatedTask;
}

export function checkDayBoundary(task: CoreTask, now: number): CoreTask {
    if (task.status === 'planned' && task.scheduledStart) {
       const taskDayKey = getDayKey(task.scheduledStart);
       const nowDayKey = getDayKey(now);
       if (nowDayKey > taskDayKey) {
           return {
               ...task,
               status: 'unplaced',
               scheduledStart: null,
               scheduledEnd: null,
               dayKey: nowDayKey
           };
       }
    }
    return task;
}

export function isActualPostpone(task: CoreTask, newStart: number | null, now: number): boolean {
   if (task.status === 'unplaced') {
      if (task.firstScheduledDayKey && newStart) return true; // Re-placing
      return false; // First placement
   }

   if (task.status === 'planned' && task.scheduledStart) {
       if (newStart === null) return true; // moving to unplaced counts
       const oldDayKey = getDayKey(task.scheduledStart);
       const newDayKey = getDayKey(newStart);
       if (newDayKey > oldDayKey) return true; // later day
       
       if (newDayKey === oldDayKey) {
          if (now >= task.scheduledStart && newStart > task.scheduledStart) return true; // started and moved later
       }
   }
   return false;
}

export function check14DayRule(task: CoreTask, now: number, lastTouched: number, rules: Rules = RULES): CoreTask {
   if (task.status === 'unplaced') {
       const days = (now - lastTouched) / (1000 * 60 * 60 * 24);
       if (days >= rules.tasks.postpone.untouchedDaysToSomeday) {
           return { ...task, status: 'someday' };
       }
   }
   return task;
}

export function canSaveUnsplit(estimateMin: number, rules: Rules = RULES): boolean {
   return estimateMin <= rules.tasks.maxEstimateMin;
}

export function doRealReasonMove(task: CoreTask, newStart: number): CoreTask {
    const newDayKey = getDayKey(newStart);
    return {
        ...task,
        status: 'planned',
        scheduledStart: newStart,
        dayKey: newDayKey,
        firstScheduledDayKey: newDayKey, // keep multiplier eligibility
    };
}
