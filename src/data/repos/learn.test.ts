// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { completeLesson, reviewCard, reviewItem, saveLessonDraft, type LessonDraft } from './learn';
import { savePuzzleRun } from './puzzleRuns';

let serial = 0;
const opened: NandiDb[] = [];
function fresh() { const db = createDb(`learn-test-${++serial}`); opened.push(db); return db; }
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const now = new Date('2026-10-11T12:00:00').getTime();
const draft: LessonDraft = { courseId: 'gita', lessonId: 'g1', day: '2026-10-11', review: false, step: 6, order: { guess: [1, 0], transfer: [1, 0], why: [1, 0] }, picked: { guess: 0, transfer: 1, why: 1 }, confidence: 'sure' };
const answers = { guess: 1, transfer: 0, why: 0 };

it('04 §7 test 7: lesson completion is idempotent, limits a course, and review mode writes no cards or facts', async () => {
  const db = fresh();
  await saveLessonDraft(db, draft, now);
  await completeLesson(db, draft, 'lessons.gita-restless-mind', 2, answers, false, now);
  await completeLesson(db, draft, 'lessons.gita-restless-mind', 2, answers, false, now);
  expect(await db.cards.count()).toBe(2);
  expect(await db.ledger.count()).toBe(1);
  expect(await db.lessonProg.get('g1')).toMatchObject({ guessOk: true, transferOk: true, whyOk: true, conf: 90 });
  await expect(completeLesson(db, { ...draft, lessonId: 'g2' }, 'lessons.gita-restless-mind', 2, answers, false, now)).rejects.toThrow(/One new lesson/);
  await completeLesson(db, { ...draft, review: true }, 'lessons.gita-restless-mind', 2, answers, false, now);
  expect(await db.cards.count()).toBe(2);
  expect(await db.ledger.count()).toBe(1);
});

it('card and item reviews update schedules and ledger facts once per day', async () => {
  const db = fresh();
  const card = { id: 'l4-1', deckId: 'greene', due: '2026-10-01', box: 3, last: '2026-09-24', reviews: 5, updatedAt: now - 1, deleted: 0 as const, deviceId: 'test' };
  await db.cards.add(card);
  await reviewCard(db, card, true, false, now);
  expect(await db.cards.get(card.id)).toMatchObject({ box: 4, due: '2026-10-25', reviews: 6 });
  await reviewCard(db, card, false, false, now);
  expect(await db.ledger.count()).toBe(1);
  await reviewItem(db, null, 'scenario-1', 'scenario', 1000, true, false, true, now);
  expect(await db.deckProg.get('scenario-1')).toMatchObject({ b: 1, due: '2026-11-01' });
  expect(await db.ratings.get('people')).toMatchObject({ value: 1020, n: 1 });
  expect((await db.ledger.get('card:2026-10-11:scenario-1'))?.inputs.afterBedtime).toBe(true);
  await reviewItem(db, null, 'scenario-1', 'scenario', 1000, true, false, true, now);
  expect(await db.ratings.get('people')).toMatchObject({ n: 1 });
});

it('daily board completion records one fact and intro practice records none', async () => {
  const db = fresh();
  const run = { id: 'daily:2026-10-11:sudoku:easy', type: 'sudoku' as const, dayKey: '2026-10-11', daily: true, result: 'solved' as const, updatedAt: now, deleted: 0 as const, deviceId: 'test' };
  await savePuzzleRun(db, run, now, true);
  await savePuzzleRun(db, run, now, false);
  await savePuzzleRun(db, { ...run, id: 'intro:2026-10-11:sudoku', daily: false, intro: true }, now, false);
  expect(await db.ledger.count()).toBe(1);
  expect((await db.puzzleRuns.get(run.id))?.afterBedtime).toBe(true);
  expect((await db.ledger.get(`board:${run.id}`))?.inputs.afterBedtime).toBe(true);
});
