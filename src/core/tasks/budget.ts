import { RULES, Rules } from '../rules.config';

export function calculateNewBudget(
    currentBudget: number,
    overrunWeeks: boolean[],
    rules: Rules = RULES
): { newBudget: number, didRaise: boolean } {
    let overruns = 0;
    // Look back last 'lookbackWeeks'
    const lookback = overrunWeeks.slice(-rules.tasks.postpone.autoRaise.lookbackWeeks);
    
    for (const overran of lookback) {
        if (overran) overruns++;
    }

    if (overruns >= rules.tasks.postpone.autoRaise.overrunWeeksThreshold) {
        const potentialNew = currentBudget + rules.tasks.postpone.autoRaise.raiseBy;
        const newBudget = Math.min(potentialNew, rules.tasks.postpone.autoBudgetMax);
        if (newBudget > currentBudget) {
            return { newBudget, didRaise: true };
        }
    }
    return { newBudget: currentBudget, didRaise: false };
}
