// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { acceptJoin, loadCrew, receiveCrewLink, saveCrew } from './crew';
import { CREW_KEY, makeCrew } from '../../core/crew/crew';
import { encodeCrewLink } from '../../core/crew/links';

const opened: ReturnType<typeof createDb>[] = [];
const fresh = () => { const db = createDb(`crew-${opened.length}-${Date.now()}`); opened.push(db); return db; };
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const at = (text: string) => new Date(text).getTime();
const crew = makeCrew({ id: 'crew0001', plan: 'Sunday chai', size: 15, me: { id: 'aaaaaa1', first: 'Riya', colour: 0 }, now: at('2026-11-05T09:00:00'), today: '2026-11-05' });

it('spec 55: a crew is two settings rows that a backup carries; a pre-55 backup restores with no crew', async () => {
  const db = fresh();
  const older = await exportBackup(db, at('2026-11-05T08:00:00'));
  await saveCrew(db, crew, at('2026-11-05T09:00:00'));
  const backup = await exportBackup(db, at('2026-11-05T10:00:00'));
  await importBackup(db, older);
  expect(await loadCrew(db)).toBeNull();
  await importBackup(db, backup);
  expect(await loadCrew(db)).toEqual(crew);
  expect((await db.settings.get(CREW_KEY))?.deleted).toBe(0);
});

it('spec 55: the same add link twice counts once, and an impossible one is ignored quietly', async () => {
  const db = fresh();
  await saveCrew(db, crew, at('2026-11-05T09:00:00'));
  const joined = encodeCrewLink({ v: 1, t: 'joined', c: 'crew0001', m: 'bbbbbb2', n: 'Dev', k: 2, d: '2026-11-05' });
  const add = encodeCrewLink({ v: 1, t: 'add', c: 'crew0001', m: 'bbbbbb2', n: 'Dev', k: 2, u: 45, d: '2026-11-05', src: 'workout' });
  const fake = encodeCrewLink({ v: 1, t: 'add', c: 'crew0001', m: 'bbbbbb2', n: 'Dev', k: 2, u: 600, d: '2026-11-05', src: 'workout' });
  expect((await receiveCrewLink(db, joined, at('2026-11-05T10:00:00'), '2026-11-05')).outcome).toBe('applied');
  expect((await receiveCrewLink(db, add, at('2026-11-05T10:01:00'), '2026-11-05')).outcome).toBe('applied');
  expect((await receiveCrewLink(db, add, at('2026-11-05T10:02:00'), '2026-11-05')).outcome).toBe('ignored');
  expect((await receiveCrewLink(db, fake, at('2026-11-05T10:03:00'), '2026-11-05')).outcome).toBe('ignored');
  expect((await receiveCrewLink(db, 'crew/add/!!!', at('2026-11-05T10:04:00'), '2026-11-05')).outcome).toBe('invalid');
  expect((await loadCrew(db))!.members).toEqual([{ id: 'bbbbbb2', first: 'Dev', colour: 2, cum: 45, date: '2026-11-05', last: 45, src: 'workout' }]);
});

it('spec 55: joining from an invite stores the crew with its maker as the first member', async () => {
  const db = fresh();
  const invite = encodeCrewLink({ v: 1, t: 'join', c: 'crew0001', p: 'Sunday chai', s: 15, mk: '2026-11-05', m: 'aaaaaa1', n: 'Riya', k: 0 });
  const joined = await acceptJoin(db, invite, { first: 'Dev', colour: 2 }, at('2026-11-05T11:00:00'));
  expect(joined).toMatchObject({ id: 'crew0001', plan: 'Sunday chai', size: 15, made: '2026-11-05', members: [{ id: 'aaaaaa1', first: 'Riya', cum: 0 }] });
  expect((await loadCrew(db))!.me.first).toBe('Dev');
});
