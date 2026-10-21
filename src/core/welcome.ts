/** First run (audit 10-21): three short screens, then one first action that matches what the person picked. */
export type Goal = 'sleep' | 'learn' | 'train' | 'mind' | 'plan';

export const GOALS: readonly { id: Goal; label: string }[] = [
  { id: 'sleep', label: 'Sleep earlier' },
  { id: 'learn', label: 'Learn something' },
  { id: 'train', label: 'Get fit' },
  { id: 'mind', label: 'Sharpen my mind' },
  { id: 'plan', label: 'Get things done' },
];
export const MAX_GOALS = 2;
export const WELCOME_BEDTIME = '23:30';

export interface FirstAction { route: string; label: string }

// Quickest finish first: a 2-minute drop beats a board, a board beats setting up training.
const ACTIONS: Record<Goal, FirstAction> = {
  learn: { route: 'learn/drop', label: 'Start a 2-minute drop' },
  mind: { route: 'mind/board', label: "Try today's puzzle" },
  train: { route: 'train', label: 'Set up training' },
  plan: { route: 'plan', label: 'Add your first task' },
  sleep: { route: 'you/night', label: 'Plan tonight' },
};
const ORDER: readonly Goal[] = ['learn', 'mind', 'train', 'plan', 'sleep'];

/** After bedtime nothing new is offered (a drop would only say there is nothing tonight), so the first action is the night routine. */
export const NIGHT_ACTION: FirstAction = { route: 'night', label: 'Start my night routine' };

export function firstAction(goals: readonly Goal[], afterBedtime = false): FirstAction {
  if (afterBedtime) return NIGHT_ACTION;
  const pick = ORDER.find(goal => goals.includes(goal));
  return ACTIONS[pick ?? 'learn'];
}

/** Tapping a goal adds it; a third pick replaces the oldest, so the person never hits a wall. */
export function toggleGoal(goals: readonly Goal[], goal: Goal): Goal[] {
  if (goals.includes(goal)) return goals.filter(value => value !== goal);
  return [...goals, goal].slice(-MAX_GOALS);
}
