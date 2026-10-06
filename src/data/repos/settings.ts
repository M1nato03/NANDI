import type { NandiDb } from '../db';
import { entityRepo, naturalRepo } from './base';

export function createSettingsRepos(db: NandiDb, deviceId: string) {
  return {
    inventory: entityRepo(db.inventory, deviceId),
    dailyLog: naturalRepo(db.dailyLog, deviceId),
    settings: naturalRepo(db.settings, deviceId),
  };
}
