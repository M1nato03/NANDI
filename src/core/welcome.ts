/** First run (spec 18): one honest hello with an 18+ tick, one pick, bedtime, then one first action for that pick. */
export type Goal = 'sleep' | 'learn' | 'train' | 'mind' | 'plan';

export const GOALS: readonly { id: Goal; label: string }[] = [
  { id: 'sleep', label: 'Sleep earlier' },
  { id: 'learn', label: 'Learn something' },
  { id: 'train', label: 'Get fit' },
  { id: 'mind', label: 'Sharpen my mind' },
  { id: 'plan', label: 'Get things done' },
];
export const WELCOME_BEDTIME = '23:30';
/** Learn starts here, with no second topic picker: Psychology opens on habits, its best-taught idea. */
export const STARTER_TOPIC = 'psychology';

export interface FirstAction { route: string; label: string }

const ACTIONS: Record<Goal, FirstAction> = {
  learn: { route: 'learn/drop', label: 'Start your first lesson' },
  // Today's board itself, not the warm-up board.
  mind: { route: 'mind/board/daily', label: "Try today's puzzle" },
  train: { route: 'train/easy', label: 'Start an easy first workout' },
  plan: { route: 'plan', label: 'Add your first task' },
  sleep: { route: 'you/night', label: 'Plan tonight' },
};

/** After bedtime nothing new is offered (a drop would only say there is nothing tonight), so the first action is the night routine. */
export const NIGHT_ACTION: FirstAction = { route: 'night', label: 'Start my night routine' };

export function firstAction(goal: Goal | undefined, afterBedtime = false): FirstAction {
  if (afterBedtime) return NIGHT_ACTION;
  return ACTIONS[goal ?? 'learn'];
}
