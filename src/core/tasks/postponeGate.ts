import { RULES, Rules } from '../rules.config';
import { CoreTask } from './task-machine';

export type PostponeReason = 'underestimated' | 'blocked' | 'low energy' | 'avoided it' | 'real_reason';

export interface PostponeAttempt {
    task: any;
    newStart: number | null;
    firstStep?: string;
    reason?: PostponeReason;
}

export interface PostponeGateResult {
    ok: boolean;
    error?: 'missing_date_time' | 'missing_first_step' | 'first_step_too_long' | 'choice_sheet_required' | 'reason_required' | 'someday_auto';
    action?: 'postpone' | 'someday' | 'real_reason_move';
}

export function postponeGate(
    attempt: PostponeAttempt,
    weeklyPostponesCount: number,
    rules: Rules = RULES
): PostponeGateResult {
    const { task, newStart, firstStep, reason } = attempt;

    // Real reason move check
    if (reason === 'real_reason') {
        return { ok: true, action: 'real_reason_move' };
    }

    // Postpone #3 choice sheet
    if (task.postponeCount === 2) {
         if (reason) { // "Postpone anyway" requires reason
            return { ok: true, action: 'postpone' };
         } else {
            return { ok: false, error: 'choice_sheet_required' };
         }
    }

    // Postpone #4 -> Someday
    if (task.postponeCount >= 3) {
        return { ok: true, action: 'someday' };
    }

    // New date and time required for Postpone #1 and #2
    if (newStart === null) {
        return { ok: false, error: 'missing_date_time' };
    }

    // Postpone #2 -> First Step required
    if (task.postponeCount === 1) {
        if (!firstStep || firstStep.trim().length === 0) {
            return { ok: false, error: 'missing_first_step' };
        }
        if (firstStep.length > rules.tasks.firstStepMaxChars) {
            return { ok: false, error: 'first_step_too_long' };
        }
    }

    // Over budget check (6th postpone needs reason and shrink)
    if (weeklyPostponesCount >= rules.tasks.postpone.weeklyBudget) {
        if (!reason) {
            return { ok: false, error: 'reason_required' };
        }
        if (!task.firstStep && !firstStep) {
            return { ok: false, error: 'missing_first_step' }; // Shrink step if no firstStep yet
        }
    }

    return { ok: true, action: 'postpone' };
}
