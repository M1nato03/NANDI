import { describe, expect, it } from 'vitest';
import { deriveJar, jarActs, jarDay, jarDuration, jarFinishLine } from './jar';
import { deriveTrek, STRETCHES_PER_LEG } from './trek';
import { deriveEconomy } from '../economy/deriveEconomy';
import { lightsOutNightKey } from '../time/dayKey';
import { realThingsMs, recapWindow, buildRecap, type RecapSources } from '../recap';
import type { FocusRow, LedgerRow } from '../../data/types';
import type { Trail } from './trail';

const meta = { deleted: 0 as const, deviceId: 'test' };
let serial = 0;
const fact = (mode: string, kind: string, day: string, inputs: Record<string, unknown> = {}, at?: number): LedgerRow =>
  ({ ...meta, id: `${kind}:${++serial}`, mode, kind, refId: String(serial), dayKey: day, inputs, updatedAt: at ?? new Date(`${day}T12:00:00`).getTime() + serial });
const train = (day: string, at?: number) => fact('train', 'session', day, { workingSets: 6, status: 'completed' }, at);
const focus = (startedAt: string, endedAt: string): FocusRow => ({ ...meta, id: `f${++serial}`, taskId: 't', startedAt: new Date(startedAt).getTime(), endedAt: new Date(endedAt).getTime(), updatedAt: 1 });
const makeTrail = (places: number): Trail => ({
  id: 't', name: 'T', region: 'R',
  places: Array.from({ length: places }, (_, i) => ({ id: `p${i}`, name: `Place ${i}`, kind: 'camp' as const, regionLine: '' })),
  legs: Array.from({ length: places - 1 }, (_, i) => ({ from: `p${i}`, to: `p${i + 1}`, landmark: { id: `l${i}`, name: `Landmark ${i}`, kind: 'tree' }, constellation: `C${i}` })),
}) as unknown as Trail;
const trail = makeTrail(10);
// A long trail (test only) so a 70-day history never walks off its end before the update day.
const long = makeTrail(60);

describe('spec 54: what fills the jar', () => {
  it('reads each source at its own value, and nothing self-reported', () => {
    const day = '2026-11-05';
    const facts = [
      train(day), fact('train', 'session', day, { workingSets: 0, status: 'safety' }),
      fact('mind', 'board', day), fact('mind', 'mystery', day), fact('calm', 'session', day, { minutes: 5 }),
      fact('read', 'chapter', day), fact('read', 'idea', day), fact('mind', 'lesson', day), fact('learn', 'learn-lesson', day),
      fact('bonuses', 'lightsout', day, { metTarget: true }), fact('bonuses', 'lightsout', '2026-11-04', { metTarget: false }),
      fact('bonuses', 'lightsout', '2026-11-03', { metTarget: true, backfill: true }),
      fact('pause', 'attempt', day, { outcome: 'act_done' }), fact('pause', 'reason', day, { why: 'scrolling' }),
      fact('quests', 'quest', day), fact('tasks', 'done', day),
    ];
    const kinds = jarActs(facts, []).map(act => `${act.kind}:${act.minutes}`).sort();
    expect(kinds).toEqual(['calm:10', 'lesson:5', 'lightsout:10', 'mind:10', 'mind:10', 'read:5', 'read:5', 'train:10'].sort());
  });
  it('gives focus 5 for each full 30 min in a planning day, split at 04:00', () => {
    const acts = jarActs([], [focus('2026-11-05T10:00:00', '2026-11-05T11:05:00'), focus('2026-11-06T03:00:00', '2026-11-06T05:00:00')]);
    // 65 min on the 5th plus 03:00-04:00 of the 6th (still the 5th's planning day) = 125 min = 4 blocks; 04:00-05:00 = 2.
    expect(acts.map(act => [act.dayKey, act.minutes])).toEqual([['2026-11-05', 20], ['2026-11-06', 10]]);
  });
  it('counts at most 60 a day: an act at 58 adds 2, the rest waits for tomorrow', () => {
    const day = '2026-11-05';
    const facts = [...Array.from({ length: 5 }, () => train(day)), fact('read', 'chapter', day), fact('read', 'idea', day), fact('read', 'idea', day)];
    const acts = jarActs(facts, [focus('2026-11-05T06:00:00', '2026-11-05T06:30:00')]);
    const entries = deriveJar(acts, day, day);
    expect(entries.map(entry => entry.counted).reduce((a, b) => a + b, 0)).toBe(60);
    const partial = deriveJar([...jarActs(Array.from({ length: 5 }, () => train(day)), []), ...jarActs([fact('read', 'chapter', day)], []), { id: 'x', kind: 'read', dayKey: day, minutes: 5, at: Number.MAX_SAFE_INTEGER, label: 'idea read' }], day, day);
    expect(partial.map(entry => entry.counted)).toEqual([10, 10, 10, 10, 10, 5, 5]);
    expect(jarDay(partial, day)).toEqual({ minutes: 60, capped: true });
  });
  it('says what a finish put in, and "Trail done for today." at the cap', () => {
    const base = { id: 'a', kind: 'read' as const, dayKey: 'd', minutes: 5, at: 1, label: 'chapter done' };
    expect(jarFinishLine({ ...base, counted: 5 }, false)).toBe('+5 min into the jar · chapter done');
    expect(jarFinishLine({ ...base, counted: 2 }, true)).toBe('+2 min into the jar · chapter done. Trail done for today.');
    expect(jarFinishLine({ ...base, counted: 0 }, true)).toBe('Trail done for today.');
    expect(jarFinishLine(undefined, false)).toBeNull();
  });
  it('lights out met after midnight lands on the same planning day the economy pays', () => {
    const at = new Date('2026-11-06T00:30:00').getTime();
    const night = lightsOutNightKey(at);
    const row = { ...meta, id: `lightsout:${night}`, mode: 'bonuses', kind: 'lightsout', refId: night, dayKey: night, inputs: { metTarget: true }, updatedAt: at };
    const [act] = jarActs([row], []);
    expect(act!.dayKey).toBe('2026-11-05');
    const day = deriveEconomy([row], undefined, [], '2026-11-06').days.find(entry => entry.lightsOut > 0);
    expect(day?.dayKey).toBe(act!.dayKey);
  });
});

describe('spec 54: the trail walks in jar minutes from jarFrom', () => {
  it('lights stars for sessions only, and a focus-only day still walks', () => {
    const day = '2026-11-05';
    const trek = deriveTrek([fact('read', 'chapter', day), fact('read', 'idea', day), train(day)], trail, '2026-11-01', day, {}, { from: '2026-11-03', focus: [focus('2026-11-05T09:00:00', '2026-11-05T10:00:00')] });
    expect(trek.stars.map(star => star.kind)).toEqual(['train']);
    // 5 + 5 + 10 + 10 = 30 min = one leg.
    expect([trek.place, trek.stretch]).toEqual([1, 0]);
    const quiet = deriveTrek([], trail, '2026-11-01', day, {}, { from: '2026-11-03', focus: [focus('2026-11-05T09:00:00', '2026-11-05T09:30:00')] });
    expect(quiet.today.campDay).toBe(false);
  });
  it('reaches a plan camp exactly at the cap boundary', () => {
    const day = '2026-11-05';
    // Six sessions = 60 min = 2 legs; the 7th waits.
    const trek = deriveTrek(Array.from({ length: 7 }, () => train(day)), trail, day, day, {}, { from: day, focus: [] });
    expect([trek.place, trek.stretch, trek.jar.capped]).toEqual([2, 0, true]);
    expect(trek.jar.entries.at(-1)!.counted).toBe(0);
  });
  it('never moves an install back, and nobody leaps on the update day (golden, 70 mixed days)', () => {
    let seed = 7;
    const random = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    let largest = 0, oldLargest = 0;
    for (let install = 0; install < 30; install++) {
      const facts: LedgerRow[] = [], focusRows: FocusRow[] = [];
      const days = Array.from({ length: 70 }, (_, i) => { const date = new Date('2026-08-20T12:00:00'); date.setDate(date.getDate() + i); return date.toISOString().slice(0, 10); });
      for (const day of days) {
        const roll = random();
        if (random() < .3) for (let k = 0; k < 1 + Math.floor(random() * 3); k++) facts.push(roll < .4 ? train(day) : roll < .7 ? fact('mind', 'board', day) : fact('calm', 'session', day, { minutes: 10 }));
        if (random() < .2) facts.push(fact('read', 'chapter', day));
        if (random() < .15) focusRows.push(focus(`${day}T09:00:00`, `${day}T${String(10 + Math.floor(random() * 3)).padStart(2, '0')}:00:00`));
        if (random() < .15) facts.push(fact('bonuses', 'lightsout', day, { metTarget: true }));
      }
      const from = days[40]!;
      expect(deriveTrek(facts, long, days[0]!, days[39]!).complete).toBe(false);
      const position = (trek: { place: number; stretch: number }) => trek.place * STRETCHES_PER_LEG + trek.stretch;
      for (const today of days) {
        const old = position(deriveTrek(facts, long, days[0]!, today));
        const jar = position(deriveTrek(facts, long, days[0]!, today, {}, { from, focus: focusRows }));
        if (today < from) expect(jar).toBe(old);
        else expect(jar).toBeGreaterThanOrEqual(old);
        if (today === from) { largest = Math.max(largest, jar - position(deriveTrek(facts, long, days[0]!, days[39]!))); oldLargest = Math.max(oldLargest, old - position(deriveTrek(facts, long, days[0]!, days[39]!))); }
      }
    }
    // The update day walks at most one capped day (60 min = 2 legs = 6 stretches), never a re-derived history.
    expect(largest).toBeLessThanOrEqual(6);
    console.log(`spec 54: the largest update-day move over 30 mixed installs was ${largest} stretches (the old walk that day: at most ${oldLargest})`);
  });
});

describe('spec 54: Home and the receipt read the same measured time', () => {
  it('Home\'s "real things" is the receipt\'s REAL THINGS for this week so far', () => {
    const now = new Date('2026-11-05T12:00:00').getTime();
    const source: RecapSources = { tasks: [], focus: [focus('2026-11-03T09:00:00', '2026-11-03T10:10:00')], sessions: [], quests: [], concepts: [], logs: [], ledger: [fact('calm', 'session', '2026-11-04', { minutes: 12 })] };
    expect(realThingsMs(recapWindow(now + 7 * 86_400_000), source)).toBe(buildRecap(now + 7 * 86_400_000, source).realMs);
    expect(buildRecap(now + 7 * 86_400_000, source).realMs).toBe(82 * 60_000);
  });
});

describe('spec 54: pause reasons stay private and move nothing', () => {
  it('a reason row pays nothing and reaches no economy, useful day, trek or jar output', () => {
    const day = '2026-11-05';
    const base = [train(day), fact('pause', 'attempt', day, { outcome: 'opened_anyway' })];
    const withReasons = [...base, ...Array.from({ length: 8 }, () => fact('pause', 'reason', day, { why: 'scrolling' }))];
    const strip = (view: ReturnType<typeof deriveEconomy>) => JSON.stringify({ xp: view.totalXp, days: view.days, level: view.level });
    expect(strip(deriveEconomy(withReasons, undefined, [], day))).toBe(strip(deriveEconomy(base, undefined, [], day)));
    expect(jarActs(withReasons, [])).toEqual(jarActs(base, []));
    const trek = (facts: LedgerRow[]) => deriveTrek(facts, trail, day, day, {}, { from: day, focus: [] });
    expect(JSON.stringify(trek(withReasons))).toBe(JSON.stringify(trek(base)));
  });
});

describe('the jar\'s duration text (spec 55 review)', () => {
  it('drops zero parts: exact hours read "2 h", never "2 h 0 m"', () => {
    expect([240, 250, 45, 0, 120, 300].map(jarDuration)).toEqual(['4 h', '4 h 10 m', '45 m', '0 m', '2 h', '5 h']);
  });
});
