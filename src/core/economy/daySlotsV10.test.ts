import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { RULES, RULES_BOUNDS, RULES_HISTORY, type Rules } from '../rules.config';
import { inNightWindow } from '../time';
import { daySlots, MIND_ACTS, type MindAct } from './daySlots';
import { deriveEconomy } from './deriveEconomy';

// Spec 571 §0.20 v2 (Jenil decided 7 Nov) + build rules 1-5: the rings are the Hat-trick slots from economy.v10From.
let serial = 0;
const KEY = '2026-11-08';
const at = (day: string, time: string) => new Date(`${day}T${time}:00`).getTime();
const fact = (mode: string, kind: string, inputs: Record<string, unknown> = {}, time = '12:00', day = KEY, refId = String(++serial)): LedgerRow =>
  ({ id: `${kind}:${refId}:${++serial}`, mode, kind, refId, dayKey: day, inputs, updatedAt: at(day, time) + serial, deleted: 0, deviceId: 'test' });
const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'test' });

const planned = (time = '12:00', extra: Record<string, unknown> = {}, day = KEY) => fact('tasks', 'done', { wasPlanned: true, plannedSize: 'M', ...extra }, time, day);
const workout = (time = '12:00', extra: Record<string, unknown> = {}, day = KEY) => fact('train', 'session', { xp: 30, ...extra }, time, day);
const walk = (time = '12:00', extra: Record<string, unknown> = {}, day = KEY) => fact('train', 'rest', { minutes: 10, ...extra }, time, day);
/** One mind act's facts, written at `time`. */
const ACT: Record<MindAct, (time: string, extra?: Record<string, unknown>, day?: string) => LedgerRow[]> = {
  drop: (time, extra = {}, day = KEY) => Array.from({ length: 5 }, (_, i) => fact('mind', 'learn-answer', { dropId: `drop:daily:${day}`, correct: true, ...extra }, time, day, `a${i}:${day}`)),
  chapter: (time, extra = {}, day = KEY) => [fact('read', 'chapter', { readDrops: [], newSteps: 2, ...extra }, time, day)],
  calm: (time, extra = {}, day = KEY) => [fact('calm', 'session', { minutes: 5, way: 'quiet', ...extra }, time, day)],
  case: (time, extra = {}, day = KEY) => [fact('mind', 'mystery', { daily: true, result: 'solved', ...extra }, time, day)],
  board: (time, extra = {}, day = KEY) => [fact('mind', 'board', { daily: true, ...extra }, time, day)],
  cards: (time, extra = {}, day = KEY) => Array.from({ length: RULES.streak.minDueCardsForMark }, () => fact('mind', 'card', { correct: true, ...extra }, time, day)),
};
const ctx = (v10: boolean, key = KEY, rules: Rules = RULES, v7 = false, v9 = false) => ({ key, rules, history: RULES_HISTORY, v7, v9, v10 });
const NOUN: Record<MindAct, string> = { drop: "today’s idea", chapter: 'a chapter', calm: 'a Calm sit', case: 'a solved case', board: "Kapi’s board", cards: 'your cards' };

describe('spec 571 rings: each ring per source (from v10)', () => {
  it('Yatra lights for a planned task done, not for an unplanned one, and keeps the first promise', () => {
    expect(daySlots([fact('tasks', 'done', { planned: false })], ctx(true)).rings!.yatra).toBeNull();
    const first = planned('09:00'), second = planned('11:00');
    const slots = daySlots([second, first], ctx(true));
    expect(slots.plannedTask).toBe(true);
    expect(slots.rings!.yatra).toBe(first.refId);
  });

  it('Body: a workout, a rest walk, and the workout wins when both happened', () => {
    expect(daySlots([workout()], ctx(true)).rings!.body).toBe('workout');
    expect(daySlots([walk()], ctx(true)).rings!.body).toBe('walk');
    expect(daySlots([walk('08:00'), workout('18:00')], ctx(true)).rings!.body).toBe('workout');
    expect(daySlots([], ctx(true)).rings!.body).toBeNull();
  });

  it('Mind: each of the six acts alone is half, never the Hat-trick slot', () => {
    for (const act of MIND_ACTS) {
      const slots = daySlots(ACT[act]('12:00'), ctx(true));
      expect(slots.rings!.mind, act).toEqual([act]);
      expect(slots.mindSlot, act).toBe(false);
    }
  });

  it('Mind: all 15 pairings close it, named in the order done (the tap lines are the fixture)', () => {
    const lines: string[] = [];
    for (let i = 0; i < MIND_ACTS.length; i++) for (let j = i + 1; j < MIND_ACTS.length; j++) {
      const [a, b] = [MIND_ACTS[i]!, MIND_ACTS[j]!];
      const forward = daySlots([...ACT[b]('15:00'), ...ACT[a]('09:00')], ctx(true));
      expect(forward.rings!.mind).toEqual([a, b]);
      expect(forward.mindSlot).toBe(true);
      // Done the other way round, the marks swap.
      expect(daySlots([...ACT[a]('15:00'), ...ACT[b]('09:00')], ctx(true)).rings!.mind).toEqual([b, a]);
      lines.push(`Mind: ${NOUN[a]} and ${NOUN[b]}.`);
    }
    expect(lines).toEqual([
      "Mind: today’s idea and a chapter.", "Mind: today’s idea and a Calm sit.", "Mind: today’s idea and a solved case.", "Mind: today’s idea and Kapi’s board.", "Mind: today’s idea and your cards.",
      'Mind: a chapter and a Calm sit.', 'Mind: a chapter and a solved case.', "Mind: a chapter and Kapi’s board.", 'Mind: a chapter and your cards.',
      'Mind: a Calm sit and a solved case.', "Mind: a Calm sit and Kapi’s board.", 'Mind: a Calm sit and your cards.',
      "Mind: a solved case and Kapi’s board.", 'Mind: a solved case and your cards.', "Mind: Kapi’s board and your cards.",
    ]);
  });

  it('two of the same act stay half; a side board, a revealed case and too few cards light nothing', () => {
    expect(daySlots([...ACT.chapter('09:00'), ...ACT.chapter('10:00')], ctx(true)).rings!.mind).toEqual(['chapter']);
    expect(daySlots([...ACT.calm('09:00'), ...ACT.calm('10:00')], ctx(true)).rings!.mind).toEqual(['calm']);
    expect(daySlots([fact('mind', 'board', { daily: false }), fact('mind', 'mystery', { result: 'revealed' }), ...ACT.cards('12:00').slice(1)], ctx(true)).rings!.mind).toEqual([]);
  });

  it('all three lit = the Hat-trick', () => {
    const slots = daySlots([planned(), workout(), ...ACT.calm('09:00'), ...ACT.board('10:00')], ctx(true));
    expect([slots.plannedTask, slots.body, slots.mindSlot, slots.hatTrick]).toEqual([true, true, true, true]);
  });
});

describe('spec 571 build rules (§5 gates)', () => {
  it('rule 1: a past drop-only day keeps its Hat-trick and XP; the same day under v10 keeps every XP item and only loses the Hat-trick', () => {
    const day = (key: string) => [planned('09:00', {}, key), workout('10:00', {}, key), ...ACT.drop('11:00', {}, key)];
    const facts = [...day('2026-11-05'), ...day(KEY)];
    const without = deriveEconomy(facts, undefined, [], KEY).days;
    const withV10 = deriveEconomy(facts, undefined, [setting('economy.v10From', KEY)], KEY).days;
    const past = (days: typeof without) => days.find(row => row.dayKey === '2026-11-05')!;
    expect(past(withV10)).toEqual(past(without));
    expect(past(withV10).hatTrick).toBe(true);
    const now = withV10.find(row => row.dayKey === KEY)!, old = without.find(row => row.dayKey === KEY)!;
    expect(old.hatTrick).toBe(true);
    expect(now.hatTrick).toBe(false);
    expect({ ...now, hatTrick: true, mindSlot: true, total: now.total + RULES.bonuses.hatTrickXp }).toEqual(old);
    // Rule 2: a drop-only day still marks a useful day.
    expect(now.mark).toBe(true);
  });

  it('rule 2: a drop-only day (and nothing else) marks a useful day under v10; a Calm or a chapter alone marks none', () => {
    const view = (facts: LedgerRow[]) => deriveEconomy(facts, undefined, [setting('economy.v10From', KEY)], KEY).days.find(row => row.dayKey === KEY);
    expect(view(ACT.drop('12:00'))?.mark).toBe(true);
    expect(view([...ACT.calm('12:00'), ...ACT.chapter('13:00')])?.mark ?? false).toBe(false);
    expect(daySlots([...ACT.calm('12:00'), ...ACT.chapter('13:00')], ctx(true)).useful).toBe(false);
  });

  it('rule 4: a drop read as a chapter (or as a spec 41 sitting) is one act = half', () => {
    const drop = `drop:daily:${KEY}`;
    const asChapter = [fact('learn', 'learn-lesson', { dropId: drop }, '09:00'), fact('gamify', 'learn-drop', { chapter: true }, '09:05', KEY, KEY),
      fact('read', 'chapter', { readDrops: [drop], newSteps: 3 }, '09:05')];
    const slots = daySlots(asChapter, ctx(true, KEY, RULES, true, true));
    expect(slots.dropWasChapter).toBe(true);
    expect(slots.rings!.mind).toEqual(['drop']);
    expect(slots.mindSlot).toBe(false);
    const sitting = [fact('learn', 'learn-lesson', { dropId: drop }, '09:00'), fact('gamify', 'learn-drop', { chapter: true }, '09:05', KEY, KEY), fact('read', 'idea', { dropId: drop, newSteps: 2 }, '09:05')];
    expect(daySlots(sitting, ctx(true, KEY, RULES, true, true)).rings!.mind).toEqual(['drop']);
    // A different chapter read later is a second act.
    expect(daySlots([...asChapter, ...ACT.chapter('20:00')], ctx(true, KEY, RULES, true, true)).rings!.mind).toEqual(['drop', 'chapter']);
  });

  it('rule 4: a 2-minute Calm is nothing; 5 measured minutes is half', () => {
    expect(daySlots(ACT.calm('12:00', { minutes: 2 }), ctx(true)).rings!.mind).toEqual([]);
    expect(daySlots(ACT.calm('12:00', { minutes: 4 }), ctx(true)).rings!.mind).toEqual([]);
    expect(daySlots(ACT.calm('12:00', { minutes: 5 }), ctx(true)).rings!.mind).toEqual(['calm']);
    // Calm's XP is unchanged: the 2-minute sit still pays its minutes.
    const day = deriveEconomy(ACT.calm('12:00', { minutes: 2 }), undefined, [setting('economy.v6From', '2026-11-01'), setting('economy.v10From', KEY)], KEY).days.find(row => row.dayKey === KEY);
    expect(day?.calm).toBe(2 * RULES.calm.xpPerMin);
  });

  it('rule 3: a planned task done at 23:50 after bedtime (stamped night) lights no Yatra and no Hat-trick, but still pays and marks the day', () => {
    const rows = [planned('23:50', { night: true }), workout('10:00'), ...ACT.calm('11:00'), ...ACT.board('12:00')];
    const slots = daySlots(rows, ctx(true));
    expect(slots.rings!.yatra).toBeNull();
    expect([slots.plannedTask, slots.hatTrick, slots.useful]).toEqual([false, false, true]);
    const view = (settings: SettingRow[]) => deriveEconomy(rows, undefined, settings, KEY).days.find(row => row.dayKey === KEY)!;
    const day = view([setting('economy.v10From', KEY)]);
    expect(day.tasks).toBe(view([]).tasks);
    expect(day.tasks).toBeGreaterThan(0);
    // A night workout and a night Calm leave Body and Mind too.
    expect(daySlots([workout('23:55', { night: true })], ctx(true)).rings!.body).toBeNull();
    expect(daySlots([...ACT.calm('00:30', { night: true }), ...ACT.board('12:00')], ctx(true)).rings!.mind).toEqual(['board']);
    // Before v10 the night stamp changes nothing (old rows have none; the old slots read every row).
    expect(daySlots(rows, ctx(false)).hatTrick).toBe(true);
  });

  it('rule 3: the 23:40 drop / 06:10 chapter fixture: neither day counts the drop; the next day is half lit by the chapter', () => {
    const next = '2026-11-09';
    const drop = ACT.drop('23:40', { afterBedtime: true, night: true });
    const chapter = ACT.chapter('06:10', {}, next);
    expect(daySlots([...drop], ctx(true)).rings!.mind).toEqual([]);
    expect(daySlots([...chapter], ctx(true, next)).rings!.mind).toEqual(['chapter']);
    // An act stamped in the 04:00-05:00 part of the window belongs to the new planning day and still counts for none.
    expect(daySlots(ACT.case('04:30', { night: true }, next), ctx(true, next)).rings!.mind).toEqual([]);
  });

  it('rule 3: lights out and the night drop never light a ring', () => {
    const rows = [fact('bonuses', 'lightsout', { metTarget: true }), ...Array.from({ length: 6 }, (_, i) => fact('mind', 'learn-answer', { dropId: `drop:night:${KEY}` }, '23:00', KEY, `n${i}`))];
    const slots = daySlots(rows, ctx(true));
    expect(slots.rings).toEqual({ yatra: null, body: null, mind: [] });
  });

  it('the rest walk always pays more than 0, in today\'s rules and every past one, so a checked walk lights Body', () => {
    expect(RULES_BOUNDS['train.restDayCheckXp']![0]).toBe(1);
    for (const rules of [RULES, ...RULES_HISTORY.map(entry => entry.rules as Rules)]) expect(rules.train.restDayCheckXp).toBeGreaterThan(0);
  });
});

describe('spec 571 rings: the property (ring state === the Hat-trick slots)', () => {
  let seed = 1010;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]!;
  const stamp = () => rand() < 0.2 ? { night: true } : rand() < 0.1 ? { afterBedtime: true } : {};
  const time = () => `${String(Math.floor(rand() * 24)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}`;
  function fuzzDay(key: string): LedgerRow[] {
    const rows: LedgerRow[] = [];
    if (rand() < 0.5) rows.push(planned(time(), stamp(), key));
    if (rand() < 0.2) rows.push(fact('tasks', 'done', { planned: false, ...stamp() }, time(), key));
    if (rand() < 0.4) rows.push(workout(time(), stamp(), key));
    if (rand() < 0.3) rows.push(walk(time(), stamp(), key));
    for (const act of MIND_ACTS) if (rand() < 0.3) rows.push(...ACT[act](time(), stamp(), key));
    if (rand() < 0.2) rows.push(fact('calm', 'session', { minutes: pick([1, 2, 4]), ...stamp() }, time(), key));
    if (rand() < 0.2) rows.push(fact('read', 'chapter', { readDrops: [`drop:daily:${key}`] }, time(), key));
    if (rand() < 0.2) rows.push(fact('gamify', 'learn-drop', rand() < 0.5 ? { chapter: true } : {}, time(), key, key));
    return rows.sort(() => rand() - 0.5);
  }

  it('on 3000 fuzzed v10 days: each ring matches its slot, all three = the Hat-trick, XP reads and the useful mark are unchanged, and night rows are as good as absent', () => {
    let closed = 0, half = 0, hats = 0;
    for (let day = 0; day < 3000; day++) {
      const key = `2026-${String(11 + Math.floor(day / 1500)).padStart(2, '0')}-${String(1 + (day % 28)).padStart(2, '0')}`;
      const rows = fuzzDay(key);
      const v7 = day % 2 === 0, v9 = v7 && day % 4 === 0;
      const now = daySlots(rows, ctx(true, key, RULES, v7, v9));
      const rings = now.rings!;
      expect(rings.yatra !== null).toBe(now.plannedTask);
      expect(rings.body !== null).toBe(now.body);
      expect(rings.mind.length >= 2).toBe(now.mindSlot);
      expect(new Set(rings.mind).size).toBe(rings.mind.length);
      expect(now.hatTrick).toBe(rings.yatra !== null && rings.body !== null && rings.mind.length >= 2);
      // XP reads come from every row, so no item's XP moves; the useful mark is the old "any one".
      const old = daySlots(rows, ctx(false, key, RULES, v7, v9));
      const XP_READS = ['bestSession', 'restXp', 'rest', 'mindRows', 'caseSolved', 'dailyBoard', 'cards', 'learnDrop', 'dropWasChapter', 'useful'] as const;
      for (const read of XP_READS) expect(now[read], read).toEqual(old[read]);
      expect(now.useful).toBe(old.plannedTask || old.body || old.mindSlot);
      // Rule 3: the rings ignore night rows exactly as if they were not there.
      const awake = daySlots(rows.filter(row => row.inputs.night !== true), ctx(true, key, RULES, v7, v9));
      expect([awake.plannedTask, awake.body, awake.mindSlot, awake.hatTrick, awake.rings]).toEqual([now.plannedTask, now.body, now.mindSlot, now.hatTrick, now.rings]);
      closed += +(rings.mind.length >= 2); half += +(rings.mind.length === 1); hats += +now.hatTrick;
    }
    for (const count of [closed, half, hats]) { expect(count).toBeGreaterThan(50); expect(count).toBeLessThan(2950); }
  });
});

describe('spec 571 rule 3: the night window', () => {
  const when = (time: string, day = KEY) => at(day, time);
  it('the default 01:30 bedtime counts as set: 01:30 → 05:00, crossing the 04:00 turn', () => {
    expect([when('01:29'), when('01:30'), when('03:59'), when('04:30'), when('04:59'), when('05:00'), when('23:50'), when('12:00')].map(t => inNightWindow(t, RULES.night.defaultBedtime)))
      .toEqual([false, true, true, true, true, false, false, false]);
  });
  it('an evening bedtime crosses midnight: 23:00 → 05:00', () => {
    expect([when('22:59'), when('23:00'), when('23:50'), when('00:30'), when('04:59'), when('05:00')].map(t => inNightWindow(t, '23:00'))).toEqual([false, true, true, true, true, false]);
  });
  it('a daytime bedtime (shift work) gets bedtime + 7 h', () => {
    expect([when('08:59'), when('09:00'), when('15:59'), when('16:00')].map(t => inNightWindow(t, '09:00'))).toEqual([false, true, true, false]);
  });
  // b2 (8 Nov, a9's edge in 26c8b54): a bedtime 20:00-04:59 runs to 05:00; 05:00-19:59 gets bedtime + 7 h, so an
  // afternoon bedtime no longer makes a 15 h window.
  it.each([
    ['20:00', '05:00'], ['22:00', '05:00'], ['23:30', '05:00'], [RULES.night.defaultBedtime, '05:00'],
    ['14:00', '21:00'], ['08:00', '15:00'], ['19:59', '02:59'], ['05:00', '12:00'],
  ])('bedtime %s: the window ends at %s', (bed, end) => {
    const minutes = (time: string) => { const [h = 0, m = 0] = time.split(':').map(Number); return h * 60 + m; };
    const clock = (total: number) => `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    const startAt = minutes(bed), endAt = minutes(end);
    expect(inNightWindow(when(clock(startAt - 1 + 1440)), bed), 'a minute before bedtime').toBe(false);
    expect(inNightWindow(when(clock(startAt)), bed), 'at bedtime').toBe(true);
    expect(inNightWindow(when(clock(endAt - 1 + 1440)), bed), 'the last minute').toBe(true);
    expect(inNightWindow(when(clock(endAt)), bed), 'at the end').toBe(false);
  });
});
