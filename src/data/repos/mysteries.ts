import { trackWrite } from '../../core/pendingWrites';
import { RULES } from '../../core/rules.config';
import { nextRating } from '../../core/learn/learn';
import type { MysteryCase } from '../../core/mysteries';
import { emptyCaseGrid } from '../../core/mysteries/casePlay';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import type { PuzzleRunRow } from '../types';

export const caseRunId = (day: string) => `daily:${day}:mystery`;

export async function openDailyCase(db: NandiDb, mystery: MysteryCase, day: string, now = Date.now()): Promise<PuzzleRunRow> {
  const id = caseRunId(day);
  const prior = await db.puzzleRuns.get(id);
  if (prior && !prior.deleted) return { ...prior, lastActiveAt: now };
  const deviceId = await getOrCreateDeviceId(db, now);
  const row: PuzzleRunRow = { id, type: 'mystery', dayKey: day, seed: String(mystery.seed), diff: mystery.diff, daily: true, source: 'app', caseGrid: emptyCaseGrid(mystery.n), activeMs: 0, lastActiveAt: now, tries: 0, hintsUsed: 0, updatedAt: now, deleted: 0, deviceId };
  await trackWrite(() => db.puzzleRuns.put(row));
  return row;
}

export async function saveDailyCase(db: NandiDb, row: PuzzleRunRow, now = Date.now(), afterBedtime = row.afterBedtime ?? false): Promise<PuzzleRunRow> {
  return trackWrite(() => db.transaction('rw', [db.puzzleRuns, db.ledger, db.ratings], async () => {
    const prior = await db.puzzleRuns.get(row.id);
    if (prior?.result) return prior;
    const saved = { ...row, afterBedtime, updatedAt: now };
    await db.puzzleRuns.put(saved);
    if (saved.result === 'solved' || saved.result === 'revealed') {
      const id = `mystery:${saved.id}`;
      if (!(await db.ledger.get(id))) await db.ledger.add({ id, dayKey: saved.dayKey!, mode: 'mind', kind: 'mystery', refId: saved.id, inputs: { daily: true, afterBedtime, result: saved.result, hintsUsed: saved.hintsUsed ?? 0, tries: saved.tries ?? 0 }, updatedAt: now, deleted: 0, deviceId: saved.deviceId });
      // Spec 04: the daily case moves the detective rating, which picks the deck's case cards. It is internal: never
      // shown, never paid. A clean solve scores 1, a solve with hints or a second try 0.7, a reveal 0 (batch 5).
      const score = saved.result === 'revealed' ? RULES.mind.caseScore.revealed
        : (saved.hintsUsed ?? 0) > 0 || (saved.tries ?? 0) > 1 ? RULES.mind.caseScore.withHintsOrSecondTry : RULES.mind.caseScore.cleanSolve;
      const difficulty = RULES.mind.caseElo[saved.diff === 'hard' || saved.diff === 'medium' ? saved.diff : 'easy'];
      const rating = await db.ratings.get('detective');
      await db.ratings.put({ id: 'detective', value: nextRating(rating?.value ?? 1000, rating?.n ?? 0, difficulty, score), n: (rating?.n ?? 0) + 1, updatedAt: now, deleted: 0, deviceId: saved.deviceId });
    }
    return saved;
  }));
}
