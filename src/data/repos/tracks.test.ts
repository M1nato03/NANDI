// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import * as v from 'valibot';
import raw from '../../../content/tracks/track.drone-tech.json';
import { createDb, type NandiDb } from '../db';
import { trackPackSchema } from '../packs/schemas';
import { completeTrackUnit, introduceTrackCards, recordModuleTest, saveTrackDraft, selectTrack, trackCardId, trackUnitId, type TrackDraft } from './tracks';

const pack = v.parse(trackPackSchema, raw);
const now = new Date('2026-10-12T12:00:00').getTime();
let serial = 0;
const opened: NandiDb[] = [];
function fresh() { const db = createDb(`tracks-test-${++serial}`); opened.push(db); return db; }
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });

it('saves a unit, shared cards and reward fact, then resumes after reopening the same database', async () => {
  const db = fresh();
  const draft: TrackDraft = { packId: pack.id, unitId: 'lift-thrust', day: '2026-10-12', step: 'cards', watched: false, answers: [0, 1, 2], confidence: [90, 65, 35] };
  await selectTrack(db, pack.id, now);
  await saveTrackDraft(db, draft, now);
  await completeTrackUnit(db, pack, draft, false, now);
  await completeTrackUnit(db, pack, draft, false, now);
  expect(await db.cards.count()).toBe(3);
  expect(await db.ledger.count()).toBe(1);
  expect(await db.lessonProg.get(trackUnitId(pack, draft.unitId))).toMatchObject({ doneDayKey: '2026-10-12', conf: 63 });
  db.close();
  const reopened = createDb(db.name); opened.push(reopened);
  expect((await reopened.settings.get('mind.activeTrack'))?.value).toBe(pack.id);
  expect((await reopened.settings.get('mind.trackDraft'))?.value).toBeNull();
  expect(await reopened.cards.get(trackCardId(pack, draft.unitId, 0))).toMatchObject({ due: '2026-10-12', box: 0 });
});

it('limits introductions to five across completed units and carries extras to the next day', async () => {
  const db = fresh();
  for (const id of ['lift-thrust', 'four-motors']) await db.lessonProg.put({ id: trackUnitId(pack, id), packId: pack.id, doneDayKey: '2026-10-12', updatedAt: now, deleted: 0, deviceId: 'test' });
  expect(await introduceTrackCards(db, [pack], now)).toBe(5);
  expect(await introduceTrackCards(db, [pack], now)).toBe(0);
  expect(await introduceTrackCards(db, [pack], now + 86_400_000)).toBe(1);
  expect(await db.cards.count()).toBe(6);
});

it('failed module test makes weak cards due today without changing mastered boxes', async () => {
  const db = fresh();
  const id = trackCardId(pack, 'lift-thrust', 0);
  await db.cards.add({ id, deckId: 'drone-tech', due: '2026-11-01', box: 5, reviews: 8, updatedAt: now, deleted: 0, deviceId: 'test' });
  const failed = await recordModuleTest(db, pack, 'how-flight-works', Array(10).fill(2), now);
  expect(failed.passed).toBe(false);
  expect(await db.cards.get(id)).toMatchObject({ due: '2026-10-12', box: 5, reviews: 8 });
  const passed = await recordModuleTest(db, pack, 'how-flight-works', pack.body.modules[0]!.units.flatMap(unit => unit.check.map(question => question.answer)).slice(0, 10), now);
  expect(passed).toEqual({ score: 100, passed: true });
  expect((await db.lessonProg.get('track-module:drone-tech:how-flight-works'))?.doneDayKey).toBe('2026-10-12');
});
