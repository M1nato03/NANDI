// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { answerChhutti, checkChhutti, chhuttiInLightsOut, CHHUTTI_LOCK_TEST_KEY, readLockTest, removeChhuttiWindow, saveChhuttiWindow, skipChhuttiToday } from './chhutti';
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
  const quiet = reader(from => ({ logStart: from - 3_600_000, events: [{ type: 'boot', at: from - 3_000_000 }, { type: 'fg', at: from - 600_000, pkg: 'com.android.launcher' }, { type: 'off', at: from + 60_000 }, { type: 'on', at: from + 20 * 60_000 }] }));
  expect(await checkChhutti(db, at('2026-11-02', '22:00'), quiet)).toEqual([]);
  const fact = (await db.ledger.where('kind').equals('chhutti').toArray())[0]!;
  expect(fact).toMatchObject({ dayKey: '2026-11-02', mode: 'tasks', inputs: { source: 'usage', kept: true, chosenAppMs: 0, darkMs: 19 * 60_000, plannedMin: 30, visibility: 'local' } });
  // A second open writes nothing more.
  await checkChhutti(db, at('2026-11-02', '22:30'), quiet);
  expect(await db.ledger.where('kind').equals('chhutti').count()).toBe(1);
  // The next day, 20 minutes of the chosen app inside the window: written, but not kept.
  const busy = reader(from => ({ logStart: from - 3_600_000, events: [{ type: 'boot', at: from - 3_000_000 }, { type: 'off', at: from - 600_000 }, { type: 'on', at: from + 5 * 60_000 }, { type: 'fg', at: from + 5 * 60_000, pkg: ig }, { type: 'bg', at: from + 25 * 60_000, pkg: ig }] }));
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
  const quiet = reader(from => ({ logStart: from - 3_600_000, events: [{ type: 'boot', at: from - 3_000_000 }, { type: 'off', at: from - 60_000 }] }));
  for (const day of ['2026-11-02', '2026-11-03', '2026-11-04']) await checkChhutti(db, at(day, '23:00'), quiet);
  expect(readChhutti(await db.settings.toArray())[0]).toMatchObject({ from: '21:00', to: '21:45' });
  const facts = await db.ledger.toArray();
  const day = deriveEconomy(facts, undefined, await db.settings.toArray(), '2026-11-04').days.find(item => item.dayKey === '2026-11-03');
  expect(day).toMatchObject({ chhutti: RULES.plan.chhutti.xp });
  const yard = deriveCourtyard(facts, '2026-11-04');
  expect(yard.toran).toBe(3);
  expect(yard.areas.find(area => area.id === 'plan')!.days).toBe(3);
});

// Codex A item 55: a missed week is still read, started days keep their bounds, and the night stays quiet.
const dark = reader(from => ({ logStart: from - 3_600_000, events: [{ type: 'boot', at: from - 3_000_000 }, { type: 'off', at: from - 60_000 }] }));

it('reads every unrecorded day back to `since`, up to 7 days, with the bounds each day had', async () => {
  const db = fresh();
  const window = await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  // Moved to 20:00 on the 4th at noon: the 2nd and 3rd keep 21:00.
  await saveChhuttiWindow(db, { id: window.id, label: 'After dinner', from: '20:00' }, at('2026-11-04', '12:00'));
  const asked: string[] = [];
  const log = async (from: number, to: number) => { asked.push(new Date(from).toTimeString().slice(0, 5)); return dark(from, to); };
  // NANDI next opens on the 6th: the 2nd to the 5th are read, the 6th has not ended.
  expect(await checkChhutti(db, at('2026-11-06', '12:00'), log)).toEqual([]);
  expect(asked).toEqual(['21:00', '21:00', '20:00', '20:00']);
  const facts = (await db.ledger.where('kind').equals('chhutti').toArray()).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  expect(facts.map(fact => [fact.dayKey, fact.inputs.from, fact.inputs.plannedMin])).toEqual([
    ['2026-11-02', '21:00', 30], ['2026-11-03', '21:00', 30], ['2026-11-04', '20:00', 30], ['2026-11-05', '20:00', 30],
  ]);
  // Older than 7 days is not read any more.
  const old = fresh();
  await saveChhuttiWindow(old, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  await checkChhutti(old, at('2026-11-12', '12:00'), dark);
  expect((await old.ledger.where('kind').equals('chhutti').toArray()).map(fact => fact.dayKey).sort()[0]).toBe('2026-11-05');
});

it('a change after the window started leaves today as planned', async () => {
  const db = fresh();
  const window = await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  // At 21:10, inside the window, it is moved to 22:00: today stays 21:00-21:30.
  await saveChhuttiWindow(db, { id: window.id, label: 'After dinner', from: '22:00' }, at('2026-11-02', '21:10'));
  const asked: number[] = [];
  await checkChhutti(db, at('2026-11-02', '21:40'), async (from, to) => { asked.push(from); return dark(from, to); });
  expect(asked).toEqual([at('2026-11-02', '21:00')]);
  expect(readChhutti(await db.settings.toArray())[0]).toMatchObject({ from: '22:00', to: '22:30' });
});

it('after bedtime nothing is read or asked; the next morning reads the same day', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  // Default bedtime 01:30: at 02:00 the night routine owns the screen.
  expect(await checkChhutti(db, at('2026-11-03', '02:00'), reader(() => null))).toEqual([]);
  expect(await checkChhutti(db, at('2026-11-03', '09:00'), reader(() => null))).toEqual([{ day: '2026-11-02', window: readChhutti(await db.settings.toArray())[0] }]);
});

it('a window planned after shutdown on a busy day is kept before the shifted shutdown', async () => {
  const db = fresh();
  // Shutdown 22:00 on a quiet day: a 21:50 window is pulled back to fit.
  await db.settings.put({ key: 'planner.shutdown', value: '22:00', updatedAt: 1, deleted: 0, deviceId: 't' });
  expect(await saveChhuttiWindow(db, { label: 'After dinner', from: '21:50' }, at('2026-11-02', '12:00'))).toMatchObject({ from: '21:50', to: '22:00' });
});

it('with no log after days away, only today and yesterday are asked about', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  expect((await checkChhutti(db, at('2026-11-06', '22:00'), reader(() => null))).map(item => item.day)).toEqual(['2026-11-05', '2026-11-06']);
});

// Codex A item 56.
it('turning a window off still reads the days it ran, and asks nothing about it', async () => {
  const db = fresh();
  const window = await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  await removeChhuttiWindow(db, window.id, at('2026-11-03', '12:00'));
  expect(readChhutti(await db.settings.toArray())[0]).toMatchObject({ id: window.id, until: '2026-11-02' });
  await checkChhutti(db, at('2026-11-05', '12:00'), dark);
  expect((await db.ledger.where('kind').equals('chhutti').toArray()).map(fact => fact.dayKey)).toEqual(['2026-11-02']);
  expect(await checkChhutti(db, at('2026-11-05', '12:00'), reader(() => null))).toEqual([]);
  // A new window can be planned while the old one is still kept for reading.
  await saveChhuttiWindow(db, { label: 'After class', from: '17:00' }, at('2026-11-05', '12:00'));
  expect(readChhutti(await db.settings.toArray()).filter(item => !item.until).map(item => item.label)).toEqual(['After class']);
});

it('a shutdown moved earlier after the window does not shorten it; one recorded before it does', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  // An open at 18:00 records the day's shutdown (23:15) before the window starts.
  await checkChhutti(db, at('2026-11-02', '18:00'), dark);
  await db.settings.put({ key: 'planner.shutdown', value: '21:10', updatedAt: 2, deleted: 0, deviceId: 't' });
  const asked: number[] = [];
  await checkChhutti(db, at('2026-11-02', '22:00'), async (from, to) => { asked.push(to); return dark(from, to); });
  expect(asked).toEqual([at('2026-11-02', '21:30')]);
  // The next day the 21:10 shutdown is recorded before the window, so the window ends at 21:10.
  await checkChhutti(db, at('2026-11-03', '12:00'), dark);
  asked.length = 0;
  await checkChhutti(db, at('2026-11-03', '22:00'), async (from, to) => { asked.push(to); return dark(from, to); });
  expect(asked).toEqual([at('2026-11-03', '21:10')]);
  expect((await db.ledger.get(`chhutti:2026-11-03:${readChhutti(await db.settings.toArray())[0]!.id}`))?.inputs).toMatchObject({ to: '21:10', plannedMin: 10 });
});

it('an open at 04:05 is lights-out: no result and no question', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  expect(await chhuttiInLightsOut(db, at('2026-11-03', '04:05'))).toBe(true);
  expect(await checkChhutti(db, at('2026-11-03', '04:05'), reader(() => null))).toEqual([]);
  expect(await chhuttiInLightsOut(db, at('2026-11-03', '06:05'))).toBe(false);
});

// Codex A item 57.
it('with no shutdown recorded before the window, a shutdown moved earlier since still cuts that day', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  // No open before the 2nd's window, then bedtime and shutdown moved earlier: the 2nd is cut to 21:10.
  await db.settings.put({ key: 'planner.shutdown', value: '21:10', updatedAt: 2, deleted: 0, deviceId: 't' });
  const asked: number[] = [];
  await checkChhutti(db, at('2026-11-03', '12:00'), async (from, to) => { asked.push(to); return dark(from, to); });
  expect(asked).toEqual([at('2026-11-02', '21:10')]);
});

it('bounds older than the 7-day read-back are dropped when the window is saved', async () => {
  const db = fresh();
  const window = await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  await saveChhuttiWindow(db, { id: window.id, label: 'After dinner', from: '20:00' }, at('2026-11-04', '12:00'));
  expect(readChhutti(await db.settings.toArray())[0]!.past).toHaveLength(1);
  await saveChhuttiWindow(db, { id: window.id, label: 'After dinner', from: '20:00', weekdays: [0] }, at('2026-11-20', '12:00'));
  expect(readChhutti(await db.settings.toArray())[0]!.past?.map(item => item.through)).toEqual(['2026-11-19']);
});

// Item 59, Jenil chose A: a phone that passes the lock self-test measures windows with no recent restart.
it('the lock self-test: 3 passes make a lock a baseline, and a fail takes it away again', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  // No restart in the log, only a lock before the window (Instagram opened days ago, never paused).
  const noRestart = reader(from => ({ logStart: from - 5 * 86_400_000, lockSafe: true, events: [{ type: 'fg', at: from - 3 * 86_400_000, pkg: ig, cls: 'Main' }, { type: 'lock', at: from - 600_000 }, { type: 'off', at: from - 600_000 }] }));
  const passAt = (t: number) => [{ type: 'fg' as const, at: t - 60_000, cls: 'Main' }, { type: 'lock' as const, at: t }, { type: 'bg' as const, at: t + 300, cls: 'Main' }];
  // Two passes so far: not trusted, so the window is asked about.
  const two = async () => [...passAt(at('2026-11-02', '13:00')), ...passAt(at('2026-11-02', '14:00'))];
  expect(await checkChhutti(db, at('2026-11-02', '22:00'), noRestart, two)).toHaveLength(1);
  expect(readLockTest(await db.settings.toArray())).toEqual({ passes: 2, upTo: at('2026-11-02', '14:00'), streakStart: at('2026-11-02', '13:00'), lastFailAt: null });
  // A third pass the next day: the 2nd is still unanswered, and now the log can answer it.
  const three = async () => [...await two(), ...passAt(at('2026-11-03', '08:00'))];
  expect(await checkChhutti(db, at('2026-11-03', '09:00'), noRestart, three)).toEqual([]);
  const fact = await db.ledger.get(`chhutti:2026-11-02:${readChhutti(await db.settings.toArray())[0]!.id}`);
  expect(fact?.inputs).toMatchObject({ source: 'usage', kept: true, chosenAppMs: 0 });
  // A fail (NANDI still resumed after the lock) takes the trust away again.
  const failed = async () => [...await three(), { type: 'fg' as const, at: at('2026-11-03', '09:30'), cls: 'Main' }, { type: 'lock' as const, at: at('2026-11-03', '10:00') }];
  await checkChhutti(db, at('2026-11-03', '11:00'), noRestart, failed);
  expect(readLockTest(await db.settings.toArray())?.passes).toBe(0);
  expect(await checkChhutti(db, at('2026-11-03', '22:00'), noRestart, failed)).toHaveLength(1);
});

it('no lock log (web, old Android, no access) stores no self-test', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  await checkChhutti(db, at('2026-11-02', '22:00'), reader(() => null), async () => null);
  expect(await db.settings.get(CHHUTTI_LOCK_TEST_KEY)).toBeUndefined();
});

it('trust counts only locks from the start of the passing run on, never earlier ones (Codex A item 61)', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  const noRestart = reader(from => ({ logStart: from - 5 * 86_400_000, lockSafe: true, events: [{ type: 'lock', at: from - 600_000 }, { type: 'off', at: from - 600_000 }] }));
  const passAt = (t: number) => [{ type: 'fg' as const, at: t - 60_000, cls: 'Main' }, { type: 'lock' as const, at: t }, { type: 'bg' as const, at: t + 300, cls: 'Main' }];
  // All three passes come the next morning, so the 2nd's lock at 20:50 is from before the run: still asked.
  const passes = async () => [...passAt(at('2026-11-03', '07:00')), ...passAt(at('2026-11-03', '07:30')), ...passAt(at('2026-11-03', '08:00'))];
  expect((await checkChhutti(db, at('2026-11-03', '09:00'), noRestart, passes)).map(item => item.day)).toEqual(['2026-11-02']);
  expect(readLockTest(await db.settings.toArray())).toMatchObject({ passes: 3, streakStart: at('2026-11-03', '07:00') });
  // The 3rd's window, after the run began, is measured.
  expect(await checkChhutti(db, at('2026-11-03', '22:00'), noRestart, passes)).toEqual([{ day: '2026-11-02', window: readChhutti(await db.settings.toArray())[0] }]);
  expect((await db.ledger.where('kind').equals('chhutti').toArray()).map(fact => fact.dayKey)).toEqual(['2026-11-03']);
});

it('two checks at once run the self-test one after the other, and a clock set back starts it again', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  let reads = 0;
  const passAt = (t: number) => [{ type: 'fg' as const, at: t - 60_000, cls: 'Main' }, { type: 'lock' as const, at: t }, { type: 'bg' as const, at: t + 300, cls: 'Main' }];
  const locks = async () => { reads += 1; return [...passAt(at('2026-11-02', '13:00')), ...passAt(at('2026-11-02', '14:00')), ...passAt(at('2026-11-02', '15:00'))]; };
  await Promise.all([checkChhutti(db, at('2026-11-02', '16:00'), reader(() => null), locks), checkChhutti(db, at('2026-11-02', '16:00'), reader(() => null), locks)]);
  // Each check reads the log again, one after the other (Codex A item 63).
  expect(reads).toBe(2);
  expect(readLockTest(await db.settings.toArray())?.passes).toBe(3);
  // The clock is now set back to the morning: the stored test is later than now, so it starts again.
  await checkChhutti(db, at('2026-11-02', '09:00'), reader(() => null), locks);
  expect(readLockTest(await db.settings.toArray())).toMatchObject({ passes: 0, streakStart: null, upTo: at('2026-11-02', '15:00') + 300 });
});

it('a clock set back resets the self-test even when the lock log cannot be read (Codex A item 63)', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  await db.settings.put({ key: CHHUTTI_LOCK_TEST_KEY, value: { passes: 3, upTo: at('2026-11-03', '12:00'), streakStart: at('2026-11-03', '10:00'), lastFailAt: null }, updatedAt: 1, deleted: 0, deviceId: 't' });
  const noRestart = reader(from => ({ logStart: from - 5 * 86_400_000, lockSafe: true, events: [{ type: 'lock', at: from - 600_000 }, { type: 'off', at: from - 600_000 }] }));
  expect(await checkChhutti(db, at('2026-11-02', '22:00'), noRestart, async () => null)).toHaveLength(1);
  expect(readLockTest(await db.settings.toArray())).toMatchObject({ passes: 0, streakStart: null });
});

it('a chosen app that can show over the lock screen gets no lock baseline (Codex A item 63)', async () => {
  const db = fresh();
  await saveChhuttiWindow(db, { label: 'After dinner', from: '21:00' }, at('2026-11-02', '12:00'));
  await db.settings.put({ key: CHHUTTI_LOCK_TEST_KEY, value: { passes: 3, upTo: at('2026-11-02', '15:00'), streakStart: at('2026-11-02', '13:00'), lastFailAt: null }, updatedAt: 1, deleted: 0, deviceId: 't' });
  const unsafe = reader(from => ({ logStart: from - 5 * 86_400_000, lockSafe: false, events: [{ type: 'lock', at: from - 600_000 }, { type: 'off', at: from - 600_000 }] }));
  expect(await checkChhutti(db, at('2026-11-02', '22:00'), unsafe, async () => [])).toHaveLength(1);
  expect(await db.ledger.where('kind').equals('chhutti').count()).toBe(0);
});
