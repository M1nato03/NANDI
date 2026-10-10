import { RULES, type Rules } from '../rules.config';
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
): number {
  let total = 0;
  let doneCount = 0;
  let clutchGiven = 0;
  let quickWinsGiven = 0;
  const seen = new Set<string>();
  for (const fact of [...facts].sort(
    (a, b) =>
      a.dayKey.localeCompare(b.dayKey) ||
      a.updatedAt - b.updatedAt ||
      a.id.localeCompare(b.id),
  )) {
    if (fact.mode !== 'tasks' || fact.kind !== 'done' || seen.has(fact.id))
      continue;
    seen.add(fact.id);
    const size = fact.inputs.plannedSize;
    const share = numberInput(fact.inputs, 'xpShare');
    const base =
      share != null && share >= 0
        ? share
        : size === 'S' || size === 'M' || size === 'L'
          ? rules.tasks.xpBySize[size]
          : undefined;
    if (base == null) continue;
    const minutes = numberInput(fact.inputs, 'createdToDoneMin');
    const quickWin =
      minutes != null &&
      minutes >= 0 &&
      minutes <= rules.tasks.quickWin.withinMin &&
      quickWinsGiven < rules.tasks.quickWin.maxPerDay;
    let xp = quickWin ? rules.tasks.quickWin.xp : base;
    if (quickWin) quickWinsGiven++;
    if (
      !quickWin &&
      fact.inputs.isFirstDay === true &&
      (numberInput(fact.inputs, 'postpones') ?? 0) === 0
    )
      xp = Math.floor(xp * rules.tasks.firstDayMultiplier);
    const postpones = numberInput(fact.inputs, 'postpones') ?? 0;
    if (
      !quickWin &&
      postpones >= rules.tasks.clutch.minPostpones &&
      clutchGiven < rules.tasks.clutch.maxPerDay
    ) {
      // A split share can be tiny. Bound Clutch by the first-day bonus it forfeited.
      const lostFirstDayBonus =
        Math.floor(base * rules.tasks.firstDayMultiplier) - base;
      xp += Math.max(
        0,
        Math.min(rules.tasks.clutch.clutchBonusXp, lostFirstDayBonus),
      );
      clutchGiven++;
    }
    if (doneCount >= rules.tasks.fullRateTasksPerDay)
      xp *= rules.tasks.overflowMultiplier;
    total += xp;
    doneCount++;
  }
  return Math.min(total, rules.tasks.dailyCap);
}

/** Quest facts are paid once per quest-week; the ledger never stores XP. */
export function calculateQuestXp(facts: LedgerRow[], rules: Rules = RULES): number {
  const seen = new Set<string>();
  for (const fact of facts) {
    if (fact.deleted || fact.mode !== 'quests' || fact.kind !== 'quest') continue;
    if (!fact.id.startsWith(`quest:${fact.refId}:`) || !/\d{4}-W\d{2}$/.test(fact.id)) continue;
    seen.add(fact.id);
  }
  return seen.size * rules.quests.sideQuestXp;
}
