import { describe, expect, it } from 'vitest';
import { boundWindow, chhuttiLine, isKept, rampedWindow, readChhutti, windowUsage, type UsageEvent } from './chhutti';
import type { LedgerRow, SettingRow } from '../../data/types';

const min = 60_000;
const from = 1_000 * min, to = 1_060 * min; // a 60-minute window
const ev = (type: UsageEvent['type'], at: number, pkg?: string): UsageEvent => ({ type, at, ...(pkg ? { pkg } : {}) });
const ig = 'com.instagram.android';

describe('chhutti window usage (spec 24 #1)', () => {
  it('is unknown, never kept, when the log is empty or does not reach the window start', () => {
    expect(windowUsage([], from, to)).toBeNull();
    expect(windowUsage([ev('fg', from + 5 * min, ig), ev('bg', from + 9 * min, ig)], from, to)).toBeNull();
    expect(windowUsage([ev('on', from - min)], to, from)).toBeNull();
    // The phone's log said it starts after the window began (events kept "a few days"): unknown.
    expect(windowUsage([ev('on', from - min)], from, to, from + min)).toBeNull();
  });
  it('a quiet window is known when the log reaches back before it, with no chosen app at all', () => {
    expect(windowUsage([], from, to, from - 60 * min)).toEqual({ chosenAppMs: 0, darkMs: null });
  });
  it('counts chosen-app time inside the window only, from an app opened before it', () => {
    const usage = windowUsage([ev('on', from - 30 * min), ev('fg', from - 10 * min, ig), ev('bg', from + 4 * min, ig), ev('fg', from + 40 * min, ig), ev('bg', to + 20 * min, ig)], from, to);
    expect(usage).toEqual({ chosenAppMs: 24 * min, darkMs: 0 });
  });
  it('treats an app whose first event is a pause as already open before the log', () => {
    expect(windowUsage([ev('bg', from + 3 * min, ig)].concat([ev('on', from - min)]), from, to)?.chosenAppMs).toBe(3 * min);
  });
  it('closes app time when the screen goes dark, and counts the dark minutes', () => {
    const usage = windowUsage([ev('on', from - 60 * min), ev('fg', from + 10 * min, ig), ev('off', from + 15 * min), ev('on', from + 50 * min)], from, to);
    expect(usage).toEqual({ chosenAppMs: 5 * min, darkMs: 35 * min });
  });
  it('a screen that turns on first was dark before the log; no screen events at all means dark minutes are unknown', () => {
    expect(windowUsage([ev('on', from + 20 * min), ev('fg', from - 5 * min, 'x')], from, to)?.darkMs).toBe(20 * min);
    expect(windowUsage([ev('fg', from - 5 * min, ig), ev('bg', from + min, ig)], from, to)).toEqual({ chosenAppMs: min, darkMs: null });
  });
  it('is kept within the grace minutes', () => {
    expect(isKept({ chosenAppMs: 5 * min, darkMs: null }, '2026-11-02')).toBe(true);
    expect(isKept({ chosenAppMs: 5 * min + 1, darkMs: null }, '2026-11-02')).toBe(false);
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
