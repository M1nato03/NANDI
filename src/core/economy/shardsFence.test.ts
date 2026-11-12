import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { addEconomyDays, CLOSE_PREFIX, closeKey, closesFor, deriveEconomy, mergeCloseMaps, PEAK_KEY, shardsStopFrom, type DayClose } from './deriveEconomy';
import { purchaseDecision } from './shop';

// Spec 660 §3.1, the Shards fence (a9's design, jenil-0b 12 Nov). Shards stop the day after economy.v12From: no
// perXp, no level bonus, no season award paid on or after it, no per-fact Shards. Level and XP never change, the
// shop closes on v12From, and every day before the stop keeps exactly what it closed with. Asserts A-D here; E is the
// shared cutoffKeys restore test (backup.test.ts); F is the cj3 fuzz twin run (clockFuzz.test.ts).
let serial = 0;
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'test',
});
const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'test' });
const task = (day: string) => row(day, 'tasks', 'done', { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 });
const full = (day: string) => row(day, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 });
const board = (day: string) => row(day, 'mind', 'board', { daily: true });
const days = (from: string, to: string) => { const out: string[] = []; for (let d = from; d <= to; d = addEconomyDays(d, 1)) out.push(d); return out; };

// 2 Nov - 15 Dec, today 16 Dec. Season 1 runs 2 Nov - 6 Dec; its award is paid on 7 Dec.
const FIRST = '2026-11-02', LAST = '2026-12-15', TODAY = '2026-12-16';
const ALL = days(FIRST, LAST);
const facts: LedgerRow[] = [
  ...ALL.flatMap(day => [task(day), full(day), board(day)]),
  // Per-fact Shards on both sides of every cutoff used below.
  ...['2026-11-10', '2026-12-03', '2026-12-08', '2026-12-12'].flatMap(day => [row(day, 'gamify', 'daily-quest'), row(day, 'gamify', 'badge-tier'), row(day, 'gamify', 'unit-chest')]),
  // A purchase before every cutoff.
  row('2026-11-25', 'economy', 'purchase', { itemId: 'theme:linen', price: 60, accepted: true }),
];
const BASE = [setting('economy.v2From', '2026-10-01'), setting('economy.v3From', '2026-10-01')];
/** The stored closes as reconcileGamify keeps them: each first open closes the finished days. */
function closeDays(settings: SettingRow[], until: string): SettingRow[] {
  let rows = [...settings];
  for (let open = addEconomyDays(FIRST, 1); open <= until; open = addEconomyDays(open, 1)) {
    const stored = new Map(rows.filter(r => r.key.startsWith(CLOSE_PREFIX)).map(r => [r.key.slice(CLOSE_PREFIX.length), r.value] as const));
    for (const [day, merged] of mergeCloseMaps(stored, closesFor(facts, rows, open))) rows = [...rows.filter(r => r.key !== closeKey(day)), setting(closeKey(day), merged)];
  }
  return rows;
}
const closes = (rows: SettingRow[]) => new Map(rows.filter(r => r.key.startsWith(CLOSE_PREFIX)).map(r => [r.key.slice(CLOSE_PREFIX.length), r.value as DayClose]));

describe('spec 660 §3.1: the Shards fence', () => {
  for (const v12From of ['2026-12-06', '2026-11-20']) {
    const stop = shardsStopFrom([setting('economy.v12From', v12From)]);
    const without = closeDays(BASE, TODAY);
    const withCut = closeDays([...BASE, setting('economy.v12From', v12From)], TODAY);

    it(`A (v12From ${v12From}): every day before the stop closes exactly as it does without the cutoff`, () => {
      expect(stop).toBe(addEconomyDays(v12From, 1));
      const a = closes(without), b = closes(withCut);
      const before = [...a.keys()].filter(day => day < stop);
      expect(before.length).toBeGreaterThan(10);
      for (const day of before) expect(b.get(day), day).toEqual(a.get(day));
    });

    it(`B (v12From ${v12From}): XP, level and the next level are the same with and without it`, () => {
      const a = deriveEconomy(facts, undefined, without, TODAY), b = deriveEconomy(facts, undefined, withCut, TODAY);
      expect([b.totalXp, b.level, b.nextLevelXp]).toEqual([a.totalXp, a.level, a.nextLevelXp]);
      expect(b.level).toBeGreaterThan(2);
    });

    it(`C (v12From ${v12From}): the Shards shown on every day from the stop on stay what the day before the stop ended with, less purchases`, () => {
      const last = deriveEconomy(facts.filter(f => f.dayKey < stop), undefined, closeDays([...BASE, setting('economy.v12From', v12From)], stop), addEconomyDays(stop, -1)).shards;
      for (const day of days(stop, TODAY)) {
        const view = deriveEconomy(facts.filter(f => f.dayKey <= day), undefined, closeDays([...BASE, setting('economy.v12From', v12From)], day), day);
        // Less any purchase already in the ledger on those days (an older build's sale still replays and charges).
        const spent = facts.filter(f => f.kind === 'purchase' && f.dayKey >= stop && f.dayKey <= day).reduce((sum, f) => sum + Number(f.inputs.price), 0);
        expect(view.shards, day).toBe(last - spent);
      }
      // Without the cutoff the same days do earn: the fence is what holds them.
      expect(deriveEconomy(facts, undefined, without, TODAY).shards).toBeGreaterThan(last);
    });
  }

  it('the season award is keyed on its payout day: paid on 7 Dec unless the stop is on or before it', () => {
    const paidCut = closeDays([...BASE, setting('economy.v12From', '2026-12-08')], TODAY);
    const noAward = closeDays([...BASE, setting('economy.v12From', '2026-12-06')], TODAY);
    const before = (rows: SettingRow[]) => (closes(rows).get('2026-12-06')?.shards ?? 0);
    const on = (rows: SettingRow[]) => (closes(rows).get('2026-12-07')?.shards ?? 0);
    // With the stop on 9 Dec the 7 Dec close rises by the award plus that day's earnings; with the stop on 7 Dec, by nothing.
    expect(on(noAward) - before(noAward)).toBe(0);
    expect(on(paidCut) - before(paidCut)).toBeGreaterThan(0);
  });

  it('D: a peak level reached after the stop mints nothing when a later deleted fact drops the replay below it', () => {
    // Days up to 9 Dec are closed; 10-15 Dec are not yet (the phone was not opened), so their facts can still go.
    const v12 = [...BASE, setting('economy.v12From', '2026-11-20')];
    const rows = closeDays(v12, '2026-12-10');
    const open = (f: LedgerRow) => f.dayKey >= '2026-12-10';
    const up = deriveEconomy(facts, undefined, rows, TODAY);
    // A sync deletes the unclosed days' facts: the replay falls below the level the peak keeps.
    const gone = facts.map(f => open(f) && f.mode !== 'economy' ? { ...f, deleted: 1 as const } : f);
    const down = deriveEconomy(gone, undefined, rows, TODAY);
    expect(down.level).toBeLessThan(up.level);
    const peak = setting(PEAK_KEY, { totalXp: up.totalXp, level: up.level });
    const after = deriveEconomy(gone, undefined, [...rows, peak], TODAY);
    expect(after.level).toBe(up.level);
    // No Shard for a level first reached after the stop.
    expect(after.shards).toBe(down.shards);
    // Before the fence the same deletion paid the peak's unpaid levels, 20 each (cj3 D).
    const old = closeDays(BASE, '2026-12-10');
    const oldUp = deriveEconomy(facts, undefined, old, TODAY), oldDown = deriveEconomy(gone, undefined, old, TODAY);
    const oldAfter = deriveEconomy(gone, undefined, [...old, setting(PEAK_KEY, { totalXp: oldUp.totalXp, level: oldUp.level })], TODAY);
    expect(oldAfter.shards).toBeGreaterThan(oldDown.shards);
  });

  it('the shop is closed from v12From itself; what is owned stays owned', () => {
    const rows = closeDays([...BASE, setting('economy.v12From', '2026-12-06')], TODAY);
    const view = deriveEconomy(facts, undefined, rows, TODAY);
    expect(view.owned).toContain('theme:linen');
    expect(purchaseDecision('freeze', facts, rows, '2026-12-06').ok).toBe(false);
    expect(purchaseDecision('freeze', facts, rows, '2026-12-05').reason).not.toBe('The shop is closed. What you own stays yours.');
  });
});
