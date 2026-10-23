// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { answerChhutti, checkChhutti, saveChhuttiWindow, skipChhuttiToday } from './chhutti';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { deriveCourtyard } from '../../core/courtyard/courtyard';
import { readChhutti, type UsageEvent } from '../../core/plan/chhutti';
import { RULES } from '../../core/rules.config';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const fresh = () => { const db = createDb(`chhutti-${++serial}`); opened.push(db); return db; };
const at = (day: string, time: string) => new Date(`${day}T${time}:00`).getTime();
const ig = 'com.instagram.android';
type Log = { logStart?: number; events: UsageEvent[] } | null;
const reader = (log: (from: number, to: number) => Log) => async (from: number, to: number) => log(from, to);

it('saves a window that starts at 30 minutes and sits inside the day (spec 24 #1)', async () => {
  const db = fresh();
  const window = await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  expect(window).toMatchObject({ label: 'After dinner', from: '21:00', to: '21:30' });
  const late = await saveChhuttiWindow(db, { id: window.id, label: 'After dinner', from: '23:30' }, at('2026-11-02', '12:05'));
  expect(late).toMatchObject({ id: window.id, from: '23:05', to: '23:15' });
  expect(readChhutti(await db.settings.toArray())).toHaveLength(1);
});

it('reads the window afterwards and writes one fact; an open app inside it is not a kept chhutti', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  // Before the window ends nothing is read.
  expect(await checkChhutti(db, at('2026-11-02', '21:10'), reader(() => { throw new Error('not yet'); }))).toEqual([]);
  const quiet = reader(from => ({ logStart: from - 3_600_000, events: [{ type: 'off', at: from + 60_000 }, { type: 'on', at: from + 20 * 60_000 }] }));
  expect(await checkChhutti(db, at('2026-11-02', '22:00'), quiet)).toEqual([]);
  const fact = (await db.ledger.where('kind').equals('chhutti').toArray())[0]!;
  expect(fact).toMatchObject({ dayKey: '2026-11-02', mode: 'tasks', inputs: { source: 'usage', kept: true, chosenAppMs: 0, darkMs: 19 * 60_000, plannedMin: 30, visibility: 'local' } });
  // A second open writes nothing more.
  await checkChhutti(db, at('2026-11-02', '22:30'), quiet);
  expect(await db.ledger.where('kind').equals('chhutti').count()).toBe(1);
  // The next day, 20 minutes of the chosen app inside the window: written, but not kept.
  const busy = reader(from => ({ logStart: from - 3_600_000, events: [{ type: 'fg', at: from + 5 * 60_000, pkg: ig }, { type: 'bg', at: from + 25 * 60_000, pkg: ig }] }));
  await checkChhutti(db, at('2026-11-03', '22:00'), busy);
  expect((await db.ledger.get(`chhutti:2026-11-03:${readChhutti(await db.settings.toArray())[0]!.id}`))?.inputs).toMatchObject({ kept: false, chosenAppMs: 20 * 60_000 });
});

it('with no usage log (web, no access, history gone) it writes nothing and asks instead', async () => {
  const db = fresh();
  const window = await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  expect(await checkChhutti(db, at('2026-11-02', '22:00'), reader(() => null))).toEqual([{ day: '2026-11-02', window }]);
  // A log that starts after the window began (events are kept only a few days) is not enough either.
  expect(await checkChhutti(db, at('2026-11-02', '22:00'), reader(from => ({ logStart: from + 60_000, events: [] })))).toHaveLength(1);
  expect(await db.ledger.where('kind').equals('chhutti').count()).toBe(0);
  await answerChhutti(db, '2026-11-02', window, 'yes', at('2026-11-02', '22:05'));
  expect((await db.ledger.where('kind').equals('chhutti').first())?.inputs).toMatchObject({ source: 'self', kept: true });
  // A self-reported chhutti hangs a marigold but pays no XP: only a measured window pays.
  const facts = await db.ledger.toArray();
  expect(deriveEconomy(facts, undefined, await db.settings.toArray(), '2026-11-02').days.at(-1)?.chhutti).toBe(0);
  expect(deriveCourtyard(facts, '2026-11-02').toran).toBe(1);
  expect(await checkChhutti(db, at('2026-11-02', '22:10'), reader(() => null))).toEqual([]);
});

it('"Not today" moves today\'s window out of the way', async () => {
  const db = fresh();
  const window = await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  await skipChhuttiToday(db, window.id, at('2026-11-02', '18:00'));
  expect(await checkChhutti(db, at('2026-11-02', '22:00'), reader(() => null))).toEqual([]);
});

it('grows by 15 minutes after 2 kept of 3, pays its XP once a day, and adds a marigold and a Plan day', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  const quiet = reader(from => ({ logStart: from - 3_600_000, events: [] }));
  for (const day of ['2026-11-02', '2026-11-03', '2026-11-04']) await checkChhutti(db, at(day, '23:00'), quiet);
  expect(readChhutti(await db.settings.toArray())[0]).toMatchObject({ from: '21:00', to: '21:45' });
  const facts = await db.ledger.toArray();
  const day = deriveEconomy(facts, undefined, await db.settings.toArray(), '2026-11-04').days.find(item => item.dayKey === '2026-11-03');
  expect(day).toMatchObject({ chhutti: RULES.plan.chhutti.xp });
  const yard = deriveCourtyard(facts, '2026-11-04');
  expect(yard.toran).toBe(3);
  expect(yard.areas.find(area => area.id === 'plan')!.days).toBe(3);
});
