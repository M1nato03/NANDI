import { RULES } from '../../core/rules.config';

export type FinishActivity = 'task' | 'learn' | 'puzzle' | 'case' | 'train' | 'night';

export const finishLines: Record<FinishActivity, readonly string[]> = {
  task: ["That's done. Nicely held.", 'One thing settled.', 'You gave this your care.', 'A good piece of work.', 'You can set this down.', 'That is enough for this task.', 'You saw it through.', 'A quiet win for today.'],
  learn: ['That idea has room to settle.', 'You gave your mind a little room.', 'A good place to pause.', 'You stayed with the question.', 'That was time well spent.', 'Let the ideas rest now.', 'You learned a little more today.', 'The drop is complete.'],
  puzzle: ['The board is complete.', 'You found your way through.', 'A thoughtful finish.', 'You stayed with it.', 'The pieces came together.', 'This one is settled.', 'You made room to think.', 'A good stopping point.'],
  case: ['The case is settled.', 'You followed the clues through.', 'A careful conclusion.', 'You gave the details their due.', 'That story has its ending.', 'You made sense of it.', 'A thoughtful solve.', 'You can close this case.'],
  train: ['Your work is logged.', 'You showed up for your body.', 'A steady session, finished.', 'You can rest now.', 'That effort is enough.', 'You moved with care.', 'A good place to stop.', 'Your session is complete.'],
  night: ['The day can rest now.', 'You made it to the quiet part.', 'Enough for tonight.', 'Let the day be done.', 'Rest is yours now.', 'You can put this down.', 'A gentle close to today.', 'The night is yours.'],
};

export function pickFinishLine(activity: FinishActivity, previous?: string, random = Math.random): string {
  const pool = finishLines[activity];
  const choices = pool.filter(line => line !== previous);
  return choices[Math.floor(random() * choices.length)] ?? pool[0]!;
}

export function shouldShowDoneForToday(input: { wasComplete: boolean; isComplete: boolean; seen: boolean; afterBedtime: boolean; macroCount: number }): boolean {
  return !input.wasComplete && input.isComplete && !input.seen && !input.afterBedtime && input.macroCount < RULES.juice.macroPerDayMax;
}

export const finishEvent = 'nandi:finish';
export function announceFinish(activity: FinishActivity): void {
  window.dispatchEvent(new CustomEvent(finishEvent, { detail: activity }));
}
