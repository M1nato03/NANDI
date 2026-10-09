import { RULES, Rules } from '../rules.config';
import { LedgerRow } from '../../data/types';

export function calculateTasksDayXp(facts: LedgerRow[], rules: Rules = RULES): number {
  let total = 0;
  let doneCount = 0;
  let clutchGiven = 0;
  let quickWinsGiven = 0;

  for (const fact of facts) {
    if (fact.mode !== 'tasks' || fact.kind !== 'done') continue;

    const { plannedSize, isFirstDay, postpones, createdToDoneMin, xpShare } = fact.inputs as any;
    
    let base = 0;
    
    if (xpShare !== undefined) {
       base = Number(xpShare);
    } else {
      if (plannedSize === 'S') base = rules.tasks.xpBySize.S;
      else if (plannedSize === 'M') base = rules.tasks.xpBySize.M;
      else if (plannedSize === 'L') base = rules.tasks.xpBySize.L;
      else continue;
    }

    let isQuickWin = false;
    if (createdToDoneMin !== undefined && createdToDoneMin <= rules.tasks.quickWin.withinMin && quickWinsGiven < rules.tasks.quickWin.maxPerDay) {
       base = rules.tasks.quickWin.xp;
       isQuickWin = true;
       quickWinsGiven++;
    }

    let taskXp = base;

    if (isFirstDay && !isQuickWin) {
      taskXp = Math.floor(taskXp * rules.tasks.firstDayMultiplier);
    }

    if (postpones >= rules.tasks.clutch.minPostpones && clutchGiven < rules.tasks.clutch.maxPerDay && !isQuickWin) {
       taskXp += rules.tasks.clutch.clutchBonusXp;
       clutchGiven++;
    }

    if (doneCount >= rules.tasks.fullRateTasksPerDay) {
      taskXp *= rules.tasks.overflowMultiplier;
    }

    total += taskXp;
    doneCount++;
  }

  return Math.min(total, rules.tasks.dailyCap);
}
