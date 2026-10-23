import { describe, expect, it } from 'vitest';
import { boundsOn, boundWindow, chhuttiLine, isKept, rampedWindow, readChhutti, windowBounds, windowUsage, withBounds, type UsageEvent } from './chhutti';
import type { LedgerRow, SettingRow } from '../../data/types';

const min = 60_000;
const from = 1_000 * min, to = 1_060 * min; // a 60-minute window
const ev = (type: UsageEvent['type'], at: number, pkg?: string): UsageEvent => ({ type, at, ...(pkg ? { pkg } : {}) });
const ig = 'com.instagram.android';

describe('chhutti window usage (spec 24 #1, item 55)', () => {
  const yt = 'com.google.android.youtube';
  const chosen = [ig, yt];
  const use = (events: UsageEvent[], logStart?: number) => windowUsage(events, from, to, chosen, logStart);
  it('is unknown, never kept, when the log cannot say who was in front at the start', () => {
    expect(use([])).toBeNull();
    expect(use([], from - 60 * min)).toBeNull();
    // Only events inside the window: the app in front at the start is unknown.
    expect(use([ev('fg', from + 5 * min, ig), ev('bg', from + 9 * min, ig)])).toBeNull();
    expect(windowUsage([ev('off', from - min)], to, from, chosen)).toBeNull();
    // The log starts after the window began (Android keeps events only a few days): unknown.
    expect(use([ev('off', from - min)], from + min)).toBeNull();
  });
  it('a restart or shutdown inside the window is unknown; one before it is fine', () => {
    expect(use([ev('off', from - min), ev('down', from + 10 * min), ev('boot', from + 30 * min)])).toBeNull();
    expect(use([ev('fg', from - 5 * min, 'x'), ev('boot', from + 30 * min)])).toBeNull();
    expect(use([ev('down', from - 40 * min), ev('boot', from - 30 * min), ev('fg', from - 20 * min, 'x')])).toEqual({ chosenAppMs: 0, darkMs: 0 });
  });
  it('a quiet window is known when the screen went dark before it', () => {
    expect(use([ev('on', from - 60 * min), ev('off', from - 2 * min)], from - 60 * min)).toEqual({ chosenAppMs: 0, darkMs: 60 * min });
  });
  it('counts chosen-app time inside the window only, from an app opened before it', () => {
    expect(use([ev('on', from - 30 * min), ev('fg', from - 10 * min, ig), ev('bg', from + 4 * min, ig), ev('fg', from + 40 * min, ig), ev('bg', to + 20 * min, ig)])).toEqual({ chosenAppMs: 24 * min, darkMs: 0 });
  });
  it('counts one front-app timeline, not a sum per app (overlapping events)', () => {
    // YouTube comes to the front at +5 while the Instagram pause arrives late at +10: 20 minutes in all, not 25.
    expect(use([ev('on', from - 30 * min), ev('fg', from - 10 * min, ig), ev('fg', from + 5 * min, yt), ev('bg', from + 10 * min, ig), ev('bg', from + 20 * min, yt)])?.chosenAppMs).toBe(20 * min);
    // Another app in front ends chosen time even before the chosen app's own pause arrives.
    expect(use([ev('on', from - 30 * min), ev('fg', from - 10 * min, ig), ev('fg', from + 5 * min, 'x'), ev('bg', from + 30 * min, ig)])?.chosenAppMs).toBe(5 * min);
  });
  it('an app that is not chosen in front counts nothing', () => {
    expect(use([ev('on', from - 30 * min), ev('fg', from - 10 * min, 'x'), ev('bg', to + min, 'x')])).toEqual({ chosenAppMs: 0, darkMs: 0 });
  });
  it('closes app time when the screen goes dark, and counts the dark minutes', () => {
    expect(use([ev('on', from - 60 * min), ev('fg', from - min, 'x'), ev('fg', from + 10 * min, ig), ev('off', from + 15 * min), ev('on', from + 50 * min)])).toEqual({ chosenAppMs: 5 * min, darkMs: 35 * min });
  });
  it('a screen that turns on first was dark before; no screen events at all means dark minutes are unknown', () => {
    expect(use([ev('fg', from - 5 * min, 'x'), ev('on', from + 20 * min)])?.darkMs).toBe(20 * min);
    expect(use([ev('fg', from - 5 * min, ig), ev('bg', from + min, ig)])).toEqual({ chosenAppMs: min, darkMs: null });
  });
  it('is kept within the grace minutes', () => {
    expect(isKept({ chosenAppMs: 5 * min, darkMs: null }, '2026-11-02')).toBe(true);
    expect(isKept({ chosenAppMs: 5 * min + 1, darkMs: null }, '2026-11-02')).toBe(false);
  });
});

describe('chhutti bounds never rewrite a started day (item 55)', () => {
  const window = { id: 'a', label: 'After dinner', from: '21:00', to: '21:30', since: '2026-11-01' };
  const at = (day: string, time: string) => new Date(`${day}T${time}:00`).getTime();
  it('a change before both starts counts from today', () => {
    const next = withBounds(window, { from: '20:00', to: '20:30' }, at('2026-11-03', '12:00'), '2026-11-03');
    expect(next.past).toEqual([{ from: '21:00', to: '21:30', through: '2026-11-02' }]);
    expect(windowBounds(next, '2026-11-02').fromMs).toBe(at('2026-11-02', '21:00'));
    expect(windowBounds(next, '2026-11-03').fromMs).toBe(at('2026-11-03', '20:00'));
  });
  it('a change after either start counts from tomorrow; today keeps its bounds', () => {
    // Moving 21:00 to 20:00 at 20:30: the new start has passed, so today stays 21:00-21:30.
    const next = withBounds(window, { from: '20:00', to: '20:30' }, at('2026-11-03', '20:30'), '2026-11-03');
    expect(boundsOn(next, '2026-11-03')).toEqual({ from: '21:00', to: '21:30' });
    expect(boundsOn(next, '2026-11-04')).toEqual({ from: '20:00', to: '20:30' });
    // A ramp inside a running window does not stretch it.
    const grown = withBounds(window, { from: '21:00', to: '21:45' }, at('2026-11-03', '21:10'), '2026-11-03');
    expect(boundsOn(grown, '2026-11-03')).toEqual({ from: '21:00', to: '21:30' });
    expect(boundsOn(grown, '2026-11-04')).toEqual({ from: '21:00', to: '21:45' });
  });
  it('two changes keep every day as it was, and the bounds survive a settings read', () => {
    const one = withBounds(window, { from: '20:00', to: '20:30' }, at('2026-11-03', '12:00'), '2026-11-03');
    const two = withBounds(one, { from: '19:00', to: '19:30' }, at('2026-11-05', '20:10'), '2026-11-05');
    const row: SettingRow = { key: 'plan.chhutti', value: { windows: [two] }, updatedAt: 1, deleted: 0, deviceId: 't' };
    const read = readChhutti([row])[0]!;
    expect(['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06'].map(day => boundsOn(read, day).from)).toEqual(['21:00', '20:00', '20:00', '19:00']);
    expect(withBounds(read, { from: '19:00', to: '19:30' }, at('2026-11-06', '12:00'), '2026-11-06')).toBe(read);
  });
});

describe('chhutti windows and lines', () => {
  it('keeps a window between 04:00 and shutdown', () => {
    expect(boundWindow('21:00', 30, '23:15')).toEqual({ from: '21:00', to: '21:30' });
    expect(boundWindow('23:10', 30, '23:15')).toEqual({ from: '23:05', to: '23:15' });
    expect(boundWindow('02:00', 30, '23:15')).toEqual({ from: '04:00', to: '04:30' });
  });
  it('reads only valid windows from settings', () => {
    const row = (value: unknown): SettingRow => ({ key: 'plan.chhutti', value, updatedAt: 1, deleted: 0, deviceId: 't' });
    expect(readChhutti([row({ windows: [{ id: 'a', label: 'After dinner', from: '21:00', to: '21:30' }, { id: 'b', label: 'x', from: '22:00', to: '21:00' }] })])).toEqual([{ id: 'a', label: 'After dinner', from: '21:00', to: '21:30' }]);
    expect(readChhutti([row('nonsense')])).toEqual([]);
  });
  it('grows the window by 15 minutes after 2 kept of every 3 checks, and not past shutdown', () => {
    const window = { id: 'a', label: 'After dinner', from: '21:00', to: '21:30' };
    const fact = (day: string, kept: boolean): LedgerRow => ({ id: `chhutti:${day}:a`, mode: 'tasks', kind: 'chhutti', refId: `${day}:a`, dayKey: day, inputs: { windowId: 'a', kept }, updatedAt: 1, deleted: 0, deviceId: 't' });
    expect(rampedWindow(window, [fact('2026-11-02', true), fact('2026-11-03', true)], '23:15')).toBe(window);
    expect(rampedWindow(window, [fact('2026-11-02', true), fact('2026-11-03', false), fact('2026-11-04', true)], '23:15').to).toBe('21:45');
    expect(rampedWindow(window, [fact('2026-11-02', false), fact('2026-11-03', false), fact('2026-11-04', true)], '23:15')).toBe(window);
    expect(rampedWindow({ ...window, from: '22:50', to: '23:10' }, [fact('2026-11-02', true), fact('2026-11-03', true), fact('2026-11-04', true)], '23:15').to).toBe('23:15');
  });
  it('says what happened in one calm line', () => {
    const fact = (inputs: Record<string, unknown>): LedgerRow => ({ id: 'c', mode: 'tasks', kind: 'chhutti', refId: 'c', dayKey: '2026-11-02', inputs, updatedAt: 1, deleted: 0, deviceId: 't' });
    expect(chhuttiLine(fact({ source: 'usage', kept: true, chosenAppMs: 4 * min, darkMs: 41 * min }), 'After dinner')).toBe('After dinner: 4 min in your chosen apps, phone dark 41 min. The phone got its chhutti.');
    expect(chhuttiLine(fact({ source: 'usage', kept: false, chosenAppMs: 22 * min, darkMs: null }), 'After dinner')).toBe('After dinner: 22 min in your chosen apps. Same window tomorrow, or a shorter one?');
    expect(chhuttiLine(fact({ source: 'self', kept: true }), 'After dinner')).toBe('After dinner: the phone got its chhutti.');
  });
});
