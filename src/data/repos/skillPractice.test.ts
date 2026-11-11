// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup, previewBackup, validateBackup } from '../backup';
import { dueRetries, finishAttempt, recordChange, startAttempt } from './skillPractice';
import { deletePage, deleteVersion, readPage, revisePage, savePage } from './notebook';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const fresh = () => { const db = createDb(`skill-${++serial}`); opened.push(db); return db; };
const at = (iso: string) => new Date(iso).getTime();
const lesson = { trackId: 'practice-fixture', lessonId: 'say-1', variantId: 'say-1-a' };
const page = { trackId: 'practice-fixture', lessonId: 'say-1', title: 'Ask first', prompt: 'Pick the best first line.', answer: 'Could I borrow the lab key before 3 pm?',
  checklist: [{ text: 'The ask is in the first line.', ticked: true }], status: 'practised' as const };

describe('spec 43: practice runs', () => {
  it('a run starts, keeps its change check, finishes once and sets its retry from the 04:00 day', async () => {
    const db = fresh();
    const id = await startAttempt(db, lesson, at('2026-11-03T10:00:00'));
    expect(await db.skillAttempts.get(id)).toMatchObject({ status: 'started', dayKey: '2026-11-03', retryDue: null, rights: 0 });
    await recordChange(db, id, 'I was not well on Monday and Tuesday.', 'near', at('2026-11-03T10:01:00'));
    const done = await finishAttempt(db, id, { answer: 'Could I borrow the lab key before 3 pm?', result: 'right' }, undefined, at('2026-11-03T10:03:00'));
    expect(done).toMatchObject({ status: 'finished', retryDue: '2026-11-06', rights: 1, change: { result: 'near' }, fresh: { result: 'right' } });
    // A second finish changes nothing (no double count).
    const again = await finishAttempt(db, id, { answer: 'x', result: 'wrong' }, undefined, at('2026-11-03T11:00:00'));
    expect(again.retryDue).toBe('2026-11-06');
  });

  it('a wrong fresh answer is due next day; a retry takes the schedule over, so the first run is no longer due', async () => {
    const db = fresh();
    const first = await startAttempt(db, lesson, at('2026-11-03T10:00:00'));
    await finishAttempt(db, first, { answer: 'Sorry to bother you.', result: 'wrong' }, undefined, at('2026-11-03T10:03:00'));
    expect((await dueRetries(db, 'practice-fixture', '2026-11-03')).map(row => row.id)).toEqual([]);
    expect((await dueRetries(db, 'practice-fixture', '2026-11-04')).map(row => row.id)).toEqual([first]);
    // Overdue waits without penalty: still due a week later.
    expect((await dueRetries(db, 'practice-fixture', '2026-11-11')).map(row => row.id)).toEqual([first]);
    const retry = await startAttempt(db, { ...lesson, retryOf: first }, at('2026-11-05T09:00:00'));
    await finishAttempt(db, retry, { answer: 'Could I borrow the lab key before 3 pm?', result: 'right' }, undefined, at('2026-11-05T09:02:00'));
    expect((await db.skillAttempts.get(first))?.retryDue).toBeNull();
    expect((await dueRetries(db, 'practice-fixture', '2026-11-08')).map(row => row.id)).toEqual([retry]);
  });

  it('a self-checked answer keeps no words in the run: they live on the page', async () => {
    const db = fresh();
    const { pageId } = await savePage(db, page, at('2026-11-03T10:02:00'));
    const id = await startAttempt(db, { ...lesson, variantId: 'say-1-b' }, at('2026-11-03T10:00:00'));
    const done = await finishAttempt(db, id, { answer: 'Could you water my plants this weekend?', result: 'self' }, pageId, at('2026-11-03T10:03:00'));
    expect(done.fresh).toEqual({ result: 'self' });
    expect(done.pageId).toBe(pageId);
  });
});

describe('spec 43: notebook pages', () => {
  it('saving makes version 1 the baseline; a revision adds a version with the same prompt and keeps the old one', async () => {
    const db = fresh();
    const { pageId, versionId } = await savePage(db, page, at('2026-11-03T10:00:00'));
    await revisePage(db, pageId, { answer: 'Could I borrow the lab key before 3 pm today?', checklist: page.checklist, status: 'practised' }, at('2026-11-04T10:00:00'));
    const read = (await readPage(db, pageId))!;
    expect(read.versions.map(row => row.version)).toEqual([2, 1]);
    expect(read.versions[0]!.prompt).toBe(page.prompt);
    expect(read.baseline).toMatchObject({ id: versionId, version: 1 });
  });

  it('deleting the baseline version says unavailable, never silently picks another', async () => {
    const db = fresh();
    const { pageId, versionId } = await savePage(db, page, at('2026-11-03T10:00:00'));
    await revisePage(db, pageId, { answer: 'Second try', checklist: [], status: 'practised' }, at('2026-11-04T10:00:00'));
    await deleteVersion(db, versionId, at('2026-11-05T10:00:00'));
    const read = (await readPage(db, pageId))!;
    expect(read.baseline).toBe('unavailable');
    expect(read.versions.map(row => row.version)).toEqual([2]);
    expect((await db.notebookVersions.get(versionId))).toMatchObject({ deleted: 1, answer: '', prompt: '' });
  });

  it('deleting a page clears its words, every version and the runs saved to it, in one step', async () => {
    const db = fresh();
    const { pageId } = await savePage(db, page, at('2026-11-03T10:00:00'));
    await revisePage(db, pageId, { answer: 'Second try', checklist: [], status: 'prepared' }, at('2026-11-04T10:00:00'));
    const id = await startAttempt(db, lesson, at('2026-11-03T09:58:00'));
    await finishAttempt(db, id, { answer: 'Could I borrow the lab key before 3 pm?', result: 'right' }, pageId, at('2026-11-03T10:00:00'));
    await deletePage(db, pageId, at('2026-11-06T10:00:00'));
    expect(await readPage(db, pageId)).toBeNull();
    expect(await db.notebookPages.get(pageId)).toMatchObject({ deleted: 1, title: '' });
    expect((await db.notebookVersions.where('pageId').equals(pageId).toArray()).every(row => row.deleted === 1 && row.answer === '' && row.prompt === '')).toBe(true);
    const run = (await db.skillAttempts.get(id))!;
    expect(run).toMatchObject({ deleted: 1, retryDue: null });
    expect(run.fresh).toBeUndefined();
    expect(await dueRetries(db, 'practice-fixture', '2026-12-31')).toEqual([]);
  });
});

describe('spec 43: practice and notebook in a backup', () => {
  it('a v5 backup (before practice) restores into v6 with no row lost, and the new tables come in empty', async () => {
    const db = fresh();
    await db.tasks.add({ id: 'kept', title: 'Kept', status: 'open', dayKey: '2026-11-02', updatedAt: 1, deleted: 0, deviceId: 'a' });
    await db.ledger.add({ id: 'fact', dayKey: '2026-11-02', mode: 'tasks', kind: 'task_done', refId: 'kept', inputs: {}, at: 1, updatedAt: 1, deleted: 0, deviceId: 'a' } as never);
    const old = structuredClone(await exportBackup(db, 1000));
    old.dexie.data.databaseVersion = 5;
    for (const name of ['skillAttempts', 'notebookPages', 'notebookVersions']) {
      old.dexie.data.tables = old.dexie.data.tables.filter(table => table.name !== name);
      old.dexie.data.data = old.dexie.data.data.filter(table => table.tableName !== name);
    }
    const counts = Object.fromEntries(old.dexie.data.data.map(table => [table.tableName, table.rows.length]));
    const migrated = validateBackup(old);
    expect(migrated.success).toBe(true);
    expect(migrated.envelope!.dexie.data.databaseVersion).toBe(8); // spec 660 adds v8
    for (const name of ['skillAttempts', 'notebookPages', 'notebookVersions']) expect(migrated.envelope!.dexie.data.tables.find(table => table.name === name)).toMatchObject({ rowCount: 0 });
    const target = fresh();
    await importBackup(target, migrated.envelope!);
    for (const [name, count] of Object.entries(counts)) if (name !== 'settings') expect(await target.table(name).count(), name).toBe(count);
    expect((await target.tasks.get('kept'))?.title).toBe('Kept');
  });

  it('pages, versions and runs round-trip through a backup, and the preview counts them', async () => {
    const db = fresh();
    const { pageId } = await savePage(db, page, at('2026-11-03T10:00:00'));
    await revisePage(db, pageId, { answer: 'Second try', checklist: [], status: 'practised' }, at('2026-11-04T10:00:00'));
    const id = await startAttempt(db, lesson, at('2026-11-03T09:58:00'));
    await finishAttempt(db, id, { answer: 'Could I borrow the lab key before 3 pm?', result: 'right' }, pageId, at('2026-11-03T10:00:00'));
    const file = await exportBackup(db, at('2026-11-05T10:00:00'));
    expect(previewBackup(file)).toMatchObject({ counts: { notebookPages: 1, notebookVersions: 2, skillAttempts: 1 }, privatePages: 1 });
    const target = fresh();
    await importBackup(target, file);
    expect((await readPage(target, pageId))!.versions.map(row => row.answer)).toEqual(['Second try', page.answer]);
    expect(await target.skillAttempts.get(id)).toMatchObject({ status: 'finished', retryDue: '2026-11-06' });
  });
});
