import { RULES, RULES_HISTORY, rulesFor, type Rules, type RulesHistoryEntry } from '../rules.config';
import type { LedgerRow } from '../../data/types';

function numberInput(
  inputs: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = inputs[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

export function calculateTasksDayXp(
  facts: LedgerRow[],
  rules: Rules = RULES,
  history: readonly RulesHistoryEntry[] = RULES_HISTORY,
): number {
  let total = 0;
  let doneCount = 0;
  let clutchGiven = 0;
  let quickWinsGiven = 0;
  let dayRules = rules;
  const seen = new Set<string>();
  for (const fact of [...facts].sort(
    (a, b) =>
      a.dayKey.localeCompare(b.dayKey) ||
      a.updatedAt - b.updatedAt ||
      a.id.localeCompare(b.id),
  )) {
    if (fact.mode !== 'tasks' || fact.kind !== 'done' || seen.has(fact.id))
      continue;
    const effective = rules === RULES ? rulesFor(fact.dayKey, history)?.rules ?? rules : rules;
    dayRules = effective;
    seen.add(fact.id);
    const size = fact.inputs.plannedSize;
    const share = numberInput(fact.inputs, 'xpShare');
    const base =
      share != null && share >= 0
        ? share
        : size === 'S' || size === 'M' || size === 'L'
          ? effective.tasks.xpBySize[size]
          : undefined;
    if (base == null) continue;
    const minutes = numberInput(fact.inputs, 'createdToDoneMin');
    const quickWin =
      minutes != null &&
      minutes >= 0 &&
      minutes <= effective.tasks.quickWin.withinMin &&
      quickWinsGiven < effective.tasks.quickWin.maxPerDay;
    let xp = quickWin ? effective.tasks.quickWin.xp : base;
    if (quickWin) quickWinsGiven++;
    if (
      !quickWin &&
      fact.inputs.isFirstDay === true &&
      (numberInput(fact.inputs, 'postpones') ?? 0) === 0
    )
      xp = Math.floor(xp * effective.tasks.firstDayMultiplier);
    const postpones = numberInput(fact.inputs, 'postpones') ?? 0;
    if (
      !quickWin &&
      postpones >= effective.tasks.clutch.minPostpones &&
      clutchGiven < effective.tasks.clutch.maxPerDay
    ) {
      // A split share can be tiny. Bound Clutch by the first-day bonus it forfeited.
      const lostFirstDayBonus =
        Math.floor(base * effective.tasks.firstDayMultiplier) - base;
      xp += Math.max(
        0,
        Math.min(effective.tasks.clutch.clutchBonusXp, lostFirstDayBonus),
      );
      clutchGiven++;
    }
    if (doneCount >= effective.tasks.fullRateTasksPerDay)
      xp *= effective.tasks.overflowMultiplier;
    total += xp;
    doneCount++;
  }
  return Math.min(total, dayRules.tasks.dailyCap);
}

/** Quest facts are paid once per quest-week; the ledger never stores XP. */
export function calculateQuestXp(facts: LedgerRow[], rules: Rules = RULES): number {
  const seen = new Set<string>();
  let total = 0;
  for (const fact of facts) {
    if (fact.deleted || fact.mode !== 'quests' || fact.kind !== 'quest') continue;
    if (!fact.id.startsWith(`quest:${fact.refId}:`) || !/\d{4}-W\d{2}$/.test(fact.id)) continue;
    if (seen.has(fact.id)) continue;
    seen.add(fact.id);
    total += (rules === RULES ? rulesFor(fact.dayKey)?.rules ?? rules : rules).quests.sideQuestXp;
  }
  return total;
}

/** Replays one immutable award fact under the rule version effective on its day. */
export function replayFactXp(fact: LedgerRow, history: readonly RulesHistoryEntry[] = RULES_HISTORY): number {
  if (fact.deleted) return 0;
  const rules = rulesFor(fact.dayKey, history)?.rules;
  if (!rules) return 0;
  const input = fact.inputs;
  if (fact.mode === 'tasks' && fact.kind === 'done') return calculateTasksDayXp([fact], rules);
  if (fact.mode === 'quests' && fact.kind === 'quest') return rules.quests.sideQuestXp;
  if (fact.mode === 'gamify' && fact.kind === 'perfect-drop') return rules.gamify.perfectDropXp;
  if (fact.mode === 'bonuses' && fact.kind === 'lightsout') return input.metTarget === true ? rules.bonuses.lightsOutXp : 0;
  if (fact.mode === 'train') {
    if (fact.kind === 'pr') return rules.train.prXp;
    if (fact.kind === 'rest') return Number(input.minutes) >= rules.train.restDayCheckMinMinutes ? rules.train.restDayCheckXp : 0;
    if (fact.kind === 'weekly') {
      if (input.target == null) return typeof input.xp === 'number' ? input.xp : 0;
      const target = Number(input.target ?? 3);
      if (input.milestone === 2) return target === 2 ? rules.train.weeklyBonus.targetMet : rules.train.weeklyBonus.oneShort;
      if (input.milestone === 3) {
        const priorRules = typeof input.priorDayKey === 'string' ? rulesFor(input.priorDayKey, history)?.rules : undefined;
        const priorAward = priorRules ? priorRules.train.weeklyBonus.oneShort : typeof input.priorAwardXp === 'number' ? input.priorAwardXp : rules.train.weeklyBonus.oneShort;
        return Math.max(0, rules.train.weeklyBonus.targetMet - priorAward);
      }
    }
    if (fact.kind === 'session') {
      const plannedExercises = Number(input.plannedExercises);
      const touched = Number(input.touchedExercises);
      const plannedSets = Number(input.plannedSets);
      const workingSets = Number(input.workingSets);
      if (input.safety === true) return rules.train.minimumOrSafetyXp;
      if (plannedExercises > 0 && touched > 0 && plannedSets > 0) {
        if (touched === plannedExercises && workingSets === plannedExercises && plannedSets > plannedExercises) return rules.train.minimumOrSafetyXp;
        const share = workingSets / plannedSets;
        return touched === plannedExercises ? share >= 1 ? rules.train.sessionFullXp : Math.max(rules.train.sessionPartialFloorXp, Math.round(rules.train.sessionFullXp * share)) : Math.round(rules.train.sessionFullXp * share);
      }
      return typeof input.xp === 'number' ? input.xp : 0;
    }
  }
  if (fact.mode === 'mind' && input.afterBedtime !== true) {
    if (fact.kind === 'mystery') return input.result === 'revealed' ? 0 : rules.mind.mysteryXp;
    if (fact.kind === 'board') return input.daily === false ? rules.mind.sideBoardXp : rules.mind.dropBoardXp;
    if (fact.kind === 'lesson') return rules.mind.lessonXp;
    if (fact.kind === 'card') return rules.mind.cardXp;
  }
  return 0;
}

/** Fixed Shard awards are replayed from facts under the rules active on their day. */
export function replayFactShards(fact: LedgerRow, history: readonly RulesHistoryEntry[] = RULES_HISTORY): number {
  if (fact.deleted || fact.mode !== 'gamify') return 0;
  const rules = rulesFor(fact.dayKey, history)?.rules;
  if (!rules) return 0;
  if (fact.kind === 'daily-quest') return rules.gamify.dailyQuestShards;
  if (fact.kind === 'badge-tier') return rules.gamify.badgeTierShards;
  if (fact.kind === 'unit-chest') return rules.gamify.unitChestShards;
  return 0;
}
