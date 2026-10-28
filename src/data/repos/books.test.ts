import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb } from '../db';
import type { LearnDropRow, LedgerRow } from '../types';
import { saveChapterDone } from './books';

const opened: ReturnType<typeof createDb>[] = [];
function fresh() { const db = createDb(`books-${opened.length}-${Date.now()}`); opened.push(db); return db; }
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });

const NOON = new Date('2026-11-03T12:00:00').getTime();
const drop = (id: string, kind: 'read' | 'check', topicId = 'psychology', moduleId = 'psychology-ch1') =>
  ({ id, drop: { items: [], cursor: 1, chapter: { topicId, moduleId, kind } }, updatedAt: NOON, deleted: 0, deviceId: 't' }) as unknown as LearnDropRow;
const fact = (id: string, kind: string, refId: string, inputs: Record<string, unknown>, at = NOON): LedgerRow =>
  ({ id, dayKey: '2026-11-03', mode: 'mind', kind, refId, inputs, updatedAt: at, deleted: 0, deviceId: 't' });

it('spec 36 v2: a finished chapter records the steps it newly taught, its right first answers and the drops it was read in', async () => {
  const db = fresh();
  await db.learnDrops.bulkPut([drop('drop:daily:2026-11-03', 'read'), drop('drop:check:psychology:psychology-ch1:1', 'check'), drop('drop:check:other:other-ch1:1', 'check', 'other', 'other-ch1')]);
  await db.ledger.bulkPut([
    fact('learn-lesson:s1', 'learn-lesson', 's1', { dropId: 'drop:daily:2026-11-03' }),
    fact('learn-lesson:s2', 'learn-lesson', 's2', { dropId: 'drop:daily:2026-11-03' }),
    // A step taught in some other drop is not this chapter's.
    fact('learn-lesson:s9', 'learn-lesson', 's9', { dropId: 'drop:daily:2026-11-02' }),
    // Three questions: the first right, the second wrong then right on a retry (the first answer counts), the third right.
    fact('learn-answer:a1', 'learn-answer', 'a1', { dropId: 'drop:check:psychology:psychology-ch1:1', itemId: 'q1', correct: true }, NOON + 1),
    fact('learn-answer:a2', 'learn-answer', 'a2', { dropId: 'drop:check:psychology:psychology-ch1:1', itemId: 'q2', correct: false }, NOON + 2),
    fact('learn-answer:a3', 'learn-answer', 'a3', { dropId: 'drop:check:psychology:psychology-ch1:1', itemId: 'q2', correct: true }, NOON + 3),
    fact('learn-answer:a4', 'learn-answer', 'a4', { dropId: 'drop:check:psychology:psychology-ch1:1', itemId: 'q3', correct: true }, NOON + 4),
    // Another chapter's check is not this one's.
    fact('learn-answer:a5', 'learn-answer', 'a5', { dropId: 'drop:check:other:other-ch1:1', itemId: 'q9', correct: true }, NOON + 5),
  ]);
  await saveChapterDone(db, 'psychology', 'psychology-ch1', NOON + 10);
  const chapter = (await db.ledger.where('kind').equals('chapter').toArray())[0]!;
  expect(chapter.inputs).toMatchObject({ newSteps: 2, firstRight: 2, readDrops: ['drop:daily:2026-11-03'], afterBedtime: false });
  // Written once: finishing it again (a re-read) changes nothing.
  await saveChapterDone(db, 'psychology', 'psychology-ch1', NOON + 20, { rebuilt: true });
  expect(await db.ledger.where('kind').equals('chapter').count()).toBe(1);
});

it('spec 36 v2: a recall rebuild counts as one right answer', async () => {
  const db = fresh();
  await db.learnDrops.put(drop('drop:chapter:psychology:psychology-ch2:5', 'read', 'psychology', 'psychology-ch2'));
  await db.ledger.put(fact('learn-lesson:s3', 'learn-lesson', 's3', { dropId: 'drop:chapter:psychology:psychology-ch2:5' }));
  await saveChapterDone(db, 'psychology', 'psychology-ch2', NOON + 10, { rebuilt: true });
  const chapter = (await db.ledger.where('kind').equals('chapter').toArray())[0]!;
  expect(chapter.inputs).toMatchObject({ newSteps: 1, firstRight: 1, readDrops: ['drop:chapter:psychology:psychology-ch2:5'] });
});
