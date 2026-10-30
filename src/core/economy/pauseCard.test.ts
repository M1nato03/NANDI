import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { deriveEconomy } from './deriveEconomy';

// Spec 39 "the Pause card", from economy.v8From: 2 XP a finished act, 10 a day; backing out or going anyway pays 0.
let serial = 0;
const day = '2026-11-03';
const attempt = (outcome: string): LedgerRow => ({
  id: `pause-attempt:${++serial}`, dayKey: day, mode: 'pause', kind: 'attempt', refId: String(serial),
  inputs: { packageName: 'com.instagram.android', outcome }, updatedAt: serial, deleted: 0, deviceId: 'test',
});
const settings = (v8From?: string): SettingRow[] => [['economy.v2From', '2026-10-01'], ['economy.v3From', '2026-10-01'], ['economy.v6From', '2026-10-01'], ['economy.v7From', '2026-10-01'], ...(v8From ? [['economy.v8From', v8From]] : [])]
  .map(([key, value]) => ({ key: key!, value, updatedAt: 1, deleted: 0, deviceId: 'test' }));
const view = (facts: LedgerRow[], v8From = '2026-10-31') => deriveEconomy(facts, undefined, settings(v8From), day).days.at(-1)!;

describe('spec 39 the Pause card pays a little for a finished act', () => {
  it('2 XP per finished act', () => {
    expect(view([attempt('act_done')])).toMatchObject({ pause: 2 });
    expect(view([attempt('act_done'), attempt('act_done'), attempt('act_done')])).toMatchObject({ pause: 6 });
  });
  it('"Not now" and "Open anyway" pay nothing and cost nothing', () => {
    const base = view([attempt('act_done')]).total;
    const day = view([attempt('act_done'), attempt('backed_out'), attempt('opened_anyway')]);
    expect(day.pause).toBe(2);
    expect(day.total).toBe(base);
  });
  it('stops at 10 a day', () => {
    expect(view(Array.from({ length: 8 }, () => attempt('act_done')))).toMatchObject({ pause: 10 });
  });
  it('is forward-only: before economy.v8From (or with none written) the same acts pay nothing', () => {
    expect(view([attempt('act_done')], '2026-11-04')).toMatchObject({ pause: 0 });
    expect(deriveEconomy([attempt('act_done')], undefined, settings(), day).days.at(-1)).toMatchObject({ pause: 0 });
  });
});
