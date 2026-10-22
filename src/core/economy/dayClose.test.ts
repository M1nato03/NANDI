import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { addEconomyDays, closeKey, closesFor, deriveEconomy, mergeClose } from './deriveEconomy';

let serial = 0;
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'test',
});
const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'test' });
const task = (day: string) => row(day, 'tasks', 'done', { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 });
const full = (day: string) => row(day, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 });
const board = (day: string) => row(day, 'mind', 'board', { daily: true });
/** Runs the close step of reconcileGamify once on each first open from the day after `from` to `today`. */
function closeDays(facts: LedgerRow[], settings: SettingRow[], from: string, today: string): SettingRow[] {
  let rows = [...settings];
  for (let open = addEconomyDays(from, 1); open <= today; open = addEconomyDays(open, 1)) {
    for (const [day, candidate] of closesFor(facts, rows, open)) {
      if (day < from) continue;
      const existing = rows.find(row => row.key === closeKey(day))?.value;
      rows = [...rows.filter(row => row.key !== closeKey(day)), setting(closeKey(day), mergeClose(existing, candidate))];
    }
  }
  return rows;
}
const v2 = [setting('economy.v2From', '2026-10-01')];

describe('closing the books (economy second opinion 22)', () => {
  it('keeps a closed day\'s XP and Season SP when a late answer later revokes its perfect drop', () => {
    const day = '2026-11-03', today = '2026-11-05';
    const answers = Array.from({ length: 5 }, () => row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: false, correct: true }));
    const facts = [task(day), full(day), ...answers, row(day, 'gamify', 'perfect-drop'), row(day, 'gamify', 'learn-drop', {})];
    facts.at(-1)!.refId = day;
    const settings = closeDays(facts, v2, day, today);
    const before = deriveEconomy(facts, undefined, settings, today);
    // A sync brings one more answer to that drop, given after bedtime: the replay alone would revoke the perfect drop.
    const late = [...facts, row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: true, correct: true })];
    const raw = deriveEconomy(late, undefined, v2, today);
    const kept = deriveEconomy(late, undefined, settings, today);
    expect(raw.totalXp).toBeLessThan(before.totalXp);
    expect(kept.totalXp).toBe(before.totalXp);
    expect(kept.days.find(item => item.dayKey === day)!.held).toBeGreaterThan(0);
    expect(kept.season.sp).toBe(before.season.sp);
    expect(kept.shards).toBeGreaterThanOrEqual(before.shards);
  });

  it('keeps the streak when a changed rest weekday would turn a past rest day into a miss', () => {
    const days = ['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06'];
    const facts = days.flatMap(day => [task(day), full(day), board(day)]);
    const wednesday = [...v2, setting('economy.restWeekday', 3)];
    const settings = closeDays(facts, wednesday, '2026-11-02', '2026-11-07');
    const before = deriveEconomy(facts, undefined, settings, '2026-11-07').streak.days;
    const moved = settings.map(item => item.key === 'economy.restWeekday' ? { ...item, value: 4 } : item);
    expect(deriveEconomy(facts, undefined, moved.filter(item => !item.key.startsWith('economy.close:')), '2026-11-07').streak.days).toBeLessThan(before);
    expect(deriveEconomy(facts, undefined, moved, '2026-11-07').streak.days).toBe(before);
  });

  it('still lets a real miss after the close pause the streak', () => {
    const days = ['2026-11-02', '2026-11-03', '2026-11-04'];
    const facts = days.flatMap(day => [task(day), full(day), board(day)]);
    // Bank empty: four rest days arrive on the 1st, so spend them first with four unmarked days in October.
    const settings = closeDays(facts, v2, '2026-11-02', '2026-11-05');
    const later = deriveEconomy(facts, undefined, settings, '2026-11-12');
    const raw = deriveEconomy(facts, undefined, v2, '2026-11-12');
    expect(later.streak.days).toBe(raw.streak.days);
    expect(later.streak.paused).toBe(raw.streak.paused);
  });

  it('keeps Shards and owned items when an earlier purchase would replay differently', () => {
    const day = '2026-11-03', today = '2026-11-05';
    const answers = Array.from({ length: 5 }, () => row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: false, correct: true }));
    const facts = [task(day), full(day), ...answers, row(day, 'gamify', 'perfect-drop'), row(day, 'gamify', 'daily-quest'), row(day, 'gamify', 'badge-tier')];
    const settings = closeDays(facts, v2, day, today);
    const before = deriveEconomy(facts, undefined, settings, today);
    const late = [...facts, row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: true })];
    expect(deriveEconomy(late, undefined, settings, today).shards).toBe(before.shards);
    const owned = settings.map(item => item.key === closeKey(day) ? { ...item, value: { ...(item.value as object), owned: ['banner:dawn'] } } : item);
    expect(deriveEconomy(late, undefined, owned, today).owned).toContain('banner:dawn');
  });

  it('ignores a close for today or one that is not an object', () => {
    const day = '2026-11-03';
    const facts = [task(day)];
    const odd = [...v2, setting(closeKey(day), { total: 999 }), setting(closeKey('2026-11-02'), 'nonsense')];
    expect(deriveEconomy(facts, undefined, odd, day).totalXp).toBe(deriveEconomy(facts, undefined, v2, day).totalXp);
  });

  it('never lowers any number over random later syncs of earlier facts', () => {
    let seed = 7;
    const rand = () => (seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648;
    const kinds = [
      (day: string) => task(day), (day: string) => full(day), (day: string) => board(day),
      (day: string) => row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: rand() < 0.5, correct: true }),
      (day: string) => row(day, 'gamify', 'perfect-drop'),
    ];
    for (let trial = 0; trial < 20; trial++) {
      const start = '2026-11-02';
      const facts: LedgerRow[] = [];
      let settings = [...v2];
      let last = deriveEconomy(facts, undefined, settings, start);
      for (let index = 1; index <= 10; index++) {
        const today = addEconomyDays(start, index);
        settings = closeDays(facts, settings, addEconomyDays(today, -1), today);
        // Today's activity, plus a sync that lands on an earlier, closed day.
        for (let count = Math.floor(rand() * 4); count > 0; count--) facts.push(kinds[Math.floor(rand() * kinds.length)]!(today));
        if (rand() < 0.6) facts.push(kinds[Math.floor(rand() * kinds.length)]!(addEconomyDays(start, Math.floor(rand() * index))));
        const view = deriveEconomy(facts, undefined, settings, today);
        expect(view.totalXp, `trial ${trial} day ${index}`).toBeGreaterThanOrEqual(last.totalXp);
        expect(view.shards, `trial ${trial} day ${index}`).toBeGreaterThanOrEqual(last.shards);
        last = view;
      }
    }
  });

  it('accepts a purchase once: a later re-count of earlier earnings never skips it now and charges it later', () => {
    const day = '2026-11-03';
    const answers = Array.from({ length: 5 }, () => row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: false, correct: true }));
    const earned = [task(day), full(day), ...answers, row(day, 'gamify', 'perfect-drop'),
      row(day, 'gamify', 'daily-quest'), row(day, 'gamify', 'daily-quest'), ...Array.from({ length: 10 }, () => row(day, 'gamify', 'badge-tier'))];
    const balance = deriveEconomy(earned, undefined, v2, day).shards;
    const purchase = row(day, 'economy', 'purchase', { itemId: 'banner:dawn', price: 100 });
    expect(balance).toBeGreaterThanOrEqual(100);
    const facts = [...earned, purchase];
    // A late answer revokes the perfect drop, so the replayed balance may now be short of the price: still bought.
    const late = [...facts, row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: true })];
    // Exactly 100 before; 99 once the late answer revokes the perfect drop, which the old rule would have skipped on.
    expect(deriveEconomy(late.filter(item => item !== purchase), undefined, v2, '2026-11-04').shards).toBeLessThan(100);
    const view = deriveEconomy(late, undefined, v2, '2026-11-04');
    expect(view.owned).toContain('banner:dawn');
    expect(view.shards).toBe(Math.max(0, deriveEconomy(late.filter(item => item !== purchase), undefined, v2, '2026-11-04').shards - 100));
  });

  it('a close taken while the streak was paused never restarts the old streak', () => {
    const facts = ['2026-11-02', '2026-11-03', '2026-11-04'].flatMap(day => [task(day), full(day), board(day)]);
    // 4 rest days arrive on 1 Nov; spend them with four empty days, then miss once more so the streak pauses.
    const settings = closeDays(facts, v2, '2026-11-02', '2026-11-11');
    const paused = settings.find(row => row.key === closeKey('2026-11-09'))!.value as { paused: boolean; streak: number };
    expect(paused.paused).toBe(true);
    // A day long after the pause: the old run does not come back just because the close held its count.
    const later = [...facts, task('2026-11-12'), full('2026-11-12'), board('2026-11-12')];
    expect(deriveEconomy(later, undefined, settings, '2026-11-13').streak.days).toBe(deriveEconomy(later, undefined, v2, '2026-11-13').streak.days);
  });

  it('a late purchase dated on or before a closed day is still charged', () => {
    const day = '2026-11-03', today = '2026-11-05';
    const earned = [task(day), full(day), ...Array.from({ length: 30 }, () => row(day, 'gamify', 'badge-tier'))];
    const settings = closeDays(earned, v2, day, today);
    const before = deriveEconomy(earned, undefined, settings, today).shards;
    const late = [...earned, row(day, 'economy', 'purchase', { itemId: 'banner:dawn', price: 100 })];
    const view = deriveEconomy(late, undefined, settings, today);
    expect(view.owned).toContain('banner:dawn');
    expect(view.shards).toBe(before - 100);
  });

  it('a purchase keeps the price it was bought at after the price table changes', () => {
    const day = '2026-11-03', today = '2026-11-05';
    const earned = [task(day), full(day), ...Array.from({ length: 30 }, () => row(day, 'gamify', 'badge-tier'))];
    const before = deriveEconomy(earned, undefined, v2, today).shards;
    // Bought for 80 under an older price table; today's table says 100 (second opinion 28: never free, never lost).
    const facts = [...earned, row(day, 'economy', 'purchase', { itemId: 'banner:dawn', price: 80 })];
    const settings = closeDays(facts, v2, day, today);
    for (const view of [deriveEconomy(facts, undefined, v2, today), deriveEconomy(facts, undefined, settings, today)]) {
      expect(view.owned).toContain('banner:dawn');
      expect(view.shards).toBe(before - 80);
    }
  });

  it('one purchase stored at two prices (bad data) counts the higher one', () => {
    const close = (price: number) => ({ total: 0, sp: 0, streak: 0, paused: false, shards: 200, owned: ['banner:dawn'],
      purchases: [{ id: 'purchase:p', itemId: 'banner:dawn', price, dayKey: '2026-11-03' }] });
    expect(mergeClose(close(100), close(150))!.purchases.map(item => item.price)).toEqual([150]);
    expect(mergeClose(close(150), close(100))!.purchases.map(item => item.price)).toEqual([150]);
  });

  it('keeps Season SP when a closed day is later re-scored lower', () => {
    const day = '2026-11-03', today = '2026-11-05';
    const answers = Array.from({ length: 5 }, () => row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: false, correct: true }));
    const facts = [task(day), full(day), board(day), ...answers, row(day, 'gamify', 'perfect-drop')];
    const settings = closeDays(facts, v2, day, today);
    const sp = deriveEconomy(facts, undefined, settings, today).season.sp;
    const late = [...facts, row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: true })];
    expect(deriveEconomy(late, undefined, v2, today).season.sp).toBeLessThan(sp);
    expect(deriveEconomy(late, undefined, settings, today).season.sp).toBe(sp);
  });
});
