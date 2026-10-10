import { RULES, type Rules } from '../rules.config';
import { isActualPostpone, type CoreTask } from './task-machine';

export type PostponeReason =
  'underestimated' | 'blocked' | 'low energy' | 'avoided it';
export type RealReason = 'class moved' | 'illness' | 'travel';
export type PostponeChoice = 'split' | 'do10' | 'someday' | 'anyway';
export interface PostponeAttempt {
  task: CoreTask;
  newStart: number | null;
  now?: number;
  firstStep?: string;
  reason?: PostponeReason;
  realReason?: RealReason;
  realReasonMovesThisWeek?: number;
  choice?: PostponeChoice;
  baselineWeek?: boolean;
}
export interface PostponeGateResult {
  ok: boolean;
  error?:
    | 'missing_date_time'
    | 'missing_first_step'
    | 'first_step_too_long'
    | 'choice_sheet_required'
    | 'reason_required'
    | 'real_reason_limit';
  action?:
    | 'postpone'
    | 'reschedule'
    | 'split'
    | 'do10'
    | 'someday'
    | 'real_reason_move';
}

export function postponeGate(
  attempt: PostponeAttempt,
  weeklyCount: number,
  rules: Rules = RULES,
): PostponeGateResult {
  const { task, newStart } = attempt;
  if (attempt.realReason) {
    if (
      (attempt.realReasonMovesThisWeek ?? 0) >=
      rules.tasks.postpone.realReasonExceptionsPerWeek
    )
      return { ok: false, error: 'real_reason_limit' };
    if (newStart == null) return { ok: false, error: 'missing_date_time' };
    return { ok: true, action: 'real_reason_move' };
  }
  if (attempt.choice === 'do10' || attempt.choice === 'someday')
    return { ok: true, action: attempt.choice };
  const counted = isActualPostpone(task, newStart, attempt.now ?? 0);
  if (!counted) return { ok: true, action: 'reschedule' };
  if (task.postponeCount + 1 >= rules.tasks.postpone.autoSomedayAt)
    return { ok: true, action: 'someday' };
  if (attempt.choice === 'split' && task.postponeCount === 2)
    return { ok: true, action: 'split' };
  if (newStart == null || !Number.isFinite(newStart))
    return { ok: false, error: 'missing_date_time' };
  const firstStep = attempt.firstStep ?? task.firstStep;
  if (
    task.postponeCount >= 1 ||
    (!attempt.baselineWeek && weeklyCount >= rules.tasks.postpone.weeklyBudget)
  ) {
    if (!firstStep?.trim()) return { ok: false, error: 'missing_first_step' };
    if (firstStep.length > rules.tasks.firstStepMaxChars)
      return { ok: false, error: 'first_step_too_long' };
  }
  if (task.postponeCount === 2) {
    if (attempt.choice !== 'anyway')
      return { ok: false, error: 'choice_sheet_required' };
    if (!attempt.reason) return { ok: false, error: 'reason_required' };
  }
  if (
    !attempt.baselineWeek &&
    weeklyCount >= rules.tasks.postpone.weeklyBudget &&
    !attempt.reason
  )
    return { ok: false, error: 'reason_required' };
  return { ok: true, action: 'postpone' };
}
