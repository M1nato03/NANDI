import { describe, expect, it } from 'vitest';
import { RULES, RULES_HISTORY } from '../rules.config';
import type { LedgerRow, SettingRow } from '../../data/types';
import { deriveEconomy } from './deriveEconomy';
import { boardPay, chapterPay, paidSetCount, trainSessionPay } from './effort';

// Spec 36 v2 "Effort pays in Train, Mind and Read", from economy.v7From.
const SEC = 1000;
let serial = 0;
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'test',
});
const settings = (v7From?: string): SettingRow[] => [['economy.v2From', '2026-10-01'], ['economy.v3From', '2026-10-01'], ['economy.v6From', '2026-10-01'], ...(v7From ? [['economy.v7From', v7From]] : [])]
  .map(([key, value]) => ({ key: key!, value, updatedAt: 1, deleted: 0, deviceId: 'test' }));
const day = '2026-11-03';
const view = (facts: LedgerRow[], v7From?: string) => deriveEconomy(facts, undefined, settings(v7From), day).days.at(-1)!;
const session = (paidSets: number, workingSets = paidSets, extra: Record<string, unknown> = {}) => row(day, 'train', 'session', { plannedExercises: 3, touchedExercises: 3, plannedSets: 12, workingSets, safety: false, paidSets, ...extra });
const board = (diff: string, hintsUsed = 0, daily = true) => row(day, 'mind', 'board', { daily, diff, hintsUsed, type: 'sudoku' });
const chapter = (newSteps: number, firstRight: number, readDrops: string[] = []) => row(day, 'read', 'chapter', { afterBedtime: false, newSteps, firstRight, readDrops });

describe('spec 36 v2: Train pays per real set', () => {
  it('a set pays only 45 s after the last paid one, so 12 taps in 10 s pay one set', () => {
    expect(paidSetCount(Array.from({ length: 12 }, (_, i) => i * 800), RULES)).toBe(1);
    expect(paidSetCount(Array.from({ length: 6 }, (_, i) => i * 90 * SEC), RULES)).toBe(6);
    // 44 s is too soon, 45 s counts; order of logging does not matter.
    expect(paidSetCount([0, 44 * SEC, 90 * SEC], RULES)).toBe(2);
    expect(paidSetCount([90 * SEC, 0, 45 * SEC], RULES)).toBe(3);
    expect(paidSetCount(Array.from({ length: 15 }, (_, i) => i * 60 * SEC), RULES)).toBe(12);
  });

  it('a session pays 48 + 4 per paid set: 3 sets 60, 6 sets 72, 12 sets 96; a safety stop keeps 40', () => {
    expect([3, 6, 12].map(sets => trainSessionPay(session(sets).inputs, RULES))).toEqual([60, 72, 96]);
    expect(trainSessionPay(session(6, 6, { safety: true }).inputs, RULES)).toBe(40);
    expect(trainSessionPay(session(0, 0).inputs, RULES)).toBe(0);
    // A fact without paid sets (an older build) keeps its own award.
    expect(trainSessionPay({ workingSets: 6 }, RULES)).toBeNull();
  });

  it('the Train day caps at 130: the best session (12 sets, 96) and two PRs fit, a third PR never pays', () => {
    expect(RULES.train.dailyCapExclWeekly).toBe(130);
    expect(view([session(12), row(day, 'train', 'pr'), row(day, 'train', 'pr')], '2026-10-29').train).toBe(126);
    expect(view([session(12), row(day, 'train', 'pr'), row(day, 'train', 'pr'), row(day, 'train', 'pr')], '2026-10-29').train).toBe(126);
    // Only the best session of the day counts.
    expect(view([session(3), session(12), session(6)], '2026-10-29').train).toBe(96);
  });
});

describe('spec 36 v2: harder boards pay more', () => {
  it('easy 10, medium 20, hard 30, less 5 a hint and never below 5', () => {
    expect(['easy', 'medium', 'hard'].map(diff => boardPay({ diff }, RULES))).toEqual([10, 20, 30]);
    expect(boardPay({ diff: 'hard', hintsUsed: 1 }, RULES)).toBe(25);
    expect(boardPay({ diff: 'hard', hintsUsed: 4 }, RULES)).toBe(10);
    expect(boardPay({ diff: 'medium', hintsUsed: 1 }, RULES)).toBe(15);
    expect(boardPay({ diff: 'easy', hintsUsed: 3 }, RULES)).toBe(5);
  });

  it('pays the daily board and one side board by difficulty; a third board pays nothing', () => {
    expect(view([board('hard', 1)], '2026-10-29').mind).toBe(25);
    expect(view([board('hard', 1), board('medium', 0, false), board('hard', 0, false)], '2026-10-29').mind).toBe(45);
  });
});

describe('spec 36 v2: a chapter pays for what it taught', () => {
  it('5 + 5 a new step + 5 a right first answer (3 at most), up to 40', () => {
    expect(chapterPay({ newSteps: 2, firstRight: 2 }, RULES)).toBe(25);
    expect(chapterPay({ newSteps: 1, firstRight: 5 }, RULES)).toBe(25);
    expect(chapterPay({ newSteps: 6, firstRight: 3 }, RULES)).toBe(40);
    expect(chapterPay({ newSteps: 0, firstRight: 0 }, RULES)).toBe(5);
    // A chapter fact from before v2 (no counts) pays nothing itself.
    expect(chapterPay({ afterBedtime: false }, RULES)).toBeNull();
  });

  it('up to three chapters a day pay; a fourth pays nothing, and one after bedtime pays nothing', () => {
    const three = [chapter(2, 2), chapter(1, 0), chapter(1, 1)];
    expect(view(three, '2026-10-29').mind).toBe(25 + 10 + 15);
    expect(view([...three, chapter(3, 3)], '2026-10-29').mind).toBe(50);
    expect(view([row(day, 'read', 'chapter', { afterBedtime: true, newSteps: 2, firstRight: 2, readDrops: [] })], '2026-10-29').mind).toBe(0);
  });

  it("a chapter read as the day's drop replaces the drop's 15, never adds to it", () => {
    const drop = row(day, 'mind', 'learn-drop');
    expect(view([drop], '2026-10-29').mind).toBe(15);
    expect(view([drop, chapter(2, 2, [`drop:daily:${day}`])], '2026-10-29').mind).toBe(25);
    // A chapter read on its own leaves the day's drop paying as before.
    expect(view([drop, chapter(2, 2, [`drop:chapter:t:m:1`])], '2026-10-29').mind).toBe(40);
  });

  it('the shared Mind day caps at 120', () => {
    expect(RULES.mind.dailyCap).toBe(120);
    const facts = [board('hard'), board('hard', 0, false), row(day, 'mind', 'mystery', { result: 'solved' }), chapter(6, 3), chapter(6, 3), chapter(6, 3)];
    expect(view(facts, '2026-10-29').mind).toBe(120);
  });
});

describe('spec 36 v2 is forward-only', () => {
  it('before economy.v7From the same facts pay as on 28 Oct: 60 a full session, 10 a board, no chapter pay, caps 100 and 80', () => {
    const facts = [session(12, 12, { plannedSets: 12 }), board('hard'), board('hard', 0, false), row(day, 'mind', 'learn-drop'), chapter(2, 2, [`drop:daily:${day}`]),
      row(day, 'mind', 'mystery', { result: 'solved' }), row(day, 'train', 'pr'), row(day, 'train', 'pr')];
    expect(view(facts)).toMatchObject({ train: 90, mind: 10 + 10 + 15 + 25 });
    expect(view(facts, '2026-11-04')).toMatchObject({ train: 90, mind: 60 });
    expect(view(facts, day)).toMatchObject({ train: 126, mind: 30 + 30 + 25 + 25 });
  });

  it('the 28 Oct rules are kept as they were, for the days before', () => {
    const before = RULES_HISTORY.at(-2)!;
    expect(before.effectiveFrom).toBe('2026-10-28');
    expect('setPay' in before.rules.train || 'boardPay' in before.rules.mind || 'chapterPay' in before.rules.mind).toBe(false);
  });
});
