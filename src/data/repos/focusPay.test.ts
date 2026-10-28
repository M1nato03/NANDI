// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { createTaskRepos } from './tasks';

const stores: NandiDb[] = [];
afterEach(async () => { for (const store of stores.splice(0)) await store.delete(); });
const MIN = 60_000;
const at = new Date('2026-10-28T09:00:00').getTime();

async function setup() {
  const db = createDb(`focus-pay-${crypto.randomUUID()}`); stores.push(db);
  const repos = await createTaskRepos(db, 'device');
  const task = await repos.addToList('Study', at);
  const focus = await repos.startFocus(task.id, at);
  return { db, repos, task, focus };
}
const facts = (db: NandiDb) => db.ledger.where('kind').equals('focus-time').toArray();

describe('spec 36: a focus pays only what the guard could see', () => {
  it('ending a watched focus writes its minutes less distracted time, with its clean blocks', async () => {
    const { db, repos, focus } = await setup();
    await repos.syncFocusGuard(focus.id, { on: true, distractedMs: 5 * MIN, spans: [[at + 30 * MIN, at + 35 * MIN]] });
    await repos.finishFocus(focus.id, at + 60 * MIN);
    expect((await facts(db)).map(row => row.inputs)).toEqual([expect.objectContaining({ guard: true, paidMs: 55 * MIN, distractedMs: 5 * MIN, blocks: 2 })]);
  });

  it('once any look finds the guard off, the focus stays unwatched and earns no focus XP', async () => {
    const { db, repos, focus } = await setup();
    await repos.syncFocusGuard(focus.id, { on: true, distractedMs: 0 });
    await repos.syncFocusGuard(focus.id, { on: false, distractedMs: 0 });
    await repos.syncFocusGuard(focus.id, { on: true, distractedMs: 0 });
    expect((await repos.focus.get(focus.id))?.guard?.on).toBe(false);
    await repos.finishFocus(focus.id, at + 30 * MIN);
    expect((await facts(db))[0]?.inputs).toMatchObject({ guard: false });
  });

  it('distracted time only grows between looks', async () => {
    const { repos, focus } = await setup();
    await repos.syncFocusGuard(focus.id, { on: true, distractedMs: 8 * MIN });
    await repos.syncFocusGuard(focus.id, { on: true, distractedMs: 3 * MIN });
    expect((await repos.focus.get(focus.id))?.guard?.distractedMs).toBe(8 * MIN);
  });

  it('a guard pause is dated when the app opened, never before the running stretch began', async () => {
    const { repos, focus } = await setup();
    await repos.pauseFocusAt(focus.id, at + 3 * MIN, at + 8 * MIN, 'guard', 'com.instagram.android');
    expect((await repos.focus.get(focus.id))?.pauses).toEqual([{ at: at + 3 * MIN, reason: 'guard', app: 'com.instagram.android' }]);
    await repos.resumeFocus(focus.id, at + 10 * MIN);
    await repos.pauseFocusAt(focus.id, at + 1 * MIN, at + 12 * MIN, 'still');
    expect((await repos.focus.get(focus.id))?.pauses?.at(-1)).toEqual({ at: at + 10 * MIN, reason: 'still' });
  });
});
