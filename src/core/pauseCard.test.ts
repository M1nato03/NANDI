import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../data/types';
import { actsToday, cleanAct, pauseLine, readPauseCard, readPauseWindow } from './pauseCard';

const today = '2026-11-03';
const settings = (values: Record<string, unknown>): SettingRow[] => Object.entries(values).map(([key, value]) => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 't' }));

describe('spec 39 the Pause card settings', () => {
  it('is off for someone new, with nothing set; spec 39b: it would show after 10 min a day', () => {
    expect(readPauseCard([], today)).toMatchObject({ on: false, legacy: false, act: null, window: null, grace: 10, mode: 'limit', limitMin: 10, switchedTo10: false });
  });
  it('spec 39b: "every open" stays a choice, and a kept old day pause keeps its 30 minutes', () => {
    expect(readPauseCard(settings({ 'pause.card.on': true, 'night.pause.dayMode': 'open' }), today)).toMatchObject({ mode: 'open' });
    expect(readPauseCard(settings({ 'night.pause.enabled': true }), today)).toMatchObject({ legacy: true, mode: 'limit', limitMin: 30 });
    expect(readPauseCard(settings({ 'pause.card.on': true, 'night.pause.dayMode': 'limit', 'night.pause.dayLimitMin': 10, 'pause.modeNote': 'shown' }), today)).toMatchObject({ limitMin: 10, switchedTo10: true });
  });
  it('keeps the old day pause on (migration): its apps and mode stay, and it asks once for a line', () => {
    const card = readPauseCard(settings({ 'night.pause.enabled': true, 'night.pause.dayMode': 'limit', 'night.pause.dayLimitMin': 30, 'night.pause.apps': ['com.instagram.android'] }), today);
    expect(card).toMatchObject({ on: true, legacy: true, act: null, mode: 'limit', limitMin: 30, packages: ['com.instagram.android'] });
    // The night pause on with no day mode chosen paused by day after a limit, so it stays on too.
    expect(readPauseCard(settings({ 'night.pause.enabled': true }), today)).toMatchObject({ on: true, legacy: true });
    // A day mode turned off stays off; the setup's own choice wins over the old one.
    expect(readPauseCard(settings({ 'night.pause.enabled': true, 'night.pause.dayMode': 'off' }), today)).toMatchObject({ on: false });
    expect(readPauseCard(settings({ 'night.pause.enabled': true, 'pause.card.on': false }), today)).toMatchObject({ on: false, legacy: false });
  });
  it('reads its own setup: the act, the window, the grace and off for today', () => {
    const card = readPauseCard(settings({ 'pause.card.on': true, 'pause.act': "I'll do 10 squats.", 'pause.window': { from: '09:00', to: '21:00' }, 'pause.grace': 20, 'pause.offDay': today }), today);
    expect(card).toMatchObject({ on: true, act: 'do 10 squats', window: { from: '09:00', to: '21:00' }, grace: 20, offToday: true });
    expect(readPauseCard(settings({ 'pause.offDay': '2026-11-02' }), today).offToday).toBe(false);
  });
  it('drops a broken window or grace back to all day and 10 minutes', () => {
    expect(readPauseWindow({ from: '9:00', to: '21:00' })).toBeNull();
    expect(readPauseWindow({ from: '09:00', to: '09:00' })).toBeNull();
    expect(readPauseWindow(false)).toBeNull();
    expect(readPauseCard(settings({ 'pause.grace': 7 }), today).grace).toBe(10);
  });
});

describe('spec 39 the card says the person\'s own plan', () => {
  it('in their words', () => {
    expect(pauseLine('Instagram', 'do 10 squats')).toBe("If I open Instagram, I'll do 10 squats first.");
    expect(pauseLine('Instagram', null)).toBe('Take 2 minutes first.');
    expect(cleanAct('  ill step outside!! ')).toBe('step outside');
  });
});

describe('spec 39 acts pay 2 XP, 10 a day', () => {
  const act = (n: number, outcome = 'act_done'): LedgerRow => ({ id: `a${n}`, dayKey: today, mode: 'pause', kind: 'attempt', refId: String(n), inputs: { outcome }, updatedAt: n, deleted: 0, deviceId: 't' });
  it('says whether the next act still pays', () => {
    expect(actsToday([], today)).toEqual({ done: 0, nextPays: true });
    expect(actsToday([1, 2, 3, 4].map(n => act(n)), today)).toEqual({ done: 4, nextPays: true });
    expect(actsToday([1, 2, 3, 4, 5].map(n => act(n)), today)).toEqual({ done: 5, nextPays: false });
    expect(actsToday([act(1, 'backed_out'), act(2, 'opened_anyway')], today).done).toBe(0);
  });
});
