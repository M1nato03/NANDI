// @vitest-environment jsdom
// Seeded clock and time-zone fuzz of the economy (cloud batch 3 job 5, idea engine item 42), kept small for CI:
// 20 seeds x 60 steps. It drives the real repos, reconcileGamify, exportBackup and importBackup on fake-indexeddb,
// with a fake phone clock and env.TZ switched at run time, and checks what deriveEconomy shows after each step.
// A restore replaces today (Jenil, 24 Oct), so after one only finished days, XP and level must hold.
import 'fake-indexeddb/auto';
import { expect, it, vi } from 'vitest';
import { createDb, type NandiDb } from './db';
import { reconcileGamify } from './repos/gamify';
import { createTaskRepos } from './repos/tasks';
import { createTrainRepos } from './repos/train';
import { purchaseShopItem } from './repos/economy';
import { doSoftThing, setSoftState } from './repos/soft';
import { putDailyBoardFact } from './repos/learn';
import { exportBackup, importBackup, type BackupEnvelope } from './backup';
import { getOrCreateDeviceId } from './device';
import { deriveEconomy, type EconomyView } from '../core/economy/deriveEconomy';
import { catalogue } from '../core/economy/shop';
import { dayKey } from '../core/time';
import type { PuzzleRunRow } from './types';

// process is not typed for app files; TZ is read per call, so setting it moves dayKey().
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
const ZONES = ['Asia/Kolkata', 'Asia/Dubai', 'America/New_York'] as const;
type Act = 'task' | 'rest' | 'board' | 'soft' | 'buy' | 'lights';
type Op =
  | { t: 'day'; hour: number; min: number }
  | { t: 'fwd' | 'back'; days: number; hour: number }
  | { t: 'tz'; zone: typeof ZONES[number] }
  | { t: 'at'; hour: number; min: number }
  | { t: 'act'; kind: Act; item: number; mins: number }
  | { t: 'backup' }
  | { t: 'restore'; pick: number }
  | { t: 'skipReconcile' };

function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function generate(seed: number, steps: number): Op[] {
  const r = mulberry32(seed), int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const ops: Op[] = []; let backups = 0;
  const acts: Act[] = ['task', 'task', 'task', 'rest', 'board', 'soft', 'buy', 'buy', 'lights'];
  while (ops.length < steps) {
    const x = r();
    if (x < 0.30) ops.push({ t: 'day', hour: int(6, 23), min: int(0, 59) });
    else if (x < 0.38) ops.push({ t: 'fwd', days: int(1, 30), hour: int(5, 23) });
    else if (x < 0.46) ops.push({ t: 'back', days: int(1, 30), hour: int(5, 23) });
    else if (x < 0.52) ops.push({ t: 'tz', zone: ZONES[int(0, 2)]! });
    else if (x < 0.57) { ops.push({ t: 'at', hour: 3, min: int(40, 59) }); ops.push({ t: 'act', kind: 'task', item: int(0, 99), mins: 0 }); ops.push({ t: 'at', hour: 4, min: int(0, 20) }); }
    else if (x < 0.62) { ops.push({ t: 'backup' }); backups++; }
    else if (x < 0.67 && backups > 0) ops.push({ t: 'restore', pick: int(0, 99) });
    else if (x < 0.70) ops.push({ t: 'skipReconcile' });
    else ops.push({ t: 'act', kind: acts[int(0, acts.length - 1)]!, item: int(0, 99), mins: int(1, 90) });
  }
  return ops.slice(0, steps);
}

let serial = 0;
const START = Date.UTC(2026, 9, 20, 6, 30); // 20 Oct 2026, 12:00 in Kolkata

async function runSequence(ops: Op[]): Promise<string[]> {
  env.TZ = 'Asia/Kolkata';
  let now = START;
  vi.setSystemTime(now);
  const db: NandiDb = createDb(`clock-fuzz-${++serial}`);
  const failures: string[] = [];
  try {
    const deviceId = await getOrCreateDeviceId(db, now);
    const tasks = createTaskRepos(db, deviceId), train = createTrainRepos(db, deviceId);
    const backups: BackupEnvelope[] = [];
    let maxXp = 0, maxLevel = 1, lastShards = 0, skip = false, skipped = false, taskN = 0;
    let owned = new Set<string>();
    const finished = new Map<string, { total: number; reopened: boolean }>();
    // The stored close of the last finished day, read just before a restore: what a restore may never lower.
    let snap: { day: string; shards: number; owned: string[] } | undefined;
    const view = async (): Promise<EconomyView> => deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), dayKey(now));
    const check = async (step: number, op: Op, spent: number) => {
      const v = await view(), today = dayKey(now);
      const fail = (kind: string, detail: string) => failures.push(`step ${step} ${JSON.stringify(op)}: ${kind} ${detail} (today ${today})`);
      if (v.totalXp < maxXp) fail('xp-drop', `${maxXp} -> ${v.totalXp}`);
      if (v.level < maxLevel) fail('level-drop', `${maxLevel} -> ${v.level}`);
      if (op.t !== 'restore') {
        if (v.shards < lastShards - spent) fail('shards-drop', `${lastShards} -> ${v.shards} (spent ${spent})`);
        for (const id of owned) if (!v.owned.includes(id)) fail('owned-lost', id);
      }
      const byDay = new Map(v.days.map(d => [d.dayKey, d.total]));
      for (const [day, rec] of finished) {
        if (day >= today) { rec.reopened = true; continue; }
        if ((byDay.get(day) ?? 0) < rec.total) fail('day-drop', `${day}: ${rec.total} -> ${byDay.get(day) ?? 0}`);
      }
      for (const d of v.days) if (d.dayKey < today) {
        const rec = finished.get(d.dayKey);
        if (!rec) finished.set(d.dayKey, { total: d.total, reopened: false });
        else if (d.total >= rec.total) rec.total = d.total;
      }
      if (op.t === 'restore') {
        // A day that is today or later at the restore is replaced by the backup's, even if a clock set ahead once
        // showed it finished (Jenil, 24 Oct: a restore replaces today).
        for (const day of [...finished.keys()]) if (day >= today) finished.delete(day);
        // What a finished day closed with survives a restore; only today is replaced (Jenil, 24 Oct).
        // Less any purchase dated after that day that the phone still keeps (a clock set back, then a restore).
        const later = snap ? (await db.ledger.toArray()).filter(f => !f.deleted && f.kind === 'purchase' && f.dayKey > snap!.day).reduce((sum, f) => sum + Number(f.inputs.price ?? 0), 0) : 0;
        if (snap && v.shards < snap.shards - later) fail('shards-drop-finished', `${snap.shards} - ${later} later -> ${v.shards}`);
        for (const id of snap?.owned ?? []) if (!v.owned.includes(id)) fail('owned-lost-finished', id);
        owned = new Set(v.owned);
      }
      maxXp = Math.max(maxXp, v.totalXp); maxLevel = Math.max(maxLevel, v.level); lastShards = v.shards;
      for (const id of v.owned) owned.add(id);
    };
    const setClock = (local: Date) => { now = local.getTime(); vi.setSystemTime(now); };
    const reconcile = async () => { if (skip) { skip = false; skipped = true; return; } await reconcileGamify(db, now); };
    await reconcile();
    for (let step = 0; step < ops.length; step++) {
      const op = ops[step]!;
      const saved = { maxXp, maxLevel, lastShards };
      skipped = false;
      let spent = 0;
      const d = new Date(now);
      if (op.t === 'day') { d.setDate(d.getDate() + 1); d.setHours(op.hour, op.min, 0, 0); setClock(d); }
      else if (op.t === 'fwd' || op.t === 'back') { d.setDate(d.getDate() + (op.t === 'fwd' ? op.days : -op.days)); d.setHours(op.hour, 0, 0, 0); setClock(d); }
      else if (op.t === 'tz') env.TZ = op.zone;
      else if (op.t === 'at') { const next = new Date(now); next.setHours(op.hour, op.min, 0, 0); if (next.getTime() <= now) next.setDate(next.getDate() + 1); setClock(next); }
      else if (op.t === 'skipReconcile') skip = true;
      if (op.t === 'day' || op.t === 'fwd' || op.t === 'back' || op.t === 'tz' || op.t === 'at') {
        await check(step, op, 0);
        await reconcile();
      } else if (op.t === 'act') {
        setClock(new Date(now + op.mins * 60_000));
        const day = dayKey(now);
        try {
          if (op.kind === 'task') {
            const id = `fz-${++taskN}`;
            await tasks.createTask({ id, title: 'Fuzz task', size: 'S', estimateMin: 15, plannedSize: 'S', dayKey: day, scheduledStart: now, mustOrCould: 'could' }, now);
            await tasks.completeTask(id, now + 60_000);
          } else if (op.kind === 'rest') await train.restDayCheck(now, 20);
          else if (op.kind === 'board') {
            const run = { id: `daily:${day}:crowns`, type: 'crowns', dayKey: day, daily: true, diff: 'easy', result: 'solved', hintsUsed: 0, updatedAt: now, deleted: 0, deviceId } as PuzzleRunRow;
            await db.transaction('rw', db.ledger, () => putDailyBoardFact(db, run, false, now));
          } else if (op.kind === 'soft') { await setSoftState(db, 'tired', now); await doSoftThing(db, 'breathe', now); }
          else if (op.kind === 'lights') await tasks.recordLightsOut(now);
          else {
            const items = catalogue(day), item = items[op.item % items.length]!;
            if ((await purchaseShopItem(db, item.id, now)).ok) spent = item.price;
          }
        } catch { /* a refused action (rest bank full, Must limit) is fine */ }
        await check(step, op, spent);
        spent = 0;
        await reconcile();
      } else if (op.t === 'backup') backups.push(await exportBackup(db, now));
      else if (op.t === 'restore') {
        const today = dayKey(now);
        const last = (await db.settings.toArray()).filter(row => !row.deleted && row.key.startsWith('economy.close:') && row.key.slice(14) < today).sort((a, b) => a.key < b.key ? -1 : 1).at(-1);
        const value = last?.value as { shards?: number; owned?: string[] } | undefined;
        snap = value && last ? { day: last.key.slice(14), shards: Math.max(0, value.shards ?? 0), owned: value.owned ?? [] } : undefined;
        if (backups.length) await importBackup(db, backups[op.pick % backups.length]!);
        await check(step, op, 0);
        await reconcile();
      }
      await check(step, op.t === 'restore' ? { t: 'skipReconcile' } : op, spent);
      // A step whose reconcile never ran (the app shut at once) showed numbers nothing could record: no close and no
      // seen-up-to day. The next steps are held to what the app last had a chance to save (cj3 fuzz seed 3180).
      if (skipped) ({ maxXp, maxLevel, lastShards } = saved);
      if (env.FUZZ_TRACE) {
        const v = await view();
        const closes = (await db.settings.toArray()).filter(r => r.key.startsWith('economy.close:')).map(r => `${r.key.slice(14)}=${(r.value as { shards: number }).shards}`);
        console.log(step, JSON.stringify(op), env.TZ, 'today', dayKey(now), 'xp', v.totalXp, 'lvl', v.level, 'sh', v.shards, 'owned', v.owned.join('|'),
          'facts', (await db.ledger.toArray()).map(f => `${f.kind}@${f.dayKey.slice(5)}`).join(' '), 'closes', closes.join(' '));
      }
      if (failures.length) break;
    }
    return failures;
  } finally {
    await db.delete();
    env.TZ = 'Asia/Kolkata';
  }
}

it('the economy never drops XP, level, a finished day, Shards or owned items under clock, time-zone and restore moves', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const broken: string[] = [];
  // CI runs seeds 1000-1019; FUZZ_SEED runs one seed, FUZZ_BASE and FUZZ_COUNT a longer local run.
  const only = env.FUZZ_SEED ? [Number(env.FUZZ_SEED)] : Array.from({ length: Number(env.FUZZ_COUNT ?? 20) }, (_, i) => Number(env.FUZZ_BASE ?? 1000) + i);
  for (const seed of only) {
    const failures = await runSequence(generate(seed, 60));
    if (failures.length) broken.push(`seed ${seed}: ${failures[0]}`);
  }
  vi.useRealTimers();
  expect(broken).toEqual([]);
}, 3_600_000);
