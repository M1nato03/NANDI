// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup, QUEST_PHOTO_TABLE } from '../backup';
import { jarActs } from '../../core/yatra/jar';
import { QUEST_KIND, QUEST_MODE, questDoneId, questStones, readSafety, realityCheck, SAFETY_ASKED_KEY } from '../../core/quests660/quests';
import { acceptQuest, addQuestPhoto, deleteAllQuestPhotos, deleteQuestEntry, finishQuest, fitWithin, ownQuests, QUEST_PHOTO, questPhotoUsage, saveSafety, skipQuest, swapQuest, writeOwnQuest } from './quests660';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const freshDb = () => { const db = createDb(`quests660-${++serial}`); opened.push(db); return db; };
const NOON = new Date('2026-11-13T12:00:00').getTime();
const LATE = new Date('2026-11-13T23:45:00').getTime();
const DAY = '2026-11-13';
const stamp = { updatedAt: 1, deleted: 0 as const, deviceId: 'device-a' };
const mine = async (db: NandiDb) => (await db.ledger.toArray()).filter(row => row.mode === QUEST_MODE);

describe('spec 660 repo: facts in mode quests660 only, every write idempotent', () => {
  it('accept, swap and skip write one fact each however often they are tapped; Plan\'s quests table is never touched', async () => {
    const db = freshDb();
    for (let i = 0; i < 3; i++) {
      await acceptQuest(db, { id: 'mor-bag-reset', minutes: 15 }, 'board', NOON + i);
      await swapQuest(db, 'kapi-five-red', NOON + i);
      await skipQuest(db, 'nandi-run-game', NOON + i);
    }
    expect((await mine(db)).map(row => row.kind).sort()).toEqual([QUEST_KIND.accept, QUEST_KIND.skip, QUEST_KIND.swap]);
    expect(await db.quests.count()).toBe(0);
  });

  it('write your own: a fact of its own (≤ 80 characters), shown back as a board quest; never the quests table', async () => {
    const db = freshDb();
    const own = await writeOwnQuest(db, { text: `  Call grandma about the recipe ${'x'.repeat(90)}`, minutes: 15, where: 'home' }, NOON);
    expect(String(own.inputs.text)).toHaveLength(80);
    const [quest] = ownQuests(await db.ledger.toArray());
    expect(quest).toMatchObject({ id: own.id, minutes: 15, where: ['home'], predicts: false });
    expect(await db.quests.count()).toBe(0);
    await expect(writeOwnQuest(db, { text: '   ', minutes: 5, where: 'home' }, NOON)).rejects.toThrow();
  });

  it('finishing twice the same day keeps one fact (one stone), with the latest answers and the first time', async () => {
    const db = freshDb();
    await finishQuest(db, { id: 'courage-tell-them', minutes: 5 }, { fear: 4, prediction: 'awkward', outcome: 'fine', felt: 2 }, NOON);
    await finishQuest(db, { id: 'courage-tell-them', minutes: 5 }, { fear: 4, prediction: 'awkward', outcome: 'better', felt: 1 }, NOON + 60_000);
    const facts = await db.ledger.toArray();
    const done = facts.filter(row => row.kind === QUEST_KIND.done);
    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({ id: questDoneId('courage-tell-them', DAY), updatedAt: NOON, inputs: { outcome: 'better', felt: 1, fear: 4, prediction: 'awkward', minutes: 5 } });
    expect(questStones(facts)).toHaveLength(1);
  });

  it('a quest finished in the night window carries the night stamp and pays nothing', async () => {
    const db = freshDb();
    await db.settings.bulkPut([{ key: 'economy.v12From', value: DAY, ...stamp }, { key: 'planner.bedtime', value: '23:00', ...stamp }]);
    const fact = await finishQuest(db, { id: 'kachhua-five-good', minutes: 5 }, { outcome: 'fine' }, LATE);
    expect(fact.inputs.night).toBe(true);
    expect(jarActs(await db.ledger.toArray(), [], undefined, DAY)).toEqual([]);
  });

  it('double pay: Chiku\'s 10 pages wraps today\'s chapter, so the jar pays the quest\'s minutes once; the chapter fact stays', async () => {
    const db = freshDb();
    await db.ledger.put({ id: `chapter:book:c1`, kind: 'chapter', refId: 'book:c1', mode: 'read', dayKey: DAY, inputs: {}, ...stamp, updatedAt: NOON - 1000 });
    const fact = await finishQuest(db, { id: 'chiku-new-spot', minutes: 15, door: 'read' }, { outcome: 'fine' }, NOON);
    expect(fact.inputs.wraps).toBe('chapter:book:c1');
    const acts = jarActs(await db.ledger.toArray(), [], undefined, DAY);
    expect(acts.map(act => [act.kind, act.minutes])).toEqual([['quest', 5]]);
    expect(await db.ledger.get('chapter:book:c1')).toBeDefined();
  });

  it('the safety answer stores three switches and "asked", nothing else', async () => {
    const db = freshDb();
    await saveSafety(db, { strangers: true, transit: false, afterDark: false }, NOON);
    expect(readSafety(await db.settings.toArray())).toEqual({ strangers: true, transit: false, afterDark: false });
    expect((await db.settings.get(SAFETY_ASKED_KEY))?.value).toBe(true);
    expect((await db.settings.toArray()).some(row => /gender|hostel/i.test(row.key) || /gender|hostel/i.test(JSON.stringify(row.value)))).toBe(false);
  });

  it('a week of quest facts round-trips a backup: the same stones and Reality Check', async () => {
    const db = freshDb();
    await db.settings.bulkPut([{ key: 'deviceId', value: 'device-a', ...stamp }]);
    const days = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];
    for (const [i, day] of days.entries()) {
      const at = new Date(`${day}T12:00:00`).getTime();
      await finishQuest(db, { id: `courage-step-${i}`, minutes: 5 }, { fear: 4, prediction: i % 2 ? 'ignore' : 'freeze', outcome: i === 3 ? 'happened' : 'fine', felt: 2 }, at);
    }
    const before = await db.ledger.toArray();
    const file = await exportBackup(db, new Date(2026, 10, 13, 13));
    const other = freshDb();
    await importBackup(other, file);
    const after = await other.ledger.toArray();
    expect(questStones(after)).toEqual(questStones(before));
    expect(realityCheck(after)).toEqual(realityCheck(before));
  });
});

describe('spec 660 §2.4: quest photos stay on this phone', () => {
  const blob = (bytes: number) => new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' });
  const finished = async (db: NandiDb, id = 'kapi-five-red') => (await finishQuest(db, { id, minutes: 5 }, { outcome: 'fine' }, NOON)).id;

  it('shrinks to a 1280 px long edge, never enlarges', () => {
    expect(fitWithin(4000, 3000)).toEqual({ w: 1280, h: 960 });
    expect(fitWithin(900, 1600)).toEqual({ w: 720, h: 1280 });
    expect(fitWithin(800, 600)).toEqual({ w: 800, h: 600 });
  });

  it('one photo per finished quest, named by its fact; refused over 1.5 MB, unshrunk, past 200 MB, or before the quest is done', async () => {
    const db = freshDb();
    const id = await finished(db);
    expect(await addQuestPhoto(db, 'quest660:nope:2026-11-13', { blob: blob(10), w: 10, h: 10 }, NOON)).toMatchObject({ ok: false });
    expect(await addQuestPhoto(db, id, { blob: blob(QUEST_PHOTO.maxBytes + 1), w: 10, h: 10 }, NOON)).toMatchObject({ ok: false });
    expect(await addQuestPhoto(db, id, { blob: blob(10), w: 2000, h: 10 }, NOON)).toMatchObject({ ok: false });
    const first = await addQuestPhoto(db, id, { blob: blob(1000), w: 10, h: 10 }, NOON);
    const second = await addQuestPhoto(db, id, { blob: blob(2000), w: 10, h: 10 }, NOON + 1);
    expect(first.ok && second.ok).toBe(true);
    expect(await db.questPhotos.count()).toBe(1);
    expect((await db.ledger.get(id))?.inputs.photoId).toBe(second.ok ? second.id : '');
    await db.questPhotos.put({ id: 'big', questFactId: 'other', blob: blob(1), w: 1, h: 1, bytes: QUEST_PHOTO.totalBytes - 1500, takenAt: 0 });
    expect(await addQuestPhoto(db, id, { blob: blob(2000), w: 10, h: 10 }, NOON + 2)).toMatchObject({ ok: false });
    expect((await questPhotoUsage(db)).count).toBe(2);
  });

  it('deleting the quest deletes its photo in the same transaction; "delete all" keeps the quests', async () => {
    const db = freshDb();
    const a = await finished(db, 'kapi-five-red');
    const b = await finished(db, 'mor-bag-reset');
    await addQuestPhoto(db, a, { blob: blob(10), w: 10, h: 10 }, NOON);
    await addQuestPhoto(db, b, { blob: blob(10), w: 10, h: 10 }, NOON);
    await deleteQuestEntry(db, a, NOON + 5);
    expect((await db.ledger.get(a))?.deleted).toBe(1);
    expect(await db.questPhotos.where('questFactId').equals(a).count()).toBe(0);
    await deleteAllQuestPhotos(db);
    expect(await db.questPhotos.count()).toBe(0);
    expect((await db.ledger.get(b))?.deleted).toBe(0);
    expect((await db.ledger.get(b))?.inputs.photoId).toBeUndefined();
  });

  it('never in a backup file; a restore on the same phone keeps them; a new phone gets none (the fact still names it)', async () => {
    const db = freshDb();
    await db.settings.bulkPut([{ key: 'deviceId', value: 'device-a', ...stamp }]);
    const id = await finished(db);
    const added = await addQuestPhoto(db, id, { blob: blob(500), w: 10, h: 10 }, NOON);
    const file = await exportBackup(db, new Date(2026, 10, 13, 13));
    const table = file.dexie.data.data.find(entry => entry.tableName === QUEST_PHOTO_TABLE);
    expect(table?.rows).toEqual([]);
    expect(file.dexie.data.tables.find(entry => entry.name === QUEST_PHOTO_TABLE)?.rowCount).toBe(0);
    await importBackup(db, file);
    expect(await db.questPhotos.count()).toBe(1);
    const other = freshDb();
    await importBackup(other, file);
    expect(await other.questPhotos.count()).toBe(0);
    expect((await other.ledger.get(id))?.inputs.photoId).toBe(added.ok ? added.id : '');
  });

  it('b2 12 Nov: a restore drops the photos of quests the restored ledger does not hold, and keeps the rest', async () => {
    const db = freshDb();
    await db.settings.bulkPut([{ key: 'deviceId', value: 'device-a', ...stamp }]);
    const kept = await finished(db, 'kapi-five-red');
    await addQuestPhoto(db, kept, { blob: blob(500), w: 10, h: 10 }, NOON);
    const file = await exportBackup(db, new Date(2026, 10, 13, 13));
    // After the backup: one more quest with a photo, which the file does not know.
    const later = await finished(db, 'mor-bag-reset');
    await addQuestPhoto(db, later, { blob: blob(700), w: 10, h: 10 }, NOON + 1);
    expect(await db.questPhotos.count()).toBe(2);
    await importBackup(db, file);
    expect((await db.questPhotos.toArray()).map(photo => photo.questFactId)).toEqual([kept]);
    expect((await questPhotoUsage(db)).bytes).toBe(500);
  });
});
