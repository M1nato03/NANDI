// @vitest-environment jsdom
import '../test-setup';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { meditationElapsedMs, parseMeditation } from '../../core/mind/meditation';
import { changeMeditation, MEDITATION_HISTORY, MEDITATION_KEY } from './meditation';

const stores: NandiDb[] = [];
function fresh() { const store = createDb(`meditation-${crypto.randomUUID()}`); stores.push(store); return store; }
afterEach(async () => { for (const store of stores.splice(0)) await store.delete(); });
const start = new Date('2026-10-13T03:59:00').getTime();

it('serialises duplicate starts and finishes into one saved practice', async () => {
  const store = fresh();
  const [first, duplicate] = await Promise.all([changeMeditation(store, 'start', start, 2), changeMeditation(store, 'start', start, 2)]);
  expect(first?.id).toBe(duplicate?.id);
  await changeMeditation(store, 'finish', start + 180_000);
  await changeMeditation(store, 'finish', start + 181_000);
  const history = await store.settings.where('key').startsWith(MEDITATION_HISTORY).toArray();
  expect(history).toHaveLength(1);
  const saved = parseMeditation(history[0]!.value)!;
  expect(saved.dayKey).toBe('2026-10-12');
  expect(meditationElapsedMs(saved, start + 500_000)).toBe(120_000);
  expect((await store.settings.get(MEDITATION_KEY))?.value).toBeNull();
});

it('restores paused time and completed history through a real backup round trip', async () => {
  const store = fresh();
  await changeMeditation(store, 'start', start, 2);
  await changeMeditation(store, 'finish', start + 30_000);
  await changeMeditation(store, 'start', start + 60_000, 5);
  await changeMeditation(store, 'pause', start + 80_000);
  const before = await store.settings.toArray();
  const envelope = await exportBackup(store, start + 90_000);
  await store.settings.clear();
  await importBackup(store, envelope);
  expect((await store.settings.toArray()).filter(row => row.key !== 'deviceId')).toEqual(before.filter(row => row.key !== 'deviceId'));
  const paused = parseMeditation((await store.settings.get(MEDITATION_KEY))?.value)!;
  expect(meditationElapsedMs(paused, start + 600_000)).toBe(20_000);
  const resumed = await changeMeditation(store, 'resume', start + 600_000);
  expect(meditationElapsedMs(resumed!, start + 630_000)).toBe(50_000);
});

it('keeps the active timer if recording completion fails', async () => {
  const store = fresh();
  const active = await changeMeditation(store, 'start', start, 2);
  store.settings.hook('creating', (_key, row) => { if (row.key.startsWith(MEDITATION_HISTORY)) throw new Error('Disk full'); });
  await expect(changeMeditation(store, 'finish', start + 30_000)).rejects.toThrow('Disk full');
  expect((await store.settings.get(MEDITATION_KEY))?.value).toEqual(active);
});

it('checks the saved pause before automatically completing a stale rendered timer', async () => {
  const store = fresh();
  await changeMeditation(store, 'start', start, 2);
  const paused = await changeMeditation(store, 'pause', start + 40_000);
  expect(await changeMeditation(store, 'complete', start + 180_000)).toEqual(paused);
  expect(await store.settings.where('key').startsWith(MEDITATION_HISTORY).count()).toBe(0);
  await changeMeditation(store, 'resume', start + 180_000);
  await changeMeditation(store, 'complete', start + 260_000);
  expect((await store.settings.get(MEDITATION_KEY))?.value).toBeNull();
  expect(await store.settings.where('key').startsWith(MEDITATION_HISTORY).count()).toBe(1);
});
