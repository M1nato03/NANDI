// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { REMINDERS_KEY } from '../../core/tasks/reminders';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { jarActs } from '../../core/yatra/jar';
import { createTaskRepos } from './tasks';
import { deleteOldReminders, migrateReminders, reminderTaskId } from './reminderMigration';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const fresh = () => { const db = createDb(`reminders-660-${++serial}`); opened.push(db); return db; };
const NOW = new Date('2026-11-13T12:00:00').getTime();
const seed = (db: NandiDb, list: unknown[]) => db.settings.put({ key: REMINDERS_KEY, value: list, updatedAt: 1, deleted: 0, deviceId: 'test' });

describe('spec 660 §3.4: Reminders fold into Mor\'s list as Later tasks', () => {
  it('each open reminder becomes one Later task with a fixed id; done ones stay behind; running again adds nothing', async () => {
    const db = fresh();
    await seed(db, [{ id: 'a', text: 'Buy stamps', createdAt: NOW - 86_400_000 }, { id: 'b', text: 'Call Asha', createdAt: NOW }, { id: 'c', text: 'Old', createdAt: NOW, doneAt: NOW }]);
    expect(await migrateReminders(db, NOW)).toBe(2);
    const tasks = await db.tasks.toArray();
    expect(tasks.map(task => [task.id, task.title, task.status, task.fromReminder]).sort()).toEqual([[reminderTaskId('a'), 'Buy stamps', 'someday', true], [reminderTaskId('b'), 'Call Asha', 'someday', true]]);
    expect(await migrateReminders(db, NOW + 1)).toBe(0);
    expect(await db.tasks.count()).toBe(2);
    // The originals are kept until the person deletes them in Settings › Reminders.
    expect(((await db.settings.get(REMINDERS_KEY))!.value as unknown[]).length).toBe(3);
  });

  it('a migrated task the person deleted is never made again, even when an older backup brings the reminder back', async () => {
    const db = fresh();
    await seed(db, [{ id: 'a', text: 'Buy stamps', createdAt: NOW }]);
    await migrateReminders(db, NOW);
    await db.tasks.update(reminderTaskId('a'), { deleted: 1 });
    await seed(db, [{ id: 'a', text: 'Buy stamps', createdAt: NOW }]);
    expect(await migrateReminders(db, NOW + 1)).toBe(0);
    expect((await db.tasks.get(reminderTaskId('a')))!.deleted).toBe(1);
  });

  it('finishing a task from a reminder pays no XP and fills no jar (no done fact), like the reminder it was', async () => {
    const db = fresh();
    await seed(db, [{ id: 'a', text: 'Buy stamps', createdAt: NOW }]);
    await migrateReminders(db, NOW);
    const repos = createTaskRepos(db, 'test');
    await repos.completeTask(reminderTaskId('a'), NOW + 60_000);
    expect((await db.tasks.get(reminderTaskId('a')))!.status).toBe('done');
    const facts = await db.ledger.toArray();
    expect(facts.filter(fact => fact.mode === 'tasks')).toEqual([]);
    expect(deriveEconomy(facts, undefined, await db.settings.toArray(), '2026-11-13').totalXp).toBe(0);
    expect(jarActs(facts, [])).toEqual([]);
  });

  it('"Delete old reminders" clears the kept originals and leaves the Later tasks', async () => {
    const db = fresh();
    await seed(db, [{ id: 'a', text: 'Buy stamps', createdAt: NOW }]);
    await migrateReminders(db, NOW);
    await deleteOldReminders(db, NOW + 1);
    expect((await db.settings.get(REMINDERS_KEY))!.value).toEqual([]);
    expect(await db.tasks.count()).toBe(1);
  });
});
