import { describe, expect, it } from 'vitest';
import { RULES } from '../rules.config';
import type { LedgerRow, SettingRow } from '../../data/types';
import { deriveEconomy } from './deriveEconomy';
import { calmDayXp, chhuttiXp, cleanBlocks, focusDayXp, focusXp } from './effort';

// Spec 36 "Effort pays": measured effort earns more, from economy.v6From on.
const MIN = 60_000;
let serial = 0;
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'test',
});
const focusFact = (day: string, taskId: string, minutes: number, blocks = 0, guard = true) => row(day, 'tasks', 'focus-time', { taskId, paidMs: minutes * MIN, blocks, guard });
const settings = (v6From?: string): SettingRow[] => [['economy.v2From', '2026-10-01'], ['economy.v3From', '2026-10-01'], ...(v6From ? [['economy.v6From', v6From]] : [])]
  .map(([key, value]) => ({ key: key!, value, updatedAt: 1, deleted: 0, deviceId: 'test' }));
const day = '2026-11-03';
const view = (facts: LedgerRow[], v6From?: string) => deriveEconomy(facts, undefined, settings(v6From), day).days.at(-1)!;

describe('spec 36 effort pays', () => {
  it('25 focus minutes pay 12, and a clean 25-minute block adds 5', () => {
    expect(focusXp(25 * MIN, 0, RULES)).toBe(12);
    expect(focusXp(25 * MIN, 1, RULES)).toBe(17);
    expect([60, 120, 180].map(minutes => focusXp(minutes * MIN, 0, RULES))).toEqual([30, 60, 90]);
  });

  it('a paused block pays its minutes but no block bonus', () => {
    // 15 minutes, a pause, then 15 more: 30 minutes worked, no single run of 25.
    const paused = { startedAt: 0, pauses: [{ at: 15 * MIN, resumeAt: 20 * MIN }], endedAt: 35 * MIN };
    expect(cleanBlocks(paused, 35 * MIN, 25)).toBe(0);
    expect(cleanBlocks({ startedAt: 0, endedAt: 52 * MIN }, 52 * MIN, 25)).toBe(2);
    // A pause still open at the end closes the last run there.
    expect(cleanBlocks({ startedAt: 0, pauses: [{ at: 30 * MIN }] }, 90 * MIN, 25)).toBe(1);
  });

  it('Stop for now then Start sums the task minutes, so nothing rounds or pays twice', () => {
    // 11 + 3 minutes in two focuses of one task: 14 minutes, 7 XP (paid one by one it would be 5 + 1).
    expect(focusDayXp([focusFact(day, 'a', 11), focusFact(day, 'a', 3)], RULES)).toBe(7);
    expect(focusDayXp([focusFact(day, 'a', 11), focusFact(day, 'b', 3)], RULES)).toBe(5 + 1);
    const once = focusFact(day, 'a', 30);
    expect(focusDayXp([once, once], RULES)).toBe(15);
  });

  it('a focus the guard could not watch pays no focus XP', () => {
    expect(focusDayXp([focusFact(day, 'a', 60, 2, false)], RULES)).toBe(0);
  });

  it('a kept, measured chhutti of 30, 60 and 180 minutes pays 10, 16 and 40; self-reported pays 0', () => {
    const window = (plannedMin: number, source = 'usage') => row(day, 'tasks', 'chhutti', { kept: true, source, plannedMin });
    expect([30, 60, 180].map(minutes => chhuttiXp(window(minutes), RULES))).toEqual([10, 16, 40]);
    expect(chhuttiXp(window(180, 'self'), RULES)).toBe(0);
  });

  it('Calm pays a minute each, up to 30 a day', () => {
    const sit = (minutes: number) => row(day, 'calm', 'session', { minutes, way: 'quiet' });
    expect(calmDayXp([sit(10)], RULES)).toBe(10);
    expect(calmDayXp([sit(45)], RULES)).toBe(30);
    expect(calmDayXp([sit(10), sit(15), sit(20)], RULES)).toBe(30);
  });

  it('the tasks cap is 300, focus included', () => {
    expect(RULES.tasks.dailyCap).toBe(300);
    const big = [...Array.from({ length: 12 }, () => row(day, 'tasks', 'done', { plannedSize: 'L', wasPlanned: true, postpones: 1 })), focusFact(day, 'a', 400, 10)];
    expect(view(big, '2026-10-28').tasks).toBe(300);
  });

  it('a 3 h study session on an L task with 6 clean blocks pays 35 + 90 + 30', () => {
    const facts = [row(day, 'tasks', 'done', { plannedSize: 'L', wasPlanned: true, postpones: 1 }), focusFact(day, 'a', 180, 6)];
    expect(view(facts, '2026-10-28').tasks).toBe(155);
  });

  it('is forward-only: before economy.v6From the day pays as it did (no focus, flat chhutti, no calm, cap 200)', () => {
    const facts = [row(day, 'tasks', 'done', { plannedSize: 'L', wasPlanned: true, postpones: 1 }), focusFact(day, 'a', 180, 6),
      row(day, 'tasks', 'chhutti', { kept: true, source: 'usage', plannedMin: 180 }), row(day, 'calm', 'session', { minutes: 20 })];
    expect(view(facts)).toMatchObject({ tasks: 35, chhutti: 10, calm: 0 });
    expect(view(facts, '2026-11-04')).toMatchObject({ tasks: 35, chhutti: 10, calm: 0 });
    expect(view(facts, day)).toMatchObject({ tasks: 155, chhutti: 40, calm: 20 });
    const before = view(facts).total, after = view(facts, day).total;
    expect(after - before).toBe(120 + 30 + 20);
  });
});
