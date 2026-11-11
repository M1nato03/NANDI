import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from './db';
import { getOrCreateDeviceId } from './device';
import { createTaskRepos } from './repos/tasks';
import { createLedgerRepos } from './repos/ledger';
import { createSettingsRepos } from './repos/settings';

const indexes: Record<string, string[]> = {
  tasks: ['status', 'dayKey', 'scheduledStart', 'category', 'parentId', 'updatedAt'],
  taskEvents: ['taskId', 'kind', 'at'],
  focus: ['taskId', 'startedAt'],
  reminders: ['refType', 'refId', 'at'],
  plans: ['lessonId', 'madeDayKey'],
  exercises: ['pattern', 'source'],
  ladders: ['pattern'],
  programs: ['track'],
  exState: [],
  sessions: ['dayKey', 'status'],
  sets: ['sessionId', 'exerciseId'],
  prs: ['exerciseId', 'kind'],
  puzzleRuns: ['type', 'dayKey', 'seed'],
  cards: ['deckId', 'due'],
  deckProg: ['due'],
  lessonProg: ['packId'],
  ratings: [],
  flags: ['refId'],
  unlocks: ['kind'],
  packs: ['kind', 'version'],
  ledger: ['dayKey', 'mode', 'kind'],
  quests: ['week', 'status', 'sourceId', 'updatedAt'],
  inventory: ['kind'],
  dailyLog: [],
  settings: [],
  learnConcepts: [],
  learnItems: ['lastSeen'],
  learnDrops: [],
  privatePacks: [],
  phoneUsageMinutes: ['dayKey', 'packageName'],
  skillAttempts: ['trackId', 'lessonId', 'dayKey', 'status', 'retryDue'],
  notebookPages: ['trackId', 'createdAt'],
  notebookVersions: ['pageId', 'createdAt'],
  bookGameStates: [],
  questPhotos: ['questFactId', 'takenAt'],
};

let sequence = 0;
const openDbs: NandiDb[] = [];
function freshDb(): NandiDb {
  const db = createDb(`nandi-test-${++sequence}`);
  openDbs.push(db);
  return db;
}

afterEach(async () => {
  for (const db of openDbs.splice(0)) await db.delete();
});

describe('Dexie v3', () => {
  it('opens with exactly the specified tables and indexes', async () => {
    const db = freshDb();
    await db.open();
    expect(db.tables.map((table) => table.name).sort()).toEqual(Object.keys(indexes).sort());
    for (const table of db.tables) {
      const primaryKey = table.name === 'dailyLog' ? 'dayKey' : table.name === 'settings' ? 'key' : 'id';
      expect(table.schema.primKey.name).toBe(primaryKey);
      expect(table.schema.indexes.map((index) => index.name)).toEqual(indexes[table.name]);
    }
  });

  it('stamps a new entity and retains its id on update', async () => {
    const db = freshDb();
    const tasks = createTaskRepos(db, 'device-a').tasks;
    const first = await tasks.put({ title: 'Start', status: 'open', dayKey: '2026-10-07' }, 100);
    expect(first.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(first).toMatchObject({ updatedAt: 100, deleted: 0, deviceId: 'device-a' });
    const second = await tasks.put({ ...first, title: 'Finish' }, 200);
    expect(second.id).toBe(first.id);
    expect(second.updatedAt).toBe(200);
    expect(await db.tasks.count()).toBe(1);
  });

  it('soft deletes a row but retains the tombstone', async () => {
    const db = freshDb();
    const tasks = createTaskRepos(db, 'device-a').tasks;
    const row = await tasks.put({ title: 'Archive', status: 'open', dayKey: '2026-10-07' }, 100);
    await tasks.softDelete(row.id, 200);
    expect(await tasks.list()).toEqual([]);
    expect(await tasks.get(row.id)).toMatchObject({ deleted: 1, updatedAt: 200 });
  });

  it('keeps natural keys and one ledger fact per idempotent id', async () => {
    const db = freshDb();
    const settings = createSettingsRepos(db, 'device-a').settings;
    await settings.put({ key: 'retired', value: false }, 100);
    await settings.put({ key: 'retired', value: true }, 200);
    expect(await db.settings.count()).toBe(1);
    const ledger = createLedgerRepos(db, 'device-a').ledger;
    const fact = { id: 'task-done:task-1', kind: 'task-done', refId: 'task-1', dayKey: '2026-10-07', mode: 'tasks', inputs: { plannedSize: 'S' } };
    const first = await ledger.put(fact, 100);
    const second = await ledger.put({ ...fact, inputs: { plannedSize: 'L' } }, 200);
    expect(second).toEqual(first);
    expect(await ledger.list()).toHaveLength(1);
    expect(await db.ledger.count()).toBe(1);
    expect(() => ledger.softDelete(fact.id, 300)).toThrow('append-only');
  });

  it('returns the same device id across calls', async () => {
    const db = freshDb();
    const first = await getOrCreateDeviceId(db, 100);
    const second = await getOrCreateDeviceId(db, 200);
    expect(second).toBe(first);
    expect(first).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(await db.settings.get('deviceId')).toMatchObject({ value: first, deviceId: first });
  });
});

describe('Dexie v8 (spec 660): quest photos', () => {
  it("v7 → v8 adds only the empty questPhotos table; spec 40's bookGameStates rows survive unchanged", async () => {
    const name = `nandi-test-v7-${++sequence}`;
    const { default: Dexie } = await import('dexie');
    const old = new Dexie(name);
    old.version(7).stores({ ledger: 'id, dayKey, mode, kind', bookGameStates: 'id', settings: 'key' });
    await old.open();
    const game = { id: 'richest-man-in-babylon', bookId: 'richest-man-in-babylon', gameId: 'arkad-year', contentVersion: 1, state: { month: 3, history: [1, 2, 3] }, updatedAt: 5, deleted: 0, deviceId: 'a' };
    await old.table('bookGameStates').put(game);
    await old.table('ledger').put({ id: 'x', kind: 'chapter', refId: 'b:c', mode: 'read', dayKey: '2026-11-12', inputs: {}, updatedAt: 1, deleted: 0, deviceId: 'a' });
    old.close();
    const db = createDb(name);
    openDbs.push(db);
    await db.open();
    expect(db.verno).toBe(8);
    expect(await db.bookGameStates.get('richest-man-in-babylon')).toEqual(game);
    expect(await db.ledger.count()).toBe(1);
    expect(await db.questPhotos.count()).toBe(0);
  });
});
