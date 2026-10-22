import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { addEconomyDays, CLOSE_PREFIX, closeKey, closesFor, deriveEconomy, keptCandidates, mergeCloseMaps, type DayClose } from './deriveEconomy';

// Seeded simulation of day close v3 (economy review 32, Codex pass 4): every open closes the finished days the
// way reconcileGamify does; late facts, restores of older backups (in the older, cumulative close shape) and a
// second phone's closes arrive along the way. A closed day's numbers never fall, and the merge is order-free.
let serial = 0;
let seed = 1;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'sim' });
const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'sim' });
const shop: [string, number][] = [['freeze', 50], ['banner:dawn', 100], ['cardback:weave', 100], ['banner:grove', 150], ['puzzle:paths', 150]];
const closesOf = (rows: SettingRow[]) => new Map(rows.filter(r => r.key.startsWith(CLOSE_PREFIX)).map(r => [r.key.slice(CLOSE_PREFIX.length), r.value] as const));
const withCloses = (rows: SettingRow[], closes: Map<string, unknown>) => [...rows.filter(r => !r.key.startsWith(CLOSE_PREFIX)), ...[...closes].map(([day, value]) => setting(closeKey(day), value))];
/** reconcileGamify's close step: never-closed days older than 120 stay unclosed. */
function open(facts: LedgerRow[], rows: SettingRow[], today: string): SettingRow[] {
  const stored = closesOf(rows);
  const oldest = addEconomyDays(today, -120);
  const candidates = keptCandidates(closesFor(facts, rows, today), stored, oldest);
  return withCloses(rows, mergeCloseMaps(stored, candidates));
}
/** The older close shape: every purchase to date in every close. */
const cumulative = (closes: Map<string, unknown>) => {
  const days = [...closes.keys()].sort();
  return new Map(days.map((day, index) => [day, { ...(closes.get(day) as DayClose),
    purchases: days.slice(0, index + 1).flatMap(earlier => (closes.get(earlier) as DayClose).purchases) }]));
};
function today(facts: LedgerRow[], day: string) {
  if (rand() < 0.8) facts.push(row(day, 'tasks', 'done', { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }));
  if (rand() < 0.5) facts.push(row(day, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 }));
  if (rand() < 0.5) facts.push(row(day, 'mind', 'board', { daily: true }));
  for (let tier = 0; tier < 3; tier++) if (rand() < 0.5) facts.push(row(day, 'gamify', 'badge-tier'));
  if (rand() < 0.25) { const [itemId, price] = shop[Math.floor(rand() * shop.length)]!; facts.push(row(day, 'economy', 'purchase', { itemId, price })); }
  // A sync brings a late purchase or a late after-bedtime answer for an earlier day.
  if (rand() < 0.12) facts.push(row(addEconomyDays(day, -1 - Math.floor(rand() * 3)), 'economy', 'purchase', { itemId: 'freeze', price: 50 }));
  if (rand() < 0.1) facts.push(row(addEconomyDays(day, -2), 'mind', 'learn-answer', { afterBedtime: true }));
}
const snapshot = (facts: LedgerRow[], rows: SettingRow[], day: string) => {
  const view = deriveEconomy(facts, undefined, rows, day);
  return { shards: view.shards, owned: [...view.owned].sort(), totals: new Map(view.days.filter(d => d.dayKey < day).map(d => [d.dayKey, d.total])) };
};
function expectNoFall(before: ReturnType<typeof snapshot>, after: ReturnType<typeof snapshot>, where: string) {
  expect(after.shards, `${where}: shards`).toBeGreaterThanOrEqual(before.shards);
  for (const id of before.owned) expect(after.owned, `${where}: owned`).toContain(id);
  for (const [day, total] of before.totals) expect(after.totals.get(day) ?? 0, `${where}: XP on ${day}`).toBeGreaterThanOrEqual(total);
}

describe('day close v3, seeded simulation', () => {
  it('restores of older backups and a second phone never lower a closed day, over 40 days', () => {
    for (let trial = 0; trial < 3; trial++) {
      seed = 1000 + trial;
      let facts: LedgerRow[] = [];
      let rows: SettingRow[] = [setting('economy.v2From', '2026-10-01')];
      const backups: { facts: LedgerRow[]; rows: SettingRow[] }[] = [];
      let other = new Map<string, unknown>();
      for (let day = '2026-11-01', d = 0; d < 40; d++) {
        today(facts, day);
        day = addEconomyDays(day, 1);
        rows = open(facts, rows, day);
        backups.push({ facts: [...facts], rows: [...rows] });
        if (d === 10) other = closesOf(rows);
        const before = snapshot(facts, rows, day);
        if (d % 7 === 6) {
          // Restore a backup taken 3 opens earlier, written in the older cumulative shape, onto this phone.
          const backup = backups[backups.length - 4]!;
          facts = [...backup.facts];
          // The backup is sparse (some of its days have no close) and in the older cumulative shape.
          const sparse = new Map([...cumulative(closesOf(backup.rows))].filter(() => rand() < 0.6));
          rows = withCloses(rows, mergeCloseMaps(sparse, closesOf(rows)));
          expectNoFall(before, snapshot(facts, rows, day), `trial ${trial} restore on ${day}`);
        }
        if (d === 25) {
          // A second phone's older closes merge in (a three-way history: this phone, the backup, the other).
          rows = withCloses(rows, mergeCloseMaps(other, closesOf(rows)));
          expectNoFall(before, snapshot(facts, rows, day), `trial ${trial} other phone on ${day}`);
        }
      }
    }
  });

  it('a long gap past the 120-day window closes again without losing a purchase or a closed day', () => {
    seed = 77;
    const facts: LedgerRow[] = [];
    let rows: SettingRow[] = [setting('economy.v2From', '2026-10-01')];
    let day = '2026-11-01';
    for (let d = 0; d < 20; d++) { today(facts, day); day = addEconomyDays(day, 1); rows = open(facts, rows, day); }
    const before = snapshot(facts, rows, day);
    // 130 days away; a late purchase from the first weeks syncs in while away.
    facts.push(row('2026-11-05', 'economy', 'purchase', { itemId: 'banner:sky', price: 150 }));
    // And one dated inside the skipped part of the gap (never closed, older than 120 days).
    facts.push(row('2026-12-15', 'economy', 'purchase', { itemId: 'theme:linen', price: 400 }));
    day = addEconomyDays(day, 130);
    rows = open(facts, rows, day);
    const after = snapshot(facts, rows, day);
    for (const [closed, total] of before.totals) expect(after.totals.get(closed)).toBeGreaterThanOrEqual(total);
    for (const id of before.owned) expect(after.owned).toContain(id);
    expect(after.owned).toContain('banner:sky');
    // The skipped-window purchase was re-hosted in the first kept close, so it survives a restore that drops it.
    const hosted = [...closesOf(rows).values()].flatMap(close => (close as DayClose).purchases.map(item => item.itemId));
    expect(hosted).toContain('theme:linen');
    const lost = facts.filter(fact => fact.inputs.itemId !== 'theme:linen');
    expect(deriveEconomy(lost, undefined, rows, day).owned).toContain('theme:linen');
    // The gap days older than 120 stay unclosed; the recent ones close.
    const keys = [...closesOf(rows).keys()];
    expect(keys.some(key => key > '2026-11-21' && key < addEconomyDays(day, -120))).toBe(false);
    expect(keys).toContain(addEconomyDays(day, -1));
  });

  it('Codex pass 4 #1: a sparse restore that re-hosts a purchase also charges for it', () => {
    const close = (shards: number, purchases: { id: string; price: number; dayKey: string }[] = []) => ({ total: 10, sp: 0, streak: 1, paused: false, shards, owned: [],
      purchases: purchases.map(item => ({ ...item, itemId: 'freeze' })) });
    const phone = new Map([['2026-11-03', close(100)]]);
    const backup = new Map([['2026-11-05', close(50, [{ id: 'p', price: 50, dayKey: '2026-11-02' }])]]);
    for (const merged of [mergeCloseMaps(phone, backup), mergeCloseMaps(backup, phone)]) {
      expect(merged.get('2026-11-03')).toMatchObject({ shards: 50, purchases: [{ id: 'p' }] });
      expect(merged.get('2026-11-05')).toMatchObject({ shards: 50, purchases: [] });
    }
  });

  it('merging closes is order-free: commutative and associative on random close sets', () => {
    seed = 4242;
    const randomCloses = () => {
      const out = new Map<string, unknown>();
      for (let d = 0; d < 12; d++) {
        if (rand() < 0.3) continue;
        const day = addEconomyDays('2026-11-01', d);
        const purchases = Array.from({ length: Math.floor(rand() * 3) }, () => {
          const [itemId, price] = shop[Math.floor(rand() * shop.length)]!;
          // A purchase id is one real purchase, so it always names the same item and day.
          const dayKey = addEconomyDays(day, -Math.floor(rand() * 3));
          return { id: `${itemId}@${dayKey}`, itemId, price, dayKey };
        });
        out.set(day, { total: Math.floor(rand() * 300), sp: Math.floor(rand() * 200), streak: Math.floor(rand() * 9), paused: rand() < 0.2,
          shards: Math.floor(rand() * 800), owned: purchases.filter(item => item.itemId !== 'freeze').map(item => item.itemId), purchases });
      }
      return out;
    };
    const canon = (merged: Map<string, DayClose>) => [...merged].map(([day, close]) => [day, { ...close, owned: [...close.owned].sort(),
      purchases: [...close.purchases].sort((a, b) => a.id.localeCompare(b.id)) }]);
    for (let trial = 0; trial < 40; trial++) {
      const a = randomCloses(), b = randomCloses(), c = randomCloses();
      expect(canon(mergeCloseMaps(a, b))).toEqual(canon(mergeCloseMaps(b, a)));
      expect(canon(mergeCloseMaps(mergeCloseMaps(a, b), c))).toEqual(canon(mergeCloseMaps(a, mergeCloseMaps(b, c))));
    }
  });
});
