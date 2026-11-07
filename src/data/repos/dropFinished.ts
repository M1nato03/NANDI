import type { Drop } from '../../core/learn/engine';
import { dayKey } from '../../core/time';
import type { NandiDb } from '../db';

/**
 * Spec 571 §0.20 (b2, 7 Nov, answer 3): today's drop writes its `gamify` learn-drop fact in the same transaction as the
 * write that finishes it (its last answer, retention check or lesson), with that write's bedtime and night stamps, so
 * the rings and the XP see a finished drop in the render that finishes it. reconcileGamify writes the same id with the
 * same inputs as a backstop, so there is never a second fact. The caller owns a ledger write transaction.
 */
export async function addDropFinished(db: NandiDb, drop: Drop, stamps: { afterBedtime: boolean; night?: true }, deviceId: string, now: number): Promise<void> {
  const today = dayKey(now);
  if (drop.id !== `drop:daily:${today}` || drop.items.length === 0 || drop.cursor < drop.items.length) return;
  const id = `learn-drop:${today}`;
  if (await db.ledger.get(id)) return;
  await db.ledger.add({ id, kind: 'learn-drop', refId: today, dayKey: today, mode: 'gamify', updatedAt: now, deleted: 0, deviceId,
    inputs: { ...(stamps.afterBedtime ? { afterBedtime: true } : {}), ...(stamps.night ? { night: true } : {}), ...(drop.chapter ? { chapter: true } : {}) } });
}
