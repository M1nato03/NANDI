import { describe, expect, it } from 'vitest';
import { deriveJar, focusJarMinutes, focusRateFrom, FOCUS_RATE_FROM_KEY, JAR, jarActs, jarLineFor } from './jar';
import { deriveTrek } from './trek';
import { plausibleMax } from '../crew/crew';
import { realThingsMs, recapWindow, type RecapSources } from '../recap';
import type { FocusRow, LedgerRow, SettingRow } from '../../data/types';
import type { Trail } from './trail';

// Spec 571 E1 (§0.12, Jenil decided): from yatra.focusRateFrom, focus fills the jar 1 min per full 3 min within the
// planning day; the 60-a-day cap is unchanged and every day before keeps 5 per full 30 (forward only, like jarFrom).
const meta = { deleted: 0 as const, deviceId: 'test' };
let serial = 0;
const fact = (mode: string, kind: string, day: string, inputs: Record<string, unknown> = {}): LedgerRow =>
  ({ ...meta, id: `${kind}:${++serial}`, mode, kind, refId: String(serial), dayKey: day, inputs, updatedAt: new Date(`${day}T12:00:00`).getTime() + serial });
const focus = (startedAt: string, endedAt: string, extra: Partial<FocusRow> = {}): FocusRow =>
  ({ ...meta, id: `f${++serial}`, taskId: 't', startedAt: new Date(startedAt).getTime(), endedAt: new Date(endedAt).getTime(), updatedAt: 1, ...extra });
const setting = (key: string, value: unknown, deleted: 0 | 1 = 0): SettingRow => ({ key, value, updatedAt: 1, deleted, deviceId: 'test' });
const FROM = '2026-11-08';
const minutesOf = (acts: ReturnType<typeof jarActs>) => acts.filter(act => act.kind === 'focus').map(act => [act.dayKey, act.minutes]);

describe('spec 571 E1: focus fills the jar 1\u00a0min per 3 from focusRateFrom', () => {
  it('the gate day: the day before keeps 5 per full 30, the effective day and after pay 1 per full 3', () => {
    const rows = [focus('2026-11-07T10:00:00', '2026-11-07T11:05:00'), focus('2026-11-08T10:00:00', '2026-11-08T11:05:00'), focus('2026-11-09T10:00:00', '2026-11-09T10:30:00')];
    // 65 min: before = 2 blocks of 30 = 10; from the gate = floor(65 / 3) = 21; 30 min = 10.
    expect(minutesOf(jarActs([], rows, FROM))).toEqual([['2026-11-07', 10], ['2026-11-08', 21], ['2026-11-09', 10]]);
    // Without the setting (not yet written) every day keeps the old rate.
    expect(minutesOf(jarActs([], rows))).toEqual([['2026-11-07', 10], ['2026-11-08', 10], ['2026-11-09', 5]]);
  });

  it('rounds the remainder down within the day: 8\u00a0min = 2, 2\u00a0min = nothing, 3\u00a0min = 1', () => {
    expect(focusJarMinutes(8 * 60_000, FROM, FROM)).toBe(2);
    expect(focusJarMinutes(8 * 60_000 + 59_999, FROM, FROM)).toBe(2);
    expect(focusJarMinutes(9 * 60_000, FROM, FROM)).toBe(3);
    expect(focusJarMinutes(29 * 60_000, '2026-11-07', FROM)).toBe(0);
    expect(minutesOf(jarActs([], [focus('2026-11-08T10:00:00', '2026-11-08T10:08:00')], FROM))).toEqual([['2026-11-08', 2]]);
    expect(minutesOf(jarActs([], [focus('2026-11-08T10:00:00', '2026-11-08T10:02:00')], FROM))).toEqual([]);
    expect(minutesOf(jarActs([], [focus('2026-11-08T10:00:00', '2026-11-08T10:03:00')], FROM))).toEqual([['2026-11-08', 1]]);
    // Two 2-minute focuses in one day add up before rounding: 4 min = 1.
    expect(minutesOf(jarActs([], [focus('2026-11-08T10:00:00', '2026-11-08T10:02:00'), focus('2026-11-08T11:00:00', '2026-11-08T11:02:00')], FROM))).toEqual([['2026-11-08', 1]]);
  });

  it('splits at 04:00 per planning day, each part at its own day\'s rate, and subtracts paused time', () => {
    // 03:00-05:00 on the 8th: 03:00-04:00 belongs to the 7th (old rate, 60 min = 10), 04:00-05:00 to the 8th (60 / 3 = 20).
    expect(minutesOf(jarActs([], [focus('2026-11-08T03:00:00', '2026-11-08T05:00:00')], FROM))).toEqual([['2026-11-07', 10], ['2026-11-08', 20]]);
    const start = new Date('2026-11-08T10:00:00').getTime();
    const paused = focus('2026-11-08T10:00:00', '2026-11-08T10:20:00', { pauses: [{ at: start + 5 * 60_000, resumeAt: start + 15 * 60_000 }] } as Partial<FocusRow>);
    // 20 min with 10 paused = 10 min = 3.
    expect(minutesOf(jarActs([], [paused], FROM))).toEqual([['2026-11-08', 3]]);
  });

  it('keeps the 60-a-day cap: 3 h of focus fills 60 at most, and other acts that day wait for tomorrow', () => {
    const facts = [fact('train', 'session', FROM, { workingSets: 6, status: 'completed' })];
    const entries = deriveJar(jarActs(facts, [focus('2026-11-08T05:00:00', '2026-11-08T08:00:00')], FROM), FROM, FROM);
    expect(entries.reduce((sum, entry) => sum + entry.counted, 0)).toBe(JAR.dayCap);
    expect(entries.find(entry => entry.kind === 'focus')?.minutes).toBe(60);
  });

  it('G4: every non-focus act and every day before the effective day is identical with and without the rate', () => {
    const days = ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'];
    const facts = days.flatMap(day => [fact('train', 'session', day, { workingSets: 6, status: 'completed' }), fact('mind', 'board', day), fact('calm', 'session', day, { minutes: 5 }),
      fact('read', 'chapter', day), fact('read', 'idea', day), fact('mind', 'lesson', day), fact('bonuses', 'lightsout', day, { metTarget: true })]);
    const rows = days.flatMap(day => [focus(`${day}T09:00:00`, `${day}T09:47:00`), focus(`${day}T14:00:00`, `${day}T14:40:00`)]);
    const before = deriveJar(jarActs(facts, rows), days[0]!, days.at(-1)!);
    const after = deriveJar(jarActs(facts, rows, FROM), days[0]!, days.at(-1)!);
    // The non-focus acts' minutes and the earlier days' counted minutes match exactly; only the later focus acts move.
    expect(after.filter(entry => entry.dayKey < FROM)).toEqual(before.filter(entry => entry.dayKey < FROM));
    const shape = (list: typeof before) => list.filter(entry => entry.kind !== 'focus').map(entry => [entry.id, entry.kind, entry.dayKey, entry.minutes, entry.at]);
    expect(shape(after)).toEqual(shape(before));
    // 87 focus min a day: old 2 blocks = 10, new floor(87 / 3) = 29 (a day's total is capped at 60 either way).
    expect(after.filter(entry => entry.kind === 'focus').map(entry => [entry.dayKey, entry.minutes])).toEqual([['2026-11-05', 10], ['2026-11-06', 10], ['2026-11-07', 10], ['2026-11-08', 29], ['2026-11-09', 29]]);
  });

  it('the trail walks the new rate only from the effective day', () => {
    const trail = { id: 't', name: 'T', region: 'R', places: Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, kind: 'camp', regionLine: '' })),
      legs: Array.from({ length: 9 }, (_, i) => ({ from: `p${i}`, to: `p${i + 1}`, landmark: { id: `l${i}`, name: `L${i}`, kind: 'tree' }, constellation: `C${i}` })) } as unknown as Trail;
    const rows = [focus('2026-11-07T10:00:00', '2026-11-07T10:30:00'), focus('2026-11-08T10:00:00', '2026-11-08T10:30:00')];
    const old = deriveTrek([], trail, '2026-11-01', '2026-11-08', {}, { from: '2026-11-01', focus: rows });
    const rated = deriveTrek([], trail, '2026-11-01', '2026-11-08', {}, { from: '2026-11-01', focus: rows, focusRateFrom: FROM });
    expect(old.jar.entries.map(entry => entry.counted)).toEqual([5, 5]);
    expect(rated.jar.entries.map(entry => entry.counted)).toEqual([5, 10]);
    // 10 old minutes = one stretch, carry 0; 15 = one stretch, carry 5.
    expect([old.jar.carry, rated.jar.carry]).toEqual([0, 5]);
  });

  it('reads the setting once written, ignores a deleted row, and the finish line uses it', () => {
    expect(focusRateFrom([])).toBeUndefined();
    expect(focusRateFrom([setting(FOCUS_RATE_FROM_KEY, FROM)])).toBe(FROM);
    expect(focusRateFrom([setting(FOCUS_RATE_FROM_KEY, FROM, 1)])).toBeUndefined();
    expect(focusRateFrom([setting(FOCUS_RATE_FROM_KEY, 7)])).toBeUndefined();
    // A focus act's line is found by its id (the finish fallback skips focus, as before).
    const row = focus('2026-11-08T10:00:00', '2026-11-08T10:30:00');
    const added = [{ ...fact('tasks', 'done', FROM), id: `focus:${FROM}` }];
    const source = { facts: [], focus: [row], settings: [setting('yatra.jarFrom', '2026-11-01'), setting(FOCUS_RATE_FROM_KEY, FROM)] };
    expect(jarLineFor(source, FROM, new Date('2026-11-08T10:30:00').getTime(), added)).toBe('+10\u00a0min into the jar · focus');
    expect(jarLineFor({ ...source, settings: source.settings.slice(0, 1) }, FROM, new Date('2026-11-08T10:30:00').getTime(), added)).toBe('+5\u00a0min into the jar · focus');
  });

  it('leaves the receipt\'s measured time and the crew plausibility bound alone', () => {
    const now = new Date('2026-11-09T12:00:00').getTime();
    const source = { focus: [focus('2026-11-10T10:00:00', '2026-11-10T10:45:00')], sessions: [], ledger: [] } as unknown as Pick<RecapSources, 'focus' | 'sessions' | 'ledger'>;
    // realThingsMs reads milliseconds, not jar minutes: 45 min of focus is 45 min on the receipt at either rate.
    expect(realThingsMs(recapWindow(now + 7 * 86_400_000), source)).toBe(45 * 60_000);
    expect(plausibleMax('2026-11-08', '2026-11-09')).toBe(2 * JAR.dayCap);
    expect(JAR.dayCap).toBe(60);
  });
});
