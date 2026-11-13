import { describe, expect, it } from 'vitest';
import { ALL_PICKS } from '../welcome';
import { RULES, RULES_HISTORY, rulesFor } from '../rules.config';
import type { LedgerRow, SettingRow } from '../../data/types';
import { daySlots } from './daySlots';
import { RINGS_NIGHT_LINE } from './ringLines';
import { ringLine, ringRoute, ringsShown, ringState, todayRings } from './todayRings';

// Spec 571 §0.20, the header half: the rings read today's rows through the same daySlots() as the economy (E11).
const meta = { deleted: 0 as const, deviceId: 'test' };
const DAY = '2026-11-10';
let serial = 0;
const fact = (mode: string, kind: string, inputs: Record<string, unknown> = {}, day = DAY, at = `${day}T10:00:00`): LedgerRow =>
  ({ ...meta, id: `${kind}:${++serial}`, mode, kind, refId: `ref${serial}`, dayKey: day, inputs, updatedAt: new Date(at).getTime() + serial });
const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'test' });
const V10 = [setting('economy.v10From', '2026-11-08'), setting('economy.v7From', '2026-10-28'), setting('economy.v9From', '2026-11-01')];

describe('spec 571 §0.20: today’s rings', () => {
  it('null before economy.v10From exists or before its day (the header keeps an empty slot)', () => {
    expect(todayRings([fact('calm', 'session', { minutes: 10 })], [], DAY)).toBeNull();
    expect(todayRings([fact('calm', 'session', { minutes: 10 })], [setting('economy.v10From', '2026-11-11')], DAY)).toBeNull();
  });

  it('equals daySlots on the same rows (one definition, E11), ignoring other days and deleted rows', () => {
    const rows = [
      fact('read', 'chapter', {}, DAY, `${DAY}T09:00:00`), fact('calm', 'session', { minutes: 6 }, DAY, `${DAY}T11:00:00`),
      fact('train', 'rest', { xp: 10 }), fact('calm', 'session', { minutes: 20 }, '2026-11-09'), { ...fact('mind', 'mystery', { result: 'solved' }), deleted: 1 as const },
    ];
    const rings = todayRings(rows, V10, DAY);
    const own = rows.filter(row => !row.deleted && row.dayKey === DAY);
    expect(rings).toEqual(daySlots(own, { key: DAY, rules: rulesFor(DAY, RULES_HISTORY)?.rules ?? RULES, history: RULES_HISTORY, v7: true, v9: true, v10: true }).rings);
    expect(rings?.mind).toEqual(['chapter', 'calm']);
    expect(ringState('mind', rings!)).toBe('done');
    expect(ringState('yatra', rings!)).toBe('none');
  });

  it('states and lines: half Mind, a walk, a kept promise, and the night line for every ring', () => {
    const rings = { yatra: 'task1', body: 'walk' as const, mind: ['drop' as const] };
    expect(ringState('mind', rings)).toBe('half');
    expect(ringState('body', rings)).toBe('done');
    expect(ringLine('mind', rings, false)).toBe("Mind: today’s idea. One more, a different one, closes it.");
    expect(ringLine('body', rings, false)).toBe('Body: a rest walk.');
    expect(ringLine('yatra', rings, false, 'Call the bank')).toBe('Yatra: you kept a promise, Call the bank.');
    expect(ringLine('yatra', { ...rings, yatra: null }, false, 'ignored')).toBe('Yatra: keep one promise.');
    for (const name of ['yatra', 'body', 'mind'] as const) expect(ringLine(name, rings, true)).toBe(RINGS_NIGHT_LINE);
  });

  it('spec 52 picks: all three at size all; Train → Body; Learn or Mind → Mind; Sleep only → none; routes', () => {
    expect(ringsShown(ALL_PICKS)).toEqual(['yatra', 'body', 'mind']);
    expect(ringsShown({ goals: ['train', 'plan'], size: 'two' })).toEqual(['yatra', 'body']);
    expect(ringsShown({ goals: ['learn', 'mind'], size: 'two' })).toEqual(['mind']);
    expect(ringsShown({ goals: ['mind', 'sleep'], size: 'two' })).toEqual(['mind']);
    expect(ringsShown({ goals: ['sleep'], size: 'two' })).toEqual([]);
    expect(ringRoute('yatra', ALL_PICKS)).toBe('yatra');
    expect(ringRoute('body', ALL_PICKS)).toBe('grow/train');
    expect(ringRoute('mind', { goals: ['learn', 'plan'], size: 'two' })).toBe('grow/read');
    expect(ringRoute('mind', { goals: ['mind', 'plan'], size: 'two' })).toBe('grow/play');
  });
});
