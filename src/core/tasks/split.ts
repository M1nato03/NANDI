import { RULES, Rules } from '../rules.config';
import { CoreTask, createTask } from './task-machine';

export function splitTask(parent: CoreTask, numSubtasks: number, estimates: number[], rules: Rules = RULES): CoreTask[] {
    if (estimates.length !== numSubtasks) {
        throw new Error('Estimates array length must match numSubtasks');
    }

    const totalEstimate = estimates.reduce((sum, est) => sum + est, 0);
    const parentXp = parent.plannedSize === 'S' ? rules.tasks.xpBySize.S : 
                     parent.plannedSize === 'M' ? rules.tasks.xpBySize.M : 
                     rules.tasks.xpBySize.L;

    return estimates.map((est, index) => {
        const xpShare = Math.round(parentXp * (est / totalEstimate));
        
        // At postpone #3 choice sheet, splitting results in postponeCount = 2.
        // Otherwise, inherits parent postponeCount.
        let childPostponeCount = parent.postponeCount;
        if (parent.postponeCount === 3) {
             childPostponeCount = 2;
        }

        return {
            ...createTask(`${parent.id}-sub-${index}`, Date.now(), parent.size, est, {
                parentId: parent.id,
                firstScheduledDayKey: parent.firstScheduledDayKey,
                postponeCount: childPostponeCount,
                category: parent.category,
                xpShare
            })
        };
    });
}
