import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { shutdownAt } from '../../core/tasks/planner';
import { chapterFactId, chapterRef } from '../../core/learn/books';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import { effectiveBedtime } from './night';

/**
 * Spec 33 §3: a finished chapter is one fact, written once. It earns nothing itself (mode `read` has no award):
 * the chapter's XP comes through the day's drop it was read as, inside Learn's existing daily cap.
 */
export async function saveChapterDone(db: NandiDb, topicId: string, moduleId: string, now: number): Promise<void> {
  const id = chapterFactId(topicId, moduleId);
  const afterBedtime = now >= shutdownAt(now, await effectiveBedtime(db, now));
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, mode: 'read', kind: 'chapter', refId: chapterRef(topicId, moduleId), dayKey: dayKey(now), inputs: { afterBedtime }, updatedAt: now, deleted: 0, deviceId });
  }));
}
