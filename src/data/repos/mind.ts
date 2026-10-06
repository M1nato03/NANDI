import type { NandiDb } from '../db';
import { entityRepo, naturalRepo } from './base';

export function createMindRepos(db: NandiDb, deviceId: string) {
  return {
    puzzleRuns: entityRepo(db.puzzleRuns, deviceId),
    cards: naturalRepo(db.cards, deviceId),
    deckProg: naturalRepo(db.deckProg, deviceId),
    lessonProg: naturalRepo(db.lessonProg, deviceId),
    ratings: naturalRepo(db.ratings, deviceId),
    flags: entityRepo(db.flags, deviceId),
    unlocks: entityRepo(db.unlocks, deviceId),
    packs: naturalRepo(db.packs, deviceId),
  };
}
