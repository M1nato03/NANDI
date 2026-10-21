import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { RULES, RULES_BOUNDS, RULES_HISTORY, rulesFor, type RulesHistoryEntry } from './rules.config';

function numericLeaves(value: unknown, path = ''): Record<string, number> {
  if (typeof value === 'number') return { [path]: value };
  if (value === null || typeof value !== 'object') return {};
  return Object.assign(
    {},
    ...Object.entries(value).map(([key, child]) =>
      numericLeaves(child, path ? `${path}.${key}` : key),
    ),
  ) as Record<string, number>;
}

describe('RULES', () => {
  it('keeps the task and train placement decisions in one rules object', () => {
    expect(RULES.tasks.postpone.weeklyBudget).toBe(5);
    expect(RULES.tasks.focus.presetLong).toEqual([50, 10]);
    expect(RULES.tasks.liveTimers).toBe(1);
    expect(RULES.tasks.preReminderMin).toBe(5);
    expect(RULES.train.weeklyTarget).toBe(3);
    expect(RULES.train.placement).toEqual({ stopMinReps: 5, stopMaxReps: 11, moveUpAtReps: 12, maxTestsPerPattern: 3 });
    expect(RULES.tasks.clutch.clutchBonusXp).toBe(5);
    expect(RULES.mind.dailyCap).toBe(80);
    expect(RULES.season.seats).toBe(500);
    expect(RULES.season.tiers.at(-1)).toEqual(['Apex', 1, 1]);
  });

  it('bounds every numeric rule and has no orphan bound', () => {
    const leaves = numericLeaves(RULES);
    expect(Object.keys(RULES_BOUNDS).sort()).toEqual(Object.keys(leaves).sort());
    for (const [path, [min, max]] of Object.entries(RULES_BOUNDS)) {
      expect(min, path).toBeLessThanOrEqual(max);
      expect(leaves[path], path).toBeGreaterThanOrEqual(min);
      expect(leaves[path], path).toBeLessThanOrEqual(max);
    }
  });
});

describe('rule history', () => {
  it('never changes scoring rules in place', () => {
    // Past days are replayed with RULES_HISTORY, so editing a scoring value in place rescores the past
    // and can lower XP already shown. Add a RULES_HISTORY entry with a new effectiveFrom instead, keep
    // this frozen copy for the old entry, and only then add a fingerprint for the new one.
    const scoring = ['tasks', 'train', 'mind', 'bonuses', 'soft', 'quests', 'gamify', 'level', 'season', 'streak', 'shards'] as const;
    const fingerprint = (rules: typeof RULES) => createHash('sha256').update(JSON.stringify(scoring.map(key => [key, rules[key]]))).digest('hex').slice(0, 16);
    expect(RULES_HISTORY.map(entry => [entry.effectiveFrom, fingerprint(entry.rules)])).toEqual([['2026-10-05', '65d0d8ffcb834e2e']]);
  });

  it('starts with the current rules', () => {
    expect(RULES_HISTORY[0]).toEqual({ effectiveFrom: RULES.effectiveFrom, rules: RULES });
  });

  it('selects the latest effective entry without mutating the history', () => {
    const entries: RulesHistoryEntry[] = [
      { effectiveFrom: '2026-11-02', rules: { ...RULES, version: 2, effectiveFrom: '2026-11-02' } },
      { effectiveFrom: '2026-12-07', rules: { ...RULES, version: 3, effectiveFrom: '2026-12-07' }, note: 'season 2' },
    ];
    expect(rulesFor('2026-11-01', entries)).toBeUndefined();
    expect(rulesFor('2026-11-02', entries)).toBe(entries[0]);
    expect(rulesFor('2026-12-06', entries)).toBe(entries[0]);
    expect(rulesFor('2026-12-07', entries)).toBe(entries[1]);
    expect(entries).toHaveLength(2);
  });
});
