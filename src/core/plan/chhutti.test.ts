import { describe, expect, it } from 'vitest';
import { appliesOn, boundsOn, boundWindow, chhuttiLine, endWindow, isKept, isLive, rampedWindow, readChhutti, windowBounds, windowUsage, withBounds, type UsageEvent } from './chhutti';
import type { LedgerRow, SettingRow } from '../../data/types';

const min = 60_000;
const from = 1_000 * min, to = 1_060 * min; // a 60-minute window
const ev = (type: UsageEvent['type'], at: number, pkg?: string): UsageEvent => ({ type, at, ...(pkg ? { pkg } : {}) });
const ig = 'com.instagram.android';

describe('chhutti window usage (spec 24 #1, items 55-57)', () => {
  const yt = 'com.google.android.youtube';
  const chosen = [ig, yt];
  const boot = ev('boot', from - 120 * min);
  const act = (type: 'fg' | 'bg', at: number, pkg: string, cls = 'Main'): UsageEvent => ({ type, at, pkg, cls });
  const use = (events: UsageEvent[], logStart?: number) => windowUsage(events, from, to, chosen, logStart);
  it('is unknown, never kept, without a start-up before the window to build from', () => {
    expect(use([])).toBeNull();
    // A day of events but no start-up: an app opened days ago would leave no trace, so it cannot be known.
    expect(use([ev('on', from - 60 * min), ev('off', from - 2 * min)], from - 60 * min)).toBeNull();
    expect(use([act('fg', from - 60 * min, 'x'), act('bg', from + 9 * min, ig)])).toBeNull();
    expect(windowUsage([boot], to, from, chosen)).toBeNull();
    // The log starts after the window began (Android keeps events only a few days): unknown.
    expect(use([boot], from + min)).toBeNull();
  });
  it('a start-up or shutdown inside the window is unknown; one before it empties the set', () => {
    expect(use([boot, ev('down', from + 10 * min), ev('boot', from + 30 * min)])).toBeNull();
    // Instagram open before a restart, with no pause: after the start-up it is not open.
    expect(use([act('fg', from - 200 * min, ig), boot, act('fg', from - 20 * min, 'x')])).toEqual({ chosenAppMs: 0, darkMs: 0 });
  });
  it('a quiet window: the screen went dark before it', () => {
    expect(use([boot, ev('off', from - 2 * min)])).toEqual({ chosenAppMs: 0, darkMs: 60 * min });
  });
  it('counts chosen-app time inside the window only, from an app opened before it', () => {
    expect(use([boot, act('fg', from - 10 * min, ig), act('bg', from + 4 * min, ig), act('fg', from + 40 * min, ig), act('bg', to + 20 * min, ig)])).toEqual({ chosenAppMs: 24 * min, darkMs: 0 });
  });
  it('tracks activities: a package stays open while any of its activities is resumed', () => {
    // Instagram opens a second screen (Story) before the feed pauses, then the feed pause arrives: still open.
    expect(use([boot, act('fg', from - 10 * min, ig, 'Feed'), act('fg', from + 5 * min, ig, 'Story'), act('bg', from + 6 * min, ig, 'Feed'), act('bg', from + 30 * min, ig, 'Story')])?.chosenAppMs).toBe(30 * min);
  });
  it('counts the union of open chosen apps, not a sum per app (split screen, picture-in-picture)', () => {
    expect(use([boot, act('fg', from - 10 * min, ig), act('fg', from + 5 * min, yt), act('bg', from + 10 * min, ig), act('bg', from + 20 * min, yt)])?.chosenAppMs).toBe(20 * min);
    expect(use([boot, act('fg', from - 10 * min, ig), act('fg', from + 5 * min, 'x'), act('bg', from + 30 * min, ig)])?.chosenAppMs).toBe(30 * min);
  });
  it('a dark screen pauses the count but keeps the app open; the screen coming back on counts again', () => {
    expect(use([boot, act('fg', from - 10 * min, ig), ev('off', from + 5 * min), ev('on', from + 20 * min), act('bg', from + 40 * min, ig)])).toEqual({ chosenAppMs: 25 * min, darkMs: 15 * min });
  });
  it('an app that is not chosen counts nothing', () => {
    expect(use([boot, act('fg', from - 10 * min, 'x'), act('bg', to + min, 'x')])).toEqual({ chosenAppMs: 0, darkMs: 0 });
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
  it('a past segment keeps its weekdays; a removed window ends with its last started day (item 56)', () => {
    // Sunday 1 Nov only, changed to every day on Monday 2 Nov: Sunday 1 Nov keeps its plan, Saturday 31 Oct was never planned.
    const sunday = { ...window, since: '2026-10-25', weekdays: [0] };
    const daily = withBounds(sunday, { from: '21:00', to: '21:30', weekdays: undefined }, at('2026-11-02', '12:00'), '2026-11-02');
    expect(daily.weekdays).toBeUndefined();
    expect(['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'].map(day => appliesOn(daily, day))).toEqual([false, true, true, true]);
    expect(isLive(daily)).toBe(true);
    // Turned off at 21:10, inside today's window: today is still read, tomorrow is not.
    const ended = endWindow(daily, at('2026-11-03', '21:10'), '2026-11-03');
    expect([appliesOn(ended, '2026-11-03'), appliesOn(ended, '2026-11-04'), isLive(ended)]).toEqual([true, false, false]);
    expect(endWindow(daily, at('2026-11-03', '12:00'), '2026-11-03').until).toBe('2026-11-02');
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
