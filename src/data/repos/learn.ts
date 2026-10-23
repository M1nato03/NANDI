import { ulid } from 'ulidx';
import { trackWrite } from '../../core/pendingWrites';
import { addDays, cardAfterAnswer, itemAfterAnswer, nextRating, type Confidence } from '../../core/learn/learn';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import type { CardRow, DeckProgRow, LessonProgRow, PlanRow, PuzzleRunRow } from '../types';
import type { DeckPack } from '../../core/learn/deck';

export type LessonDraft = { courseId: string; lessonId: string; review: boolean; day: string; step: number; order: { guess: number[]; transfer: number[]; why: number[] }; picked: { guess?: number; transfer?: number; why?: number }; confidence?: Confidence; planIf?: string; planThen?: string; savedPlan?: boolean };
const draftKey = 'mind.lessonDraft';
export async function seedDeckCards(db: NandiDb, deck: DeckPack, now = Date.now()): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.cards, async () => {
    for (const card of deck.body.cards) {
      if (await db.cards.get(card.id)) continue;
      await db.cards.add({ id: card.id, deckId: 'greene', packId: deck.id, itemId: card.id, topic: card.topic, box: 0, reviews: 0, due: dayKey(now), updatedAt: now, deleted: 0, deviceId });
    }
  }));
}
/** Caller must own a ledger write transaction. */
export async function putDailyBoardFact(db: NandiDb, run: PuzzleRunRow, afterBedtime: boolean, now: number): Promise<void> {
  if (!run.daily || run.result !== 'solved' || !run.dayKey) return;
  // A solved daily case pays as a case, not also as the daily board (batch 3 g). Facts already written keep paying.
  if (run.type === 'mystery') return;
  const id = `board:${run.id}`;
  if (await db.ledger.get(id)) return;
  await db.ledger.add({ id, dayKey: run.dayKey, mode: 'mind', kind: 'board', refId: run.id, inputs: { daily: true, afterBedtime, type: run.type, diff: run.diff ?? '', hintsUsed: run.hintsUsed ?? 0 }, updatedAt: now, deleted: 0, deviceId: run.deviceId });
}
export async function saveLessonDraft(db: NandiDb, draft: LessonDraft | null, now = Date.now()): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: draftKey, value: draft, updatedAt: now, deleted: 0, deviceId }));
}
export async function loadLessonDraft(db: NandiDb): Promise<LessonDraft | null> {
  const value = (await db.settings.get(draftKey))?.value;
  if (!value || typeof value !== 'object' || !('lessonId' in value)) return null;
  return value as LessonDraft;
}

export async function completeLesson(db: NandiDb, draft: LessonDraft, packId: string, cards: number, answers: { guess: number; transfer: number; why: number }, afterBedtime = false, now = Date.now()): Promise<void> {
  if (draft.review) { await saveLessonDraft(db, null, now); return; }
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.lessonProg, db.cards, db.plans, db.ledger, db.settings], async () => {
    const existing = await db.lessonProg.get(draft.lessonId);
    if (existing?.doneDayKey) return;
    const day = dayKey(now);
    const courseToday = await db.lessonProg.where('packId').equals(packId).filter(row => row.doneDayKey === day && !row.deleted).first();
    if (courseToday) throw new Error('One new lesson per course per day');
    const prog: LessonProgRow = { id: draft.lessonId, packId, doneDayKey: day, guessOk: draft.picked.guess != null && draft.order.guess[draft.picked.guess] === answers.guess, conf: draft.confidence === 'sure' ? 90 : draft.confidence === 'think' ? 65 : 35, transferOk: draft.picked.transfer != null && draft.order.transfer[draft.picked.transfer] === answers.transfer, whyOk: draft.picked.why != null && draft.order.why[draft.picked.why] === answers.why, updatedAt: now, deleted: 0, deviceId };
    await db.lessonProg.put(prog);
    for (let index = 0; index < cards; index++) {
      const id = `${draft.courseId}-${draft.lessonId}-${index + 1}`;
      if (await db.cards.get(id)) continue;
      const row: CardRow = { id, deckId: draft.courseId, packId, itemId: draft.lessonId, box: 0, reviews: 0, due: addDays(day, 1), updatedAt: now, deleted: 0, deviceId };
      await db.cards.add(row);
    }
    if (draft.savedPlan && draft.planIf && draft.planThen) {
      const plan: PlanRow = { id: ulid(now), lessonId: draft.lessonId, madeDayKey: day, ifText: draft.planIf, thenText: draft.planThen, fired: null, updatedAt: now, deleted: 0, deviceId };
      await db.plans.add(plan);
    }
    const id = `lesson:${draft.lessonId}`;
    if (!(await db.ledger.get(id))) await db.ledger.add({ id, dayKey: day, mode: 'mind', kind: 'lesson', refId: draft.lessonId, inputs: { courseId: draft.courseId, afterBedtime }, updatedAt: now, deleted: 0, deviceId });
    await db.settings.put({ key: draftKey, value: null, updatedAt: now, deleted: 0, deviceId });
  }));
}
export async function answerPlan(db: NandiDb, plan: PlanRow, answer: NonNullable<PlanRow['fired']>, now = Date.now()): Promise<void> {
  await trackWrite(() => db.plans.put({ ...plan, fired: answer, updatedAt: now }));
}
export async function reviewCard(db: NandiDb, card: CardRow, correct: boolean, afterBedtime = false, now = Date.now()): Promise<void> {
  const day = dayKey(now);
  await trackWrite(() => db.transaction('rw', [db.cards, db.ledger], async () => {
    const current = await db.cards.get(card.id);
    if (!current || current.deleted) return;
    await db.cards.put({ ...cardAfterAnswer(current, correct, day), updatedAt: now });
    const id = `card:${day}:${card.id}`;
    if (!(await db.ledger.get(id))) await db.ledger.add({ id, dayKey: day, mode: 'mind', kind: 'card', refId: `${day}:${card.id}`, inputs: { afterBedtime, correct }, updatedAt: now, deleted: 0, deviceId: current.deviceId });
  }));
}
export async function reviewItem(db: NandiDb, item: DeckProgRow | null, id: string, type: string, difficulty: number, correct: boolean, hinted: boolean, afterBedtime = false, now = Date.now()): Promise<void> {
  const day = dayKey(now), deviceId = item?.deviceId ?? await getOrCreateDeviceId(db, now);
  const skill = type === 'mystery' ? 'detective' : 'people';
  await trackWrite(() => db.transaction('rw', [db.deckProg, db.ratings, db.ledger], async () => {
    const current = await db.deckProg.get(id);
    if (current?.last === day) return;
    await db.deckProg.put({ ...itemAfterAnswer(current ?? { id, due: day, updatedAt: now, deleted: 0, deviceId }, correct, day, type), updatedAt: now });
    const rating = await db.ratings.get(skill);
    await db.ratings.put({ id: skill, value: nextRating(rating?.value ?? 1000, rating?.n ?? 0, difficulty, correct ? (hinted ? 0.6 : 1) : 0), n: (rating?.n ?? 0) + 1, updatedAt: now, deleted: 0, deviceId });
    const factId = `card:${day}:${id}`;
    if (!(await db.ledger.get(factId))) await db.ledger.add({ id: factId, dayKey: day, mode: 'mind', kind: 'card', refId: `${day}:${id}`, inputs: { afterBedtime, correct }, updatedAt: now, deleted: 0, deviceId });
  }));
}
export async function hideReview(db: NandiDb, refId: string, now = Date.now()): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.flags.put({ id: ulid(now), refId, kind: 'hidden', hidden: true, at: now, updatedAt: now, deleted: 0, deviceId }));
}
