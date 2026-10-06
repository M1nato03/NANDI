import type { NandiDb } from '../db';
import { entityRepo, naturalRepo } from './base';

export function createTrainRepos(db: NandiDb, deviceId: string) {
  return {
    exercises: entityRepo(db.exercises, deviceId),
    ladders: entityRepo(db.ladders, deviceId),
    programs: entityRepo(db.programs, deviceId),
    exState: naturalRepo(db.exState, deviceId),
    sessions: entityRepo(db.sessions, deviceId),
    sets: entityRepo(db.sets, deviceId),
    prs: entityRepo(db.prs, deviceId),
  };
}
