import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { deriveEconomy } from '../economy/deriveEconomy';
import { todayRings } from '../economy/todayRings';
import { usefulRecord } from '../economy/usefulDays';
import { deriveCourtyard } from '../courtyard/courtyard';
import { hexagon } from '../hexagon';
import { buildRecap, receiptContent, youWeekNumbers } from '../recap';
import { deriveJar, jarActs } from '../yatra/jar';
import { QUEST_KIND, QUEST_MODE, questDoneId, realityCheck } from './quests';

/**
 * b2 12 Nov: what a finished quest pays is pinned. It fills the jar and shows on the receipt's Quests line, You's week,
 * the useful-day record and the Reality Check; it changes nothing in XP or levels, the rings, which days are useful,
 * the courtyard's corner days or the hexagon. A later change that widens this must change this test on purpose.
 */
const stamp = { deleted: 0 as const, deviceId: 'd' };
const DAY = '2026-11-04';
const settings: SettingRow[] = [{ key: 'economy.v12From', value: '2026-11-01', updatedAt: 1, ...stamp }, { key: 'economy.v10From', value: '2026-11-01', updatedAt: 1, ...stamp }];
const base: LedgerRow[] = [
  { id: 'task-done:1', kind: 'done', refId: 't1', mode: 'tasks', dayKey: DAY, inputs: { plannedSize: 'M', wasPlanned: true }, updatedAt: 10, ...stamp },
  { id: 'chapter:b:c1', kind: 'chapter', refId: 'b:c1', mode: 'read', dayKey: DAY, inputs: {}, updatedAt: 11, ...stamp },
];
const quests: LedgerRow[] = [
  { id: questDoneId('courage-tell-them', DAY), kind: QUEST_KIND.done, refId: 'courage-tell-them', mode: QUEST_MODE, dayKey: DAY, inputs: { minutes: 5, outcome: 'fine', fear: 4, felt: 2, prediction: 'awkward' }, updatedAt: 20, ...stamp },
  { id: questDoneId('courage-ask-at-home', DAY), kind: QUEST_KIND.done, refId: 'courage-ask-at-home', mode: QUEST_MODE, dayKey: DAY, inputs: { minutes: 5, outcome: 'better', fear: 3, felt: 1, prediction: 'ignore' }, updatedAt: 21, ...stamp },
  { id: questDoneId('speak-spin-60', DAY), kind: QUEST_KIND.done, refId: 'speak-spin-60', mode: QUEST_MODE, dayKey: DAY, inputs: { minutes: 30, outcome: 'happened', fear: 5, felt: 4, prediction: 'freeze' }, updatedAt: 22, ...stamp },
];
const withQuests = [...base, ...quests];
const NOW = new Date('2026-11-09T19:00:00').getTime();
const recapOf = (ledger: LedgerRow[]) => buildRecap(NOW, { tasks: [], focus: [], sessions: [], quests: [], concepts: [], logs: [], ledger });
const hex = (ledger: LedgerRow[]) => hexagon('2026-11-09', { ledger, tasks: [], events: [], puzzleRuns: [], plans: [], programs: [], drops: [], settings });

describe('spec 660: what a finished quest pays (pinned)', () => {
  it('fills the jar', () => {
    const jar = (ledger: LedgerRow[]) => deriveJar(jarActs(ledger, [], undefined, '2026-11-01'), '2026-11-01', DAY).reduce((sum, entry) => sum + entry.counted, 0);
    expect(jar(withQuests) - jar(base)).toBe(5 + 5 + 10);
  });
  it('shows on the receipt\'s Quests line, You\'s week, the useful-day record and the Reality Check', () => {
    expect(receiptContent(recapOf(withQuests)).lines).toContainEqual({ label: 'Quests', value: '3' });
    expect(receiptContent(recapOf(base)).lines.some(line => line.label === 'Quests')).toBe(false);
    expect(youWeekNumbers(recapOf(withQuests))).toContainEqual({ value: '3', label: 'quests' });
    expect(usefulRecord([DAY], withQuests)[0]!.items).toContain('3 quests');
    expect(realityCheck(withQuests)?.quests).toBe(3);
    expect(recapOf(withQuests).realMs).toBe(recapOf(base).realMs);
  });
  it('changes nothing in XP and levels, the rings, which days are useful, the courtyard\'s days or the hexagon', () => {
    const economy = (ledger: LedgerRow[]) => deriveEconomy(ledger, undefined, settings, '2026-11-09');
    const a = economy(base), b = economy(withQuests);
    expect(b.totalXp).toBe(a.totalXp);
    expect(b.level).toBe(a.level);
    expect(b.days.map(day => JSON.stringify(day))).toEqual(a.days.map(day => JSON.stringify(day)));
    expect(todayRings(withQuests, settings, DAY)).toEqual(todayRings(base, settings, DAY));
    expect(deriveCourtyard(withQuests, '2026-11-09')).toEqual(deriveCourtyard(base, '2026-11-09'));
    expect(hex(withQuests)).toEqual(hex(base));
  });
});
