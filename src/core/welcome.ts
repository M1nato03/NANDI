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
  // Spec 33: Learn something opens Read, straight into the first chapter of the first book (spec 18's quick first win).
  learn: { route: 'read/chapter/psychology/psychology-ch1', label: 'Start your first chapter' },
  // Today's board itself, not the warm-up board.
  mind: { route: 'yatra/mind/board/daily', label: 'Try today’s puzzle' },
  train: { route: 'yatra/train/easy', label: 'Start an easy first workout' },
  plan: { route: 'plan', label: 'Add your first task' },
  sleep: { route: 'you/tonight', label: 'Plan tonight' },
};

/** After bedtime nothing new is offered (a drop would only say there is nothing tonight), so the first action is the night routine. */
export const NIGHT_ACTION: FirstAction = { route: 'night', label: 'Start my night routine' };

export function firstAction(goal: Goal | undefined, afterBedtime = false): FirstAction {
  if (afterBedtime) return NIGHT_ACTION;
  return ACTIONS[goal ?? 'learn'];
}

/**
 * Spec 52: how many things NANDI offers at first. 'two' is the default; 'more' allows up to 4; 'all' is every area.
 * The size picks what NANDI offers (the next move, the pause card's in-app button, the today dots, its own nudges);
 * nothing is ever hidden or locked.
 */
export type PickSize = 'two' | 'more' | 'all';
export const PICK_LIMIT: Record<PickSize, number> = { two: 2, more: 4, all: GOALS.length };
export const PICKS_KEY = { goals: 'profile.goals', size: 'profile.size' } as const;
export interface Picks { goals: Goal[]; size: PickSize }
export const ALL_PICKS: Picks = { goals: GOALS.map(goal => goal.id), size: 'all' };

const isGoal = (value: unknown): value is Goal => GOALS.some(goal => goal.id === value);
/**
 * The person's picks, in tap order. An install from before spec 52 has no size and reads as 'all', so nothing
 * changes for it until the person chooses in You; a size with no valid pick also reads as 'all'.
 */
export function readPicks(settings: readonly { key: string; value: unknown; deleted?: number }[]): Picks {
  const value = (key: string) => settings.find(row => row.key === key && !row.deleted)?.value;
  const size = value(PICKS_KEY.size);
  if (size !== 'two' && size !== 'more') return ALL_PICKS;
  const stored = value(PICKS_KEY.goals);
  const goals = [...new Set(Array.isArray(stored) ? stored.filter(isGoal) : [])].slice(0, PICK_LIMIT[size]);
  return goals.length ? { goals, size } : ALL_PICKS;
}
export const picks = (state: Picks, area: Goal) => state.size === 'all' || state.goals.includes(area);
