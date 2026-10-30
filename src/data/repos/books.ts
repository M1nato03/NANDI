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
export async function saveChapterDone(db: NandiDb, topicId: string, moduleId: string, now: number, check: { rebuilt?: boolean; checkLater?: boolean } = {}): Promise<void> {
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
    await db.ledger.add({ id, mode: 'read', kind: 'chapter', refId: chapterRef(topicId, moduleId), dayKey: dayKey(now), inputs: { afterBedtime, newSteps: new Set(steps.map(row => row.refId)).size, firstRight, readDrops, ...(check.checkLater ? { checkLater: true } : {}) }, updatedAt: now, deleted: 0, deviceId });
  }));
}

/**
 * Spec 41: a finished idea-sitting is one fact, written once. `steps` are the idea's steps no earlier idea fact of the
 * chapter counted (so a chapter begun before spec 41 pays its earlier steps here, once), `dropId` is set when the
 * sitting was the day's drop, and `askedItem` is the earlier idea's question it asked, which the Book check skips.
 */
export async function saveIdeaDone(db: NandiDb, input: { topicId: string; moduleId: string; conceptId: string; dropId?: string; askedItem?: string }, now: number): Promise<void> {
  const chapter = chapterRef(input.topicId, input.moduleId);
  const id = `read-idea:${chapter}:${input.conceptId}`;
  const afterBedtime = now >= shutdownAt(now, await effectiveBedtime(db, now));
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.ledger, db.learnDrops], async () => {
    if (await db.ledger.get(id)) return;
    const counted = new Set((await db.ledger.where('kind').equals('idea').filter(row => !row.deleted && row.inputs.chapter === chapter).toArray()).flatMap(row => Array.isArray(row.inputs.steps) ? row.inputs.steps.map(String) : []));
    const reads = new Set((await db.learnDrops.filter(row => !row.deleted && row.drop.chapter?.topicId === input.topicId && row.drop.chapter.moduleId === input.moduleId && row.drop.chapter.kind === 'read').toArray()).map(row => row.id));
    const taught = await db.ledger.where('kind').equals('learn-lesson').filter(row => !row.deleted && reads.has(String(row.inputs.dropId))).toArray();
    const steps = [...new Set(taught.map(row => row.refId))].filter(step => !counted.has(step));
    await db.ledger.add({ id, mode: 'read', kind: 'idea', refId: `${chapter}:${input.conceptId}`, dayKey: dayKey(now),
      inputs: { chapter, conceptId: input.conceptId, steps, newSteps: steps.length, afterBedtime, ...(input.dropId ? { dropId: input.dropId } : {}), ...(input.askedItem ? { askedItem: input.askedItem } : {}) }, updatedAt: now, deleted: 0, deviceId });
  }));
}

/**
 * Spec 41: the next-day Book check, once per chapter: the right first answers in its check drop (they pay outside the
 * chapter's cap, up to rightMax) and the answer to "Did you try it?".
 */
export async function saveChapterCheck(db: NandiDb, topicId: string, moduleId: string, tried: 'yes' | 'partly' | 'not-yet', now: number): Promise<void> {
  const chapter = chapterRef(topicId, moduleId);
  const id = `read-check:${chapter}`;
  const afterBedtime = now >= shutdownAt(now, await effectiveBedtime(db, now));
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.ledger, db.learnDrops], async () => {
    if (await db.ledger.get(id)) return;
    const checks = new Set((await db.learnDrops.filter(row => !row.deleted && row.drop.chapter?.topicId === topicId && row.drop.chapter.moduleId === moduleId && row.drop.chapter.kind === 'check').toArray()).map(row => row.id));
    const answers = (await db.ledger.where('kind').equals('learn-answer').filter(row => !row.deleted && checks.has(String(row.inputs.dropId))).toArray()).sort((a, b) => a.updatedAt - b.updatedAt);
    const first = new Map<string, boolean>();
    for (const answer of answers) { const item = String(answer.inputs.itemId ?? answer.refId); if (!first.has(item)) first.set(item, answer.inputs.correct === true); }
    await db.ledger.add({ id, mode: 'read', kind: 'chapter-check', refId: chapter, dayKey: dayKey(now), inputs: { firstRight: [...first.values()].filter(Boolean).length, tried, afterBedtime }, updatedAt: now, deleted: 0, deviceId });
  }));
}
