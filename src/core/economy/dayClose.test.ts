import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { addEconomyDays, CLOSE_PREFIX, closeKey, closesFor, deriveEconomy, fillHeldBonus, mergeClose, mergeCloseMaps, refundReplaced, restoredPurchase } from './deriveEconomy';

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
    const stored = new Map(rows.filter(row => row.key.startsWith(CLOSE_PREFIX)).map(row => [row.key.slice(CLOSE_PREFIX.length), row.value] as const));
    const candidates = new Map([...closesFor(facts, rows, open)].filter(([day]) => day >= from));
    for (const [day, merged] of mergeCloseMaps(stored, candidates)) rows = [...rows.filter(row => row.key !== closeKey(day)), setting(closeKey(day), merged)];
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

  it('a level the peak keeps pays its unpaid level-up Shards once, never on top of a close that holds them (cj3 D)', () => {
    const day = '2026-11-03';
    const facts = [task(day)];
    const plain = deriveEconomy(facts, undefined, v2, day);
    expect(plain.level).toBe(1);
    const peak = setting('economy.peak', { totalXp: 200, level: 2 });
    expect(deriveEconomy(facts, undefined, [...v2, peak], day).shards).toBe(plain.shards + 20);
    // A close that already holds more than the bonus floors the balance; the bonus is not added on top of it.
    const held = setting(closeKey('2026-11-02'), { total: 0, sp: 0, streak: 0, paused: false, shards: 100, owned: [], purchases: [] });
    const floored = deriveEconomy(facts, undefined, [...v2, held], day).shards;
    expect(deriveEconomy(facts, undefined, [...v2, held, peak], day).shards).toBe(floored);
  });

  it('ignores a close that is not an object; a close for today stays out of today but its totals are kept', () => {
    const day = '2026-11-03';
    const facts = [task(day)];
    const plain = deriveEconomy(facts, undefined, v2, day);
    expect(deriveEconomy(facts, undefined, [...v2, setting(closeKey('2026-11-02'), 'nonsense')], day).totalXp).toBe(plain.totalXp);
    // A close for today means this phone already showed the day as finished (a clock that ran ahead). The real-today
    // day still shows its own replay, and the look-ahead keeps what was shown (cj3 clock fuzz A, C3).
    const ahead = deriveEconomy(facts, undefined, [...v2, setting(closeKey(day), { total: 999 })], day);
    expect(ahead.days.at(-1)!.total).toBe(plain.days.at(-1)!.total);
    expect(ahead.totalXp).toBeGreaterThanOrEqual(999);
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
    const purchase = row(day, 'economy', 'purchase', { itemId: 'banner:dawn', price: 100, accepted: true });
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
    const late = [...earned, row(day, 'economy', 'purchase', { itemId: 'banner:dawn', price: 100, accepted: true })];
    const view = deriveEconomy(late, undefined, settings, today);
    expect(view.owned).toContain('banner:dawn');
    expect(view.shards).toBe(before - 100);
  });

  it('a purchase keeps the price it was bought at after the price table changes', () => {
    const day = '2026-11-03', today = '2026-11-05';
    const earned = [task(day), full(day), ...Array.from({ length: 30 }, () => row(day, 'gamify', 'badge-tier'))];
    const before = deriveEconomy(earned, undefined, v2, today).shards;
    // Bought for 80 under an older price table; today's table says 100 (second opinion 28: never free, never lost).
    const facts = [...earned, row(day, 'economy', 'purchase', { itemId: 'banner:dawn', price: 80, accepted: true })];
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

  it('each close keeps only its own day purchases, so a year of closes stays small (review 32)', () => {
    const start = '2026-01-05', today = '2027-01-05';
    const facts: LedgerRow[] = [];
    for (let day = start; day < today; day = addEconomyDays(day, 1)) {
      facts.push(task(day), full(day), board(day), ...Array.from({ length: 3 }, () => row(day, 'gamify', 'badge-tier')));
      // The shop only sells what the balance covers, so purchases start once a month of Shards is in.
      if (day >= '2026-02-01' && day.endsWith('5')) facts.push(row(day, 'economy', 'purchase', { itemId: 'freeze', price: 50, accepted: true }));
    }
    const started = performance.now();
    const closes = mergeCloseMaps(new Map(), closesFor(facts, v2, today));
    expect(performance.now() - started).toBeLessThan(5_000);
    for (const [day, close] of closes) expect(close.purchases.every(item => item.dayKey === day)).toBe(true);
    expect(JSON.stringify([...closes]).length).toBeLessThan(150_000);
    // The year still charges every purchase once.
    const settings = [...v2, ...[...closes].map(([day, value]) => setting(closeKey(day), value))];
    expect(deriveEconomy(facts, undefined, settings, today).shards).toBe(deriveEconomy(facts, undefined, v2, today).shards);
  });

  it('reads older closes that kept every purchase to date the same way', () => {
    const days = ['2026-11-02', '2026-11-03', '2026-11-04'];
    const facts = days.flatMap(day => [task(day), full(day), ...Array.from({ length: 20 }, () => row(day, 'gamify', 'badge-tier')), row(day, 'economy', 'purchase', { itemId: 'freeze', price: 50, accepted: true })]);
    const perDay = closeDays(facts, v2, days[0]!, '2026-11-06');
    const cumulative = perDay.map(item => {
      if (!item.key.startsWith(CLOSE_PREFIX)) return item;
      const day = item.key.slice(CLOSE_PREFIX.length);
      const all = perDay.filter(other => other.key.startsWith(CLOSE_PREFIX) && other.key.slice(CLOSE_PREFIX.length) <= day).flatMap(other => (other.value as { purchases: unknown[] }).purchases);
      return { ...item, value: { ...(item.value as object), purchases: all } };
    });
    const late = [...facts, row('2026-11-03', 'mind', 'learn-answer', { afterBedtime: true })];
    expect(deriveEconomy(late, undefined, cumulative, '2026-11-06')).toEqual(deriveEconomy(late, undefined, perDay, '2026-11-06'));
  });

  it('a merge charges a later day for an earlier purchase only the other side knew', () => {
    const close = (shards: number, purchases: { id: string; dayKey: string }[] = []) => ({ total: 0, sp: 0, streak: 1, paused: false, shards, owned: [],
      purchases: purchases.map(item => ({ ...item, itemId: 'freeze', price: 50 })) });
    // The phone never saw the purchase on the 3rd; the backup did, and its later balance is lower by its price.
    const phone = new Map([['2026-11-03', close(200)], ['2026-11-05', close(260)]]);
    const backup = new Map([['2026-11-03', close(150, [{ id: 'p', dayKey: '2026-11-03' }])], ['2026-11-05', close(210)]]);
    const merged = mergeCloseMaps(phone, backup);
    expect(merged.get('2026-11-03')).toMatchObject({ shards: 150, purchases: [{ id: 'p' }] });
    expect(merged.get('2026-11-05')).toMatchObject({ shards: 210, purchases: [] });
    expect(mergeCloseMaps(backup, phone).get('2026-11-05')!.shards).toBe(210);
  });
});


describe('level bonus held by a close (cj3 fuzz seeds 2016, 2020)', () => {
  const close = (shards: number, bonus?: number) => ({ total: 10, sp: 10, streak: 1, paused: false, shards, ...(bonus === undefined ? {} : { bonus }), owned: [], purchases: [] });
  it('lifts the close that held less bonus before keeping the higher balance, in either order', () => {
    // 52 with no level bonus yet, against 68 with the 20-Shard bonus: the first is worth 72 once the bonus is paid.
    for (const [a, b] of [[close(52, 0), close(68, 20)], [close(68, 20), close(52, 0)]]) {
      expect(mergeClose(a, b)).toMatchObject({ shards: 72, bonus: 20 });
      expect(mergeCloseMaps(new Map([['2026-11-28', a]]), new Map([['2026-11-28', b]])).get('2026-11-28')).toMatchObject({ shards: 72, bonus: 20 });
    }
  });
  it('will not merge a close that says its bonus with one that does not: fill first (Codex review, item 48)', () => {
    expect(() => mergeClose(close(52), close(68, 20))).toThrow(/fill the level bonus/);
    expect(mergeClose(close(70), close(68))).toMatchObject({ shards: 70 });
  });
});

describe('closes from before 24 Oct merge in any order once they say their bonus (Codex item 47)', () => {
  const close = (shards: number, bonus?: number) => ({ total: 10, sp: 10, streak: 1, paused: false, shards, ...(bonus === undefined ? {} : { bonus }), owned: [], purchases: [] });
  it('gives the counterexample the same result both ways', () => {
    const day = '2026-11-28', one = (value: unknown) => new Map([[day, value]]);
    const a = fillHeldBonus(one(close(10)), new Map([[day, 0]])), b = one(close(0, 0)), c = one(close(0, 100));
    const left = mergeCloseMaps(mergeCloseMaps(a, b), c).get(day)!, right = mergeCloseMaps(a, mergeCloseMaps(b, c)).get(day)!;
    expect([left.shards, left.bonus]).toEqual([right.shards, right.bonus]);
    expect(left).toMatchObject({ shards: 110, bonus: 100 });
  });
});

describe('a restore that replaces a purchase (Codex review of round 5, item 48)', () => {
  const buy = { id: 'purchase:banner:grove:1', itemId: 'banner:grove', price: 150, dayKey: '2026-12-07' };
  const close = (shards: number, purchases: typeof buy[] = [], owned: string[] = []) => ({ total: 10, sp: 10, streak: 1, paused: false, shards, bonus: 0, owned, purchases });
  it('refunds every close from its day on, also the later ones that no longer list it', () => {
    const closes = new Map([['2026-12-06', close(200)], ['2026-12-07', close(50, [buy], ['banner:grove'])], ['2026-12-08', close(52, [], ['banner:grove'])]]);
    const out = refundReplaced(closes, item => item.id === buy.id);
    expect([...out.values()].map(c => c.shards)).toEqual([200, 200, 202]);
    expect([...out.values()].every(c => !c.owned.includes('banner:grove') && !c.purchases.length)).toBe(true);
  });
  it('treats a backup purchase as the same only when id, item and price all match', () => {
    const fact = (inputs: Record<string, unknown>) => ({ id: buy.id, mode: 'economy', kind: 'purchase', refId: 'x', dayKey: buy.dayKey, inputs, updatedAt: 1, deleted: 0 as const, deviceId: 'd' });
    expect(restoredPurchase([fact({ itemId: 'banner:grove', price: 150 })])(buy)).toBe(true);
    expect(restoredPurchase([fact({ itemId: 'banner:grove', price: 1 })])(buy)).toBe(false);
    expect(restoredPurchase([fact({ itemId: 'banner:sky', price: 150 })])(buy)).toBe(false);
  });
});
