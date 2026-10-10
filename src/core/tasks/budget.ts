import { RULES, type Rules } from '../rules.config';
import { dayKey } from '../time/dayKey';

export function postponeWeekKey(at: number, rules: Rules = RULES): string {
  const local = new Date(at);
  if (local.getHours() < rules.dayBoundaryHour)
    local.setDate(local.getDate() - 1);
  local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
  return dayKey(
    new Date(
      local.getFullYear(),
      local.getMonth(),
      local.getDate(),
      rules.dayBoundaryHour,
    ),
  );
}

export function calculateNewBudget(
  currentBudget: number,
  overrunWeeks: boolean[],
  rules: Rules = RULES,
): { newBudget: number; didRaise: boolean; lookbackAfterRaise: boolean[] } {
  let overruns = 0;
  // Look back last 'lookbackWeeks'
  const lookback = overrunWeeks.slice(
    -rules.tasks.postpone.autoRaise.lookbackWeeks,
  );

  for (const overran of lookback) {
    if (overran) overruns++;
  }

  if (overruns >= rules.tasks.postpone.autoRaise.overrunWeeksThreshold) {
    const potentialNew = currentBudget + rules.tasks.postpone.autoRaise.raiseBy;
    const newBudget = Math.min(
      potentialNew,
      rules.tasks.postpone.autoBudgetMax,
    );
    if (newBudget > currentBudget) {
      return { newBudget, didRaise: true, lookbackAfterRaise: [] };
    }
  }
  return {
    newBudget: currentBudget,
    didRaise: false,
    lookbackAfterRaise: lookback,
  };
}

export function baselineBudget(
  weeklyPostpones: number,
  rules: Rules = RULES,
): number {
  return Math.max(
    rules.tasks.postpone.autoBudgetMin,
    Math.min(
      rules.tasks.postpone.autoBudgetMax,
      Math.round(weeklyPostpones * rules.tasks.postpone.baselineFactor),
    ),
  );
}

/** Counts are chronological completed weeks since the last automatic raise. */
export function nextBudget(current: number, countsSinceRaise: number[], rules: Rules = RULES) {
  if (countsSinceRaise.length < rules.tasks.postpone.autoRaise.lookbackWeeks)
    return { budget: current, countsSinceRaise, raised: false };
  const recent = countsSinceRaise.slice(-rules.tasks.postpone.autoRaise.lookbackWeeks);
  const result = calculateNewBudget(current, recent.map((count) => count > current), rules);
  return { budget: result.newBudget, countsSinceRaise: result.didRaise ? [] : recent, raised: result.didRaise };
}
