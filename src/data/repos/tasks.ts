import type { NandiDb } from '../db';
import { entityRepo } from './base';

export function createTaskRepos(db: NandiDb, deviceId: string) {
  return {
    tasks: entityRepo(db.tasks, deviceId),
    taskEvents: entityRepo(db.taskEvents, deviceId),
    focus: entityRepo(db.focus, deviceId),
    reminders: entityRepo(db.reminders, deviceId),
    plans: entityRepo(db.plans, deviceId),
  };
}
