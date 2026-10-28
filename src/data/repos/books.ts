import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { shutdownAt } from '../../core/tasks/planner';
import { chapterFactId, chapterRef } from '../../core/learn/books';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import { effectiveBedtime } from './night';

/**
 * Spec 33 §3: a finished chapter is one fact, written once (a re-read writes nothing). Spec 36 v2: it carries what the
 * reading measured, so it can pay for it: the steps its reading newly taught, the right first answers in its check (a
 * recall rebuild counts as one; Chiku's scene keeps its own 5) and the drops it was read in, so a chapter read as the
 * day's drop pays instead of that drop's 15, never on top.
 */
export async function saveChapterDone(db: NandiDb, topicId: string, moduleId: string, now: number, check: { rebuilt?: boolean } = {}): Promise<void> {
  const id = chapterFactId(topicId, moduleId);
  const afterBedtime = now >= shutdownAt(now, await effectiveBedtime(db, now));
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.ledger, db.learnDrops], async () => {
    if (await db.ledger.get(id)) return;
    const drops = await db.learnDrops.filter(row => !row.deleted && row.drop.chapter?.topicId === topicId && row.drop.chapter.moduleId === moduleId).toArray();
    const readDrops = drops.filter(row => row.drop.chapter?.kind === 'read').map(row => row.id);
    const checkDrops = new Set(drops.filter(row => row.drop.chapter?.kind === 'check').map(row => row.id));
    const steps = await db.ledger.where('kind').equals('learn-lesson').filter(row => !row.deleted && readDrops.includes(String(row.inputs.dropId))).toArray();
    const answers = (await db.ledger.where('kind').equals('learn-answer').filter(row => !row.deleted && checkDrops.has(String(row.inputs.dropId))).toArray()).sort((a, b) => a.updatedAt - b.updatedAt);
    // Only the first answer to each question counts.
    const first = new Map<string, boolean>();
    for (const answer of answers) { const item = String(answer.inputs.itemId ?? answer.refId); if (!first.has(item)) first.set(item, answer.inputs.correct === true); }
    const firstRight = [...first.values()].filter(Boolean).length + (check.rebuilt ? 1 : 0);
    await db.ledger.add({ id, mode: 'read', kind: 'chapter', refId: chapterRef(topicId, moduleId), dayKey: dayKey(now), inputs: { afterBedtime, newSteps: new Set(steps.map(row => row.refId)).size, firstRight, readDrops }, updatedAt: now, deleted: 0, deviceId });
  }));
}
