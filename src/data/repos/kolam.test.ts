// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { selectClockKolam } from '../../core/kolam/clock';
import { saveKolamDone } from './kolam';

const stores: NandiDb[] = [];
afterEach(async () => { for (const store of stores.splice(0)) await store.delete(); });
const fresh = () => { const store = createDb(`kolam-${crypto.randomUUID()}`); stores.push(store); return store; };
const at = (time: string) => new Date(`2026-10-20T${time}:00`).getTime();
const setting = (key: string, value: unknown) => ({ key, value, updatedAt: 1, deleted: 0 as const, deviceId: 'd' });
const task = (id: string, estimateMin: number) => ({ id, title: 'x', status: 'planned', dayKey: '2026-10-20', size: 'M', estimateMin, updatedAt: 1, deleted: 0, deviceId: 'd' });

describe('spec 26 kolam completion (Codex B item 114)', () => {
  it('decides after-bedtime at completion from the effective bedtime, busy-day shift included', async () => {
    const db = fresh();
    await db.settings.put(setting('planner.bedtime', '23:30'));
    const kolam = selectClockKolam(new Date(at('23:45')));
    // A 23:30 bedtime and an empty day: 23:45 is after bedtime.
    expect(await saveKolamDone(db, kolam, at('23:45'))).toBe(true);
    expect((await db.ledger.get(`kolam:${kolam.nightDate}`))!.inputs.afterBedtime).toBe(true);
  });
  it('a busy day moves bedtime to 00:00, so 23:45 is still before it; a second finish keeps the first answer', async () => {
    const db = fresh();
    await db.settings.put(setting('planner.bedtime', '23:30'));
    await db.tasks.bulkPut([task('a', 150), task('b', 150)] as never);
    const kolam = selectClockKolam(new Date(at('23:45')));
    expect(await saveKolamDone(db, kolam, at('23:45'))).toBe(false);
    expect(await saveKolamDone(db, kolam, at('23:59'))).toBe(false);
    expect(await db.ledger.where('kind').equals('kolam').count()).toBe(1);
  });
});
