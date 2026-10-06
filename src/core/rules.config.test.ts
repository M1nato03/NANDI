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
    expect(RULES.tasks.clutch.shareOfSizeXp).toBe(0.25);
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
