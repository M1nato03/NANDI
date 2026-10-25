import { replayFactXp } from './economy/awards';
import { describe, expect, it } from 'vitest';
import { RULES, RULES_BOUNDS, RULES_HISTORY, rulesFor, type Rules, type RulesHistoryEntry } from './rules.config';

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
    const scoring = ['tasks', 'train', 'mind', 'bonuses', 'soft', 'quests', 'gamify', 'level', 'season', 'streak', 'shards', 'plan'] as const;
    // Keys that live beside scoring values but pay nothing (spec 19's board number, spec 04's internal case rating)
    // stay out of the fingerprint.
    const displayOnly = (key: string, value: unknown) => key === 'mind' && value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([name]) => name !== 'boardNumberEpoch' && name !== 'caseElo')) : value;
    const fingerprint = (rules: Rules) => [...JSON.stringify(scoring.map(key => [key, displayOnly(key, rules[key])]))]
      .reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16_777_619) >>> 0, 2_166_136_261).toString(16);
    // b8be6943 (24 Oct): quests.paidCustomPerWeek was added. It is no edit of a past value: it only applies from
    // economy.v4From, the day this build first runs, so no past day is rescored (item 45).
    // 7999642 (24 Oct, batch 5): shards.prices became one per-item table (the shop's and the replay's copies moved
    // here). Every price is the same number as before, so no past day is rescored (item 51 (c)).
    // 81ee9fd7 (24 Oct, spec 24 #1): plan.chhutti was added and 'plan' joined the scoring keys. Chhutti facts exist only
    // from the build that writes them, so no past day is rescored.
    // 24129226 (24 Oct, item 59): plan.chhutti.lockPasses and lockSlackMs decide when a chhutti can be measured (and so
    // paid), so they count too (Codex A item 61). Chhutti is not on main yet, so no stored day has a chhutti fact.
    // 25 Oct (item 64): Jenil chose 10 XP for a measured chhutti. The 5 Oct entry is frozen with chhutti.xp 0 and the
    // current rules (24129226) start on 25 Oct, so no day before it is rescored. cf7b07d1 is that frozen 5 Oct copy.
    // 26 Oct (spec 30): mind.chikuXp (5) was added as a new entry. The 5 and 25 Oct copies are frozen without the key, so
    // their fingerprints did not move, and Chiku facts exist only from the build that writes them.
    expect(RULES_HISTORY.map(entry => [entry.effectiveFrom, fingerprint(entry.rules)])).toEqual([['2026-10-05', 'cf7b07d1'], ['2026-10-25', '24129226'], ['2026-10-26', '40e669d9']]);
  });

  it('ends with the current rules, and the older entry differs only in what it froze', () => {
    expect(RULES_HISTORY.at(-1)).toMatchObject({ effectiveFrom: RULES.effectiveFrom, rules: RULES });
    const frozen = RULES_HISTORY[0]!.rules;
    expect({ ...frozen, version: RULES.version, effectiveFrom: RULES.effectiveFrom, plan: RULES.plan, mind: RULES.mind }).toEqual(RULES);
    expect(frozen.plan.chhutti.xp).toBe(0);
    const before = RULES_HISTORY[1]!.rules;
    expect({ ...before, version: RULES.version, effectiveFrom: RULES.effectiveFrom, mind: RULES.mind }).toEqual(RULES);
    expect('chikuXp' in before.mind).toBe(false);
    expect({ ...before.mind, chikuXp: RULES.mind.chikuXp }).toEqual(RULES.mind);
  });

  it('a measured chhutti pays 10 XP only from 25 Oct, forward-only (item 64)', () => {
    const fact = (dayKey: string, source: 'usage' | 'self') => ({ id: `chhutti:${dayKey}:w`, mode: 'tasks' as const, kind: 'chhutti', refId: `${dayKey}:w`, dayKey, inputs: { kept: true, source }, updatedAt: 1, deleted: 0 as const, deviceId: 't' });
    expect(replayFactXp(fact('2026-10-24', 'usage'))).toBe(0);
    expect(replayFactXp(fact('2026-10-25', 'usage'))).toBe(10);
    expect(replayFactXp(fact('2026-10-25', 'self'))).toBe(0);
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
  it('teaching Chiku pays 5 XP once per idea only from 26 Oct, forward-only, and nothing after bedtime (spec 30)', () => {
    const fact = (dayKey: string, afterBedtime = false) => ({ id: `chiku:habits:${dayKey}`, mode: 'mind' as const, kind: 'chiku', refId: 'habits', dayKey, inputs: { afterBedtime }, updatedAt: 1, deleted: 0 as const, deviceId: 't' });
    expect(replayFactXp(fact('2026-10-25'))).toBe(0);
    expect(replayFactXp(fact('2026-10-26'))).toBe(5);
    expect(replayFactXp(fact('2026-10-26', true))).toBe(0);
  });
});

