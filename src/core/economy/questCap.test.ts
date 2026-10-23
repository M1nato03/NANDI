import { describe, expect, it } from 'vitest';
import { customQuestPay, deriveEconomy, questCapFrom } from './deriveEconomy';
import type { LedgerRow, SettingRow } from '../../data/types';

// cj4 item 45: your own side quests could be farmed (no limit, 20 XP each). From the day this build first runs,
// only the first 3 done in a quest week pay; more still count as done.
const quest = (refId: string, week: string, day: string, at: number, custom?: boolean): LedgerRow => ({
  id: `quest:${refId}:${week}`, mode: 'quests', kind: 'quest', refId, dayKey: day,
  inputs: { target: 1, progress: 1, questKind: 'once', ...(custom === undefined ? {} : { custom }) }, updatedAt: at, deleted: 0, deviceId: 'd' });
const cutoff = (day: string): SettingRow[] => [{ key: 'economy.v4From', value: day, updatedAt: 0, deleted: 0, deviceId: 'd' }];
const questXp = (facts: LedgerRow[], settings: SettingRow[]) => deriveEconomy(facts, undefined, settings, '2026-10-30').days.reduce((sum, day) => sum + day.quests, 0);
const own = (n: number, legacy = false) => Array.from({ length: n }, (_, i) => quest(`01JOWN${i}`, '2026-W44', i < 3 ? '2026-10-26' : '2026-10-27', 1000 + i, legacy ? undefined : true));

describe('custom side quests (item 45)', () => {
  it('pays only the first 3 of your own quests in a week, in the order they were done', () => {
    expect(questXp(own(5), cutoff('2026-10-25'))).toBe(60);
  });
  it('reads older quest facts without the custom flag by their id', () => {
    expect(questXp(own(5, true), cutoff('2026-10-25'))).toBe(60);
  });
  it('leaves the suggested quests and days before this build ran as they were', () => {
    const suggested = [quest('walk-20:2026-W44', '2026-W44', '2026-10-27', 2000, false), quest('read-10:2026-W44', '2026-W44', '2026-10-27', 2001, false)];
    expect(questXp([...own(5), ...suggested], cutoff('2026-10-25'))).toBe(100);
    expect(questXp(own(5), [])).toBe(100);
    // Quests done before the cutoff day are paid and do not use up the week's 3.
    expect(questXp(own(5), cutoff('2026-10-27'))).toBe(100);
  });
  it('starts again each quest week', () => {
    const next = Array.from({ length: 4 }, (_, i) => quest(`01JNEXT${i}`, '2026-W45', '2026-11-02', 3000 + i, true));
    expect(deriveEconomy([...own(5), ...next], undefined, cutoff('2026-10-25'), '2026-11-03').days.reduce((sum, day) => sum + day.quests, 0)).toBe(120);
  });
});

describe('the Side quests count matches scoring (Codex review, item 47)', () => {
  it('counts only your own quests done since the cutoff, per quest week', () => {
    // Updated mid-week: two quests before the cutoff, three after. Scoring pays all five; the card counts three.
    const before = Array.from({ length: 2 }, (_, i) => quest(`01JPRE${i}`, '2026-W44', '2026-10-26', 100 + i, true));
    const after = Array.from({ length: 3 }, (_, i) => quest(`01JPOST${i}`, '2026-W44', '2026-10-28', 200 + i, true));
    const { paid, unpaid } = customQuestPay([...before, ...after], questCapFrom(cutoff('2026-10-27')));
    expect(paid.get('2026-W44')).toBe(3);
    expect(unpaid.size).toBe(0);
    expect(questXp([...before, ...after], cutoff('2026-10-27'))).toBe(100);
  });
});

describe('a clock set back (Codex review, item 48)', () => {
  it('counts only quests dated up to today, like scoring', () => {
    const ahead = Array.from({ length: 3 }, (_, i) => quest(`01JAHEAD${i}`, '2026-W44', '2026-10-30', 300 + i, true));
    expect(customQuestPay(ahead, '2026-10-25', undefined, '2026-10-27').paid.get('2026-W44') ?? 0).toBe(0);
    expect(customQuestPay(ahead, '2026-10-25', undefined, '2026-10-30').paid.get('2026-W44')).toBe(3);
  });
});
