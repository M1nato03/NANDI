// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { getOrCreateDeviceId } from '../device';
import { createTaskRepos } from './tasks';
import { createTrainRepos } from './train';
import { DEFAULT_BREATH, saveCalmDone } from './calm';
import { saveChapterDone, saveIdeaDone } from './books';
import { reviewCard } from './learn';
import { savePuzzleRun } from './puzzleRuns';
import { saveLessonDone } from './learn-engine';
import { reconcileGamify } from './gamify';
import { nightStamp } from './night';
import type { Drop } from '../../core/learn/engine';
import type { CardRow, PuzzleRunRow } from '../types';

// Spec 571 §0.20 rule 3 (b2's call (a)): slot facts written in the night window carry `night: true`, stamped at write
// time with the bedtime then in force; outside it the inputs are exactly as before. Answer 3: today’s drop writes its
// learn-drop fact at its finishing write, and reconcileGamify's backstop never adds a second one.
let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const fresh = async (bedtime?: string) => {
  const db = createDb(`night-stamp-${++serial}-${Date.now()}`); opened.push(db);
  if (bedtime) await db.settings.put({ key: 'planner.bedtime', value: bedtime, updatedAt: 1, deleted: 0, deviceId: 'test' });
  return db;
};
const at = (day: string, time: string) => new Date(`${day}T${time}:00`).getTime();
const DAY = '2026-11-08';

describe('spec 571 rule 3: the night stamp at write time', () => {
  it('stamps inside the window only: the default 01:30 bedtime counts as set, and 04:30 is still night', async () => {
    const db = await fresh();
    expect(await nightStamp(db, at(DAY, '12:00'))).toEqual({});
    expect(await nightStamp(db, at(DAY, '23:50'))).toEqual({});
    expect(await nightStamp(db, at('2026-11-09', '01:45'))).toEqual({ night: true });
    expect(await nightStamp(db, at('2026-11-09', '04:30'))).toEqual({ night: true });
    expect(await nightStamp(db, at('2026-11-09', '05:00'))).toEqual({});
    const late = await fresh('23:30');
    expect(await nightStamp(late, at(DAY, '23:50'))).toEqual({ night: true });
  });

  it('a planned task done at 23:50 after a 23:30 bedtime is stamped; one done at noon is written exactly as before', async () => {
    const db = await fresh('23:30');
    const tasks = createTaskRepos(db, await getOrCreateDeviceId(db, at(DAY, '09:00')));
    for (const [id, time] of [['noon', '12:00'], ['late', '23:50']] as const) {
      await tasks.createTask({ id, title: 'A promise', size: 'S', estimateMin: 15, plannedSize: 'S', dayKey: DAY, scheduledStart: at(DAY, '09:00'), mustOrCould: 'must' }, at(DAY, '09:00'));
      await tasks.completeTask(id, at(DAY, time));
    }
    expect((await db.ledger.get('done:late'))?.inputs.night).toBe(true);
    expect('night' in (await db.ledger.get('done:noon'))!.inputs).toBe(false);
  });

  it('stamps a workout finished in the window, not one finished before bedtime', async () => {
    for (const [time, stamped] of [['22:30', false], ['23:40', true]] as const) {
      const db = await fresh('23:00');
      const train = createTrainRepos(db, 'test');
      await train.completeOnboarding({ track: 'bodyweight', days: [1, 3, 5], weeklyTarget: 3, restDay: 0, equipment: { gymAccess: false, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false }, heatModeEnabled: false, placement: { squat: 2 } }, at(DAY, '08:00'));
      const session = await train.startSession(at(DAY, '22:00'));
      await train.logSet(session.id, session.planned![0]!.exerciseId, 0, { reps: 5, loadKg: 0 }, at(DAY, '22:05'));
      await train.finishSession(session.id, at(DAY, time));
      expect((await db.ledger.get(`train-session:${session.id}`))?.inputs.night === true, time).toBe(stamped);
    }
  });

  it('stamps the rest walk, a Calm sit, a chapter, an idea sitting, a card and a solved board', async () => {
    const db = await fresh('23:00');
    const deviceId = await getOrCreateDeviceId(db, at(DAY, '09:00'));
    const night = at(DAY, '23:40');
    await createTrainRepos(db, deviceId).restDayCheck(night, 20);
    await saveCalmDone(db, { elapsedMs: 6 * 60_000, way: 'quiet', breath: DEFAULT_BREATH, startedAt: night - 6 * 60_000 }, night);
    await saveChapterDone(db, 'psychology', 'm1', night);
    await saveIdeaDone(db, { topicId: 'psychology', moduleId: 'm2', conceptId: 'c1' }, night);
    const card: CardRow = { id: 'card-1', deckId: 'greene', packId: 'p', itemId: 'i', box: 0, reviews: 0, due: DAY, updatedAt: 1, deleted: 0, deviceId };
    await db.cards.put(card);
    await reviewCard(db, card, true, true, night);
    const run = { id: 'run-1', type: 'sudoku', dayKey: DAY, daily: true, result: 'solved', updatedAt: 1, deleted: 0, deviceId } as unknown as PuzzleRunRow;
    await savePuzzleRun(db, run, night, true);
    const rows = (await db.ledger.toArray()).filter(row => ['rest', 'session', 'chapter', 'idea', 'card', 'board'].includes(row.kind));
    expect(rows.map(row => row.kind).sort()).toEqual(['board', 'card', 'chapter', 'idea', 'rest', 'session']);
    for (const row of rows) expect(row.inputs.night, row.kind).toBe(true);
  });
});

describe('spec 571 answer 3: the drop\'s learn-drop fact at its finishing write', () => {
  const drop = (day: string, chapter = false): Drop => ({ id: `drop:daily:${day}`, cursor: 0, ending: { kind: 'stopping-screen' },
    items: [{ itemId: 'lesson:s1', conceptId: 'c1', optionOrder: [], mode: 'new', lesson: 's1' }], ...(chapter ? { chapter: { topicId: 't', moduleId: 'm', kind: 'read' as const } } : {}) });
  const learnDrops = (db: NandiDb) => db.ledger.where('kind').equals('learn-drop').toArray();

  it('the last lesson writes it in the same transaction; reconcile then adds nothing (one fact, same inputs)', async () => {
    const db = await fresh();
    const now = at(DAY, '12:00');
    await db.learnDrops.put({ id: drop(DAY).id, drop: drop(DAY), updatedAt: now, deleted: 0, deviceId: 'test' });
    await saveLessonDone(db, drop(DAY), { stepId: 's1', conceptId: 'c1', dropId: drop(DAY).id, hookCorrect: true, spotCorrect: true, guidedFirstTry: [] }, 'test', now);
    const written = await learnDrops(db);
    expect(written).toEqual([expect.objectContaining({ id: `learn-drop:${DAY}`, mode: 'gamify', refId: DAY, dayKey: DAY, inputs: {}, updatedAt: now })]);
    await reconcileGamify(db, now + 60_000);
    await reconcileGamify(db, now + 120_000);
    expect(await learnDrops(db)).toEqual(written);
  });

  it('carries the chapter flag and, after bedtime, the bedtime and night stamps; reconcile keeps them', async () => {
    const db = await fresh('23:00');
    const now = at(DAY, '23:40');
    await db.learnDrops.put({ id: drop(DAY, true).id, drop: drop(DAY, true), updatedAt: now, deleted: 0, deviceId: 'test' });
    await saveLessonDone(db, drop(DAY, true), { stepId: 's1', conceptId: 'c1', dropId: drop(DAY).id, hookCorrect: true, spotCorrect: true, guidedFirstTry: [] }, 'test', now);
    const [fact] = await learnDrops(db);
    expect(fact?.inputs).toEqual({ afterBedtime: true, night: true, chapter: true });
    await reconcileGamify(db, now + 60_000);
    expect(await learnDrops(db)).toEqual([fact]);
  });

  it('an unfinished drop or another day’s drop writes nothing; reconcile alone (a drop finished by an older build) still writes it with the stamps', async () => {
    const db = await fresh();
    const now = at(DAY, '12:00');
    const two: Drop = { ...drop(DAY), items: [...drop(DAY).items, { itemId: 'lesson:s2', conceptId: 'c1', optionOrder: [], mode: 'new', lesson: 's2' }] };
    await saveLessonDone(db, two, { stepId: 's1', conceptId: 'c1', dropId: two.id, hookCorrect: true, spotCorrect: true, guidedFirstTry: [] }, 'test', now);
    await saveLessonDone(db, drop('2026-11-07'), { stepId: 's9', conceptId: 'c1', dropId: drop('2026-11-07').id, hookCorrect: true, spotCorrect: true, guidedFirstTry: [] }, 'test', now);
    expect(await learnDrops(db)).toEqual([]);
    // An older build finished today’s drop with a night lesson and no learn-drop fact: the backstop copies the stamp.
    const other = await fresh();
    const late = at('2026-11-09', '02:00');
    await other.learnDrops.put({ id: drop(DAY).id, drop: { ...drop(DAY), cursor: 1 }, updatedAt: late, deleted: 0, deviceId: 'test' });
    await other.ledger.add({ id: 'learn-lesson:s1', mode: 'learn', kind: 'learn-lesson', refId: 's1', dayKey: DAY, inputs: { dropId: drop(DAY).id, afterBedtime: true, night: true }, updatedAt: late, deleted: 0, deviceId: 'test' });
    await reconcileGamify(other, late);
    expect((await learnDrops(other)).map(row => row.inputs)).toEqual([{ afterBedtime: true, night: true }]);
  });

  it('economy.v10From is written once, on the first reconcile, and never moves', async () => {
    const db = await fresh();
    await reconcileGamify(db, at(DAY, '12:00'));
    await reconcileGamify(db, at('2026-11-10', '12:00'));
    expect((await db.settings.get('economy.v10From'))?.value).toBe(DAY);
  });
});
