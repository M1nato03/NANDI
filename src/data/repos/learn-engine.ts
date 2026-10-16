import { trackWrite } from '../../core/pendingWrites';
import { answerConcept, updateItemRating, advanceDrop, gradeItem, type AnswerFact, type Confidence, type Drop, type ItemAnswer } from '../../core/learn/engine';
import { dayKey } from '../../core/time';
import type { TopicItem } from '../packs/schemas';
import type { NandiDb } from '../db';
import type { LearnConceptRow, LearnItemRow } from '../types';

export async function saveDrop(db: NandiDb, drop: Drop, deviceId: string, now: number): Promise<void> {
  await trackWrite(() => db.learnDrops.put({ id: drop.id, drop, updatedAt: now, deleted: 0, deviceId }));
}
export async function loadDrop(db: NandiDb, id: string): Promise<Drop | null> {
  return (await db.learnDrops.get(id))?.drop ?? null;
}
export async function loadEngineFacts(db: NandiDb): Promise<{ facts: AnswerFact[] }> {
  const rows = await db.ledger.where('kind').anyOf('learn-answer', 'learn-retention').toArray();
  return { facts: rows.filter(row => !row.deleted)
    .map(row => ({ conceptId: row.inputs.conceptId as string, answeredAt: row.updatedAt,
      correct: row.inputs.correct as boolean, confidence: row.inputs.confidence as Confidence,
      kind: row.kind === 'learn-retention' ? 'retention' as const : 'practice' as const,
      retentionDay: row.inputs.retentionDay as 7 | 30 | undefined })) };
}
export interface AnswerInput { answerId: string; dropId: string; item: TopicItem; answer: ItemAnswer; confidence: Confidence; deviceId: string; now: number }
/** State, drop cursor and its immutable ledger fact commit atomically. */
export async function saveEngineAnswer(db: NandiDb, input: AnswerInput): Promise<void> {
  await trackWrite(() => db.transaction('rw', [db.learnConcepts, db.learnItems, db.learnDrops, db.ledger], async () => {
    const factId = `learn-answer:${input.answerId}`;
    if (await db.ledger.get(factId)) return;
    const grade = gradeItem(input.item, input.answer);
    const prior = await db.learnConcepts.get(input.item.conceptId);
    const current = await db.learnDrops.get(input.dropId);
    if (!current) throw new Error(`Missing drop ${input.dropId}`);
    const step = current.drop.items[current.drop.cursor];
    if (step?.itemId !== input.item.id) throw new Error('Answer does not match current drop item');
    const state = answerConcept(prior && !prior.deleted ? { conceptId: prior.id, mastery: prior.mastery, memory: prior.memory, attempts: prior.attempts, firstLearnedAt: prior.firstLearnedAt, retentionChecks: prior.retentionChecks, activeMisconceptions: prior.activeMisconceptions } : undefined, input.item, grade.correct, input.confidence, input.now);
    const retentionChecks = step.mode === 'retention' && step.retentionDay
      ? { ...state.retentionChecks, [step.retentionDay]: { answeredAt: input.now, correct: grade.correct } }
      : state.retentionChecks;
    const concept: LearnConceptRow = { id: input.item.conceptId, mastery: state.mastery, memory: state.memory, attempts: state.attempts, firstLearnedAt: state.firstLearnedAt, retentionChecks, activeMisconceptions: state.activeMisconceptions, updatedAt: input.now, deleted: 0, deviceId: input.deviceId };
    const priorItem = await db.learnItems.get(input.item.id);
    const rating = updateItemRating(priorItem && !priorItem.deleted ? { itemId: priorItem.id, rating: priorItem.rating, attempts: priorItem.attempts, lastSeen: priorItem.lastSeen } : undefined, input.item.difficultySeed, prior?.mastery ?? 0.2, grade.correct, input.now);
    const item: LearnItemRow = { id: input.item.id, rating: rating.rating, attempts: rating.attempts, lastSeen: rating.lastSeen, updatedAt: input.now, deleted: 0, deviceId: input.deviceId };
    await db.learnConcepts.put(concept);
    await db.learnItems.put(item);
    await db.learnDrops.put({ ...current, drop: advanceDrop(current.drop), updatedAt: input.now });
    await db.ledger.add({ id: factId, dayKey: dayKey(input.now), mode: 'mind', kind: step.mode === 'retention' ? 'learn-retention' : 'learn-answer', refId: input.answerId,
      inputs: { itemId: input.item.id, conceptId: input.item.conceptId, correct: grade.correct, score: grade.score, confidence: input.confidence, dropId: input.dropId, retentionDay: step.retentionDay },
      updatedAt: input.now, deleted: 0, deviceId: input.deviceId });
  }));
}
